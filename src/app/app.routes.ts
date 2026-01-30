import { Routes } from '@angular/router';
import { ProofGenerationComponent } from './components/advanced/proof-generation/proof-generation';
import { ProofVerificationComponent } from './components/advanced/proof-verification/proof-verification';
import { FalconSignatureComponent } from './components/advanced/falcon-signature/falcon-signature';

import { PqcLockComponent } from './components/pqc-lock/pqc-lock';

export const routes: Routes = [
  { path: '', redirectTo: '/pqc-lock', pathMatch: 'full' },
  { path: 'advanced/falcon-signature', component: FalconSignatureComponent },
  { path: 'advanced/generate', component: ProofGenerationComponent },
  { path: 'advanced/verify', component: ProofVerificationComponent },
  { path: 'pqc-lock', component: PqcLockComponent },
  { path: '**', redirectTo: '/pqc-lock' }
];
