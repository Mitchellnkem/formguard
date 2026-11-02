import { webcrypto } from "node:crypto";
import { beforeEach } from "vitest";

Object.defineProperty(globalThis, "crypto", { value: webcrypto, configurable: true });

const store: Record<string, unknown> = {};

const local = {
  async get(key: string | string[] | null) {
    if (key === null) return { ...store };
    const keys = Array.isArray(key) ? key : [key];
    return Object.fromEntries(keys.filter((item) => item in store).map((item) => [item, store[item]]));
  },
  async set(values: Record<string, unknown>) {
    Object.assign(store, values);
  },
  async remove(keys: string | string[]) {
    for (const key of Array.isArray(keys) ? keys : [keys]) delete store[key];
  },
  async clear() {
    for (const key of Object.keys(store)) delete store[key];
  }
};

Object.defineProperty(globalThis, "chrome", {
  configurable: true,
  value: { storage: { local } }
});

beforeEach(async () => {
  document.body.replaceChildren();
  await local.clear();
  history.replaceState(null, "", "/test");
});
