// Sources flattened with hardhat v3.0.1 https://hardhat.org

// SPDX-License-Identifier: MIT

// File contracts/SSHManager.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.20;




/**
 * @title SSHManager
 * @dev A decentralized SSH configuration manager using ECIES encryption
 * @notice This contract allows users to securely store and manage SSH configurations on-chain
 * @author Web3 SSH Manager Team
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}


// File npm/@openzeppelin/contracts@5.4.0/utils/Pausable.sol

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.3.0) (utils/Pausable.sol)

pragma solidity ^0.8.20;

/**
 * @dev Contract module which allows children to implement an emergency stop
 * mechanism that can be triggered by an authorized account.
 *
 * This module is used through inheritance. It will make available the
 * modifiers `whenNotPaused` and `whenPaused`, which can be applied to
 * the functions of your contract. Note that they will not be pausable by
 * simply including this module, only once the modifiers are put in place.
 */
abstract contract ReentrancyGuard {
    // Booleans are more expensive than uint256 or any type that takes up a full
    // word because each write operation emits an extra SLOAD to first read the
    // slot's contents, replace the bits taken up by the boolean, and then write
    // back. This is the compiler's defense against contract upgrades and
    // pointer aliasing, and it cannot be disabled.

    // The values being non-zero value makes deployment a bit more expensive,
    // but in exchange the refund on every call to nonReentrant will be lower in
    // amount. Since refunds are capped to a percentage of the total
    // transaction's gas, it is best to keep them low in cases like this one, to
    // increase the likelihood of the full refund coming into effect.
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;

    uint256 private _status;

    /**
     * @dev Unauthorized reentrant call.
     */
    error ReentrancyGuardReentrantCall();

    constructor() {
        _status = NOT_ENTERED;
    }

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a `nonReentrant` function from another `nonReentrant`
     * function is not supported. It is possible to prevent this from happening
     * by making the `nonReentrant` function external, and making it call a
     * `private` function that does the actual work.
     */
    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    function _nonReentrantBefore() private {
        // On the first call to nonReentrant, _status will be NOT_ENTERED
        if (_status == ENTERED) {
            revert ReentrancyGuardReentrantCall();
        }

        // Any calls to nonReentrant after this point will fail
        _status = ENTERED;
    }

    function _nonReentrantAfter() private {
        // By storing the original value once again, a refund is triggered (see
        // https://eips.ethereum.org/EIPS/eip-2200)
        _status = NOT_ENTERED;
    }

    /**
     * @dev Returns true if the reentrancy guard is currently set to "entered", which indicates there is a
     * `nonReentrant` function in the call stack.
     */
    function _reentrancyGuardEntered() internal view returns (bool) {
        return _status == ENTERED;
    }
}


// File contracts/ISSHManager.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ISSHManager
 * @dev Interface for the SSH Manager contract
 * @author Web3 SSH Manager Team
 */
abstract contract Pausable is Context {
    bool private _paused;

    /**
     * @dev Emitted when the pause is triggered by `account`.
     */
    event Paused(address account);

    /**
     * @dev Emitted when the pause is lifted by `account`.
     */
    event Unpaused(address account);

    /**
     * @dev The operation failed because the contract is paused.
     */
    error EnforcedPause();

    /**
     * @dev The operation failed because the contract is not paused.
     */
    error ExpectedPause();

    /**
     * @dev Modifier to make a function callable only when the contract is not paused.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    modifier whenNotPaused() {
        _requireNotPaused();
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is paused.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    modifier whenPaused() {
        _requirePaused();
        _;
    }

    /**
     * @dev Returns true if the contract is paused, and false otherwise.
     */
    function paused() public view virtual returns (bool) {
        return _paused;
    }

    /**
     * @dev Throws if the contract is paused.
     */
    function _requireNotPaused() internal view virtual {
        if (paused()) {
            revert EnforcedPause();
        }
    }

    /**
     * @dev Throws if the contract is not paused.
     */
    function _requirePaused() internal view virtual {
        if (!paused()) {
            revert ExpectedPause();
        }
    }

    /**
     * @dev Triggers stopped state.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    function _pause() internal virtual whenNotPaused {
        _paused = true;
        emit Paused(_msgSender());
    }

    /**
     * @dev Returns to normal state.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    function _unpause() internal virtual whenPaused {
        _paused = false;
        emit Unpaused(_msgSender());
    }
}


// File npm/@openzeppelin/contracts@5.4.0/utils/ReentrancyGuard.sol

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (utils/ReentrancyGuard.sol)

pragma solidity ^0.8.20;

/**
 * @dev Contract module that helps prevent reentrant calls to a function.
 *
 * Inheriting from `ReentrancyGuard` will make the {nonReentrant} modifier
 * available, which can be applied to functions to make sure there are no nested
 * (reentrant) calls to them.
 *
 * Note that because there is a single `nonReentrant` guard, functions marked as
 * `nonReentrant` may not call one another. This can be worked around by making
 * those functions `private`, and then adding `external` `nonReentrant` entry
 * points to them.
 *
 * TIP: If EIP-1153 (transient storage) is available on the chain you're deploying at,
 * consider using {ReentrancyGuardTransient} instead.
 *
 * TIP: If you would like to learn more about reentrancy and alternative ways
 * to protect against it, check out our blog post
 * https://blog.openzeppelin.com/reentrancy-after-istanbul/[Reentrancy After Istanbul].
 */
abstract contract Ownable is Context {
    address private _owner;

    /**
     * @dev The caller account is not authorized to perform an operation.
     */
    error OwnableUnauthorizedAccount(address account);

    /**
     * @dev The owner is not a valid owner account. (eg. `address(0)`)
     */
    error OwnableInvalidOwner(address owner);

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the address provided by the deployer as the initial owner.
     */
    constructor(address initialOwner) {
        if (initialOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(initialOwner);
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if the sender is not the owner.
     */
    function _checkOwner() internal view virtual {
        if (owner() != _msgSender()) {
            revert OwnableUnauthorizedAccount(_msgSender());
        }
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby disabling any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        if (newOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Internal function without access restriction.
     */
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}


// File npm/@openzeppelin/contracts@5.4.0/utils/Context.sol

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.1) (utils/Context.sol)

pragma solidity ^0.8.20;

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
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


// File npm/@openzeppelin/contracts@5.4.0/access/Ownable.sol

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (access/Ownable.sol)

pragma solidity ^0.8.20;

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * The initial owner is set to the address provided by the deployer. This can
 * later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
