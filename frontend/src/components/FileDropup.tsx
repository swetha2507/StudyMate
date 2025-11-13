type Item = { path: string; name: string };

export default function FileDropup({
  open,
  items,
  onClose,
  onGenerateOne,
}: {
  open: boolean;
  items: Item[];
  onClose: () => void;
  onGenerateOne: (filePath: string) => void;
}) {
  if (!open) return null;

  return (
    <div className="dropup" role="dialog" aria-modal="true" aria-label="Generate flashcards">
      <div className="dropup-head">
        <strong>Choose a file</strong>
        <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
      </div>
      <div className="dropup-body">
        {items.map(it => (
          <button
            key={it.path}
            className="file-btn"
            onClick={() => onGenerateOne(it.path)}
            title={it.path}
          >
            {it.name}
          </button>
        ))}
      </div>
    </div>
  );
}
