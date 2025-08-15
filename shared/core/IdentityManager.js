/**
 * IdentityManager.js - Clean Backend-First Identity System v3.0
 * 
 * Prevents duplicate wallets by checking backend first using device fingerprinting.
 * One device fingerprint = One wallet address forever.
 * 
 * Architecture: Backend-First → Local Cache → Real Sonic Wallets
 */

// Use global ethers instead of CDN import
// import { ethers } from 'https://cdn.skypack.dev/ethers@5.7.2';

// Global singleton instance
let globalIdentityManager = null;

export class IdentityManager {
    constructor() {
        // Singleton pattern - only create one instance
        if (globalIdentityManager) {
            return globalIdentityManager;
        }
        
        this.player = null;
        this.isInitialized = false;
        this.fingerprintCache = null;
        this.storageKey = 'blockzone_player_v3';
        this.apiBase = 'https://api.blockzonelab.com';
        
        // Only log once when first instance is created
        // // console.log('🔐 Clean Identity System v3.0 - Backend-First Architecture'); // Removed for production performance
        
        // Store global instance
        globalIdentityManager = this;
    }

    /**
     * Initialize the identity system - Backend-First Approach
     * Prevents duplicate wallets by checking backend first using device fingerprinting
     */
    async initialize() {
        if (this.isInitialized) return this.player;
        
        // // console.log('🚀 Starting backend-first identity initialization...'); // Removed for production performance
        
        try {
            // Step 1: Generate consistent device fingerprint
            const fingerprint = this.generateDeviceFingerprint();
            this.fingerprintCache = fingerprint;
            // // console.log('🔍 Device fingerprint:', fingerprint); // Removed for production performance
            
            // Step 2: Check backend FIRST (not localStorage)
            const backendPlayer = await this.checkBackendForPlayer(fingerprint);
            
            if (backendPlayer) {
                // // console.log('✅ Existing player found in backend:', backendPlayer.displayName); // Removed for production performance
                
                // Check if this player has a custom name or is still using default
                const hasCustomName = backendPlayer.displayName && 
                    backendPlayer.displayName.includes('#') && 
                    !backendPlayer.displayName.startsWith('Player#');
                
                if (hasCustomName) {
                    // // console.log('👤 Welcome back,', backendPlayer.displayName.split('#'); // Removed for production performance[0] + '!');
                } else {
                    // // console.log('👤 Welcome back! (Using default name, can be customized); // Removed for production performance');
                }
                
                this.player = backendPlayer;
                this.cacheLocally(backendPlayer);
                this.isInitialized = true;
                
                return backendPlayer;
            }
            
            // Step 3: Create new real Sonic wallet (only if truly new)
            // // console.log('🆕 Creating new Sonic wallet for device:', fingerprint); // Removed for production performance
            const newPlayer = await this.createSonicWallet(fingerprint);
            
            // Step 4: Store in backend FIRST, then cache locally
            await this.storeInBackend(newPlayer);
            this.cacheLocally(newPlayer);
            
            this.player = newPlayer;
            this.isInitialized = true;
            
            // // console.log('✅ New player created:', newPlayer.displayName); // Removed for production performance
            // // console.log('💎 Awarded 10 Quarks signup bonus!'); // Removed for production performance
            
            return newPlayer;
            
        } catch (error) {
            console.error('❌ Identity initialization failed:', error);
            // Create fallback player to prevent game startup failure
            this.createFallbackPlayer();
            this.isInitialized = true;
            return this.player;
        }
    }

    /**
     * Generate consistent device fingerprint
     * Creates 16-character unique ID based on device characteristics
     */
    generateDeviceFingerprint() {
        try {
            // Create canvas fingerprint
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillText('BlockZone fingerprint', 2, 2);
            
            // Collect device characteristics
            const components = [
                navigator.userAgent,
                navigator.language,
                screen.width + 'x' + screen.height,
                new Date().getTimezoneOffset().toString(),
                canvas.toDataURL(),
                (navigator.hardwareConcurrency || 'unknown').toString(),
                (navigator.deviceMemory || 'unknown').toString()
            ];
            
            // Create hash and return 16-character ID
            const hash = btoa(components.join('|')).replace(/[^a-zA-Z0-9]/g, '');
            return hash.slice(0, 16);
            
        } catch (error) {
            console.warn('Fingerprint generation error, using fallback:', error);
            // Fallback fingerprint
            return btoa(navigator.userAgent + Date.now()).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
        }
    }

    /**
     * Check backend for existing player by fingerprint
     */
    async checkBackendForPlayer(fingerprint) {
        try {
            const response = await fetch(`${this.apiBase}/api/player/fingerprint/${fingerprint}`);
            
            if (response.ok) {
                const player = await response.json();
                // // console.log('📡 Backend returned existing player:', player.displayName); // Removed for production performance
                return player;
            } else if (response.status === 404) {
                // // console.log('📡 No existing player found in backend for fingerprint:', fingerprint); // Removed for production performance
                return null;
            } else {
                throw new Error(`Backend error: ${response.status}`);
            }
        } catch (error) {
            console.warn('Backend check failed (will create new):', error);
            return null;
        }
    }

    /**
     * Create real Sonic Labs wallet with Quark integration
     */
    async createSonicWallet(fingerprint) {
        // // console.log('🔧 Generating real Sonic Labs wallet...'); // Removed for production performance
        
        try {
            // Generate real EVM wallet using global ethers
            const wallet = window.ethers.Wallet.createRandom();
            
            const newPlayer = {
                id: `player_${fingerprint}`,
                device_fingerprint: fingerprint,
                wallet_address: wallet.address,
                private_key_encrypted: this.encryptPrivateKey(wallet.privateKey),
                displayName: `Player#${wallet.address.slice(-4).toUpperCase()}`,
                created_at: Date.now(),
                last_seen: Date.now(),
                quark_balance: 10, // Signup bonus
                sonic_network: 'mainnet',
                version: '3.0',
                games_played: 0,
                high_score: 0,
                total_score: 0
            };
            
            // // console.log('✅ Real Sonic wallet created:', wallet.address); // Removed for production performance
            return newPlayer;
            
        } catch (error) {
            console.error('❌ Wallet creation failed:', error);
            throw new Error('Failed to create Sonic wallet');
        }
    }

    /**
     * Store player in backend with fingerprint key
     */
    async storeInBackend(player) {
        try {
            const response = await fetch(`${this.apiBase}/api/player/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(player)
            });
            
            if (response.ok) {
                const result = await response.json();
                // // console.log('✅ Player stored in backend successfully'); // Removed for production performance
                return result;
            } else if (response.status === 409) {
                // Player already exists - this shouldn't happen but handle gracefully
                const conflict = await response.json();
                // // console.log('⚠️ Player already exists in backend, using existing:', conflict.existing_player.displayName); // Removed for production performance
                return conflict.existing_player;
            } else {
                throw new Error(`Backend storage failed: ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Failed to store player in backend:', error);
            throw error;
        }
    }

    /**
     * Cache player data locally for fast access
     */
    cacheLocally(player) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(player));
            // // console.log('💾 Player cached locally for fast access'); // Removed for production performance
        } catch (error) {
            console.warn('Local caching failed (non-critical):', error);
        }
    }

    /**
     * Simple private key encryption (use proper encryption in production)
     */
    encryptPrivateKey(privateKey) {
        // Simple base64 encoding - replace with proper encryption in production
        return btoa(privateKey + '_encrypted_' + Date.now());
    }

    /**
     * Compatibility methods for existing code
     */
    hasValidIdentity() {
        return this.isInitialized && this.player !== null;
    }

    getCurrentPlayer() {
        return this.player;
    }

    getPlayerName() {
        return this.player ? this.player.displayName : null;
    }

    getPlayerId() {
        return this.player ? this.player.id : null;
    }

    generateFingerprint() {
        return this.fingerprintCache || this.generateDeviceFingerprint();
    }

    async registerPlayer(playerData) {
        // For now, return current player - can enhance later
        return this.getCurrentPlayer();
    }

    validateIdentity() {
        return this.hasValidIdentity();
    }

    clearIdentity() {
        localStorage.removeItem(this.storageKey);
        this.player = null;
        this.isInitialized = false;
        this.fingerprintCache = null;
        // // console.log('🧹 Identity cleared - will create new on next initialization'); // Removed for production performance
    }

    /**
     * Create emergency fallback player
     * Ensures game can always start even if backend fails
     */
    createFallbackPlayer() {
        // // console.log('🆘 Creating emergency fallback player...'); // Removed for production performance
        
        const fallbackId = 'fallback_' + Date.now();
        const fallbackFingerprint = this.fingerprintCache || this.generateDeviceFingerprint();
        
        const fallbackPlayer = {
            id: fallbackId,
            device_fingerprint: fallbackFingerprint,
            wallet_address: null, // No wallet in fallback mode
            displayName: 'Player#' + fallbackId.slice(-4).toUpperCase(),
            created_at: Date.now(),
            last_seen: Date.now(),
            quark_balance: 0, // No Quarks in fallback
            sonic_network: 'offline',
            version: '3.0-fallback',
            games_played: 0,
            high_score: 0,
            total_score: 0,
            is_fallback: true
        };
        
        this.player = fallbackPlayer;
        this.cacheLocally(fallbackPlayer);
        
        // // console.log('✅ Emergency fallback player created:', fallbackPlayer.displayName); // Removed for production performance
        // // console.log('⚠️ Limited functionality - no wallet or Quarks available'); // Removed for production performance
    }

    /**
     * Get device ID for compatibility
     */
    getDeviceId() {
        return this.generateFingerprint();
    }

    /**
     * Check if system is ready
     */
    isReady() {
        return this.isInitialized && this.hasValidIdentity();
    }

    /**
     * Get wallet address (new method for Sonic integration)
     */
    getWalletAddress() {
        return this.player ? this.player.wallet_address : null;
    }

    /**
     * Get Quark balance (new method for token integration)
     */
    getQuarkBalance() {
        return this.player ? this.player.quark_balance || 0 : 0;
    }

    /**
     * Update player with custom username (creates cool game name with real wallet)
     * @param {string} username - The player's chosen username
     */
    async updateWithCustomName(username) {
        if (!this.player) {
            console.warn('⚠️ No player to update with custom name');
            return false;
        }

        try {
            // Get real wallet suffix (last 4 digits of actual Sonic Labs wallet)
            const walletSuffix = this.player.wallet_address ? 
                this.player.wallet_address.slice(-4).toUpperCase() : 
                '0000';

            // Create cool game name: "Hambo#274F" (real wallet)
            const coolGameName = `${username}#${walletSuffix}`;
            
            // // console.log('🎮 Creating cool game name with real wallet:', coolGameName); // Removed for production performance
            // // console.log('💰 Real wallet address:', this.player.wallet_address); // Removed for production performance
            // // console.log('🔢 Wallet suffix:', walletSuffix); // Removed for production performance
            
            // Update player object
            this.player.displayName = coolGameName;
            this.player.username = username;
            this.player.walletSuffix = walletSuffix;
            
            // Update local cache
            this.cacheLocally(this.player);
            
            // Update backend (non-blocking)
            try {
                const response = await fetch(`${this.apiBase}/api/player/update-stats`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        device_fingerprint: this.player.device_fingerprint,
                        displayName: coolGameName,
                        username: username,
                        wallet_address: this.player.wallet_address,
                        games_played: this.player.games_played || 0,
                        high_score: this.player.high_score || 0,
                        total_score: this.player.total_score || 0,
                        quark_balance: this.player.quark_balance || 0
                    })
                });
                
                if (response.ok) {
                    // // console.log('✅ Player name updated in backend:', coolGameName); // Removed for production performance
                } else {
                    console.warn('⚠️ Backend name update failed (non-critical):', response.status);
                }
            } catch (error) {
                console.warn('⚠️ Backend name update failed (non-critical):', error);
            }
            
            // Emit event for UI updates
            if (window.gameWrapper && window.gameWrapper.emit) {
                window.gameWrapper.emit('playerNameUpdated', { 
                    displayName: coolGameName, 
                    username: username,
                    walletSuffix: walletSuffix,
                    walletAddress: this.player.wallet_address
                });
            }
            
            // // console.log('🎯 Player updated with cool game name:', coolGameName); // Removed for production performance
            return true;
            
        } catch (error) {
            console.error('❌ Failed to update player with custom name:', error);
            return false;
        }
    }

    /**
     * Update player display name with custom username
     */
    async updateDisplayName(username) {
        if (!this.player) return false;
        
        try {
            // Get wallet suffix (last 4 digits)
            const walletSuffix = this.player.wallet_address ? 
                this.player.wallet_address.slice(-4).toUpperCase() : 
                this.player.id ? this.player.id.slice(-4).toUpperCase() : '0000';
            
            // Create composite display name: "Username#1234"
            const compositeDisplayName = `${username}#${walletSuffix}`;
            
            // Update local player data
            this.player.displayName = compositeDisplayName;
            this.player.username = username;
            
            // Update local cache
            this.cacheLocally(this.player);
            
            // Update backend (non-blocking)
            try {
                const response = await fetch(`${this.apiBase}/api/player/update-stats`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        device_fingerprint: this.player.device_fingerprint,
                        displayName: compositeDisplayName,
                        username: username,
                        games_played: this.player.games_played,
                        high_score: this.player.high_score,
                        total_score: this.player.total_score,
                        quark_balance: this.player.quark_balance
                    })
                });
                
                if (response.ok) {
                    // // console.log('✅ Display name updated in backend'); // Removed for production performance
                }
            } catch (error) {
                console.warn('⚠️ Backend display name update failed (non-critical):', error);
            }
            
            // // console.log('✅ Display name updated:', compositeDisplayName); // Removed for production performance
            return true;
            
        } catch (error) {
            console.error('❌ Failed to update display name:', error);
            return false;
        }
    }

    /**
     * Update game stats (called after gameplay)
     */
    async updateGameStats(score, isHighScore = false) {
        if (!this.player) return;
        
        this.player.games_played = (this.player.games_played || 0) + 1;
        this.player.total_score = (this.player.total_score || 0) + score;
        this.player.last_seen = Date.now();
        
        if (isHighScore) {
            this.player.high_score = score;
        }
        
        // Award Quarks (1 per 10 points)
        const quarksEarned = Math.floor(score / 10);
        if (quarksEarned > 0) {
            this.player.quark_balance = (this.player.quark_balance || 0) + quarksEarned;
            // // console.log(`💎 Earned ${quarksEarned} Quarks! New balance: ${this.player.quark_balance}`); // Removed for production performance
        }
        
        // Update local cache
        this.cacheLocally(this.player);
        
        // Update backend (non-blocking)
        try {
            const response = await fetch(`${this.apiBase}/api/player/update-stats`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    device_fingerprint: this.player.device_fingerprint,
                    games_played: this.player.games_played,
                    high_score: this.player.high_score,
                    total_score: this.player.total_score,
                    quark_balance: this.player.quark_balance
                })
            });
            
            if (response.ok) {
                // // console.log('✅ Game stats updated in backend'); // Removed for production performance
            }
        } catch (error) {
            console.warn('⚠️ Backend stats update failed (non-critical):', error);
        }
    }

    /**
     * Check if player can play (for PaywallManager compatibility)
     */
    async checkPlayEligibility() {
        try {
            const playerId = this.getPlayerId();
            if (!playerId) {
                return { 
                    canPlay: false, 
                    reason: 'identity_required',
                    player_id: null,
                    can_play_free: false,
                    has_unlimited_pass: false,
                    requires_payment: true
                };
            }

            const response = await fetch(`${this.apiBase}/api/players/status?player_id=${playerId}`);
            
            if (response.ok) {
                const data = await response.json();
                // // console.log('🔍 Backend player status:', data); // Removed for production performance
                
                // Return the full backend response for PaywallManager compatibility
                return {
                    canPlay: data.has_unlimited_pass || data.can_play_free,
                    reason: data.has_unlimited_pass ? 'day_pass_active' : 
                           data.can_play_free ? 'free_game_available' : 'payment_required',
                    player_id: data.player_id,
                    can_play_free: data.can_play_free,
                    has_unlimited_pass: data.has_unlimited_pass,
                    requires_payment: data.requires_payment,
                    status: data.status,
                    current_day: data.current_day,
                    next_reset: data.next_reset
                };
            } else {
                console.error('❌ Backend status check failed:', response.status);
                return { 
                    canPlay: false, 
                    reason: 'backend_error',
                    player_id: playerId,
                    can_play_free: false,
                    has_unlimited_pass: false,
                    requires_payment: true
                };
            }
        } catch (error) {
            console.error('❌ Error checking play eligibility:', error);
            return { 
                canPlay: false, 
                reason: 'backend_error',
                player_id: this.getPlayerId(),
                can_play_free: false,
                has_unlimited_pass: false,
                requires_payment: true
            };
        }
    }

    /**
     * Mark free game as used (for PaywallManager compatibility)
     */
    async markFreeGameUsed() {
        try {
            const playerId = this.getPlayerId();
            if (!playerId) {
                throw new Error('No player ID available');
            }

            const response = await fetch(`${this.apiBase}/api/player/use-free-game`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ player_id: playerId })
            });

            if (response.ok) {
                // // console.log('✅ Free game marked as used'); // Removed for production performance
                return true;
            } else {
                throw new Error(`Failed to mark free game as used: ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Error marking free game as used:', error);
            throw error;
        }
    }
}

// Export default for compatibility with existing imports
export default IdentityManager;

// Create and export a singleton instance
export const identityManager = new IdentityManager();
