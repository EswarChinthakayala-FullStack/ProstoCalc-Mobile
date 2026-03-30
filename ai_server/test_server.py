import requests
import json
import time

def test_ai():
    url = "http://localhost:8000/ai/chat"
    payload = {
        "message": "Hello, explain briefly what is a dental cavity in 2 sentences.",
        "system_prompt": "Status: ProstoAI (Clinical Dental Specialist). STRICTLY DENTAL ONLY."
    }
    
    print(f"[*] Sending test request to {url}...")
    try:
        t0 = time.time()
        response = requests.post(url, json=payload, timeout=60)
        elapsed = time.time() - t0
        
        if response.status_code == 200:
            print(f"[*] Success! Response time: {elapsed:.2f}s")
            print(f"[*] Response: {response.json().get('response')}")
            if response.json().get('cached'):
                print("[*] Cache Hit confirmed.")
        else:
            print(f"[!] Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"[!] Failed to connect to AI server: {e}")

if __name__ == "__main__":
    test_ai()
