import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";
import { getAddress } from "viem";

describe("SSHManager", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  
  // Mock encrypted data for testing
  const mockEncryptedData1 = 'encrypted_ssh_config_data_1_base64_encoded_example';
  const mockEncryptedData2 = 'encrypted_ssh_config_data_2_base64_encoded_example';
  const mockEncryptedDataUpdated = 'encrypted_ssh_config_data_updated_base64_encoded';
  const mockLargeData = 'a'.repeat(8192); // Max size
  const mockOversizedData = 'a'.repeat(8193); // Over max size

  describe("Deployment", async function () {
    it("Should set the correct owner and initialize with zero counters", async function () {
      const [owner] = await viem.getWalletClients();
      const sshManager = await viem.deployContract("SSHManager");

      assert.equal(getAddress(await sshManager.read.owner()), getAddress(owner.account.address));
      assert.equal(await sshManager.read.totalUsers(), 0n);
      assert.equal(await sshManager.read.totalConfigs(), 0n);
      assert.equal(await sshManager.read.activeConfigs(), 0n);
      assert.equal(await sshManager.read.paused(), false);
    });
  });

  describe("User Registration", async function () {
    it("Should allow new user registration", async function () {
      const [owner, user1] = await viem.getWalletClients();
      const sshManager = await viem.deployContract("SSHManager");

      await sshManager.write.registerUser([], { account: user1.account });
      
      assert.equal(await sshManager.read.isRegisteredUser([user1.account.address]), true);
      assert.equal(await sshManager.read.totalUsers(), 1n);
    });

    it("Should emit UserRegistered event", async function () {
      const [owner, user1] = await viem.getWalletClients();
      const sshManager = await viem.deployContract("SSHManager");
      const deploymentBlockNumber = await publicClient.getBlockNumber();

      await sshManager.write.registerUser([], { account: user1.account });

      const events = await publicClient.getContractEvents({
        address: sshManager.address,
        abi: sshManager.abi,
        eventName: "UserRegistered",
        fromBlock: deploymentBlockNumber,
        strict: true,
      });

      assert.equal(events.length, 1);
      assert.equal(getAddress(events[0].args.user), getAddress(user1.account.address));
    });

    it("Should prevent double registration", async function () {
      const [owner, user1] = await viem.getWalletClients();
      const sshManager = await viem.deployContract("SSHManager");

      await sshManager.write.registerUser([], { account: user1.account });
      
      await assert.rejects(
        sshManager.write.registerUser([], { account: user1.account }),
        (err: any) => err.message.includes("UserAlreadyRegistered")
      );
    });

    it("Should track multiple user registrations", async function () {
      const [owner, user1, user2] = await viem.getWalletClients();
      const sshManager = await viem.deployContract("SSHManager");

      await sshManager.write.registerUser([], { account: user1.account });
      await sshManager.write.registerUser([], { account: user2.account });

      assert.equal(await sshManager.read.totalUsers(), 2n);
      assert.equal(await sshManager.read.isRegisteredUser([user1.account.address]), true);
      assert.equal(await sshManager.read.isRegisteredUser([user2.account.address]), true);
    });
  });

  describe("SSH Configuration Management", async function () {
    it("Should add SSH configuration successfully", async function () {
      const [owner, user1] = await viem.getWalletClients();
      const sshManager = await viem.deployContract("SSHManager");

      await sshManager.write.registerUser([], { account: user1.account });
      await sshManager.write.addSSHConfig([mockEncryptedData1], { account: user1.account });

      assert.equal(await sshManager.read.totalConfigs(), 1n);
      assert.equal(await sshManager.read.activeConfigs(), 1n);
    });

    it("Should assign incremental config IDs", async function () {
      const [owner, user1] = await viem.getWalletClients();
      const sshManager = await viem.deployContract("SSHManager");

      await sshManager.write.registerUser([], { account: user1.account });
      await sshManager.write.addSSHConfig([mockEncryptedData1], { account: user1.account });
      await sshManager.write.addSSHConfig([mockEncryptedData2], { account: user1.account });

      const configs = await sshManager.read.getSSHConfigs([user1.account.address]);
      assert.equal(configs.length, 2);
      assert.equal(configs[0].configId, 1n);
      assert.equal(configs[1].configId, 2n);
    });

    it("Should reject empty encrypted data", async function () {
      const [owner, user1] = await viem.getWalletClients();
      const sshManager = await viem.deployContract("SSHManager");

      await sshManager.write.registerUser([], { account: user1.account });
      
      await assert.rejects(
        sshManager.write.addSSHConfig([''], { account: user1.account }),
        (err: any) => err.message.includes("EmptyEncryptedData")
      );
    });

    it("Should reject oversized data", async function () {
      const [owner, user1] = await viem.getWalletClients();
      const sshManager = await viem.deployContract("SSHManager");

      await sshManager.write.registerUser([], { account: user1.account });
      
      await assert.rejects(
        sshManager.write.addSSHConfig([mockOversizedData], { account: user1.account }),
        (err: any) => err.message.includes("InvalidDataSize")
      );
    });

    it("Should accept maximum size data", async function () {
      const [owner, user1] = await viem.getWalletClients();
      const sshManager = await viem.deployContract("SSHManager");

      await sshManager.write.registerUser([], { account: user1.account });
      await sshManager.write.addSSHConfig([mockLargeData], { account: user1.account });

      assert.equal(await sshManager.read.totalConfigs(), 1n);
    });

    it("Should prevent unregistered users from adding configs", async function () {
      const [owner, user1] = await viem.getWalletClients();
      const sshManager = await viem.deployContract("SSHManager");
      
      await assert.rejects(
        sshManager.write.addSSHConfig([mockEncryptedData1], { account: user1.account }),
        (err: any) => err.message.includes("UserNotRegistered")
      );
    });

    it("Should emit ConfigAdded event", async function () {
      const [owner, user1] = await viem.getWalletClients();
      const sshManager = await viem.deployContract("SSHManager");
      const deploymentBlockNumber = await publicClient.getBlockNumber();

      await sshManager.write.registerUser([], { account: user1.account });
      await sshManager.write.addSSHConfig([mockEncryptedData1], { account: user1.account });

      const events = await publicClient.getContractEvents({
        address: sshManager.address,
        abi: sshManager.abi,
        eventName: "ConfigAdded",
        fromBlock: deploymentBlockNumber,
        strict: true,
      });

      assert.equal(events.length, 1);
      assert.equal(getAddress(events[0].args.user), getAddress(user1.account.address));
      assert.equal(events[0].args.configId, 1n);
    });
  });

  describe("Configuration Retrieval and Updates", async function () {
    it("Should retrieve all user configurations", async function () {
      const [owner, user1, user2] = await viem.getWalletClients();
      const sshManager = await viem.deployContract("SSHManager");

      await sshManager.write.registerUser([], { account: user1.account });
      await sshManager.write.registerUser([], { account: user2.account });
      
      await sshManager.write.addSSHConfig([mockEncryptedData1], { account: user1.account });
      await sshManager.write.addSSHConfig([mockEncryptedData2], { account: user1.account });
      await sshManager.write.addSSHConfig([mockEncryptedData1], { account: user2.account });

      const user1Configs = await sshManager.read.getSSHConfigs([user1.account.address]);
      const user2Configs = await sshManager.read.getSSHConfigs([user2.account.address]);

      assert.equal(user1Configs.length, 2);
      assert.equal(user2Configs.length, 1);
      assert.equal(user1Configs[0].encryptedData, mockEncryptedData1);
      assert.equal(user1Configs[1].encryptedData, mockEncryptedData2);
    });

    it("Should retrieve specific configuration by ID", async function () {
      const [owner, user1] = await viem.getWalletClients();
      const sshManager = await viem.deployContract("SSHManager");

      await sshManager.write.registerUser([], { account: user1.account });
      await sshManager.write.addSSHConfig([mockEncryptedData1], { account: user1.account });

      const config = await sshManager.read.getSSHConfig([user1.account.address, 1n]);
      
      assert.equal(config.configId, 1n);
      assert.equal(config.encryptedData, mockEncryptedData1);
      assert.equal(config.isActive, true);
    });

    it("Should update configuration successfully", async function () {
      const [owner, user1] = await viem.getWalletClients();
      const sshManager = await viem.deployContract("SSHManager");

      await sshManager.write.registerUser([], { account: user1.account });
      await sshManager.write.addSSHConfig([mockEncryptedData1], { account: user1.account });
      await sshManager.write.updateSSHConfig([1n, mockEncryptedDataUpdated], { account: user1.account });

      const config = await sshManager.read.getSSHConfig([user1.account.address, 1n]);
      assert.equal(config.encryptedData, mockEncryptedDataUpdated);
    });

    it("Should revoke configuration successfully", async function () {
      const [owner, user1] = await viem.getWalletClients();
      const sshManager = await viem.deployContract("SSHManager");

      await sshManager.write.registerUser([], { account: user1.account });
      await sshManager.write.addSSHConfig([mockEncryptedData1], { account: user1.account });
      await sshManager.write.revokeConfig([1n], { account: user1.account });

      const config = await sshManager.read.getSSHConfig([user1.account.address, 1n]);
      assert.equal(config.isActive, false);
      assert.equal(await sshManager.read.activeConfigs(), 0n);
    });
  });

  describe("Batch Operations", async function () {
    it("Should batch update multiple configurations", async function () {
      const [owner, user1] = await viem.getWalletClients();
      const sshManager = await viem.deployContract("SSHManager");

      await sshManager.write.registerUser([], { account: user1.account });
      await sshManager.write.addSSHConfig([mockEncryptedData1], { account: user1.account });
      await sshManager.write.addSSHConfig([mockEncryptedData2], { account: user1.account });
      
      const configIds = [1n, 2n];
      const newData = [mockEncryptedDataUpdated, mockEncryptedDataUpdated];
      await sshManager.write.batchUpdateConfigs([configIds, newData], { account: user1.account });

      const config1 = await sshManager.read.getSSHConfig([user1.account.address, 1n]);
      const config2 = await sshManager.read.getSSHConfig([user1.account.address, 2n]);
      
      assert.equal(config1.encryptedData, mockEncryptedDataUpdated);
      assert.equal(config2.encryptedData, mockEncryptedDataUpdated);
    });

    it("Should batch revoke multiple configurations", async function () {
      const [owner, user1] = await viem.getWalletClients();
      const sshManager = await viem.deployContract("SSHManager");

      await sshManager.write.registerUser([], { account: user1.account });
      await sshManager.write.addSSHConfig([mockEncryptedData1], { account: user1.account });
      await sshManager.write.addSSHConfig([mockEncryptedData2], { account: user1.account });
      await sshManager.write.addSSHConfig([mockEncryptedData1], { account: user1.account });
      
      const configIds = [1n, 2n];
      await sshManager.write.batchRevokeConfigs([configIds], { account: user1.account });

      const config1 = await sshManager.read.getSSHConfig([user1.account.address, 1n]);
      const config2 = await sshManager.read.getSSHConfig([user1.account.address, 2n]);
      
      assert.equal(config1.isActive, false);
      assert.equal(config2.isActive, false);
      assert.equal(await sshManager.read.activeConfigs(), 1n); // One config remains active
    });
  });

  describe("Access Control & Security", async function () {
    it("Should allow owner to pause and unpause the contract", async function () {
      const [owner, user1] = await viem.getWalletClients();
      const sshManager = await viem.deployContract("SSHManager");

      await sshManager.write.pause([], { account: owner.account });
      assert.equal(await sshManager.read.paused(), true);

      await sshManager.write.unpause([], { account: owner.account });
      assert.equal(await sshManager.read.paused(), false);
    });

    it("Should prevent non-owner from pausing", async function () {
      const [owner, user1] = await viem.getWalletClients();
      const sshManager = await viem.deployContract("SSHManager");

      await assert.rejects(
        sshManager.write.pause([], { account: user1.account }),
        (err: any) => err.message.includes("OwnableUnauthorizedAccount")
      );
    });

    it("Should prevent operations when paused", async function () {
      const [owner, user1] = await viem.getWalletClients();
      const sshManager = await viem.deployContract("SSHManager");

      await sshManager.write.registerUser([], { account: user1.account });
      await sshManager.write.pause([], { account: owner.account });

      await assert.rejects(
        sshManager.write.addSSHConfig([mockEncryptedData1], { account: user1.account }),
        (err: any) => err.message.includes("EnforcedPause")
      );
    });
  });

  describe("User Statistics", async function () {
    it("Should return correct user statistics", async function () {
      const [owner, user1] = await viem.getWalletClients();
      const sshManager = await viem.deployContract("SSHManager");

      await sshManager.write.registerUser([], { account: user1.account });
      await sshManager.write.addSSHConfig([mockEncryptedData1], { account: user1.account });
      await sshManager.write.addSSHConfig([mockEncryptedData2], { account: user1.account });
      await sshManager.write.revokeConfig([1n], { account: user1.account });

      const stats = await sshManager.read.getUserStats([user1.account.address]);
      
      assert.equal(stats.totalConfigs, 2n);
      assert.equal(stats.activeConfigs, 1n);
      assert(stats.lastActivity > 0n);
    });

    it("Should reject stats for unregistered user", async function () {
      const [owner, user1] = await viem.getWalletClients();
      const sshManager = await viem.deployContract("SSHManager");
      
      await assert.rejects(
        sshManager.read.getUserStats([user1.account.address]),
        (err: any) => err.message.includes("UserNotRegistered")
      );
    });
  });

  describe("Global Statistics", async function () {
    it("Should track global statistics correctly", async function () {
      const [owner, user1, user2] = await viem.getWalletClients();
      const sshManager = await viem.deployContract("SSHManager");

      // Register multiple users
      await sshManager.write.registerUser([], { account: user1.account });
      await sshManager.write.registerUser([], { account: user2.account });

      // Add configurations
      await sshManager.write.addSSHConfig([mockEncryptedData1], { account: user1.account });
      await sshManager.write.addSSHConfig([mockEncryptedData2], { account: user1.account });
      await sshManager.write.addSSHConfig([mockEncryptedData1], { account: user2.account });

      // Revoke one config
      await sshManager.write.revokeConfig([1n], { account: user1.account });

      // Check global stats
      assert.equal(await sshManager.read.getTotalUsers(), 2n);
      assert.equal(await sshManager.read.getTotalConfigs(), 3n);
      assert.equal(await sshManager.read.getActiveConfigs(), 2n);
    });
  });
});