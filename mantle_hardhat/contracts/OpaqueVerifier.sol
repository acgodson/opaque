// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {HonkVerifier} from "../noir/target/opaque.sol";

/**
 * @title OpaqueVerifier
 * @notice Verifies ZK proofs for Opaque policy compliance and executes transactions
 * @dev Supports multiple policies: max amount, cooldown, time window, recipient whitelist
 */
contract OpaqueVerifier {
    HonkVerifier public verifier;
    
    // Track used nullifiers to prevent replay attacks
    mapping(bytes32 => bool) public usedNullifiers;
    
    // Track last execution time per user for cooldown policy
    mapping(bytes32 => uint256) public lastExecutionTime;
    
    // Events
    event PolicyVerified(
        bytes32 indexed userAddressHash,
        bytes32 indexed nullifier,
        uint256 timestamp
    );
    
    event TransactionExecuted(
        bytes32 indexed userAddressHash,
        bytes32 indexed nullifier,
        address target,
        bytes data
    );
    
    // Errors
    error NullifierAlreadyUsed(bytes32 nullifier);
    error ProofVerificationFailed();
    error TransactionExecutionFailed();
    error InvalidPolicySatisfied();
    
    constructor() {
        verifier = new HonkVerifier();
    }
    
    /**
     * @notice Verify ZK proof and execute transaction if valid
     * @param proof The ZK proof bytes
     * @param policySatisfied Must be 1 if all policies passed
     * @param nullifier Unique identifier to prevent replay
     * @param userAddressHash Hash of user address for tracking
     * @param target Target contract address to call
     * @param txData Transaction data to execute
     * @return success Whether the transaction executed successfully
     */
    function verifyAndExecute(
        bytes calldata proof,
        bytes32 policySatisfied,
        bytes32 nullifier,
        bytes32 userAddressHash,
        address target,
        bytes calldata txData
    ) external returns (bool) {
        // Check nullifier hasn't been used
        if (usedNullifiers[nullifier]) {
            revert NullifierAlreadyUsed(nullifier);
        }
        
        // Check policy satisfied is 1
        if (policySatisfied != bytes32(uint256(1))) {
            revert InvalidPolicySatisfied();
        }
        
        // Prepare public inputs for verification
        // Order MUST match ABI order: policy_satisfied, return_value (nullifier), user_address_hash
        bytes32[] memory publicInputs = new bytes32[](3);
        publicInputs[0] = policySatisfied;
        publicInputs[1] = nullifier;
        publicInputs[2] = userAddressHash;
        
        // Verify the proof
        bool verified = verifier.verify(proof, publicInputs);

        if (!verified) {
            revert ProofVerificationFailed();
        }
        
        // Mark nullifier as used
        usedNullifiers[nullifier] = true;
        
        // Update last execution time
        lastExecutionTime[userAddressHash] = block.timestamp;
        
        emit PolicyVerified(userAddressHash, nullifier, block.timestamp);
        
        // Execute the transaction if target is not zero address
        if (target != address(0)) {
            (bool success, ) = target.call(txData);
            if (!success) {
                revert TransactionExecutionFailed();
            }
            
            emit TransactionExecuted(userAddressHash, nullifier, target, txData);
        }
        
        return true;
    }
    
    /**
     * @notice Check if a nullifier has been used
     * @param nullifier The nullifier to check
     * @return used Whether the nullifier has been used
     */
    function isNullifierUsed(bytes32 nullifier) external view returns (bool) {
        return usedNullifiers[nullifier];
    }
    
    /**
     * @notice Get the last execution time for a user
     * @param userAddressHash Hash of the user address
     * @return timestamp The last execution timestamp
     */
    function getLastExecutionTime(bytes32 userAddressHash) external view returns (uint256) {
        return lastExecutionTime[userAddressHash];
    }
    
    /**
     * @notice Verify proof only (no execution)
     * @param proof The ZK proof bytes
     * @param policySatisfied Must be 1 if all policies passed
     * @param nullifier Unique identifier to prevent replay
     * @param userAddressHash Hash of user address for tracking
     * @return valid Whether the proof is valid
     */
    function verifyOnly(
        bytes calldata proof,
        bytes32 policySatisfied,
        bytes32 nullifier,
        bytes32 userAddressHash
    ) external view returns (bool) {
        // Prepare public inputs for verification
        bytes32[] memory publicInputs = new bytes32[](3);
        publicInputs[0] = policySatisfied;
        publicInputs[1] = nullifier;
        publicInputs[2] = userAddressHash;
        
        // Verify the proof
        return verifier.verify(proof, publicInputs);
    }
}
