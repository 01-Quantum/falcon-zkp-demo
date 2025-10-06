# Falcon-512 ZKP Demo

A modern Angular application for generating and verifying Zero-Knowledge Proofs (ZKPs) for Falcon-512 post-quantum signatures using Groth16 proof system.

## 🚀 Features

- **Proof Generation**: Interactive form to input Falcon-512 signature components and generate ZK proofs
- **Proof Verification**: Verify generated proofs against the verification key
- **Example Data**: Pre-loaded example inputs for quick testing
- **Modern UI**: Beautiful, responsive design with smooth animations
- **Real-time Validation**: Form validation and error handling

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

## 🔐 How It Works

### 1. Proof Generation

1. Navigate to the "Generate Proof" page (default)
2. Load an example or manually enter the following fields:
   - **s1** (512 integers): Signature component
   - **h_hat** (512 integers): Hash values
   - **h_product_inv** (512 integers): Product inverse
   - **h2p_d** (512 integers): Hash to point data
   - **pk_hash_in**: Public key hash
   - **in_tx_hash1**: Transaction hash 1
   - **in_tx_hash2**: Transaction hash 2
   - **in_c_hash**: Commitment hash
3. Click "Generate Proof"
4. The application will:
   - Parse and validate inputs
   - Generate witness using the WASM circuit
   - Compute the ZK proof using Groth16
   - Navigate to the verification page with the proof

### 2. Proof Verification

1. After generating a proof, you'll be automatically redirected to the verification page
2. The proof and public signals will be displayed
3. Click "Verify Proof" to verify against the verification key
4. The result will show whether the proof is valid or invalid

You can also:
- Manually input proof JSON and public signals
- Load an example proof
- Copy proof data to clipboard

## 🔧 Technical Details

### ZKP Components

- **Circuit**: Falcon-512 signature verification circuit
- **Proof System**: Groth16
- **Curve**: bn128
- **Library**: snarkjs 0.7.0
- **Public Inputs**: 3 signals

### Input Format

All array inputs should be in JSON format:
```json
[1, 2, 3, ..., 512]
```

Or comma-separated:
```
1, 2, 3, ..., 512
```

### Circuit Files

The circuit files in `public/assets/` include:
- **falcon_512_test.wasm**: Compiled circuit for witness generation
- **falcon-512.zkey**: Zero-knowledge proving key
- **falcon-512_vkey.json**: Verification key

## 🎨 UI Features

- Gradient backgrounds with modern color schemes
- Responsive design for mobile and desktop
- Loading states and error handling
- Form validation with visual feedback
- Smooth animations and transitions
- Copy-to-clipboard functionality

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

## 🐛 Troubleshooting

### "Failed to load circuit files"
- Ensure all files are in `public/assets/`
- Check that the development server is running
- Clear browser cache and reload

### "Array must have exactly 512 elements"
- Verify input arrays have exactly 512 numbers
- Check JSON format is valid
- Try loading an example first

### Slow proof generation
- Proof generation is computationally intensive
- First load may be slower due to WASM initialization
- Use a modern browser (Chrome, Firefox, Edge recommended)

## 🔗 Dependencies

- **Angular**: ^19.x
- **snarkjs**: ^0.7.0
- **TypeScript**: ~5.7.x

## 📄 License

This project is part of the Falcon ZKP demo.

## 🤝 Contributing

This is a demo application. For production use, additional security measures and optimizations should be implemented.

---

Built with ❤️ using Angular and snarkjs
