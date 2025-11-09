# import os
# import time
# import logging
# from datasets import load_dataset
# from transformers import (
#     AutoModelForCausalLM,
#     AutoTokenizer,
#     Trainer,
#     TrainingArguments,
# )
# from peft import LoraConfig, get_peft_model

# logging.basicConfig(
#     format="%(asctime)s [%(levelname)s] %(message)s",
#     level=logging.INFO,
# )
# logger = logging.getLogger(__name__)

# BASE_MODEL = os.getenv("BASE_MODEL", "microsoft/phi-3-mini-4k-instruct")
# DATA_FILE = "backend/learningq_train_instruct.jsonl"
# OUTPUT_DIR = "outputs/phi3-learningq"

# def build_prompt(example: dict) -> str:
#     return (
#         "You are an educational question generator.\n"
#         "Write ONE clear, student-friendly question based only on the passage.\n\n"
#         f"Passage:\n{example['input']}\n\nQuestion:"
#     )

# def main():
#     start = time.time()
#     logger.info("Starting training for Phi-3 (fixed causal style)")
#     logger.info(f"Base model: {BASE_MODEL}")
#     logger.info(f"Data file: {DATA_FILE}")

#     # 1) load
#     ds = load_dataset("json", data_files=DATA_FILE, split="train")
#     logger.info(f"Loaded {len(ds)} examples")

#     # 2) add prompt + target
#     def add_prompt(ex):
#         prompt = build_prompt(ex)
#         answer = ex["output"]
#         return {
#             "prompt": prompt,
#             "answer": answer,
#         }

#     ds = ds.map(add_prompt)

#     # 3) tokenizer/model
#     tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)
#     if tokenizer.pad_token is None:
#         tokenizer.pad_token = tokenizer.eos_token

#     max_length = 512  # keep it reasonable for Mac

#     def tokenize_fn(ex):
#         prompt_ids = tokenizer(ex["prompt"], add_special_tokens=False)["input_ids"]
#         answer_ids = tokenizer(ex["answer"], add_special_tokens=False)["input_ids"]

#         # build full sequence: prompt + answer + eos
#         input_ids = prompt_ids + answer_ids + [tokenizer.eos_token_id]

#         # truncate if too long
#         input_ids = input_ids[:max_length]

#         # build labels: ignore prompt part
#         labels = [-100] * len(prompt_ids) + answer_ids + [tokenizer.eos_token_id]
#         labels = labels[:max_length]

#         # pad to max_length
#         attention_mask = [1] * len(input_ids)
#         pad_len = max_length - len(input_ids)
#         if pad_len > 0:
#             input_ids = input_ids + [tokenizer.pad_token_id] * pad_len
#             attention_mask = attention_mask + [0] * pad_len
#             labels = labels + [-100] * pad_len

#         return {
#             "input_ids": input_ids,
#             "attention_mask": attention_mask,
#             "labels": labels,
#         }

#     logger.info("Tokenizing dataset (causal style)...")
#     tokenized = ds.map(tokenize_fn, batched=False, remove_columns=ds.column_names)
#     logger.info("Tokenization complete.")

#     logger.info("Loading base model...")
#     model = AutoModelForCausalLM.from_pretrained(
#         BASE_MODEL,
#         device_map="auto",
#         torch_dtype="auto",
#     )

#     lora_config = LoraConfig(
#         r=16,
#         lora_alpha=32,
#         target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
#         lora_dropout=0.05,
#         bias="none",
#         task_type="CAUSAL_LM",
#     )
#     model = get_peft_model(model, lora_config)
#     logger.info("LoRA attached.")

#     args = TrainingArguments(
#         output_dir=OUTPUT_DIR,
#         per_device_train_batch_size=1,
#         gradient_accumulation_steps=8,
#         num_train_epochs=1,
#         learning_rate=2e-4,
#         logging_steps=20,
#         save_steps=200,
#         save_total_limit=2,
#         fp16=False,
#         bf16=False,
#         report_to="none",
#     )

#     trainer = Trainer(
#         model=model,
#         args=args,
#         train_dataset=tokenized,
#     )

#     logger.info("Starting training loop...")
#     trainer.train()

#     logger.info("Saving model...")
#     model.save_pretrained(OUTPUT_DIR)
#     tokenizer.save_pretrained(OUTPUT_DIR)

#     logger.info(f"Done in {(time.time() - start)/60:.2f} minutes. Saved to {OUTPUT_DIR}")

# if __name__ == "__main__":
#     main()



import os
import time
import logging
from datasets import load_dataset
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    Trainer,
    TrainingArguments,
)
from peft import LoraConfig, get_peft_model

logging.basicConfig(
    format="%(asctime)s [%(levelname)s] %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

BASE_MODEL = os.getenv("BASE_MODEL", "microsoft/phi-3-mini-4k-instruct")
DATA_FILE = "backend/learningq_train_instruct.jsonl"
OUTPUT_DIR = "outputs/phi3-learningq"

def build_prompt(example: dict) -> str:
    return (
        "You are an educational question generator.\n"
        "Write ONE clear, student-friendly question based only on the passage.\n\n"
        f"Passage:\n{example['input']}\n\nQuestion:"
    )

def main():
    start = time.time()
    logger.info("Starting training (DEV MODE, small slice)")
    logger.info(f"Base model: {BASE_MODEL}")

    # 1) only first 2000 rows
    ds = load_dataset("json", data_files=DATA_FILE, split="train[:2000]")
    logger.info(f"Loaded {len(ds)} examples")

    def add_prompt(ex):
        prompt = build_prompt(ex)
        answer = ex["output"]
        return {"prompt": prompt, "answer": answer}

    ds = ds.map(add_prompt)

    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    max_length = 256  # shorter for laptop

    def tokenize_fn(ex):
        prompt_ids = tokenizer(ex["prompt"], add_special_tokens=False)["input_ids"]
        answer_ids = tokenizer(ex["answer"], add_special_tokens=False)["input_ids"]

        input_ids = prompt_ids + answer_ids + [tokenizer.eos_token_id]
        input_ids = input_ids[:max_length]

        labels = [-100] * len(prompt_ids) + answer_ids + [tokenizer.eos_token_id]
        labels = labels[:max_length]

        attention_mask = [1] * len(input_ids)
        pad_len = max_length - len(input_ids)
        if pad_len > 0:
            input_ids += [tokenizer.pad_token_id] * pad_len
            attention_mask += [0] * pad_len
            labels += [-100] * pad_len

        return {
            "input_ids": input_ids,
            "attention_mask": attention_mask,
            "labels": labels,
        }

    logger.info("Tokenizing...")
    tokenized = ds.map(tokenize_fn, batched=False, remove_columns=ds.column_names)
    logger.info("Tokenization complete.")

    logger.info("Loading base model...")
    model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL,
        device_map="auto",
        torch_dtype="auto",
    )

    lora_config = LoraConfig(
        r=16,
        lora_alpha=32,
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM",
    )
    model = get_peft_model(model, lora_config)

    args = TrainingArguments(
        output_dir=OUTPUT_DIR,
        per_device_train_batch_size=1,
        gradient_accumulation_steps=1,   # <-- make it fast
        num_train_epochs=1,
        learning_rate=2e-4,
        logging_steps=10,
        save_steps=5000,                 # don't save every minute
        save_total_limit=1,
        fp16=False,
        bf16=False,
        report_to="none",
    )

    trainer = Trainer(
        model=model,
        args=args,
        train_dataset=tokenized,
    )

    logger.info("Training...")
    trainer.train()

    logger.info("Saving...")
    model.save_pretrained(OUTPUT_DIR)
    tokenizer.save_pretrained(OUTPUT_DIR)

    logger.info(f"Done in {(time.time() - start)/60:.2f} minutes")

if __name__ == "__main__":
    main()
