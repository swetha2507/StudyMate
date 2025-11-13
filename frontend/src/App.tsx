import { useEffect, useMemo, useState } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import InputBar from "./components/InputBar";
import FileDropup from "./components/FileDropup";
import Loader from "./components/Loader";
import Toast from "./components/Toast";
import FlashcardGrid from "./components/FlashcardGrid";
import FlashcardCarousel from "./components/FlashcardCarousel";
import Fab from "./components/Fab";

import { useDocs } from "./hooks/useDocs";
import { useChat, QA } from "./hooks/useChat";

import "./styles/variables.css";
import "./styles/globals.css";
import "./styles/layout.css";

function fileName(path: string) {
  const parts = path.split("/"); return parts[parts.length - 1] || path;
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Theme
  const [theme, setTheme] = useState<"light" | "dark">(
    () => (localStorage.getItem("theme") as "light" | "dark") || "auto"
  );
  const themeLabel = useMemo(() => theme === "dark" ? "Dark" : theme === "light" ? "Light" : "Auto", [theme]);

  // FAB / Drop-up / Cards
  const [fabOpen, setFabOpen] = useState(false);     // controls file drop-up
  const [showCards, setShowCards] = useState(false);  // controls flashcards
  const [currentDeck, setCurrentDeck] = useState<{ file: string; items: QA[] } | null>(null);
  const { docs, loading: docsLoading, error: docsError } = useDocs();
  const { chat, loading, error, sendAsk, sendQGenOne } = useChat();

  // Theme classes
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-light","theme-dark");
    if (theme === "light") root.classList.add("theme-light");
    if (theme === "dark")  root.classList.add("theme-dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme(t => t === "light" ? "dark" : t === "dark" ? "light" : "dark");
  }

  // FAB toggles both the drop-up and card visibility
  function toggleFab() {
    if (showCards) {
      // Returning to chat: hide cards and make sure the picker is CLOSED
      setShowCards(false);
      setCurrentDeck(null);
      setFabOpen(false);           // <— ensure drop-up is closed
    } else {
      // In chat: toggle the file picker
      setFabOpen(o => !o);
    }
  }

  // When a file is selected: close picker, load cards, keep them until FAB toggled again
  async function onGenerateOne(filePath: string) {
    setFabOpen(false);             // close the drop-up immediately
    setShowCards(true);            // enter cards mode
    setCurrentDeck({ file: fileName(filePath), items: [] });
    const qa = await sendQGenOne(filePath, {}); // defaults inside hook
    setCurrentDeck({ file: fileName(filePath), items: qa });
  }

  const items = useMemo(() => docs.map(p => ({ path: p, name: fileName(p) })), [docs]);

  return (
    <div className="app">
      <Header
        onHamburger={() => setSidebarOpen(s => !s)}
        onToggleTheme={toggleTheme}
        themeLabel={themeLabel}
      />

      <Sidebar
        open={sidebarOpen}
        docs={docs}
        mode={"ask"}
        selected={[]}
        onToggleFile={() => {}}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="main">
        <div className="container">
          {showCards && currentDeck && (
            <>
              {/* no titles/labels – just the carousel */}
              <FlashcardCarousel items={currentDeck.items} />
            </>
          )}

          {!showCards && (
            <>
              <div className="chat-panel">
                <ChatWindow messages={chat} />
              </div>
              <div className="inputbar">
                <InputBar
                  mode="ask"
                  busy={!!loading}
                  onSendAsk={(t) => sendAsk(t)}
                  onOpenDropup={toggleFab}
                />
              </div>
            </>
          )}
        </div>
      </main>

      <Fab open={fabOpen || showCards} onToggle={toggleFab} />

      <FileDropup
        open={fabOpen}
        items={items}
        onClose={() => setFabOpen(false)}   /* closing picker doesn't hide cards */
        onGenerateOne={onGenerateOne}
      />

      <Toast message={error || ""} onClose={() => location.reload()} />
      {docsLoading && <div style={{ position: "fixed", left: 16, bottom: 16 }}><Loader show={true} /></div>}
      {docsError && <div style={{ position: "fixed", left: 16, bottom: 16, color: "#c44" }}>Docs error: {docsError}</div>}

      {loading && showCards && (
        <div className="loader-overlay">
          <div className="loader-lg" />
        </div>
      )}
    </div>
  );
}
