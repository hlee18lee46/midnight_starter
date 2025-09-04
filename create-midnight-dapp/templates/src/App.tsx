import { useEffect, useRef, useState } from "react";
import Navbar from "./components/Navbar";
import { getMidnightProvider } from "./midnight-provider";

type WalletState = {
  address?: string;
  addressLegacy?: string;
  coinPublicKey?: string;
  coinPublicKeyLegacy?: string;
  encryptionPublicKey?: string;
  encryptionPublicKeyLegacy?: string;
  balances?: any;
  [k: string]: any;
};

function deriveTDustBalanceFromState(s: any): string {
  if (!s) return "—";
  if (s?.balances?.tDUST != null) return String(s.balances.tDUST);
  if (s?.balances?.tdust != null) return String(s.balances.tdust);
  const arrays: any[] = [];
  if (Array.isArray(s?.assets)) arrays.push(s.assets);
  if (Array.isArray(s?.balances)) arrays.push(s.balances);
  if (Array.isArray(s?.coins)) arrays.push(s.coins);
  for (const arr of arrays) {
    const hit = arr.find((x: any) =>
      x?.asset === "tDUST" || x?.ticker === "tDUST" || x?.symbol === "tDUST" || x?.denom === "tDUST"
    );
    if (hit?.amount != null) return String(hit.amount);
    if (hit?.balance != null) return String(hit.balance);
    if (hit?.quantity != null) return String(hit.quantity);
  }
  return "—";
}

export default function App() {
  const apiRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);

  // Summary fields
  const [providerName, setProviderName] = useState<string>("(auto-detected)");
  const [walletName, setWalletName] = useState<string>("—");
  const [apiVersion, setApiVersion] = useState<string>("—");
  const [addr, setAddr] = useState<string>("—");
  const [tDustBalance, setTDustBalance] = useState<string>("—");
  const [capWalletTransfer, setCapWalletTransfer] = useState<boolean | null>(null);
  const [capCoinEnum, setCapCoinEnum] = useState<boolean | null>(null);

  // Detail fields
  const [shieldAddr, setShieldAddr] = useState("—");
  const [shieldCPK, setShieldCPK] = useState("—");
  const [shieldEPK, setShieldEPK] = useState("—");
  const [legacyAddr, setLegacyAddr] = useState("—");
  const [legacyCPK, setLegacyCPK] = useState("—");
  const [legacyEPK, setLegacyEPK] = useState("—");

  const readState = async (src: any) => {
    if (!src) return null;
    if (typeof src.serializeState === "function") {
      const s = await src.serializeState();
      try {
        const parsed = typeof s === "string" ? JSON.parse(s) : s;
        return parsed?.state ?? parsed ?? null;
      } catch {
        return null;
      }
    }
    if (typeof src.state === "function") {
      const st = await src.state();
      return st?.state ?? st ?? null;
    }
    return null;
  };
function detectProviderLabel(api: any, provider: any): string {
  const m: any = (window as any)?.midnight;
  if (m && typeof m === "object") {
    for (const k of Object.keys(m)) {
      if (m[k] === provider || m[k] === api) return k; // e.g. "mnLace" or "lace"
    }
  }
  const c = (window as any)?.cardano?.midnight;
  if (c && (provider === c || api === c)) return "cardano.midnight";
  return api?.providerName ?? provider?.providerName ?? "(auto-detected)";
}

function detectWalletLabel(api: any, provider: any): string {
  return (
    api?.walletName ??
    provider?.walletName ??
    api?.wallet?.name ??
    provider?.wallet?.name ??
    api?.name ??
    provider?.name ??
    provider?.constructor?.name ??
    "—"
  );
}

async function detectApiVersion(api: any, provider: any): Promise<string> {
  const tryVals = [
    api?.apiVersion,
    api?.version,
    provider?.apiVersion,
    provider?.version,
  ];
  for (const v of tryVals) if (typeof v === "string" && v) return v;

  const tryFns = [api?.getVersion, provider?.getVersion, api?.info, provider?.info];
  for (const fn of tryFns) {
    try {
      if (typeof fn === "function") {
        const v = await fn.call(api ?? provider);
        if (v) return String(v);
      }
    } catch {}
  }
  return "—";
}

// ⬇️ accept BOTH objects
async function loadWalletInfoNonInteractive(ctx?: { api?: any; provider?: any }) {
  setLoading(true);
  try {
    // prefer what's passed in; fall back to cached or detected
    const provider = ctx?.provider ?? getMidnightProvider();
    const api      = ctx?.api ?? apiRef.current ?? null;

    if (ctx?.api) apiRef.current = ctx.api; // remember enabled API
    if (!provider && !api) return;

    // Names / versions (derive, no hard-coding)
    setProviderName(detectProviderLabel(api, provider));
    setWalletName(detectWalletLabel(api, provider));
    setApiVersion(await detectApiVersion(api, provider));

    // State: try api first, then provider (no enable() here)
    const state: WalletState | null =
      (await readState(api)) ?? (await readState(provider)) ?? null;

    const address =
      state?.address ??
      state?.addresses?.[0] ??
      state?.account?.address ??
      "—";
    setAddr(address);
    setTDustBalance(deriveTDustBalanceFromState(state));

    const w = api ?? provider;
    setCapWalletTransfer(
      typeof w?.balanceAndProveTransaction === "function" &&
      typeof w?.submitTransaction === "function"
    );
    setCapCoinEnum(
      typeof w?.listCoins === "function" ||
      typeof w?.getUtxos === "function" ||
      typeof w?.coins === "function" ||
      typeof w?.serializeState === "function" ||
      typeof w?.state === "function"
    );

    setShieldAddr(state?.address ?? "—");
    setShieldCPK(state?.coinPublicKey ?? "—");
    setShieldEPK(state?.encryptionPublicKey ?? "—");
    setLegacyAddr(state?.addressLegacy ?? "—");
    setLegacyCPK(state?.coinPublicKeyLegacy ?? "—");
    setLegacyEPK(state?.encryptionPublicKeyLegacy ?? "—");
  } finally {
    setLoading(false);
  }
}


useEffect(() => {
  // first attempt without prompting
  loadWalletInfoNonInteractive();

  const onConnected = (e: Event) => {
    const { api, provider } = (e as CustomEvent).detail || {};
    if (api) apiRef.current = api;
    // ⬇️ pass BOTH here
    loadWalletInfoNonInteractive({ api, provider });
  };

  window.addEventListener("midnight:connected", onConnected);
  return () => window.removeEventListener("midnight:connected", onConnected);
}, []);


  return (
    <div>
      <Navbar />
      {/* push content below fixed navbar */}
      <main style={{ paddingTop: "5rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "2.25rem", marginBottom: "0.5rem" }}>
          🌙 Welcome to your Midnight dApp
        </h1>
        <p style={{ color: "#64748b", marginBottom: "1.25rem" }}>
          Start building with Vite + React + Midnight Wallet.
        </p>

        {/* Summary block */}
        <Card title="Wallet Summary" onRefresh={() => loadWalletInfoNonInteractive()} loading={loading}>
          <Row label="Provider" value={providerName} />
          <Row label="Wallet" value={walletName} />
          <Row label="API version" value={apiVersion} />
          <Row label="Address (heuristic)" value={addr} />
          <Row label="tDUST Balance" value={tDustBalance} />
          <Row
            label="Capabilities"
            value={`walletTransfer=${String(capWalletTransfer)} coinEnum=${String(capCoinEnum)}`}
          />
        </Card>

        {/* Details block */}
        <Card title="Wallet Keys & Addresses" style={{ marginTop: 16 }}>
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

/* ----------------- small UI helpers ----------------- */
function Card({
  title,
  children,
  onRefresh,
  loading,
  style,
}: {
  title: string;
  children: React.ReactNode;
  onRefresh?: () => void;
  loading?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: "#0b1220",
        color: "#e2e8f0",
        padding: 16,
        borderRadius: 12,
        maxWidth: 960,
        margin: "0 auto",
        textAlign: "left",
        ...style,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <strong>{title}</strong>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={!!loading}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border: "1px solid #334155",
              background: "#1e293b",
              color: "#e2e8f0",
              cursor: "pointer",
              fontSize: 13,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "180px 1fr",
        gap: 8,
        alignItems: "center",
        margin: "6px 0",
      }}
    >
      <div style={{ color: "#93c5fd", fontSize: 13 }}>{label}</div>
      <code
        style={{
          background: "#0f172a",
          border: "1px solid #334155",
          borderRadius: 6,
          padding: "6px 8px",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
        title={value}
      >
        {value}
      </code>
    </div>
  );
}
