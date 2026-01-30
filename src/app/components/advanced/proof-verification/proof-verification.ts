import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ZkpService } from '../../../services/zkp';
import { BlockchainService } from '../../../services/blockchain.service';

@Component({
  selector: 'app-proof-verification',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './proof-verification.html',
  styleUrls: ['./proof-verification.scss']
})
export class ProofVerificationComponent implements OnInit {
  proof: any = null;
  publicSignals: any[] = [];
  verificationResult: boolean | null = null;
  loading = false;
  error: string | null = null;

  // For manual input
  manualMode = false;
  proofInput: string = '';
  publicSignalsInput: string = '';

  // Expose JSON to template
  JSON = JSON;

  constructor(
    private zkpService: ZkpService,
    private router: Router,
    private blockchainService: BlockchainService
  ) { }

  ngOnInit() {
    // Load proof from sessionStorage if available
    const storedProof = sessionStorage.getItem('zkp_proof');
    const storedSignals = sessionStorage.getItem('zkp_publicSignals');

    if (storedProof && storedSignals) {
      this.proof = JSON.parse(storedProof);
      this.publicSignals = JSON.parse(storedSignals);
      this.proofInput = JSON.stringify(this.proof, null, 2);
      this.publicSignalsInput = JSON.stringify(this.publicSignals, null, 2);
    } else {
      this.manualMode = true;
    }
  }

  async verifyProof() {
    try {
      this.loading = true;
      this.error = null;
      this.verificationResult = null;

      let proofToVerify = this.proof;
      let signalsToVerify = this.publicSignals;

      // If in manual mode, parse the input
      if (this.manualMode) {
        try {
          // Use the edited inputs from the textareas
          proofToVerify = JSON.parse(this.proofInput);
          signalsToVerify = JSON.parse(this.publicSignalsInput);

          // Update component state to reflect edits
          this.proof = proofToVerify;
          this.publicSignals = signalsToVerify;
        } catch (parseError) {
          throw new Error('Invalid JSON format for proof or public signals');
        }
      }

      console.log('Verifying proof...');
      const isValid = await this.zkpService.verifyProof(proofToVerify, signalsToVerify);

      this.verificationResult = isValid;
      this.loading = false;
    } catch (err: any) {
      this.error = err.message || 'Failed to verify proof';
      this.loading = false;
      console.error('Error verifying proof:', err);
    }
  }

  toggleMode() {
    this.manualMode = !this.manualMode;
    if (this.manualMode) {
      this.proofInput = JSON.stringify(this.proof, null, 2);
      this.publicSignalsInput = JSON.stringify(this.publicSignals, null, 2);
    }
  }

  async loadExampleProof() {
    try {
      const response = await fetch('assets/proof-2.json');
      const proof = await response.json();

      const pubResponse = await fetch('assets/public-2.json');
      const publicSignals = await pubResponse.json();

      this.proof = proof;
      this.publicSignals = publicSignals;
      this.proofInput = JSON.stringify(proof, null, 2);
      this.publicSignalsInput = JSON.stringify(publicSignals, null, 2);
      this.manualMode = false;
    } catch (err: any) {
      this.error = 'Failed to load example proof: ' + err.message;
    }
  }

  goBack() {
    this.router.navigate(['/advanced/generate']);
  }

  clearResults() {
    this.verificationResult = null;
    this.error = null;
  }

  copyToClipboard(text: string, type: string) {
    navigator.clipboard.writeText(text).then(() => {
      alert(`${type} copied to clipboard!`);
    });
  }

  async unlockAccount() {
    if (!this.proof || !this.publicSignals || this.publicSignals.length < 3) {
      alert('Please verify a valid proof first.');
      return;
    }

    try {
      const falconPubHash = this.publicSignals[0];
      const txHashLow = this.publicSignals[1];
      const txHashHigh = this.publicSignals[2];

      const pi_a = this.proof.pi_a;
      const pi_b = this.proof.pi_b;
      const pi_c = this.proof.pi_c;

      await this.blockchainService.unlockAccount(
        falconPubHash,
        txHashLow,
        txHashHigh,
        pi_a,
        pi_b,
        pi_c
      );

    } catch (e: any) {
      console.error(e);
      alert('Failed to send unlock transaction: ' + e.message);
    }
  }
}
