/**
 * SonicLabsService.js - Sonic Labs Network Integration
 * Handles all Sonic Labs blockchain interactions
 */

import { ethers } from 'ethers';
import { ApiError } from '../utils/errors.js';
import { paymentsStore } from '../core/KVStoreAdapter.js';

class SonicLabsService {
    constructor() {
        this.apiKey = process.env.SONIC_LABS_API_KEY;
        this.baseUrl = process.env.SONIC_LABS_API_URL || 'https://api.soniclabs.xyz';
        this.network = process.env.BLOCKCHAIN_NETWORK || 'sonic-testnet';
        this.rpcUrl = this.getRpcUrl();
        this.chainId = this.getChainId();
        this.usdcTokenAddress = this.getUsdcTokenAddress();
        this.provider = null;
        this.isConnected = false;
        
        // console.log('🔗 SonicLabsService initialized:', {
            network: this.network,
            rpcUrl: this.rpcUrl,
            chainId: this.chainId,
            hasApiKey: !!this.apiKey
        });
    }

    /**
     * Get the RPC URL for the configured network
     * @private
     */
    getRpcUrl() {
        const rpcUrls = {
            'ethereum': 'https://mainnet.infura.io/v3/YOUR-INFURA-KEY',
            'polygon': 'https://polygon-rpc.com',
            'arbitrum': 'https://arb1.arbitrum.io/rpc',
            'optimism': 'https://mainnet.optimism.io',
            'sonic-testnet': process.env.SONIC_TESTNET_RPC_URL || 'https://rpc.testnet.soniclabs.com',
            'sonic-mainnet': process.env.SONIC_MAINNET_RPC_URL || 'https://rpc.soniclabs.com'
        };
        
        return rpcUrls[this.network] || rpcUrls['sonic-testnet'];
    }

    /**
     * Get the chain ID for the configured network
     * @private
     */
    getChainId() {
        const chainIds = {
            'ethereum': 1,
            'polygon': 137,
            'arbitrum': 42161,
            'optimism': 10,
            'sonic-testnet': parseInt(process.env.SONIC_TESTNET_CHAIN_ID) || 64165,
            'sonic-mainnet': parseInt(process.env.SONIC_MAINNET_CHAIN_ID) || 146
        };
        
        return chainIds[this.network] || chainIds['sonic-testnet'];
    }

    /**
     * Get the USDC token address for the configured network
     * @private
     */
    getUsdcTokenAddress() {
        const addresses = {
            'ethereum': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            'polygon': '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
            'arbitrum': '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
            'optimism': '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
            'sonic-testnet': process.env.USDC_TOKEN_ADDRESS_TESTNET || '0x0FA8781a83E46826621b3BC094Ea2A0212e71B23',
            'sonic-mainnet': process.env.USDC_TOKEN_ADDRESS_MAINNET || 'TBD_WHEN_MAINNET_LAUNCHES'
        };
        
        return addresses[this.network] || addresses['sonic-testnet'];
    }

    /**
     * Make an authenticated request to the Sonic Labs API
     * @private
     */
    async makeRequest(endpoint, method = 'GET', data = null) {
        if (!this.apiKey) {
            throw new Error('Sonic Labs API key not configured');
        }

        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            'X-Network': this.network
        };

        const config = {
            method,
            headers,
            body: data ? JSON.stringify(data) : undefined
        };

        try {
            const response = await fetch(url, config);
            const result = await response.json();

            if (!response.ok) {
                throw new ApiError(
                    response.status, 
                    result.message || 'Sonic Labs API request failed',
                    true
                );
            }

            return result;
        } catch (error) {
            console.error('Sonic Labs API error:', error);
            throw new ApiError(
                error.status || 500,
                error.message || 'Failed to communicate with Sonic Labs',
                true
            );
        }
    }

    /**
     * Test Sonic Labs network connection - PRODUCTION GRADE
     * This is what 10X Web3 platforms do!
     */
    async testConnection() {
        // console.log('🔗 Testing Sonic Labs network connection...');
        
        const results = {
            rpcConnection: false,
            chainId: null,
            blockNumber: null,
            gasPrice: null,
            usdcContract: false,
            apiConnection: false,
            overallStatus: 'FAILED'
        };
        
        try {
            // Test 1: RPC Connection
            // console.log('📡 Testing RPC connection to:', this.rpcUrl);
            this.provider = new ethers.providers.JsonRpcProvider(this.rpcUrl);
            
            // Test 2: Chain ID verification
            const networkChainId = await this.provider.getNetwork();
            results.chainId = networkChainId.chainId;
            // console.log('🔗 Chain ID:', results.chainId, '(Expected:', this.chainId, ')');
            
            if (results.chainId === this.chainId) {
                results.rpcConnection = true;
                // console.log('✅ RPC connection successful');
            } else {
                console.warn('⚠️ Chain ID mismatch - check network configuration');
            }
            
            // Test 3: Latest block number
            results.blockNumber = await this.provider.getBlockNumber();
            // console.log('📦 Latest block number:', results.blockNumber);
            
            // Test 4: Gas price
            results.gasPrice = await this.provider.getGasPrice();
            // console.log('⛽ Current gas price:', ethers.utils.formatUnits(results.gasPrice, 'gwei'), 'gwei');
            
            // Test 5: USDC contract verification
            if (this.usdcTokenAddress && this.usdcTokenAddress !== 'TBD_WHEN_MAINNET_LAUNCHES') {
                try {
                    const usdcContract = new ethers.Contract(
                        this.usdcTokenAddress,
                        ['function name() view returns (string)', 'function symbol() view returns (string)'],
                        this.provider
                    );
                    
                    const tokenName = await usdcContract.name();
                    const tokenSymbol = await usdcContract.symbol();
                    // console.log('💰 USDC Contract:', tokenName, '(' + tokenSymbol + ')', 'at', this.usdcTokenAddress);
                    results.usdcContract = true;
                } catch (contractError) {
                    console.warn('⚠️ USDC contract test failed:', contractError.message);
                }
            }
            
            // Test 6: API Connection (if API key provided)
            if (this.apiKey) {
                try {
                    // Test a simple API endpoint
                    await this.makeRequest('/health');
                    results.apiConnection = true;
                    // console.log('✅ Sonic Labs API connection successful');
                } catch (apiError) {
                    console.warn('⚠️ Sonic Labs API test failed:', apiError.message);
                }
            } else {
                // console.log('ℹ️ No API key provided - skipping API test');
            }
            
            // Overall status assessment
            if (results.rpcConnection && results.blockNumber > 0) {
                results.overallStatus = 'CONNECTED';
                this.isConnected = true;
                // console.log('🎉 Sonic Labs connection test: SUCCESS');
            } else {
                results.overallStatus = 'PARTIAL';
                // console.log('⚠️ Sonic Labs connection test: PARTIAL SUCCESS');
            }
            
        } catch (error) {
            console.error('❌ Sonic Labs connection test failed:', error);
            results.overallStatus = 'FAILED';
            this.isConnected = false;
        }
        
        // Professional reporting
        // console.log('📊 Sonic Labs Connection Test Results:', {
            network: this.network,
            rpcUrl: this.rpcUrl,
            chainId: results.chainId,
            expectedChainId: this.chainId,
            blockNumber: results.blockNumber,
            gasPrice: results.gasPrice ? ethers.utils.formatUnits(results.gasPrice, 'gwei') + ' gwei' : 'N/A',
            usdcContract: results.usdcContract ? '✅' : '❌',
            apiConnection: results.apiConnection ? '✅' : '❌',
            overallStatus: results.overallStatus
        });
        
        return results;
    }

    /**
     * Initialize and test connection - call this on startup
     */
    async initialize() {
        // console.log('🚀 Initializing SonicLabsService for BlockZone Lab...');
        
        const connectionResults = await this.testConnection();
        
        if (connectionResults.overallStatus === 'FAILED') {
            throw new Error('Failed to connect to Sonic Labs network. Check your configuration.');
        }
        
        // console.log('✅ SonicLabsService initialized successfully');
        return connectionResults;
    }

    /**
     * Create a payment request for USDC.E
     * @param {string} playerId - The ID of the player making the payment
     * @param {string} walletAddress - The player's wallet address
     * @param {number} amount - The amount in USDC.E (e.g., 5.00 for $5.00)
     * @param {string} description - Description of the payment
     * @returns {Promise<Object>} Payment request details
     */
    async createPaymentRequest(playerId, walletAddress, amount, description) {
        if (!playerId || !walletAddress || !amount || amount <= 0) {
            throw new ApiError(400, 'Invalid payment request parameters', true);
        }

        const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
        const amountInWei = Math.floor(amount * 10**6); // USDC has 6 decimals

        const paymentRequest = {
            paymentId,
            playerId,
            walletAddress,
            amount: amountInWei,
            currency: 'USDC',
            description,
            tokenAddress: this.usdcTokenAddress,
            metadata: {
                network: this.network,
                createdAt: new Date().toISOString()
            }
        };

        // In a real implementation, this would call the Sonic Labs API
        // For now, we'll simulate the response
        const response = {
            id: paymentId,
            status: 'pending',
            paymentUrl: `https://pay.soniclabs.xyz/pay/${paymentId}`,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
            ...paymentRequest
        };

        // Store the payment request
        await paymentsStore.set(paymentId, response);

        return response;
    }

    /**
     * Process a payment callback from Sonic Labs
     * @param {Object} payload - The callback payload from Sonic Labs
     * @returns {Promise<Object>} The updated payment record
     */
    async handlePaymentCallback(payload) {
        const { paymentId, status, transactionHash } = payload;

        if (!paymentId) {
            throw new ApiError(400, 'Missing payment ID in callback', true);
        }

        // Get the payment record
        const payment = await paymentsStore.get(paymentId);
        if (!payment) {
            throw new ApiError(404, 'Payment not found', true);
        }

        // Update payment status
        const updatedPayment = {
            ...payment,
            status: status || 'completed',
            transactionHash: transactionHash || payment.transactionHash,
            updatedAt: new Date().toISOString(),
            metadata: {
                ...payment.metadata,
                processedAt: new Date().toISOString()
            }
        };

        // Save the updated payment record
        await paymentsStore.set(paymentId, updatedPayment);

        // In a real implementation, you would also update the player's balance
        // and trigger any associated game logic here

        return updatedPayment;
    }

    /**
     * Initiate a USDC.E payout to a player's wallet
     * @param {string} playerId - The ID of the player receiving the payout
     * @param {string} walletAddress - The recipient's wallet address
     * @param {number} amount - The amount in USDC.E (e.g., 10.50 for $10.50)
     * @param {string} description - Description of the payout
     * @returns {Promise<Object>} Payout details
     */
    async initiatePayout(playerId, walletAddress, amount, description) {
        if (!playerId || !walletAddress || !amount || amount <= 0) {
            throw new ApiError(400, 'Invalid payout parameters', true);
        }

        const payoutId = `payout_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
        const amountInWei = Math.floor(amount * 10**6); // USDC has 6 decimals

        const payoutRequest = {
            payoutId,
            playerId,
            walletAddress,
            amount: amountInWei,
            currency: 'USDC',
            description,
            tokenAddress: this.usdcTokenAddress,
            status: 'pending',
            metadata: {
                network: this.network,
                initiatedAt: new Date().toISOString()
            }
        };

        // In a real implementation, this would call the Sonic Labs API
        // For now, we'll simulate the response
        const response = {
            ...payoutRequest,
            status: 'processing',
            transactionHash: `0x${Date.now().toString(16)}${Math.random().toString(36).substr(2, 8)}`,
            submittedAt: new Date().toISOString()
        };

        // Store the payout request
        await paymentsStore.set(payoutId, response);

        return response;
    }

    /**
     * Get the status of a payment or payout
     * @param {string} transactionId - The payment or payout ID
     * @returns {Promise<Object>} The transaction status
     */
    async getTransactionStatus(transactionId) {
        if (!transactionId) {
            throw new ApiError(400, 'Transaction ID is required', true);
        }

        // In a real implementation, this would query the Sonic Labs API
        // For now, we'll return the stored payment/payout record
        const transaction = await paymentsStore.get(transactionId);
        
        if (!transaction) {
            throw new ApiError(404, 'Transaction not found', true);
        }

        return transaction;
    }

    /**
     * Get the current USDC.E balance for the platform
     * @returns {Promise<Object>} Balance information
     */
    async getPlatformBalance() {
        // In a real implementation, this would query the Sonic Labs API
        // For now, we'll return a mock response
        return {
            balance: 10000, // 10,000 USDC.E
            currency: 'USDC',
            lastUpdated: new Date().toISOString(),
            network: this.network
        };
    }
}

// Create and export a singleton instance
const sonicLabsService = new SonicLabsService();
export default sonicLabsService;
