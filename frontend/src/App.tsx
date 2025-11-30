import { useEffect, useMemo, useState } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import InputBar from "./components/InputBar";
import FileDropup from "./components/FileDropup";
import Loader from "./components/Loader";
import Toast from "./components/Toast";
import FlashcardView from "./components/FlashcardView";
import Fab from "./components/Fab";

import { useDocs } from "./hooks/useDocs";
import { useChat, QA } from "./hooks/useChat";

import "./styles/globals.css";
import "./styles/layout.css";
import "./styles/variables.css";
import "./index.css";

const BASE = "http://localhost:8080";

function fileName(path: string) {
  const parts = path.split("/");
  return parts[parts.length - 1] || path;
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [page, setPage] = useState<"main" | "generate">("main");
  const [activeFile, setActiveFile] = useState<string | null>(null);

  const [currentDeck, setCurrentDeck] = useState<{ file: string; items: QA[] } | null>(
    null
  );

  const { docs, loading: docsLoading, error: docsError, refreshDocs } = useDocs();
  const { chat, loading, error, sendAsk, sendQGenOne } = useChat();
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingFlashcards, setLoadingFlashcards] = useState(false);

  // === THEME ===
  const [theme, setTheme] = useState<"light" | "dark">(
    () => (localStorage.getItem("theme") as "light" | "dark") || "auto"
  );

  const themeLabel = useMemo(
    () => (theme === "dark" ? "Dark" : theme === "light" ? "Light" : "Auto"),
    [theme]
  );

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-light", "theme-dark");
    if (theme === "light") root.classList.add("theme-light");
    if (theme === "dark") root.classList.add("theme-dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === "light" ? "dark" : t === "dark" ? "light" : "dark"));
  }

  // === FAB (not used on new flashcard page but kept for compatibility) ===
  const [fabOpen, setFabOpen] = useState(false);
  function toggleFab() {
    setFabOpen((o) => !o);
  }

  // === GENERATE FLASHCARDS ===
  async function onGenerateOne(filePath: string) {
    setLoadingFlashcards(true);
    setPage("generate");

    const label = fileName(filePath);

    const qa = await sendQGenOne(filePath, {});

    // Set deck first
    setCurrentDeck({ file: label, items: qa });

    // Then hide loader AFTER the deck is ready
    setLoadingFlashcards(false);
  }



  const items = docs.map((p) => ({ path: p, name: fileName(p) }));

  return (
    <div className="app">
      {/* HEADER */}
      <Header />

      {/* SIDEBAR */}
      <Sidebar
        open={sidebarOpen}
        docs={docs}
        mode={"ask"}
        selected={[]}
        onToggleFile={() => {}}
        onClose={() => setSidebarOpen(false)}
      />

      {/* ================================
          PAGE 1 — MAIN CHAT PAGE
         ================================ */}
      {page === "main" && (
        <main className="main-2col">
          <div className="two-col-wrapper">
            {/* LEFT PANEL */}
            <aside className="doc-panel">
              <div
                className="upload-card"
                onDragEnter={(e) => e.preventDefault()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) console.log("Dropped file:", file);
                }}
              >
                <h3 className="upload-title">Upload your file</h3>
                <p className="upload-sub">
                  Drop PDFs or text files here so StudyMate can help you study.
                </p>

                <label className="upload-btn">
                  Choose file
                  <input
                    type="file"
                    accept=".pdf,.txt"
                    style={{ display: "none" }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      const formData = new FormData();
                      formData.append("file", file);

                      const res = await fetch(`${BASE}/upload`, {
                        method: "POST",
                        body: formData,
                      });

                      if (res.ok) {
                        console.log("Uploaded:", file.name);
                        refreshDocs();
                      } else {
                        console.error("Upload failed");
                      }
                    }}
                  />
                </label>

                <p className="upload-caption">Supported: PDF, TXT</p>
              </div>

              <h2 className="doc-title">Your documents</h2>

              <input
                type="text"
                className="doc-search"
                placeholder="Search in uploaded files…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              <div className="doc-list-custom">
                {docs
                  .filter((d) =>
                    fileName(d).toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((d) => (
                    <div
                      key={d}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
                      <button className="doc-pill" onClick={() => setActiveFile(d)}>
                        {fileName(d)}
                      </button>

                      {activeFile === d && (
                        <button
                          className="generate-btn"
                          onClick={() => onGenerateOne(d)}
                        >
                          Generate flashcards
                        </button>
                      )}
                    </div>
                  ))}
              </div>

              <p className="doc-count">{docs.length} files uploaded</p>
            </aside>

            {/* RIGHT PANEL */}
            <section className="chat-card">
              <p className="chat-hint">Ask StudyMate anything about your notes</p>

              <div className="chat-bubbles">
                <ChatWindow messages={chat} />
              </div>

              <div className="chat-inputbar">
                <InputBar
                  mode="ask"
                  busy={!!loading}
                  onSendAsk={(t) => sendAsk(t)}
                  onOpenDropup={toggleFab}
                />
              </div>
            </section>
          </div>
        </main>
      )}

      {/* ================================
          PAGE 2 — FLASHCARD VIEW
         ================================ */}
      {page === "generate" && (
        <main className="generate-page">
          {loadingFlashcards && (
            <div className="loader-overlay">
              <div className="loader-lg"></div>
            </div>
          )}

          {!loadingFlashcards && currentDeck && (
            <FlashcardView
              file={currentDeck.file}
              items={currentDeck.items}
              onBack={() => setPage("main")}
            />
          )}
        </main>
      )}

      <Toast message={error || ""} onClose={() => location.reload()} />

      {docsLoading && (
        <div style={{ position: "fixed", left: 16, bottom: 16 }}>
          <Loader show={true} />
        </div>
      )}

      {docsError && (
        <div style={{ position: "fixed", left: 16, bottom: 16, color: "#c44" }}>
          Docs error: {docsError}
        </div>
      )}
    </div>
  );
}
