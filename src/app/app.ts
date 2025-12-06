import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BlockchainService } from './services/blockchain.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  title = 'Falcon-512 ZKP Demo';
  
  // Expose service observables
  walletAddress$;
  isAuthorized$;
  checkingAuth$;
  isConnecting$;

  constructor(public blockchainService: BlockchainService) {
    this.walletAddress$ = this.blockchainService.walletAddress$;
    this.isAuthorized$ = this.blockchainService.isAuthorized$;
    this.checkingAuth$ = this.blockchainService.checkingAuth$;
    this.isConnecting$ = this.blockchainService.isConnecting$;
  }

  connectWallet() {
    this.blockchainService.connectWallet();
  }

  disconnectWallet() {
    this.blockchainService.disconnectWallet();
  }

  checkAuthorization() {
    this.blockchainService.checkAuthorization();
  }

  enforceUnlock() {
    const address = this.blockchainService.walletAddress;
    if (address) {
        this.blockchainService.enforceUnlock(address);
    }
  }

  formatAddress(address: string | null): string {
    if (!address) return '';
    return this.blockchainService.formatAddress(address);
  }
}
