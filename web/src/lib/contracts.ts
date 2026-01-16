// OpaqueVerifier contract ABI
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
    },
    {
        "inputs": [
            { "internalType": "bytes", "name": "proof", "type": "bytes" },
            { "internalType": "bytes32", "name": "policySatisfied", "type": "bytes32" },
            { "internalType": "bytes32", "name": "nullifier", "type": "bytes32" },
            { "internalType": "bytes32", "name": "userAddressHash", "type": "bytes32" }
        ],
        "name": "verifyOnly",
        "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "bytes32", "name": "nullifier", "type": "bytes32" }],
        "name": "usedNullifiers",
        "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
        "stateMutability": "view",
        "type": "function"
    }
] as const;

// ERC20 ABI for token transfers
export const ERC20_ABI = [
    {
        "inputs": [
            { "internalType": "address", "name": "to", "type": "address" },
            { "internalType": "uint256", "name": "amount", "type": "uint256" }
        ],
        "name": "transfer",
        "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
        "stateMutability": "nonpayable",
        "type": "function"
    }
] as const;

export const OPAQUE_VERIFIER_ADDRESS = "0x07D60F1Cf13b4b1E32AA4eB97352CC1037286361";
export const MCK_TOKEN_ADDRESS = "0xb9e8f815ADC8418DD28f35A7D147c98f725fa538";
