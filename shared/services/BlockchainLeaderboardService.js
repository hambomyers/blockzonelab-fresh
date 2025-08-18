/**
 * BlockchainLeaderboardService.js
 * Integrates with Solidity contracts for real on-chain leaderboard data
 * @author BlockZone Lab
 */

import { ethers } from 'ethers';

export class BlockchainLeaderboardService {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.dailyLeaderboardContract = null;
        this.challengeManagerContract = null;
        this.isInitialized = false;
        
        // Contract addresses (these should be deployed and verified)
        this.contractAddresses = {
            dailyLeaderboard: '0x...', // TODO: Deploy and add address
            challengeManager: '0x...', // TODO: Deploy and add address
            paymentProcessor: '0x...'  // TODO: Deploy and add address
        };
        
        // Contract ABIs (these should match the deployed contracts)
        this.contractABIs = {
            dailyLeaderboard: [
                'function submitScore(uint256 score, string memory displayName) external',
                'function getCurrentLeaderboard() external view returns (tuple(address player, uint256 score, uint256 timestamp, string displayName)[])',
                'function getDailyLeaderboard(uint256 day) external view returns (tuple(address player, uint256 score, uint256 timestamp, string displayName)[])',
                'function getCurrentDay() external view returns (uint256)',
                'function canPlay(address player) external view returns (bool)',
                'function hasUnlimitedPass(address player) external view returns (bool)'
            ],
            challengeManager: [
                'function createChallenge(uint8 challengeType, uint256 creatorScore, string memory gamePattern, string memory message) external returns (uint256)',
                'function acceptChallenge(uint256 challengeId) external',
                'function completeChallenge(uint256 challengeId, uint256 challengerScore) external',
                'function getChallenge(uint256 challengeId) external view returns (tuple(uint256 id, address creator, address challenger, uint8 challengeType, uint256 entryFee, uint256 creatorScore, uint256 challengerScore, uint256 creatorScoreTarget, string gamePattern, string message, uint8 status, uint256 createdAt, uint256 expiresAt, uint256 completedAt, address winner))'
            ]
        };
    }
    
    /**
     * Initialize the blockchain service
     */
    async initialize() {
        try {
            console.log('🔗 Initializing Blockchain Leaderboard Service...');
            
            // Check if MetaMask is available
            if (!window.ethereum) {
                throw new Error('MetaMask not found. Please install MetaMask to use blockchain features.');
            }
            
            // Create provider and signer
            this.provider = new ethers.BrowserProvider(window.ethereum);
            this.signer = await this.provider.getSigner();
            
            // Get network info
            const network = await this.provider.getNetwork();
            console.log('🌐 Connected to network:', network.name, 'Chain ID:', network.chainId);
            
            // Initialize contracts
            await this.initializeContracts();
            
            this.isInitialized = true;
            console.log('✅ Blockchain Leaderboard Service initialized successfully');
            
            return true;
            
        } catch (error) {
            console.error('❌ Failed to initialize Blockchain Leaderboard Service:', error);
            throw error;
        }
    }
    
    /**
     * Initialize smart contracts
     */
    async initializeContracts() {
        try {
            // Initialize DailyLeaderboard contract
            if (this.contractAddresses.dailyLeaderboard !== '0x...') {
                this.dailyLeaderboardContract = new ethers.Contract(
                    this.contractAddresses.dailyLeaderboard,
                    this.contractABIs.dailyLeaderboard,
                    this.signer
                );
                console.log('📊 DailyLeaderboard contract initialized');
            }
            
            // Initialize ChallengeManager contract
            if (this.contractAddresses.challengeManager !== '0x...') {
                this.challengeManagerContract = new ethers.Contract(
                    this.contractAddresses.challengeManager,
                    this.contractABIs.challengeManager,
                    this.signer
                );
                console.log('⚔️ ChallengeManager contract initialized');
            }
            
        } catch (error) {
            console.error('❌ Failed to initialize contracts:', error);
            throw error;
        }
    }
    
    /**
     * Submit score to blockchain leaderboard
     */
    async submitScore(score, displayName) {
        try {
            if (!this.isInitialized || !this.dailyLeaderboardContract) {
                throw new Error('Blockchain service not initialized or contracts not deployed');
            }
            
            console.log('🏆 Submitting score to blockchain:', { score, displayName });
            
            // Submit score to DailyLeaderboard contract
            const tx = await this.dailyLeaderboardContract.submitScore(score, displayName);
            console.log('📝 Transaction submitted:', tx.hash);
            
            // Wait for confirmation
            const receipt = await tx.wait();
            console.log('✅ Score submitted successfully:', receipt);
            
            return {
                success: true,
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString()
            };
            
        } catch (error) {
            console.error('❌ Failed to submit score to blockchain:', error);
            throw error;
        }
    }
    
    /**
     * Get current leaderboard from blockchain
     */
    async getCurrentLeaderboard() {
        try {
            if (!this.isInitialized || !this.dailyLeaderboardContract) {
                throw new Error('Blockchain service not initialized or contracts not deployed');
            }
            
            console.log('📊 Fetching current leaderboard from blockchain...');
            
            // Get current leaderboard from contract
            const leaderboardEntries = await this.dailyLeaderboardContract.getCurrentLeaderboard();
            
            // Transform blockchain data to frontend format
            const scores = leaderboardEntries.map((entry, index) => ({
                id: entry.player, // Use wallet address as ID
                player_id: entry.player,
                display_name: entry.displayName,
                player_name: entry.displayName, // For compatibility
                name: entry.displayName, // For compatibility with overlay manager
                score: entry.score.toString(),
                timestamp: entry.timestamp.toString(),
                rank: index + 1,
                isCurrentPlayer: false // Will be set by caller
            }));
            
            console.log('✅ Retrieved leaderboard from blockchain:', scores.length, 'entries');
            
            return {
                scores: scores,
                last_updated: new Date().toISOString(),
                source: 'blockchain',
                total_entries: scores.length
            };
            
        } catch (error) {
            console.error('❌ Failed to get leaderboard from blockchain:', error);
            throw error;
        }
    }
    
    /**
     * Get daily leaderboard for specific day
     */
    async getDailyLeaderboard(day) {
        try {
            if (!this.isInitialized || !this.dailyLeaderboardContract) {
                throw new Error('Blockchain service not initialized or contracts not deployed');
            }
            
            console.log('📅 Fetching leaderboard for day:', day);
            
            // Get daily leaderboard from contract
            const leaderboardEntries = await this.dailyLeaderboardContract.getDailyLeaderboard(day);
            
            // Transform blockchain data to frontend format
            const scores = leaderboardEntries.map((entry, index) => ({
                id: entry.player,
                player_id: entry.player,
                display_name: entry.displayName,
                player_name: entry.displayName,
                name: entry.displayName,
                score: entry.score.toString(),
                timestamp: entry.timestamp.toString(),
                rank: index + 1,
                isCurrentPlayer: false
            }));
            
            return {
                scores: scores,
                day: day,
                last_updated: new Date().toISOString(),
                source: 'blockchain',
                total_entries: scores.length
            };
            
        } catch (error) {
            console.error('❌ Failed to get daily leaderboard from blockchain:', error);
            throw error;
        }
    }
    
    /**
     * Get player's current rank
     */
    async getPlayerRank(playerAddress) {
        try {
            if (!this.isInitialized || !this.dailyLeaderboardContract) {
                throw new Error('Blockchain service not initialized or contracts not deployed');
            }
            
            const leaderboard = await this.getCurrentLeaderboard();
            const playerEntry = leaderboard.scores.find(entry => 
                entry.player_id.toLowerCase() === playerAddress.toLowerCase()
            );
            
            if (playerEntry) {
                return {
                    rank: playerEntry.rank,
                    position: playerEntry.rank,
                    total: leaderboard.total_entries,
                    score: playerEntry.score
                };
            } else {
                return {
                    rank: "Not ranked",
                    position: null,
                    total: leaderboard.total_entries,
                    score: 0
                };
            }
            
        } catch (error) {
            console.error('❌ Failed to get player rank from blockchain:', error);
            throw error;
        }
    }
    
    /**
     * Create a challenge
     */
    async createChallenge(challengeType, creatorScore, gamePattern, message) {
        try {
            if (!this.isInitialized || !this.challengeManagerContract) {
                throw new Error('Blockchain service not initialized or contracts not deployed');
            }
            
            console.log('⚔️ Creating challenge:', { challengeType, creatorScore, gamePattern, message });
            
            // Create challenge on blockchain
            const tx = await this.challengeManagerContract.createChallenge(
                challengeType,
                creatorScore,
                gamePattern,
                message
            );
            
            console.log('📝 Challenge creation transaction submitted:', tx.hash);
            
            // Wait for confirmation
            const receipt = await tx.wait();
            console.log('✅ Challenge created successfully:', receipt);
            
            return {
                success: true,
                challengeId: receipt.logs[0].topics[1], // Extract challenge ID from event
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber
            };
            
        } catch (error) {
            console.error('❌ Failed to create challenge on blockchain:', error);
            throw error;
        }
    }
    
    /**
     * Accept a challenge
     */
    async acceptChallenge(challengeId) {
        try {
            if (!this.isInitialized || !this.challengeManagerContract) {
                throw new Error('Blockchain service not initialized or contracts not deployed');
            }
            
            console.log('✅ Accepting challenge:', challengeId);
            
            const tx = await this.challengeManagerContract.acceptChallenge(challengeId);
            const receipt = await tx.wait();
            
            return {
                success: true,
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber
            };
            
        } catch (error) {
            console.error('❌ Failed to accept challenge:', error);
            throw error;
        }
    }
    
    /**
     * Complete a challenge
     */
    async completeChallenge(challengeId, challengerScore) {
        try {
            if (!this.isInitialized || !this.challengeManagerContract) {
                throw new Error('Blockchain service not initialized or contracts not deployed');
            }
            
            console.log('🏁 Completing challenge:', { challengeId, challengerScore });
            
            const tx = await this.challengeManagerContract.completeChallenge(challengeId, challengerScore);
            const receipt = await tx.wait();
            
            return {
                success: true,
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber
            };
            
        } catch (error) {
            console.error('❌ Failed to complete challenge:', error);
            throw error;
        }
    }
    
    /**
     * Get challenge details
     */
    async getChallenge(challengeId) {
        try {
            if (!this.isInitialized || !this.challengeManagerContract) {
                throw new Error('Blockchain service not initialized or contracts not deployed');
            }
            
            const challenge = await this.challengeManagerContract.getChallenge(challengeId);
            
            return {
                id: challenge.id.toString(),
                creator: challenge.creator,
                challenger: challenge.challenger,
                challengeType: challenge.challengeType,
                entryFee: challenge.entryFee.toString(),
                creatorScore: challenge.creatorScore.toString(),
                challengerScore: challenge.challengerScore.toString(),
                creatorScoreTarget: challenge.creatorScoreTarget.toString(),
                gamePattern: challenge.gamePattern,
                message: challenge.message,
                status: challenge.status,
                createdAt: challenge.createdAt.toString(),
                expiresAt: challenge.expiresAt.toString(),
                completedAt: challenge.completedAt.toString(),
                winner: challenge.winner
            };
            
        } catch (error) {
            console.error('❌ Failed to get challenge details:', error);
            throw error;
        }
    }
    
    /**
     * Check if player can play (free game or unlimited pass)
     */
    async canPlay(playerAddress) {
        try {
            if (!this.isInitialized || !this.dailyLeaderboardContract) {
                throw new Error('Blockchain service not initialized or contracts not deployed');
            }
            
            return await this.dailyLeaderboardContract.canPlay(playerAddress);
            
        } catch (error) {
            console.error('❌ Failed to check if player can play:', error);
            return false;
        }
    }
    
    /**
     * Check if player has unlimited pass
     */
    async hasUnlimitedPass(playerAddress) {
        try {
            if (!this.isInitialized || !this.dailyLeaderboardContract) {
                throw new Error('Blockchain service not initialized or contracts not deployed');
            }
            
            return await this.dailyLeaderboardContract.hasUnlimitedPass(playerAddress);
            
        } catch (error) {
            console.error('❌ Failed to check unlimited pass:', error);
            return false;
        }
    }
    
    /**
     * Get current day from blockchain
     */
    async getCurrentDay() {
        try {
            if (!this.isInitialized || !this.dailyLeaderboardContract) {
                throw new Error('Blockchain service not initialized or contracts not deployed');
            }
            
            return await this.dailyLeaderboardContract.getCurrentDay();
            
        } catch (error) {
            console.error('❌ Failed to get current day from blockchain:', error);
            throw error;
        }
    }
    
    /**
     * Check if service is ready
     */
    isReady() {
        return this.isInitialized && 
               this.dailyLeaderboardContract && 
               this.challengeManagerContract;
    }
    
    /**
     * Get service status
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            hasProvider: !!this.provider,
            hasSigner: !!this.signer,
            hasDailyLeaderboard: !!this.dailyLeaderboardContract,
            hasChallengeManager: !!this.challengeManagerContract,
            isReady: this.isReady()
        };
    }
}

// Export singleton instance
export const blockchainLeaderboardService = new BlockchainLeaderboardService(); 