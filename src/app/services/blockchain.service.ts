import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BlockchainService {
  // Contract & Network Constants
  readonly CONTRACT_ADDRESS = '0x586D3394b2c21C400927F0BD4038dA474ca35efb';
  readonly CHAIN_ID_HEX = '0x3E6'; // 998
  readonly CHAIN_ID_DECIMAL = 998;
  readonly RPC_URL = 'https://rpc.hyperliquid-testnet.xyz/evm';
  readonly EXPLORER_URL = 'https://testnet.purrsec.com'; 
  readonly NETWORK_NAME = 'Hyperliquid EVM Testnet';

  // State Management
  private walletAddressSubject = new BehaviorSubject<string | null>(null);
  walletAddress$ = this.walletAddressSubject.asObservable();

  private isAuthorizedSubject = new BehaviorSubject<boolean | null>(null);
  isAuthorized$ = this.isAuthorizedSubject.asObservable();

  private checkingAuthSubject = new BehaviorSubject<boolean>(false);
  checkingAuth$ = this.checkingAuthSubject.asObservable();

  private isConnectingSubject = new BehaviorSubject<boolean>(false);
  isConnecting$ = this.isConnectingSubject.asObservable();

  get walletAddress(): string | null {
    return this.walletAddressSubject.value;
  }

  async connectWallet() {
    if (this.walletAddressSubject.value) {
      this.disconnectWallet();
      return;
    }

    this.isConnectingSubject.next(true);
    try {
      const ethereum = (window as any).ethereum;
      if (!ethereum) {
        alert('MetaMask is not installed. Please install it to use this feature.');
        return;
      }

      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts.length > 0) {
        const address = accounts[0];
        this.walletAddressSubject.next(address);
        console.log('Wallet connected:', address);
        
        await this.switchNetwork(ethereum);
        this.checkAuthorization();
      } else {
        console.warn('No accounts found');
      }
    } catch (error: any) {
      console.error('User denied account access or error occurred:', error);
      alert('Failed to connect wallet: ' + (error.message || 'Unknown error'));
    } finally {
      this.isConnectingSubject.next(false);
    }
  }

  async switchNetwork(ethereum: any) {
    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: this.CHAIN_ID_HEX }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: this.CHAIN_ID_HEX,
                chainName: this.NETWORK_NAME,
                rpcUrls: [this.RPC_URL],
                nativeCurrency: {
                  name: 'HYPE',
                  symbol: 'HYPE',
                  decimals: 18,
                },
              },
            ],
          });
        } catch (addError) {
          console.error('Failed to add network:', addError);
          alert('Failed to add Hyperliquid Testnet to MetaMask.');
        }
      } else {
        console.error('Failed to switch network:', switchError);
      }
    }
  }

  disconnectWallet() {
    this.walletAddressSubject.next(null);
    this.isAuthorizedSubject.next(null);
    console.log('Wallet disconnected');
  }

  async checkAuthorization() {
    const address = this.walletAddressSubject.value;
    if (!address) return;

    this.checkingAuthSubject.next(true);
    try {
        const ethereum = (window as any).ethereum;
        
        const functionSelector = '0xfe9fbb80'; // keccak256("isAuthorized(address)")
        const addrClean = address.toLowerCase().replace("0x", "");
        const paddedAddress = addrClean.padStart(64, '0');
        const data = functionSelector + paddedAddress;

        const result = await ethereum.request({
            method: 'eth_call',
            params: [{
                to: this.CONTRACT_ADDRESS,
                data: data
            }, 'latest']
        });

        console.log('Authorization result:', result);
        if (!result || result === '0x') {
            this.isAuthorizedSubject.next(false);
        } else {
            this.isAuthorizedSubject.next(BigInt(result) !== 0n);
        }
        
    } catch(e) {
        console.error('Error checking authorization:', e);
        this.isAuthorizedSubject.next(null);
    } finally {
        this.checkingAuthSubject.next(false);
    }
  }

  formatAddress(address: string): string {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }
}

