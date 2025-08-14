/**
 * PaywallManager - Handles payment processing and game access control
 * 
 * 🎯 QUICK TOGGLE FOR FRIEND TESTING:
 * To enable animated payment bypass on blockzonelab.com for friends:
 * 1. Find "ENABLE_TEST_MODE_ON_MAIN" in detectEnvironment() method
 * 2. Set it to true to enable, false to disable
 * 3. Push changes to deploy
 * 
 * This allows friends to test the game with mock payments on your main domain!
 */

import { IdentityManager } from '../core/IdentityManager.js';

// Global singleton instance
let globalPaywallManager = null;

export class PaywallManager {
    constructor() {
        // Singleton pattern - only create one instance
        if (globalPaywallManager) {
            return globalPaywallManager;
        }
        
        this.isVisible = false;
        this.identityManager = null;
        this.playerProfile = null;
        this.pendingGameStart = null;
        this.lastDecision = null; // Cache last paywall decision
        this.lastDecisionTime = 0; // Timestamp of last decision
        
        // ENHANCED CACHING: Smart TTL-based caching with multiple layers
        this.sessionCache = {
            playerStatus: null,
            cachedAt: null,
            validFor: 5 * 60 * 1000, // 5 minutes TTL for session-level caching
            lastGameAction: null,
            playerId: null,
            // New: Request deduplication
            pendingRequests: new Map(),
            // New: Cache hit tracking
            cacheHits: 0,
            cacheMisses: 0,
            // New: Session-level decisions
            sessionDecisions: new Map(),
            // New: Cache warming
            lastCacheWarm: null
        };
        
        // Make it globally accessible
        window.paywallManager = this;
        
        // Store global instance
        globalPaywallManager = this;
    }

    /**
     * Initialize the paywall manager
     */
    async initialize(identityManager) {
        // // console.log('💰 PaywallManager: Initializing paywall system with PlayerProfile integration'); // Removed for production performance
        
        this.identityManager = identityManager;
        
        // Initialize session cache
        this.sessionCache = {
            playerStatus: null,
            cachedAt: null,
            playerId: null,
            validFor: 300000, // 5 minutes
            cacheHits: 0,
            cacheMisses: 0,
            pendingRequests: new Map(),
            sessionDecisions: new Map(),
            lastCacheWarm: null
        };
        
        // Get PlayerProfile singleton
        if (window.globalPlayerProfile) {
            this.playerProfile = window.globalPlayerProfile;
            // // console.log('💰 PaywallManager: Using existing global PlayerProfile singleton'); // Removed for production performance
        } else if (window.playerProfile) {
            this.playerProfile = window.playerProfile;
            // // console.log('💰 PaywallManager: Using window.playerProfile'); // Removed for production performance
        } else {
            // // console.log('⏳ PaywallManager: PlayerProfile not available yet, will retry later'); // Removed for production performance
            // Try to get it later when needed
            setTimeout(() => {
                if (window.globalPlayerProfile) {
                    this.playerProfile = window.globalPlayerProfile;
                    // // console.log('💰 PaywallManager: Found PlayerProfile on retry'); // Removed for production performance
                }
            }, 1000);
        }
        
        // PERFORMANCE OPTIMIZATION: Warm up cache after initialization
        setTimeout(() => {
            this.warmUpCache();
        }, 100); // Small delay to ensure identity is ready
        
        // // console.log('✅ PaywallManager initialized successfully'); // Removed for production performance
    }

    /**
     * Intercept game start and show paywall if needed
     */
    async interceptGameStart(gameId = 'neondrop', options = {}) {
        try {
            console.log('🎯 PaywallManager: Intercepting game start for', gameId);
            
            // ENHANCED: Check if player needs onboarding first
            if (!this.identityManager || !this.identityManager.hasValidIdentity()) {
                console.log('🎨 New player detected - showing welcome system');
                await this.showWelcomeSystem();
                return false; // Don't start game yet
            }
            
            // Get player status from backend
            const playerStatus = await this.getPlayerStatusFromBackend();
            
            if (!playerStatus) {
                console.error('❌ Failed to get player status');
                this.showIdentityRequired();
                return false;
            }
            
            // Check if player has free game available
            if (playerStatus.free_games_remaining > 0) {
                console.log('🎁 Player has free game available');
                
                // Show welcome message for returning players
                if (playerStatus.games_played > 0) {
                    await this.showWelcomeMessage(playerStatus);
                }
                
                // Show free game option
                this.showPaymentOptions(gameId, options, playerStatus);
                return false; // Don't start game automatically
            }
            
            // No free game - show payment options
            console.log('💳 Player needs to pay - showing payment options');
            this.showPaymentOptions(gameId, options, playerStatus);
            return false;
            
        } catch (error) {
            console.error('❌ Error intercepting game start:', error);
            this.showPaymentStatus('error', 'Failed to check game access. Please try again.');
            return false;
        }
    }

    /**
     * Get player status - enhanced caching with request deduplication
     */
    async getPlayerStatusFromBackend() {
        const startTime = performance.now();
        try {
            const playerId = this.identityManager?.getPlayerId();
            if (!playerId) {
                // // console.log('⚠️ No player ID available for status check'); // Removed for production performance
                return null;
            }
            
            // PERFORMANCE OPTIMIZATION: Check PlayerProfile cache first
            if (window.playerProfile && typeof window.playerProfile.getPlayerStatus === 'function') {
                try {
                    //  // Removed for production performance
                    const cachedStatus = await window.playerProfile.getPlayerStatus(playerId, false); // false = don't force refresh
                    
                    if (cachedStatus) {
                        const duration = performance.now() - startTime;
                        // // console.log(`📦 PlayerProfile CACHE HIT - status retrieved in ${duration.toFixed(2); // Removed for production performance}ms`);
                        
                        // Update our session cache to stay in sync
                        this.sessionCache.playerStatus = cachedStatus;
                        this.sessionCache.cachedAt = Date.now();
                        this.sessionCache.playerId = playerId;
                        this.sessionCache.cacheHits++;
                        
                        return cachedStatus;
                    }
                } catch (error) {
                    // // console.log('⚠️ PlayerProfile cache check failed, falling back to direct backend call:', error.message); // Removed for production performance
                }
            }
            
            // Fallback: Check our own session cache
            const now = Date.now();
            if (this.sessionCache.playerStatus && 
                this.sessionCache.cachedAt && 
                (now - this.sessionCache.cachedAt) < this.sessionCache.validFor &&
                this.sessionCache.playerId === playerId) {
                
                this.sessionCache.cacheHits++;
                const duration = performance.now() - startTime;
                // // console.log(`💰 Session CACHE HIT (${this.sessionCache.cacheHits}); // Removed for production performance - using cached player status in ${duration.toFixed(2)}ms`);
                return this.sessionCache.playerStatus;
            }
            
            // Check for pending request to avoid duplicate calls
            if (this.sessionCache.pendingRequests.has(playerId)) {
                // // console.log('🔄 Request already pending, waiting for result...'); // Removed for production performance
                return await this.sessionCache.pendingRequests.get(playerId);
            }
            
            // Cache miss - fetch from backend with deduplication
            this.sessionCache.cacheMisses++;
            // // console.log(`💰 Cache MISS (${this.sessionCache.cacheMisses}); // Removed for production performance - fetching fresh player status for:`, playerId);
            
            // Create promise for this request
            const requestPromise = this._fetchPlayerStatus(playerId);
            this.sessionCache.pendingRequests.set(playerId, requestPromise);
            
            try {
                const status = await requestPromise;
                const duration = performance.now() - startTime;
                // // console.log(`✅ Backend fetch completed in ${duration.toFixed(2); // Removed for production performance}ms`);
                return status;
            } finally {
                // Clean up pending request
                this.sessionCache.pendingRequests.delete(playerId);
            }
            
        } catch (error) {
            const duration = performance.now() - startTime;
            console.error(`❌ Failed to get player status from backend (${duration.toFixed(2)}ms):`, error);
            return null;
        }
    }
    
    /**
     * Internal method to fetch player status
     */
    async _fetchPlayerStatus(playerId) {
        const response = await fetch(`${this.identityManager.apiBase}/api/players/status?player_id=${encodeURIComponent(playerId)}`);
        
        if (response.ok) {
            const status = await response.json();
            // // console.log('✅ Fresh player status from backend:', status); // Removed for production performance
            
            // Cache the result
            const now = Date.now();
            this.sessionCache.playerStatus = status;
            this.sessionCache.cachedAt = now;
            this.sessionCache.playerId = playerId;
            
            return status;
        } else {
            console.error('❌ Backend status check failed:', response.status);
            return null;
        }
    }

    /**
     * Show welcome message for returning players
     */
    async showWelcomeMessage(playerStatus) {
        // Enhanced welcome message with player info
        const message = `Welcome back, ${playerStatus.display_name || 'Champion'}! 🎮`;
        this.showPaymentStatus('success', message);
    }
    
    // ENHANCED: Show welcome system for new players
    async showWelcomeSystem(playerStatus = null) {
        console.log('🎨 PaywallManager: Showing welcome system for new player');
        
        // Create welcome overlay
        const overlay = document.createElement('div');
        overlay.id = 'paywall-welcome';
        overlay.className = 'paywall-welcome-overlay';
        
        overlay.innerHTML = `
            <style>
                .paywall-welcome-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 999999;
                    padding: 40px 20px;
                    box-sizing: border-box;
                    font-family: 'Bungee', monospace;
                }
                
                .welcome-card {
                    background: linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
                    border: 2px solid #00d4ff;
                    border-radius: 24px;
                    padding: 40px;
                    max-width: 600px;
                    width: 90%;
                    text-align: center;
                    box-shadow: 
                        0 0 64px rgba(0, 212, 255, 0.4),
                        0 20px 64px rgba(0, 0, 0, 0.6);
                    position: relative;
                    overflow: hidden;
                }
                
                .welcome-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 2px;
                    background: linear-gradient(90deg, transparent, #00d4ff, transparent);
                    animation: shimmer 2s infinite;
                }
                
                .welcome-title {
                    font-size: 32px;
                    color: #00d4ff;
                    margin-bottom: 20px;
                    text-shadow: 0 0 15px #00d4ff;
                }
                
                .welcome-subtitle {
                    font-size: 18px;
                    color: #cccccc;
                    margin-bottom: 30px;
                    line-height: 1.5;
                }
                
                .welcome-features {
                    list-style: none;
                    padding: 0;
                    margin: 30px 0;
                    text-align: left;
                }
                
                .welcome-features li {
                    color: #e0e0e0;
                    font-size: 16px;
                    margin: 15px 0;
                    padding-left: 30px;
                    position: relative;
                }
                
                .welcome-features li::before {
                    content: '✨';
                    position: absolute;
                    left: 0;
                    color: #00d4ff;
                    font-size: 20px;
                }
                
                .welcome-btn {
                    background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%);
                    color: #000;
                    border: none;
                    border-radius: 12px;
                    padding: 18px 36px;
                    font-size: 18px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-transform: uppercase;
                    letter-spacing: 1.2px;
                    margin: 20px 10px;
                    font-family: 'Bungee', monospace;
                }
                
                .welcome-btn:hover {
                    background: linear-gradient(135deg, #00b8e6 0%, #0088b3 100%);
                    transform: translateY(-3px);
                    box-shadow: 0 10px 30px rgba(0, 212, 255, 0.5);
                }
                
                .welcome-btn.secondary {
                    background: rgba(255, 255, 255, 0.1);
                    color: #cccccc;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }
                
                .welcome-btn.secondary:hover {
                    background: rgba(255, 255, 255, 0.2);
                    color: #ffffff;
                }
            </style>
            
            <div class="welcome-card">
                <div class="welcome-title">🎮 Welcome to BlockZone Lab!</div>
                
                <div class="welcome-subtitle">
                    You're about to enter the world of competitive Web3 gaming with real prizes!
                </div>
                
                <ul class="welcome-features">
                    <li>🎁 Get 1 FREE game every day</li>
                    <li>🏆 Compete in daily tournaments</li>
                    <li>💰 Win real USDC.E prizes</li>
                    <li>🔐 Secure blockchain identity</li>
                    <li>⚡ Lightning-fast gameplay</li>
                </ul>
                
                <div style="margin: 30px 0;">
                    <button class="welcome-btn" onclick="window.paywallManager.startWelcomeFlow()">
                        🚀 Start Gaming Now
                    </button>
                    <button class="welcome-btn secondary" onclick="window.paywallManager.hideWelcomeSystem()">
                        Maybe Later
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
    }
    
    // ENHANCED: Start the welcome flow
    async startWelcomeFlow() {
        // Hide welcome system
        this.hideWelcomeSystem();
        
        // Show payment options (which will handle new player flow)
        await this.showPaymentOptions('neondrop', {}, null);
    }
    
    // ENHANCED: Hide welcome system
    hideWelcomeSystem() {
        const overlay = document.getElementById('paywall-welcome');
        if (overlay && overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
    }

    /**
     * Mark free game as used
     */
    async markFreeGameAsUsed(playerId) {
        try {
            // Use IdentityManager to mark free game as used
            if (this.identityManager) {
                await this.identityManager.markFreeGameUsed();
                // // console.log('✅ Free game marked as used via IdentityManager'); // Removed for production performance
                
                // Aggressively clear all caches to ensure fresh status check
                this.clearPlayerStatusCache();
                
                // Force immediate cache invalidation by setting a very old timestamp
                this.sessionCache.cachedAt = 0;
                this.sessionCache.playerStatus = null;
                
                // // console.log('🔄 All caches cleared - next status check will be fresh'); // Removed for production performance
            } else {
                // // console.log('⚠️ No IdentityManager available for marking free game'); // Removed for production performance
            }
        } catch (error) {
            console.error('❌ Failed to mark free game as used:', error);
        }
    }

    /**
     * Show payment options OR free game card based on player status
     */
    showPaymentOptions(gameId, options = {}, playerStatus = null) {
        if (this.isVisible) {
            return;
        }

        this.isVisible = true;
        this.pendingGameStart = { gameId, options };

        // Determine if player has free game available
        const hasFreeGame = playerStatus && playerStatus.can_play_free === true;

        // GAMES PAGE APPROACH: Create inline paywall section instead of overlay
        const paywallSection = document.createElement('div');
        paywallSection.id = 'paywall-section';
        paywallSection.className = 'paywall-section';
        
        paywallSection.innerHTML = `
            <style>
                /* GAMES PAGE STYLE: Inline section instead of overlay */
                .paywall-section {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 999999;
                    padding: 40px 20px;
                    box-sizing: border-box;
                    font-family: 'Bungee', monospace;
                }
                
                .paywall-container {
                    background: linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
                    border: 2px solid #00d4ff;
                    border-radius: 24px;
                    padding: 24px;
                    max-width: 640px;
                    width: 90%;
                    text-align: center;
                    box-shadow: 
                        0 0 64px rgba(0, 212, 255, 0.4),
                        0 20px 64px rgba(0, 0, 0, 0.6);
                    position: relative;
                    overflow: hidden;
                }
                
                .paywall-container::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 2px;
                    background: linear-gradient(90deg, transparent, #00d4ff, transparent);
                    animation: shimmer 2s infinite;
                }
                
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                
                .paywall-header {
                    margin-bottom: 24px;
                    position: relative;
                    text-align: center;
                }
                
                /* NEON DROP CHICLET ANIMATION STYLES */
                .netflix-chiclet-title {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 0px;
                    margin-bottom: 15px;
                    filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3));
                }

                .chiclet-word {
                    display: flex;
                    gap: 0px;
                }

                .chiclet-spacer {
                    width: 19px;
                    height: 19px;
                }

                .chiclet {
                    width: 19px;
                    height: 19px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: 'Bungee', monospace;
                    font-weight: bold;
                    font-size: 23px;
                    line-height: 1;
                    border-radius: 2px;
                    position: relative;
                    text-align: center;
                    text-shadow: 1px 1px 0 #000000;
                    transform: translateY(-24px) scale(0.3);
                    opacity: 0;
                    transition: transform 0.3s ease;
                    animation: chicletEntrance 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                }

                .chiclet:hover {
                    transform: translateY(0) scale(1.05);
                }

                .chiclet.neon {
                    background: #FFFF00;
                    color: transparent;
                    box-shadow: 
                        inset 2px 2px 4px rgba(255, 255, 255, 0.3),
                        inset -2px -2px 4px rgba(0, 0, 0, 0.3),
                        0 0 10px rgba(255, 255, 0, 0.5);
                    background-clip: text;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background: linear-gradient(135deg, #FFFF00 0%, #FFD700 50%, #FFA500 100%);
                }

                .chiclet.drop {
                    background: #8A2BE2;
                    color: transparent;
                    box-shadow: 
                        inset 2px 2px 4px rgba(255, 255, 255, 0.3),
                        inset -2px -2px 4px rgba(0, 0, 0, 0.3),
                        0 0 10px rgba(138, 43, 226, 0.5);
                    background-clip: text;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background: linear-gradient(135deg, #8A2BE2 0%, #9932CC 50%, #DA70D6 100%);
                }

                .chiclet:nth-child(1) { animation-delay: 0.1s; }
                .chiclet:nth-child(2) { animation-delay: 0.2s; }
                .chiclet:nth-child(3) { animation-delay: 0.3s; }
                .chiclet:nth-child(4) { animation-delay: 0.4s; }
                .chiclet:nth-child(5) { animation-delay: 0.5s; }
                .chiclet:nth-child(6) { animation-delay: 0.6s; }
                .chiclet:nth-child(7) { animation-delay: 0.7s; }
                .chiclet:nth-child(8) { animation-delay: 0.8s; }

                @keyframes chicletEntrance {
                    0% { transform: translateY(-30px) scale(0.3) rotate(10deg); opacity: 0; }
                    60% { transform: translateY(2px) scale(1.1) rotate(-3deg); opacity: 0.8; }
                    100% { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; }
                }

                .leaderboard-title {
                    font-size: 29px;
                    font-weight: bold;
                    color: #00d4ff;
                    text-shadow: 0 0 12px #00d4ff, 0 0 20px #00d4ff;
                    margin-top: 16px;
                    animation: neonGlow 2s ease-in-out infinite;
                }

                @keyframes neonGlow { 
                    0%, 100% { text-shadow: 0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor; }
                    50% { text-shadow: 0 0 20px currentColor, 0 0 30px currentColor, 0 0 40px currentColor; }
                }
                .paywall-header .subtitle {
                    color: #a0a0a0;
                    font-size: 16px;
                    margin-top: 10px;
                    font-weight: 300;
                }

                /* GAMES PAGE STYLE: Clickable cards like the games page */
                .payment-options {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 16px;
                    margin: 24px 0;
                    width: 100%;
                    max-width: 480px;
                    margin-left: auto;
                    margin-right: auto;
                }
                
                .payment-option {
                    background: linear-gradient(145deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
                    border: 2px solid rgba(0, 212, 255, 0.3);
                    border-radius: 16px;
                    padding: 16px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                    aspect-ratio: 2/3;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    text-decoration: none;
                    color: inherit;
                }
                
                .payment-option:hover {
                    border-color: #00d4ff;
                    transform: translateY(-5px);
                    box-shadow: 0 10px 30px rgba(0, 212, 255, 0.3);
                    text-decoration: none;
                    color: inherit;
                }
                
                .payment-option::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.1), transparent);
                    transition: left 0.5s ease;
                }
                
                .payment-option:hover::before {
                    left: 100%;
                }
                .payment-option.apple-pay {
                    background: linear-gradient(145deg, #000000 0%, #1a1a1a 100%);
                    border-color: #007AFF;
                }
                .payment-option.apple-pay:hover {
                    border-color: #007AFF;
                    box-shadow: 0 10px 30px rgba(0, 122, 255, 0.3);
                }
                .payment-option.google-pay {
                    background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
                    border-color: #4285F4;
                }
                .payment-option.google-pay:hover {
                    border-color: #4285F4;
                    box-shadow: 0 10px 30px rgba(66, 133, 244, 0.3);
                }
                .payment-option.sonic-labs {
                    background: linear-gradient(145deg, #1a1a2e 0%, #16213e 100%);
                    border-color: #00d4ff;
                }
                .payment-option.sonic-labs:hover {
                    border-color: #00d4ff;
                    box-shadow: 0 10px 30px rgba(0, 212, 255, 0.3);
                }
                .payment-option-header {
                    display: flex;
                    align-items: center;
                    margin-bottom: 10px;
                }
                .payment-option-icon {
                    width: 26px;
                    height: 26px;
                    margin-right: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 6px;
                    font-size: 13px;
                }
                .payment-option-title {
                    font-size: 13px;
                    font-weight: 600;
                    color: #fff;
                    margin: 0;
                }
                .payment-option-subtitle {
                    font-size: 10px;
                    color: #a0a0a0;
                    margin: 2px 0 0 0;
                }
                .payment-option-price {
                    font-size: 16px;
                    font-weight: 700;
                    color: #00d4ff;
                    margin: 10px 0;
                }
                .payment-option-features {
                    list-style: none;
                    padding: 0;
                    margin: 10px 0;
                    flex-grow: 1;
                }
                .payment-option-features li {
                    color: #a0a0a0;
                    font-size: 10px;
                    margin: 3px 0;
                    padding-left: 13px;
                    position: relative;
                }
                .payment-option-features li::before {
                    content: '✓';
                    position: absolute;
                    left: 0;
                    color: #00d4ff;
                    font-weight: bold;
                }
                .payment-button {
                    width: 100%;
                    padding: 10px;
                    border: none;
                    border-radius: 10px;
                    font-size: 11px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    margin-top: 10px;
                }
                .payment-button.apple-pay {
                    background: #000;
                    color: #fff;
                }
                .payment-button.apple-pay:hover {
                    background: #1a1a1a;
                    transform: scale(1.02);
                }
                .payment-button.google-pay {
                    background: #fff;
                    color: #000;
                    border: 1px solid #ddd;
                }
                .payment-button.google-pay:hover {
                    background: #f8f9fa;
                    transform: scale(1.02);
                }
                .payment-button.sonic-labs {
                    background: linear-gradient(145deg, #00d4ff 0%, #0099cc 100%);
                    color: #fff;
                }
                .payment-button.sonic-labs:hover {
                    background: linear-gradient(145deg, #0099cc 0%, #0077aa 100%);
                    transform: scale(1.02);
                }
                .payment-status {
                    margin-top: 20px;
                    padding: 15px;
                    border-radius: 10px;
                    font-size: 14px;
                    text-align: center;
                }
                .payment-status.processing {
                    background: rgba(255, 193, 7, 0.1);
                    border: 1px solid #ffc107;
                    color: #ffc107;
                }
                .payment-status.success {
                    background: rgba(40, 167, 69, 0.1);
                    border: 1px solid #28a745;
                    color: #28a745;
                }
                .payment-status.error {
                    background: rgba(220, 53, 69, 0.1);
                    border: 1px solid #dc3545;
                    color: #dc3545;
                }
                }
                .paywall-message {
                    margin-bottom: 40px;
                    color: #cccccc;
                    font-size: 18px;
                    line-height: 1.5;
                }
                .payment-options {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                    gap: 25px;
                    margin-bottom: 40px;
                }
                .payment-option {
                    background: linear-gradient(145deg, #2a2a4e 0%, #1e1e3e 100%);
                    border: 2px solid #444;
                    border-radius: 25px;
                    padding: 35px;
                    cursor: pointer;
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                }
                .payment-option::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(0, 255, 65, 0.1) 100%);
                    opacity: 0;
                    transition: opacity 0.4s ease;
                }
                .payment-option:hover::before {
                    opacity: 1;
                }
                .payment-option:hover {
                    transform: translateY(-10px) scale(1.03);
                    border-color: #00d4ff;
                    box-shadow: 
                        0 25px 50px rgba(0, 212, 255, 0.4),
                        0 0 40px rgba(0, 212, 255, 0.3),
                        0 8px 32px rgba(0, 0, 0, 0.4);
                }
                .payment-option.featured {
                    border-color: #00d4ff;
                    background: linear-gradient(145deg, #2a2a4e 0%, #1e1e3e 100%);
                    position: relative;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 20px rgba(0, 212, 255, 0.2);
                }
                
                /* TEST MODE overlay for both cards */
                .payment-option::before {
                    content: 'TEST MODE';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%) rotate(-45deg);
                    background: rgba(0, 0, 0, 0.8);
                    color: #ffaa00;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 10px;
                    font-weight: bold;
                    letter-spacing: 1px;
                    z-index: 10;
                    opacity: 0.7;
                    pointer-events: none;
                }
                .title {
                    color: #00d4ff;
                    font-size: 26px;
                    font-weight: 700;
                    margin-bottom: 12px;
                    text-shadow: 0 0 15px rgba(0, 212, 255, 0.6);
                    letter-spacing: 0.5px;
                }
                .price {
                    color: #fff;
                    font-size: 42px;
                    font-weight: 900;
                    margin-bottom: 18px;
                    text-shadow: 0 0 20px rgba(255, 255, 255, 0.4);
                    letter-spacing: 1px;
                }
                .description {
                    color: #a0a0a0;
                    font-size: 16px;
                    margin-bottom: 20px;
                    line-height: 1.4;
                }
                .features {
                    list-style: none;
                    padding: 0;
                    margin-bottom: 25px;
                }
                .features li {
                    color: #cccccc;
                    margin: 8px 0;
                    padding-left: 20px;
                    position: relative;
                    font-size: 14px;
                }
                .features li:before {
                    content: "✓";
                    color: #00d4ff;
                    position: absolute;
                    left: 0;
                    font-weight: bold;
                }
                .payment-btn {
                    background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%);
                    color: #000;
                    border: none;
                    padding: 18px 35px;
                    border-radius: 15px;
                    font-size: 17px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-transform: uppercase;
                    letter-spacing: 1.2px;
                    width: 100%;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 6px 20px rgba(0, 212, 255, 0.3);
                }
                .payment-btn::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                    transition: left 0.5s;
                }
                .payment-btn:hover::before {
                    left: 100%;
                }
                .payment-btn:hover {
                    background: linear-gradient(135deg, #00b8e6 0%, #0088b3 100%);
                    transform: translateY(-3px);
                    box-shadow: 0 10px 30px rgba(0, 212, 255, 0.5);
                }
                .paywall-footer {
                    margin-top: 30px;
                    color: #888;
                    font-size: 14px;
                }
                

                
                .nav-buttons {
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                    margin-top: 16px;
                }
                
                .nav-btn {
                    background: rgba(255, 255, 255, 0.1);
                    color: #cccccc;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 6px;
                    padding: 8px 13px;
                    font-size: 10px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    min-width: 64px;
                    text-align: center;
                }
                
                .nav-btn:hover {
                    background: rgba(255, 255, 255, 0.2);
                    color: #ffffff;
                    border-color: rgba(255, 255, 255, 0.3);
                    transform: translateY(-1px);
                }
                

                
                /* FREE GAME CARD STYLES */
                .free-game-card {
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
                    border: 2px solid #00ff88;
                    border-radius: 20px;
                    padding: 32px;
                    text-align: center;
                    box-shadow: 
                        0 0 48px rgba(0, 255, 136, 0.4),
                        0 16px 48px rgba(0, 0, 0, 0.6),
                        inset 0 2px 0 rgba(255, 255, 255, 0.15);
                    position: relative;
                    overflow: hidden;
                    backdrop-filter: blur(20px);
                    animation: freeGameGlow 3s ease-in-out infinite alternate;
                }
                
                @keyframes freeGameGlow {
                    0% { 
                        box-shadow: 
                            0 0 60px rgba(0, 255, 136, 0.4),
                            0 20px 60px rgba(0, 0, 0, 0.6),
                            inset 0 2px 0 rgba(255, 255, 255, 0.15);
                    }
                    100% { 
                        box-shadow: 
                            0 0 80px rgba(0, 255, 136, 0.6),
                            0 25px 80px rgba(0, 0, 0, 0.7),
                            inset 0 2px 0 rgba(255, 255, 255, 0.2);
                    }
                }
                
                .free-game-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 2px;
                    background: linear-gradient(90deg, transparent, #00ff88, transparent);
                    animation: shimmer 2s infinite;
                }
                
                .free-game-header {
                    margin-bottom: 30px;
                    position: relative;
                }
                
                .free-game-title {
                    color: #00ff88;
                    font-size: 29px;
                    margin: 0;
                    text-shadow: 0 0 20px #00ff88;
                    font-weight: 700;
                    letter-spacing: 2px;
                    animation: titlePulse 2s ease-in-out infinite;
                }
                
                @keyframes titlePulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                
                .free-game-subtitle {
                    color: #a0ffa0;
                    font-size: 14px;
                    margin-top: 8px;
                    font-weight: 400;
                    text-shadow: 0 0 8px #a0ffa0;
                }
                
                .free-game-features {
                    list-style: none;
                    padding: 0;
                    margin: 24px 0;
                    text-align: left;
                }
                
                .free-game-features li {
                    color: #e0e0e0;
                    font-size: 13px;
                    margin: 12px 0;
                    padding-left: 24px;
                    position: relative;
                }
                
                .free-game-features li::before {
                    content: '✨';
                    position: absolute;
                    left: 0;
                    color: #00ff88;
                    font-size: 18px;
                }
                
                .free-game-btn {
                    background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%);
                    color: #000;
                    border: none;
                    border-radius: 12px;
                    padding: 14px 32px;
                    font-size: 14px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-transform: uppercase;
                    letter-spacing: 1.2px;
                    width: 100%;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 5px 16px rgba(0, 255, 136, 0.4);
                }
                
                .free-game-btn::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
                    transition: left 0.5s;
                }
                
                .free-game-btn:hover::before {
                    left: 100%;
                }
                
                .free-game-btn:hover {
                    background: linear-gradient(135deg, #00cc6a 0%, #00994d 100%);
                    transform: translateY(-3px);
                    box-shadow: 0 10px 30px rgba(0, 255, 136, 0.6);
                }
                
                .free-game-btn:active {
                    transform: translateY(-1px);
                    box-shadow: 0 5px 15px rgba(0, 255, 136, 0.5);
                }
                
                .tournament-cycle {
                    background: rgba(0, 255, 136, 0.1);
                    border: 1px solid rgba(0, 255, 136, 0.3);
                    border-radius: 10px;
                    padding: 15px;
                    margin: 20px 0;
                    color: #a0ffa0;
                    font-size: 14px;
                }
                
                .particle-effect {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    pointer-events: none;
                    overflow: hidden;
                }
                
                .particle {
                    position: absolute;
                    width: 4px;
                    height: 4px;
                    background: #00ff88;
                    border-radius: 50%;
                    animation: particleFloat 4s infinite linear;
                }
                
                @keyframes particleFloat {
                    0% {
                        transform: translateY(100vh) translateX(0);
                        opacity: 0;
                    }
                    10% {
                        opacity: 1;
                    }
                    90% {
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(-100px) translateX(100px);
                        opacity: 0;
                    }
                }
                @media (max-width: 768px) {
                    .paywall-overlay {
                        padding: 20px 15px;
                    }
                    .paywall-modal {
                        padding: 20px 15px;
                        max-height: calc(90vh - 40px);
                        border-radius: 20px;
                        width: 95%;
                    }
                    .payment-options {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 15px;
                        max-width: 500px;
                    }
                    .chiclet {
                        width: 20px;
                        height: 20px;
                        font-size: 24px;
                    }
                    .chiclet-spacer {
                        width: 20px;
                        height: 20px;
                    }
                    .leaderboard-title {
                        font-size: 28px;
                    }
                    .title {
                        font-size: 20px;
                    }
                    .price {
                        font-size: 28px;
                    }
                    .quick-test-btn {
                        padding: 12px 18px;
                        font-size: 12px;
                        min-width: 100px;
                        max-width: 140px;
                    }
                }
                
                @media (max-width: 480px) {
                    .paywall-overlay {
                        padding: 15px 10px;
                    }
                    .paywall-modal {
                        padding: 15px 10px;
                        max-height: calc(90vh - 30px);
                        border-radius: 15px;
                        width: 98%;
                    }
                    .chiclet {
                        width: 18px;
                        height: 18px;
                        font-size: 20px;
                    }
                    .chiclet-spacer {
                        width: 18px;
                        height: 18px;
                    }
                    .leaderboard-title {
                        font-size: 24px;
                    }
                    .payment-option {
                        padding: 18px 15px;
                    }
                    .payment-options {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 12px;
                        max-width: 400px;
                    }
                    .quick-test-btn {
                        padding: 10px 16px;
                        font-size: 11px;
                        min-width: 90px;
                        max-width: 120px;
                    }
                }
                
                @media (max-height: 600px) {
                    .paywall-modal {
                        max-height: calc(90vh - 30px);
                        padding: 20px 15px;
                    }
                    .paywall-header {
                        margin-bottom: 15px;
                    }
                    .payment-options {
                        gap: 15px;
                    }
                    .quick-test-btn {
                        padding: 10px 16px;
                        font-size: 11px;
                        min-width: 90px;
                        max-width: 120px;
                        margin-bottom: 15px;
                    }
                }
            </style>
            
            <div class="paywall-container">
                
                ${hasFreeGame ? `
                <!-- FREE TOURNAMENT ENTRY CARD - GAMES PAGE STYLE -->
                <div class="free-game-card" onclick="window.paywallManager.claimFreeGame('${gameId}', ${JSON.stringify(options)})">
                    <div class="particle-effect">
                        ${Array.from({length: 8}, (_, i) => `
                            <div class="particle" style="left: ${Math.random() * 100}%; animation-delay: ${Math.random() * 4}s;"></div>
                        `).join('')}
                    </div>
                    
                    <div class="free-game-header">
                        <div class="free-game-title">🎁 FREE TOURNAMENT ENTRY</div>
                        <div class="free-game-subtitle">Your complimentary game this tournament cycle!</div>
                    </div>
                    
                    <!-- ENHANCED: Real-time countdown and status -->
                    <div class="tournament-cycle" style="
                        background: rgba(0, 255, 136, 0.15);
                        border: 2px solid rgba(0, 255, 136, 0.4);
                        border-radius: 12px;
                        padding: 18px;
                        margin: 25px 0;
                        color: #a0ffa0;
                        font-size: 14px;
                        position: relative;
                        overflow: hidden;
                    ">
                        <div style="
                            position: absolute;
                            top: 0;
                            left: 0;
                            right: 0;
                            height: 2px;
                            background: linear-gradient(90deg, transparent, #00ff88, transparent);
                            animation: shimmer 2s infinite;
                        "></div>
                        
                        <div style="
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            margin-bottom: 10px;
                        ">
                            <strong>🏆 Daily Tournament Cycle</strong>
                            <div style="
                                background: rgba(0, 255, 136, 0.2);
                                padding: 4px 8px;
                                border-radius: 6px;
                                font-size: 12px;
                                color: #00ff88;
                            ">ACTIVE NOW</div>
                        </div>
                        
                        <div style="
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            gap: 15px;
                            margin-top: 15px;
                        ">
                            <div>
                                <div style="font-size: 12px; color: #888888; margin-bottom: 3px;">Next Reset</div>
                                <div style="font-size: 16px; color: #00ff88; font-weight: 600;">11:00 PM EST</div>
                            </div>
                            <div>
                                <div style="font-size: 12px; color: #888888; margin-bottom: 3px;">Time Remaining</div>
                                <div id="countdown-timer" style="font-size: 16px; color: #00ff88; font-weight: 600;">Calculating...</div>
                            </div>
                        </div>
                    </div>
                    
                    <ul class="free-game-features">
                        <li>Full tournament entry with real USDC.E prizes</li>
                        <li>Complete leaderboard access and ranking</li>
                        <li>All premium game features included</li>
                        <li>No payment required - your daily gift!</li>
                        <li>🎯 <strong>Limited Time:</strong> Claim before next reset!</li>
                    </ul>
                    
                    <button class="free-game-btn" onclick="event.stopPropagation(); window.paywallManager.claimFreeGame('${gameId}', ${JSON.stringify(options)})">
                        🚀 CLAIM & START TOURNAMENT
                    </button>
                    
                    <!-- ENHANCED: Quick action buttons -->
                    <div class="nav-buttons" style="margin-top: 20px;">
                        <button class="nav-btn" onclick="window.location.href='/games/'">🎮 Games</button>
                        <button class="nav-btn" onclick="window.location.href='/'">🏠 Home</button>
                        <button class="nav-btn" onclick="window.paywallManager.showPaymentOptions('${gameId}', ${JSON.stringify(options)})" style="
                            background: rgba(0, 212, 255, 0.2);
                            border-color: #00d4ff;
                            color: #00d4ff;
                        ">💳 More Options</button>
                    </div>
                </div>
                ` : `
                <!-- PAYMENT OPTIONS - GAMES PAGE STYLE -->
                <div class="paywall-header">
                    <div class="netflix-chiclet-title">
                        <div class="chiclet-word">
                            <div class="chiclet neon">N</div>
                            <div class="chiclet neon">E</div>
                            <div class="chiclet neon">O</div>
                            <div class="chiclet neon">N</div>
                        </div>
                        <div class="chiclet-spacer"></div>
                        <div class="chiclet-word">
                            <div class="chiclet drop">D</div>
                            <div class="chiclet drop">R</div>
                            <div class="chiclet drop">O</div>
                            <div class="chiclet drop">P</div>
                        </div>
                    </div>
                    <div class="leaderboard-title neon-title">TOURNAMENT ACCESS</div>
                </div>
                

                
                <div class="payment-options">
                    <!-- GAMES PAGE STYLE: Clickable cards like the games page -->
                    <a href="#" class="payment-option sonic-labs" onclick="event.preventDefault(); window.paywallManager.processPayment('apple-pay', 0.25, {gameId: '${gameId}', type: 'individual-game'})">
                        <div class="payment-option-header">
                            <div class="payment-option-icon" style="background: #000; color: #fff;">🍎</div>
                            <div>
                                <div class="payment-option-title">Apple Pay</div>
                                <div class="payment-option-subtitle">Pay Per Game</div>
                            </div>
                        </div>
                        <div class="payment-option-price">$0.25</div>
                        <ul class="payment-option-features">
                            <li>One game entry</li>
                            <li>Real USDC.E prizes</li>
                            <li>Daily tournament access</li>
                            <li>Leaderboard placement</li>
                        </ul>
                        <div class="payment-button sonic-labs">
                            Pay $0.25 & Play
                        </div>
                        
                        <!-- ENHANCED: Status indicator -->
                        <div style="
                            position: absolute;
                            top: 10px;
                            right: 10px;
                            background: rgba(0, 212, 255, 0.2);
                            color: #00d4ff;
                            padding: 4px 8px;
                            border-radius: 6px;
                            font-size: 10px;
                            font-weight: 600;
                            border: 1px solid rgba(0, 212, 255, 0.3);
                        ">INSTANT</div>
                    </a>
                    
                    <!-- GAMES PAGE STYLE: Clickable cards like the games page -->
                    <a href="#" class="payment-option sonic-labs featured" onclick="event.preventDefault(); window.paywallManager.processPayment('apple-pay', 2.50, {gameId: '${gameId}', type: 'day-pass'})">
                        <div class="payment-option-header">
                            <div class="payment-option-icon" style="background: #00d4ff; color: #000;">💎</div>
                            <div>
                                <div class="payment-option-title">Day Pass</div>
                                <div class="payment-option-subtitle">Best Value</div>
                            </div>
                        </div>
                        <div class="payment-option-price">$2.50</div>
                        <ul class="payment-option-features">
                            <li>Unlimited games today</li>
                            <li>All premium features</li>
                            <li>Best value for 10+ games</li>
                            <li>Resets at 11pm EST</li>
                        </ul>
                        <div class="payment-button sonic-labs">
                            Get Day Pass
                        </div>
                        
                        <!-- ENHANCED: Featured badge and status -->
                        <div style="
                            position: absolute;
                            top: 10px;
                            right: 10px;
                            background: linear-gradient(135deg, #00ff88, #00cc6a);
                            color: #000;
                            padding: 4px 8px;
                            border-radius: 6px;
                            font-size: 10px;
                            font-weight: 700;
                            border: 1px solid rgba(0, 255, 136, 0.5);
                            box-shadow: 0 2px 8px rgba(0, 255, 136, 0.3);
                        ">BEST VALUE</div>
                        
                        <!-- ENHANCED: Savings indicator -->
                        <div style="
                            position: absolute;
                            bottom: 10px;
                            left: 10px;
                            background: rgba(0, 255, 136, 0.15);
                            color: #00ff88;
                            padding: 3px 6px;
                            border-radius: 4px;
                            font-size: 9px;
                            font-weight: 600;
                            border: 1px solid rgba(0, 255, 136, 0.3);
                        ">Save 90% vs 10x $0.25</div>
                    </a>
                </div>
                
                <div class="nav-buttons">
                    <button class="nav-btn" onclick="window.location.href='/games/'">Games</button>
                    <button class="nav-btn" onclick="window.location.href='/'">Home</button>
                </div>
                `}
                
                <div id="payment-status" class="payment-status" style="display: none;"></div>
                
                <div class="paywall-footer">
                    <p>Next free game at 11:15</p>
                </div>
                
                <!-- ENHANCED: Status Indicators and Daily Tracking -->
                <div class="status-indicators" style="
                    margin-top: 30px;
                    padding: 20px;
                    background: rgba(0, 212, 255, 0.05);
                    border: 1px solid rgba(0, 212, 255, 0.2);
                    border-radius: 12px;
                    text-align: center;
                ">
                    <div style="
                        font-size: 16px;
                        color: #00d4ff;
                        margin-bottom: 15px;
                        font-weight: 600;
                    ">🎯 Your Tournament Status</div>
                    
                    <div style="
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 15px;
                        margin-bottom: 20px;
                    ">
                        <div style="
                            background: rgba(0, 255, 136, 0.1);
                            border: 1px solid rgba(0, 255, 136, 0.3);
                            border-radius: 8px;
                            padding: 12px;
                        ">
                            <div style="
                                font-size: 14px;
                                color: #00ff88;
                                font-weight: 600;
                                margin-bottom: 5px;
                            ">🎁 Daily Free Game</div>
                            <div style="
                                font-size: 12px;
                                color: #a0a0a0;
                            ">${hasFreeGame ? 'Available Now!' : 'Used Today'}</div>
                        </div>
                        
                        <div style="
                            background: rgba(255, 193, 7, 0.1);
                            border: 1px solid rgba(255, 193, 7, 0.3);
                            border-radius: 8px;
                            padding: 12px;
                        ">
                            <div style="
                                font-size: 14px;
                                color: #ffc107;
                                font-weight: 600;
                                margin-bottom: 5px;
                            ">⏰ Next Reset</div>
                            <div style="
                                font-size: 12px;
                                color: #a0a0a0;
                            ">11:00 PM EST Daily</div>
                        </div>
                        
                        <div style="
                            background: rgba(138, 43, 226, 0.1);
                            border: 1px solid rgba(138, 43, 226, 0.3);
                            border-radius: 8px;
                            padding: 12px;
                        ">
                            <div style="
                                font-size: 14px;
                                color: #8a2be2;
                                font-weight: 600;
                                margin-bottom: 5px;
                            ">🏆 Tournament</div>
                            <div style="
                                font-size: 12px;
                                color: #a0a0a0;
                            ">Active Now</div>
                        </div>
                    </div>
                    
                    <div style="
                        font-size: 12px;
                        color: #888888;
                        line-height: 1.4;
                    ">
                        <strong>💡 Pro Tip:</strong> Day Pass gives you unlimited games for just $2.50 - perfect if you plan to play more than 10 times today!
                    </div>
                </div>
            </div>
        </div>
        `;
        
        document.body.appendChild(paywallSection);
        
        // ENHANCED: Start countdown timer for free game card
        if (hasFreeGame) {
            this.startCountdownTimer();
        }
        
        // GAMES PAGE APPROACH: No background click handlers - cards are fully clickable
        // No problematic overlay system that can cause black screens
    }
    
    // ENHANCED: Countdown timer for daily reset
    startCountdownTimer() {
        const countdownElement = document.getElementById('countdown-timer');
        if (!countdownElement) return;
        
        const updateCountdown = () => {
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(23, 0, 0, 0); // 11:00 PM EST
            
            const timeDiff = tomorrow - now;
            
            if (timeDiff > 0) {
                const hours = Math.floor(timeDiff / (1000 * 60 * 60));
                const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
                
                countdownElement.textContent = `${hours}h ${minutes}m ${seconds}s`;
                
                // Add urgency styling when less than 1 hour remaining
                if (hours < 1) {
                    countdownElement.style.color = '#ff6b6b';
                    countdownElement.style.animation = 'pulse 1s infinite';
                }
            } else {
                countdownElement.textContent = 'RESET NOW!';
                countdownElement.style.color = '#ff4444';
                countdownElement.style.animation = 'pulse 0.5s infinite';
            }
        };
        
        // Update immediately and then every second
        updateCountdown();
        setInterval(updateCountdown, 1000);
        
        // Add pulse animation CSS
        if (!document.getElementById('countdown-css')) {
            const style = document.createElement('style');
            style.id = 'countdown-css';
            style.textContent = `
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Hide the paywall
     */
    hidePaywall() {
        const paywallSection = document.getElementById('paywall-section');
        if (paywallSection) {
            paywallSection.remove();
        }
        this.isVisible = false;
        this.pendingGameStart = null;
    }

    /**
     * Start game directly (bypasses paywall)
     */
    async startGameDirectly(gameId, options = {}) {
        // console.log('🚀 Starting game directly:', { gameId, options });
        
        // Check if this is a free game and mark it as used
        if (options.isFreeGame && this.identityManager) {
            const playerId = this.identityManager.getPlayerId();
            if (playerId) {
                try {
                    
                    await this.markFreeGameAsUsed(playerId);
                    
                    // Clear cache so next check will reflect the used free game
                    this.clearPlayerStatusCache();
                } catch (error) {
                    console.error('❌ Failed to mark free game as used:', error);
                }
            }
        }
        
        // Hide paywall if visible
        this.hidePaywall();
        
        // Trigger game start event
        if (window.neonDrop && window.neonDrop.eventBus) {
            window.neonDrop.eventBus.emit('game:start', { gameId, options });
        } else if (window.eventBus) {
            window.eventBus.emit('game:start', { gameId, options });
        }
        
        // Try multiple game start methods with better error handling
        try {
            if (window.startNeonDropGame) {
                
                const result = await window.startNeonDropGame();
                if (result) {
                    // console.log('✅ Game started successfully via startNeonDropGame');
                    return;
                }
            }
            
            if (window.blockZoneInstantPlay && window.blockZoneInstantPlay.startGame) {
                
                window.blockZoneInstantPlay.startGame(gameId);
                return;
            }
            
            if (window.handlePlayNowClick) {
                
                window.handlePlayNowClick(gameId);
                return;
            }
            
            if (window.startGame) {
                
                const result = await window.startGame();
                if (result) {
                    // console.log('✅ Game started successfully via startGame');
                    return;
                }
            }
            
            // If none of the above worked, try to create a new game instance directly
            
            if (window.NeonDrop) {
                const game = new window.NeonDrop();
                await game.initialize();
                window.neonDrop = game;
                // console.log('✅ Game instance created directly');
                return;
            }
            
            console.error('❌ No game start method available');
            // Fallback: try to navigate to game page
            if (gameId === 'neondrop') {
                // console.log('🔄 Falling back to page navigation');
                window.location.href = '/games/neondrop/';
            }
            
        } catch (error) {
            console.error('❌ Error starting game:', error);
            // Try fallback navigation
            if (gameId === 'neondrop') {
                // console.log('🔄 Error occurred, falling back to page navigation');
                window.location.href = '/games/neondrop/';
            }
        }
    }

    /**
     * Show identity required message
     */
    showIdentityRequired() {
        //  // Removed for production performance
        
        // Hide paywall if visible
        this.hidePaywall();
        
        // Always redirect to game page for proper identity setup
        window.location.href = '/games/neondrop/';
    }

    /**
     * Claim free game and start tournament
     */
    async claimFreeGame(gameId, options = {}) {
        // // console.log('🎁 CLAIMING FREE GAME:', { gameId, options }); // Removed for production performance
        
        try {
            // Show claiming animation
            const btn = event.target;
            const originalText = btn.textContent;
            btn.textContent = '🎮 CLAIMING...';
            btn.disabled = true;
            
            // Add claiming animation
            btn.style.background = 'linear-gradient(135deg, #00cc6a 0%, #00994d 100%)';
            btn.style.transform = 'scale(0.95)';
            
            // Simulate claiming process
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Start game with free game flag
            await this.startGameDirectly(gameId, { 
                ...options, 
                isFreeGame: true,
                claimed: true 
            });
            
        } catch (error) {
            console.error('❌ Failed to claim free game:', error);
            
            // Reset button state
            const btn = event.target;
            btn.textContent = '🎮 CLAIM & START TOURNAMENT';
            btn.disabled = false;
            btn.style.background = 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)';
            btn.style.transform = 'scale(1)';
        }
    }
    
    /**
     * Quick bypass to game - no payment processing, just start the game
     */
    quickBypassToGame(gameId = 'neondrop', options = {}) {
        // // console.log('⚡ QUICK BYPASS: Going straight to game without payment processing'); // Removed for production performance
        
        // Disable performance analyzer to prevent interference
        if (window.disablePerformanceAnalyzer) {
            // console.log('🔧 Disabling performance analyzer for quick bypass...');
            window.disablePerformanceAnalyzer();
        } else if (window.PerformanceAnalyzer) {
            // console.log('🔧 Disabling performance analyzer for quick bypass...');
            // Remove performance analyzer hooks
            if (window.globalTimings) {
                delete window.globalTimings;
            }
            if (window.timeStart) {
                delete window.timeStart;
            }
            if (window.timeEnd) {
                delete window.timeEnd;
            }
            // Disable performance monitoring
            if (window.metricsCollector) {
                delete window.metricsCollector;
            }
            
            // Restore original window.neonDrop property if it was overridden
            if (window._neonDrop) {
                // console.log('🔧 Restoring original neonDrop property...');
                Object.defineProperty(window, 'neonDrop', {
                    value: window._neonDrop,
                    writable: true,
                    configurable: true
                });
                delete window._neonDrop;
            }
            
            // Restore original requestAnimationFrame if it was overridden
            if (window._originalRequestAnimationFrame) {
                // console.log('🔧 Restoring original requestAnimationFrame...');
                window.requestAnimationFrame = window._originalRequestAnimationFrame;
                delete window._originalRequestAnimationFrame;
            }
        }
        
        // Hide paywall immediately
        this.hidePaywall();
        
        // Start game directly with provided parameters
        this.startGameDirectly(gameId, options);
    }
    
    /**
     * Process payment: Apple Pay → Landing Wallet → Sonic Labs → USDC.E
     * Complete infrastructure ready for real payment integration
     */
    async processPayment(paymentMethod, amount, options = {}) {
        const environment = this.detectEnvironment();
        console.log(`💳 Processing payment: ${paymentMethod} for $${amount} in ${environment} environment`);
        
        // Show processing status
        this.showPaymentStatus('processing', 'Processing payment...');
        
        try {
            // 1. Validate payment method (Apple Pay only for now)
            if (paymentMethod !== 'apple-pay') {
                throw new Error('Only Apple Pay is currently supported');
            }
            
            // 2. Check player eligibility and get wallet address
            const playerId = this.identityManager?.getPlayerId();
            if (!playerId) {
                throw new Error('Player not authenticated');
            }
            
            // Get player's landing wallet address
            const walletAddress = await this.getPlayerWalletAddress(playerId);
            if (!walletAddress) {
                throw new Error('Player wallet not found');
            }
            
            // 3. Validate amount (must match contract amounts)
            if (!this.validatePaymentAmount(amount)) {
                throw new Error('Invalid payment amount');
            }
            
            // 4. Check for duplicate payments
            if (await this.checkDuplicatePayment(playerId, amount)) {
                throw new Error('Duplicate payment detected');
            }
            
            // 5. Environment-specific payment processing
            if (environment === 'production') {
                // REAL PAYMENT FLOW: Apple Pay → Landing Wallet → Sonic Labs → USDC.E
                console.log('🌐 PRODUCTION: Processing real payment via Sonic Network');
                const result = await this.processRealPayment(paymentMethod, amount, options, walletAddress);
                return result;
                
            } else if (environment === 'test') {
                // TEST PAYMENT FLOW: Simulate full Apple Pay → USDC.E flow
                console.log('🧪 TEST: Simulating Apple Pay → Sonic Labs → USDC.E flow');
                const result = await this.simulatePayment(paymentMethod, amount, options, walletAddress);
                return result;
                
            } else {
                // DEVELOPMENT: Bypass payment but log everything
                console.log('🛠️ DEVELOPMENT: Bypassing payment for development');
                const result = await this.bypassPayment(paymentMethod, amount, options, walletAddress);
                return result;
            }
            
        } catch (error) {
            console.error('❌ Payment processing failed:', error);
            this.showPaymentStatus('error', error.message);
            throw error;
        }
    }
    
    /**
     * Get player's landing wallet address from IdentityManager
     */
    async getPlayerWalletAddress(playerId) {
        try {
            // Get wallet address from IdentityManager
            const player = this.identityManager?.getCurrentPlayer();
            if (player && player.walletAddress) {
                // // console.log(`🔗 Found player wallet: ${player.walletAddress}`); // Removed for production performance
                return player.walletAddress;
            }
            
            // Check if we're in test/development mode
            const environment = this.detectEnvironment();
            if (environment !== 'production') {
                // Generate a test wallet address for development/testing
                const testWalletAddress = `0x${playerId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 40)}`;
                // // console.log(`🧪 Using test wallet address: ${testWalletAddress}`); // Removed for production performance
                return testWalletAddress;
            }
            
            // Production: try to get from backend
            //  // Removed for production performance
            const response = await fetch(`${this.identityManager.apiBase}/api/players/${playerId}/wallet`);
            if (response.ok) {
                const data = await response.json();
                // // console.log(`🔗 Retrieved wallet from backend: ${data.walletAddress}`); // Removed for production performance
                return data.walletAddress;
            }
            
            throw new Error('Wallet address not found');
        } catch (error) {
            console.error('❌ Failed to get wallet address:', error);
            
            // Final fallback: generate a wallet address for testing
            const environment = this.detectEnvironment();
            if (environment !== 'production') {
                const fallbackWallet = `0x${playerId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 40)}`;
                // // console.log(`🔄 Using fallback wallet address: ${fallbackWallet}`); // Removed for production performance
                return fallbackWallet;
            }
            
            return null;
        }
    }
    
    /**
     * Show payment status in UI
     */
    showPaymentStatus(status, message) {
        const statusElement = document.getElementById('payment-status');
        if (statusElement) {
            statusElement.className = `payment-status ${status}`;
            statusElement.textContent = message;
            statusElement.style.display = 'block';
        }
    }
    
    /**
     * Validate payment method (Apple Pay only for now)
     */
    validatePaymentMethod(paymentMethod) {
        const validMethods = ['apple-pay']; // Only Apple Pay supported initially
        const isValid = validMethods.includes(paymentMethod);
        // // console.log(`🔍 Payment method validation: ${paymentMethod} - ${isValid ? 'VALID' : 'INVALID'}`); // Removed for production performance
        return isValid;
    }
    
    /**
     * Validate payment amount
     */
    validatePaymentAmount(amount) {
        // Allow $0.25 for individual games and $2.50 for day pass
        const validAmounts = [0.25, 2.50];
        const isValid = validAmounts.includes(amount);
        // // console.log(`🔍 Payment amount validation: $${amount} - ${isValid ? 'VALID' : 'INVALID'}`); // Removed for production performance
        return isValid;
    }
    
    /**
     * Check for duplicate payments
     */
    async checkDuplicatePayment(playerId, amount) {
        // TODO: Implement duplicate payment detection
        // // console.log(`🔍 Duplicate payment check for player ${playerId}, amount $${amount}`); // Removed for production performance
        return false; // No duplicates for now
    }
    
    /**
     * Process real payment: Apple Pay → Landing Wallet → Sonic Labs → USDC.E
     * This is where you'll integrate with real Apple Pay and Sonic Labs
     */
    async processRealPayment(paymentMethod, amount, options, walletAddress) {
        // // console.log(`🌐 Processing real payment: ${paymentMethod} for $${amount} to ${walletAddress}`); // Removed for production performance
        
        try {
            // 1. Create payment request with Sonic Labs
            const paymentRequest = await this.createSonicLabsPaymentRequest(amount, walletAddress, options);
            // // console.log('🔗 Sonic Labs payment request created:', paymentRequest.id); // Removed for production performance
            
            // 2. Process Apple Pay payment
            const applePayResult = await this.processApplePayPayment(amount, paymentRequest);
            // // console.log('🍎 Apple Pay payment processed:', applePayResult); // Removed for production performance
            
            // 3. Transfer USDC.E to player's landing wallet via Sonic Labs
            const usdcTransfer = await this.transferUsdcToPlayer(walletAddress, amount, paymentRequest.id);
            // // console.log('💰 USDC.E transferred to player:', usdcTransfer); // Removed for production performance
            
            // 4. Update player status in backend
            await this.updatePlayerPaymentStatus(amount, options.type);
            // // console.log('✅ Player payment status updated'); // Removed for production performance
            
            // 5. Start game
            this.showPaymentStatus('success', 'Payment successful! Starting game...');
            await this.startGameDirectly(options.gameId, { ...options, paymentCompleted: true });
            
            return {
                success: true,
                paymentId: paymentRequest.id,
                transactionHash: usdcTransfer.transactionHash,
                amount: amount
            };
            
        } catch (error) {
            console.error('❌ Real payment processing failed:', error);
            throw error;
        }
    }
    
    /**
     * Create payment request with Sonic Labs
     */
    async createSonicLabsPaymentRequest(amount, walletAddress, options) {
        // TODO: Integrate with SonicLabsService
        // // console.log('🔗 Creating Sonic Labs payment request...'); // Removed for production performance
        
        // For now, simulate the request
        const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
        return {
            id: paymentId,
            amount: amount * 10**6, // Convert to USDC decimals
            walletAddress: walletAddress,
            status: 'pending'
        };
    }
    
    /**
     * Process Apple Pay payment
     */
    async processApplePayPayment(amount, paymentRequest) {
        // TODO: Integrate with real Apple Pay
        // // console.log('🍎 Processing Apple Pay payment...'); // Removed for production performance
        
        // For now, simulate Apple Pay processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return {
            success: true,
            transactionId: `apple_${Date.now()}`,
            amount: amount
        };
    }
    
    /**
     * Transfer USDC.E to player's landing wallet
     */
    async transferUsdcToPlayer(walletAddress, amount, paymentId) {
        // TODO: Integrate with PaymentProcessor.sol contract
        // // console.log('💰 Transferring USDC.E to player wallet...'); // Removed for production performance
        
        // For now, simulate the transfer
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return {
            success: true,
            transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
            amount: amount,
            walletAddress: walletAddress
        };
    }
    
    /**
     * Update player payment status in backend
     */
    async updatePlayerPaymentStatus(amount, paymentType) {
        const playerId = this.identityManager?.getPlayerId();
        if (!playerId) return;
        
        try {
            const response = await fetch(`${this.identityManager.apiBase}/api/players/${playerId}/payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: amount,
                    type: paymentType,
                    timestamp: new Date().toISOString()
                })
            });
            
            if (response.ok) {
                // // console.log('✅ Player payment status updated in backend'); // Removed for production performance
                // Clear cache to ensure fresh status
                this.clearPlayerStatusCache();
            }
        } catch (error) {
            console.error('❌ Failed to update player payment status:', error);
        }
    }
    
    /**
     * Simulate payment (test environment)
     */
    async simulatePayment(paymentMethod, amount, options, walletAddress) {
        console.log(`🧪 Simulating Apple Pay → Sonic Labs → USDC.E flow: $${amount} to ${walletAddress}`);
        
        // Simulate the complete payment flow
        this.showPaymentStatus('processing', 'Simulating Apple Pay payment...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        this.showPaymentStatus('processing', 'Processing through Sonic Labs...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        this.showPaymentStatus('processing', 'Transferring USDC.E to wallet...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simulate success
        this.showPaymentStatus('success', 'Payment simulation successful! Starting game...');
        await this.startGameDirectly(options.gameId, { ...options, paymentCompleted: true });
        
        const result = {
            success: true,
            simulated: true,
            amount: amount,
            walletAddress: walletAddress,
            transactionId: `test_${Date.now()}`,
            paymentMethod: paymentMethod,
            timestamp: new Date().toISOString()
        };
        
        console.log('✅ Test payment simulated successfully:', result);
        return result;
    }
    
    /**
     * Bypass payment (development environment)
     */
    async bypassPayment(paymentMethod, amount, options) {
        // // console.log(`🎮 Bypassing payment: ${paymentMethod} for $${amount} (dev mode); // Removed for production performance`);
        
        // Log everything but don't process
        const result = {
            success: true,
            transactionId: `dev_${Date.now()}`,
            amount: amount,
            paymentMethod: paymentMethod,
            timestamp: new Date().toISOString(),
            bypassed: true
        };
        
        // // console.log('✅ Payment bypassed (dev mode); // Removed for production performance:', result);
        return result;
    }

    /**
     * Environment detection - single source of truth
     */
    detectEnvironment() {
        const hostname = window.location.hostname;
        const search = window.location.search;
        const urlParams = new URLSearchParams(search);
        
        // Check for explicit environment flags (URL parameters take priority)
        const explicitTest = urlParams.get('testmode') === 'true';
        const explicitDev = urlParams.get('dev') === 'true';
        const explicitProd = urlParams.get('prod') === 'true';
        
        // Check localStorage flags
        const localStorageTest = localStorage.getItem('applePayTestMode') === 'true';
        const localStorageDev = localStorage.getItem('devMode') === 'true';
        
        // Check global flags
        const globalTest = window.APPLE_PAY_TEST_MODE === true;
        const globalDev = window.isDevelopment === true;
        
        // ENABLE TEST MODE ON MAIN DOMAIN FOR FRIEND TESTING
        // Set this to true to enable animated payment bypass on blockzonelab.com
        const ENABLE_TEST_MODE_ON_MAIN = true; // 🎯 SIMPLE TOGGLE HERE
        
        // Environment detection logic (URL parameters take highest priority)
        if (explicitTest || localStorageTest || globalTest || (ENABLE_TEST_MODE_ON_MAIN && hostname.includes('blockzonelab.com'))) {
            // Show test mode indicator if on main domain
            if (hostname.includes('blockzonelab.com') && (explicitTest || ENABLE_TEST_MODE_ON_MAIN)) {
                this.showTestModeIndicator();
            }
            return 'test';
        }
        
        if (explicitDev || localStorageDev || globalDev || hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'development';
        }
        
        if (explicitProd || hostname.includes('blockzonelab.com')) {
            return 'production';
        }
        
        if (hostname.includes('pages.dev')) {
            return 'test';
        }
        
        // Default to test for safety
        return 'test';
    }
    
    /**
     * Show test mode indicator when using testmode=true on main domain
     */
    showTestModeIndicator() {
        // Remove existing indicator if present
        const existingIndicator = document.getElementById('test-mode-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        // Create test mode indicator
        const indicator = document.createElement('div');
        indicator.id = 'test-mode-indicator';
        indicator.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: linear-gradient(90deg, #ff6b35, #f7931e);
                color: white;
                text-align: center;
                padding: 8px;
                font-size: 14px;
                font-weight: bold;
                z-index: 10000;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            ">
                🎮 TEST MODE - Play with animated payment bypass (no real money)
                <button onclick="this.parentElement.remove()" style="
                    background: rgba(255,255,255,0.2);
                    border: none;
                    color: white;
                    margin-left: 10px;
                    padding: 2px 8px;
                    border-radius: 3px;
                    cursor: pointer;
                ">×</button>
            </div>
        `;
        
        document.body.appendChild(indicator);
        
        // Auto-remove after 15 seconds (longer for friends)
        setTimeout(() => {
            if (indicator.parentElement) {
                indicator.remove();
            }
        }, 15000);
    }
    
    /**
     * Test mode detection (legacy - use detectEnvironment instead)
     */
    isTestMode() {
        return this.detectEnvironment() === 'test';
    }
    
    /**
     * Clear player status cache and sync with PlayerProfile
     */
    clearPlayerStatusCache() {
        // // console.log('🔄 Clearing player status cache'); // Removed for production performance
        this.sessionCache.playerStatus = null;
        this.sessionCache.cachedAt = null;
        this.sessionCache.playerId = null;
        this.sessionCache.lastGameAction = null;
        this.sessionCache.pendingRequests.clear();
        
        // PERFORMANCE OPTIMIZATION: Sync cache invalidation with PlayerProfile
        if (window.playerProfile && typeof window.playerProfile.invalidateCache === 'function') {
            try {
                // // console.log('🔄 Syncing cache invalidation with PlayerProfile'); // Removed for production performance
                window.playerProfile.invalidateCache(['status']);
            } catch (error) {
                // // console.log('⚠️ Failed to sync cache invalidation with PlayerProfile:', error.message); // Removed for production performance
            }
        }
        
        // // console.log('💰 Player status cache cleared - will fetch fresh status next time'); // Removed for production performance
    }
    
    /**
     * Check if cache should be refreshed
     */
    shouldRefreshCache() {
        const now = Date.now();
        const currentPlayerId = this.identityManager?.getCurrentPlayer()?.id;
        
        return !this.sessionCache.playerStatus ||
               !this.sessionCache.cachedAt ||
               (now - this.sessionCache.cachedAt) >= this.sessionCache.validFor ||
               this.sessionCache.playerId !== currentPlayerId;
    }
    
    /**
     * Warm up cache proactively for better performance
     */
    async warmUpCache() {
        try {
            const playerId = this.identityManager?.getPlayerId();
            if (!playerId) return;
            
            // // console.log('🔥 Warming up player status cache...'); // Removed for production performance
            const startTime = performance.now();
            
            // Pre-fetch player status to warm up both caches
            await this.getPlayerStatusFromBackend();
            
            const duration = performance.now() - startTime;
            // // console.log(`🔥 Cache warm-up completed in ${duration.toFixed(2); // Removed for production performance}ms`);
            
        } catch (error) {
            // // console.log('⚠️ Cache warm-up failed:', error.message); // Removed for production performance
        }
    }
    
    /**
     * Get cache performance metrics
     */
    getCacheMetrics() {
        const totalRequests = this.sessionCache.cacheHits + this.sessionCache.cacheMisses;
        const hitRate = totalRequests > 0 ? (this.sessionCache.cacheHits / totalRequests * 100).toFixed(1) : 0;
        
        return {
            hits: this.sessionCache.cacheHits,
            misses: this.sessionCache.cacheMisses,
            hitRate: `${hitRate}%`,
            totalRequests,
            lastCacheWarm: this.sessionCache.lastCacheWarm
        };
    }
    
    /**
     * Toggle test mode for development (call from browser console)
     * Usage: window.paywallManager.toggleTestMode()
     */
    toggleTestMode() {
        const currentTestMode = localStorage.getItem('applePayTestMode') === 'true';
        const newTestMode = !currentTestMode;
        
        localStorage.setItem('applePayTestMode', newTestMode.toString());
        
        // Clear cache to force re-detection
        this.clearPlayerStatusCache();
        
        // Show indicator if enabling test mode on main domain
        if (newTestMode && window.location.hostname.includes('blockzonelab.com')) {
            this.showTestModeIndicator();
        }
        
        console.log(`🧪 Test mode ${newTestMode ? 'ENABLED' : 'DISABLED'}`);
        console.log(`🌍 Current environment: ${this.detectEnvironment()}`);
        
        // Reload page to apply changes
        if (confirm(`Test mode ${newTestMode ? 'enabled' : 'disabled'}. Reload page to apply changes?`)) {
            window.location.reload();
        }
    }
    
    /**
     * Get current environment status for debugging
     */
    getEnvironmentStatus() {
        const environment = this.detectEnvironment();
        const hostname = window.location.hostname;
        const urlParams = new URLSearchParams(window.location.search);
        
        return {
            environment,
            hostname,
            urlTestMode: urlParams.get('testmode') === 'true',
            localStorageTestMode: localStorage.getItem('applePayTestMode') === 'true',
            globalTestMode: window.APPLE_PAY_TEST_MODE === true,
            isMainDomain: hostname.includes('blockzonelab.com'),
            isDevPages: hostname.includes('pages.dev'),
            isLocalhost: hostname === 'localhost' || hostname === '127.0.0.1'
        };
    }
}
