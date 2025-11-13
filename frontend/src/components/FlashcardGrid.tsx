import Flashcard, { QA } from "./Flashcard";

export default function FlashcardGrid({ file, items }: { file: string; items: QA[] }) {
  return (
    <section className="flashcards">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>{file}</h3>
        <span style={{ color: "var(--muted)", fontSize: 12 }}>{items.length} cards</span>
      </div>
      <div className="flashcard-grid">
        {items.map((qa, i) => <Flashcard key={i} qa={qa} />)}
      </div>
    </section>
  );
}
