from fastapi import FastAPI
from pydantic import BaseModel
from backend.graph.build import build_graph

app = FastAPI()
graph = build_graph()

class AskReq(BaseModel):
    user_id: str | None = None
    query: str

@app.post("/ask")
async def ask(req: AskReq):
    state = {
        "user_id": req.user_id,
        "query_raw": req.query,
        "diagnostics": {"top_k_raw":20, "top_k_keep":3}
    }
    out = await graph.ainvoke(state)
    return {"answer": out.get("model_output", ""), "refusal": False}
