// SPDX-License-Identifier: MIT
// Deployed at hyperliqud EVM test net at address: 0x586D3394b2c21C400927F0BD4038dA474ca35efb
// Testnet
// Chain ID: 998 

// JSON-RPC endpoint: https://rpc.hyperliquid-testnet.xyz/evm

pragma solidity ^0.8.20;

import "./interfaces/IPQCAuthorizer.sol";
import "./falcon_512_test.sol";

/**
 * @title Falcon512Authorizer
 * @notice PQC authorizer that allows users to lock their account and unlock it with a Falcon-512 ZKP proof
 */
contract Falcon512Authorizer is IPQCAuthorizer {
    Groth16Verifier public immutable verifier;

    // Mapping from user address to their Falcon public key hash
    // If an entry exists (non-zero), the account is "locked" (not authorized)
    mapping(address => bytes32) public falconLocks;

    event AccountLocked(address indexed account, bytes32 falconPubHash);
    event AccountUnlocked(address indexed account, bytes32 falconPubHash);

    /**
     * @notice Constructor sets the verifier address
     * @param _verifier The address of the Groth16Verifier contract
     */
    constructor(address _verifier) {
        require(_verifier != address(0), "Falcon512Authorizer: verifier is zero address");
        verifier = Groth16Verifier(_verifier);
    }

    /**
     * @notice Check if an address is authorized to send tokens
     * @param account The address to check
     * @return authorized False if the account is locked (entry exists), True otherwise
     */
    function isAuthorized(address account) external view override returns (bool authorized) {
        // Requirement 4: isAuthorized checks the hash and return false if the entry exists
        return falconLocks[account] == bytes32(0);
    }

    /**
     * @notice Authorize an upgrade to a new PQC authorizer
     * @dev Always returns false as per requirements
     */
    function authorizeUpgrade(
        address, /*sender*/
        address, /*tokenContract*/
        address, /*currentAuthorizer*/
        address, /*newAuthorizer*/
        bytes calldata /*proof*/
    ) external pure override returns (bool approved) {
        // Requirement 2: authorizeUpgrade should always return false
        return false;
    }

    /**
     * @notice Lock the sender's account with a Falcon public key hash
     * @param falconPubHash The hash of the Falcon public key
     */
    function lock(bytes32 falconPubHash) external {
        require(falconPubHash != bytes32(0), "Falcon512Authorizer: invalid pubKey hash");
        // Requirement 3: lock owner -> that hash
        falconLocks[msg.sender] = falconPubHash;
        emit AccountLocked(msg.sender, falconPubHash);
    }

    /**
     * @notice Unlock the sender's account using a ZKP proof
     * @param falconPubHash The hash of the Falcon public key
     * @param txHash The transaction hash (or message hash) signed
     * @param _pA Proof point A
     * @param _pB Proof point B
     * @param _pC Proof point C
     */
    function unlock(
        bytes32 falconPubHash,
        bytes32 txHash,
        uint[2] calldata _pA,
        uint[2][2] calldata _pB,
        uint[2] calldata _pC
    ) external {
        // Verify the lock exists and matches
        require(falconLocks[msg.sender] == falconPubHash, "Falcon512Authorizer: account not locked with this key");

        // Requirement 5: unlock splits hash in 128 lower and upper
        // and calls zkp verify proof with pubSignals (pubKey hash, and low and hi tx hash portion)
        
        uint256 low = uint256(txHash) & 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF; // Lower 128 bits
        uint256 high = uint256(txHash) >> 128;                            // Upper 128 bits
        
        uint[3] memory pubSignals = [
            uint256(falconPubHash),
            low,
            high
        ];

        // Call verifyProof
        // Note: The verifier must be deployed and match the interface in falcon_512_test.sol
        bool valid = verifier.verifyProof(_pA, _pB, _pC, pubSignals);
        require(valid, "Falcon512Authorizer: invalid ZKP proof");

        // Requirement 6: if zkp ok then the map at step 1 is removed
        delete falconLocks[msg.sender];
        emit AccountUnlocked(msg.sender, falconPubHash);
    }

    /**
     * @notice DEBUG ONLY: Force unlock an account without proof
     * @dev This function is for testnet debugging and will be removed in production.
     *      It allows bypassing the ZKP check to unlock an account.
     * @param target The address to unlock
     */
    function dbg_enforce_unlock(address target) external {
        bytes32 pubHash = falconLocks[target];
        delete falconLocks[target];
        emit AccountUnlocked(target, pubHash);
    }
}
