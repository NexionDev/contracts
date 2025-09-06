import { formatEther } from "viem";
import { network } from "hardhat";

async function main() {
  const address = "0x5573ee1c30f22b548b201f875fd957c5380a9433";
  
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  
  const balance = await publicClient.getBalance({ address: address as `0x${string}` });
  const balanceInEth = formatEther(balance);
  
  console.log(`钱包地址: ${address}`);
  console.log(`余额: ${balanceInEth} OKB`);
  console.log(`余额 (wei): ${balance.toString()}`);
  
  if (balance === 0n) {
    console.log("\n🚰 需要获取测试代币:");
    console.log("访问: https://www.oklink.com/xlayer-test/faucet");
    console.log("或者: OKX Discord 社区申请");
  } else {
    console.log("\n✅ 有足够余额进行部署");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
