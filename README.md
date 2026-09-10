# Still — Next.js auth frontend

A responsive frontend for `../deeplearn`, with registration, login, username onboarding, a protected memory game, an account page, profile-photo upload, rotating sessions, and logout. The visual direction uses warm neutrals, sage surfaces, local fonts, restrained motion, and keyboard-accessible controls.

## Run locally

Requires Node.js 22.9+ and npm.

```sh
cd frontend
npm ci
cp .env.example .env.local
# Edit AUTH_API_URL in .env.local to your deployed FastAPI base URL.
npm run dev
```

Open http://localhost:3000. `AUTH_API_URL` must point to the FastAPI origin (or deployment prefix), without `/user-service`. The fallback in `.env.example` is a local backend at port 8000. There is no production demo login or auth bypass. An unconfigured backend shows a service error when submitting a form.

## Routes and organization

```text
src/
  app/
    (auth)/login/          Public sign-in
    (auth)/register/       Public registration
    (protected)/onboarding/  Authenticated username setup
    (protected)/play/      Authenticated, onboarded memory game
    (protected)/account/   Authenticated profile and photo upload
    api/session/refresh/  Same-origin POST for cookie rotation
    session/              Session recovery screen
    layout.tsx            Root metadata and local fonts
    globals.css           Responsive styles and design tokens
  components/             Forms, navigation, game, shared visuals
  lib/
    contracts.ts          Validation and public types
    api.ts                Server-only FastAPI transport
    session.ts            HTTP-only cookies and server-side guards
    actions.ts            Validated server mutations
```

`/` leads to `/play`. Every protected page independently calls `requireUser()` and validates the bearer token through FastAPI `/me`. Protection does not rely on a shared layout, cookie presence, or a client redirect. Onboarding is required before the game. Account data remains accessible to authenticated users before onboarding.

## Authentication

The browser sends forms to Next.js Server Actions. Next.js talks to FastAPI and stores the returned access token and refresh cookie in host-only, HTTP-only, SameSite=Lax cookies. Production cookies are Secure. Tokens never enter client props or localStorage. FastAPI's refresh cookie is relayed server-to-server, so separate frontend/backend domains do not require browser CORS configuration.

Each guarded server render calls `/me` with the access token. Invalid/missing access with a refresh cookie goes to `/session`, which performs a same-origin POST to refresh and then returns to an allowlisted page. FastAPI rotates the refresh token; both local cookies are updated. Web Locks serialize refresh requests between tabs on supported browsers. Without Web Locks, simultaneous refreshes can cause a session to require login again; this fails closed. Transient backend errors offer retry rather than clearing the session.

Logout revokes the refresh token through FastAPI before clearing cookies. If revocation cannot reach the backend, it shows an error and permits retry. Existing access tokens remain valid until their FastAPI expiry; immediate access-token revocation would require backend support.

Forms validate on both client and server. Mutating Server Actions use Next.js origin validation; the refresh route explicitly checks Origin. API calls time out, disable caching, and map validation, rate-limit, and service errors to user-facing messages. Private API operations verify auth separately. File uploads are limited to 2 MB and JPEG/PNG/WebP, matching the backend; Next.js allows a 3 MB request envelope for multipart overhead.

FastAPI currently limits `/me` to 10 requests/minute. Normal navigation, prefetching, or several users behind the Next.js server IP may exhaust that shared limit because the backend sees the proxy IP. Configure trusted proxy/IP handling and appropriate backend limits before production. Do not blindly trust public `X-Forwarded-For` headers. Navigation prefetching is disabled to reduce unnecessary auth checks.

## API mapping

| Feature        | FastAPI endpoint                        |
| -------------- | --------------------------------------- |
| Register       | `POST /user-service/register`           |
| Login          | `POST /user-service/login`              |
| Current user   | `GET /user-service/me`                  |
| Refresh        | `POST /user-service/refresh`            |
| Logout         | `POST /user-service/logout`             |
| Username setup | `POST /user-service/onboarding`         |
| Photo          | `POST /user-service/profile/upload-pic` |
| Current photo  | `GET /user-service/profile/pic`         |
| Delete photo   | `DELETE /user-service/profile/pic`      |

Google OAuth is wired for local use. The browser starts at the same-origin `/api/auth/google` proxy, FastAPI handles Google and redirects to `/auth/callback`, and that route consumes the short-lived access token plus the HttpOnly refresh cookie before redirecting to `/play`. Set the Google OAuth authorized redirect URI to `http://localhost:8000/auth/google/callback`, and set `FRONTEND_URL=http://localhost:3000` in FastAPI. Keep local hosts consistent: open the frontend at `http://localhost:3000` and use `AUTH_API_URL=http://localhost:8000`; mixing `localhost` and `127.0.0.1` breaks Authlib’s state cookie. For production, replace the token-in-redirect handoff with a one-time authorization code or server-side exchange so the access token never appears in a URL. Password reset and email verification still need backend endpoints before adding those flows.

The memory game is a temporary client-side activity; scores are per-user, per-browser localStorage values, not trusted server records. It supports full completion, restart, keyboard interaction, match announcements, and reduced motion.

## Verification

```sh
npm run lint
npm run typecheck
npm run build
npx playwright install chromium
npm test
# Optional: run the same suite against the production build.
TEST_PRODUCTION=1 npm test
```

Playwright starts an isolated contract fixture at port 8100 and the frontend at port 3100. Tests cover direct protected access, forged cookies, invalid login, rate-limit feedback, registration/onboarding, solving the game, refresh rotation, photo submission, logout, rejected cross-origin refresh, and mobile overflow. The fixture exists only under `tests/`; the app never imports it. These tests validate the integration contract, not the deployed backend's behavior. Finish with a live registration/login/refresh/logout smoke test using your deployed URL.

## Deployment

Deploy `frontend/` to a Next.js Node host such as Vercel, or use a Node server:

```sh
npm ci
npm run build
npm start
```

Set `AUTH_API_URL`, `APP_ORIGIN` (the public frontend origin, without a trailing slash), and, if customized in FastAPI, `AUTH_REFRESH_COOKIE_NAME`. Serve production over HTTPS; secure cookies will not work over plain HTTP. Ensure the server can reach your backend and any reverse proxy preserves the public origin/host for POST origin checks. No secret from the backend `.env` belongs in this project. Keep the lockfile committed and use `npm ci` for repeatable installs.

The configuration also emits standalone output. To deploy it directly, copy `.next/static` to `.next/standalone/.next/static` alongside `.next/standalone/server.js`, then run that server with the environment set. This app requires a server runtime and cannot be deployed as a static export.

All pages currently request `noindex` because this is an auth validation app. Fonts are bundled locally. Headers block framing, object embedding, MIME sniffing, and unused browser device permissions. The CSP here is a baseline, not a strict script nonce policy.

Implementation follows the [Next.js authentication guide](https://nextjs.org/docs/app/guides/authentication) and [cookie API](https://nextjs.org/docs/app/api-reference/functions/cookies).
