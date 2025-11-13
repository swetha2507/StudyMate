import { useMemo, useState } from "react";

function fileName(p: string) {
  const parts = p.split("/");
  return parts[parts.length - 1] || p;
}

type Props = {
  open: boolean;
  docs: string[];
  // kept for API compatibility, not used in this UI
  mode: "ask" | "qgen";
  selected: string[];
  onToggleFile: (path: string) => void;
  onClose: () => void;
};

export default function Sidebar({ open, docs, onClose }: Props) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s
      ? docs.filter(d => fileName(d).toLowerCase().includes(s))
      : docs;
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
        {filtered.map(p => (
          <div key={p} className="doc-row">
            <span className="doc-path" title={p}>{fileName(p)}</span>
          </div>
        ))}
      </div>
      <div className="sidebar-foot"><span>{filtered.length} files</span></div>
    </aside>
  );
}
