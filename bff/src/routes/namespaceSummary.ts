import { Request, Response } from 'express';
import { k8sRequest } from '../utils/k8sClient';
import { PodCounts, NamespaceInfo, NamespaceSummaryResponse } from '../types';

function countPods(items: any[]): PodCounts {
  const counts: PodCounts = {
    total: items.length,
    running: 0,
    pending: 0,
    succeeded: 0,
    failed: 0,
    unknown: 0,
  };

  for (const item of items) {
    const phase = item.status?.phase;
    switch (phase) {
      case 'Running':
        counts.running++;
        break;
      case 'Pending':
        counts.pending++;
        break;
      case 'Succeeded':
        counts.succeeded++;
        break;
      case 'Failed':
        counts.failed++;
        break;
      default:
        counts.unknown++;
        break;
    }
  }

  return counts;
}

export async function namespaceSummaryHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const projectsData = await k8sRequest(
      token,
      '/apis/project.openshift.io/v1/projects',
    );

    const results = await Promise.allSettled(
      projectsData.items.map(async (project: any) => {
        const name = project.metadata.name;
        const phase = project.status?.phase || 'Active';
        const podsData = await k8sRequest(
          token,
          `/api/v1/namespaces/${name}/pods`,
        );
        return {
          name,
          phase,
          pods: countPods(podsData.items || []),
        } as NamespaceInfo;
      }),
    );

    const namespaces: NamespaceInfo[] = results
      .filter(
        (r): r is PromiseFulfilledResult<NamespaceInfo> =>
          r.status === 'fulfilled',
      )
      .map((r) => r.value);

    const response: NamespaceSummaryResponse = { namespaces };
    res.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Namespace summary error:', message);
    res.status(502).json({ error: message });
  }
}
