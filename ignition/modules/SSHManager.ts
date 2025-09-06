import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Hardhat Ignition deployment module for SSHManager contract
 */
const SSHManagerModule = buildModule("SSHManagerModule", (m) => {
  // Deploy the SSHManager contract
  const sshManager = m.contract("SSHManager", [], {
    // Optional: Set deployment options
    id: "SSHManagerContract",
  });

  // Return the deployed contract instance
  return { sshManager };
});

export default SSHManagerModule;