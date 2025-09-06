import { createPublicClient, http, isAddress, getAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// X Layer 测试网配置
const xlayerTestnet = {
  id: 1952,
  name: 'X Layer Testnet',
  rpcUrls: {
    default: {
      http: ['https://xlayertestrpc.okx.com/terigon'],
    },
  },
};

const contractAddress = '0xeE65a2296d80D9a296Bfe5CAB4B609DD26295421';

// 合约 ABI
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

function validateAndFormatAddress(address) {
  if (!address) {
    throw new Error('地址不能为空');
  }
  
  if (!isAddress(address)) {
    throw new Error(`无效的地址格式: ${address}`);
  }
  
  return getAddress(address); // 格式化为校验和地址
}

async function enhancedDebug(userAddressInput) {
  try {
    const publicClient = createPublicClient({
      chain: xlayerTestnet,
      transport: http()
    });

    console.log('🔍 增强调试工具 - X Layer 测试网');
    console.log('合约地址:', contractAddress);
    console.log('');

    // 验证和格式化用户地址
    let userAddress;
    try {
      userAddress = validateAndFormatAddress(userAddressInput);
      console.log('✅ 用户地址格式正确:', userAddress);
    } catch (error) {
      console.log('❌ 用户地址格式错误:', error.message);
      return;
    }

    // 1. 检查合约是否存在
    console.log('\\n1. 检查合约状态...');
    try {
      const code = await publicClient.getBytecode({ address: contractAddress });
      if (!code || code === '0x') {
        console.log('❌ 合约不存在或未部署到此网络！');
        return;
      }
      console.log('✅ 合约已部署，代码长度:', code.length);
    } catch (error) {
      console.log('❌ 获取合约代码失败:', error.message);
      return;
    }

    // 2. 获取合约统计信息
    console.log('\\n2. 合约统计信息...');
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

      console.log('📊 总注册用户数:', totalUsers.toString());
      console.log('📊 总配置数:', totalConfigs.toString());
      
      if (totalUsers === 0n) {
        console.log('⚠️ 注意：还没有任何用户注册！');
      }
    } catch (error) {
      console.log('❌ 获取统计信息失败:', error.message);
    }

    // 3. 检查指定用户的注册状态
    console.log('\\n3. 检查用户注册状态...');
    try {
      const isRegistered = await publicClient.readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'isRegisteredUser',
        args: [userAddress]
      });
      
      console.log(isRegistered ? '✅ 用户已注册' : '❌ 用户未注册');
      
      if (!isRegistered) {
        console.log('\\n💡 解决方案:');
        console.log('   用户需要先调用 registerUser() 函数注册');
        console.log('   这通常在前端首次使用时自动完成');
        console.log('   检查前端的用户注册逻辑是否正常执行');
        return;
      }
    } catch (error) {
      console.log('❌ 检查注册状态失败:', error.message);
      return;
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
      
      console.log('📝 用户配置数量:', configs.length);
      
      if (configs.length === 0) {
        console.log('❌ 用户没有任何SSH配置');
        console.log('\\n💡 可能的原因:');
        console.log('   1. 用户确实还没有添加配置');
        console.log('   2. 添加配置的交易失败了（检查交易哈希）');
        console.log('   3. 前端连接了错误的网络或合约地址');
        console.log('   4. 交易还在等待确认中');
      } else {
        console.log('\\n📋 配置列表:');
        configs.forEach((config, index) => {
          const date = new Date(Number(config.timestamp) * 1000);
          console.log(`\\n配置 #${index + 1}:`);
          console.log(`   ID: ${config.configId}`);
          console.log(`   状态: ${config.isActive ? '✅ 活跃' : '❌ 已撤销'}`);
          console.log(`   创建时间: ${date.toLocaleString()}`);
          console.log(`   加密数据长度: ${config.encryptedData.length} 字符`);
          console.log(`   数据预览: ${config.encryptedData.substring(0, 100)}...`);
        });
      }
    } catch (error) {
      console.log('❌ 获取配置失败:', error.message);
      console.log('错误详情:', error);
    }

    // 5. 网络连接测试
    console.log('\\n5. 网络连接测试...');
    try {
      const blockNumber = await publicClient.getBlockNumber();
      console.log('✅ 网络连接正常，当前区块高度:', blockNumber.toString());
    } catch (error) {
      console.log('❌ 网络连接失败:', error.message);
    }

  } catch (error) {
    console.log('❌ 调试过程失败:', error.message);
    if (error.cause) {
      console.log('错误原因:', error.cause);
    }
  }
}

// 获取最近的交易记录（如果可能的话）
async function getRecentTransactions(userAddress, fromBlock = 'earliest') {
  try {
    const publicClient = createPublicClient({
      chain: xlayerTestnet,
      transport: http()
    });

    console.log('\\n🔄 获取最近的合约交互记录...');
    
    // 获取当前区块号
    const currentBlock = await publicClient.getBlockNumber();
    
    // 如果是 'earliest'，则限制为最近1000个区块
    let actualFromBlock = fromBlock;
    if (fromBlock === 'earliest') {
      actualFromBlock = currentBlock - 1000n;
      if (actualFromBlock < 0n) actualFromBlock = 0n;
    }
    
    console.log(`   查询区块范围: ${actualFromBlock} -> ${currentBlock} (共 ${currentBlock - BigInt(actualFromBlock) + 1n} 个区块)`);
    
    const logs = await publicClient.getLogs({
      address: contractAddress,
      fromBlock: actualFromBlock,
      toBlock: 'latest'
    });

    if (logs.length === 0) {
      console.log('❌ 没有找到任何合约交互记录');
      return;
    }

    console.log(`✅ 找到 ${logs.length} 条合约交互记录`);
    
    // 显示最近的几条记录
    const recentLogs = logs.slice(-5);
    recentLogs.forEach((log, index) => {
      console.log(`\\n记录 #${index + 1}:`);
      console.log(`   区块: ${log.blockNumber}`);
      console.log(`   交易哈希: ${log.transactionHash}`);
      console.log(`   主题: ${log.topics[0]}`);
    });

  } catch (error) {
    console.log('❌ 获取交易记录失败:', error.message);
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  const userAddress = process.argv[2];
  
  if (!userAddress) {
    console.log('用法: node enhanced-debug.js <用户地址>');
    console.log('');
    console.log('示例:');
    console.log('  node enhanced-debug.js 0x1234567890123456789012345678901234567890');
    console.log('  node enhanced-debug.js 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266');
    process.exit(1);
  }
  
  await enhancedDebug(userAddress);
  await getRecentTransactions(userAddress);
}

export { enhancedDebug, getRecentTransactions };
