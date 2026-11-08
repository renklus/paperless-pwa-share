import { get, set } from "idb-keyval";

export interface Config { baseUrl: string; token: string }

export function normalizeUrl(raw: string): string {
  const u = new URL(raw.trim());
  if (u.protocol !== "https:") throw new Error("The paperless URL must use https://");
  return (u.origin + u.pathname).replace(/\/+$/, "");
}

export const loadConfig = () => get<Config>("pps-config");
export const saveConfig = (c: Config) => set("pps-config", c);
