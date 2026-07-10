export interface PodCounts {
  total: number;
  running: number;
  pending: number;
  succeeded: number;
  failed: number;
  unknown: number;
}

export interface NamespaceInfo {
  name: string;
  phase: string;
  pods: PodCounts;
}

export interface NamespaceSummaryResponse {
  namespaces: NamespaceInfo[];
}
