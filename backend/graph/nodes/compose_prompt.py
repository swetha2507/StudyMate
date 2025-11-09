from jinja2 import Template

def _join(passages):
    blocks=[]
    for p in passages:
        sid = p["id"]; src = p["meta"].get("source","")
        blocks.append(f"[{sid}] ({src})\n{p['text']}")
    return "\n\n".join(blocks)

def compose_prompt(state):
    ctx = _join(state.get("reranked") or state.get("retrieved"))
    tmpl = Template(open("backend/prompts/answer.j2").read())
    prompt = tmpl.render(query=state["query"], context=ctx)
    return {**state, "context": ctx, "prompt": prompt}
