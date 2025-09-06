const { createPublicClient, createWalletClient, http } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { localhost } = require('viem/chains');

// 本地网络配置
const localChain = {
  ...localhost,
  id: 31337,
  name: 'Hardhat Local Network',
};

// 默认测试私钥 (对应测试助记词的第一个账户)
const TEST_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

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
  },
  {
    inputs: [],
    name: 'getTotalUsers',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getTotalConfigs',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
];

async function debugLocalContract(contractAddress, userAddress) {
  try {
    const publicClient = createPublicClient({
      chain: localChain,
      transport: http()
    });

    console.log('🏠 调试本地合约状态...');
    console.log('网络:', localChain.name);
    console.log('合约地址:', contractAddress);
    console.log('用户地址:', userAddress);
    console.log('');

    // 1. 检查合约是否存在
    console.log('1. 检查合约代码...');
    try {
      const code = await publicClient.getBytecode({ address: contractAddress });
      if (!code || code === '0x') {
        console.log('❌ 合约不存在或未部署！');
        console.log('💡 请先部署合约: npm run deploy:local');
        return;
      }
      console.log('✅ 合约已部署，代码长度:', code.length);
    } catch (error) {
      console.log('❌ 获取合约代码失败:', error.message);
      return;
    }

    // 2. 检查合约统计信息
    console.log('\\n2. 获取合约统计信息...');
    try {
      const totalUsers = await publicClient.readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'getTotalUsers'
      });
      
      const totalConfigs = await publicClient.readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'getTotalConfigs'
      });

      console.log('✅ 总用户数:', totalUsers.toString());
      console.log('✅ 总配置数:', totalConfigs.toString());
    } catch (error) {
      console.log('❌ 获取统计信息失败:', error.message);
    }

    // 3. 检查用户注册状态
    console.log('\\n3. 检查用户注册状态...');
    try {
      const isRegistered = await publicClient.readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'isRegisteredUser',
        args: [userAddress]
      });
      console.log('✅ 用户注册状态:', isRegistered);
      
      if (!isRegistered) {
        console.log('❌ 用户未注册！');
        console.log('💡 解决方案: 用户需要先调用 registerUser() 函数');
        return false;
      }
    } catch (error) {
      console.log('❌ 检查注册状态失败:', error.message);
      return false;
    }

    // 4. 获取用户的SSH配置
    console.log('\\n4. 获取用户SSH配置...');
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
        console.log(`  - 加密数据预览: ${config.encryptedData.substring(0, 50)}...`);
      });

      if (configs.length === 0) {
        console.log('❌ 没有找到SSH配置');
        console.log('💡 可能原因:');
        console.log('   - 用户还没有添加任何配置');
        console.log('   - 添加配置的交易失败了');
        console.log('   - 前端调用了错误的合约地址');
      }

      return configs.length > 0;
    } catch (error) {
      console.log('❌ 获取配置失败:', error.message);
      console.log('错误详情:', error);
      return false;
    }

  } catch (error) {
    console.log('❌ Debug失败:', error.message);
    return false;
  }
}

// 完整测试流程
async function fullTest(contractAddress) {
  try {
    const account = privateKeyToAccount(TEST_PRIVATE_KEY);
    
    const publicClient = createPublicClient({
      chain: localChain,
      transport: http()
    });

    const walletClient = createWalletClient({
      account,
      chain: localChain,
      transport: http()
    });

    console.log('🧪 开始完整测试流程...');
    console.log('测试账户:', account.address);
    console.log('');

    // 1. 检查账户余额
    const balance = await publicClient.getBalance({ address: account.address });
    console.log('账户余额:', balance.toString(), 'wei');

    if (balance === 0n) {
      console.log('❌ 账户余额为零！请确保本地网络正在运行');
      return;
    }

    // 2. 检查用户是否已注册
    let isRegistered = await publicClient.readContract({
      address: contractAddress,
      abi: contractABI,
      functionName: 'isRegisteredUser',
      args: [account.address]
    });

    if (!isRegistered) {
      console.log('⚠️ 用户未注册，正在注册...');
      const registerTx = await walletClient.writeContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'registerUser'
      });
      console.log('注册交易哈希:', registerTx);
      
      const receipt = await publicClient.waitForTransactionReceipt({ hash: registerTx });
      console.log('✅ 用户注册成功，区块:', receipt.blockNumber.toString());
    } else {
      console.log('✅ 用户已注册');
    }

    // 3. 添加SSH配置
    console.log('\\n📝 添加测试SSH配置...');
    const testEncryptedData = JSON.stringify({
      name: '测试服务器',
      host: '192.168.1.100',
      port: 22,
      username: 'root',
      authType: 'password',
      encrypted: true,
      timestamp: Date.now()
    });

    const addTx = await walletClient.writeContract({
      address: contractAddress,
      abi: contractABI,
      functionName: 'addSSHConfig',
      args: [testEncryptedData]
    });
    
    console.log('添加配置交易哈希:', addTx);
    
    const receipt = await publicClient.waitForTransactionReceipt({ hash: addTx });
    console.log('✅ 配置添加成功，区块:', receipt.blockNumber.toString());

    // 4. 验证配置是否添加成功
    console.log('\\n🔍 验证配置添加结果...');
    await debugLocalContract(contractAddress, account.address);

  } catch (error) {
    console.log('❌ 测试失败:', error.message);
    if (error.cause) {
      console.log('错误原因:', error.cause);
    }
  }
}

// 导出函数
module.exports = {
  debugLocalContract,
  fullTest,
  TEST_PRIVATE_KEY,
  localChain
};

// 如果直接运行此脚本
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('用法:');
    console.log('  调试: node local-debug.js debug <合约地址> [用户地址]');
    console.log('  完整测试: node local-debug.js test <合约地址>');
    console.log('');
    console.log('示例:');
    console.log('  node local-debug.js debug 0x5FbDB2315678afecb367f032d93F642f64180aa3');
    console.log('  node local-debug.js test 0x5FbDB2315678afecb367f032d93F642f64180aa3');
    process.exit(1);
  }

  const command = args[0];
  const contractAddress = args[1];

  if (command === 'debug') {
    const userAddress = args[2] || privateKeyToAccount(TEST_PRIVATE_KEY).address;
    debugLocalContract(contractAddress, userAddress);
  } else if (command === 'test') {
    fullTest(contractAddress);
  } else {
    console.log('❌ 未知命令:', command);
    console.log('支持的命令: debug, test');
  }
}