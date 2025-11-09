from backend.models.generator import generate_text
def generate(state):
    print("Input to model", state)
    out = generate_text(system="You are a precise study assistant.", user_prompt=state["prompt"])
    print("Output of model", out)
    return {**state, "model_output": out}
