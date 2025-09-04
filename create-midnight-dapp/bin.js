#!/usr/bin/env node
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const log = (msg) => console.log(msg);
const run = (cmd, opts = {}) => execSync(cmd, { stdio: "inherit", ...opts });

function detectPM() {
  if (existsSync("pnpm-lock.yaml")) return { name: "pnpm", dlx: "pnpm dlx", install: "pnpm install" };
  if (existsSync("yarn.lock")) return { name: "yarn", dlx: "yarn dlx", install: "yarn install" };
  return { name: "npm", dlx: "npx", install: "npm install" };
}

function readJSON(path, fallback) {
  try { return JSON.parse(readFileSync(path, "utf8")); } catch { return fallback; }
}

function ensurePkgJSON() {
  if (!existsSync("package.json")) {
    log("→ No package.json found. Initializing…");
    run("npm init -y");
  }
}

function addScripts() {
  const pkg = readJSON("package.json", {});
  pkg.scripts ||= {};
  pkg.scripts.dev ||= "vite";
  pkg.scripts.build ||= "tsc -b && vite build";
  pkg.scripts.preview ||= "vite preview";
  writeFileSync("package.json", JSON.stringify(pkg, null, 2));
}

function addDeps(pm) {
  const devDeps = ["vite", "@vitejs/plugin-react", "typescript", "tslib"];
  const deps = ["react", "react-dom"];
  log("→ Installing dependencies…");
  run(`${pm.install} ${deps.join(" ")}`);
  run(`${pm.install} -D ${devDeps.join(" ")}`);
}

function ensureTsConfig() {
  if (!existsSync("tsconfig.json")) {
    const ts = {
      "compilerOptions": {
        "target": "ES2020",
        "lib": ["ES2020", "DOM", "DOM.Iterable"],
        "module": "ESNext",
        "moduleResolution": "Bundler",
        "jsx": "react-jsx",
        "strict": true,
        "skipLibCheck": true,
        "esModuleInterop": true,
        "forceConsistentCasingInFileNames": true,
        "noEmit": true
      },
      "include": ["src"]
    };
    writeFileSync("tsconfig.json", JSON.stringify(ts, null, 2));
  }
}

function ensureViteConfig() {
  if (!existsSync("vite.config.ts")) {
    const vite = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`;
    writeFileSync("vite.config.ts", vite);
  }
}

function ensureIndexHtml() {
  if (!existsSync("index.html")) {
    const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Midnight dApp</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;
    writeFileSync("index.html", html);
  }
}

function ensureSrcTree() {
  if (!existsSync("src")) mkdirSync("src", { recursive: true });
  if (!existsSync("src/components")) mkdirSync("src/components", { recursive: true });
  if (!existsSync("src/styles")) mkdirSync("src/styles", { recursive: true });

  // main.tsx
  if (!existsSync("src/main.tsx")) {
    const main = `import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/index.css'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)`;
    writeFileSync("src/main.tsx", main);
  }

  // Plain CSS entry (NO Tailwind, NO PostCSS)
  if (!existsSync("src/styles/index.css")) {
    const css = `/* Basic starter styles (no Tailwind) */
:root { color-scheme: dark; }

* { box-sizing: border-box; }

html, body, #root { height: 100%; }

body {
  margin: 0;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji', sans-serif;
  background-color: #0b1220;
  color: #e2e8f0;
}

button {
  font: inherit;
}`;
    writeFileSync("src/styles/index.css", css);
  }

  // midnight-provider.ts
  if (!existsSync("src/midnight-provider.ts")) {
    const mp = `declare global {
  interface Window {
    cardano?: { midnight?: any };
    midnight?: Record<string, any>;
  }
}

export function getMidnightProvider(): any | null {
  const m: any = (window as any)?.midnight;
  if (m && typeof m === "object") {
    if (m.mnLace) return m.mnLace;
    if (m.lace) return m.lace;
    const k = Object.keys(m).find((x) => m[x] && typeof m[x] === "object");
    if (k) return m[k];
  }
  return (window as any)?.cardano?.midnight ?? null;
}`;
    writeFileSync("src/midnight-provider.ts", mp);
  }

  // Navbar.tsx
  if (!existsSync("src/components/Navbar.tsx")) {
    const nav = `import { useState } from "react";
import { getMidnightProvider } from "../midnight-provider";

export default function Navbar() {
  const [connected, setConnected] = useState(false);

  const connectWallet = async () => {
    try {
      const provider = getMidnightProvider();
      if (!provider) throw new Error("Midnight provider not injected. Open Lace (Midnight testnet profile) and reload.");
      const api = typeof provider.enable === "function" ? await provider.enable() : provider;
      setConnected(true);
      window.dispatchEvent(new CustomEvent("midnight:connected", { detail: { api, provider } }));
    } catch (err:any) {
      alert(err?.message || String(err));
      console.error("Wallet connection failed:", err);
    }
  };

  return (
    <nav style={{
      position:"fixed", top:0, left:0, width:"100%", height:"3rem",
      display:"flex", alignItems:"center", justifyContent:"flex-end",
      paddingRight:"3rem", backgroundColor:"#111827", zIndex:50
    }}>
      <button onClick={connectWallet} style={{
        padding:"0.45rem 0.9rem", borderRadius:"0.55rem", border:"none",
        backgroundColor:"#4f46e5", color:"white", fontWeight:700,
        fontSize:"0.9rem", cursor:"pointer"
      }}>
        {connected ? "✅ Connected" : "Connect Midnight Lace Wallet"}
      </button>
    </nav>
  );
}`;
    writeFileSync("src/components/Navbar.tsx", nav);
  }

  // App.tsx (compact version that renders summary + keys)
  if (!existsSync("src/App.tsx")) {
    const app = `import { useEffect, useRef, useState } from "react";
import Navbar from "./components/Navbar";
import { getMidnightProvider } from "./midnight-provider";

type WalletState = {
  address?: string; addressLegacy?: string;
  coinPublicKey?: string; coinPublicKeyLegacy?: string;
  encryptionPublicKey?: string; encryptionPublicKeyLegacy?: string;
  balances?: any; [k: string]: any;
};

function deriveTDustBalanceFromState(s:any): string {
  if (!s) return "—";
  if (s?.balances?.tDUST != null) return String(s.balances.tDUST);
  if (s?.balances?.tdust != null) return String(s.balances.tdust);
  const arrays:any[]=[]; if (Array.isArray(s?.assets)) arrays.push(s.assets);
  if (Array.isArray(s?.balances)) arrays.push(s.balances);
  if (Array.isArray(s?.coins)) arrays.push(s.coins);
  for (const arr of arrays) {
    const hit = arr.find((x:any)=>x?.asset==="tDUST"||x?.ticker==="tDUST"||x?.symbol==="tDUST"||x?.denom==="tDUST");
    if (hit?.amount!=null) return String(hit.amount);
    if (hit?.balance!=null) return String(hit.balance);
    if (hit?.quantity!=null) return String(hit.quantity);
  }
  return "—";
}

function detectProviderLabel(api:any, provider:any): string {
  const m:any = (window as any)?.midnight;
  if (m && typeof m === "object") {
    for (const k of Object.keys(m)) if (m[k]===provider||m[k]===api) return k;
  }
  const c = (window as any)?.cardano?.midnight;
  if (c && (provider===c || api===c)) return "cardano.midnight";
  return api?.providerName ?? provider?.providerName ?? "(auto-detected)";
}
function detectWalletLabel(api:any, provider:any): string {
  return api?.walletName ?? provider?.walletName ?? api?.wallet?.name ?? provider?.wallet?.name ??
         api?.name ?? provider?.name ?? provider?.constructor?.name ?? "—";
}
async function detectApiVersion(api:any, provider:any): Promise<string> {
  const vals = [api?.apiVersion, api?.version, provider?.apiVersion, provider?.version];
  for (const v of vals) if (typeof v === "string" && v) return v;
  const fns = [api?.getVersion, provider?.getVersion, api?.info, provider?.info];
  for (const fn of fns) try { if (typeof fn==="function") { const v = await fn.call(api ?? provider); if (v) return String(v); } } catch {}
  return "—";
}

export default function App() {
  const apiRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);

  const [providerName, setProviderName] = useState("(auto-detected)");
  const [walletName, setWalletName] = useState("—");
  const [apiVersion, setApiVersion] = useState("—");
  const [addr, setAddr] = useState("—");
  const [tDustBalance, setTDustBalance] = useState("—");
  const [capWalletTransfer, setCapWalletTransfer] = useState<boolean|null>(null);
  const [capCoinEnum, setCapCoinEnum] = useState<boolean|null>(null);

  const [shieldAddr, setShieldAddr] = useState("—");
  const [shieldCPK, setShieldCPK] = useState("—");
  const [shieldEPK, setShieldEPK] = useState("—");
  const [legacyAddr, setLegacyAddr] = useState("—");
  const [legacyCPK, setLegacyCPK] = useState("—");
  const [legacyEPK, setLegacyEPK] = useState("—");

  const readState = async (src:any) => {
    if (!src) return null;
    if (typeof src.serializeState === "function") {
      const s = await src.serializeState();
      try { const parsed = typeof s === "string" ? JSON.parse(s) : s; return parsed?.state ?? parsed ?? null; } catch { return null; }
    }
    if (typeof src.state === "function") { const st = await src.state(); return st?.state ?? st ?? null; }
    return null;
  };

  async function loadWalletInfoNonInteractive(ctx?: { api?: any; provider?: any }) {
    setLoading(true);
    try {
      const provider = ctx?.provider ?? getMidnightProvider();
      const api = ctx?.api ?? apiRef.current ?? null;
      if (ctx?.api) apiRef.current = ctx.api;
      if (!provider && !api) return;

      setProviderName(detectProviderLabel(api, provider));
      setWalletName(detectWalletLabel(api, provider));
      setApiVersion(await detectApiVersion(api, provider));

      const state: WalletState | null = (await readState(api)) ?? (await readState(provider)) ?? null;
      const address = state?.address ?? state?.addresses?.[0] ?? state?.account?.address ?? "—";
      setAddr(address);
      setTDustBalance(deriveTDustBalanceFromState(state));

      const w = api ?? provider;
      setCapWalletTransfer(typeof w?.balanceAndProveTransaction==="function" && typeof w?.submitTransaction==="function");
      setCapCoinEnum(typeof w?.listCoins==="function" || typeof w?.getUtxos==="function" || typeof w?.coins==="function" || typeof w?.serializeState==="function" || typeof w?.state==="function");

      setShieldAddr(state?.address ?? "—");
      setShieldCPK(state?.coinPublicKey ?? "—");
      setShieldEPK(state?.encryptionPublicKey ?? "—");
      setLegacyAddr(state?.addressLegacy ?? "—");
      setLegacyCPK(state?.coinPublicKeyLegacy ?? "—");
      setLegacyEPK(state?.encryptionPublicKeyLegacy ?? "—");
    } finally { setLoading(false); }
  }

  useEffect(() => {
    loadWalletInfoNonInteractive();
    const onConnected = (e:Event) => {
      const { api, provider } = (e as CustomEvent).detail || {};
      loadWalletInfoNonInteractive({ api, provider });
    };
    window.addEventListener("midnight:connected", onConnected);
    return () => window.removeEventListener("midnight:connected", onConnected);
  }, []);

  return (
    <div>
      <Navbar />
      <main style={{ paddingTop:"5rem", textAlign:"center" }}>
        <h1 style={{ fontSize:"2.25rem", marginBottom:"0.5rem" }}>🌙 Welcome to your Midnight dApp</h1>
        <p style={{ color:"#94a3b8", marginBottom:"1.25rem" }}>Start building with Vite + React + Midnight Wallet.</p>

        <Card title="Wallet Summary" onRefresh={() => loadWalletInfoNonInteractive()} loading={loading}>
          <Row label="Provider" value={providerName} />
          <Row label="Wallet" value={walletName} />
          <Row label="API version" value={apiVersion} />
          <Row label="Address (heuristic)" value={addr} />
          <Row label="tDUST Balance" value={tDustBalance} />
          <Row label="Capabilities" value={\`walletTransfer=\${String(capWalletTransfer)} coinEnum=\${String(capCoinEnum)}\`} />
        </Card>

        <Card title="Wallet Keys & Addresses" style={{ marginTop:16 }}>
          <Row label="Shield Address" value={shieldAddr} />
          <Row label="Shield CPK" value={shieldCPK} />
          <Row label="Shield EPK" value={shieldEPK} />
          <Row label="Legacy Address" value={legacyAddr} />
          <Row label="Legacy CPK" value={legacyCPK} />
          <Row label="Legacy EPK" value={legacyEPK} />
        </Card>
      </main>
    </div>
  );
}

function Card({ title, children, onRefresh, loading, style }:{
  title:string; children:React.ReactNode; onRefresh?:()=>void; loading?:boolean; style?:React.CSSProperties;
}) {
  return (
    <div style={{ background:"#0b1220", color:"#e2e8f0", padding:16, borderRadius:12, maxWidth:960, margin:"0 auto", textAlign:"left", ...style }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
        <strong>{title}</strong>
        {onRefresh && (
          <button onClick={onRefresh} disabled={!!loading} style={{
            padding:"6px 12px", borderRadius:8, border:"1px solid #334155",
            background:"#1e293b", color:"#e2e8f0", cursor:"pointer", fontSize:13, opacity: loading ? 0.7 : 1
          }}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }:{ label:string; value:string }) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"180px 1fr", gap:8, alignItems:"center", margin:"6px 0" }}>
      <div style={{ color:"#93c5fd", fontSize:13 }}>{label}</div>
      <code style={{ background:"#0f172a", border:"1px solid #334155", borderRadius:6, padding:"6px 8px", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }} title={value}>
        {value}
      </code>
    </div>
  );
}`;
    writeFileSync("src/App.tsx", app);
  }
}

function main() {
  const inPlace = process.argv.includes("--in-place") || process.argv.includes("--here");
  if (!inPlace) log("ℹ️  Tip: run with --in-place to initialize the current folder");

  ensurePkgJSON();
  const pm = detectPM();
  addScripts();
  ensureTsConfig();
  ensureViteConfig();
  ensureIndexHtml();
  addDeps(pm);
  ensureSrcTree();

  log("\n✅ Midnight dApp scaffold complete.");
  log("   Next steps:");
  log(`     1) Start dev server:   ${pm.name === "npm" ? "npm run dev" : `${pm.name} run dev`}`);
  log("     2) Open:               http://localhost:5173");
  log("     3) Click ‘Connect Midnight Lace Wallet’ and verify info shows up.\n");
}

main();
