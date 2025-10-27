# 01 Qunatum Falcon-512 ZKP Demo

A modern Angular application for generating and verifying Zero-Knowledge Proofs (ZKPs) for Falcon-512 post-quantum signatures using Groth16 proof system.

[Live Demo](https://01-quantum.github.io/falcon-zkp-demo)

## Generate a new Falcon-512 Signature and Crypto material 
[👉 01-quantum.github.io/falcon-qone-wasm/](https://01-quantum.github.io/falcon-qone-wasm/)

## 🚀 Features

- **Proof Generation**: Interactive form to input Falcon-512 signature components and generate ZK proofs
- **Proof Verification**: Verify generated proofs against the verification key
- **Example Data**: Pre-loaded example inputs for quick testing
- **Modern UI**: Beautiful, responsive design with smooth animations
- **Real-time Validation**: Form validation and error handling

## 🔐 How It Works

### 1. Proof Generation

1. Navigate to the "Generate Proof" page (default)
2. Load an example or manually enter the following fields:
   - **s1** (512 integers): Signature component
   - **h_hat** (512 integers): Hash values
   - **h_product_inv** (512 integers): Product inverse
   - **h2p_d** (512 integers): Hash to point data `[h2p - (in_tx_hash1 || in_tx_hash2)]`
   - **pk_hash_in**: Public key hash
   - **in_tx_hash1**: Transaction hash 1 half
   - **in_tx_hash2**: Transaction hash 2 half
   - **in_c_hash**: hash to point (hpc) Commitment hash
3. Click "Generate Proof"
4. The application will:
   - Parse and validate inputs
   - Generate witness using the WASM circuit
   - Compute the ZK proof using Groth16
   - Navigate to the verification page with the proof


## 🔧 Technical Details

### ZKP Components

- **Circuit**: Falcon-512 signature verification circuit
- **Proof System**: Groth16
- **Curve**: bn128
- **Library**: snarkjs 0.7.0
- **Public Inputs**: 3 signals

### Circuit Files

The circuit files in `public/assets/` include:
- **falcon_512_test.wasm**: Compiled circuit for witness generation
- **falcon-512.zkey**: Zero-knowledge proving key
- **falcon-512_vkey.json**: Verification key


## 📝 Example Workflow

1. **Start the app**: `npm start`
2. **Generate a proof**:
   - Click "Load Example 1"
   - Click "Generate Proof"
   - Wait for proof generation (may take a few seconds)
3. **Verify the proof**:
   - Automatically redirected to verification page
   - Click "Verify Proof"
   - See the verification result ✅

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## 🛠️ Installation

1. Navigate to the project directory:
```bash
cd zkp-demo
```

2. Install dependencies:
```bash
npm install
```

3. Deploy to GH-PAGES
```bash
npm run deploy
```

## 🎮 Usage

### Running the Development Server

```bash
npm start
```

Or:

```bash
ng serve
```

Navigate to `http://localhost:4200/` in your browser.

### Building for Production

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## 📁 Project Structure

```
zkp-demo/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── proof-generation/    # Proof generation form
│   │   │   └── proof-verification/  # Proof verification page
│   │   ├── services/
│   │   │   └── zkp.ts              # ZKP service (snarkjs wrapper)
│   │   ├── app.routes.ts           # Application routing
│   │   └── app.ts                  # Root component
│   ├── styles.scss                 # Global styles
│   └── index.html                  # Main HTML file
├── public/
│   └── assets/                     # Circuit files
│       ├── falcon_512_test.wasm    # Circuit WASM
│       ├── falcon-512.zkey         # Proving key
│       ├── falcon-512_vkey.json    # Verification key
│       ├── input-falcon512-1.json  # Example input 1
│       ├── input-falcon512-2.json  # Example input 2
│       ├── proof-2.json            # Example proof
│       └── public-2.json           # Example public signals
└── package.json
```