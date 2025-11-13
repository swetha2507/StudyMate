export default function Fab({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  const label = open ? "Close" : "Generate Questions";
  return (
    <button
      className="fab"
      onClick={onToggle}
      aria-label={label}
      title={label}             // <— tooltip on hover
    >
      {open ? "×" : "⊕"}
    </button>
  );
}
