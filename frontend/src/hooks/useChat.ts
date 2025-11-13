import { useState } from "react";
import { postAsk, postQGenFile } from "../api/client";

export type ChatMsg = { role: "user" | "assistant"; text: string };
export type Mode = "ask" | "qgen";
type AskResp = { answer: string; refusal: boolean };
type QGenResp = { file: string; count: number; items: any[] };
export type QA = { q: string; a?: string; meta?: Record<string, unknown> };

export function useChat() {
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState<false | "asking" | "generating">(false);
  const [error, setError] = useState<string | null>(null);

  async function sendAsk(query: string, user_id?: string | null) {
    setError(null);
    setChat(prev => [...prev, { role: "user", text: query }]);
    setLoading("asking");
    try {
      const res = (await postAsk({ user_id: user_id ?? null, query })) as AskResp;
      setChat(prev => [...prev, { role: "assistant", text: res.answer || "(no answer)" }]);
    } catch (e: any) {
      setError(e.message || "Ask failed");
    } finally {
      setLoading(false);
    }
  }

    // inside useChat()
    async function sendQGenOne(
    file: string,
    _opts: { k?: number; chunk_size?: number; chunk_overlap?: number } = {}
    ): Promise<QA[]> {
    setError(null);
    setLoading("generating");
    try {
        // hard defaults
        const opts = { k: 5, chunk_size: 140, chunk_overlap: 30, ..._opts };
        const r = (await postQGenFile({ path: file, ...opts })) as QGenResp;
        return r.items.map(normalizeItemToQA);
    } catch (e: any) {
        setError(e.message || "QGen failed");
        return [];
    } finally {
        setLoading(false);
    }
    }


  function reset() {
    setChat([]);
    setError(null);
  }

  return { chat, loading, error, sendAsk, sendQGenOne, reset };
}

/* ---- helpers ---- */
function normalizeItemToQA(it: any): { q: string; a?: string; meta?: Record<string, unknown> } {
  if (typeof it === "string") return { q: it };
  if (Array.isArray(it)) return { q: JSON.stringify(it) };

  if (it && typeof it === "object") {
    const q = it.question ?? it.q ?? it.prompt ?? it.text ?? it.title ?? "(missing question)";
    const a = it.answer ?? it.a ?? it.passage ?? it.context ?? undefined;
    const meta: Record<string, unknown> = {};
    for (const k of Object.keys(it)) {
      if (!["question","q","prompt","text","title","answer","a","passage","context"].includes(k)) {
        meta[k] = it[k];
      }
    }
    return { q: sanitize(q), a: a ? sanitize(a) : undefined, meta: Object.keys(meta).length ? meta : undefined };
  }

  return { q: String(it) };
}

function sanitize(v: unknown): string {
  if (typeof v !== "string") return String(v);
  return v.replace(/\s+/g, " ").trim();
}
