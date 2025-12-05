import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  title = 'Falcon-512 ZKP Demo';
  walletAddress: string | null = null;
  isWalletConnecting = false;

  async connectWallet() {
    if (this.walletAddress) {
      this.disconnectWallet();
      return;
    }

    this.isWalletConnecting = true;
    try {
      // Check if MetaMask is installed
      const ethereum = (window as any).ethereum;
      if (!ethereum) {
        alert('MetaMask is not installed. Please install it to use this feature.');
        return;
      }

      // Request account access
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts.length > 0) {
        this.walletAddress = accounts[0];
        console.log('Wallet connected:', this.walletAddress);
      } else {
        console.warn('No accounts found');
      }
    } catch (error: any) {
      console.error('User denied account access or error occurred:', error);
      alert('Failed to connect wallet: ' + (error.message || 'Unknown error'));
    } finally {
      this.isWalletConnecting = false;
    }
  }

  disconnectWallet() {
    this.walletAddress = null;
    console.log('Wallet disconnected');
  }

  formatAddress(address: string): string {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }
}
