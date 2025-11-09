# merge_adapter.py
import os
from transformers import AutoTokenizer
from peft import AutoPeftModelForCausalLM

ADAPTER_DIR = "outputs/phi3-learningq/lora"
MERGED_DIR  = "outputs/phi3-learningq/merged"
BASE_MODEL  = "microsoft/phi-3-mini-4k-instruct"  # only used for tokenizer fallback

os.makedirs(MERGED_DIR, exist_ok=True)

print("Loading adapter on CPU with no offload…")
peft_model = AutoPeftModelForCausalLM.from_pretrained(
    ADAPTER_DIR,
    device_map=None,            # IMPORTANT: avoid accelerate offload/meta
    torch_dtype="float32",      # CPU-friendly
    low_cpu_mem_usage=False     # fully materialize weights
)

print("Merging…")
merged = peft_model.merge_and_unload()

print("Saving merged model…")
merged.save_pretrained(MERGED_DIR, safe_serialization=True)

# Save a compatible tokenizer
try:
    tok = AutoTokenizer.from_pretrained(ADAPTER_DIR, use_fast=True)
except Exception:
    tok = AutoTokenizer.from_pretrained(BASE_MODEL, use_fast=True)
if tok.pad_token is None:
    tok.pad_token = tok.eos_token
tok.save_pretrained(MERGED_DIR)

print(f"Done. Merged at: {MERGED_DIR}")
