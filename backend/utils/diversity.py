import numpy as np

def select_diverse_indices(embs: np.ndarray, k: int) -> list[int]:
    """Greedy max-min diversity over cosine distance. Assumes embs are L2-normalized."""
    n = embs.shape[0]
    if k >= n:
        return list(range(n))
    # Start with the highest-norm (they're normalized; use variance proxy: mean distance)
    dists = 1.0 - (embs @ embs.T)  # cosine distance matrix
    # seed = most dissimilar to the mean
    mean_vec = embs.mean(axis=0, keepdims=True)
    seed = int(np.argmax(1.0 - (embs @ mean_vec.T).ravel()))
    chosen = [seed]
    # iteratively pick the point with max min-distance to chosen
    while len(chosen) < k:
        min_d = np.min(dists[:, chosen], axis=1)
        min_d[chosen] = -1  # don't re-pick
        nxt = int(np.argmax(min_d))
        chosen.append(nxt)
    return chosen
