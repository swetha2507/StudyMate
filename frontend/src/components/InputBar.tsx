import { useEffect, useRef, useState } from "react";

type Props = {
  mode: "ask" | "qgen";
  onSendAsk: (text: string) => void;
  onOpenDropup: () => void;
  busy: boolean;
};

export default function InputBar({ mode, onSendAsk, onOpenDropup, busy }: Props) {
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { ref.current?.focus(); }, [mode]);

  function handleSend() {
    if (!text.trim()) return;
    if (mode === "ask") {
      onSendAsk(text.trim());
      setText("");
    } else {
      onOpenDropup();
    }
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="inputbar">
      <textarea
        ref={ref}
        placeholder={mode === "ask" ? "Ask something..." : "Generate questions..."}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={onKey}
        disabled={busy}
      />
      <button className="send-btn" onClick={handleSend} disabled={busy}>
        {mode === "ask" ? "Send" : "Generate"}
      </button>
    </div>
  );
}
