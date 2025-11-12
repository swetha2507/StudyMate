import { useEffect, useState } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import InputBar from "./components/InputBar";
import FileDropup from "./components/FileDropup";
import Loader from "./components/Loader";
import Toast from "./components/Toast";
import { useDocs } from "./hooks/useDocs";
import { useChat, Mode } from "./hooks/useChat";
import "./styles/variables.css";
import "./styles/globals.css";
import "./styles/layout.css";
import "./styles/components.css";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mode, setMode] = useState<Mode>(() => (localStorage.getItem("mode") as Mode) || "ask");
  const [dropupOpen, setDropupOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("selected") || "[]"); } catch { return []; }
  });

  const { docs, loading: docsLoading, error: docsError } = useDocs();
  const { chat, loading, error, sendAsk, sendQGen, reset } = useChat();

  useEffect(() => {
    document.body.classList.toggle("mode-qgen", mode === "qgen");
    localStorage.setItem("mode", mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem("selected", JSON.stringify(selected));
  }, [selected]);

  function toggleSel(p: string) {
    setSelected(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  }

  function onGenerate(opts: { k?: number; chunk_size?: number; chunk_overlap?: number }) {
    setDropupOpen(false);
    sendQGen(selected, opts);
  }

  return (
    <div className="app">
      <Header
        onHamburger={() => setSidebarOpen(s => !s)}
        mode={mode}
        onModeChange={setMode}
      />
      <Sidebar
        open={sidebarOpen}
        docs={docs}
        mode={mode}
        selected={selected}
        onToggleFile={toggleSel}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="main">
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
          <button className="icon-btn" onClick={reset}>New chat</button>
          {docsLoading && <Loader show={true} />}
          {docsError && <span style={{ color: "#f88" }}>Docs error: {docsError}</span>}
        </div>

        <ChatWindow messages={chat} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <span style={{ color: "var(--muted)", fontSize: 13 }}>
            {mode === "qgen" ? `${selected.length} file(s) selected` : "Embeddings will route automatically"}
          </span>
          {loading && <Loader show={true} />}
        </div>

        <InputBar
          mode={mode}
          busy={!!loading}
          onSendAsk={(t) => sendAsk(t)}
          onOpenDropup={() => setDropupOpen(true)}
        />
      </main>

      <FileDropup
        open={dropupOpen && mode === "qgen"}
        docs={docs}
        selected={selected}
        onToggle={toggleSel}
        onClose={() => setDropupOpen(false)}
        onGenerate={onGenerate}
      />

      <Toast message={error || ""} onClose={() => location.reload()} />
    </div>
  );
}
