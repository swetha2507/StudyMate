import { useState } from "react";

type Props = {
  open: boolean;
  docs: string[];
  selected: string[];
  onToggle: (p: string) => void;
  onClose: () => void;
  onGenerate: (opts: { k?: number; chunk_size?: number; chunk_overlap?: number }) => void;
};

export default function FileDropup({ open, docs, selected, onToggle, onClose, onGenerate }: Props) {
  const [k, setK] = useState(5);
  const [size, setSize] = useState(140);
  const [overlap, setOverlap] = useState(30);

  if (!open) return null;

  return (
    <div className="dropup">
      <div className="dropup-head">
        <strong>Select files</strong>
        <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
      </div>
      <div className="dropup-body">
        <div className="checklist">
          {docs.map(p => (
            <label key={p} className="check-row" title={p}>
              <input type="checkbox" checked={selected.includes(p)} onChange={() => onToggle(p)} />
              <span className="check-path">{p}</span>
            </label>
          ))}
        </div>
        <div className="options">
          <div className="opt">
            <label>K</label>
            <input type="number" value={k} onChange={e => setK(parseInt(e.target.value || "0"))} />
          </div>
          <div className="opt">
            <label>Chunk size</label>
            <input type="number" value={size} onChange={e => setSize(parseInt(e.target.value || "0"))} />
          </div>
          <div className="opt">
            <label>Overlap</label>
            <input type="number" value={overlap} onChange={e => setOverlap(parseInt(e.target.value || "0"))} />
          </div>
        </div>
      </div>
      <div className="dropup-foot">
        <button
          className="primary"
          onClick={() => onGenerate({ k, chunk_size: size, chunk_overlap: overlap })}
          disabled={selected.length === 0}
        >
          Generate
        </button>
      </div>
    </div>
  );
}
