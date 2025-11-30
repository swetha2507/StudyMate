import { useState } from "react";
import { QA } from "./Flashcard"; // keep your QA type
import { FiArrowLeft } from "react-icons/fi";

export default function FlashcardView({
  file,
  items,
  onBack,
}: {
  file: string;
  items: QA[];
  onBack: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const card = items[index];
  const total = items.length;

  function next() {
    setFlipped(false);
    setIndex((i) => (i + 1 < total ? i + 1 : i));
  }
  function prev() {
    setFlipped(false);
    setIndex((i) => (i > 0 ? i - 1 : 0));
  }
  console.log("FLASHCARD DATA:", card);
  
  return (
    <div className="fc-page">

      {/* Back button */}
        <button className="fc-back" onClick={onBack}>
            <FiArrowLeft size={20} />
        </button>

      {/* Top metadata */}
      <div className="fc-meta">
        <span className="fc-file">{file}</span>
        <span className="fc-tag">Flashcards</span>
        <span className="fc-count">{index + 1} / {total}</span>
      </div>

      {/* Flashcard */}
      <div className={`fc-card ${flipped ? "fc-flipped" : ""}`}>
        <div className="fc-card-inner">
          <div className="fc-face fc-front">
            <div className="flashcard-body"> {card.q} </div>
          </div>

          <div className="fc-face fc-back">
            <div className="flashcard-body"> {card.a || "(no answer provided)"} </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="fc-controls">
        <button className="fc-nav" onClick={prev} disabled={index === 0}>
          ‹
        </button>

        <button className="fc-flip" onClick={() => setFlipped((f) => !f)}>
          Flip card
        </button>

        <button className="fc-nav" onClick={next} disabled={index === total - 1}>
          ›
        </button>
      </div>

      {/* Difficulty buttons */}
      <div className="fc-diff-row">
        <button className="fc-diff easy">Easy</button>
        <button className="fc-diff ok">Okay</button>
        <button className="fc-diff hard">Hard</button>
      </div>

      <p className="fc-tip">Pro tip: Review “Hard” cards more often.</p>
    </div>
  );
}
