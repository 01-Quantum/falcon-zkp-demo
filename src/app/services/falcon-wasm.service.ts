import { Injectable } from '@angular/core';

// Import the glue code. 
// We assume the build system can handle this import. 
// If not, we might need to move these files to src/
// @ts-ignore
import createFalconModule from '../../../public/assets/falcon_w.js';

@Injectable({
  providedIn: 'root'
})
export class FalconWasmService {
  private module: any;
  private isReady = false;

  // Constants from falcon.js
  readonly FALCON512_N = 512;
  readonly FALCON512_PRIVKEY_SIZE = 1281;
  readonly FALCON512_PUBKEY_SIZE = 897;
  readonly FALCON512_SIG_MAX_SIZE = 752;

  constructor() {
    this.init();
  }

  async init() {
    if (this.isReady) return;
    try {
      // Initialize the module using the glue code factory
      this.module = await createFalconModule({
        locateFile: (path: string) => {
          if (path.endsWith('.wasm')) {
            return 'assets/' + path;
          }
          return path;
        }
      });
      this.isReady = true;
      console.log('Falcon WASM module loaded');
    } catch (e) {
      console.error('Failed to load Falcon WASM module', e);
    }
  }

  async waitForReady(): Promise<void> {
    if (this.isReady) return;
    while (!this.isReady) {
      await new Promise(r => setTimeout(r, 100));
    }
  }

  // --- Memory Management Helpers ---

  private malloc(size: number): number {
    return this.module._wasm_malloc(size);
  }

  private free(ptr: number) {
    this.module._wasm_free(ptr);
  }

  private writeToMemory(data: Uint8Array, ptr: number) {
    this.module.HEAPU8.set(data, ptr);
  }

  private readFromMemory(ptr: number, length: number): Uint8Array {
    return new Uint8Array(this.module.HEAPU8.subarray(ptr, ptr + length));
  }
  
  private readInt16FromMemory(ptr: number, length: number): Int16Array {
    // HEAP16 is Int16Array. ptr is byte offset. index = ptr / 2.
    return new Int16Array(this.module.HEAP16.subarray(ptr / 2, (ptr / 2) + length));
  }

  // --- Falcon API ---

  createKeypairFromSeed(seed: Uint8Array): { privateKey: Uint8Array, publicKey: Uint8Array } {
    if (seed.length !== 48) {
      // Warn but allow, though Falcon usually expects 48 bytes seed for SHAKE256 expansion
      console.warn(`Seed length is ${seed.length}, expected 48 bytes`);
    }

    const seedPtr = this.malloc(seed.length);
    const privKeyPtr = this.malloc(this.FALCON512_PRIVKEY_SIZE);
    const pubKeyPtr = this.malloc(this.FALCON512_PUBKEY_SIZE);

    try {
      this.writeToMemory(seed, seedPtr);

      const ret = this.module._falcon512_keygen_from_seed(
        seedPtr, seed.length,
        privKeyPtr, pubKeyPtr
      );

      if (ret !== 0) {
        throw new Error(`Keygen failed with code ${ret}`);
      }

      const privateKey = this.readFromMemory(privKeyPtr, this.FALCON512_PRIVKEY_SIZE).slice();
      const publicKey = this.readFromMemory(pubKeyPtr, this.FALCON512_PUBKEY_SIZE).slice();

      return { privateKey, publicKey };
    } finally {
      this.free(seedPtr);
      this.free(privKeyPtr);
      this.free(pubKeyPtr);
    }
  }

  signMessage(message: Uint8Array, privateKey: Uint8Array, rngSeed: Uint8Array): Uint8Array {
    const msgPtr = this.malloc(message.length);
    const privKeyPtr = this.malloc(privateKey.length);
    const rngSeedPtr = this.malloc(rngSeed.length);
    const sigPtr = this.malloc(this.FALCON512_SIG_MAX_SIZE);
    const sigLenPtr = this.malloc(8); // size_t (64-bit usually in Emscripten unless wasm32 is 32-bit)

    try {
      this.writeToMemory(message, msgPtr);
      this.writeToMemory(privateKey, privKeyPtr);
      this.writeToMemory(rngSeed, rngSeedPtr);

      // Set initial max size in sigLenPtr (optional depending on implementation, but good practice)
      // The C wrapper might expect it or just write to it.
      // Based on falcon.js:
      // const sigLenView = new DataView(module.HEAPU8.buffer, sigLenPtr, 8);
      // sigLenView.setUint32(0, FALCON512_SIG_MAX_SIZE, true);
      const sigLenView = new DataView(this.module.HEAPU8.buffer, sigLenPtr, 8);
      sigLenView.setUint32(0, this.FALCON512_SIG_MAX_SIZE, true);

      const ret = this.module._falcon512_sign(
        msgPtr, 
        message.length, 
        privKeyPtr, 
        rngSeedPtr, 
        rngSeed.length,
        sigPtr, 
        sigLenPtr
      );

      if (ret !== 0) {
        throw new Error(`Signing failed with code ${ret}`);
      }

      // Read signature length
      // const actualSigLen = sigLenView.getUint32(0, true);
      const actualSigLen = sigLenView.getUint32(0, true);
      
      return this.readFromMemory(sigPtr, actualSigLen).slice();

    } finally {
      this.free(msgPtr);
      this.free(privKeyPtr);
      this.free(rngSeedPtr);
      this.free(sigPtr);
      this.free(sigLenPtr);
    }
  }

  verifySignature(message: Uint8Array, signature: Uint8Array, publicKey: Uint8Array): boolean {
    const msgPtr = this.malloc(message.length);
    const sigPtr = this.malloc(signature.length);
    const pubKeyPtr = this.malloc(publicKey.length);

    try {
      this.writeToMemory(message, msgPtr);
      this.writeToMemory(signature, sigPtr);
      this.writeToMemory(publicKey, pubKeyPtr);

      const ret = this.module._falcon512_verify(
        msgPtr, 
        message.length, 
        sigPtr, 
        signature.length, 
        pubKeyPtr
      );

      return ret === 0;
    } finally {
      this.free(msgPtr);
      this.free(sigPtr);
      this.free(pubKeyPtr);
    }
  }

  getPublicKeyCoefficients(publicKey: Uint8Array): number[] {
    const pubKeyPtr = this.malloc(publicKey.length);
    const coeffsPtr = this.malloc(this.FALCON512_N * 2); // 16-bit ints

    try {
      this.writeToMemory(publicKey, pubKeyPtr);
      
      const ret = this.module._falcon512_get_pubkey_coefficients(pubKeyPtr, coeffsPtr);
      if (ret !== 0) {
        throw new Error(`Failed to extract public key coefficients: error code ${ret}`);
      }

      const coeffs = this.readInt16FromMemory(coeffsPtr, this.FALCON512_N);
      return Array.from(coeffs);
    } finally {
      this.free(pubKeyPtr);
      this.free(coeffsPtr);
    }
  }

  getSignatureCoefficients(signature: Uint8Array): { s0: number[], s1: number[] } {
    const sigPtr = this.malloc(signature.length);
    const s0Ptr = this.malloc(this.FALCON512_N * 2);
    const s1Ptr = this.malloc(this.FALCON512_N * 2);

    try {
      this.writeToMemory(signature, sigPtr);
      
      const ret = this.module._falcon512_get_signature_coefficients(
        sigPtr, 
        signature.length, 
        s0Ptr, 
        s1Ptr
      );

      if (ret !== 0) {
        throw new Error(`Failed to extract signature coefficients: error code ${ret}`);
      }
      
      const s0 = Array.from(this.readInt16FromMemory(s0Ptr, this.FALCON512_N));
      const s1 = Array.from(this.readInt16FromMemory(s1Ptr, this.FALCON512_N));
      
      return { s0, s1 }; 
    } finally {
      this.free(sigPtr);
      this.free(s0Ptr);
      this.free(s1Ptr);
    }
  }

  hashToPoint(nonceAndMsg: Uint8Array): number[] {
    const inPtr = this.malloc(nonceAndMsg.length);
    const coeffsPtr = this.malloc(this.FALCON512_N * 2);

    try {
      this.writeToMemory(nonceAndMsg, inPtr);
      
      const ret = this.module._falcon512_hash_to_point(
        inPtr, 
        nonceAndMsg.length, 
        coeffsPtr
      );

      if (ret !== 0) {
        throw new Error(`Hash-to-point failed with error code: ${ret}`);
      }

      return Array.from(this.readInt16FromMemory(coeffsPtr, this.FALCON512_N));
    } finally {
      this.free(inPtr);
      this.free(coeffsPtr);
    }
  }
}

