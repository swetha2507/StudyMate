import yaml
_cfg = yaml.safe_load(open("backend/configs/dev.yaml"))

def answer_guard(state):
    support = state.get("sentences_support", [])
    # If we didn’t compute support for some reason, return raw output.
    if not support:
        return {**state, "final_answer": state.get("model_output",""), "refusal": False}

    # Build answer with citations when available; otherwise keep the sentence.
    lines=[]
    for s in support:
        cites = "".join(f"[{pid}]" for pid in s.get("support_ids", [])[:2])
        sent = s["sentence"].rstrip(".")
        lines.append(sent + ("." if not sent.endswith(".") else "") + (f" {cites}" if cites else ""))

    return {**state, "final_answer": " ".join(lines), "refusal": False}
