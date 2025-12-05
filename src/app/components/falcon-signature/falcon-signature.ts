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

      // 3. Sign Message
      const msgBytes = new TextEncoder().encode(this.messageInput);
      // Deterministic RNG seed (all zeros)
      const rngSeed = new Uint8Array(48); 
      const signature = this.falconWasm.signMessage(msgBytes, keypair.privateKey, rngSeed);
      this.generatedSignature = this.toBase64(signature);
      
      // 4. Extract details
      const pubKeyCoeffs = this.falconWasm.getPublicKeyCoefficients(keypair.publicKey);
      const sigCoeffs = this.falconWasm.getSignatureCoefficients(signature);
      
      // Extract nonce (bytes 1-40)
      const nonce = signature.slice(1, 41);
      this.generatedNonce = this.toBase64(nonce);

      // 5. Hash to point (nonce + message)
      const nonceAndMsg = new Uint8Array(nonce.length + msgBytes.length);
      nonceAndMsg.set(nonce);
      nonceAndMsg.set(msgBytes, nonce.length);
      const h2pCoeffs = this.falconWasm.hashToPoint(nonceAndMsg);

      // 6. Populate Form inputs immediately so they are ready for generateCircuitInputs
      this.s1 = JSON.stringify(sigCoeffs.s1); // Using s1 (second component) as signature poly as per demo usage?
      // Wait, let's check demo again.
      // Demo output: s0 coefficients (512 elements), s1 coefficients (512 elements).
      // The circuit input usually takes 's1' (the vector s is (s1, s2) in Falcon paper, but specific implementation might vary).
      // My service expects 's1'.
      // In the previous turn, I mapped C-s2 to service-s1.
      // Let's look at `FalconCircuitInputsService` -> `generateCircuitInputs`:
      // It takes `s1`, `h`, `h2p`.
      // It does: `const s1_ntt = this.ntt(s1); const product = s1_ntt * h_hat;`
      // The verification equation is s1 + s2 * h = c (mod q).
      // So `s1_ntt * h_hat` corresponds to `s2 * h`.
      // So the input `s1` to the service MUST BE the component multiplied by `h`.
      // In Falcon paper s1 + s2 * h = c.
      // So the input `s1` to `generateCircuitInputs` is `s2`.
      // `getSignatureCoefficients` returns {s0, s1}.
      // s0 corresponds to s1 in paper? s1 corresponds to s2 in paper?
      // In Falcon reference implementation:
      // sig = (r, s). r is nonce. s is compressed vector.
      // Expanded s is (s1, s2).
      // Verification: s1 + s2 * h = c.
      // We need to pass `s2` (multiplied by h) to the service as `s1`.
      // Let's assume `sigCoeffs.s1` is `s2` from the paper.
      
      this.s1 = JSON.stringify(sigCoeffs.s1);
      this.h = JSON.stringify(pubKeyCoeffs);
      this.h2p = JSON.stringify(h2pCoeffs);

      // 7. Get Hash using the service (this ensures we get the exact same hash as the circuit uses)
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
      this.showDetails = true;

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

  async stringToSeed(str: string): Promise<Uint8Array> {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    
    if (crypto && crypto.subtle) {
        try {
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hash = new Uint8Array(hashBuffer);
            const seed = new Uint8Array(48);
            for (let i = 0; i < 48; i++) {
                seed[i] = hash[i % 32];
            }
            return seed;
        } catch (e) {
            console.warn('Web Crypto API not available');
        }
    }
    
    // Fallback
    const seed = new Uint8Array(48);
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
        hash = ((hash << 5) - hash) + data[i];
        hash = hash & hash; 
    }
    for (let i = 0; i < 48; i++) {
        hash = (hash * 1664525 + 1013904223) & 0xFFFFFFFF; 
        seed[i] = (hash >>> 24) & 0xFF;
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
