def chunk_text(text: str, size: int, overlap: int):
    words = text.split()
    out = []
    i = 0
    step = max(1, size - overlap)
    while i < len(words):
        out.append(" ".join(words[i:i+size]))
        i += step
    return out
