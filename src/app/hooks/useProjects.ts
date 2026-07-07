import { useState, useEffect, useCallback } from 'react';

export type Project = {
  metadata: {
    name: string;
    uid: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
  status?: {
    phase: string;
  };
};

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch('/api/k8s/apis/project.openshift.io/v1/projects')
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch projects: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setProjects(data.items ?? []);
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

  return { projects, loading, error, refresh };
}
