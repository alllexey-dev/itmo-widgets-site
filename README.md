# ITMO.Widgets — site

Static site for `https://widgets.alllexey.dev`: the landing page, the privacy
policy and the FAQ of the Android application
[ITMO.Widgets](https://github.com/alllexey-dev/ITMO.Widgets).

## Layout

- `site/` — everything that is served: `index.html`, `privacy.html`,
  `style.css`, `img/`.
- `site/img/light`, `site/img/night` — screenshots per colour scheme; the pages
  pick one with `<picture>` and `prefers-color-scheme`.

## Screenshots

Every screenshot is rendered on an emulator by the Android project's
instrumentation class `SiteScreenshotCapture` from invented, lifelike fixture
data; nothing comes from a real account. To regenerate, in the app repository:

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

Then convert to WebP: `cwebp -q 82 -resize 720 0 in.png -o out.webp`. Widget
pictures come from `WidgetPreviewImageCapture` the same way.

## Local preview

```bash
python3 -m http.server 8765 --directory site
```

## Deployment

The domain is served by the shared `nginx-hub` on `alllexey.dev`, which only
proxies to containers on the `web` network. The site is therefore its own
`nginx:alpine` container (`compose.yml` at the root, config `deploy/site.nginx.conf`)
in `/mnt/raid/srv/web/itmowidgets-web`, and the hub's
`conf.d/widgets.alllexey.dev.conf` sends `/api/` to the backend container and
everything else to the site (`deploy/nginx-hub.widgets.snippet.conf`).

Update: `git pull` in the server directory; the container serves the files
directly, no restart needed. Check with `nginx -t` inside `nginx-hub` before a
reload whenever the hub config changes.
