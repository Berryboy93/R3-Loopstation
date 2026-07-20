---
name: API routing & health check
description: How the api-server is routed in this monorepo and the false-positive health-check trap.
---

- The Express api-server is proxied on path prefix `/api` (see `artifacts/api-server/.replit-artifact/artifact.toml`, `paths = ["/api"]`); the frontend health check polls `/api/healthz`.
- **Trap:** any wrong API path (e.g. `/api-server/...`) falls through to the r3-loop SPA, which returns 200 HTML — so a fetch-based "online" check reports a false positive. **How to apply:** verify new API endpoints with curl and confirm the response is JSON, not HTML; check api-server request logs to prove the request reached Express.
- api-server has a JSON 404 catch-all and a 4-arg JSON error handler after the `/api` router — keep new middleware above them.
