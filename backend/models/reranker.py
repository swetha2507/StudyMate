from sentence_transformers import CrossEncoder
_ce = None

def rerank(query: str, passages, model_name: str):
    global _ce
    if _ce is None:
        _ce = CrossEncoder(model_name)  # CPU ok
    pairs = [(query, p["text"]) for p in passages]
    scores = _ce.predict(pairs)
    ranked = sorted(zip(passages, scores), key=lambda x: x[1], reverse=True)
    return [p for p,_ in ranked]
