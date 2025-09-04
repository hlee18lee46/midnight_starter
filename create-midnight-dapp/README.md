create-midnight-dapp

*This is a submission for the [Midnight Network "Privacy First" Challenge](https://dev.to/challenges/midnight-2025-08-20) - Enhance the Ecosystem prompt*

🚀 Bootstrap a Midnight dApp in seconds.
This CLI scaffolds a ready-to-use Midnight Network
 + React + Vite project with built-in wallet connection and developer tooling.

✨ Features

🔌 Wallet Connect — Prebuilt “Connect Midnight Lace Wallet” button

📊 Wallet Summary — Shows address, shield keys, legacy keys, and balance

⚡ Vite + React + TypeScript — Modern DX out of the box

🎨 Simple baseline CSS — No Tailwind/PostCSS headaches

🛠️ DX-first — One command, consistent setup, extendable scaffolding

📦 Installation

Use npm, pnpm, or yarn — all supported.

# create a new folder and scaffold inside
mkdir my-dapp && cd my-dapp

# with npm
npm exec create-midnight-dapp@latest -- --in-place

# with pnpm
pnpm dlx create-midnight-dapp --in-place

# with yarn
yarn create midnight-dapp --in-place

🖥️ Run Your dApp
npm run dev

Visit http://localhost:5173

Click “Connect Midnight Lace Wallet” to connect your Lace wallet (Testnet profile).

🧩 How It Works

midnight-provider.ts detects injected wallet providers (window.midnight or window.cardano.midnight).

Navbar.tsx implements a connect button and dispatches midnight:connected events.

App.tsx listens for wallet events, displays addresses, shield/legacy keys, balance, and wallet capabilities.

📚 Documentation

Midnight Network Docs

Lace Wallet

🤝 Contributing

Contributions are welcome! Please open issues and PRs on GitHub.

📜 License

Licensed under the Apache 2.0 License.

👉 This README is written for developers who will use your CLI package.
