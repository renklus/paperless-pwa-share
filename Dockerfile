FROM node:26-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG APP_VERSION=dev
ENV VITE_APP_VERSION=$APP_VERSION
RUN npm run build

FROM joseluisq/static-web-server:2
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
