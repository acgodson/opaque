/**
 * Merkle tree generation using Pedersen hash (Barretenberg)
 * Matches the circuit implementation in noir/opaque/src/merkle.nr
 */

export interface MerkleProof {
  root: string;
  path: string[];
  index: number;
}

export async function generateMerkleProof(
  addresses: string[],
  targetIndex: number = 0
): Promise<MerkleProof> {
  if (addresses.length === 0 || addresses.length > 4) {
    throw new Error("Merkle tree supports 1-4 addresses (depth 2)");
  }

  if (targetIndex < 0 || targetIndex >= addresses.length) {
    throw new Error("Invalid target index");
  }

  const { Barretenberg, Fr } = await import("@aztec/bb.js");
  const bb = await Barretenberg.new();

  const paddedAddresses = [...addresses];
  while (paddedAddresses.length < 4) {
    paddedAddresses.push("0x0000000000000000000000000000000000000000");
  }

  const leaves = paddedAddresses.map(addr => new Fr(BigInt(addr.toLowerCase())));

  const h01 = await bb.pedersenHash([leaves[0], leaves[1]], 0);
  const h23 = await bb.pedersenHash([leaves[2], leaves[3]], 0);
  const rootFr = await bb.pedersenHash([h01, h23], 0);
  const root = rootFr.toString();

  let path: string[];
  let index: number;

  if (targetIndex === 0) {
    path = [leaves[1].toString(), h23.toString()];
    index = 0;
  } else if (targetIndex === 1) {
    path = [leaves[0].toString(), h23.toString()];
    index = 1;
  } else if (targetIndex === 2) {
    path = [leaves[3].toString(), h01.toString()];
    index = 2;
  } else {
    path = [leaves[2].toString(), h01.toString()];
    index = 3;
  }

  return { root, path, index };
}

export async function generateMerkleRoot(addresses: string[]): Promise<string> {
  if (addresses.length === 0) return "0";
  const proof = await generateMerkleProof(addresses, 0);
  return proof.root;
}
