# ITMO.Widgets — сайт и веб-версия

Всё, что отдаётся на `https://widgets.alllexey.dev`, кроме API:

- лендинг и политика конфиденциальности Android-приложения
  [ITMO.Widgets](https://github.com/alllexey-dev/ITMO.Widgets) — на `/`;
- веб-версия с админкой для модераторов и администратора — на `/app/`.

## Структура

- `site/` — лендинг: `index.html`, `privacy.html`, `style.css`, `img/`.
  Скриншоты лежат в `site/img/light` и `site/img/night`, страница выбирает их
  через `<picture>` и `prefers-color-scheme`.
- `web/` — веб-версия (Vite, React, TypeScript), подробности в
  [`web/README.md`](web/README.md).
- `Dockerfile` — собирает `web/` и кладёт лендинг и веб-версию в один образ
  `nginx:alpine`; конфиг — `deploy/site.nginx.conf`.
- `compose.yml` — прод (контейнер `itmowidgets-web`), `compose.dev.yml` — dev
  (контейнер `itmowidgets-web-dev`).

## Скриншоты лендинга

Все скриншоты снимаются на эмуляторе классом `SiteScreenshotCapture` из
Android-проекта на выдуманных данных; реальных аккаунтов там нет. В репозитории
приложения:

```bash
adb shell cmd uimode night no
adb shell am instrument -w -e captureScreenshots true -e siteTheme light \
  -e class dev.alllexey.itmowidgets.site.SiteScreenshotCapture \
  dev.alllexey.itmowidgets.test/androidx.test.runner.AndroidJUnitRunner
adb shell cmd uimode night yes
adb shell am instrument -w -e captureScreenshots true -e siteTheme night \
  -e class dev.alllexey.itmowidgets.site.SiteScreenshotCapture \
  dev.alllexey.itmowidgets.test/androidx.test.runner.AndroidJUnitRunner
adb pull /sdcard/Android/data/dev.alllexey.itmowidgets/cache/site-screenshots-light
adb pull /sdcard/Android/data/dev.alllexey.itmowidgets/cache/site-screenshots-night
```

Затем перевести в WebP: `cwebp -q 82 -resize 720 0 in.png -o out.webp`.
Картинки виджетов так же снимает `WidgetPreviewImageCapture`.

## Локальный просмотр

Лендинг:

```bash
python3 -m http.server 8765 --directory site
```

Веб-версия (откроется на `http://localhost:5173/app/`):

```bash
cd web && npm install && npm run dev
```

## Развёртывание

Домены обслуживает общий `nginx-hub` на `alllexey.dev`, он проксирует только в
контейнеры сети `web`.

- Прод: клон в `/mnt/raid/srv/web/itmowidgets-web`, hub
  (`conf.d/widgets.alllexey.dev.conf`) отправляет `/api/` в бэкенд, всё
  остальное — в `itmowidgets-web:80` (`deploy/nginx-hub.widgets.snippet.conf`).
- Dev: hub `dev.widgets.alllexey.dev` отправляет `/app/` в
  `itmowidgets-web-dev:80`, остальное — в dev-бэкенд.

Обновление — после `git pull` пересобрать образ, иначе изменения лендинга и
веб-версии не попадут в контейнер:

```bash
git pull && docker compose up -d --build
```

Dev:

```bash
git pull && docker compose -f compose.dev.yml up -d --build
```

Если меняется конфиг hub, перед перезагрузкой проверить его `nginx -t` внутри
контейнера `nginx-hub`.
