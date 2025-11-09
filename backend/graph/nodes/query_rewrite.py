def query_rewrite(state):
    q = state["query_raw"].strip().replace("\n", " ")
    return {**state, "query": q}
