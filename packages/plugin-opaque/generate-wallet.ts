import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

const privateKey = generatePrivateKey();
const account = privateKeyToAccount(privateKey);

console.log("🔑 Generated Test Wallet\n");
console.log("Private Key:", privateKey);
console.log("Address:", account.address);
console.log("\n⚠️  Fund this address with MNT on Mantle Sepolia:");
console.log("   https://faucet.sepolia.mantle.xyz/");
console.log("\n📝 Add this private key to test-plugin-simple.ts");
