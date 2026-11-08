import { createStore, del, get, set } from "idb-keyval";

// Own database so the service worker and the page share the same store.
const store = createStore("pps-shares", "shares");

export const saveShare = (id: string, files: File[]) => set(id, files, store);
export const loadShare = (id: string) => get<File[]>(id, store);
export const deleteShare = (id: string) => del(id, store);
