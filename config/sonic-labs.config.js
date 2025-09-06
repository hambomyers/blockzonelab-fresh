/**
 * Sonic Labs Configuration
 * 
 * Configuration settings for the Sonic Labs integration.
 * Browser-compatible version without Node.js dependencies.
 */

const config = {
    // API Configuration
    api: {
        // Base URL for Sonic Labs API
        baseUrl: 'https://api.soniclabs.xyz',
        
        // API key for authentication (will be set at runtime)
        apiKey: '',
        
        // Request timeout in milliseconds
        timeout: 10000,
        
        // Maximum retries for failed requests
        maxRetries: 3,
        
        // Retry delay in milliseconds
        retryDelay: 1000
    },
    
    // Blockchain Network Configuration
    network: {
        // Supported networks: 'ethereum', 'polygon', 'arbitrum', 'optimism', 'sonic-testnet'
        defaultNetwork: 'sonic-testnet',
        
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
        paymentExpiryMinutes: 30,
        
        // Minimum payment amount in USDC (e.g., 1.00 for $1.00)
        minPaymentAmount: 1.00,
        
        // Maximum payment amount in USDC
        maxPaymentAmount: 10000.00,
        
        // Default payment description
        defaultDescription: 'BlockZone Lab Payment'
    },
    
    // Payout Configuration
    payouts: {
        // Minimum payout amount in USDC
        minPayoutAmount: 5.00,
        
        // Maximum payout amount in USDC
        maxPayoutAmount: 10000.00,
        
        // Payout fee percentage (e.g., 1.5 for 1.5%)
        feePercentage: 1.5,
        
        // Minimum fee amount in USDC
        minFeeAmount: 0.50,
        
        // Maximum fee amount in USDC
        maxFeeAmount: 100.00,
        
        // Default payout description
        defaultDescription: 'BlockZone Lab Payout'
    },
    
    // Webhook Configuration
    webhooks: {
        // Webhook URL for payment callbacks
        paymentCallbackUrl: '',
        
        // Webhook secret for verifying callbacks
        webhookSecret: '',
        
        // Maximum age of webhook events in milliseconds
        maxEventAge: 5 * 60 * 1000 // 5 minutes
    },
    
    // Logging Configuration
    logging: {
        // Enable/disable request/response logging
        enabled: true,
        
        // Log level: 'error', 'warn', 'info', 'debug', 'trace'
        level: 'info',
        
        // Log file path (leave empty for console only)
        filePath: ''
    },
    
    // Feature Flags
    features: {
        // Enable/disable test mode (uses testnet)
        testMode: true,
        
        // Enable/disable payment processing
        paymentsEnabled: true,
        
        // Enable/disable payouts
        payoutsEnabled: true,
        
        // Enable/disable webhook verification
        webhookVerification: false
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
        
        if (!this.api.apiKey && !this.features.testMode) {
            errors.push('SONIC_LABS_API_KEY is required for production mode');
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

// Create a Config class for compatibility with the game
export class Config {
    constructor() {
        Object.assign(this, config);
        
        // Add game constants for NeonDrop compatibility
        this.CONSTANTS = {
            BOARD: {
                WIDTH: 10,
                HEIGHT: 20,
                BLOCK_SIZE: 30
            },
            GAME: {
                FALL_SPEED: 500,
                LOCK_DELAY: 500,
                LINE_CLEAR_DELAY: 300
            },
            COLORS: {
                I: '#00FFFF', // Cyan
                O: '#FFFF00', // Yellow
                T: '#800080', // Purple
                S: '#00FF00', // Green
                Z: '#FF0000', // Red
                J: '#0000FF', // Blue
                L: '#FFA500'  // Orange
            }
        };
    }
}

export default config;
