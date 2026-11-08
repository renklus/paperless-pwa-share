import type { Config } from "./config";

export interface Task { status: string; result?: string | null; related_document?: string | number | null }

const headers = (c: Config) => ({ Authorization: `Token ${c.token}`, Accept: "application/json; version=9" });

async function check(res: Response): Promise<Response> {
  if (!res.ok) throw new Error(`paperless answered ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res;
}

export async function testConnection(c: Config): Promise<void> {
  await check(await fetch(`${c.baseUrl}/api/ui_settings/`, { headers: headers(c) }));
}

/** Uploads one file and returns the consume task id. */
export async function uploadDocument(c: Config, file: File): Promise<string> {
  const body = new FormData();
  body.append("document", file, file.name);
  const res = await check(await fetch(`${c.baseUrl}/api/documents/post_document/`, { method: "POST", headers: headers(c), body }));
  return res.json();
}

export async function getTask(c: Config, id: string): Promise<Task | undefined> {
  const res = await check(await fetch(`${c.baseUrl}/api/tasks/?task_id=${encodeURIComponent(id)}`, { headers: headers(c) }));
  return ((await res.json()) as Task[])[0];
}
