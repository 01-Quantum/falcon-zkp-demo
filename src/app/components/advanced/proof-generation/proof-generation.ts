import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ZkpService } from '../../../services/zkp';

@Component({
  selector: 'app-proof-generation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './proof-generation.html',
  styleUrls: ['./proof-generation.scss']
})
export class ProofGenerationComponent {
  // Form fields - full circuit inputs
  s1: string = '';
  h_hat: string = '';
  h_product_inv: string = '';
  h2p_d: string = '';
  pk_hash_in: string = '';
  in_tx_hash1: string = '';
  in_tx_hash2: string = '';
  in_c_hash: string = '';

  loading: boolean = false;
  error: string | null = null;
  showArrayHelper: boolean = false;

  constructor(
    private zkpService: ZkpService,
    private router: Router
  ) { }

  ngOnInit() {
    // Check if we have prefilled inputs from the falcon-signature page
    const prefilledInput = sessionStorage.getItem('prefilled_circuit_input');
    if (prefilledInput) {
      try {
        const input = JSON.parse(prefilledInput);
        this.s1 = JSON.stringify(input.s1);
        this.h_hat = JSON.stringify(input.h_hat);
        this.h_product_inv = JSON.stringify(input.h_product_inv);
        this.h2p_d = JSON.stringify(input.h2p_d);
        this.pk_hash_in = input.pk_hash_in;
        this.in_tx_hash1 = input.in_tx_hash1;
        this.in_tx_hash2 = input.in_tx_hash2;
        this.in_c_hash = input.in_c_hash;

        // Clear the session storage after loading
        sessionStorage.removeItem('prefilled_circuit_input');

        console.log('Loaded prefilled circuit inputs from Falcon Signature page');
      } catch (err) {
        console.error('Failed to load prefilled inputs:', err);
      }
    }
  }

  async loadExample(exampleNumber: 1 | 2) {
    try {
      this.loading = true;
      this.error = null;

      // Load full circuit input example
      const response = await fetch(`assets/input-falcon512-${exampleNumber}.json`);
      const example = await response.json();

      this.s1 = JSON.stringify(example.s1);
      this.h_hat = JSON.stringify(example.h_hat);
      this.h_product_inv = JSON.stringify(example.h_product_inv);
      this.h2p_d = JSON.stringify(example.h2p_d);
      this.pk_hash_in = example.pk_hash_in;
      this.in_tx_hash1 = example.in_tx_hash1;
      this.in_tx_hash2 = example.in_tx_hash2;
      this.in_c_hash = example.in_c_hash;

      this.loading = false;
    } catch (err: any) {
      this.error = 'Failed to load example: ' + err.message;
      this.loading = false;
    }
  }

  async generateProof() {
    try {
      this.loading = true;
      this.error = null;

      console.log('Parsing form inputs...');

      // Parse form inputs into circuit input format
      const fullInput = {
        s1: JSON.parse(this.s1),
        h_hat: JSON.parse(this.h_hat),
        h_product_inv: JSON.parse(this.h_product_inv),
        h2p_d: JSON.parse(this.h2p_d),
        pk_hash_in: this.pk_hash_in,
        in_tx_hash1: this.in_tx_hash1,
        in_tx_hash2: this.in_tx_hash2,
        in_c_hash: this.in_c_hash
      };

      console.log('Circuit input parsed from form:', {
        s1_length: fullInput.s1.length,
        h_hat_length: fullInput.h_hat.length,
        h_product_inv_length: fullInput.h_product_inv.length,
        h2p_d_length: fullInput.h2p_d.length,
        pk_hash_in: fullInput.pk_hash_in,
        in_tx_hash1: fullInput.in_tx_hash1,
        in_tx_hash2: fullInput.in_tx_hash2,
        in_c_hash: fullInput.in_c_hash
      });

      console.log('Generating proof with form inputs...');

      // Generate proof with full circuit input from form
      const proofData = await this.zkpService.generateProof(fullInput);

      // Store in sessionStorage and navigate to verification page
      sessionStorage.setItem('zkp_proof', JSON.stringify(proofData.proof));
      sessionStorage.setItem('zkp_publicSignals', JSON.stringify(proofData.publicSignals));

      this.loading = false;

      // Navigate to verification page
      this.router.navigate(['/advanced/verify']);
    } catch (err: any) {
      this.error = err.message || 'Failed to generate proof';
      this.loading = false;
      console.error('Error generating proof:', err);
    }
  }

  clearForm() {
    this.s1 = '';
    this.h_hat = '';
    this.h_product_inv = '';
    this.h2p_d = '';
    this.pk_hash_in = '';
    this.in_tx_hash1 = '';
    this.in_tx_hash2 = '';
    this.in_c_hash = '';
    this.error = null;
  }
}
