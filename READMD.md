create-midnight-dapp 🌙

A one-command starter kit for building Midnight dApps with React + Vite + TypeScript.
Scaffold a fully working Midnight wallet integration in seconds.

✨ Features

⚡ Zero-config bootstrap — npm create midnight-dapp scaffolds your project

🔌 Wallet ready — includes Navbar with Connect Midnight Lace Wallet button

🔍 Wallet summary panel — auto-detects and displays:

Shield Address

Shield CPK / EPK

Legacy Address / Keys

API version & provider info

tDUST balance and wallet capabilities

🛠️ Developer friendly — event system (midnight:connected) to refresh state

🗂️ TypeScript + Vite for modern DX

🎨 Simple baseline CSS (no Tailwind/PostCSS required — avoids setup errors)

🚀 Getting Started
1. Scaffold a new project
# create a new folder
mkdir my-dapp && cd my-dapp

# scaffold in place
npm exec create-midnight-dapp@latest -- --in-place

2. Run the dev server
npm run dev


Visit http://localhost:5173
.

3. Connect your wallet

Install Lace Wallet

Enable a Midnight Testnet profile

Click Connect Midnight Lace Wallet in your app

Your Shield Address, Legacy keys, and balance will appear

📖 Project Structure
my-dapp/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── midnight-provider.ts
│   └── components/
│       └── Navbar.tsx
└── src/styles/
    └── index.css

🧩 How It Works

midnight-provider.ts detects Lace / Midnight providers (window.midnight, window.cardano.midnight)

Navbar.tsx connects to the wallet and dispatches a midnight:connected event

App.tsx listens for connection events, loads wallet state, and shows keys + balances

🛠️ Development

Clone and link the CLI locally:

git clone https://github.com/your-username/create-midnight-dapp
cd create-midnight-dapp
npm install
npm link


Now test anywhere:

mkdir test && cd test
create-midnight-dapp --in-place
npm run dev

📜 License

This project is licensed under the Apache 2.0 License.

🌐 Links

🔗 NPM: [create-midnight-dapp](https://www.npmjs.com/package/create-midnight-dapp)

🔗 Dev Submission: [Midnight Privacy First Challenge](https://dev.to/hlee18lee46/enhance-the-ecosystem-npm-package-to-initialize-react-app-with-midnight-lace-wallet-connection-f1j)

📖 Docs: see docs/
 for setup and screenshots