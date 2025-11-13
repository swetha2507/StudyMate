import { useEffect, useMemo, useRef, useState } from "react";
import Flashcard, { QA } from "./Flashcard";

export default function FlashcardCarousel({ items }: { items: QA[] }) {
  const [idx, setIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const count = items.length;
  const current = useMemo(() => items[idx] ?? null, [items, idx]);

  function prev() { setIdx(i => (i - 1 + count) % count); }
  function next() { setIdx(i => (i + 1) % count); }

  // keyboard nav when focused
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [count]);

  if (!current) return null;

  return (
    <div
      className="carousel"
      ref={containerRef}
      tabIndex={0}
      aria-roledescription="carousel"
      aria-label="Flashcards"
    >
      <button className="nav nav-left" onClick={prev} aria-label="Previous card">‹</button>

      <div className="slide">
        <div className="counter" aria-live="polite">{idx + 1} / {count}</div>
        <Flashcard qa={current} />
      </div>

      <button className="nav nav-right" onClick={next} aria-label="Next card">›</button>
    </div>
  );
}
