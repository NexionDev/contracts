import { privateKeyToAccount } from "viem/accounts";
import { formatEther, createPublicClient, http } from "viem";

// 直接定义 X Layer 测试网配置
const xlayerTestnet = {
  id: 1952,
  name: 'X Layer Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'OKB',
    symbol: 'OKB',
  },
  rpcUrls: {
    default: {
      http: ['https://xlayertestrpc.okx.com/terigon'],
    },
  },
  blockExplorers: {
    default: { name: 'OKLink', url: 'https://www.oklink.com/xlayer-test' },
  },
  testnet: true,
} as const;

async function main() {
  const privateKey = process.env.XLAYER_TESTNET_PRIVATE_KEY as `0x${string}`;
  
  if (!privateKey) {
    console.log("❌ 未找到 XLAYER_TESTNET_PRIVATE_KEY 环境变量");
    return;
  }
  
  // 从私钥获取地址
  const account = privateKeyToAccount(privateKey);
  console.log(`🔑 私钥对应的地址: ${account.address}`);
  
  // 直接创建 publicClient 连接到 X Layer 测试网
  const publicClient = createPublicClient({
    chain: xlayerTestnet,
    transport: http('https://xlayertestrpc.okx.com/terigon'),
  });

  try {
    // 查询余额
    const balance = await publicClient.getBalance({ address: account.address });
    const balanceInEth = formatEther(balance);
    
    console.log(`💰 余额: ${balanceInEth} OKB`);
    console.log(`💰 余额 (wei): ${balance.toString()}`);
    
    console.log(`\n🌐 网络信息:`);
    console.log(`Chain ID: ${await publicClient.getChainId()}`);
    console.log(`网络: X Layer Testnet`);
    console.log(`RPC: ${xlayerTestnet.rpcUrls.default.http[0]}`);
    
    if (balance > 0n) {
      console.log("\n✅ 有足够余额进行操作！");
      console.log(`\n📄 已部署的合约地址: 0xFf9EAe146001597a8Dd8424DE7D3Ef0bE9B1762a`);
      console.log(`🔍 浏览器查看: https://www.oklink.com/xlayer-test/address/0xFf9EAe146001597a8Dd8424DE7D3Ef0bE9B1762a`);
    } else {
      console.log("\n❌ 余额为 0，需要获取测试代币");
      console.log("🚰 水龙头: https://www.oklink.com/xlayer-test/faucet");
    }
  } catch (error) {
    console.error("❌ 连接 X Layer 测试网失败:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
