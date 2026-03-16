import { useState, useEffect } from 'react';

/**
 * Fetches the current app version from /version.json.
 * Updates are handled automatically by the service worker (skipWaiting + clients.claim).
 */
export function useAppUpdate() {
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/version.json?t=${Date.now()}`)
      .then((res) => res.json())
      .then((data) => setCurrentVersion(data.version?.trim() ?? null))
      .catch(() => setCurrentVersion(null));
  }, []);

  return { currentVersion };
}
