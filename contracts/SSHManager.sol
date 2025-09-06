// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ISSHManager.sol";

/**
 * @title SSHManager
 * @dev A decentralized SSH configuration manager using ECIES encryption
 * @notice This contract allows users to securely store and manage SSH configurations on-chain
 * @author Web3 SSH Manager Team
 */
contract SSHManager is ISSHManager, ReentrancyGuard, Pausable, Ownable {
    
    // State variables
    mapping(address => bool) public registeredUsers;
    mapping(address => SSHConfig[]) private userConfigs;
    mapping(address => mapping(uint64 => uint256)) private configIndexMap; // configId -> array index
    mapping(address => uint64) private userConfigCounter; // Next config ID for user
    
    // Global counters
    uint256 public totalUsers;
    uint256 public totalConfigs;
    uint256 public activeConfigs;
    
    // Fee structure (in wei, assuming OKB has 18 decimals)
    uint256 public registrationFee = 100000000000000000; // 0.1 OKB
    uint256 public addConfigFee = 20000000000000000;    // 0.02 OKB
    uint256 public updateConfigFee = 5000000000000000;  // 0.005 OKB
    
    // Fee collection
    address public immutable developer;
    uint256 public totalFeesCollected;
    
    // Constants for gas optimization
    uint256 private constant MAX_ENCRYPTED_DATA_SIZE = 8192; // 8KB limit
    
    // Custom errors for gas efficiency
    error UserNotRegistered();
    error UserAlreadyRegistered();
    error ConfigNotFound();
    error ConfigNotActive();
    error InvalidConfigId();
    error InvalidDataSize();
    error EmptyEncryptedData();
    error InsufficientFee();
    error WithdrawalFailed();

    /**
     * @dev Constructor sets the deployer as owner and developer
     */
    constructor() Ownable(msg.sender) {
        developer = 0xe92bc8BB508028CB43ab43ec69def83C406489aa;
    }

    /**
     * @dev Modifier to check if user is registered
     */
    modifier onlyRegisteredUser() {
        if (!registeredUsers[msg.sender]) revert UserNotRegistered();
        _;
    }

    /**
     * @dev Modifier to validate encrypted data
     */
    modifier validEncryptedData(string calldata encryptedData) {
        if (bytes(encryptedData).length == 0) revert EmptyEncryptedData();
        if (bytes(encryptedData).length > MAX_ENCRYPTED_DATA_SIZE) revert InvalidDataSize();
        _;
    }

    /**
     * @dev Register a new user with registration fee
     * @notice Users must register before adding SSH configurations
     */
    function registerUser() external payable whenNotPaused {
        if (registeredUsers[msg.sender]) revert UserAlreadyRegistered();
        if (msg.value < registrationFee) revert InsufficientFee();
        
        registeredUsers[msg.sender] = true;
        totalUsers++;
        totalFeesCollected += registrationFee;
        
        // Refund excess payment
        if (msg.value > registrationFee) {
            payable(msg.sender).transfer(msg.value - registrationFee);
        }
        
        emit UserRegistered(msg.sender, block.timestamp);
    }

    /**
     * @dev Check if a user is registered
     * @param user The address to check
     * @return bool Registration status
     */
    function isRegisteredUser(address user) external view returns (bool) {
        return registeredUsers[user];
    }

    /**
     * @dev Get user statistics
     * @param user The user address
     * @return UserStats User's configuration statistics
     */
    function getUserStats(address user) external view returns (UserStats memory) {
        if (!registeredUsers[user]) revert UserNotRegistered();
        
        SSHConfig[] memory configs = userConfigs[user];
        uint256 activeCount = 0;
        uint256 lastActivity = 0;
        
        for (uint256 i = 0; i < configs.length; i++) {
            if (configs[i].isActive) {
                activeCount++;
            }
            if (configs[i].timestamp > lastActivity) {
                lastActivity = configs[i].timestamp;
            }
        }
        
        return UserStats({
            totalConfigs: configs.length,
            activeConfigs: activeCount,
            lastActivity: lastActivity
        });
    }

    /**
     * @dev Add a new SSH configuration with fee
     * @param encryptedData ECIES encrypted SSH configuration data
     * @return uint64 The assigned configuration ID
     */
    function addSSHConfig(string calldata encryptedData) 
        external 
        payable
        whenNotPaused 
        nonReentrant 
        onlyRegisteredUser 
        validEncryptedData(encryptedData)
        returns (uint64)
    {
        if (msg.value < addConfigFee) revert InsufficientFee();
        uint64 configId = ++userConfigCounter[msg.sender];
        uint256 timestamp = block.timestamp;
        
        SSHConfig memory newConfig = SSHConfig({
            encryptedData: encryptedData,
            timestamp: uint128(timestamp),
            configId: configId,
            isActive: true
        });
        
        userConfigs[msg.sender].push(newConfig);
        configIndexMap[msg.sender][configId] = userConfigs[msg.sender].length - 1;
        
        totalConfigs++;
        activeConfigs++;
        totalFeesCollected += addConfigFee;
        
        // Refund excess payment
        if (msg.value > addConfigFee) {
            payable(msg.sender).transfer(msg.value - addConfigFee);
        }
        
        emit ConfigAdded(msg.sender, configId, timestamp);
        return configId;
    }

    /**
     * @dev Get all SSH configurations for a user
     * @param user The user address
     * @return SSHConfig[] Array of user's configurations
     */
    function getSSHConfigs(address user) external view returns (SSHConfig[] memory) {
        if (!registeredUsers[user]) revert UserNotRegistered();
        return userConfigs[user];
    }

    /**
     * @dev Get a specific SSH configuration
     * @param user The user address
     * @param configId The configuration ID
     * @return SSHConfig The requested configuration
     */
    function getSSHConfig(address user, uint64 configId) external view returns (SSHConfig memory) {
        if (!registeredUsers[user]) revert UserNotRegistered();
        
        uint256 index = configIndexMap[user][configId];
        if (index >= userConfigs[user].length || userConfigs[user][index].configId != configId) {
            revert ConfigNotFound();
        }
        
        return userConfigs[user][index];
    }

    /**
     * @dev Update an existing SSH configuration with fee
     * @param configId The configuration ID to update
     * @param newEncryptedData New encrypted configuration data
     */
    function updateSSHConfig(uint64 configId, string calldata newEncryptedData)
        external
        payable
        whenNotPaused
        nonReentrant
        onlyRegisteredUser
        validEncryptedData(newEncryptedData)
    {
        if (msg.value < updateConfigFee) revert InsufficientFee();
        uint256 index = configIndexMap[msg.sender][configId];
        if (index >= userConfigs[msg.sender].length || userConfigs[msg.sender][index].configId != configId) {
            revert ConfigNotFound();
        }
        
        if (!userConfigs[msg.sender][index].isActive) revert ConfigNotActive();
        
        userConfigs[msg.sender][index].encryptedData = newEncryptedData;
        userConfigs[msg.sender][index].timestamp = uint128(block.timestamp);
        totalFeesCollected += updateConfigFee;
        
        // Refund excess payment
        if (msg.value > updateConfigFee) {
            payable(msg.sender).transfer(msg.value - updateConfigFee);
        }
        
        emit ConfigUpdated(msg.sender, configId, block.timestamp);
    }

    /**
     * @dev Revoke (soft delete) an SSH configuration
     * @param configId The configuration ID to revoke
     */
    function revokeConfig(uint64 configId)
        external
        whenNotPaused
        nonReentrant
        onlyRegisteredUser
    {
        uint256 index = configIndexMap[msg.sender][configId];
        if (index >= userConfigs[msg.sender].length || userConfigs[msg.sender][index].configId != configId) {
            revert ConfigNotFound();
        }
        
        if (!userConfigs[msg.sender][index].isActive) revert ConfigNotActive();
        
        userConfigs[msg.sender][index].isActive = false;
        activeConfigs--;
        
        emit ConfigRevoked(msg.sender, configId, block.timestamp);
    }


    /**
     * @dev Get total registered users
     * @return uint256 Total number of registered users
     */
    function getTotalUsers() external view returns (uint256) {
        return totalUsers;
    }

    /**
     * @dev Get total configurations created
     * @return uint256 Total number of configurations
     */
    function getTotalConfigs() external view returns (uint256) {
        return totalConfigs;
    }

    /**
     * @dev Get total active configurations
     * @return uint256 Number of active configurations
     */
    function getActiveConfigs() external view returns (uint256) {
        return activeConfigs;
    }

    /**
     * @dev Get current fee settings
     * @return registration fee, add config fee, update config fee
     */
    function getFees() external view returns (uint256, uint256, uint256) {
        return (registrationFee, addConfigFee, updateConfigFee);
    }

    /**
     * @dev Get total fees collected
     * @return uint256 Total fees collected
     */
    function getTotalFeesCollected() external view returns (uint256) {
        return totalFeesCollected;
    }

    /**
     * @dev Update fee structure (owner only)
     * @param newRegistrationFee New registration fee
     * @param newAddConfigFee New add config fee
     * @param newUpdateConfigFee New update config fee
     */
    function updateFees(
        uint256 newRegistrationFee,
        uint256 newAddConfigFee,
        uint256 newUpdateConfigFee
    ) external onlyOwner {
        registrationFee = newRegistrationFee;
        addConfigFee = newAddConfigFee;
        updateConfigFee = newUpdateConfigFee;
    }

    /**
     * @dev Withdraw collected fees to developer address
     */
    function withdrawFees() external {
        require(msg.sender == developer || msg.sender == owner(), "Unauthorized");
        uint256 amount = address(this).balance;
        require(amount > 0, "No fees to withdraw");
        
        (bool success, ) = payable(developer).call{value: amount}("");
        if (!success) revert WithdrawalFailed();
    }

    /**
     * @dev Pause the contract (owner only)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause the contract (owner only)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}
