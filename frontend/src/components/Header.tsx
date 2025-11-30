type Props = {
  onToggleTheme: () => void;
  themeLabel: string;
};

export default function Header() {
  return (
    <header className="hdr">
      <div className="hdr-title">StudyMate</div>
    </header>
  );
}
