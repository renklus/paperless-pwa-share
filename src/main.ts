import "./styles.css";
import { loadConfig, normalizeUrl, saveConfig, type Config } from "./config";
import { getTask, testConnection, uploadDocument } from "./paperless";
import { deleteShare, loadShare } from "./shares";

if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js");

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const hint = (e: unknown) =>
  e instanceof TypeError
    ? "Could not reach paperless. Check the URL, that it uses HTTPS, and that PAPERLESS_CORS_ALLOWED_HOSTS contains this app's origin."
    : String(e instanceof Error ? e.message : e);

// ---- settings view ----
async function showSettings() {
  $("settings").hidden = false;
  $("version").textContent = import.meta.env.VITE_APP_VERSION;
  const form = $<HTMLFormElement>("settings-form");
  const msg = $("settings-msg");
  const saved = await loadConfig();
  if (saved) { form.url.value = saved.baseUrl; form.token.value = saved.token; }
  const read = (): Config => ({ baseUrl: normalizeUrl(form.url.value), token: form.token.value.trim() });
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await saveConfig(read());
      if (sessionStorage.getItem("pps-pending")) return location.reload(); // continue the pending share
      msg.textContent = "Saved.";
    } catch (err) { msg.textContent = hint(err); }
  });
  $("test").addEventListener("click", async () => {
    if (!form.reportValidity()) return;
    msg.textContent = "Testing…";
    try { await testConnection(read()); msg.textContent = "Connection OK."; } catch (err) { msg.textContent = hint(err); }
  });
}

// ---- share view ----
async function showShare(id: string) {
  const cfg = (await loadConfig())!;
  $("share").hidden = false;
  const files = (await loadShare(id)) ?? [];
  const list = $("files");
  const retry = $("retry");
  const done = new Set<number>();

  const rows = files.map((f) => {
    const li = document.createElement("li");
    li.append(f.name);
    const status = document.createElement("span");
    status.className = "status";
    li.append(status);
    list.append(li);
    return { li, status };
  });

  async function run(i: number) {
    const { li, status } = rows[i];
    try {
      status.textContent = "Uploading…";
      const task = await uploadDocument(cfg, files[i]);
      for (let delay = 1000; ; delay = Math.min(delay * 1.5, 8000)) {
        status.textContent = "Waiting for paperless to process…";
        await sleep(delay);
        const t = await getTask(cfg, task);
        if (t?.status === "SUCCESS") {
          status.textContent = "Done. ";
          if (t.related_document) {
            const a = document.createElement("a");
            a.href = `${cfg.baseUrl}/documents/${t.related_document}/details`;
            a.textContent = "Open in paperless";
            status.append(a);
          }
          break;
        }
        if (t?.status === "FAILURE") { status.textContent = `Failed: ${t.result ?? "unknown error"}`; break; }
      }
      done.add(i); // paperless accepted the file; no retry needed
    } catch (err) {
      status.textContent = `Error: ${hint(err)}`;
      li.dataset.failed = "1";
    }
  }

  async function runAll() {
    retry.hidden = true;
    await Promise.all(rows.map((_, i) => (done.has(i) ? undefined : run(i))));
    if (done.size === files.length) await deleteShare(id); else retry.hidden = false;
  }
  retry.addEventListener("click", runAll);
  if (!files.length) rows.length || (list.textContent = "No files were received.");
  else runAll();
}

// ---- router ----
const pending = new URLSearchParams(location.search).get("share") ?? sessionStorage.getItem("pps-pending");
if (pending && (await loadConfig())) {
  sessionStorage.removeItem("pps-pending");
  showShare(pending);
} else {
  if (pending) sessionStorage.setItem("pps-pending", pending); // keep it until settings are saved
  showSettings();
}
