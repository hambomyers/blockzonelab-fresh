# BlockZone Lab Smart Contracts

## Overview

This directory contains the smart contracts for the BlockZone Lab gaming platform, implementing the daily leaderboard system and head-to-head challenges with 10% platform fees.

## Contract Architecture

### Core Contracts

1. **DailyLeaderboard.sol** - Manages daily leaderboard with free games and unlimited passes
2. **PaymentProcessor.sol** - Handles USDC.E payments for all platform features
3. **ChallengeManager.sol** - Manages head-to-head challenges with viral game patterns
4. **BlockzoneGame.sol** - Main contract that coordinates all gaming functionality

### Business Model

#### Daily Leaderboard System
- **1 Free Game Per Day** - Resets at 11 PM EST daily
- **$0.25 Per Individual Game** - Pay-as-you-play option
- **$2.75 Unlimited Daily Pass** - Play unlimited until 11 PM EST reset
- **10% Platform Fee** - Lowest in Web3 gaming industry
- **Single 24-Hour Cycle** - One tournament per day for maximum engagement

#### Head-to-Head Challenge System
- **$1.00 Quick Challenge** - 10% platform fee ($0.90 to winner)
- **$5.00 High Roller Challenge** - 10% platform fee ($4.50 to winner)
- **Viral Game Patterns** - Share exact game pieces with friends
- **Social Mechanics** - Challenge links drive organic growth

## Deployment

### Prerequisites
1. Node.js and npm installed
2. Private key for deployment account
3. Sonic Labs network access

### Setup
```bash
# Install dependencies
npm install

# Set environment variables
export PRIVATE_KEY="your-private-key-here"

# Compile contracts
npm run compile

# Deploy to Sonic Labs mainnet
npm run deploy

# Deploy to Sonic Labs testnet
npm run deploy:testnet
```

### Deployment Order
1. PaymentProcessor.sol
2. DailyLeaderboard.sol
3. ChallengeManager.sol
4. BlockzoneGame.sol

## Contract Functions

### DailyLeaderboard.sol
- `useFreeGame()` - Use daily free game
- `purchaseUnlimitedPass()` - Buy unlimited daily pass
- `purchaseIndividualGame()` - Buy single game
- `submitScore(score, displayName)` - Submit score to leaderboard
- `getCurrentLeaderboard()` - Get today's leaderboard
- `canPlay(player)` - Check if player can play

### ChallengeManager.sol
- `createChallenge(type, score, pattern, message)` - Create challenge
- `acceptChallenge(challengeId)` - Accept challenge
- `completeChallenge(challengeId, score)` - Complete challenge
- `getChallenge(challengeId)` - Get challenge details
- `getActiveChallenges()` - Get all active challenges

### PaymentProcessor.sol
- `processIndividualGamePayment(payer)` - Process $0.25 payment
- `processUnlimitedDailyPayment(payer)` - Process $2.75 payment
- `processQuickChallengePayment(payer)` - Process $1.00 payment
- `processHighRollerChallengePayment(payer)` - Process $5.00 payment

## Security Features

- **ReentrancyGuard** - Prevents reentrancy attacks
- **Pausable** - Emergency pause functionality
- **Ownable** - Access control for admin functions
- **Platform Fee Protection** - Secure fee collection
- **Challenge Expiry** - Automatic challenge expiration

## Gas Optimization

- **Optimizer Enabled** - 200 runs for optimal gas usage
- **Efficient Storage** - Packed structs and mappings
- **Batch Operations** - Efficient bulk operations
- **Minimal External Calls** - Reduced gas costs

## Testing

```bash
# Run tests
npm test

# Run specific test file
npx hardhat test test/DailyLeaderboard.test.js
```

## Verification

```bash
# Verify contracts on Sonic Labs explorer
npm run verify
```

## Integration

The contracts are designed to integrate seamlessly with:
- Frontend UI components
- Cloudflare Workers backend
- Sonic Labs blockchain
- USDC.E payment system

## Next Steps

1. **Deploy contracts** to Sonic Labs testnet
2. **Test integration** with frontend
3. **Deploy to mainnet** after testing
4. **Update frontend** to use smart contracts
5. **Launch platform** with real payments

## Support

For questions or issues with the smart contracts, please refer to the main project documentation or contact the development team. 