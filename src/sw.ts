/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";
import { saveShare } from "./shares";

declare const self: ServiceWorkerGlobalScope;

self.skipWaiting();
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "POST" || url.pathname !== "/share-target") return;
  event.respondWith((async () => {
    const files = (await event.request.formData()).getAll("files").filter((f): f is File => f instanceof File);
    const id = crypto.randomUUID();
    await saveShare(id, files);
    return Response.redirect(`/?share=${id}`, 303);
  })());
});
