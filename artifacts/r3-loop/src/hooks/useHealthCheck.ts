import { useState, useEffect } from 'react';

/**
 * Polls `url` every `intervalMs` milliseconds.
 * Returns:
 *   null    — first check still pending
 *   true    — last check returned HTTP 2xx
 *   false   — last check failed (network error, timeout, or non-2xx)
 */
export function useHealthCheck(url: string, intervalMs = 6000): boolean | null {
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    let inflight: AbortController | null = null;

    const check = async () => {
      const ctrl = new AbortController();
      inflight = ctrl;
      const tid = setTimeout(() => ctrl.abort(), 3000); // 3 s timeout per check
      try {
        const res = await fetch(url, { signal: ctrl.signal });
        if (active) setOnline(res.ok);
      } catch {
        if (active) setOnline(false);
      } finally {
        clearTimeout(tid);
      }
    };

    check();                                    // immediate first check
    const id = setInterval(check, intervalMs);  // then periodic
    return () => {
      active = false;
      clearInterval(id);
      inflight?.abort(); // don't leave a request in flight after unmount
    };
  }, [url, intervalMs]);

  return online;
}
