import { copy } from "../utils/copy.ts";

type Props = {
  stateJson: string;  // your lastStateJson
};

export default function WalletInfo({ stateJson }: Props) {
  if (!stateJson) {
    return (
      <div style={card}>
        <div style={title}>Wallet</div>
        <div style={{ color: "#94a3b8" }}>No state yet. Connect your wallet.</div>
      </div>
    );
  }

  let s: any = null;
  try {
    s = JSON.parse(stateJson);
    if (s?.state) s = s.state; // handle { state: {...} }
  } catch {
    // keep s = null; show raw JSON below
  }

  const rows: Array<{ label: string; value?: string }> = [
    { label: "Shield Address", value: s?.address },
    { label: "Shield CPK", value: s?.coinPublicKey ?? s?.cpk ?? s?.coin_public_key },
    { label: "Shield EPK", value: s?.encryptionPublicKey ?? s?.epk ?? s?.encryption_public_key },
    { label: "Legacy Address", value: s?.addressLegacy },
    { label: "Legacy CPK", value: s?.coinPublicKeyLegacy },
    { label: "Legacy EPK", value: s?.encryptionPublicKeyLegacy },
  ];

  return (
    <div style={card}>
      <div style={title}>Wallet</div>

      <div style={grid}>
        {rows.map(({ label, value }) => (
          <div key={label} style={row}>
            <div style={labelStyle}>{label}</div>
            <div style={valueWrap}>
              <code style={code}>{value ?? "—"}</code>
              {value && (
                <button style={copyBtn} onClick={() => copy(value)}>
                  Copy
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Raw JSON for debugging */}
      <details style={{ marginTop: 12 }}>
        <summary>Raw state JSON</summary>
        <pre style={pre}>{stateJson}</pre>
      </details>
    </div>
  );
}

/* ── styles ─────────────────────────────────────────── */
const card: React.CSSProperties = {
  background: "#0b1220",
  border: "1px solid #1f2a44",
  borderRadius: 12,
  padding: 16,
  color: "#e2e8f0",
};

const title: React.CSSProperties = {
  fontWeight: 700,
  marginBottom: 12,
  fontSize: 16,
};

const grid: React.CSSProperties = {
  display: "grid",
  gap: 8,
};

const row: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "180px 1fr",
  gap: 8,
  alignItems: "center",
};

const labelStyle: React.CSSProperties = {
  color: "#93c5fd",
  fontSize: 13,
};

const valueWrap: React.CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  minWidth: 0,
};

const code: React.CSSProperties = {
  background: "#0f172a",
  border: "1px solid #334155",
  borderRadius: 6,
  padding: "6px 8px",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  width: "100%",
};

const copyBtn: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 8,
  border: "1px solid #334155",
  background: "#1e293b",
  color: "#e2e8f0",
  cursor: "pointer",
  fontSize: 12,
};

const pre: React.CSSProperties = {
  background: "#0f172a",
  color: "#e2e8f0",
  padding: 12,
  borderRadius: 8,
  overflow: "auto",
  maxHeight: 300,
  border: "1px solid #334155",
};
