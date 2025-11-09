import os, chromadb
from chromadb.config import Settings

def get_client(path):
    os.makedirs(path, exist_ok=True)
    return chromadb.PersistentClient(path=path, settings=Settings(anonymized_telemetry=False))

def get_collection(client, name="studymate"):
    try:
        return client.get_collection(name)
    except:
        return client.create_collection(name, metadata={"hnsw:space":"cosine"})
