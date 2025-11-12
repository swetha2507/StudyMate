from fastapi import FastAPI
from pydantic import BaseModel
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware
import yaml
from backend.graph.build import build_graph
from backend.services.generate import generate_covered_questions

app = FastAPI()
graph = build_graph()

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Routes ---
class AskReq(BaseModel):
    user_id: str | None = None
    query: str

class QGenFileReq(BaseModel):
    path: str
    k: int | None = 5
    chunk_size: int | None = 140
    chunk_overlap: int | None = 30

@app.post("/ask")
async def ask(req: AskReq):
    state = {
        "user_id": req.user_id,
        "query_raw": req.query,
        "diagnostics": {"top_k_raw": 20, "top_k_keep": 3},
    }
    out = await graph.ainvoke(state)
    return {"answer": out.get("model_output", ""), "refusal": False}

@app.post("/qgen/file")
async def qgen_file(req: QGenFileReq):
    _cfg = yaml.safe_load(open("backend/configs/dev.yaml"))
    qs = generate_covered_questions(
        path=req.path,
        embed_model=_cfg["retrieval"]["embed_model"],
        k=req.k or 5,
        size=req.chunk_size or 140,
        overlap=req.chunk_overlap or 30,
    )
    return {"file": req.path, "count": len(qs), "items": qs}

DOCS_DIR = Path("backend/docs")

@app.get("/docs")
def list_docs():
    return {"items": sorted([str(p) for p in DOCS_DIR.glob('**/*') if p.is_file()])}
