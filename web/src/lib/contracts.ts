// OpaqueVerifier contract ABI
// Used by frontend for read operations and by ElizaOS agents for transaction encoding
export const OPAQUE_VERIFIER_ABI = [
    {
        "inputs": [
            { "internalType": "bytes", "name": "proof", "type": "bytes" },
            { "internalType": "bytes32", "name": "policySatisfied", "type": "bytes32" },
            { "internalType": "bytes32", "name": "nullifier", "type": "bytes32" },
            { "internalType": "bytes32", "name": "userAddressHash", "type": "bytes32" },
            { "internalType": "address", "name": "target", "type": "address" },
            { "internalType": "bytes", "name": "txData", "type": "bytes" }
        ],
        "name": "verifyAndExecute",
        "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
        "stateMutability": "nonpayable",
        "type": "function"
    }
] as const;

export const OPAQUE_VERIFIER_ADDRESS = process.env.NEXT_PUBLIC_OPAQUE_VERIFIER_ADDRESS || "";
