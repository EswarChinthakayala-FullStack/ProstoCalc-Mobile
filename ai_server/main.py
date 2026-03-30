import os
# Optimize MPS memory usage BEFORE importing torch
# 0.0 disables the upper limit, allowing for larger allocations on memory-constrained systems
os.environ["PYTORCH_MPS_HIGH_WATERMARK_RATIO"] = "0.0"
os.environ["PYTORCH_MPS_LOW_WATERMARK_RATIO"] = "0.0"

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import pipeline, AutoModelForCausalLM, AutoTokenizer
import torch
import uvicorn
import time
import gc
import json
import hashlib

# Directory for caching responses and the model itself
CACHE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "model_cache")
os.makedirs(CACHE_DIR, exist_ok=True)

# Point ALL HuggingFace cache to our local directory so user knows where space is used
os.environ["HF_HOME"] = CACHE_DIR
os.environ["HUGGINGFACE_HUB_CACHE"] = CACHE_DIR
os.environ["TRANSFORMERS_CACHE"] = CACHE_DIR

CACHE_FILE = os.path.join(CACHE_DIR, "response_cache.json")

def load_cache():
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, "r") as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_cache(cache):
    try:
        with open(CACHE_FILE, "w") as f:
            json.dump(cache, f)
    except:
        pass

response_cache = load_cache()

app = FastAPI(title="ProstoCalc AI Engine")

# Using TinyLlama (as requested): ~600MB-1GB depending on precision/sharding
model_id = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"

def get_best_device():
    if torch.backends.mps.is_available():
        return "mps"
    elif torch.cuda.is_available():
        return "cuda"
    return "cpu"

device_name = get_best_device()

def load_pipeline(target_device):
    global pipe
    # Clear memory from any previous load attempts
    if 'pipe' in globals():
        del pipe
    if torch.backends.mps.is_available():
        torch.mps.empty_cache()
    gc.collect()

    print(f"[*] Loading model {model_id} on {target_device}...")
    try:
        # float16 is optimal for MPS
        dtype = torch.float16 if target_device == "mps" else torch.bfloat16 if (target_device == "cuda" and torch.cuda.is_bf16_supported()) else torch.float32
        
        pipe = pipeline(
            "text-generation", 
            model=model_id, 
            dtype=dtype, 
            device=target_device,
            model_kwargs={
                "low_cpu_mem_usage": True,
                "attn_implementation": "sdpa" # Use memory-efficient attention (Scaled Dot Product Attention)
            }
        )
            
        print(f"[*] Model loaded on {target_device}. Running warmup...")
        # Small warmup
        pipe("Health check", max_new_tokens=5, pad_token_id=pipe.tokenizer.eos_token_id)
        return pipe
    except Exception as e:
        print(f"[!] Target {target_device} failed: {e}")
        if target_device != "cpu":
            print("[!] Falling back to CPU...")
            return load_pipeline("cpu")
        raise e

pipe = load_pipeline(device_name)

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str | None = None
    messages: list[Message] | None = None
    system_prompt: str = "Status: ProstoAI (Clinical Dental Specialist). STRICTLY DENTAL ONLY."

@app.post("/ai/chat")
async def ai_chat(request: ChatRequest):
    global pipe
    t0 = time.time()
    try:
        # Construct chat messages
        messages = [{"role": "system", "content": request.system_prompt}]
        if request.messages:
            messages.extend([{"role": m.role, "content": m.content} for m in request.messages])
        if request.message:
            messages.append({"role": "user", "content": request.message})

        # Use tokenizer chat template for better formatting
        prompt = pipe.tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        # Cap input length to prevent explosive memory allocation
        if len(prompt) > 8000:
             prompt = prompt[-8000:]
             
        # Check cache first
        cache_key = hashlib.md5(json.dumps(messages, sort_keys=True).encode()).hexdigest()
        if cache_key in response_cache:
            print(f"[*] Serving from cache (key: {cache_key})")
            return {
                "success": True, 
                "response": response_cache[cache_key], 
                "cached": True,
                "latency_sec": 0
            }

        print(f"[*] Request received. Tokens ~ {len(prompt)//4}. Model: {model_id}. Device: {pipe.device}")
        
        try:
            with torch.inference_mode():
                outputs = pipe(
                    prompt, 
                    max_new_tokens=400, # Reduced slightly to save memory
                    do_sample=True, 
                    temperature=0.3,
                    top_k=40, 
                    top_p=0.9,
                    repetition_penalty=1.1,
                    pad_token_id=pipe.tokenizer.eos_token_id,
                    eos_token_id=pipe.tokenizer.eos_token_id
                )
        except RuntimeError as e:
            # Handle MPS/GPU OOM
            if ("out of memory" in str(e).lower() or "MPS" in str(e)) and pipe.device.type != "cpu":
                print("[!!!] GPU/MPS OOM detected. Clearing cache and switching to CPU...")
                # Clear MPS cache first!
                torch.mps.empty_cache()
                pipe = load_pipeline("cpu")
                prompt = pipe.tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
                # Retry once on CPU
                with torch.inference_mode():
                    outputs = pipe(
                        prompt, 
                        max_new_tokens=300, 
                        do_sample=True, 
                        temperature=0.3,
                        pad_token_id=pipe.tokenizer.eos_token_id,
                        eos_token_id=pipe.tokenizer.eos_token_id
                    )
            else:
                raise e
        
        # Proper extraction for modern Chat templates
        generated = outputs[0]["generated_text"]
        response = generated[len(prompt):].strip()

        # Update cache
        response_cache[cache_key] = response
        save_cache(response_cache)

        # Cleanup
        if pipe.device.type == "mps":
            torch.mps.empty_cache()
        gc.collect()

        elapsed = time.time() - t0
        print(f"[*] Response ready in {elapsed:.2f}s")
        return {
            "success": True, 
            "response": response, 
            "device": str(pipe.device),
            "model": model_id,
            "latency_sec": round(elapsed, 2)
        }
        
    except Exception as e:
        print(f"[ERROR] Engine Failure: {str(e)}")
        return {"success": False, "error": str(e), "response": "ProstoAI is refreshing its circuits. Please try again!"}

@app.get("/health")
async def health():
    return {"status": "ok", "device": str(pipe.device)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
