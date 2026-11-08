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

/** Returns the ids of all tags marked as inbox tags in paperless. */
export async function getInboxTagIds(c: Config): Promise<number[]> {
  const ids: number[] = [];
  let url: string | null = `${c.baseUrl}/api/tags/?is_inbox_tag=true&page_size=100`;
  while (url) {
    const page: { results: { id: number }[]; next?: string | null } = await (await check(await fetch(url, { headers: headers(c) }))).json();
    ids.push(...page.results.map((t) => t.id));
    url = page.next ? new URL(page.next, c.baseUrl).href : null;
  }
  return ids;
}

/** Uploads one file, tagged with all inbox tags (requested fresh each time), and returns the consume task id. */
export async function uploadDocument(c: Config, file: File): Promise<string> {
  const tagIds = await getInboxTagIds(c);
  const body = new FormData();
  body.append("document", file, file.name);
  for (const id of tagIds) body.append("tags", String(id));
  const res = await check(await fetch(`${c.baseUrl}/api/documents/post_document/`, { method: "POST", headers: headers(c), body }));
  return res.json();
}

export async function getTask(c: Config, id: string): Promise<Task | undefined> {
  const res = await check(await fetch(`${c.baseUrl}/api/tasks/?task_id=${encodeURIComponent(id)}`, { headers: headers(c) }));
  return ((await res.json()) as Task[])[0];
}
