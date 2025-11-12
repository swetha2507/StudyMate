type Props = { onHamburger: () => void; mode: "ask" | "qgen"; onModeChange: (m: "ask" | "qgen") => void; };
export default function Header({ onHamburger, mode, onModeChange }: Props) {
  return (
    <header className="hdr">
      <button className="icon-btn" onClick={onHamburger} aria-label="Toggle sidebar">☰</button>
      <div className="hdr-title">Study UI</div>
      <div className="mode-toggle">
        <button
          className={`pill ${mode === "ask" ? "active" : ""}`}
          onClick={() => onModeChange("ask")}
        >Ask</button>
        <button
          className={`pill ${mode === "qgen" ? "active" : ""}`}
          onClick={() => onModeChange("qgen")}
        >QGen</button>
      </div>
    </header>
  );
}
