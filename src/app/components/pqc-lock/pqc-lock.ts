import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FalconWasmService } from '../../services/falcon-wasm.service';
import { FalconCircuitInputsService } from '../../services/falcon-circuit-inputs.service';
import { ZkpService } from '../../services/zkp';

@Component({
    selector: 'app-pqc-lock',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './pqc-lock.html',
    styleUrls: ['./pqc-lock.scss']
})
export class PqcLockComponent {
    seed: string = '';
    privateKey: Uint8Array | null = null;
    publicKey: Uint8Array | null = null;
    publicKeyBase64: string = '';
    privateKeyBase64: string = '';
    lockId: string = '';
    isPrivateKeyRevealed: boolean = false;

    // Unlock status
    isUnlocked: boolean = false;
    proof: any = null;
    loading: boolean = false;
    error: string | null = null;
    statusMessage: string = '';

    constructor(
        private falconWasmService: FalconWasmService,
        private falconCircuitInputsService: FalconCircuitInputsService,
        private zkpService: ZkpService
    ) { }

    async generateKey() {
        if (!this.seed) {
            this.error = 'Please enter a seed first.';
            return;
        }

        try {
            this.loading = true;
            this.error = null;
            this.statusMessage = 'Generating keys from seed...';

            // 1. Generate Keypair
            const seedBytes = new TextEncoder().encode(this.seed);
            // Pad/Truncate to 48 bytes
            const seed48 = new Uint8Array(48);
            seed48.set(seedBytes.slice(0, 48));

            const keypair = await this.falconWasmService.createKeypairFromSeed(seed48);
            this.privateKey = keypair.privateKey;
            this.publicKey = keypair.publicKey;
            this.publicKeyBase64 = this.toBase64(keypair.publicKey);
            this.privateKeyBase64 = this.toBase64(keypair.privateKey);

            // 2. Generate Lock ID (Poseidon Hash)
            const pubKeyCoeffs = this.falconWasmService.getPublicKeyCoefficients(keypair.publicKey);
            const hash = await this.falconCircuitInputsService.computePoseidonHash(pubKeyCoeffs);
            this.lockId = hash.toString();

            this.statusMessage = 'Keys generated successfully!';
            this.loading = false;
        } catch (err: any) {
            this.error = 'Key generation failed: ' + err.message;
            this.loading = false;
        }
    }

    async unlock() {
        if (!this.privateKey || !this.publicKey) return;

        try {
            this.loading = true;
            this.error = null;
            this.statusMessage = 'Signing unlock request and generating proof (this takes ~10s)...';

            // 1. Sign a mock message
            const messageStr = "UNLOCK_REQUEST_" + Date.now();
            const message = new TextEncoder().encode(messageStr);
            const rngSeed = new Uint8Array(48); // All zeros for deterministic signing

            // Use correct method name: signMessage
            const signature = await this.falconWasmService.signMessage(message, this.privateKey, rngSeed);

            // 2. Extract Coefficients for Circuit Inputs
            const sigCoeffs = this.falconWasmService.getSignatureCoefficients(signature);
            const pubKeyCoeffs = this.falconWasmService.getPublicKeyCoefficients(this.publicKey!);

            // 3. Hash-to-point (Nonce + Message)
            const nonce = signature.slice(1, 41);
            const nonceAndMessage = new Uint8Array(nonce.length + message.length);
            nonceAndMessage.set(nonce);
            nonceAndMessage.set(message, nonce.length);
            const h2p = this.falconWasmService.hashToPoint(nonceAndMessage);

            // 4. Mock Transaction Hashes (since this is a local lock demo)
            const txHash1 = "12345678901234567890";
            const txHash2 = "98765432109876543210";

            // 5. Generate Circuit Inputs with ALL required arguments
            const circuitInputs = await this.falconCircuitInputsService.generateCircuitInputs(
                sigCoeffs.s1,
                pubKeyCoeffs,
                h2p,
                txHash1,
                txHash2
            );

            // 6. Generate ZK Proof
            const proofData = await this.zkpService.generateProof(circuitInputs);
            this.proof = proofData.proof;
            this.isUnlocked = true;

            this.statusMessage = '🔓 Unlocked successfully! Zero-Knowledge Proof generated.';
            this.loading = false;

        } catch (err: any) {
            this.error = 'Unlock failed: ' + err.message;
            this.loading = false;
            console.error(err);
        }
    }

    reset() {
        this.seed = '';
        this.privateKey = null;
        this.publicKey = null;
        this.publicKeyBase64 = '';
        this.privateKeyBase64 = '';
        this.lockId = '';
        this.isPrivateKeyRevealed = false;
        this.isUnlocked = false;
        this.proof = null;
        this.error = null;
        this.statusMessage = '';
    }

    toBase64(bytes: Uint8Array): string {
        let binary = '';
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    async copyToClipboard(text: string) {
        try {
            await navigator.clipboard.writeText(text);
            const oldStatus = this.statusMessage;
            this.statusMessage = '📋 Copied to clipboard!';
            setTimeout(() => {
                if (this.statusMessage === '📋 Copied to clipboard!') {
                    this.statusMessage = oldStatus;
                }
            }, 2000);
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    }

    toggleRevealPrivateKey() {
        this.isPrivateKeyRevealed = !this.isPrivateKeyRevealed;
    }
}
