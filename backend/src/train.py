import os, time, logging
from typing import Dict
import torch
from datasets import load_dataset
from transformers import (AutoTokenizer, Trainer, TrainingArguments)
from peft import AutoPeftModelForCausalLM

# Try bitsandbytes if available + CUDA
USE_4BIT = False
BitsAndBytesConfig = None
if torch.cuda.is_available():
    try:
        from transformers import BitsAndBytesConfig  # available even if bnb missing
        import bitsandbytes as bnb  # noqa: F401
        USE_4BIT = True
    except Exception:
        USE_4BIT = False

logging.basicConfig(format="%(asctime)s [%(levelname)s] %(message)s", level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_MODEL = os.getenv("BASE_MODEL", "microsoft/phi-3-mini-4k-instruct")
DATA_FILE = os.getenv("DATA_FILE", "backend/learningq_train_instruct.jsonl")
OUT_DIR = os.getenv("OUT_DIR", "outputs/phi3-learningq")
ADAPTER_DIR = os.path.join(OUT_DIR, "lora")
MERGED_DIR = os.path.join(OUT_DIR, "merged")
MAX_LEN = int(os.getenv("MAX_LEN", "512"))
SLICE = os.getenv("SLICE", "train[:2000]")

from peft import LoraConfig, get_peft_model, PeftModel

def build_prompt(example: Dict) -> str:
    return (
        "You are an educational question generator.\n"
        "Write ONE clear, student-friendly question based only on the passage.\n\n"
        f"Passage:\n{example['input']}\n\nQuestion:"
    )

def main():
    start = time.time()
    logger.info(f"CUDA available: {torch.cuda.is_available()}; 4-bit enabled: {USE_4BIT}")

    ds = load_dataset("json", data_files=DATA_FILE, split=SLICE)
    ds = ds.map(lambda ex: {"prompt": build_prompt(ex), "answer": ex["output"]})

    tok = AutoTokenizer.from_pretrained(BASE_MODEL, use_fast=True)
    if tok.pad_token is None:
        tok.pad_token = tok.eos_token
    tok.padding_side = "right"
    tok.truncation_side = "left"

    MIN_ANSWER_FRACTION = 0.4  # keep at least 40% of the window for the answer

    def tokenize_fn(ex):
        # 1) Tokenize separately
        p_ids = tok(ex["prompt"], add_special_tokens=False)["input_ids"]
        a_ids = tok(ex["answer"], add_special_tokens=False)["input_ids"]

        # 2) Reserve budget for the answer (+1 for EOS)
        min_ans_tokens = max(1, int(MAX_LEN * MIN_ANSWER_FRACTION))
        min_ans_tokens = min(min_ans_tokens, len(a_ids))  # can't reserve more than we have
        budget_for_prompt = MAX_LEN - (min_ans_tokens + 1)

        # 3) Trim the prompt FIRST (keep the tail, which is most relevant to the answer)
        if len(p_ids) > budget_for_prompt:
            p_ids = p_ids[-budget_for_prompt:]

        # 4) Now fit as much answer as possible in the remaining space
        remaining = MAX_LEN - (len(p_ids) + 1)  # +1 for EOS
        a_ids = a_ids[:max(0, remaining)]

        # 5) Build final sequences
        input_ids = p_ids + a_ids + [tok.eos_token_id]
        labels    = [-100] * len(p_ids) + a_ids + [tok.eos_token_id]
        attention = [1] * len(input_ids)

        # 6) Pad to MAX_LEN
        pad = MAX_LEN - len(input_ids)
        if pad > 0:
            input_ids += [tok.pad_token_id] * pad
            attention += [0] * pad
            labels    += [-100] * pad

        return {
            "input_ids": input_ids,
            "attention_mask": attention,
            "labels": labels,
        }

    tokenized = ds.map(tokenize_fn, batched=False, remove_columns=ds.column_names)
    sample = tokenized[0]
    print("Supervised (labels != -100):", sum(1 for t in sample["labels"] if t != -100))

    quant_config = None
    if USE_4BIT and BitsAndBytesConfig is not None:
        quant_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_use_double_quant=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.bfloat16
        )

    logger.info("Loading base model…")
    model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL,
        device_map="auto",
        torch_dtype=torch.bfloat16 if torch.cuda.is_available() else "auto",
        quantization_config=quant_config,
    )

    lora_cfg = LoraConfig(
        r=16, lora_alpha=32, lora_dropout=0.05, bias="none",
        task_type="CAUSAL_LM",
        target_modules=["q_proj","k_proj","v_proj","o_proj"],
    )
    model = get_peft_model(model, lora_cfg)

    args = TrainingArguments(
        output_dir=ADAPTER_DIR,
        per_device_train_batch_size=1,
        gradient_accumulation_steps=2,
        num_train_epochs=1,
        learning_rate=2e-4,
        logging_steps=10,
        save_steps=500,
        save_total_limit=2,
        bf16=torch.cuda.is_available(),
        fp16=False,
        report_to="none",
        optim="paged_adamw_32bit" if USE_4BIT else "adamw_torch",
        remove_unused_columns=False,
    )

    trainer = Trainer(model=model, args=args, train_dataset=tokenized)
    logger.info("Training…"); trainer.train()

    logger.info("Saving LoRA adapter…")
    os.makedirs(ADAPTER_DIR, exist_ok=True)
    model.save_pretrained(ADAPTER_DIR); tok.save_pretrained(ADAPTER_DIR)

    # Merge to a single folder for RAG inference
    logger.info("Merging LoRA into base")
    # Load the adapter; PEFT reads base_model_name_or_path from adapter_config.json
    peft_model = AutoPeftModelForCausalLM.from_pretrained(
        ADAPTER_DIR,
        torch_dtype=torch.float32,
        device_map=None,
        low_cpu_mem_usage=False
    ).to("cpu")

    merged = peft_model.merge_and_unload()

    os.makedirs(MERGED_DIR, exist_ok=True)
    merged.save_pretrained(MERGED_DIR, safe_serialization=True)

    # Prefer tokenizer from BASE (or ADAPTER_DIR if you saved a tokenizer there)
    tok = AutoTokenizer.from_pretrained(BASE_MODEL, use_fast=True)
    if tok.pad_token is None:
        tok.pad_token = tok.eos_token
    tok.save_pretrained(MERGED_DIR)

    logger.info(f"Merged model saved to: {MERGED_DIR}")
    logger.info(f"Total time: {(time.time()-start)/60:.2f} min")

if __name__ == "__main__":
    main()
