# 🚀 Quick Start Guide

## Get Started in 3 Steps

### 1. Install Dependencies
```bash
cd zkp-demo
npm install
```

### 2. Start the Application
```bash
npm start
```

The app will automatically open at `http://localhost:4200/`

### 3. Try It Out!

#### Option A: Use Example Data (Recommended for First Try)
1. Click **"Load Example 1"** button
2. Click **"🚀 Generate Proof"**
3. Wait ~5-10 seconds for proof generation
4. You'll be redirected to the verification page
5. Click **"🔍 Verify Proof"**
6. See the ✅ success message!

#### Option B: Manual Input
1. Enter the circuit inputs manually:
   - **s1**: Array of 512 integers
   - **h_hat**: Array of 512 integers
   - **h_product_inv**: Array of 512 integers
   - **h2p_d**: Array of 512 integers
   - **Public Key Hash**: Large integer
   - **Transaction Hashes**: Large integers
   - **Commitment Hash**: Large integer

2. Click **"🚀 Generate Proof"**
3. Navigate to verification page
4. Click **"🔍 Verify Proof"**

## 📸 What You'll See

### Proof Generation Page
- Modern form with gradient header
- Pre-loaded examples for quick testing
- Real-time validation
- Loading states during proof generation

### Verification Page
- Display of public signals
- Detailed proof data (π_a, π_b, π_c)
- Verification result with visual feedback
- Copy-to-clipboard functionality

## 💡 Tips

- **First Time?** Always start with "Load Example 1"
- **Slow Generation?** This is normal - ZKP generation is compute-intensive
- **Browser Recommendation**: Chrome, Firefox, or Edge for best performance
- **Mobile?** The app is fully responsive!

## 🎯 Key Features

✅ Generate ZK proofs for Falcon-512 signatures  
✅ Verify proofs against verification key  
✅ View all public signals  
✅ Copy proof data  
✅ Beautiful, modern UI  
✅ Real-time validation  

## 🔧 Troubleshooting

**Problem**: Proof generation is slow  
**Solution**: Wait patiently - first generation takes longer

**Problem**: Can't load example  
**Solution**: Ensure dev server is running and assets are in `public/assets/`

**Problem**: Form validation errors  
**Solution**: Ensure arrays have exactly 512 elements

## 🎓 Understanding the Flow

```
Input Data
    ↓
Generate Witness (WASM)
    ↓
Compute ZK Proof (Groth16)
    ↓
Verify Proof (Verification Key)
    ↓
✅ Valid / ❌ Invalid
```

## 📚 Learn More

- Check `README.md` for detailed documentation
- Explore the code in `src/app/`
- Modify circuit files in `public/assets/`

---

**Ready?** Run `npm start` and experience zero-knowledge proofs! 🚀

