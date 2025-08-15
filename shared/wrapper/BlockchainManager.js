/**
 * BlockZone Lab - Blockchain Manager
 * Handles Sonic Labs integration, wallet connections, and smart contract interactions
 */

class BlockchainManager {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.isConnected = false;
        this.networkId = 12345; // Sonic Labs testnet
        this.networkName = 'Sonic Labs';
        this.contractAddresses = {};
        this.eventListeners = new Map();
        this.connectionInProgress = false; // Add connection lock
        this.connectionPromise = null; // Cache connection promise
    }

    /**
     * Initialize blockchain manager
     */
    async initialize() {
        // console.log('🔗 Blockchain initialization DISABLED for Phase 1 development');
        // console.log('💡 Blockchain features will be enabled in Phase 3');
        return false;
        
        // BLOCKCHAIN CODE COMMENTED OUT FOR PHASE 1
        /*
        // console.log('🔗 Initializing BlockchainManager...');
        
        // Check if Web3 wallet is available
        if (!window.ethereum) {
            // console.log('⚠️ No Web3 wallet detected - blockchain features disabled');
            return false;
        }
        
        // console.log('✅ Web3 wallet detected');
        
        // Try to connect to wallet (with connection lock)
        return await this.connectWallet();
        */
    }

    /**
     * Connect to MetaMask/Rabby wallet
     */
    async connectWallet() {
        // Prevent multiple simultaneous connection attempts
        if (this.connectionInProgress) {
            // console.log('🔗 Wallet connection already in progress, waiting...');
            return this.connectionPromise;
        }
        
        if (this.isConnected) {
            // console.log('✅ Wallet already connected');
            return true;
        }
        
        this.connectionInProgress = true;
        this.connectionPromise = this._performWalletConnection();
        
        try {
            const result = await this.connectionPromise;
            return result;
        } finally {
            this.connectionInProgress = false;
        }
    }
    
    async _performWalletConnection() {
        try {
            // console.log('🔗 Connecting to wallet...');
            
            // Check if already connected
            const accounts = await window.ethereum.request({
                method: 'eth_accounts' // Use eth_accounts instead of eth_requestAccounts to avoid popup
            });
            
            if (accounts.length === 0) {
                // Only request accounts if none are connected
                // console.log('🔗 Requesting account access...');
                await window.ethereum.request({
                    method: 'eth_requestAccounts'
                });
            }
            
            // Create provider and signer (ethers v6)
            this.provider = new ethers.BrowserProvider(window.ethereum);
            this.signer = await this.provider.getSigner();
            
            // Check network
            const network = await this.provider.getNetwork();
            if (network.chainId !== this.networkId) {
                // console.log('⚠️ Wrong network detected, requesting switch...');
                await this.switchToSonicLabs();
            }
            
            // Listen for account changes
            window.ethereum.on('accountsChanged', (accounts) => {
                // console.log('👤 Account changed:', accounts[0]);
                this.emit('accountChanged', accounts[0]);
            });
            
            // Listen for network changes
            window.ethereum.on('chainChanged', (chainId) => {
                // console.log('🌐 Network changed:', chainId);
                this.emit('networkChanged', chainId);
            });
            
            this.isConnected = true;
            // console.log('✅ Wallet connected successfully');
            
            return true;
        } catch (error) {
            console.error('❌ Wallet connection failed:', error);
            this.isConnected = false;
            return false;
        }
    }
    
    /**
     * Switch to Sonic Labs network
     */
    async switchToSonicLabs() {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${this.networkId.toString(16)}` }]
            });
            // console.log('✅ Switched to Sonic Labs network');
        } catch (error) {
            // console.log('⚠️ Network switch failed, adding Sonic Labs...');
            await this.addSonicLabsNetwork();
        }
    }
    
    /**
     * Add Sonic Labs network to wallet
     */
    async addSonicLabsNetwork() {
        try {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: `0x${this.networkId.toString(16)}`,
                    chainName: 'Sonic Labs',
                    nativeCurrency: {
                        name: 'ETH',
                        symbol: 'ETH',
                        decimals: 18
                    },
                    rpcUrls: ['https://rpc.soniclabs.com'],
                    blockExplorerUrls: ['https://explorer.soniclabs.com']
                }]
            });
            // console.log('✅ Sonic Labs network added');
        } catch (error) {
            console.error('❌ Failed to add Sonic Labs network:', error);
        }
    }
    
    /**
     * Get current account address
     */
    async getAccount() {
        if (!this.signer) return null;
        return await this.signer.getAddress();
    }
    
    /**
     * Get account balance
     */
    async getBalance() {
        if (!this.signer) return '0';
        const address = await this.signer.getAddress();
        const balance = await this.provider.getBalance(address);
        return ethers.formatEther(balance);
    }
    
    /**
     * Set contract addresses (called after deployment)
     */
    setContractAddresses(addresses) {
        this.contractAddresses = { ...this.contractAddresses, ...addresses };
        // console.log('📋 Contract addresses updated:', this.contractAddresses);
    }
    
    /**
     * Initialize contract instances
     */
    async initializeContracts() {
        if (!this.signer) {
            // console.log('⚠️ No signer available for contract initialization');
            return false;
        }
        
        try {
            // Initialize contract instances here when ABIs are ready
            // console.log('📋 Contract instances ready');
            return true;
        } catch (error) {
            console.error('❌ Contract initialization failed:', error);
            return false;
        }
    }
    
    /**
     * Check if player can play (free game or paid)
     */
    async canPlayerPlay(playerId) {
        // This will interact with DailyLeaderboard contract
        // For now, return true (free play mode)
        return { canPlay: true, reason: 'free_play' };
    }
    
    /**
     * Submit score to blockchain
     */
    async submitScore(playerId, score, displayName) {
        // This will interact with DailyLeaderboard contract
        // For now, just log the submission
        // console.log('📊 Score submission to blockchain:', { playerId, score, displayName });
        return { success: true, transactionHash: 'pending' };
    }
    
    /**
     * Process payment for game entry
     */
    async processPayment(amount, paymentType) {
        // This will interact with PaymentProcessor contract
        // console.log('💳 Payment processing:', { amount, paymentType });
        return { success: true, transactionHash: 'pending' };
    }
    
    /**
     * Event system for blockchain events
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }
    
    emit(event, data) {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            listeners.forEach(callback => callback(data));
        }
    }
    
    /**
     * Disconnect wallet
     */
    disconnect() {
        this.provider = null;
        this.signer = null;
        this.isConnected = false;
        // console.log('🔌 Wallet disconnected');
    }
    
    /**
     * Get connection status
     */
    getStatus() {
        return {
            isConnected: this.isConnected,
            networkId: this.networkId,
            networkName: this.networkName,
            hasProvider: !!this.provider,
            hasSigner: !!this.signer
        };
    }
}

// Export for use in other modules
export { BlockchainManager }; 
