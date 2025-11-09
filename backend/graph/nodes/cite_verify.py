from backend.utils.text import split_into_sentences
from backend.models.embeddings import embed_texts
import yaml, numpy as np

_cfg = yaml.safe_load(open("backend/configs/dev.yaml"))
_embed = _cfg["retrieval"]["embed_model"]

def _support_ids(sent, passages, threshold=0.25):
    s_vec = embed_texts([sent], _embed)[0]
    ids=[]
    for p in passages:
        p_vec = embed_texts([p["text"]], _embed)[0]
        score = float(np.dot(s_vec, p_vec))
        if score >= threshold:
            ids.append(p["id"])
    return ids[:3]

def cite_verify(state):
    sents = split_into_sentences(state["model_output"])
    base = state["reranked"] or state["retrieved"]
    sup = [{"sentence": s, "support_ids": _support_ids(s, base)} for s in sents]
    return {**state, "sentences_support": sup}
