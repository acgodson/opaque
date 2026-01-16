import type { Noir } from "@noir-lang/noir_js";
import { type UltraHonkBackend, Barretenberg, Fr } from "@aztec/bb.js";
import { ethers } from "ethers";

export interface PolicyConfig {
    maxAmount?: {
        enabled: boolean;
        limit: number;
    };
    timeWindow?: {
        enabled: boolean;
        startHour: number; // 0-23
        endHour: number; // 0-23
    };
    whitelist?: {
        enabled: boolean;
        root?: string; // Hex string
        path?: string[]; // Array of hex strings
        index?: number;
    };
}

export interface TransactionData {
    amount: bigint;
    recipient: string;
    timestamp: number;
    userAddress: string;
}

export interface ProofResult {
    proof: Uint8Array;
    publicInputs: {
        policySatisfied: string;
        nullifier: string;
        userAddressHash: string;
    };
}

/**
 * Generate a ZK proof for policy compliance using Hardhat Noir
 * @param noir Noir instance from hre.noir.getCircuit()
 * @param backend Backend instance from hre.noir.getCircuit()
 * @param tx Transaction data
 * @param config Policy configuration
 * @returns Proof and public inputs
 */
export async function generatePolicyProof(
    noir: Noir,
    backend: UltraHonkBackend,
    tx: TransactionData,
    config: PolicyConfig,
): Promise<ProofResult> {

    const fullHash = ethers.keccak256(
        ethers.solidityPacked(["address"], [tx.userAddress])
    );
    const userAddressHash = fullHash.substring(0, 64);


    const bb = await Barretenberg.new();

    const timestampFr = new Fr(BigInt(tx.timestamp));
    const recipientFr = new Fr(BigInt(tx.recipient));
    const amountFr = new Fr(tx.amount);
    const userHashFr = new Fr(BigInt(userAddressHash));

    const nullifierFr = await bb.pedersenHash([timestampFr, recipientFr, amountFr, userHashFr], 0);
    const nullifier = nullifierFr.toString();

    // Prepare circuit inputs
    const inputs = {
        tx_amount: tx.amount.toString(),
        tx_recipient: BigInt(tx.recipient).toString(),
        tx_timestamp: tx.timestamp.toString(),

        max_amount: (config.maxAmount?.limit || 0).toString(),
        allowed_start_hour: (config.timeWindow?.startHour || 0).toString(),
        allowed_end_hour: (config.timeWindow?.endHour || 24).toString(),

        enable_max_amount: config.maxAmount?.enabled || false,
        enable_time_window: config.timeWindow?.enabled || false,
        enable_whitelist: config.whitelist?.enabled || false,

        whitelist_root: config.whitelist?.root || "0",
        whitelist_path: config.whitelist?.path || ["0", "0"],
        whitelist_index: (config.whitelist?.index || 0).toString(),

        policy_satisfied: "1",
        nullifier: nullifier,
        user_address_hash: userAddressHash,
    };

    const { witness } = await noir.execute(inputs);

    const { proof, publicInputs } = await backend.generateProof(witness, {
        keccak: true,
    });

    console.log("Proof length (bytes):", proof.length);
    console.log("Expected PROOF_SIZE * 32:", 440 * 32);


    return {
        proof,
        publicInputs: {
            policySatisfied: publicInputs[0],
            nullifier: publicInputs[1],
            userAddressHash: publicInputs[2],
        },
    };
}



export function getCurrentTimestamp(): number {
    return Math.floor(Date.now() / 1000);
}


export function addressToField(address: string): string {
    return BigInt(address).toString();
}
