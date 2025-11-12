const BASE = "http://localhost:8080";

export async function fetchDocs(): Promise<string[]> {
  const res = await fetch(`${BASE}/files`);
  if (!res.ok) throw new Error("Failed to load docs");
  const data = await res.json();
  return data.items as string[];
}

export async function postAsk(payload: { user_id?: string | null; query: string }) {
  const res = await fetch(`${BASE}/ask`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Ask failed");
  return await res.json() as { answer: string; refusal: boolean };
}

export async function postQGenFile(payload: {
  path: string; k?: number; chunk_size?: number; chunk_overlap?: number;
}) {
  const res = await fetch(`${BASE}/qgen/file`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("QGen failed");
  return await res.json() as { file: string; count: number; items: string[] };
}
