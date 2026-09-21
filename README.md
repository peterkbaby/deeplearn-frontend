# Still frontend

Next.js frontend for the FastAPI service in `../deeplearn`.

## Authentication architecture

```text
Browser
  ├─ Axios → /user-service/* → Nginx → FastAPI
  ├─ localStorage: short-lived access token
  └─ HttpOnly cookie: rotating FastAPI refresh token

Google
  Browser → /auth/google → Nginx → FastAPI → Google
  Google → /auth/google/callback → FastAPI
  FastAPI → /auth/complete#access_token=… → browser
  Browser → /user-service/me → Redux session → /play
```

FastAPI is the only authority for login, Google OAuth, refresh, logout, and user
data. The frontend has no authentication route handlers, server actions, or
server-readable token cookies.

The hash fragment is intentional: browsers do not send it to Nginx or FastAPI,
so the access token does not enter proxy access logs. `/auth/complete` removes
the fragment immediately after it has stored the token and loaded `/me`.

Redux owns the shared session state: access token, user, and authentication
status. Components keep only local UI state such as form fields, pending state,
crop position, and modal visibility.

## Routes

| Route                 | Purpose                             |
| --------------------- | ----------------------------------- |
| `/login`, `/register` | Public authentication               |
| `/auth/complete`      | Google OAuth browser handoff        |
| `/play`               | Protected memory game               |
| `/docmind`            | Protected PDF upload and library    |
| `/docmind/[id]`       | Document summary and session chat   |
| `/onboarding`         | Protected username setup            |
| `/account`            | Protected account and profile photo |

Protected pages render a loading state while Redux restores the session. It
uses the local access token when available; otherwise it obtains one through
the FastAPI refresh cookie and loads `/me`. Axios retries one unauthorized
protected request after a refresh. A failed refresh clears the session and
returns the visitor to login.

## Local development

```sh
cd frontend
npm ci
cp .env.example .env.local
npm run dev
```

`AUTH_API_URL` and `DOCMIND_API_URL` are only used by local Next.js rewrites.
They let the browser keep using same-origin `/user-service`, `/auth/google`,
and `/doc-service` paths without running Nginx locally. `DOCMIND_API_URL`
defaults to `http://127.0.0.1:8000`; `/doc-service` is stripped before the
request reaches DocMind.

DocMind supports PDF upload, document listing, summaries, deletion, and
session-only document Q&A. The current backend does not expose PDF bytes or a
signed download URL, so the workspace reserves its preview area until secure
document delivery is available. It also does not expose conversation APIs, so
chat messages are not retained after leaving or reloading the page.

For local Google OAuth, FastAPI must use:

```text
FRONTEND_URL=http://localhost:3000
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback
COOKIE_SECURE=false
```

## Production with Nginx

Nginx owns the public routing:

```nginx
location /user-service/ { proxy_pass http://127.0.0.1:8000; }
location = /auth/google { proxy_pass http://127.0.0.1:8000; }
location = /auth/google/callback { proxy_pass http://127.0.0.1:8000; }
location /doc-service/ {
    client_max_body_size 55M;
    proxy_request_buffering off;
    proxy_pass http://127.0.0.1:8000/;
}
location / { proxy_pass http://127.0.0.1:3000; }
```

The browser and DocMind accept PDFs up to 50 MB. Nginx must use a slightly
larger request limit to allow for multipart form overhead. After changing this
configuration, validate it with `nginx -t` and reload Nginx.

Run the frontend as a normal Next.js server. This project intentionally does
not use standalone output:

```ini
# /etc/systemd/system/frontend.service
[Service]
WorkingDirectory=/home/ubuntu/deeplearn-frontend
ExecStart=/usr/bin/npm start
```

Deploy with:

```sh
cd ~/deeplearn-frontend
npm ci
npm run build
sudo systemctl restart frontend
sudo systemctl restart fastapi
```

Do not copy `.next/static`, do not run `.next/standalone/server.js`, and do
not add Next API proxy routes. Those were the sources of the stale builds,
missing CSS, invalid URL handling, and `0.0.0.0` OAuth redirects.

## Verification

```sh
npm run typecheck
npm run lint
npm run build
npx playwright install chromium
npm test
```

The Playwright suite uses a local FastAPI contract fixture and covers protected
routes, password login, refresh rotation, logout, and the direct Google entry
route.
