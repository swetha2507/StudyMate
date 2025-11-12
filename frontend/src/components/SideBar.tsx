import { useMemo, useState } from "react";

type Props = {
  open: boolean;
  docs: string[];
  mode: "ask" | "qgen";
  selected: string[];
  onToggleFile: (path: string) => void;
  onClose: () => void;
};

export default function Sidebar({ open, docs, mode, selected, onToggleFile, onClose }: Props) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? docs.filter(d => d.toLowerCase().includes(s)) : docs;
  }, [q, docs]);

  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="sidebar-head">
        <strong>Documents</strong>
        <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
      </div>
      <input
        className="search"
        placeholder="Search..."
        value={q}
        onChange={e => setQ(e.target.value)}
      />
      <div className="doc-list">
        {filtered.map(p => {
          const isSel = selected.includes(p);
          return (
            <div key={p} className="doc-row">
              <span className="doc-path" title={p}>{p}</span>
              {mode === "qgen" && (
                <input
                  type="checkbox"
                  checked={isSel}
                  onChange={() => onToggleFile(p)}
                  aria-label={`Select ${p}`}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="sidebar-foot">
        <span>{filtered.length} files</span>
      </div>
    </aside>
  );
}
