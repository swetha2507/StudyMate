from langgraph.graph import StateGraph, END
from backend.graph.state import RAGState
from backend.graph.nodes.query_rewrite import query_rewrite
from backend.graph.nodes.retrieve import retrieve
from backend.graph.nodes.rerank import rerank
from backend.graph.nodes.compose_prompt import compose_prompt
from backend.graph.nodes.generate import generate
from backend.graph.nodes.cite_verify import cite_verify
from backend.graph.nodes.answer_guard import answer_guard

def build_graph():
    g = StateGraph(RAGState)
    g.add_node("query_rewrite", query_rewrite)
    g.add_node("retrieve", retrieve)
    g.add_node("rerank", rerank)
    g.add_node("compose_prompt", compose_prompt)
    g.add_node("generate", generate)
    g.add_node("cite_verify", cite_verify)
    # g.add_node("answer_guard", answer_guard)
    
    g.set_entry_point("query_rewrite")
    g.add_edge("query_rewrite", "retrieve")
    g.add_edge("retrieve", "rerank")
    g.add_edge("rerank", "compose_prompt")
    g.add_edge("compose_prompt", "generate")
    g.add_edge("generate", "cite_verify")
    g.add_edge("cite_verify", END)
    return g.compile()
