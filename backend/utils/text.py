import re
def split_into_sentences(t: str):
    return [s.strip() for s in re.split(r'(?<=[.!?])\s+', t) if s.strip()]
