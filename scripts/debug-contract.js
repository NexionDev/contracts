import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// 网络配置
const chain = {
  id: 1952,
  name: 'X Layer Testnet',
  rpcUrls: {
    default: {
      http: ['https://xlayertestrpc.okx.com/terigon'],
    },
  },
};

const contractAddress = '0xc800c823937a949f842379dcdb12EDbb1572905a';

// 合约 ABI (只包含需要的函数)
const contractABI = [
  {
    inputs: [],
    name: 'registerUser',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'isRegisteredUser',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'string', name: 'encryptedData', type: 'string' }],
    name: 'addSSHConfig',
    outputs: [{ internalType: 'uint64', name: '', type: 'uint64' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'getSSHConfigs',
    outputs: [{
      components: [
        { internalType: 'string', name: 'encryptedData', type: 'string' },
        { internalType: 'uint128', name: 'timestamp', type: 'uint128' },
        { internalType: 'uint64', name: 'configId', type: 'uint64' },
        { internalType: 'bool', name: 'isActive', type: 'bool' }
      ],
      internalType: 'struct ISSHManager.SSHConfig[]',
      name: '',
      type: 'tuple[]'
    }],
    stateMutability: 'view',
    type: 'function'
  }
];

async function debugContract(userAddress) {
  try {
    const publicClient = createPublicClient({
      chain,
      transport: http()
    });

    console.log('🔍 调试合约状态...');
    console.log('合约地址:', contractAddress);
    console.log('用户地址:', userAddress);
    console.log('');

    // 1. 检查用户是否已注册
    console.log('1. 检查用户注册状态...');
    try {
      const isRegistered = await publicClient.readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'isRegisteredUser',
        args: [userAddress]
      });
      console.log('✅ 用户已注册:', isRegistered);
      
      if (!isRegistered) {
        console.log('❌ 用户未注册！这就是问题所在。');
        console.log('💡 解决方案: 用户需要先调用 registerUser() 函数');
        return;
      }
    } catch (error) {
      console.log('❌ 检查注册状态失败:', error.message);
      return;
    }

    // 2. 获取用户的SSH配置
    console.log('\\n2. 获取用户SSH配置...');
    try {
      const configs = await publicClient.readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'getSSHConfigs',
        args: [userAddress]
      });
      
      console.log('✅ SSH配置数量:', configs.length);
      configs.forEach((config, index) => {
        console.log(`配置 ${index + 1}:`);
        console.log(`  - ID: ${config.configId}`);
        console.log(`  - 活跃状态: ${config.isActive}`);
        console.log(`  - 时间戳: ${config.timestamp}`);
        console.log(`  - 加密数据长度: ${config.encryptedData.length} 字符`);
      });

      if (configs.length === 0) {
        console.log('❌ 没有找到SSH配置');
        console.log('💡 可能原因:');
        console.log('   - 用户还没有添加任何配置');
        console.log('   - 添加配置的交易失败了');
        console.log('   - 前端调用了错误的合约地址');
      }
    } catch (error) {
      console.log('❌ 获取配置失败:', error.message);
      console.log('错误详情:', error);
    }

  } catch (error) {
    console.log('❌ Debug失败:', error.message);
  }
}

// 测试函数
async function testAddConfig(privateKey, encryptedData) {
  try {
    const account = privateKeyToAccount(privateKey);
    
    const walletClient = createWalletClient({
      account,
      chain,
      transport: http()
    });

    console.log('🧪 测试添加配置...');
    console.log('用户地址:', account.address);

    // 1. 检查用户是否注册
    const publicClient = createPublicClient({
      chain,
      transport: http()
    });

    const isRegistered = await publicClient.readContract({
      address: contractAddress,
      abi: contractABI,
      functionName: 'isRegisteredUser',
      args: [account.address]
    });

    if (!isRegistered) {
      console.log('⚠️ 用户未注册，先注册用户...');
      const registerTx = await walletClient.writeContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'registerUser'
      });
      console.log('注册交易哈希:', registerTx);
      
      // 等待交易确认
      const receipt = await publicClient.waitForTransactionReceipt({ hash: registerTx });
      console.log('✅ 用户注册成功，区块:', receipt.blockNumber);
    }

    // 2. 添加SSH配置
    console.log('\\n添加SSH配置...');
    const addTx = await walletClient.writeContract({
      address: contractAddress,
      abi: contractABI,
      functionName: 'addSSHConfig',
      args: [encryptedData || 'test-encrypted-data-123']
    });
    
    console.log('添加配置交易哈希:', addTx);
    
    // 等待交易确认
    const receipt = await publicClient.waitForTransactionReceipt({ hash: addTx });
    console.log('✅ 配置添加成功，区块:', receipt.blockNumber);

    // 3. 验证配置是否添加成功
    await debugContract(account.address);

  } catch (error) {
    console.log('❌ 测试失败:', error.message);
    console.log('错误详情:', error);
  }
}

// 导出函数
export {
  debugContract,
  testAddConfig
};

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  const userAddress = process.argv[2];
  if (!userAddress) {
    console.log('用法: node debug-contract.js <用户地址>');
    console.log('例如: node debug-contract.js 0x1234567890123456789012345678901234567890');
    process.exit(1);
  }
  
  debugContract(userAddress);
}