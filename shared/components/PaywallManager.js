/**
 * PaywallManager - Handles payment processing and game access control for BlockZone Lab
 * 
 * Features:
 * - Clean, modern UI with smooth animations
 * - Test mode for development
 * - Sonic Labs integration ready
 * - Session-based caching for performance
 */

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
        this.lastDecision = null;
        this.lastDecisionTime = 0;
        
        // Session cache for performance
        this.sessionCache = {
            playerStatus: null,
            cachedAt: null,
            validFor: 5 * 60 * 1000, // 5 minutes
            lastGameAction: null,
            playerId: null,
            sessionDecisions: new Map()
        };
        
        // Make it globally accessible
        window.paywallManager = this;
        globalPaywallManager = this;
    }

    /**
     * Initialize the paywall manager
     */
    async initialize(identityManager) {
        this.identityManager = identityManager;
        
        // Initialize session cache
        this.sessionCache = {
            playerStatus: null,
            cachedAt: null,
            playerId: null,
            validFor: 300000, // 5 minutes
            sessionDecisions: new Map(),
            pendingRequests: new Map(),
            cacheHits: 0,
            cacheMisses: 0,
            lastCacheWarm: null
        };
        
        // Get PlayerProfile singleton
        if (window.globalPlayerProfile) {
            this.playerProfile = window.globalPlayerProfile;
        } else if (window.playerProfile) {
            this.playerProfile = window.playerProfile;
        } else {
            // Try to get it later when needed
            setTimeout(() => {
                if (window.globalPlayerProfile) {
                    this.playerProfile = window.globalPlayerProfile;
                }
            }, 1000);
        }
        
        // Warm up cache after initialization
        setTimeout(() => {
            this.warmUpCache();
        }, 100); // Small delay to ensure identity is ready
        
        // // console.log('✅ PaywallManager initialized successfully'); // Removed for production performance
    }

    /**
     * Intercept game start and show paywall if needed
     */
    async interceptGameStart(gameId = 'neondrop', options = {}) {
        const now = Date.now();
        const sessionKey = `paywall_session_${gameId}`;
        
        // Check for existing session decision (valid for 30 minutes)
        if (this.sessionCache.sessionDecisions.has(sessionKey)) {
            const sessionDecision = this.sessionCache.sessionDecisions.get(sessionKey);
            const timeSinceDecision = now - sessionDecision.timestamp;
            
            if (timeSinceDecision < 30 * 60 * 1000) {
                return sessionDecision.allowed;
            }
        }
        
        // Check for recent cached decision (within 5 seconds)
        if (this.lastDecision && (now - this.lastDecisionTime) < 5000) {
            return this.lastDecision;
        }
        
        // Development mode bypass
        if (this.isTestMode()) {
            console.log('🔧 TEST MODE: Bypassing paywall');
            return true;
        }
        
        // Check if we need to show the paywall
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('bypass') === 'true') {
            // // console.log('🚀 BYPASS MODE: Skipping paywall entirely for game testing'); // Removed for production performance
            return true;
        }
        
        // Get player status from backend
        const playerStatus = await this.getPlayerStatusFromBackend();
        //  // Removed for production performance
        
        // ENVIRONMENT DETECTION: Single source of truth for environment
        const environment = this.detectEnvironment();
        // // console.log(`🌍 Environment detected: ${environment}`); // Removed for production performance
        
        // TEST MODE: Full paywall logic but minimal payment processing
        if (environment === 'test') {
            // // console.log('🧪 Test mode detected - running full paywall logic with minimal payment processing'); // Removed for production performance
            if (playerStatus && playerStatus.can_play_free) {
                // // console.log('🧪 Player has free game - going directly to game'); // Removed for production performance
                await this.startGameDirectly(gameId, { ...options, isFreeGame: true });
                return true;
            }
            // // console.log('🧪 No free game available - showing payment cards (test mode); // Removed for production performance');
            this.showPaymentOptions(gameId, options, playerStatus);
            return false;
        }
        
        // DEVELOPMENT: Show paywall but allow easy bypass
        if (environment === 'development') {
            //  // Removed for production performance
            if (playerStatus && playerStatus.can_play_free) {
                //  // Removed for production performance
                await this.startGameDirectly(gameId, { ...options, isFreeGame: true });
                return true;
            }
            // Show paywall in development mode (don't bypass entirely)
            // console.log('🔧 DEV MODE: Showing paywall for testing');
        }
        
        // PRODUCTION: Full paywall logic with real payment processing
        if (environment === 'production') {
            // // console.log('🌐 Production environment detected - full paywall logic enabled'); // Removed for production performance
        }
        
        // Ensure IdentityManager is ready
        if (!this.identityManager || !this.identityManager.isReady()) {
            //  // Removed for production performance
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            if (!this.identityManager || !this.identityManager.isReady()) {
                //  // Removed for production performance
                this.showIdentityRequired();
                return false;
            }
        }
        
        // Show welcome message first (if returning player)
        if (playerStatus && playerStatus.player_id) {
            await this.showWelcomeMessage(playerStatus);
        }
        
        // DEFAULT BEHAVIOR: Show paywall with payment cards
        let decision = false;
        
        if (playerStatus.has_unlimited_pass) {
            // Day pass buyer - go directly to game
            // // console.log('✅ Day pass buyer - going directly to game'); // Removed for production performance
            await this.startGameDirectly(gameId, options);
            decision = true;
        } else if (playerStatus.can_play_free) {
            // Free game available - go directly to game
            // // console.log('✅ Free game available - going directly to game'); // Removed for production performance
            await this.startGameDirectly(gameId, { ...options, isFreeGame: true });
            decision = true;
        } else {
            // Show paywall with payment cards
            // // console.log('💰 DEFAULT: Showing paywall with payment cards'); // Removed for production performance
            this.showPaymentOptions(gameId, options, playerStatus);
            decision = false;
        }
        
        // SESSION-BASED CACHING: Store decision for entire game session
        this.lastDecision = decision;
        this.lastDecisionTime = Date.now();
        
        // Store session decision (valid for 30 minutes)
        this.sessionCache.sessionDecisions.set(sessionKey, {
            allowed: decision,
            timestamp: now,
            playerStatus: playerStatus
        });
        
        //  // Removed for production performance
        
        return decision;
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
        // Simple welcome message - can be enhanced later
        // // console.log('👤 Welcome back, player!'); // Removed for production performance
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
                
                .processing-indicator {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    font-size: 14px;
                    color: #fff;
                }
                
                .spinner {
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-radius: 50%;
                    border-top-color: #fff;
                    animation: spin 1s ease-in-out infinite;
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
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
                    
                    <div class="tournament-cycle">
                        <strong>🏆 Daily Tournament Cycle</strong><br>
                        Resets daily at 11:00 PM EST
                    </div>
                    
                    <ul class="free-game-features">
                        <li>Full tournament entry with real USDC.E prizes</li>
                        <li>Complete leaderboard access and ranking</li>
                        <li>All premium game features included</li>
                        <li>No payment required - your daily gift!</li>
                    </ul>
                    
                    <button class="free-game-btn" onclick="event.stopPropagation(); window.paywallManager.claimFreeGame('${gameId}', ${JSON.stringify(options)})">
                        CLAIM & START TOURNAMENT
                    </button>
                    
                    <div class="nav-buttons">
                        <button class="nav-btn" onclick="window.location.href='/games/'">Games</button>
                        <button class="nav-btn" onclick="window.location.href='/'">Home</button>
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
                    <!-- PAYMENT OPTIONS - GAMES PAGE STYLE -->
                <div class="payment-options">
                    <div class="payment-option apple-pay" id="pay-option-single" data-amount="0.25" data-type="individual-game">
                        <div class="payment-option-header">
                            <div class="payment-option-icon" style="background: #000; color: #fff;">🍎</div>
                            <div>
                                <div class="payment-option-title">Apple Pay</div>
                                <div class="payment-option-subtitle">Pay Per Game</div>
                            </div>
                        </div>
                        <div class="payment-option-price">$0.25</div>
                        <div class="payment-option-features">
                            <li>One game entry</li>
                            <li>Real USDC.E prizes</li>
                            <li>Daily tournament access</li>
                            <li>Leaderboard placement</li>
                        </div>
                        <div class="payment-button apple-pay" id="pay-button-single">
                            <span class="button-text">Pay $0.25 & Play</span>
                            <div class="processing-indicator" style="display: none;">
                                <div class="spinner"></div>
                                Processing...
                            </div>
                        </div>
                    </div>
                    
                    <!-- GAMES PAGE STYLE: Clickable cards like the games page -->
                    <div class="payment-option sonic-labs featured" id="pay-option-daypass" data-amount="2.50" data-type="day-pass">
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
                        <div class="payment-button sonic-labs" id="pay-button-daypass">
                            <span class="button-text">Get Day Pass</span>
                            <div class="processing-indicator" style="display: none;">
                                <div class="spinner"></div>
                                Processing...
                            </div>
                        </div>
                    </div>
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
            </div>
        </div>
        `;
        
        document.body.appendChild(paywallSection);
        
        // GAMES PAGE APPROACH: No background click handlers - cards are fully clickable
        // No problematic overlay system that can cause black screens
        
        // Add event listeners
        const overlay = document.getElementById('paywall-overlay');
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.hidePaywall();
            }
        });
        
        // Add click handlers for payment options
        const paymentOptions = overlay.querySelectorAll('.payment-option');
        paymentOptions.forEach(option => {
            option.addEventListener('click', async (e) => {
                if (e.target.closest('.payment-button')) {
                    const button = e.target.closest('.payment-button');
                    const buttonText = button.querySelector('.button-text');
                    const processingIndicator = button.querySelector('.processing-indicator');
                    
                    // Show processing state
                    buttonText.style.display = 'none';
                    processingIndicator.style.display = 'flex';
                    button.disabled = true;
                    
                    // Simulate payment processing
                    try {
                        const amount = parseFloat(option.dataset.amount);
                        const type = option.dataset.type;
                        
                        // Show processing animation
                        await new Promise(resolve => setTimeout(resolve, 1500));
                        
                        // Start the game
                        this.startGameDirectly(gameId, { 
                            paymentType: type,
                            amount: amount,
                            isFreeGame: false
                        });
                        
                    } catch (error) {
                        console.error('Payment failed:', error);
                        // Reset button state
                        buttonText.style.display = 'block';
                        processingIndicator.style.display = 'none';
                        button.disabled = false;
                        
                        // Show error message
                        const status = document.getElementById('payment-status');
                        if (status) {
                            status.textContent = 'Payment failed. Please try again.';
                            status.style.display = 'block';
                        }
                    }
                }
            });
        });
    }
    
    /**
     * Check if running in test mode
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
