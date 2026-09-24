# Landing (site/) and the web app (web/) in one nginx image:
# the landing at /, the single-page app at /app/.
FROM node:22-alpine AS web
WORKDIR /web
COPY web/package.json web/package-lock.json web/.npmrc ./
RUN npm ci --no-audit --no-fund
COPY web/ ./
RUN npm run build

FROM nginx:alpine
COPY deploy/site.nginx.conf /etc/nginx/conf.d/default.conf
COPY site/ /usr/share/nginx/html/
COPY --from=web /web/dist/ /usr/share/nginx/html/app/
