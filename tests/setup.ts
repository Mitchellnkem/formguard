import { beforeEach } from "vitest";

const data: Record<string, unknown> = {};

const local = {
  async get(keys: string | string[] | null): Promise<Record<string, unknown>> {
    if (keys === null) return { ...data };
    const selected = Array.isArray(keys) ? keys : [keys];
    return Object.fromEntries(selected.filter((key) => key in data).map((key) => [key, data[key]]));
  },
  async set(items: Record<string, unknown>): Promise<void> {
    Object.assign(data, items);
  },
  async remove(keys: string | string[]): Promise<void> {
    for (const key of Array.isArray(keys) ? keys : [keys]) delete data[key];
  },
  async clear(): Promise<void> {
    for (const key of Object.keys(data)) delete data[key];
  }
};

Object.defineProperty(globalThis, "chrome", {
  configurable: true,
  value: { storage: { local } }
});

beforeEach(async () => {
  document.body.replaceChildren();
  await local.clear();
});
