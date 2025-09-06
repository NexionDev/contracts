// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ISSHManager
 * @dev Interface for the SSH Manager contract
 * @author Web3 SSH Manager Team
 */
interface ISSHManager {
    
    struct SSHConfig {
        string encryptedData;    // ECIES encrypted SSH connection info
        uint128 timestamp;       // Creation timestamp (optimized storage)
        uint64 configId;         // Unique configuration ID
        bool isActive;          // Configuration status
    }

    struct UserStats {
        uint256 totalConfigs;
        uint256 activeConfigs;
        uint256 lastActivity;
    }

    // Events
    event UserRegistered(address indexed user, uint256 timestamp);
    event ConfigAdded(address indexed user, uint64 indexed configId, uint256 timestamp);
    event ConfigUpdated(address indexed user, uint64 indexed configId, uint256 timestamp);
    event ConfigRevoked(address indexed user, uint64 indexed configId, uint256 timestamp);

    // User Management
    function registerUser() external payable;
    function isRegisteredUser(address user) external view returns (bool);
    function getUserStats(address user) external view returns (UserStats memory);

    // SSH Configuration Management
    function addSSHConfig(string calldata encryptedData) external payable returns (uint64);
    function getSSHConfigs(address user) external view returns (SSHConfig[] memory);
    function getSSHConfig(address user, uint64 configId) external view returns (SSHConfig memory);
    function updateSSHConfig(uint64 configId, string calldata newEncryptedData) external payable;
    function revokeConfig(uint64 configId) external;

    // View Functions
    function getTotalUsers() external view returns (uint256);
    function getTotalConfigs() external view returns (uint256);
    function getActiveConfigs() external view returns (uint256);
    function getFees() external view returns (uint256, uint256, uint256);
    function getTotalFeesCollected() external view returns (uint256);

    // Fee Management
    function updateFees(uint256 newRegistrationFee, uint256 newAddConfigFee, uint256 newUpdateConfigFee) external;
    function withdrawFees() external;
}
