// the dashboard code reads the browser's storage and document: give the tests a tiny stand-in
const store = new Map<string, string>();
Object.assign(globalThis, {
  localStorage: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) },
  document: { documentElement: { lang: "bn", classList: { toggle: () => undefined } } },
});
