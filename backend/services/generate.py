import os, json
from typing import List, Tuple
from backend.retrievers.chunking import chunk_text
from backend.models.embeddings import embed_texts
from backend.models.qgen import generate_question
from backend.utils.diversity import select_diverse_indices
import numpy as np

def load_text(path: str) -> str:
    with open(path, "r", errors="ignore") as f:
        return f.read()

def chunk_and_embed(text: str, embed_model: str, size=140, overlap=30) -> Tuple[List[str], np.ndarray]:
    chunks = [c for c in chunk_text(text, size=size, overlap=overlap) if c.strip()]
    if not chunks:
        return [], np.zeros((0, 384), dtype="float32")
    embs = embed_texts(chunks, embed_model)  # already normalized in your embedder
    return chunks, embs

def generate_covered_questions(path: str, embed_model: str, k: int = 5,
                               size=140, overlap=30) -> List[dict]:
    if not os.path.exists(path):
        raise FileNotFoundError(path)
    text = load_text(path)
    chunks, embs = chunk_and_embed(text, embed_model, size=size, overlap=overlap)
    if len(chunks) == 0:
        return []
    idxs = select_diverse_indices(embs, k)
    picked = [chunks[i] for i in idxs]
    out = []
    for ch in picked:
        q = generate_question(ch, max_new_tokens=512)
        q = q.strip()
        if not q.endswith("?"):
            q += "?"
        out.append({"question": q, "passage": ch})
    # basic dedup
    dedup, seen = [], set()
    for item in out:
        key = " ".join(item["question"].lower().split())
        if key not in seen:
            seen.add(key)
            dedup.append(item)
    # pad if collisions removed something: pick next diverse ones
    if len(dedup) < k and len(chunks) > len(idxs):
        remaining = [i for i in range(len(chunks)) if i not in idxs]
        extra = remaining[: (k - len(dedup))]
        for i in extra:
            q = generate_question(chunks[i], max_new_tokens=512).strip()
            if not q.endswith("?"): q += "?"
            if " ".join(q.lower().split()) not in seen:
                dedup.append({"question": q, "passage": chunks[i]})
    return dedup[:k]
