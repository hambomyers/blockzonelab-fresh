
// Simple performance cache
const simpleCache = new Map();
const cacheTTL = 5 * 60 * 1000; // 5 minutes

function getCached(key) {
  const cached = simpleCache.get(key);
  if (cached && Date.now() - cached.timestamp < cacheTTL) {
    return cached.data;
  }
  return null;
}

function setCached(key, data) {
  simpleCache.set(key, { data, timestamp: Date.now() });
}

/**
 * PlayerProfile.js - Single Source of Truth for All Player Data
 * 
 * Comprehensive data hub that aggregates all backend player data:
 * - Core identity and wallet info
 * - Gaming statistics and achievements  
 * - Current tournament status
 * - Educational progress
 * - Payment history and status
 * - Leaderboard data and rankings
 * - Real-time data synchronization
 * - Event-driven updates
 * - Smart caching with invalidation
 * OPTIMIZED: Lazy initialization for better performance
 */

export class PlayerProfile {
    constructor() {
        // PERFORMANCE OPTIMIZATION: Lightweight constructor, no API calls
        this.profile = null;
        this.playerStatus = null;
        this.leaderboardData = null;
        this.paymentHistory = null;
        this.loading = false;
        this.error = null;
        this.apiBase = 'https://api.blockzonelab.com';
        
        // Lazy initialization state
        this.initialized = false;
        this.initPromise = null;
        
        // Event system for real-time updates
        this.eventListeners = {
            statusChanged: [],
            paymentUpdated: [],
            leaderboardUpdated: [],
            statsUpdated: [],
            profileUpdated: []
        };
        
        // Caching system
        this.cache = {
            profile: { data: null, timestamp: 0, ttl: 300000 }, // 5 minutes
            status: { data: null, timestamp: 0, ttl: 60000 },   // 1 minute
            leaderboard: { data: null, timestamp: 0, ttl: 120000 }, // 2 minutes
            payments: { data: null, timestamp: 0, ttl: 300000 } // 5 minutes
        };
        
        // Auto-refresh intervals
        this.refreshIntervals = {
            status: null,
            leaderboard: null
        };
        
        // // console.log($2); // Removed for performance');
    }

    // PERFORMANCE OPTIMIZATION: Ensure initialization before any API calls
    async ensureInitialized() {
        if (this.initialized) return;
        if (this.initPromise) return this.initPromise;
        
        this.initPromise = this._initialize();
        return this.initPromise;
    }

    // PERFORMANCE OPTIMIZATION: Move all initialization logic here
    async _initialize() {
        try {
            // // console.log($2); // Removed for performance
            
            // Check for existing player data and greet personally
            await this.checkForExistingPlayerAndGreet();
            
            this.initialized = true;
            // // console.log($2); // Removed for performance
            
        } catch (error) {
            console.error('❌ PlayerProfile: Lazy initialization failed:', error);
            // Graceful fallback - profile still works with local data
            this.initialized = true;
        }
    }

    /**
     * Check for existing player data and greet personally
     */
    async checkForExistingPlayerAndGreet() {
        try {
            // First check local storage for immediate greeting
            const playerData = localStorage.getItem('blockzone_player');
            if (playerData) {
                const player = JSON.parse(playerData);
                const playerName = player.displayName || player.username || 'Player';
                const firstName = playerName.split('#')[0];
                // // console.log($2); // Removed for performance
                
                // Now fetch fresh data from backend to update greeting if needed
                this.fetchBackendGreeting(player.id || player.playerId);
                return;
            }
            
            const quantumWallet = localStorage.getItem('quantum_wallet');
            const quantumUsername = localStorage.getItem('quantum_username');
            const quantumDisplayName = localStorage.getItem('quantum_display_name');
            
            if (quantumWallet && (quantumUsername || quantumDisplayName)) {
                const playerName = quantumDisplayName || quantumUsername;
                const firstName = playerName.split('_')[0] || playerName.split('#')[0];
                // // console.log($2); // Removed for performance
                
                // Fetch backend data for quantum players too
                this.fetchBackendGreeting(quantumWallet);
                return;
            }
            
            if (typeof window !== 'undefined' && window.identityManager) {
                setTimeout(() => {
                    const playerName = window.identityManager.getPlayerName?.();
                    const playerId = window.identityManager.getPlayerId?.();
                    if (playerName && !playerName.startsWith('Player#')) {
                        const firstName = playerName.split('#')[0];
                        // // console.log($2); // Removed for performance
                        
                        // Fetch backend data for identity manager players
                        if (playerId) {
                            this.fetchBackendGreeting(playerId);
                        }
                    }
                }, 100);
            }
        } catch (error) {
            console.error('❌ Error checking for existing player:', error);
        }
    }
    
    async fetchBackendGreeting(playerId) {
        try {
            // // console.log($2); // Removed for performance
            
            const response = await fetch(`${this.apiBase}/api/players/status?player_id=${encodeURIComponent(playerId)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            if (response.ok) {
                const backendData = await response.json();
                
                if (backendData.player && backendData.player.displayName) {
                    const backendName = backendData.player.displayName;
                    const firstName = backendName.split('#')[0];
                    
                    // // console.log($2); // Removed for performance`);
                    
                    // Update local storage with fresh backend data
                    const localPlayer = JSON.parse(localStorage.getItem('blockzone_player') || '{}');
                    localPlayer.displayName = backendName;
                    localPlayer.username = firstName;
                    localStorage.setItem('blockzone_player', JSON.stringify(localPlayer));
                    
                    // Emit event for UI updates
                    this.emit('profileUpdated', { displayName: backendName, source: 'backend' });
                } else {
                    // // console.log($2); // Removed for performance
                }
            } else {
                // // console.log($2); // Removed for performance
            }
            
        } catch (error) {
            // // console.log($2); // Removed for performance:', error.message);
        }
    }

    /**
     * Get current player status (replaces direct GameWrapper API calls)
     */
    async getPlayerStatus(playerId = null, forceRefresh = false) {
        // PERFORMANCE OPTIMIZATION: Ensure initialization before API calls
        await this.ensureInitialized();
        
        const cacheKey = 'status';
        
        // Check cache first
        if (!forceRefresh && this.isCacheValid(cacheKey)) {
            // // console.log($2); // Removed for performance
            return this.cache[cacheKey].data;
        }

        // Get player ID from IdentityManager if not provided
        if (!playerId) {
            if (window.identityManager && window.identityManager.getPlayerId) {
                playerId = window.identityManager.getPlayerId();
            } else if (this.identityManager && this.identityManager.getPlayerId) {
                playerId = this.identityManager.getPlayerId();
            }
        }
        
        // Fallback to current player ID if still not available
        if (!playerId) {
            playerId = this.getCurrentPlayerId();
        }

        try {
            // // console.log($2); // Removed for performance
            const response = await fetch(`${this.apiBase}/api/players/status?player_id=${encodeURIComponent(playerId)}`);
            
            if (!response.ok) {
                throw new Error(`Status fetch failed: ${response.status}`);
            }
            
            const statusData = await response.json();
            
            // Update cache
            this.updateCache(cacheKey, statusData);
            this.playerStatus = statusData;
            
            // Emit status changed event
            this.emit('statusChanged', statusData);
            
            // // console.log($2); // Removed for performance
            return statusData;
            
        } catch (error) {
            console.error('❌ Failed to get player status:', error);
            throw error;
        }
    }

    /**
     * Get leaderboard data (replaces direct LeaderboardDisplay API calls)
     */
    async getLeaderboardData(forceRefresh = false) {
        // PERFORMANCE OPTIMIZATION: Ensure initialization before API calls
        await this.ensureInitialized();
        
        const cacheKey = 'leaderboard';
        
        // Check cache first
        if (!forceRefresh && this.isCacheValid(cacheKey)) {
            // // console.log($2); // Removed for performance
            return this.cache[cacheKey].data;
        }

        try {
            // // console.log($2); // Removed for performance
            const response = await fetch(`${this.apiBase}/api/leaderboard`);
            
            if (!response.ok) {
                throw new Error(`Leaderboard fetch failed: ${response.status}`);
            }
            
            const leaderboardData = await response.json();
            
            // Update cache
            this.updateCache(cacheKey, leaderboardData);
            this.leaderboardData = leaderboardData;
            
            // Emit leaderboard updated event
            this.emit('leaderboardUpdated', leaderboardData);
            
            // // console.log($2); // Removed for performance
            // // console.log($2); // Removed for performance
            if (leaderboardData.scores && leaderboardData.scores.length > 0) {
                // // console.log($2); // Removed for performance
            }
            return leaderboardData;
            
        } catch (error) {
            console.error('❌ Failed to get leaderboard data:', error);
            throw error;
        }
    }

    /**
     * Update payment records (replaces direct PaywallManager API calls)
     */
    async updatePaymentRecord(playerId, paymentType, amount, transactionId) {
        try {
            // // console.log($2); // Removed for performance
            
            const response = await fetch(`${this.apiBase}/api/players/payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    player_id: playerId,
                    payment_type: paymentType,
                    amount: amount,
                    transaction_id: transactionId,
                    timestamp: Date.now()
                })
            });
            
            if (!response.ok) {
                throw new Error(`Payment update failed: ${response.status}`);
            }
            
            const result = await response.json();
            
            // Invalidate related caches
            this.invalidateCache(['status', 'profile', 'payments']);
            
            // Emit payment updated event
            this.emit('paymentUpdated', { paymentType, amount, transactionId, result });
            
            // // console.log($2); // Removed for performance
            return result;
            
        } catch (error) {
            console.error('❌ Failed to update payment record:', error);
            throw error;
        }
    }

    /**
     * Grant unlimited pass (replaces direct PaywallManager API calls)
     */
    async grantUnlimitedPass(playerId) {
        try {
            // // console.log($2); // Removed for performance
            
            const response = await fetch(`${this.apiBase}/api/game/player/unlimited-pass`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    player_id: playerId,
                    pass_type: 'day_pass',
                    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
                })
            });
            
            if (!response.ok) {
                throw new Error(`Unlimited pass grant failed: ${response.status}`);
            }
            
            const result = await response.json();
            
            // Invalidate related caches
            this.invalidateCache(['status', 'profile']);
            
            // Emit status changed event
            this.emit('statusChanged', { unlimited_pass_granted: true });
            
            // // console.log($2); // Removed for performance
            return result;
            
        } catch (error) {
            console.error('❌ Failed to grant unlimited pass:', error);
            // Don't throw - this is not critical for game flow
            return null;
        }
    }

    /**
     * Get comprehensive player data (aggregates all sources)
     */
    async getComprehensivePlayerData(playerId, forceRefresh = false) {
        try {
            // // console.log($2); // Removed for performance
            
            // Load all data sources in parallel
            const [profile, status, leaderboard] = await Promise.allSettled([
                this.loadProfile(playerId),
                this.getPlayerStatus(playerId, forceRefresh),
                this.getLeaderboardData(forceRefresh)
            ]);
            
            const comprehensiveData = {
                profile: profile.status === 'fulfilled' ? this.profile : null,
                status: status.status === 'fulfilled' ? status.value : null,
                leaderboard: leaderboard.status === 'fulfilled' ? leaderboard.value : null,
                timestamp: Date.now()
            };
            
            // // console.log($2); // Removed for performance
            return comprehensiveData;
            
        } catch (error) {
            console.error('❌ Failed to load comprehensive player data:', error);
            throw error;
        }
    }

    /**
     * Force refresh all data
     */
    async refreshAllData(playerId) {
        // // console.log($2); // Removed for performance
        this.invalidateCache(['profile', 'status', 'leaderboard', 'payments']);
        return await this.getComprehensivePlayerData(playerId, true);
    }

    // ==========================================
    // EVENT SYSTEM
    // ==========================================

    /**
     * Add event listener
     */
    on(eventType, callback) {
        if (!this.eventListeners[eventType]) {
            this.eventListeners[eventType] = [];
        }
        this.eventListeners[eventType].push(callback);
        // // console.log($2); // Removed for performance
    }

    /**
     * Remove event listener
     */
    off(eventType, callback) {
        if (!this.eventListeners[eventType]) return;
        
        const index = this.eventListeners[eventType].indexOf(callback);
        if (index > -1) {
            this.eventListeners[eventType].splice(index, 1);
            // // console.log($2); // Removed for performance
        }
    }

    /**
     * Emit event to all listeners
     */
    emit(eventType, data) {
        if (!this.eventListeners[eventType]) return;
        
        // // console.log($2); // Removed for performance
        this.eventListeners[eventType].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`❌ Error in event listener for ${eventType}:`, error);
            }
        });
    }

    // ==========================================
    // CACHING SYSTEM
    // ==========================================

    /**
     * Check if cache is valid
     */
    isCacheValid(cacheKey) {
        const cache = this.cache[cacheKey];
        if (!cache || !cache.data) return false;
        
        const age = Date.now() - cache.timestamp;
        return age < cache.ttl;
    }

    /**
     * Update cache with new data
     */
    updateCache(cacheKey, data) {
        this.cache[cacheKey] = {
            data: data,
            timestamp: Date.now(),
            ttl: this.cache[cacheKey].ttl
        };
        // // console.log($2); // Removed for performance
    }

    /**
     * Invalidate specific cache entries
     */
    invalidateCache(cacheKeys) {
        cacheKeys.forEach(key => {
            if (this.cache[key]) {
                this.cache[key].data = null;
                this.cache[key].timestamp = 0;
                // // console.log($2); // Removed for performance
            }
        });
    }

    /**
     * Clear all cache
     */
    clearCache() {
        Object.keys(this.cache).forEach(key => {
            this.cache[key].data = null;
            this.cache[key].timestamp = 0;
        });
        // // console.log($2); // Removed for performance
    }

    // ==========================================
    // AUTO-REFRESH SYSTEM
    // ==========================================

    /**
     * Start auto-refresh for real-time updates
     */
    startAutoRefresh(playerId) {
        // // console.log($2); // Removed for performance
        
        // Refresh player status every minute
        this.refreshIntervals.status = setInterval(async () => {
            try {
                await this.getPlayerStatus(playerId, true);
            } catch (error) {
                console.error('❌ Auto-refresh status failed:', error);
            }
        }, 60000); // 1 minute
        
        // Refresh leaderboard every 2 minutes
        this.refreshIntervals.leaderboard = setInterval(async () => {
            try {
                await this.getLeaderboardData(true);
            } catch (error) {
                console.error('❌ Auto-refresh leaderboard failed:', error);
            }
        }, 120000); // 2 minutes
    }

    /**
     * Stop auto-refresh
     */
    stopAutoRefresh() {
        // // console.log($2); // Removed for performance
        
        Object.values(this.refreshIntervals).forEach(interval => {
            if (interval) {
                clearInterval(interval);
            }
        });
        
        this.refreshIntervals = {
            status: null,
            leaderboard: null
        };
    }

    // ==========================================
    // UTILITY METHODS
    // ==========================================

    /**
     * Get current player ID from identity manager
     */
    getCurrentPlayerId() {
        // This will be updated when we integrate with IdentityManager
        if (window.identityManager && window.identityManager.getPlayerId) {
            return window.identityManager.getPlayerId();
        }
        return null;
    }

    /**
     * Initialize PlayerProfile with a player ID and start monitoring
     */
    async initialize(playerId) {
        // // console.log($2); // Removed for performance
        
        try {
            // Load comprehensive data
            await this.getComprehensivePlayerData(playerId);
            
            // Start auto-refresh
            this.startAutoRefresh(playerId);
            
            // // console.log($2); // Removed for performance
            return true;
            
        } catch (error) {
            console.error('❌ PlayerProfile initialization failed:', error);
            throw error;
        }
    }

    /**
     * Cleanup when PlayerProfile is no longer needed
     */
    cleanup() {
        // // console.log($2); // Removed for performance
        this.stopAutoRefresh();
        this.clearCache();
        this.eventListeners = {
            statusChanged: [],
            paymentUpdated: [],
            leaderboardUpdated: [],
            statsUpdated: [],
            profileUpdated: []
        };
    }

    async loadProfile(playerId) {
        this.loading = true;
        this.error = null;
        
        try {
            // // console.log($2); // Removed for performance
            const response = await fetch(`${this.apiBase}/api/players/profile?player_id=${encodeURIComponent(playerId)}`);
            // // console.log($2); // Removed for performance
            
            if (response.ok) {
                const data = await response.json();
                // // console.log($2); // Removed for performance
                
                if (data.success) {
                    this.profile = data.profile;
                } else {
                    throw new Error(data.error || 'Failed to load profile');
                }
            } else if (response.status === 404) {
                // Profile doesn't exist yet - create a basic profile from available data
                // // console.log($2); // Removed for performance
                await this.createBasicProfile(playerId);
            } else {
                const errorText = await response.text();
                console.error('❌ Profile load failed:', response.status, errorText);
                throw new Error(`Failed to load profile (${response.status})`);
            }
        } catch (error) {
            console.error('❌ Profile load error:', error);
            this.error = error.message;
        } finally {
            this.loading = false;
        }
    }

    async createBasicProfile(playerId) {
        try {
            // Get player status to create a basic profile
            const statusResponse = await fetch(`${this.apiBase}/api/players/status?player_id=${encodeURIComponent(playerId)}`);
            if (statusResponse.ok) {
                const statusData = await statusResponse.json();
                
                // Create a basic profile from available data
                this.profile = {
                    player_id: playerId,
                    display_name: playerId, // Will be updated when they register
                    username: playerId,
                    email: null,
                    wallet_address: null,
                    account_type: 'wallet_first',
                    verification_status: 'unverified',
                    tier: 'anonymous',
                    account_status: 'active',
                    created_at: new Date().toISOString(),
                    last_activity: new Date().toISOString(),
                    
                    // Current Status
                    status: {
                        has_unlimited_pass: statusData.has_unlimited_pass || false,
                        has_used_free_game: statusData.has_used_free_game || false,
                        can_play_free: statusData.can_play_free !== undefined ? statusData.can_play_free : false,
                        requires_payment: statusData.requires_payment || false,
                        next_reset: statusData.next_reset,
                        current_day: statusData.current_day
                    },
                    
                    // Basic Gaming Statistics
                    gaming: {
                        lifetime_high_score: 0,
                        total_games_played: 0,
                        average_score: 0,
                        current_streak: 0,
                        tournament_wins: 0,
                        total_prizes_won: 0
                    },
                    
                    // Basic Rankings
                    rankings: {
                        current_tournament: 'N/A',
                        all_time: 'N/A',
                        weekly: 'N/A'
                    },
                    
                    // Basic Payment History
                    payments: {
                        total_spent: 0,
                        day_passes_purchased: 0,
                        individual_games_purchased: 0
                    },
                    
                    // Basic Education Progress
                    education: {
                        courses_completed: 0,
                        lessons_completed: 0,
                        certificates_earned: 0,
                        progress_percentage: 0
                    }
                };
                
                // // console.log($2); // Removed for performance
            } else {
                throw new Error('Unable to get player status');
            }
        } catch (error) {
            console.error('❌ Error creating basic profile:', error);
            throw new Error('Unable to create profile. Please try again later.');
        }
    }

    show() {
        if (this.loading) {
            this.showLoading();
            return;
        }

        if (this.error) {
            this.showError();
            return;
        }

        this.createProfileOverlay();
    }

    showLoading() {
        const overlay = document.createElement('div');
        overlay.className = 'profile-overlay';
        overlay.innerHTML = `
            <div class="profile-modal">
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <p>Loading your profile...</p>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    showError() {
        const overlay = document.createElement('div');
        overlay.className = 'profile-overlay';
        overlay.innerHTML = `
            <div class="profile-modal">
                <div class="error-message">
                    <h3>❌ Profile Error</h3>
                    <p>${this.error}</p>
                    <button onclick="this.closest('.profile-overlay').remove()">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    createProfileOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'profile-overlay';
        overlay.innerHTML = this.generateProfileHTML();
        document.body.appendChild(overlay);

        // Add event listeners
        overlay.querySelector('.close-btn').addEventListener('click', () => {
            overlay.remove();
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });
    }

    generateProfileHTML() {
        const p = this.profile;
        
        return `
            <div class="profile-modal">
                <div class="profile-header">
                    <h2>${p.display_name}'s Profile</h2>
                    <button class="close-btn">✕</button>
                </div>
                
                <div class="profile-content">
                    <!-- Identity Section -->
                    <div class="profile-section">
                        <h3>👤 Identity</h3>
                        <div class="identity-grid">
                            <!-- Primary Identity Info -->
                            <div class="identity-item primary-identity">
                                <label>🎮 Username:</label>
                                <span class="username-display">${p.username || p.display_name || p.player_id}</span>
                            </div>
                            <div class="identity-item primary-identity">
                                <label>💼 Wallet Address:</label>
                                <span class="mono wallet-display">${p.wallet_address || 'Not Connected'}</span>
                                ${p.wallet_address ? '<span class="wallet-status connected">✅ Connected</span>' : '<span class="wallet-status disconnected">❌ Not Connected</span>'}
                            </div>
                            
                            <!-- Secondary Identity Info -->
                            <div class="identity-item">
                                <label>🆔 Player ID:</label>
                                <span class="mono">${p.player_id}</span>
                            </div>
                            ${p.email ? `
                                <div class="identity-item">
                                    <label>📧 Email:</label>
                                    <span>${p.email}</span>
                                </div>
                            ` : ''}
                            <div class="identity-item">
                                <label>📅 Member Since:</label>
                                <span>${p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Unknown'}</span>
                            </div>
                            <div class="identity-item">
                                <label>🏆 Account Tier:</label>
                                <span class="tier-badge tier-${p.tier}">${p.tier}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Current Status -->
                    <div class="profile-section">
                        <h3>🎮 Current Status</h3>
                        <div class="status-grid">
                            <div class="status-item ${p.status.has_unlimited_pass ? 'active' : ''}">
                                <span class="status-icon">${p.status.has_unlimited_pass ? '✅' : '❌'}</span>
                                <span>Unlimited Pass</span>
                            </div>
                            <div class="status-item ${p.status.can_play_free ? 'active' : ''}">
                                <span class="status-icon">${p.status.can_play_free ? '✅' : '❌'}</span>
                                <span>Free Game Available</span>
                            </div>
                            <div class="status-item">
                                <span class="status-icon">🕐</span>
                                <span>Next Reset: ${new Date(p.status.next_reset).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Gaming Stats -->
                    <div class="profile-section">
                        <h3>🏆 Gaming Statistics</h3>
                        <div class="stats-grid">
                            <div class="stat-card">
                                <div class="stat-value">${(p.gaming.lifetime_high_score || 0).toLocaleString()}</div>
                                <div class="stat-label">Lifetime High Score</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">${p.gaming.total_games_played || 0}</div>
                                <div class="stat-label">Games Played</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">${(p.gaming.average_score || 0).toLocaleString()}</div>
                                <div class="stat-label">Average Score</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">${p.gaming.current_streak || 0}</div>
                                <div class="stat-label">Current Streak</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">${p.gaming.tournament_wins || 0}</div>
                                <div class="stat-label">Tournament Wins</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">$${(p.gaming.total_prizes_won || 0).toFixed(2)}</div>
                                <div class="stat-label">Total Prizes Won</div>
                            </div>
                        </div>
                    </div>

                    <!-- Rankings -->
                    <div class="profile-section">
                        <h3>📊 Rankings</h3>
                        <div class="rankings-grid">
                            <div class="ranking-item">
                                <span class="ranking-label">Current Tournament:</span>
                                <span class="ranking-value">${p.rankings.current_tournament || 'N/A'}</span>
                            </div>
                            <div class="ranking-item">
                                <span class="ranking-label">All-Time:</span>
                                <span class="ranking-value">${p.rankings.all_time || 'N/A'}</span>
                            </div>
                            <div class="ranking-item">
                                <span class="ranking-label">This Week:</span>
                                <span class="ranking-value">${p.rankings.weekly || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Payment History -->
                    <div class="profile-section">
                        <h3>💰 Payment History</h3>
                        <div class="payment-grid">
                            <div class="payment-item">
                                <span class="payment-label">Total Spent:</span>
                                <span class="payment-value">$${(p.payments.total_spent || 0).toFixed(2)}</span>
                            </div>
                            <div class="payment-item">
                                <span class="payment-label">Day Passes:</span>
                                <span class="payment-value">${p.payments.day_passes_purchased || 0}</span>
                            </div>
                            <div class="payment-item">
                                <span class="payment-label">Individual Games:</span>
                                <span class="payment-value">${p.payments.individual_games_purchased || 0}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Education Progress -->
                    <div class="profile-section">
                        <h3>📚 Education Progress</h3>
                        <div class="education-grid">
                            <div class="education-item">
                                <span class="education-label">Courses Completed:</span>
                                <span class="education-value">${p.education.courses_completed || 0}</span>
                            </div>
                            <div class="education-item">
                                <span class="education-label">Lessons Completed:</span>
                                <span class="education-value">${p.education.lessons_completed || 0}</span>
                            </div>
                            <div class="education-item">
                                <span class="education-label">Certificates:</span>
                                <span class="education-value">${p.education.certificates_earned || 0}</span>
                            </div>
                            <div class="education-item">
                                <span class="education-label">Progress:</span>
                                <span class="education-value">${p.education.progress_percentage || 0}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

// PlayerProfile class is now exported and initialized in index.html
// Enhanced as Single Source of Truth for all backend player data
