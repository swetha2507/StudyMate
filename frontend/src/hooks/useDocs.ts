import { useEffect, useState, useCallback } from "react";
import { fetchDocs } from "../api/client";

export function useDocs() {
  const [docs, setDocs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- New: refresh function ---
  const refreshDocs = useCallback(() => {
    setLoading(true);
    setError(null);

    fetchDocs()
      .then(items => setDocs(items))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Initial load
  useEffect(() => {
    refreshDocs();
  }, [refreshDocs]);

  return { docs, loading, error, refreshDocs };
}
