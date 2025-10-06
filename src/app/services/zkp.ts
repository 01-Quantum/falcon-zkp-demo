import { Injectable } from '@angular/core';
import * as snarkjs from 'snarkjs';

// Simplified input from user
export interface SimplifiedInput {
  s1: number[];
  h: number[];  // or h_hat if already NTT-transformed
  h2p: number[];
  in_tx_hash1: string;
  in_tx_hash2: string;
}

// Full circuit input (generated from simplified input)
export interface CircuitInput {
  s1: number[];
  h_hat: number[];
  h_product_inv: number[];
  h2p_d: number[];
  pk_hash_in: string;
  in_tx_hash1: string;
  in_tx_hash2: string;
  in_c_hash: string;
}

export interface ProofData {
  proof: any;
  publicSignals: any[];
}

@Injectable({
  providedIn: 'root'
})
export class ZkpService {
  private wasmPath = 'assets/falcon_512_test.wasm';
  private zkeyPath = 'assets/falcon-512.zkey';
  private vKeyPath = 'assets/falcon-512_vkey.json';



  async generateProof(input: CircuitInput): Promise<ProofData> {
    try {
      console.log('Loading WASM and zkey files...');
      
      // Generate witness and proof
      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        input,
        this.wasmPath,
        this.zkeyPath
      );

      console.log('Proof generated successfully');
      console.log('Public Signals:', publicSignals);
      
      return { proof, publicSignals };
    } catch (error) {
      console.error('Error generating proof:', error);
      throw error;
    }
  }

  async verifyProof(proof: any, publicSignals: any[]): Promise<boolean> {
    try {
      console.log('Loading verification key...');
      
      // Load verification key
      const vKeyResponse = await fetch(this.vKeyPath);
      const vKey = await vKeyResponse.json();

      console.log('Verifying proof...');
      const isValid = await snarkjs.groth16.verify(vKey, publicSignals, proof);

      console.log('Verification result:', isValid);
      return isValid;
    } catch (error) {
      console.error('Error verifying proof:', error);
      throw error;
    }
  }

  // Helper to parse array input
  parseArrayInput(input: string): number[] {
    try {
      const cleaned = input.trim();
      if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
        return JSON.parse(cleaned);
      }
      return cleaned.split(',').map(s => parseInt(s.trim(), 10));
    } catch (error) {
      throw new Error('Invalid array format');
    }
  }

  // Helper to load example input
  async loadExampleInput(exampleNumber: 1 | 2): Promise<CircuitInput> {
    const response = await fetch(`assets/input-falcon512-${exampleNumber}.json`);
    return await response.json();
  }
}
