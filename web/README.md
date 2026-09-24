# ITMO.Widgets — веб-приложение

Веб-версия ITMO.Widgets на `https://<домен>/app/` (сначала
`https://dev.widgets.alllexey.dev/app/`). Первый раздел — админка для
модераторов и администратора. Вход через телефон: сайт показывает QR и код,
приложение подтверждает вход, бэкенд ставит httpOnly-cookie `iw_session`.

Стек: Vite, React 18, TypeScript (strict), React Router (`basename="/app"`),
TanStack Query v5, CSS Modules, Vitest + Testing Library + MSW.

## Запуск

Нужен Node.js 22.12 или новее.

```bash
cd web
npm install
npm run dev
```

Приложение открывается на `http://localhost:5173/app/`. Запросы `/api` уходят
на `https://dev.widgets.alllexey.dev` через прокси Vite. Cookie сессии выдаётся
с `Secure` и `Path=/api`, поэтому на `http://localhost` вход через dev-бэкенд
не сохранится; для проверки входа используйте dev-домен.

## Команды

| Команда             | Что делает                        |
| ------------------- | --------------------------------- |
| `npm run dev`       | Dev-сервер с прокси `/api`        |
| `npm run build`     | Проверка типов и сборка в `dist/` |
| `npm run preview`   | Раздача собранного `dist/`        |
| `npm run lint`      | ESLint                            |
| `npm run typecheck` | `tsc --noEmit`                    |
| `npm test`          | Vitest (jsdom, MSW)               |
| `npm run format`    | Prettier                          |

Перед коммитом: `npm run lint && npm run typecheck && npm test && npm run build`.

## Структура

- `src/app/` — корень приложения, маршруты, оболочка (боковая навигация,
  верхняя панель, меню аккаунта), навигация по ролям.
- `src/api/client.ts` — `fetch` с `credentials: 'same-origin'`, заголовок
  `X-Web-Request: 1` для изменяющих запросов, разворачивание `ApiResponse`,
  `ApiError` с кодом ошибки бэкенда; 401 на любом запросе и 403 на
  `/api/web/auth/me` ведут на `/app/login`.
- `src/features/<раздел>/` — разделы: `auth`, `home`, далее модерация,
  пользователи, дашборд, система, журнал.
- `src/ui/` — дизайн-система: токены (`tokens.css`), компоненты, тема.
- `src/test/` — настройка Vitest, MSW-сервер, хелперы рендера.

## Дизайн

Токены повторяют лендинг (`site/style.css`) и роли Material 3 приложения:
`--primary #3a5488`, плоские поверхности, радиус карточек 20 px, кнопки-пилюли
48 px, сетка 4 px, шрифт Roboto со системными запасными. Тёмная тема — по
`prefers-color-scheme` или вручную в меню аккаунта (хранится в `localStorage`,
ключ `iw-theme`). Иконки — Material Symbols Rounded через Google Fonts.
Статус никогда не передаётся только цветом.

## Развёртывание

Образ собирается из корневого `Dockerfile`: `web/` собирается в `node:22-alpine`,
результат копируется в `nginx:alpine` в `/usr/share/nginx/html/app` рядом с
лендингом. Конфигурация nginx — `deploy/site.nginx.conf`: `/app/*` без файла
отдаёт `/app/index.html` (без кеша), `/app/assets/` кешируется навсегда.

```bash
docker compose up -d --build                      # прод
docker compose -f compose.dev.yml up -d --build   # dev, контейнер itmowidgets-web-dev
```
