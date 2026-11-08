import { afterEach, expect, test, vi } from "vitest";
import { getTask, testConnection, uploadDocument } from "./paperless";

const cfg = { baseUrl: "https://p.example", token: "abc" };
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
afterEach(() => vi.unstubAllGlobals());

test("uploadDocument posts the file with the token and returns the task id", async () => {
  const fetchMock = vi.fn().mockResolvedValue(reply("task-1"));
  vi.stubGlobal("fetch", fetchMock);
  expect(await uploadDocument(cfg, new File(["x"], "a.pdf"))).toBe("task-1");
  const [url, init] = fetchMock.mock.calls[0];
  expect(url).toBe("https://p.example/api/documents/post_document/");
  expect(init.headers.Authorization).toBe("Token abc");
  expect((init.body as FormData).get("document")).toBeInstanceOf(File);
});

test("getTask returns the first matching task", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(reply([{ status: "SUCCESS", related_document: 7 }])));
  expect((await getTask(cfg, "t")) ?? {}).toMatchObject({ status: "SUCCESS", related_document: 7 });
});

test("non-2xx responses throw with the status", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("nope", { status: 403 })));
  await expect(testConnection(cfg)).rejects.toThrow("403");
});
