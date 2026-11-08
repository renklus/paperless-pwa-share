import "fake-indexeddb/auto";
import { expect, test } from "vitest";
import { loadConfig, normalizeUrl, saveConfig } from "./config";
import { deleteShare, loadShare, saveShare } from "./shares";

test("normalizeUrl strips trailing slashes and requires https", () => {
  expect(normalizeUrl(" https://p.example// ")).toBe("https://p.example");
  expect(normalizeUrl("https://p.example/sub/")).toBe("https://p.example/sub");
  expect(() => normalizeUrl("http://p.example")).toThrow("https");
});

test("config round-trips through IndexedDB", async () => {
  await saveConfig({ baseUrl: "https://p.example", token: "t" });
  expect(await loadConfig()).toEqual({ baseUrl: "https://p.example", token: "t" });
});

test("shares are stored and deleted", async () => {
  await saveShare("id", [new File(["x"], "a.txt")]);
  expect((await loadShare("id"))?.[0].name).toBe("a.txt");
  await deleteShare("id");
  expect(await loadShare("id")).toBeUndefined();
});
