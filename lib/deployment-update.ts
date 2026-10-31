/** A failed/offline version check must never interrupt the current page. */
export async function getNewDeployment(currentVersion: string, signal: AbortSignal): Promise<string | null> {
  try {
    const response = await fetch(`/api/deployment-version?t=${Date.now()}`, { cache: 'no-store', signal });
    if (!response.ok) return null;
    const data: unknown = await response.json();
    if (!data || typeof data !== 'object' || !('version' in data)) return null;
    const version = data.version;
    return typeof version === 'string' && version.length > 0 && version !== currentVersion ? version : null;
  } catch {
    return null;
  }
}
