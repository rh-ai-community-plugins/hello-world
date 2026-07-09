import { useState, useEffect, useCallback } from 'react';

export type PodCounts = {
  total: number;
  running: number;
  pending: number;
  succeeded: number;
  failed: number;
  unknown: number;
};

export type NamespaceInfo = {
  name: string;
  phase: string;
  pods: PodCounts;
};

export type NamespaceSummaryData = {
  namespaces: NamespaceInfo[];
};

export function useNamespaceSummary() {
  const [data, setData] = useState<NamespaceSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch('/hello-world/api/namespace-summary')
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch namespace summary: ${res.status}`);
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
