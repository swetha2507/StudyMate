import os, yaml, torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from openai import OpenAI
from dotenv import load_dotenv
load_dotenv()

_cache = {"tok": None, "mdl": None, "cfg": None}

client = OpenAI(api_key=os.getenv("OPEN_API_KEY"))

def _cfg():
    return yaml.safe_load(open(os.getenv("RAG_CONFIG","backend/configs/dev.yaml")))

def _device_kwargs():
    # Mac MPS friendly
    if torch.backends.mps.is_available():
        return {"device_map": {"": "mps"}, "torch_dtype": torch.float32}
    if torch.cuda.is_available():
        return {"device_map": "auto", "torch_dtype": torch.bfloat16}
    return {"device_map": "auto", "torch_dtype": "auto"}

def _ensure():
    cfg = _cfg(); mp = cfg["generator"]["model_path"]
    if _cache["mdl"] is None or _cache["cfg"] != mp:
        tok = AutoTokenizer.from_pretrained(mp, use_fast=True)
        if tok.pad_token is None:
            tok.pad_token = tok.eos_token
        mdl = AutoModelForCausalLM.from_pretrained(mp, **_device_kwargs()).eval()
        _cache.update(tok=tok, mdl=mdl, cfg=mp)
    return _cache["tok"], _cache["mdl"], cfg


def generate_text(system: str, user_prompt: str, generator_name="qgen") -> str:
    cfg = _cfg()
    gcfg = cfg["generators"][generator_name]
    provider = gcfg.get("provider", "local")

    if provider == "openai":
        resp = client.chat.completions.create(
            model=gcfg["openai_model"],
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=gcfg.get("max_new_tokens", 256),
            temperature=gcfg.get("temperature", 0.0),
        )
        return resp.choices[0].message.content.strip()

    # local fallback (like your phi3 model)
    tok, mdl, cfg_all = _ensure()
    text = (system + "\n\n" + user_prompt).strip()
    ids = tok(text, return_tensors="pt")
    ids = {k: v.to(mdl.device) for k, v in ids.items()}
    out = mdl.generate(
        **ids,
        max_new_tokens=gcfg["max_new_tokens"],
        temperature=gcfg["temperature"],
        eos_token_id=tok.eos_token_id,
        pad_token_id=tok.eos_token_id
    )
    return tok.decode(out[0][ids["input_ids"].shape[1]:], skip_special_tokens=True)
