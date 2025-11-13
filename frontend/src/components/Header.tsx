type Props = {
  onHamburger: () => void;
  onToggleTheme: () => void;
  themeLabel: string;
};

export default function Header({ onHamburger, onToggleTheme, themeLabel }: Props) {
  return (
    <header className="hdr" style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: 12 }}>
      <button className="icon-btn" onClick={onHamburger} aria-label="Toggle sidebar">☰</button>
      <div className="hdr-title">StudyMate</div>
      <button className="icon-btn" onClick={onToggleTheme} aria-label="Toggle theme">{themeLabel}</button>
    </header>
  );
}
