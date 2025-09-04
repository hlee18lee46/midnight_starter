// src/midnight.ts

export type MidnightConnectResult = {
  api: any;
  providerName?: string;
  walletName?: string;
  apiVersion?: string;
  serviceUris?: string[] | null;
  state?: any;
};

declare global {
  interface Window {
    cardano?: {
      midnight?: {
        enable: () => Promise<any>;
        isEnabled?: () => Promise<boolean>;
        // optional extras:
        serializeState?: () => Promise<any>;
        state?: () => Promise<any>;
        listCoins?: () => Promise<any>;
        getUtxos?: () => Promise<any>;
        coins?: () => Promise<any>;
        balanceAndProveTransaction?: (...args: any[]) => Promise<any>;
        submitTransaction?: (...args: any[]) => Promise<any>;
      };
    };
  }
}

/** Ask Lace to enable Midnight and fetch basic metadata/state if available. */
export async function connectMidnight(): Promise<MidnightConnectResult> {
  if (!window.cardano?.midnight) {
    throw new Error("Midnight (Lace) not detected. Install/enable the Lace extension and Midnight.");
  }

  const api = await window.cardano.midnight.enable();

  // Some providers expose metadata on the API; fallbacks keep this robust
  const providerName = (api?.providerName ?? "Midnight") as string | undefined;
  const walletName   = (api?.walletName ?? "Lace") as string | undefined;
  const apiVersion   = (api?.apiVersion ?? api?.version) as string | undefined;
  const serviceUris  = (api?.serviceUris ?? null) as string[] | null;

  // Try to get a current state snapshot
  let state: any = undefined;
  if (typeof api?.serializeState === "function") state = await api.serializeState();
  else if (typeof api?.state === "function") state = await api.state();

  return { api, providerName, walletName, apiVersion, serviceUris, state };
}

/** Ensure wallet/API is present after connectMidnight. */
export async function requireWallet(): Promise<any> {
  const w = window.cardano?.midnight;
  if (!w) throw new Error("Midnight wallet not available.");
  return w;
}

/** Try to derive an address from the state object in a few common shapes. */
export function deriveAddressFromState(state: any): string {
  if (!state) return "";
  // common guesses — adjust to your known shape if different
  if (state?.addresses?.[0]) return String(state.addresses[0]);
  if (state?.wallet?.addresses?.[0]) return String(state.wallet.addresses[0]);
  if (state?.account?.address) return String(state.account.address);
  if (state?.changeAddress) return String(state.changeAddress);
  return "";
}

/** Try to compute a tDUST (testnet) balance from known spots. */
export function deriveTDustBalanceFromState(state: any): string {
  if (!state) return "0";
  // direct field
  if (state?.balances?.tdust != null) return String(state.balances.tdust);

  // sum UTXOs if they exist (example shapes)
  const utxos = state?.utxos ?? state?.wallet?.utxos ?? [];
  if (Array.isArray(utxos)) {
    const total = utxos.reduce((acc: number, u: any) => {
      // try common fields
      const v =
        u?.amount ??
        u?.value ??
        (Array.isArray(u?.assets) ? u.assets.find((a: any) => /tdust/i.test(a?.unit || a?.asset))?.quantity : 0) ??
        0;
      const n = Number(v) || 0;
      return acc + n;
    }, 0);
    if (total > 0) return String(total);
  }

  return "0";
}
