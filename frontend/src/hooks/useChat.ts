import { useState } from "react";
import { postAsk, postQGenFile } from "../api/client";

export type ChatMsg = { role: "user" | "assistant"; text: string };
export type Mode = "ask" | "qgen";

type AskResp = { answer: string; refusal: boolean };
type QGenResp = { file: string; count: number; items: any[] };

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

  async function sendQGen(
    files: string[],
    opts: { k?: number; chunk_size?: number; chunk_overlap?: number }
  ) {
    if (files.length === 0) return;
    setError(null);

    // Optional: show a user message so the chat has context
    setChat(prev => [
      ...prev,
      { role: "user", text: `Generate questions for ${files.length} file(s).` },
    ]);

    setLoading("generating");
    try {
      const results: QGenResp[] = [];
      for (const f of files) {
        const r = (await postQGenFile({ path: f, ...opts })) as QGenResp;
        results.push(r);
      }

      const text = results
        .map(r => {
          const list = r.items
            .map((it, i) => formatQGenItem(it, i))
            .join("\n");
          return `File: ${r.file}\nCount: ${r.count}\n${list}`;
        })
        .join("\n\n");

      setChat(prev => [...prev, { role: "assistant", text }]);
    } catch (e: any) {
      setError(e.message || "QGen failed");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setChat([]);
    setError(null);
  }

  return { chat, loading, error, sendAsk, sendQGen, reset };
}

/* ---------- helpers ---------- */

function formatQGenItem(it: any, idx: number): string {
  // Strings are already fine
  if (typeof it === "string") return `  ${idx + 1}. ${it}`;

  // Arrays: stringify compactly
  if (Array.isArray(it)) {
    return `  ${idx + 1}. ${JSON.stringify(it)}`;
  }

  // Objects: try common fields first
  if (it && typeof it === "object") {
    const q =
      it.question ??
      it.q ??
      it.prompt ??
      it.text ??
      it.title ??
      null;

    const a = it.answer ?? it.a ?? null;
    const why =
      it.explanation ??
      it.rationale ??
      it.reason ??
      it.notes ??
      null;
    const topic = it.topic ?? it.tag ?? it.category ?? null;
    const diff = it.difficulty ?? it.level ?? null;
    const type = it.type ?? null;

    const lines: string[] = [];
    lines.push(`  ${idx + 1}. ${q ? sanitize(q) : "(missing question)"}`);
    if (type)  lines.push(`     Type: ${stringifyMaybe(type)}`);
    if (topic) lines.push(`     Topic: ${stringifyMaybe(topic)}`);
    if (diff)  lines.push(`     Difficulty: ${stringifyMaybe(diff)}`);
    if (a)     lines.push(`     Answer: ${stringifyMaybe(a)}`);
    if (why)   lines.push(`     Why: ${stringifyMaybe(why)}`);

    // Include other keys compactly, without duplicating known ones
    const known = new Set([
      "question","q","prompt","text","title",
      "answer","a",
      "explanation","rationale","reason","notes",
      "topic","tag","category",
      "difficulty","level",
      "type"
    ]);

    Object.keys(it)
      .filter(k => !known.has(k))
      .forEach(k => {
        const val = it[k];
        lines.push(`     ${k}: ${stringifyMaybe(val)}`);
      });

    return lines.join("\n");
  }

  // Fallback
  return `  ${idx + 1}. ${String(it)}`;
}

function sanitize(s: unknown): string {
  if (typeof s !== "string") return stringifyMaybe(s);
  // Trim and collapse whitespace to keep it tidy in chat bubbles
  return s.replace(/\s+/g, " ").trim();
}

function stringifyMaybe(v: any): string {
  if (v == null) return "";
  if (typeof v === "string") return v.trim();
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}
