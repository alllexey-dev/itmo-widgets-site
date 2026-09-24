# Web app architecture

How the web app in `web/` is put together: routing, the session, the API client,
the feature layout, tests and the bundle. The visual side is in
[`design.md`](design.md); the backend contracts are `docs/contracts/web.md` and
`docs/contracts/admin.md` in `itmo-widgets-backend`.

## Serving

The app is a single-page app built by Vite with `base: '/app/'`. The root
`Dockerfile` builds it on `node:22-alpine` and copies `dist/` into
`/usr/share/nginx/html/app` of the landing's `nginx:alpine` image.
`deploy/site.nginx.conf` falls back to `/app/index.html` for any `/app/*` path
without a file (`Cache-Control: no-cache`) and caches the hashed
`/app/assets/` for a year. `nginx-hub` routes `/api/` of the same domain to
Backend, so the app and the API share one origin: no CORS and a same-site cookie.

In development Vite serves `http://localhost:5173/app/` and proxies `/api` to
`https://dev.widgets.alllexey.dev` (`vite.config.ts`).

## Routing

`App` wraps everything in `AppProviders` (theme, TanStack Query, toasts) and a
`BrowserRouter` whose `basename` is `import.meta.env.BASE_URL` without the
trailing slash. Routes live in `src/app/routes.tsx`:

| Path                  | Page                            | Access      |
| --------------------- | ------------------------------- | ----------- |
| `/login`              | `LoginPage` (outside the shell) | anyone      |
| `/`                   | `HomePage`                      | signed in   |
| `/admin/moderation`   | `ModerationPage`                | `moderator` |
| `/admin/restrictions` | `RestrictionsPage`              | `moderator` |
| `/admin/dashboard`    | `DashboardPage`                 | `admin`     |
| `/admin/users`        | `UsersPage`                     | `admin`     |
| `/admin/users/:isu`   | `UserPage`                      | `admin`     |
| `/admin/sport`        | `SportPage`                     | `admin`     |
| `/admin/system`       | `SystemPage`                    | `admin`     |
| `/admin/audit`        | `AuditPage`                     | `admin`     |
| `*`                   | `NotFoundPage` (in the shell)   | signed in   |

`Shell` is the layout route: sidebar, top bar with the account menu, and an
`<Outlet>` rendered only after the session loads. Below 760 px the sidebar
becomes a drawer with a scrim, a focus trap and Esc to close.

`RequireAccess` is a layout route around each protected group. Without the
access it renders `ForbiddenPage` (`Нет доступа`) instead of the outlet, so the
page makes no requests. The sidebar comes from `NAV_GROUPS` in
`src/app/navigation.ts`, filtered by the same rule; a group without visible
items is hidden.

Page state that should survive a reload or a shared link lives in the query
string through `useSearchParams`: moderation `status`, `reason`, `page`, `case`;
restrictions `isu`, `all`, `page`; users `q`, `page`; audit `page`. Selecting a
case replaces the history entry instead of pushing one.

## Session

- `useSessionQuery()` loads `GET /api/web/auth/me` (`isu`, `name`, `pictureUrl`,
  `groups`, `roles`) with a 5-minute stale time and no retry.
- `Shell` provides the result through `SessionContext`; pages call
  `useSession()`, which throws outside the shell.
- `hasAccess(session, 'user' | 'moderator' | 'admin')` is the only role rule:
  `ADMIN` implies moderator rights. `useAccess(access)` wraps it for components.
  The backend enforces access; the UI only hides.
- `SessionLostRedirect` subscribes to `onSessionLost` from the API client. When a
  request answers 401, or `/api/web/auth/me` answers 403, it drops the session
  query and navigates to `/login` without a reload. The login page checks the
  session itself, so a failed check there is ignored.
- `useLogout()` posts `/api/web/auth/logout`, clears the whole query cache and
  navigates to `/login`.

### Phone sign-in

`LoginPage` redirects to `/` when a session exists. Otherwise
`useLoginChallenge` in `src/features/auth/`:

1. creates a challenge once on mount (`POST /api/web/auth/challenges`);
2. computes a local deadline from `expiresAt`, falling back to 2 minutes when
   the browser clock disagrees with the server (lifetime not in 0–10 minutes);
3. polls `GET /api/web/auth/challenges/{id}` with `X-Poll-Secret` every 2 s
   while the tab is visible (`usePageVisible`) and the deadline has not passed;
   returning to the tab polls at once;
4. replaces a code that expired, answered `EXPIRED` or 404, at most 5 times in
   a row (about 12 minutes, below the backend limit of 10 codes per address in
   10 minutes), then shows `Код устарел` with `Показать новый код`;
5. on `APPROVED` resets the session query and navigates to `/`.

Polling stops on the local deadline; the backend's extra minute for claiming a
late approval is not used. `?code=` on `/login` (a QR opened by a phone camera)
shows the code with a hint to enter it in the app. The QR encodes
`${origin}/app/login?code=<code>`; `parseLoginCode` accepts only the backend
alphabet.

## API client

All HTTP goes through `src/api/client.ts`:

- `api.get/post/put/patch/delete<T>(path, …)` over `apiRequest`, with
  `credentials: 'same-origin'`, `Accept: application/json`, JSON bodies and a
  `query` object (empty values are dropped).
- Every non-GET request carries `X-Web-Request: 1`, which Backend requires for
  cookie sessions (CSRF, answer `403 csrf` otherwise).
- The `ApiResponse` envelope `{success, data, error: {message, code}}` is
  unwrapped; the promise resolves with `data`.
- Failures throw `ApiError(message, status, code)` with helpers `isUnauthorized`
  (401), `isForbidden` (403) and `isNetwork` (status 0). Aborts rethrow the
  `AbortError` untouched.

Error codes:

| Code                | Source                          | Text (`src/api/errors.ts`)                 |
| ------------------- | ------------------------------- | ------------------------------------------ |
| `network`           | client, fetch failed (status 0) | `Нет соединения с сервером`                |
| `http_error`        | client, non-envelope failure    | the caller's fallback                      |
| `permission_denied` | Backend 403                     | `Недостаточно прав`                        |
| `not_found`         | Backend 404                     | `Не найдено`                               |
| `rate_limited`      | Backend 429                     | `Слишком много запросов, попробуйте позже` |
| `csrf`              | Backend 403                     | `Обновите страницу и попробуйте снова`     |

`errorText(error, fallback, overrides)` picks the override for the code, then
the table, then the fallback; pages pass overrides such as
`invalid_request_data` → `Проверьте пороги`. Backend messages are English and
technical and are never shown.

`createQueryClient()` sets the defaults: queries are fresh for 30 s, do not
refetch on focus, and retry at most twice, only for network failures and 5xx;
mutations never retry.

## Features layout

```text
src/
  app/        App, providers, routes, Shell, AccountMenu, navigation, RequireAccess,
              ForbiddenPage, NotFoundPage, queryClient
  api/        client.ts, errors.ts, admin.ts (AdminPage {items, page, size, total},
              shared admin shapes)
  features/
    auth/       login page, challenge hook, session, QR, countdown
    home/       HomePage
    moderation/ queue, case detail, decision dialogs, shortcuts, restrictions
    users/      users list, user page, moderator role switch
    dashboard/  DashboardPage, lazy TrendChart
    system/     SportPage, SystemPage (app version, moderation settings)
    audit/      AuditPage
  ui/         design system (see design.md)
  test/       Vitest setup, MSW server and handlers, synthetic admin data, render helpers
```

A feature keeps its pages, `api.ts` (query keys, `useQuery`/`useMutation`
hooks), `types.ts` (wire shapes from the backend contract), `labels.ts`
(Russian names, icons, badge tones) and CSS Modules together; tests sit next to
the code as `*.test.tsx`. Features import from `src/ui`, `src/api` and
`features/auth` for the session; `home` reads the open-case count from
`moderation`.

Query keys start with the area (`['admin', 'moderation', …]`,
`['admin', 'users', …]`, `['admin', 'audit', …]`), so a mutation invalidates a
whole area at once. A moderation decision writes the returned case into the
cache and invalidates the rest of the area; a role change also invalidates the
audit log. Paged lists keep the previous page on screen while the next loads.
The next case in the queue is prefetched.

## Testing

Vitest runs in jsdom with `src/test/setup.ts`:

- `server` from `src/test/server.ts` is an MSW node server started with
  `onUnhandledRequest: 'error'`, so every request a test makes must be mocked.
  Handlers are reset, `localStorage` cleared and `data-theme` removed after each
  test. `fetch` is never stubbed directly.
- Helpers: `ok(data)` and `fail(status, code)` build backend envelopes;
  `sessionOf(roles)`, `mockSession`, `mockSignedOut` (403 on `/me`, like the
  backend); `mockChallenges` and `mockPoll` for sign-in (a wrong poll secret is
  404); `mockOpenCases`.
- `src/test/admin.ts` holds synthetic admin data and handlers that filter and
  page like the backend (`pageOf`). No real accounts.
- `renderApp(route)` renders the real routes inside `AppProviders` and a
  `MemoryRouter`, so tests go through the shell, the session and access checks;
  `renderWithProviders(ui)` renders one component.
- CSS Modules use non-scoped class names in tests.
- Queries go by role and accessible name; one concept per test,
  Arrange-Act-Assert; private helpers are not tested.

Before calling work done:

```bash
npm run lint && npm run typecheck && npm test && npm run build
```

## Bundle

`npm run build` type-checks and emits one entry chunk with React, React Router,
TanStack Query, `qrcode` and every page, plus one CSS file. recharts is about as
large as the rest of the app together, so `DashboardPage` loads `TrendChart`
with `React.lazy` inside `Suspense` (a skeleton while it loads) and recharts
lands in its own chunk that only the dashboard downloads. Other pages are not
split. Material Symbols Rounded comes from Google Fonts; `public/theme-init.js`
runs before the bundle to apply a saved theme without a flash.
