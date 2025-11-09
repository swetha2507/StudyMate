from sentence_transformers import SentenceTransformer
import numpy as np
_model = None

def embedder(name: str):
    global _model
    if _model is None:
        _model = SentenceTransformer(name)  # CPU ok
    return _model

def embed_texts(texts, name: str):
    model = embedder(name)
    vecs = model.encode(texts, normalize_embeddings=True)
    return np.asarray(vecs, dtype="float32")
