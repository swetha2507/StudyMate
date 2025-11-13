import { useState } from "react";

export type QA = { q: string; a?: string; meta?: Record<string, unknown> };

export default function Flashcard({ qa }: { qa: QA }) {
  const [flip, setFlip] = useState(false);
  return (
    <div className={`card ${flip ? "flipped" : ""}`} onClick={() => setFlip(f => !f)}>
    <div className="card-inner">
        <div className="card-face card-front">
        <div className="card-title">{qa.q}</div>
        <div className="card-sub">Click to flip</div>
        </div>
        <div className="card-face card-back">
        <div className="card-title">{qa.a ?? "(no answer provided)"}</div>
        </div>
    </div>
    </div>
  );
}
