import hre from "hardhat";

async function main() {
    console.log("Deploying OpaqueVerifier to Mantle Sepolia...");
    
    const factory = await hre.ethers.getContractFactory("OpaqueVerifier");
    const contract = await factory.deploy();
    await contract.waitForDeployment();
    
    const address = await contract.getAddress();
    console.log("✅ OpaqueVerifier deployed to:", address);
    
    // Fund it with MockToken
    const tokenAddress = "0xb9e8f815ADC8418DD28f35A7D147c98f725fa538";
    const token = await hre.ethers.getContractAt("MockERC20", tokenAddress);
    
    const fundAmount = hre.ethers.parseEther("1000");
    console.log("\nFunding vault with 1000 MCK...");
    const tx = await token.transfer(address, fundAmount);
    await tx.wait();
    
    const balance = await token.balanceOf(address);
    console.log("✅ Vault funded! Balance:", hre.ethers.formatEther(balance), "MCK");
    
    console.log("\n📝 Update your plugin with:");
    console.log("   OPAQUE_VERIFIER_ADDRESS:", address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
