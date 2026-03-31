# 🧠 AI & Machine Learning Documentation

> **Stack:** Python + HuggingFace Transformers + FastAPI  
> **Path:** `ai_server/`

---

## 🚀 How to Run

```bash
cd ai_server
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

---

## 📁 Structure

```
ai_server/
├── main.py                        # HTTP server entry point
├── requirements.txt               # Python dependencies
├── test_server.py                 # Server tests
├── ai_server.log                  # Runtime logs
├── model_cache/                   # Cached model weights
├── venv/                          # Python virtual environment
└── llm/
    ├── tinyllama_engine.py        # TinyLlama inference engine
    ├── triage_engine.py           # Clinical triage logic
    ├── triage_engine_llm.py       # LLM-enhanced triage
    ├── demo_llm.py                # Demo/testing scripts
    └── tests/                     # Unit tests
```

---

## 🧠 AI Engines

### 1. TinyLlama Engine (`tinyllama_engine.py`)
- Loads **TinyLlama** or **SmolLM2** model via HuggingFace Transformers
- Optimized for 8GB RAM environments (Mac Mini M-series)
- Uses MPS (Metal Performance Shaders) for GPU acceleration
- Generates clinical justifications from structured prompts
- Model caching to prevent redundant loads

### 2. Triage Engine (`triage_engine.py`)
- Rule-based clinical triage analysis
- Calculates Dental Health Score (0–100)
- Evaluates treatment urgency and complexity
- Risk assessment based on patient data

### 3. LLM-Enhanced Triage (`triage_engine_llm.py`)
- Combines triage logic with LLM narrative generation
- Produces human-readable clinical reports
- Addresses patient by name with personalized recommendations

---

## 🔗 Integration Points

The AI server is called by:

1. **Backend (`server/routes/ai_proxy.js`)** — Proxies requests to the Python AI server
2. **Backend (`server/routes/treatment.js`)** — Uses `chatWithAI()` for cost justifications
3. **iOS App (`ProstoCalc/AI/NanobotService.swift`)** — Direct API calls for on-device fallback

---

## ⚡ Memory Optimization

The server is configured for resource-constrained environments:
- Model quantization (4-bit/8-bit) to reduce memory footprint
- Lazy loading — model only loads on first request
- Single-instance caching to prevent duplicate model loads
- MPS backend watchdog to detect memory allocation failures
