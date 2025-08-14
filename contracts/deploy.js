const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Deploying BlockZone Lab Smart Contracts...");
    
    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);
    
    // Platform fee wallet (10% of all payments go here)
    const platformFeeWallet = "0xAdDbD648c380E4822e9c934B0fc5C9f607d892c5";
    
    // USDC.E token address on Sonic Labs
    const usdcTokenAddress = "0x176211869cA2b568f2A7D4EE941E073a821EE1ff";
    
    // Deploy PaymentProcessor
    console.log("💳 Deploying PaymentProcessor...");
    const PaymentProcessor = await ethers.getContractFactory("PaymentProcessor");
    const paymentProcessor = await PaymentProcessor.deploy(
        usdcTokenAddress,
        platformFeeWallet
    );
    await paymentProcessor.deployed();
    console.log("✅ PaymentProcessor deployed to:", paymentProcessor.address);
    
    // Deploy DailyLeaderboard
    console.log("🏆 Deploying DailyLeaderboard...");
    const DailyLeaderboard = await ethers.getContractFactory("DailyLeaderboard");
    const dailyLeaderboard = await DailyLeaderboard.deploy(
        usdcTokenAddress,
        platformFeeWallet
    );
    await dailyLeaderboard.deployed();
    console.log("✅ DailyLeaderboard deployed to:", dailyLeaderboard.address);
    
    // Deploy ChallengeManager
    console.log("⚔️ Deploying ChallengeManager...");
    const ChallengeManager = await ethers.getContractFactory("ChallengeManager");
    const challengeManager = await ChallengeManager.deploy(paymentProcessor.address);
    await challengeManager.deployed();
    console.log("✅ ChallengeManager deployed to:", challengeManager.address);
    
    // Deploy main BlockzoneGame contract
    console.log("🎮 Deploying BlockzoneGame...");
    const BlockzoneGame = await ethers.getContractFactory("BlockzoneGame");
    const blockzoneGame = await BlockzoneGame.deploy(
        usdcTokenAddress,
        dailyLeaderboard.address,
        challengeManager.address,
        platformFeeWallet
    );
    await blockzoneGame.deployed();
    console.log("✅ BlockzoneGame deployed to:", blockzoneGame.address);
    
    // Set up permissions
    console.log("🔐 Setting up permissions...");
    
    // Transfer ownership of contracts to BlockzoneGame
    await dailyLeaderboard.transferOwnership(blockzoneGame.address);
    console.log("✅ Transferred DailyLeaderboard ownership");
    
    await paymentProcessor.transferOwnership(blockzoneGame.address);
    console.log("✅ Transferred PaymentProcessor ownership");
    
    await challengeManager.transferOwnership(blockzoneGame.address);
    console.log("✅ Transferred ChallengeManager ownership");
    
    console.log("\n🎉 DEPLOYMENT COMPLETE!");
    console.log("=====================================");
    console.log("Contract Addresses:");
    console.log("USDC.E Token:", usdcTokenAddress);
    console.log("PaymentProcessor:", paymentProcessor.address);
    console.log("DailyLeaderboard:", dailyLeaderboard.address);
    console.log("ChallengeManager:", challengeManager.address);
    console.log("BlockzoneGame:", blockzoneGame.address);
    console.log("Platform Fee Wallet:", platformFeeWallet);
    console.log("=====================================");
    
    // Save deployment info
    const deploymentInfo = {
        network: "sonic-labs",
        deployer: deployer.address,
        platformFeeWallet: platformFeeWallet,
        contracts: {
            usdcToken: usdcTokenAddress,
            paymentProcessor: paymentProcessor.address,
            dailyLeaderboard: dailyLeaderboard.address,
            challengeManager: challengeManager.address,
            blockzoneGame: blockzoneGame.address
        },
        deploymentTime: new Date().toISOString()
    };
    
    console.log("\n📄 Deployment info saved to deployment-info.json");
    
    return deploymentInfo;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    }); 
