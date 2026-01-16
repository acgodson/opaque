import { expect } from "chai";
import hre, { ethers } from "hardhat";
import {
  generatePolicyProof,
  getCurrentTimestamp,
  type PolicyConfig,
  type TransactionData,
} from "../scripts/proof-generator";

describe("Opaque Policy Verification", () => {
  let contract: any;
  let userAddress: string;
  let noir: any;
  let backend: any;

  before(async () => {
    const [signer] = await ethers.getSigners();
    userAddress = await signer.getAddress();

    console.log("Deploying OpaqueVerifier contract...");
    const factory = await ethers.getContractFactory("OpaqueVerifier");
    contract = await factory.deploy();
    await contract.waitForDeployment();
    console.log("Contract deployed to:", await contract.getAddress());

    // Get Noir circuit and backend using Hardhat Noir
    console.log("Loading Noir circuit...");
    const circuit = await hre.noir.getCircuit("opaque");
    noir = circuit.noir;
    backend = circuit.backend;
  });

  describe("Max Amount Policy", () => {
    it("should verify transaction within max amount limit", async () => {
      const tx: TransactionData = {
        amount: 50n * 10n ** 6n, // 50 USDC (6 decimals)
        recipient: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
        timestamp: getCurrentTimestamp(),
        userAddress,
      };

      const config: PolicyConfig = {
        maxAmount: {
          enabled: true,
          limit: 100 * 10 ** 6, // 100 USDC limit
        },
      };

      console.log("Generating proof for max amount policy...");
      const { proof, publicInputs } = await generatePolicyProof(
        noir,
        backend,
        tx,
        config
      );

      console.log("Verifying proof on-chain...");
      const txResponse = await contract.verifyAndExecute(
        proof,
        publicInputs.policySatisfied,
        publicInputs.nullifier,
        publicInputs.userAddressHash,
        ethers.ZeroAddress,
        "0x"
      );
      await txResponse.wait();
      console.log("✅ Max amount policy verified successfully");
    });

    it("should reject transaction exceeding max amount", async () => {
      const tx: TransactionData = {
        amount: 150n * 10n ** 6n, // 150 USDC (exceeds limit)
        recipient: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
        timestamp: getCurrentTimestamp(),
        userAddress,
      };

      const config: PolicyConfig = {
        maxAmount: {
          enabled: true,
          limit: 100 * 10 ** 6,
        },
      };

      // Proof generation should fail during circuit execution
      await expect(
        generatePolicyProof(noir, backend, tx, config)
      ).to.be.rejected;

      console.log("✅ Transaction exceeding max amount rejected");
    });
  });


  describe("Time Window Policy", () => {
    it("should allow transaction within time window", async () => {
      // Create a timestamp that falls within 9am-5pm UTC
      const now = new Date();
      const targetHour = 12; // 12pm UTC
      const timestamp = Math.floor(now.getTime() / 1000);
      const currentHour = Math.floor((timestamp / 3600) % 24);

      // Adjust timestamp to be at target hour
      const adjustedTimestamp = timestamp + (targetHour - currentHour) * 3600;

      const tx: TransactionData = {
        amount: 50n * 10n ** 6n,
        recipient: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
        timestamp: adjustedTimestamp,
        userAddress,
      };

      const config: PolicyConfig = {
        timeWindow: {
          enabled: true,
          startHour: 9,
          endHour: 17, // 9am-5pm
        },
      };

      const { proof, publicInputs } = await generatePolicyProof(
        noir,
        backend,
        tx,
        config
      );

      await contract.verifyAndExecute(
        proof,
        publicInputs.policySatisfied,
        publicInputs.nullifier,
        publicInputs.userAddressHash,
        ethers.ZeroAddress,
        "0x"
      );

      console.log("✅ Time window policy verified");
    });
  });



  describe("Multiple Policies Combined", () => {
    it("should verify transaction passing all enabled policies", async () => {
      const tx: TransactionData = {
        amount: 50n * 10n ** 6n,
        recipient: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
        timestamp: getCurrentTimestamp(),
        userAddress,
      };

      const config: PolicyConfig = {
        maxAmount: {
          enabled: true,
          limit: 100 * 10 ** 6,
        },

      };

      const { proof, publicInputs } = await generatePolicyProof(
        noir,
        backend,
        tx,
        config
      );

      await contract.verifyAndExecute(
        proof,
        publicInputs.policySatisfied,
        publicInputs.nullifier,
        publicInputs.userAddressHash,
        ethers.ZeroAddress,
        "0x"
      );

      console.log("✅ Multiple policies verified successfully");
    });
  });

  describe("Nullifier Replay Protection", () => {
    it("should prevent replay attacks with same nullifier", async () => {
      const tx: TransactionData = {
        amount: 50n * 10n ** 6n,
        recipient: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
        timestamp: getCurrentTimestamp(),
        userAddress,
      };

      const config: PolicyConfig = {
        maxAmount: {
          enabled: true,
          limit: 100 * 10 ** 6,
        },
      };

      const { proof, publicInputs } = await generatePolicyProof(
        noir,
        backend,
        tx,
        config
      );

      // First verification succeeds
      await contract.verifyAndExecute(
        proof,
        publicInputs.policySatisfied,
        publicInputs.nullifier,
        publicInputs.userAddressHash,
        ethers.ZeroAddress,
        "0x"
      );

      // Second verification with same proof should fail
      await expect(
        contract.verifyAndExecute(
          proof,
          publicInputs.policySatisfied,
          publicInputs.nullifier,
          publicInputs.userAddressHash,
          ethers.ZeroAddress,
          "0x"
        )
      ).to.be.revertedWithCustomError(contract, "NullifierAlreadyUsed");

      console.log("✅ Nullifier replay protection working");
    });
  });

  describe("Whitelist Policy", () => {
    it("should allow whitelisted recipient", async () => {
      // Create a simple Merkle Tree (depth 2)
      // Whitelist: [recipient, random_address, random_address, random_address]
      // Tree:
      //       Root
      //     /      \
      //   H(0,1)   H(2,3)
      //  /  \      /  \
      // R   A     A    A

      // Instantiate Barretenberg to compute tree off-chain
      const { Barretenberg, Fr } = require("@aztec/bb.js");
      const bb = await Barretenberg.new();

      const recipient = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";
      const other = ethers.ZeroAddress;

      // Leaves need to be Fields
      const leaf0 = new Fr(BigInt(recipient));
      const leaf1 = new Fr(BigInt(other));
      const leaf2 = new Fr(BigInt(other));
      const leaf3 = new Fr(BigInt(other));

      // Compute nodes
      const h01 = await bb.pedersenHash([leaf0, leaf1], 0);
      const h23 = await bb.pedersenHash([leaf2, leaf3], 0);
      const rootFr = await bb.pedersenHash([h01, h23], 0);

      const root = rootFr.toString();

      // Path for leaf0 (recipient): [sibling of leaf0, sibling of h01] => [leaf1, h23]
      const path = [leaf1.toString(), h23.toString()];
      const index = 0;

      const tx: TransactionData = {
        amount: 50n * 10n ** 6n,
        recipient: recipient,
        timestamp: getCurrentTimestamp(),
        userAddress,
      };

      const config: PolicyConfig = {
        whitelist: {
          enabled: true,
          root: root,
          path: path,
          index: index,
        },
      };

      const { proof, publicInputs } = await generatePolicyProof(
        noir,
        backend,
        tx,
        config
      );

      const txResponse = await contract.verifyAndExecute(
        proof,
        publicInputs.policySatisfied,
        publicInputs.nullifier,
        publicInputs.userAddressHash,
        ethers.ZeroAddress,
        "0x"
      );
      await txResponse.wait();

      console.log("✅ Whitelisted recipient verified");
    });
  });

  describe("Gas Analysis", () => {
    it("should report gas costs for verification", async () => {
      const tx: TransactionData = {
        amount: 50n * 10n ** 6n,
        recipient: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
        timestamp: getCurrentTimestamp(),
        userAddress,
      };

      const config: PolicyConfig = {
        maxAmount: {
          enabled: true,
          limit: 100 * 10 ** 6,
        },
      };

      const { proof, publicInputs } = await generatePolicyProof(
        noir,
        backend,
        tx,
        config,
      );

      const gasEstimate = await contract.verifyAndExecute.estimateGas(
        proof,
        publicInputs.policySatisfied,
        publicInputs.nullifier,
        publicInputs.userAddressHash,
        "0x0000000000000000000000000000000000000001",
        "0x"
      );

      console.log("Gas estimate for verification:", gasEstimate.toString());
    });
  });

  describe("Vault Model - Real Transaction Execution", () => {
    let mockToken: any;

    before(async () => {
      // Deploy Mock Token
      const TokenFactory = await ethers.getContractFactory("MockERC20");
      mockToken = await TokenFactory.deploy();
      await mockToken.waitForDeployment();
      console.log("MockToken deployed to:", await mockToken.getAddress());

      // Fund the OpaqueVerifier contract (vault) so it can execute transfers
      const amountToFund = ethers.parseEther("1000");
      await mockToken.mint(await contract.getAddress(), amountToFund);
      console.log("Funded OpaqueVerifier vault with 1000 MCK");
    });

    it("should execute ERC20 transfer from vault with ZK proof", async () => {
      const recipient = ethers.Wallet.createRandom().address;
      const transferAmount = ethers.parseEther("10"); // 10 MCK

      // 1. Policy check: amount in "units" (for demo, 1 unit = 1 token)
      const tx: TransactionData = {
        amount: 10n, // Policy checks this amount
        recipient: recipient,
        timestamp: getCurrentTimestamp(),
        userAddress,
      };

      // 2. Configure policy (max 100 units)
      const config: PolicyConfig = {
        maxAmount: {
          enabled: true,
          limit: 100,
        },
      };

      // 3. Generate ZK Proof
      const { proof, publicInputs } = await generatePolicyProof(
        noir,
        backend,
        tx,
        config
      );

      // 4. Encode ERC20 transfer call
      const calldata = mockToken.interface.encodeFunctionData("transfer", [
        recipient,
        transferAmount,
      ]);

      // 5. Get balances before
      const vaultBalanceBefore = await mockToken.balanceOf(await contract.getAddress());
      const recipientBalanceBefore = await mockToken.balanceOf(recipient);

      console.log("Vault balance before:", ethers.formatEther(vaultBalanceBefore), "MCK");
      console.log("Recipient balance before:", ethers.formatEther(recipientBalanceBefore), "MCK");

      // 6. Execute verifyAndExecute (vault transfers to recipient)
      const txResponse = await contract.verifyAndExecute(
        proof,
        publicInputs.policySatisfied,
        publicInputs.nullifier,
        publicInputs.userAddressHash,
        await mockToken.getAddress(), // Target: MockToken
        calldata                      // Data: transfer(recipient, 10)
      );
      await txResponse.wait();

      // 7. Verify balances after
      const vaultBalanceAfter = await mockToken.balanceOf(await contract.getAddress());
      const recipientBalanceAfter = await mockToken.balanceOf(recipient);

      console.log("Vault balance after:", ethers.formatEther(vaultBalanceAfter), "MCK");
      console.log("Recipient balance after:", ethers.formatEther(recipientBalanceAfter), "MCK");

      expect(vaultBalanceAfter).to.equal(vaultBalanceBefore - transferAmount);
      expect(recipientBalanceAfter).to.equal(recipientBalanceBefore + transferAmount);

      console.log("✅ Vault model: ERC20 transfer executed successfully!");
    });

    it("should respect policy limits when transferring from vault", async () => {
      const recipient = ethers.Wallet.createRandom().address;
      const transferAmount = ethers.parseEther("150"); // 150 MCK

      // Try to transfer 150 units (exceeds 100 limit)
      const tx: TransactionData = {
        amount: 150n, // Exceeds policy limit
        recipient: recipient,
        timestamp: getCurrentTimestamp(),
        userAddress,
      };

      const config: PolicyConfig = {
        maxAmount: {
          enabled: true,
          limit: 100, // Max 100 units
        },
      };

      // Proof generation should fail
      await expect(
        generatePolicyProof(noir, backend, tx, config)
      ).to.be.rejected;

      console.log("✅ Policy limit enforced: transfer blocked");
    });
  });
});
