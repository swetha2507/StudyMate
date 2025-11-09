import json
from pathlib import Path

# 1. where your LearningQ files are
DATA_ROOT = Path("data/data/experiments/khan")

# adjust these if your names are a bit different
para_path = DATA_ROOT / "para-train.txt"
tgt_path = DATA_ROOT / "tgt-train.txt"

# 2. where to write outputs
OUT_DIR = Path("backend/")
OUT_DIR.mkdir(parents=True, exist_ok=True)

raw_out_path = OUT_DIR / "learningq_train.jsonl"
instruct_out_path = OUT_DIR / "learningq_train_instruct.jsonl"

def clean_text(text: str) -> str:
    return text.strip().replace("\t", " ").replace("\r", " ")

def main():
    raw_count = 0
    instruct_count = 0

    with para_path.open("r", encoding="utf-8") as f_para, \
         tgt_path.open("r", encoding="utf-8") as f_tgt, \
         raw_out_path.open("w", encoding="utf-8") as f_raw, \
         instruct_out_path.open("w", encoding="utf-8") as f_instr:

        for idx, (para_line, tgt_line) in enumerate(zip(f_para, f_tgt), start=1):
            context = clean_text(para_line)
            question = clean_text(tgt_line)

            if not context or not question:
                continue

            # -------- 1) RAW LINE --------
            raw_obj = {
                "id": f"learningq_train_{idx}",
                "context": context,
                "question": question,
                "source": "learningq",
                "split": "train"
            }
            f_raw.write(json.dumps(raw_obj, ensure_ascii=False) + "\n")
            raw_count += 1

            # -------- 2) INSTRUCTION LINE --------
            instruct_obj = {
                "instruction": "Write ONE student-friendly question based only on the passage.",
                "input": context,
                "output": question
            }
            f_instr.write(json.dumps(instruct_obj, ensure_ascii=False) + "\n")
            instruct_count += 1

    print(f"Done. Wrote {raw_count} raw examples to {raw_out_path}")
    print(f"Done. Wrote {instruct_count} instruct examples to {instruct_out_path}")

if __name__ == "__main__":
    main()
