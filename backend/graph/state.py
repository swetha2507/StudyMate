from typing import TypedDict, List, Dict, Any, Optional

class Passage(TypedDict):
    id: str
    text: str
    meta: Dict[str, Any]
    score: float

class SentenceSupport(TypedDict):
    sentence: str
    support_ids: List[str]

class RAGState(TypedDict):
    user_id: Optional[str]
    query_raw: str
    query: str
    retrieved: List[Passage]
    reranked: List[Passage]
    context: str
    prompt: str
    model_output: str
    sentences_support: List[SentenceSupport]
    final_answer: str
    refusal: bool
    diagnostics: Dict[str, Any]
