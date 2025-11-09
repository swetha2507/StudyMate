import yaml
from backend.models.reranker import rerank as rr
_cfg = yaml.safe_load(open("backend/configs/dev.yaml"))

def rerank(state):
    ranked = rr(state["query"], state["retrieved"], _cfg["reranker"]["model"])
    keep = state["diagnostics"].get("top_k_keep", _cfg["retrieval"]["top_k_keep"])
    return {**state, "reranked": ranked[:keep]}
