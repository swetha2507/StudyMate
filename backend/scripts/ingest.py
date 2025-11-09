import glob, uuid, yaml, os
from backend.retrievers.vectorstore import get_client, get_collection
from backend.retrievers.chunking import chunk_text
from backend.models.embeddings import embed_texts

cfg = yaml.safe_load(open("backend/configs/dev.yaml"))
client = get_client(cfg["retrieval"]["index_path"])
col = get_collection(client)
embed_name = cfg["retrieval"]["embed_model"]

def upsert_text(text, meta):
    chunks = chunk_text(text, cfg["retrieval"]["chunk_size"], cfg["retrieval"]["chunk_overlap"])
    ids = [f"P{uuid.uuid4().hex[:8]}" for _ in chunks]
    vecs = embed_texts(chunks, embed_name).tolist()
    col.upsert(ids=ids, documents=chunks, metadatas=[meta]*len(chunks), embeddings=vecs)

def main():
    for p in glob.glob("backend/docs/**/*.*", recursive=True):
        try:
            txt = open(p, "r", errors="ignore").read()
            upsert_text(txt, {"source": os.path.basename(p), "path": p})
        except Exception:
            pass
    print("Ingest complete.")

if __name__ == "__main__":
    main()
