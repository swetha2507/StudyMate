from backend.models.generator import _ensure  # this loads model + tokenizer from configs/dev.yaml

# System prompt — you can tweak the style here
SYS = (
    "You are an educational question generator. "
    "Write ONE clear, student-friendly question based only on the passage. "
    "Avoid yes/no questions."
)

# Template used for generation
TEMPLATE = """Passage:
{passage}

Question:"""

def generate_question(passage: str, max_new_tokens=64) -> str:
    tok, mdl, cfg = _ensure()  # loads your fine-tuned model + tokenizer
    messages = [
        {"role": "system", "content": SYS},
        {"role": "user", "content": TEMPLATE.format(passage=passage.strip())},
    ]

    # Convert to tokens
    text = tok.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    ins = tok(text, return_tensors="pt")
    ins = {k: v.to(mdl.device) for k, v in ins.items()}

    # Generate question
    out = mdl.generate(
        **ins,
        max_new_tokens=max_new_tokens,
        do_sample=False,
        temperature=None,
        eos_token_id=tok.eos_token_id,
        pad_token_id=tok.eos_token_id,
    )

    # Decode output
    gen = tok.decode(out[0][ins["input_ids"].shape[1]:], skip_special_tokens=True).strip()
    return gen.split("\n")[0].strip()
