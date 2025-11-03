import json
from pathlib import Path

DATA_ROOT = Path("data/data/experiments/khan")

para_path = DATA_ROOT / "para-train.txt"
tgt_path = DATA_ROOT / "tgt-train.txt"

OUT_DIR = Path("backend/")
OUT_DIR.mkdir(parents=True, exist_ok=True)
out_path = OUT_DIR / "learningq_train.jsonl"

def clean_text(text: str) -> str:
    # basic cleanup so prompts look nicer
    return text.strip().replace("\t", " ").replace("\r", " ")

def main():
    with para_path.open("r", encoding="utf-8") as f_para, \
         tgt_path.open("r", encoding="utf-8") as f_tgt, \
         out_path.open("w", encoding="utf-8") as f_out:

        for idx, (para_line, tgt_line) in enumerate(zip(f_para, f_tgt), start=1):
            context = clean_text(para_line)
            question = clean_text(tgt_line)

            # skip empty lines just in case
            if not context or not question:
                continue

            # this format is good for OPENAI fine-tune style later
            obj = {
                "id": f"learningq_train_{idx}",
                "context": context,
                "question": question,
                "source": "learningq",
                "split": "train"
            }

            f_out.write(json.dumps(obj, ensure_ascii=False) + "\n")

    print(f"Done. Wrote JSONL to {out_path}")

if __name__ == "__main__":
    main()
