import hre from "hardhat";

async function main() {
  const contractAddress = "0xED7F597C7058F3eb9D0f0EA580E5A0E155A3ccC2";
  const userAddress = "0x5573ee1c30f22b548b201f875fd957c5380a9433";
  
  // Get contract instance
  const SSHManager = await hre.ethers.getContractAt("SSHManager", contractAddress);
  
  try {
    // Check contract state
    console.log("=== Contract State ===");
    const registrationFee = await SSHManager.registrationFee();
    console.log("Registration Fee:", hre.ethers.formatEther(registrationFee), "ETH");
    
    const paused = await SSHManager.paused();
    console.log("Contract Paused:", paused);
    
    const totalUsers = await SSHManager.getTotalUsers();
    console.log("Total Users:", totalUsers.toString());
    
    // Check user status
    console.log("\n=== User Status ===");
    const isRegistered = await SSHManager.isRegisteredUser(userAddress);
    console.log("User", userAddress, "registered:", isRegistered);
    
    // Check fees
    console.log("\n=== Fee Structure ===");
    const fees = await SSHManager.getFees();
    console.log("Registration Fee:", hre.ethers.formatEther(fees[0]), "ETH");
    console.log("Add Config Fee:", hre.ethers.formatEther(fees[1]), "ETH");  
    console.log("Update Config Fee:", hre.ethers.formatEther(fees[2]), "ETH");
    
  } catch (error) {
    console.error("Error checking contract:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });