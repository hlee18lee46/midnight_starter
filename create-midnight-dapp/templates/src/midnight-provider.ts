// src/midnight-provider.ts
declare global {
  interface Window {
    cardano?: { midnight?: any };
    midnight?: Record<string, any>; // e.g. { mnLace: {...}, lace: {...} }
  }
}

/** Prefer window.midnight providers (mnLace, lace), fall back to window.cardano.midnight */
export function getMidnightProvider(): any | null {
  const m = (window as any)?.midnight;
  if (m && typeof m === "object") {
    if (m.mnLace) return m.mnLace;
    if (m.lace) return m.lace;
    const k = Object.keys(m).find((x) => m[x] && typeof m[x] === "object");
    if (k) return m[k];
  }
  // fallback to old-style
  return (window as any)?.cardano?.midnight ?? null;
}
