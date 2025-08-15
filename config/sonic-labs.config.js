/**
 * Sonic Labs Configuration
 * 
 * Configuration settings for the Sonic Labs integration.
 */

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const config = {
    // API Configuration
    api: {
        // Base URL for Sonic Labs API
        baseUrl: process.env.SONIC_LABS_API_URL || 'https://api.soniclabs.xyz',
        
        // API key for authentication (keep this secure!)
        apiKey: process.env.SONIC_LABS_API_KEY || '',
        
        // Request timeout in milliseconds
        timeout: parseInt(process.env.SONIC_LABS_TIMEOUT || '10000'),
        
        // Maximum retries for failed requests
        maxRetries: parseInt(process.env.SONIC_LABS_MAX_RETRIES || '3'),
        
        // Retry delay in milliseconds
        retryDelay: parseInt(process.env.SONIC_LABS_RETRY_DELAY || '1000')
    },
    
    // Blockchain Network Configuration
    network: {
        // Supported networks: 'ethereum', 'polygon', 'arbitrum', 'optimism', 'sonic-testnet'
        defaultNetwork: process.env.BLOCKCHAIN_NETWORK || 'sonic-testnet',
        
        // USDC token contract addresses by network
        usdcTokenAddresses: {
            // Mainnet addresses
            ethereum: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            polygon: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
            arbitrum: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
            optimism: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
            // Testnet addresses
            'sonic-testnet': '0x0FA8781a83E46826621b3BC094Ea2A0212e71B23' // Example testnet USDC
        },
        
        // RPC endpoints for different networks
        rpcUrls: {
            ethereum: 'https://mainnet.infura.io/v3/YOUR-INFURA-KEY',
            polygon: 'https://polygon-rpc.com',
            arbitrum: 'https://arb1.arbitrum.io/rpc',
            optimism: 'https://mainnet.optimism.io',
            'sonic-testnet': 'https://testnet.sonic.network/rpc' // Sonic testnet RPC
        },
        
        // Chain IDs for different networks
        chainIds: {
            ethereum: 1,
            polygon: 137,
            arbitrum: 42161,
            optimism: 10,
            'sonic-testnet': 12345 // Example Sonic testnet chain ID
        },
        
        // Block explorers
        explorers: {
            'sonic-testnet': 'https://testnet.sonicscan.io'
        }
    },
    
    // Payment Configuration
    payments: {
        // Default payment expiration time in minutes
        paymentExpiryMinutes: parseInt(process.env.PAYMENT_EXPIRY_MINUTES || '30'),
        
        // Minimum payment amount in USDC (e.g., 1.00 for $1.00)
        minPaymentAmount: parseFloat(process.env.MIN_PAYMENT_AMOUNT || '1.00'),
        
        // Maximum payment amount in USDC
        maxPaymentAmount: parseFloat(process.env.MAX_PAYMENT_AMOUNT || '10000.00'),
        
        // Default payment description
        defaultDescription: 'BlockZone Lab Payment'
    },
    
    // Payout Configuration
    payouts: {
        // Minimum payout amount in USDC
        minPayoutAmount: parseFloat(process.env.MIN_PAYOUT_AMOUNT || '5.00'),
        
        // Maximum payout amount in USDC
        maxPayoutAmount: parseFloat(process.env.MAX_PAYOUT_AMOUNT || '10000.00'),
        
        // Payout fee percentage (e.g., 1.5 for 1.5%)
        feePercentage: parseFloat(process.env.PAYOUT_FEE_PERCENTAGE || '1.5'),
        
        // Minimum fee amount in USDC
        minFeeAmount: parseFloat(process.env.MIN_FEE_AMOUNT || '0.50'),
        
        // Maximum fee amount in USDC
        maxFeeAmount: parseFloat(process.env.MAX_FEE_AMOUNT || '100.00'),
        
        // Default payout description
        defaultDescription: 'BlockZone Lab Payout'
    },
    
    // Webhook Configuration
    webhooks: {
        // Webhook URL for payment callbacks
        paymentCallbackUrl: process.env.PAYMENT_CALLBACK_URL || '',
        
        // Webhook secret for verifying callbacks
        webhookSecret: process.env.WEBHOOK_SECRET || '',
        
        // Maximum age of webhook events in milliseconds
        maxEventAge: 5 * 60 * 1000 // 5 minutes
    },
    
    // Logging Configuration
    logging: {
        // Enable/disable request/response logging
        enabled: process.env.LOGGING_ENABLED !== 'false',
        
        // Log level: 'error', 'warn', 'info', 'debug', 'trace'
        level: process.env.LOG_LEVEL || 'info',
        
        // Log file path (leave empty for console only)
        filePath: process.env.LOG_FILE_PATH || ''
    },
    
    // Feature Flags
    features: {
        // Enable/disable test mode (uses testnet)
        testMode: process.env.TEST_MODE === 'true',
        
        // Enable/disable payment processing
        paymentsEnabled: process.env.PAYMENTS_ENABLED !== 'false',
        
        // Enable/disable payouts
        payoutsEnabled: process.env.PAYOUTS_ENABLED !== 'false',
        
        // Enable/disable webhook verification
        webhookVerification: process.env.WEBHOOK_VERIFICATION !== 'false'
    },
    
    // Get the USDC token address for the configured network
    getUsdcTokenAddress: function() {
        return this.network.usdcTokenAddresses[this.network.defaultNetwork] || 
               this.network.usdcTokenAddresses.polygon;
    },
    
    // Get the chain ID for the configured network
    getChainId: function() {
        return this.network.chainIds[this.network.defaultNetwork] || 137; // Default to Polygon
    },
    
    // Validate the configuration
    validate: function() {
        const errors = [];
        
        if (!this.api.apiKey) {
            errors.push('SONIC_LABS_API_KEY is required');
        }
        
        if (!this.network.usdcTokenAddresses[this.network.defaultNetwork]) {
            errors.push(`Unsupported network: ${this.network.defaultNetwork}`);
        }
        
        if (this.webhooks.paymentCallbackUrl && !this.webhooks.webhookSecret) {
            errors.push('WEBHOOK_SECRET is required when using payment callbacks');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors.length > 0 ? errors : null
        };
    }
};

// Validate the configuration
const validation = config.validate();
if (!validation.isValid) {
    console.error('Invalid Sonic Labs configuration:');
    console.error(validation.errors.join('\n'));
    process.exit(1);
}

export default config;
