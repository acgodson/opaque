import { z } from "zod";
import { createTRPCRouter, baseProcedure } from "../init";
import { Barretenberg, UltraHonkBackend } from '@aztec/bb.js';
import { readFile } from "fs/promises";
import path from "path";

// Load circuit data at module level (outside the handler)
let circuit: any = null;
let honk: UltraHonkBackend | null = null;

async function initializeCircuit() {
  if (!circuit) {
    const circuitPath = path.resolve(process.cwd(), '../mantle_hardhat/noir/target/opaque.json');
    const circuitData = await readFile(circuitPath, 'utf-8');
    circuit = JSON.parse(circuitData);
    honk = new UltraHonkBackend(circuit.bytecode);
  }
}

export const verificationRouter = createTRPCRouter({
  verify: baseProcedure
    .input(z.object({
      proof: z.any(),
      publicInputs: z.array(z.string())
    }))
    .mutation(async ({ input }) => {
      try {
        await initializeCircuit();

        if (!honk) {
          throw new Error('Backend not initialized');
        }

        // Convert proof to Uint8Array
        let proofArray: Uint8Array;
        if (input.proof instanceof Uint8Array) {
          proofArray = input.proof;
        } else if (typeof input.proof === 'string') {
          // Handle hex string (with or without 0x prefix)
          const hexString = input.proof.startsWith('0x') ? input.proof.slice(2) : input.proof;
          proofArray = new Uint8Array(Buffer.from(hexString, 'hex'));
        } else if (Array.isArray(input.proof)) {
          proofArray = new Uint8Array(input.proof);
        } else if (typeof input.proof === 'object' && input.proof !== null) {
          const values = Object.values(input.proof) as number[];
          proofArray = new Uint8Array(values);
        } else {
          throw new Error('Invalid proof format');
        }

        const publicInputsArray = Array.isArray(input.publicInputs) ? input.publicInputs : [input.publicInputs];

        console.log('[VERIFY] Proof length:', proofArray.length);
        console.log('[VERIFY] Public inputs:', publicInputsArray);
        console.log('[VERIFY] Circuit bytecode length:', circuit.bytecode.length);

        // Use keccak: true to match the enclave proof generation
        const verified = await honk.verifyProof({
          proof: proofArray,
          publicInputs: publicInputsArray
        }, {
          keccak: true
        });

        console.log('[VERIFY] Verification result:', verified);

        return {
          verified,
          message: verified ? 'Proof verified successfully' : 'Proof verification failed'
        };
      } catch (error) {
        console.error('Verification error:', error);
        throw new Error(String(error));
      }
    }),
});
