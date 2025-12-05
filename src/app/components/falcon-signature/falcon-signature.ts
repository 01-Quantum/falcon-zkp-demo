import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FalconCircuitInputsService } from '../../services/falcon-circuit-inputs.service';
import { FalconWasmService } from '../../services/falcon-wasm.service';

@Component({
  selector: 'app-falcon-signature',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './falcon-signature.html',
  styleUrls: ['./falcon-signature.scss']
})
export class FalconSignatureComponent implements OnInit {
  // User inputs for generation
  seedInput: string = 'my-secret-seed-12345';
  messageInput: string = 'Hello, Falcon-512! This is a test message.';
  
  // Generated artifacts
  generatedSignature: string | null = null;
  generatedPublicKey: string | null = null;
  generatedNonce: string | null = null;
  messageHashHex: string | null = null;
  
  // Hashes
  pkHash: string | null = null;
  
  // Toggle details
  showDetails = false;

  // Form inputs (auto-filled)
  s1: string = '';
  h: string = '';
  h2p: string = '';
  in_tx_hash1: string = '340282366920938463463374607431768211455';
  in_tx_hash2: string = '340282366920938463463374607431768211455';

  loading = false;
  generating = false;
  error: string | null = null;
  statusMessage: string = 'Initializing Falcon...';

  constructor(
    private falconService: FalconCircuitInputsService,
    private falconWasm: FalconWasmService,
    private router: Router
  ) {}

  async ngOnInit() {
    try {
      await this.falconWasm.waitForReady();
      this.statusMessage = '✅ Falcon-512 Ready';
    } catch (e) {
      this.statusMessage = '❌ Failed to initialize Falcon';
      this.error = 'Could not load Falcon WASM module.';
    }
  }

  bytesToBigInt(bytes: Uint8Array): bigint {
    const hex = this.toHex(bytes);
    if (!hex) return 0n;
    return BigInt('0x' + hex);
  }

  async generateSignature() {
    try {
      this.generating = true;
      this.error = null;
      this.statusMessage = 'Generating keys and signature...';

      // 1. Convert seed to 48 bytes
      const seed = await this.stringToSeed(this.seedInput);

      // 2. Generate Keypair
      const keypair = this.falconWasm.createKeypairFromSeed(seed);
      this.generatedPublicKey = this.toBase64(keypair.publicKey);

      // 3. Hash Message (SHA256)
      const msgHash = await this.calculateSha256(this.messageInput);
      this.messageHashHex = this.toHex(msgHash);

      // Split message hash into two 128-bit chunks for the circuit inputs
      // Assuming Big Endian: High bytes are first, Low bytes are last.
      const highBytes = msgHash.slice(0, 16);
      const lowBytes = msgHash.slice(16, 32);

      const highInt = this.bytesToBigInt(highBytes);
      const lowInt = this.bytesToBigInt(lowBytes);

      // Map to inputs: 1 = Low, 2 = High (based on user request "low and hi")
      this.in_tx_hash1 = highInt.toString();
      this.in_tx_hash2 = lowInt.toString();

      // 4. Sign Message Hash
      // Deterministic RNG seed (all zeros)
      const rngSeed = new Uint8Array(48); 
      const signature = this.falconWasm.signMessage(msgHash, keypair.privateKey, rngSeed);
      this.generatedSignature = this.toBase64(signature);
      
      // 5. Extract details
      const pubKeyCoeffs = this.falconWasm.getPublicKeyCoefficients(keypair.publicKey);
      const sigCoeffs = this.falconWasm.getSignatureCoefficients(signature);
      
      // Extract nonce (bytes 1-40)
      const nonce = signature.slice(1, 41);
      this.generatedNonce = this.toBase64(nonce);

      // 6. Hash to point (nonce + messageHash)
      // Note: Falcon expects the message passed here to match what was signed.
      // Since we signed the hash, we pass the hash here too.
      const nonceAndMsg = new Uint8Array(nonce.length + msgHash.length);
      nonceAndMsg.set(nonce);
      nonceAndMsg.set(msgHash, nonce.length);
      const h2pCoeffs = this.falconWasm.hashToPoint(nonceAndMsg);

      // 7. Populate Form inputs immediately so they are ready for generateCircuitInputs
      this.s1 = JSON.stringify(sigCoeffs.s1);
      this.h = JSON.stringify(pubKeyCoeffs);
      this.h2p = JSON.stringify(h2pCoeffs);

      // 8. Get Hash using the service (this ensures we get the exact same hash as the circuit uses)
      // We call generateCircuitInputs just to get the hash, even if we don't navigate yet.
      // This handles NTT transform and Poseidon hashing correctly.
      const inputs = await this.falconService.generateCircuitInputs(
        sigCoeffs.s1,
        pubKeyCoeffs,
        h2pCoeffs,
        this.in_tx_hash1,
        this.in_tx_hash2
      );
      
      this.pkHash = inputs.pk_hash_in;

      this.statusMessage = '✅ Generated successfully!';
      // this.showDetails = true; // User requested details hidden by default

    } catch (e: any) {
      console.error(e);
      this.error = e.message || 'Generation failed';
      this.statusMessage = '❌ Error';
    } finally {
      this.generating = false;
    }
  }

  randomizeSeed() {
    const randomWords = ['quantum', 'falcon', 'crypto', 'secure', 'lattice', 'nist', 'pqc', 'wasm'];
    const random = randomWords[Math.floor(Math.random() * randomWords.length)];
    this.seedInput = random + '-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
  }

  async calculateSha256(str: string): Promise<Uint8Array> {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    
    if (crypto && crypto.subtle) {
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        return new Uint8Array(hashBuffer);
    }
    throw new Error('Web Crypto API is required for SHA-256');
  }

  async stringToSeed(str: string): Promise<Uint8Array> {
    // Reuse the SHA256 logic, then extend to 48 bytes if needed
    try {
        const hash = await this.calculateSha256(str);
        // If we need exactly 48 bytes, we can just loop/pad.
        // Original logic:
        const seed = new Uint8Array(48);
        for (let i = 0; i < 48; i++) {
            seed[i] = hash[i % 32];
        }
        return seed;
    } catch (e) {
        console.warn('Web Crypto API error in stringToSeed, using fallback');
    }
    
    // Fallback
    const data = new TextEncoder().encode(str);
    const seed = new Uint8Array(48);
    let h = 0;
    for (let i = 0; i < data.length; i++) {
        h = ((h << 5) - h) + data[i];
        h = h & h; 
    }
    for (let i = 0; i < 48; i++) {
        h = (h * 1664525 + 1013904223) & 0xFFFFFFFF; 
        seed[i] = (h >>> 24) & 0xFF;
    }
    return seed;
  }

  toBase64(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  toHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  getHexValue(decimalString: string): string {
    try {
      if (!decimalString) return '';
      const bigVal = BigInt(decimalString);
      return '0x' + bigVal.toString(16);
    } catch (e) {
      return 'Invalid number';
    }
  }

  async generateAndNavigate() {
    try {
      this.loading = true;
      this.error = null;

      // Parse inputs
      const s1Array = JSON.parse(this.s1) as number[];
      const hArray = JSON.parse(this.h) as number[];
      const h2pArray = JSON.parse(this.h2p) as number[];

      // Validate array lengths
      if (s1Array.length !== 512) throw new Error(`s1 must have 512 coefficients`);
      if (hArray.length !== 512) throw new Error(`h must have 512 coefficients`);
      if (h2pArray.length !== 512) throw new Error(`h2p must have 512 coefficients`);

      const circuitInput = await this.falconService.generateCircuitInputs(
        s1Array,
        hArray,
        h2pArray,
        this.in_tx_hash1,
        this.in_tx_hash2
      );

      sessionStorage.setItem('prefilled_circuit_input', JSON.stringify(circuitInput));
      this.router.navigate(['/generate']);

    } catch (err: any) {
      console.error('Error generating circuit inputs:', err);
      this.error = err.message || 'Failed to generate circuit inputs';
    } finally {
      this.loading = false;
    }
  }

  isFormValid(): boolean {
    try {
      if (!this.in_tx_hash1 || !this.in_tx_hash2) return false;
      const s1Array = JSON.parse(this.s1);
      const hArray = JSON.parse(this.h);
      const h2pArray = JSON.parse(this.h2p);
      return Array.isArray(s1Array) && s1Array.length === 512 &&
             Array.isArray(hArray) && hArray.length === 512 &&
             Array.isArray(h2pArray) && h2pArray.length === 512;
    } catch {
      return false;
    }
  }
}
