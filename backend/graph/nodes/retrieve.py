import yaml
from backend.retrievers.vectorstore import get_client, get_collection
from backend.models.embeddings import embed_texts

_cfg = yaml.safe_load(open("backend/configs/dev.yaml"))
_client = get_client(_cfg["retrieval"]["index_path"])
_col = get_collection(_client)
_embed = _cfg["retrieval"]["embed_model"]

def retrieve(state):
    k = state["diagnostics"].get("top_k_raw", _cfg["retrieval"]["top_k_raw"])
    qvec = embed_texts([state["query"]], _embed)[0].tolist()
    res = _col.query(query_embeddings=[qvec], n_results=k)
    hits=[]
    for i in range(len(res["ids"][0])):
        hits.append({
            "id": res["ids"][0][i],
            "text": res["documents"][0][i],
            "meta": res["metadatas"][0][i],
            "score": res.get("distances", [[0]])[0][i],
        })
    return {**state, "retrieved": hits}
