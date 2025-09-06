# Web3 SSH Manager - Smart Contracts

This directory contains the smart contracts for the Web3 SSH Manager project, built with Hardhat and optimized for X Layer blockchain.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm package manager

### Installation
```bash
pnpm install
```

### Environment Setup
1. Copy `.env.example` to `.env`
2. Fill in your private keys and RPC URLs

### Compile Contracts
```bash
pnpm compile
```

### Run Tests
```bash
pnpm test
```

### Run Tests with Gas Analysis
```bash
pnpm test:gas
```

## 📄 Contracts

### SSHManager.sol
The main contract that manages SSH configurations with the following features:
- **User Registration**: Web3 wallet-based user management
- **ECIES Encryption**: SSH configs are encrypted before storing on-chain
- **Batch Operations**: Efficient multi-config updates
- **Access Control**: User-specific configuration access
- **Gas Optimized**: Packed structs and efficient storage patterns

### Key Features:
- ✅ ECIES encrypted SSH configuration storage
- ✅ User registration and authentication
- ✅ Batch operations for enterprise use
- ✅ Comprehensive access control
- ✅ Event logging for audit trails
- ✅ Gas-optimized for X Layer's low-cost environment

## 🌐 Network Configuration

### X Layer Testnet
- **Chain ID**: 1952
- **RPC**: https://xlayertestrpc.okx.com/terigon
- **Gas Price**: ~0.03 gwei (ultra-low cost)

### X Layer Mainnet
- **Chain ID**: 196
- **RPC**: https://rpc.xlayer.tech
- **Gas Price**: ~0.03 gwei

## 🚀 Deployment

### Local Development
```bash
pnpm deploy:local
```

### X Layer Testnet
```bash
pnpm deploy:xlayer-testnet
```

### X Layer Mainnet
```bash
pnpm deploy:xlayer-mainnet
```

## 🧪 Testing

The test suite covers:
- User registration and management
- SSH configuration CRUD operations
- Batch operations
- Access control and security
- Gas usage analysis
- Error handling and edge cases

## 💰 Gas Cost Estimates (X Layer)

| Operation | Estimated Gas | Cost @ 0.03 gwei |
|-----------|--------------|------------------|
| User Registration | ~50,000 | $0.0006 |
| Add SSH Config | ~80,000 | $0.001 |
| Update Config | ~60,000 | $0.0008 |
| Revoke Config | ~40,000 | $0.0005 |
| Batch Update (10) | ~500,000 | $0.006 |

## 🔧 Development Scripts

- `pnpm compile` - Compile contracts
- `pnpm test` - Run test suite
- `pnpm test:gas` - Run tests with gas reporting
- `pnpm clean` - Clean build artifacts
- `pnpm node` - Start local Hardhat node
- `pnpm flatten` - Flatten contracts for verification
- `pnpm coverage` - Generate test coverage report

## 🏗 Architecture

```
contracts/
├── contracts/
│   ├── SSHManager.sol      # Main SSH management contract
│   └── ISSHManager.sol     # Interface definition
├── flattened/              # Contract verification files
│   ├── SSHManager_final.sol
│   └── SSHManager_verification.sol
├── test/
│   └── SSHManager.test.ts  # Comprehensive test suite
├── ignition/modules/
│   └── SSHManager.ts       # Deployment configuration
├── scripts/                # Utility and debug scripts
├── LICENSE                 # MIT License
└── hardhat.config.ts       # Hardhat configuration
```

## 🔐 Security Features

- **ReentrancyGuard**: Prevents reentrancy attacks
- **Pausable**: Emergency stop functionality
- **Ownable**: Admin controls for contract management
- **Input Validation**: Comprehensive data validation
- **Access Control**: User-specific data isolation
- **Custom Errors**: Gas-efficient error handling

## 📊 Integration with Frontend

The contracts are designed to integrate seamlessly with the Electron frontend using:
- **Wagmi + Viem**: Modern Web3 React hooks
- **TypeScript**: Full type safety with generated contract types
- **Event Streaming**: Real-time updates via contract events
