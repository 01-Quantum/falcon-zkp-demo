import { Routes } from '@angular/router';
import { ProofGenerationComponent } from './components/proof-generation/proof-generation';
import { ProofVerificationComponent } from './components/proof-verification/proof-verification';
import { FalconSignatureComponent } from './components/falcon-signature/falcon-signature';

export const routes: Routes = [
  { path: '', redirectTo: '/falcon-signature', pathMatch: 'full' },
  { path: 'falcon-signature', component: FalconSignatureComponent },
  { path: 'generate', component: ProofGenerationComponent },
  { path: 'verify', component: ProofVerificationComponent },
  { path: '**', redirectTo: '/falcon-signature' }
];
