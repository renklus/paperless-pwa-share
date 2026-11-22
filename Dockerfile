FROM node:24.22.3-alpine@sha256:116b800c3754b440ee0aa3ed2f20f5bf3d99a554bfd9adeea09ea8017f6e85f5 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG APP_VERSION=dev
ARG APP_NAME=
ENV VITE_APP_VERSION=$APP_VERSION \
    APP_NAME=$APP_NAME
RUN npm run build

FROM joseluisq/static-web-server:2.44.3@sha256:ccf2d666ffe5f8ef2ec96bc40f07757605998c04b78f7d8fdb98a584dd4f5717
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
