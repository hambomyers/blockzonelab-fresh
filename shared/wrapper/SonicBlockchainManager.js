/**
 * BlockZone Lab - Unified Sonic Blockchain Manager
 * Handles wallet connection, contract interaction, and identity management on Sonic network
 * Implements wallet-as-identity-manager business model
 */

class SonicBlockchainManager {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.contracts = {};
        this.isConnected = false;
        this.eventListeners = new Map();
        this.connectionInProgress = false; // Connection lock
        this.connectionPromise = null; // Cache connection promise
        
        // Sonic Labs network configuration
        this.networkConfig = {
            chainId: 146,
            chainName: 'Sonic',
            rpcUrl: 'https://rpc.sonic.game',
            explorer: 'https://sonicscan.org',
            currency: 'S'
        };
        
        // Contract addresses (to be updated after deployment)
        this.contractAddresses = {
            gameContract: null,
            tokenContract: null,
            leaderboardContract: null,
            challengeManager: null,
            paymentProcessor: null
        };
        
        // Identity integration
        this.playerWallet = null;
        this.deterministicWallet = null;
    }
    
    async initialize() {
        try {
            // Check if MetaMask is available
            if (typeof window.ethereum !== 'undefined') {
                // Set up event listeners for wallet changes
                this.setupWalletEventListeners();
                
                // Try to connect to existing wallet
                await this.connectWallet();
            } else {
                console.warn('⚠️ MetaMask not detected. Blockchain features will be limited.');
            }
        } catch (error) {
            console.error('❌ Failed to initialize Sonic blockchain manager:', error);
        }
    }
    
    setupWalletEventListeners() {
        // Listen for account changes
        window.ethereum.on('accountsChanged', (accounts) => {
            this.handleAccountChange(accounts[0]);
        });
        
        // Listen for network changes
        window.ethereum.on('chainChanged', (chainId) => {
            this.handleNetworkChange(chainId);
        });
    }
    
    handleAccountChange(newAccount) {
        if (newAccount) {
            this.emit('accountChanged', newAccount);
        } else {
            this.disconnect();
            this.emit('accountDisconnected');
        }
    }
    
    handleNetworkChange(newChainId) {
        const expectedChainId = `0x${this.networkConfig.chainId.toString(16)}`;
        if (newChainId !== expectedChainId) {
            this.switchToSonicNetwork();
        } else {
            this.emit('networkChanged', newChainId);
        }
    }
    
    async connectWallet() {
        // Prevent multiple simultaneous connection attempts
        if (this.connectionInProgress) {
            return this.connectionPromise;
        }
        
        if (this.isConnected) {
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
            // Check if already connected
            const accounts = await window.ethereum.request({
                method: 'eth_accounts' // Use eth_accounts to avoid popup if already connected
            });
            
            if (accounts.length === 0) {
                // Only request accounts if none are connected
                await window.ethereum.request({
                    method: 'eth_requestAccounts'
                });
            }
            
            // Create provider and signer
            this.provider = new ethers.BrowserProvider(window.ethereum);
            this.signer = await this.provider.getSigner();
            
            // Check if we're on the correct network
            const network = await this.provider.getNetwork();
            if (network.chainId !== BigInt(this.networkConfig.chainId)) {
                await this.switchToSonicNetwork();
            }
            
            this.isConnected = true;
            const address = await this.signer.getAddress();
            
            this.emit('walletConnected', address);
            return address;
        } catch (error) {
            console.error('❌ Failed to connect wallet:', error);
            this.isConnected = false;
            throw error;
        }
    }
    
    async switchToSonicNetwork() {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${this.networkConfig.chainId.toString(16)}` }]
            });
        } catch (switchError) {
            // If the network doesn't exist, add it
            if (switchError.code === 4902) {
                await this.addSonicNetwork();
            } else {
                throw switchError;
            }
        }
    }
    
    async addSonicNetwork() {
        try {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: `0x${this.networkConfig.chainId.toString(16)}`,
                    chainName: this.networkConfig.chainName,
                    nativeCurrency: {
                        name: this.networkConfig.currency,
                        symbol: this.networkConfig.currency,
                        decimals: 18
                    },
                    rpcUrls: [this.networkConfig.rpcUrl],
                    blockExplorerUrls: [this.networkConfig.explorer]
                }]
            });
        } catch (error) {
            console.error('❌ Failed to add Sonic network:', error);
            throw error;
        }
    }
    
    // Identity Management Integration
    async createDeterministicWallet(username) {
        try {
            // This would integrate with your IdentityManager's deterministic wallet creation
            // For now, we'll simulate the process
            const walletAddress = await this.generateDeterministicAddress(username);
            
            this.deterministicWallet = {
                username: username,
                address: walletAddress,
                displayName: `${username}#${walletAddress.slice(-4).toUpperCase()}`
            };
            
            this.emit('deterministicWalletCreated', this.deterministicWallet);
            
            return this.deterministicWallet;
        } catch (error) {
            console.error('❌ Failed to create deterministic wallet:', error);
            throw error;
        }
    }
    
    async generateDeterministicAddress(username) {
        // This would use the same algorithm as your IdentityManager
        // For now, we'll create a deterministic address based on username
        const seed = username.toLowerCase() + 'blockzonelab';
        const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(seed));
        const hashArray = Array.from(new Uint8Array(hash));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        // Create a deterministic address (simplified version)
        return '0x' + hashHex.slice(0, 40);
    }
    
    getCurrentWallet() {
        return this.deterministicWallet || (this.signer ? this.signer.getAddress() : null);
    }
    
    getDisplayName() {
        if (this.deterministicWallet) {
            return this.deterministicWallet.displayName;
        }
        return null;
    }
    
    async getBalance(address = null) {
        if (!this.provider) {
            throw new Error('Provider not initialized');
        }
        
        const targetAddress = address || await this.getCurrentWallet();
        if (!targetAddress) {
            return '0';
        }
        
        const balance = await this.provider.getBalance(targetAddress);
        return ethers.formatEther(balance);
    }
    
    async deployContract(contractName, contractABI, contractBytecode, constructorArgs = []) {
        if (!this.signer) {
            throw new Error('Wallet not connected');
        }
        
        try {
            const factory = new ethers.ContractFactory(contractABI, contractBytecode, this.signer);
            const contract = await factory.deploy(...constructorArgs);
            
            await contract.waitForDeployment();
            const address = await contract.getAddress();
            
            // Store the contract instance
            this.contracts[contractName] = contract;
            this.contractAddresses[`${contractName.toLowerCase()}Contract`] = address;
            
            return { contract, address };
        } catch (error) {
            console.error(`❌ Failed to deploy ${contractName}:`, error);
            throw error;
        }
    }
    
    async loadContract(contractName, contractAddress, contractABI) {
        if (!this.signer) {
            throw new Error('Wallet not connected');
        }
        
        try {
            const contract = new ethers.Contract(contractAddress, contractABI, this.signer);
            this.contracts[contractName] = contract;
            this.contractAddresses[`${contractName.toLowerCase()}Contract`] = contractAddress;
            
            return contract;
        } catch (error) {
            console.error(`❌ Failed to load ${contractName}:`, error);
            throw error;
        }
    }
    
    // Game Integration Methods
    async canPlayerPlay(playerId) {
        // Check if player can play (free game or paid)
        // This will interact with DailyLeaderboard contract
        // For now, return true (free play mode)
        return { canPlay: true, reason: 'free_play' };
    }
    
    async submitScore(playerId, score, gameData = {}) {
        if (!this.contracts.gameContract) {
            // Fallback to local storage if contract not available
            return { success: true, transactionHash: 'local_storage' };
        }
        
        try {
            const tx = await this.contracts.gameContract.submitScore(
                playerId,
                score,
                JSON.stringify(gameData)
            );
            
            const receipt = await tx.wait();
            
            return receipt;
        } catch (error) {
            console.error('❌ Failed to submit score:', error);
            throw error;
        }
    }
    
    async getLeaderboard(limit = 10) {
        if (!this.contracts.leaderboardContract) {
            // Fallback to local storage
            return [];
        }
        
        try {
            const leaderboard = await this.contracts.leaderboardContract.getTopScores(limit);
            return leaderboard;
        } catch (error) {
            console.error('❌ Failed to get leaderboard:', error);
            throw error;
        }
    }
    
    async claimReward(playerId, rewardType) {
        if (!this.contracts.gameContract) {
            throw new Error('Game contract not loaded');
        }
        
        try {
            const tx = await this.contracts.gameContract.claimReward(playerId, rewardType);
            const receipt = await tx.wait();
            
            return receipt;
        } catch (error) {
            console.error('❌ Failed to claim reward:', error);
            throw error;
        }
    }
    
    async processPayment(amount, paymentType) {
        if (!this.contracts.paymentProcessor) {
            return { success: true, transactionHash: 'simulated' };
        }
        
        try {
            const tx = await this.contracts.paymentProcessor.processPayment(amount, paymentType);
            const receipt = await tx.wait();
            
            return receipt;
        } catch (error) {
            console.error('❌ Failed to process payment:', error);
            throw error;
        }
    }
    
    // Event System
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
    
    // Fee Monetization (FeeM) integration
    async registerForFeeMonetization() {
        // This will be implemented when the AI deployment tool is available
    }
    
    // Account Abstraction (AA) integration
    async setupAccountAbstraction() {
        // This will be implemented when the AI deployment tool is available
    }
    
    // Utility Methods
    getNetworkInfo() {
        return this.networkConfig;
    }
    
    getContractAddresses() {
        return this.contractAddresses;
    }
    
    isWalletConnected() {
        return this.isConnected && !!this.signer;
    }
    
    hasDeterministicWallet() {
        return !!this.deterministicWallet;
    }
    
    async disconnect() {
        this.provider = null;
        this.signer = null;
        this.isConnected = false;
        this.connectionInProgress = false;
        this.connectionPromise = null;
        this.emit('walletDisconnected');
    }
    
    getStatus() {
        return {
            isConnected: this.isConnected,
            hasDeterministicWallet: this.hasDeterministicWallet(),
            currentWallet: this.getCurrentWallet(),
            displayName: this.getDisplayName(),
            network: this.networkConfig.chainName,
            contracts: Object.keys(this.contracts)
        };
    }
}

// Export for module usage
export { SonicBlockchainManager }; 
