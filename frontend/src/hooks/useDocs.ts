import { useEffect, useState } from "react";
import { fetchDocs } from "../api/client";

export function useDocs() {
  const [docs, setDocs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchDocs()
      .then(items => mounted && setDocs(items))
      .catch(e => mounted && setError(e.message))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  return { docs, loading, error };
}
