export const OPAQUE_VERIFIER_ABI = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [],
        "name": "InvalidPolicySatisfied",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "nullifier",
                "type": "bytes32"
            }
        ],
        "name": "NullifierAlreadyUsed",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "ProofVerificationFailed",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "TransactionExecutionFailed",
        "type": "error"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "bytes32",
                "name": "userAddressHash",
                "type": "bytes32"
            },
            {
                "indexed": true,
                "internalType": "bytes32",
                "name": "nullifier",
                "type": "bytes32"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "timestamp",
                "type": "uint256"
            }
        ],
        "name": "PolicyVerified",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "bytes32",
                "name": "userAddressHash",
                "type": "bytes32"
            },
            {
                "indexed": true,
                "internalType": "bytes32",
                "name": "nullifier",
                "type": "bytes32"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "target",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "bytes",
                "name": "data",
                "type": "bytes"
            }
        ],
        "name": "TransactionExecuted",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "userAddressHash",
                "type": "bytes32"
            }
        ],
        "name": "getLastExecutionTime",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "nullifier",
                "type": "bytes32"
            }
        ],
        "name": "isNullifierUsed",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes",
                "name": "proof",
                "type": "bytes"
            },
            {
                "internalType": "bytes32",
                "name": "policySatisfied",
                "type": "bytes32"
            },
            {
                "internalType": "bytes32",
                "name": "nullifier",
                "type": "bytes32"
            },
            {
                "internalType": "bytes32",
                "name": "userAddressHash",
                "type": "bytes32"
            },
            {
                "internalType": "address",
                "name": "target",
                "type": "address"
            },
            {
                "internalType": "bytes",
                "name": "txData",
                "type": "bytes"
            }
        ],
        "name": "verifyAndExecute",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes",
                "name": "proof",
                "type": "bytes"
            },
            {
                "internalType": "bytes32",
                "name": "policySatisfied",
                "type": "bytes32"
            },
            {
                "internalType": "bytes32",
                "name": "nullifier",
                "type": "bytes32"
            },
            {
                "internalType": "bytes32",
                "name": "userAddressHash",
                "type": "bytes32"
            }
        ],
        "name": "verifyOnly",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
] as const;

export const OPAQUE_VERIFIER_CONTRACT = {
    abi: OPAQUE_VERIFIER_ABI,
};

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
    },
    {
        "inputs": [
            { "internalType": "address", "name": "account", "type": "address" }
        ],
        "name": "balanceOf",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    }
] as const;
