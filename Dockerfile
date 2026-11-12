FROM node:24.22.3-alpine@sha256:116b800c3754b440ee0aa3ed2f20f5bf3d99a554bfd9adeea09ea8017f6e85f5 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG APP_VERSION=dev
ENV VITE_APP_VERSION=$APP_VERSION
RUN npm run build

FROM joseluisq/static-web-server:2.44.1@sha256:94618e3d17802265a21926217e6f9e7832b311b6fbf5933684001739fafed06a
ARG APP_VERSION=dev
LABEL org.opencontainers.image.title="paperless-pwa-share" \
      org.opencontainers.image.description="Android share-sheet PWA that uploads files to paperless-ngx" \
      org.opencontainers.image.version="$APP_VERSION" \
      org.opencontainers.image.licenses="Unlicense OR 0BSD"
COPY --from=build /app/dist /public
COPY sws.toml /sws.toml
ENV SERVER_CONFIG_FILE=/sws.toml
USER 65534
EXPOSE 8080
