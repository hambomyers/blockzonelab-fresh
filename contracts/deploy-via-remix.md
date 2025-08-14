# Sonic Labs Deployment Guide - Remix IDE Method

## Overview
This guide bypasses Hardhat deployment issues by using Remix IDE to deploy contracts directly to Sonic Labs network.

## Step 1: Prepare Contract Files
Your contracts are already in the `src/` directory:
- `BlockzoneGame.sol`
- `ChallengeManager.sol` 
- `DailyLeaderboard.sol`
- `PaymentProcessor.sol`

## Step 2: Deploy via Remix IDE

### 2.1 Open Remix IDE
1. Go to [remix.ethereum.org](https://remix.ethereum.org)
2. Create a new workspace called "BlockZone Lab"

### 2.2 Upload Contract Files
1. In the File Explorer panel, click the upload button
2. Upload all `.sol` files from `contracts/src/` directory
3. Ensure all files are visible in the workspace

### 2.3 Configure Sonic Network
1. Go to the "Deploy & Run Transactions" tab
2. In the "Environment" dropdown, select "Injected Provider - MetaMask"
3. Make sure MetaMask is connected to your wallet

### 2.4 Add Sonic Network to MetaMask
If Sonic network isn't in MetaMask:
1. Open MetaMask
2. Go to Settings > Networks > Add Network
3. Add these details:
   - Network Name: Sonic
   - RPC URL: https://rpc.sonic.game
   - Chain ID: 146
   - Currency Symbol: S
   - Block Explorer: https://sonicscan.org

### 2.5 Compile Contracts
1. Go to the "Solidity Compiler" tab
2. Set compiler version to 0.8.19
3. Enable optimization (200 runs)
4. Compile each contract individually

### 2.6 Deploy Contracts
Deploy in this order:

#### 1. DailyLeaderboard.sol
- Click "Deploy"
- Note the deployed address

#### 2. PaymentProcessor.sol
- Constructor parameters: USDC.E token address `0x176211869cA2b568f2A7D4EE941E073a821EE1ff`
- Click "Deploy"
- Note the deployed address

#### 3. ChallengeManager.sol
- Constructor parameters: payment processor address from step 2
- Click "Deploy"
- Note the deployed address

#### 4. BlockzoneGame.sol
- Constructor parameters: 
  - USDC.E token address: `0x176211869cA2b568f2A7D4EE941E073a821EE1ff`
  - leaderboard address from step 1
  - challenge manager address from step 3
  - platform fee wallet: `0xAdDbD648c380E4822e9c934B0fc5C9f607d892c5`
- Click "Deploy"
- Note the deployed address

## Step 3: Update Frontend Configuration

After deployment, update your `SonicBlockchainManager.js` with the deployed addresses:

```javascript
this.contractAddresses = {
    gameContract: "0x...", // BlockzoneGame address
    usdcToken: "0x176211869cA2b568f2A7D4EE941E073a821EE1ff", // Sonic Labs USDC.E
    leaderboardContract: "0x...", // DailyLeaderboard address
    paymentContract: "0x...", // PaymentProcessor address
    challengeContract: "0x..." // ChallengeManager address
};
```

## Step 4: Test Integration

1. Load your game at test-blockzonelab.pages.dev
2. Connect MetaMask wallet
3. Test score submission
4. Verify leaderboard updates

## Benefits of This Approach

✅ **Bypasses Hardhat Issues** - No more ENS compilation errors
✅ **Visual Deployment** - See exactly what's happening
✅ **Immediate Testing** - Deploy and test in real-time
✅ **Sonic Native** - Direct deployment to Sonic network
✅ **Future Ready** - Easy to migrate to AI deployment tool when available

## Next Steps

1. Deploy contracts via Remix
2. Update frontend with contract addresses
3. Test full integration
4. Wait for Sonic's AI deployment tool next week for enhanced features

## Troubleshooting

- **MetaMask Connection Issues**: Ensure Sonic network is added correctly
- **Compilation Errors**: Check Solidity version compatibility
- **Deployment Failures**: Verify you have S tokens for gas fees
- **Contract Interaction Issues**: Check contract addresses are correct

This method gets you live on Sonic Labs immediately while avoiding all Hardhat complexity! 