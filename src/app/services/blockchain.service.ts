import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})  
export class BlockchainService {
  // Contract & Network Constants
  readonly CONTRACT_ADDRESS = '0x83478750A5A4D77c8488Dc0A85B3c2209ff591D7';
  readonly CHAIN_ID_HEX = '0x3E6'; // 998
  readonly CHAIN_ID_DECIMAL = 998;
  readonly RPC_URL = 'https://rpc.hyperliquid-testnet.xyz/evm';
  readonly EXPLORER_URL = 'https://testnet.purrsec.com'; 
  readonly NETWORK_NAME = 'Hyperliquid EVM Testnet';

    // Contract Interface
    readonly ABI = [
      "function lock(bytes32 falconPubHash) external",
      "function unlock(bytes32 falconPubHash, bytes32 txHash, uint256[2] _pA, uint256[2][2] _pB, uint256[2] _pC) external",
      "function isAuthorized(address account) external view returns (bool)",
      "function falconLocks(address account) external view returns (bytes32)",
      "function dbg_enforce_unlock(address target) external",
    ];

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

  private async sendTransaction(data: string, successMessage: string) {
    const address = this.walletAddressSubject.value;
    if (!address) {
        alert('Please connect your wallet first');
        return;
    }

    try {
        const ethereum = (window as any).ethereum;

        // Ensure we are on the correct network before sending transaction
        const currentChainId = await ethereum.request({ method: 'eth_chainId' });
        if (currentChainId !== this.CHAIN_ID_HEX) {
            await this.switchNetwork(ethereum);
        }

        console.log('Sending Transaction:');
        console.log('  To:', this.CONTRACT_ADDRESS);
        console.log('  From:', address);
        console.log('  Data:', data);

        const txHash = await ethereum.request({
            method: 'eth_sendTransaction',
            params: [{
                to: this.CONTRACT_ADDRESS,
                from: address,
                data: data,
            }]
        });

        console.log('Transaction sent:', txHash);
        alert(`${successMessage} Hash: ${txHash}`);
        
    } catch (error: any) {
        console.error('Error sending transaction:', error);
        alert('Transaction failed: ' + (error.message || 'Unknown error'));
    }
  }

  async lockAccount(falconPubHash: string) {
    // Function signature for lock(bytes32)
    // keccak256("lock(bytes32)") = 0x01670ba9
    const functionSelector = '0x01670ba9'; 
    
    // falconPubHash is a decimal string from the circuit output (field element)
    // Convert to 32-byte hex string
    const pubHashBigInt = BigInt(falconPubHash);

    if (pubHashBigInt === 0n) {
        alert('Error: Public Key Hash is 0. Cannot lock account with invalid hash.');
        return;
    }

    const pubHashHex = pubHashBigInt.toString(16).padStart(64, '0');
    const data = functionSelector + pubHashHex;
    
    await this.sendTransaction(data, 'Lock transaction sent!');
  }

  async enforceUnlock(targetAddress: string) {
    // Function signature for dbg_enforce_unlock(address)
    // keccak256("dbg_enforce_unlock(address)") = 0x01d561a8
    const functionSelector = '0x01d561a8'; 
    
    const addrClean = targetAddress.toLowerCase().replace("0x", "");
    const paddedAddress = addrClean.padStart(64, '0');
    
    const data = functionSelector + paddedAddress;

    await this.sendTransaction(data, 'Unlock transaction sent!');
  }

  async unlockAccount(falconPubHash: string, txHashLow: string, txHashHigh: string, pi_a: string[], pi_b: string[][], pi_c: string[]) {
    // Function signature for unlock(...)
    // Selector: 0xaf425f09
    const functionSelector = '0xaf425f09';

    // 1. Encode falconPubHash (bytes32)
    const pubHashBigInt = BigInt(falconPubHash);
    const pubHashHex = pubHashBigInt.toString(16).padStart(64, '0');

    // 2. Reconstruct txHash (bytes32) from Low and High parts
    // txHash = (High << 128) | Low
    const low = BigInt(txHashLow);
    const high = BigInt(txHashHigh);
    const txHashBigInt = (high << 128n) | low;
    const txHashHex = txHashBigInt.toString(16).padStart(64, '0');

    // 3. Encode _pA (uint256[2]) -> 2 words
    const pA_0 = BigInt(pi_a[0]).toString(16).padStart(64, '0');
    const pA_1 = BigInt(pi_a[1]).toString(16).padStart(64, '0');

    // 4. Encode _pB (uint256[2][2]) -> 4 words
    // SnarkJS output: [ [x, y], [x, y], ... ]
    // Flattened: pB[0][0], pB[0][1], pB[1][0], pB[1][1]
    // Note: SnarkJS usually gives strings.
    const pB_00 = BigInt(pi_b[0][1]).toString(16).padStart(64, '0'); // x1
    const pB_01 = BigInt(pi_b[0][0]).toString(16).padStart(64, '0'); // y1
    const pB_10 = BigInt(pi_b[1][1]).toString(16).padStart(64, '0'); // x2
    const pB_11 = BigInt(pi_b[1][0]).toString(16).padStart(64, '0'); // y2
    // WAIT! Groth16 verification on Ethereum often requires swapping coordinates or specific ordering.
    // Standard SnarkJS `exportSolidity` swaps them:
    // pB = [[pB[0][1], pB[0][0]], [pB[1][1], pB[1][0]]]
    // So I swapped [0] and [1] indices above based on common snarkjs behavior.

    // 5. Encode _pC (uint256[2]) -> 2 words
    const pC_0 = BigInt(pi_c[0]).toString(16).padStart(64, '0');
    const pC_1 = BigInt(pi_c[1]).toString(16).padStart(64, '0');

    const data = functionSelector + 
                 pubHashHex + 
                 txHashHex + 
                 pA_0 + pA_1 + 
                 pB_00 + pB_01 + pB_10 + pB_11 + 
                 pC_0 + pC_1;

    await this.sendTransaction(data, 'Unlock Proof transaction sent!');
  }

  formatAddress(address: string): string {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }
}

