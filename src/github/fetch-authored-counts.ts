import type { HttpTransport } from './http-transport.js';

export type AuthoredCounts = {
  pullRequestsOpenedCount: number | null;
  issuesOpenedCount: number | null;
};

export async function fetchAuthoredCounts(login: string, transport: HttpTransport): Promise<AuthoredCounts> {
  const [pullRequestsOpenedCount, issuesOpenedCount] = await Promise.all([
    fetchSearchTotalCount(transport, login, 'pr'),
    fetchSearchTotalCount(transport, login, 'issue'),
  ]);
  return { pullRequestsOpenedCount, issuesOpenedCount };
}

async function fetchSearchTotalCount(
  transport: HttpTransport,
  login: string,
  type: 'pr' | 'issue',
): Promise<number | null> {
  try {
    const response = await transport.get(
      `https://api.github.com/search/issues?q=author:${login}+type:${type}&per_page=1`,
    );
    if (response.status !== 200) {
      return null;
    }
    const totalCount = (JSON.parse(response.body) as { total_count?: unknown }).total_count;
    return typeof totalCount === 'number' ? totalCount : null;
  } catch {
    return null;
  }
}
