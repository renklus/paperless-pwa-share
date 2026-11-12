FROM node:24.22.2-alpine@sha256:a34ab6d7f6f4813f4d0c5469d74685604b962fbdbf5793a7bc7b4998ecb867c8 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG APP_VERSION=dev
ENV VITE_APP_VERSION=$APP_VERSION
RUN npm run build

FROM joseluisq/static-web-server:2.44.2@sha256:23be6c04d474979d6e738081918f5874f88502a150d1123fd000719101a0f05c
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
