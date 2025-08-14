/**
 * BlockZone Lab - Player Profile Component
 * Handles player data, status, and leaderboard information
 * 
 * ENHANCED: Comprehensive player management with caching
 * OPTIMIZED: Event-driven architecture with auto-refresh
 */

export class PlayerProfile {
    constructor() {
        this.profile = null;
        this.playerStatus = null;
        this.leaderboardData = null;
        this.paymentHistory = null;
        this.loading = false;
        this.error = null;
        
        this.apiBase = 'https://api.blockzonelab.com';
        this.initialized = false;
        this.initPromise = null;
        
        // Event system for component communication
        this.eventListeners = {
            statusChanged: [],
            paymentUpdated: [],
            leaderboardUpdated: [],
            statsUpdated: [],
            profileUpdated: []
        };
        
        // Cache system for performance
        this.cache = {
            profile: { data: null, timestamp: 0, ttl: 5 * 60 * 1000 }, // 5 minutes
            status: { data: null, timestamp: 0, ttl: 1 * 60 * 1000 },  // 1 minute
            leaderboard: { data: null, timestamp: 0, ttl: 2 * 60 * 1000 }, // 2 minutes
            payments: { data: null, timestamp: 0, ttl: 5 * 60 * 1000 }  // 5 minutes
        };
        
        // Auto-refresh intervals
        this.refreshIntervals = {
            status: null,
            leaderboard: null
        };
    }

    async ensureInitialized() {
        if (!this.initialized) {
            if (!this.initPromise) {
                this.initPromise = this._initialize();
            }
            return this.initPromise;
        }
    }

    async _initialize() {
        try {
            await this.checkForExistingPlayerAndGreet();
            this.initialized = true;
        } catch (error) {
            console.warn('PlayerProfile initialization warning:', error);
            this.initialized = true; // Continue anyway
        }
    }

    async checkForExistingPlayerAndGreet() {
        try {
            // Check for existing blockzone player
            const existingPlayer = localStorage.getItem('blockzone_player');
            if (existingPlayer) {
                const playerData = JSON.parse(existingPlayer);
                const displayName = (playerData.displayName || playerData.username || 'Player').split('#')[0];
                this.fetchBackendGreeting(playerData.id || playerData.playerId);
                return;
            }

            // Check for quantum wallet data
            const quantumWallet = localStorage.getItem('quantum_wallet');
            const quantumUsername = localStorage.getItem('quantum_username');
            const quantumDisplayName = localStorage.getItem('quantum_display_name');
            
            if (quantumWallet && (quantumUsername || quantumDisplayName)) {
                const displayName = quantumDisplayName || quantumUsername;
                const cleanName = displayName.split('_')[0] || displayName.split('#')[0];
                this.fetchBackendGreeting(quantumWallet);
                return;
            }

            // Check for identity manager
            if (typeof window !== 'undefined' && window.identityManager) {
                setTimeout(() => {
                    const playerName = window.identityManager.getPlayerName?.();
                    const playerId = window.identityManager.getPlayerId?.();
                    
                    if (playerName && !playerName.startsWith('Player#')) {
                        const cleanName = playerName.split('#')[0];
                        if (playerId) {
                            this.fetchBackendGreeting(playerId);
                        }
                    }
                }, 100);
            }
        } catch (error) {
            console.warn('Error checking for existing player:', error);
        }
    }

    async fetchBackendGreeting(playerId) {
        try {
            const response = await fetch(`${this.apiBase}/api/players/status?player_id=${encodeURIComponent(playerId)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.player && data.player.displayName) {
                    const displayName = data.player.displayName;
                    const username = displayName.split('#')[0];
                    
                    // Update local storage
                    const existingData = JSON.parse(localStorage.getItem('blockzone_player') || '{}');
                    existingData.displayName = displayName;
                    existingData.username = username;
                    localStorage.setItem('blockzone_player', JSON.stringify(existingData));
                    
                    this.emit('profileUpdated', { displayName, source: 'backend' });
                }
            }
        } catch (error) {
            console.warn('Error fetching backend greeting:', error);
        }
    }

    async getPlayerStatus(playerId = null, forceRefresh = false) {
        await this.ensureInitialized();
        
        const cacheKey = 'status';
        
        // Return cached data if valid and not forcing refresh
        if (!forceRefresh && this.isCacheValid(cacheKey)) {
            return this.cache[cacheKey].data;
        }

        // Get player ID from various sources
        if (!playerId) {
            if (window.identityManager && window.identityManager.getPlayerId) {
                playerId = window.identityManager.getPlayerId();
            } else if (this.identityManager && this.identityManager.getPlayerId) {
                playerId = this.identityManager.getPlayerId();
            }
        }
        
        if (!playerId) {
            playerId = this.getCurrentPlayerId();
        }

        try {
            const response = await fetch(`${this.apiBase}/api/players/status?player_id=${encodeURIComponent(playerId)}`);
            
            if (!response.ok) {
                throw new Error(`Status fetch failed: ${response.status}`);
            }

            const data = await response.json();
            
            // Update cache
            this.updateCache(cacheKey, data);
            this.playerStatus = data;
            
            // Emit event
            this.emit('statusChanged', data);
            
            return data;
        } catch (error) {
            throw error;
        }
    }

    async getLeaderboardData(forceRefresh = false) {
        await this.ensureInitialized();
        
        const cacheKey = 'leaderboard';
        
        // Return cached data if valid and not forcing refresh
        if (!forceRefresh && this.isCacheValid(cacheKey)) {
            return this.cache[cacheKey].data;
        }

        try {
            const response = await fetch(`${this.apiBase}/api/leaderboard`);
            
            if (!response.ok) {
                throw new Error(`Leaderboard fetch failed: ${response.status}`);
            }

            const data = await response.json();
            
            // Update cache
            this.updateCache(cacheKey, data);
            this.leaderboardData = data;
            
            // Emit event
            this.emit('leaderboardUpdated', data);
            
            // Return data with validation
            return data.scores && data.scores.length > 0 ? data : data;
        } catch (error) {
            console.warn('⚠️ Backend leaderboard not available:', error.message);
            
            // Return null when backend fails - no fake data
            return null;
        }
    }

    async updatePaymentRecord(playerId, paymentType, amount, transactionId) {
        try {
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
            
            // Emit event
            this.emit('paymentUpdated', {
                paymentType,
                amount,
                transactionId,
                result
            });

            return result;
        } catch (error) {
            throw error;
        }
    }

    async grantUnlimitedPass(playerId) {
        try {
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
            
            // Emit event
            this.emit('statusChanged', { unlimited_pass_granted: true });

            return result;
        } catch (error) {
            console.error('Error granting unlimited pass:', error);
            return null;
        }
    }

    async getComprehensivePlayerData(playerId, forceRefresh = false) {
        try {
            const [profileResult, statusResult, leaderboardResult] = await Promise.allSettled([
                this.loadProfile(playerId),
                this.getPlayerStatus(playerId, forceRefresh),
                this.getLeaderboardData(forceRefresh)
            ]);

            // If backend fails, provide local data from IdentityManager
            if (profileResult.status === 'rejected' && statusResult.status === 'rejected') {
                console.log('🔄 Backend APIs not available, using local IdentityManager data');
                
                const localData = this.getLocalPlayerData(playerId);
                return {
                    profile: localData.profile,
                    status: localData.status,
                    leaderboard: leaderboardResult.status === 'fulfilled' ? leaderboardResult.value : null,
                    timestamp: Date.now(),
                    source: 'local'
                };
            }

            return {
                profile: profileResult.status === 'fulfilled' ? this.profile : null,
                status: statusResult.status === 'fulfilled' ? statusResult.value : null,
                leaderboard: leaderboardResult.status === 'fulfilled' ? leaderboardResult.value : null,
                timestamp: Date.now(),
                source: 'backend'
            };
        } catch (error) {
            throw error;
        }
    }

    // Get player data from local sources when backend is not available
    getLocalPlayerData(playerId) {
        try {
            // Get data from IdentityManager
            let playerName = 'Anonymous Player';
            let walletAddress = 'Not Connected';
            let createdAt = Date.now();
            
            if (window.identityManager && window.identityManager.getPlayerName) {
                playerName = window.identityManager.getPlayerName() || playerName;
            }
            
            if (window.identityManager && window.identityManager.getWalletAddress) {
                walletAddress = window.identityManager.getWalletAddress() || walletAddress;
            }
            
            // Get data from localStorage
            const storedPlayer = localStorage.getItem('blockzone_player');
            if (storedPlayer) {
                try {
                    const playerData = JSON.parse(storedPlayer);
                    if (playerData.displayName) playerName = playerData.displayName;
                    if (playerData.wallet_address) walletAddress = playerData.wallet_address;
                    if (playerData.created_at) createdAt = playerData.created_at;
                } catch (e) {
                    console.warn('Failed to parse stored player data:', e);
                }
            }
            
            // Create comprehensive local profile
            const localProfile = {
                username: playerName.split('#')[0],
                display_name: playerName,
                wallet_address: walletAddress,
                created_at: createdAt,
                tier: 'Active Player',
                games_played: 0,
                total_score: 0,
                high_score: 0,
                last_seen: Date.now()
            };
            
            // Create local status
            const localStatus = {
                player_id: playerId,
                display_name: playerName,
                can_play_free: true,
                free_games_remaining: 1,
                has_unlimited_pass: false,
                games_played: 0,
                total_score: 0,
                high_score: 0,
                last_game: null,
                status: 'active'
            };
            
            return {
                profile: localProfile,
                status: localStatus
            };
            
        } catch (error) {
            console.warn('Failed to get local player data:', error);
            return {
                profile: null,
                status: null
            };
        }
    }

    async refreshAllData(playerId) {
        this.invalidateCache(['profile', 'status', 'leaderboard', 'payments']);
        return await this.getComprehensivePlayerData(playerId, true);
    }

    // Event system methods
    on(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }

    off(event, callback) {
        if (!this.eventListeners[event]) return;
        
        const index = this.eventListeners[event].indexOf(callback);
        if (index > -1) {
            this.eventListeners[event].splice(index, 1);
        }
    }

    emit(event, data) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Error in event callback:', error);
                }
            });
        }
    }

    // Cache management methods
    isCacheValid(cacheKey) {
        const cache = this.cache[cacheKey];
        if (!cache || !cache.data) return false;
        
        return Date.now() - cache.timestamp < cache.ttl;
    }

    updateCache(cacheKey, data) {
        this.cache[cacheKey] = {
            data: data,
            timestamp: Date.now(),
            ttl: this.cache[cacheKey].ttl
        };
    }

    invalidateCache(cacheKeys) {
        cacheKeys.forEach(key => {
            if (this.cache[key]) {
                this.cache[key].data = null;
                this.cache[key].timestamp = 0;
            }
        });
    }

    clearCache() {
        Object.keys(this.cache).forEach(key => {
            this.cache[key].data = null;
            this.cache[key].timestamp = 0;
        });
    }

    // Auto-refresh methods
    startAutoRefresh(playerId) {
        // Refresh status every minute
        this.refreshIntervals.status = setInterval(async () => {
            try {
                await this.getPlayerStatus(playerId, true);
            } catch (error) {
                console.warn('Auto-refresh status error:', error);
            }
        }, 60 * 1000);

        // Refresh leaderboard every 2 minutes
        this.refreshIntervals.leaderboard = setInterval(async () => {
            try {
                await this.getLeaderboardData(true);
            } catch (error) {
                console.warn('Auto-refresh leaderboard error:', error);
            }
        }, 2 * 60 * 1000);
    }

    stopAutoRefresh() {
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

    // Utility methods
    getCurrentPlayerId() {
        if (window.identityManager && window.identityManager.getPlayerId) {
            return window.identityManager.getPlayerId();
        }
        return null;
    }

    async initialize(playerId) {
        try {
            await this.getComprehensivePlayerData(playerId);
            this.startAutoRefresh(playerId);
            return true;
        } catch (error) {
            throw error;
        }
    }

    cleanup() {
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

    // Profile loading methods
    async loadProfile(playerId) {
        this.loading = true;
        this.error = null;

        try {
            const response = await fetch(`${this.apiBase}/api/players/profile?player_id=${encodeURIComponent(playerId)}`);
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.profile = data.profile;
                } else {
                    throw new Error(data.error || 'Failed to load profile');
                }
            } else if (response.status === 404) {
                // Profile doesn't exist, create a basic one
                await this.createBasicProfile(playerId);
            } else {
                const errorText = await response.text();
                throw new Error(`Failed to load profile (${response.status})`);
            }
        } catch (error) {
            this.error = error.message;
        } finally {
            this.loading = false;
        }
    }

    async createBasicProfile(playerId) {
        try {
            const statusResponse = await fetch(`${this.apiBase}/api/players/status?player_id=${encodeURIComponent(playerId)}`);
            
            if (statusResponse.ok) {
                const statusData = await statusResponse.json();
                
                this.profile = {
                    player_id: playerId,
                    display_name: playerId,
                    username: playerId,
                    email: null,
                    wallet_address: null,
                    account_type: 'wallet_first',
                    verification_status: 'unverified',
                    tier: 'anonymous',
                    account_status: 'active',
                    created_at: new Date().toISOString(),
                    last_activity: new Date().toISOString(),
                    status: {
                        has_unlimited_pass: statusData.has_unlimited_pass || false,
                        has_used_free_game: statusData.has_used_free_game || false,
                        can_play_free: statusData.can_play_free !== undefined ? statusData.can_play_free : false,
                        requires_payment: statusData.requires_payment || false,
                        next_reset: statusData.next_reset,
                        current_day: statusData.current_day
                    },
                    gaming: {
                        lifetime_high_score: 0,
                        total_games_played: 0,
                        average_score: 0,
                        current_streak: 0,
                        tournament_wins: 0,
                        total_prizes_won: 0
                    },
                    rankings: {
                        current_tournament: 'N/A',
                        all_time: 'N/A',
                        weekly: 'N/A'
                    },
                    payments: {
                        total_spent: 0,
                        day_passes_purchased: 0,
                        individual_games_purchased: 0
                    },
                    education: {
                        courses_completed: 0,
                        lessons_completed: 0,
                        certificates_earned: 0,
                        progress_percentage: 0
                    }
                };
            } else {
                throw new Error('Unable to get player status');
            }
        } catch (error) {
            throw new Error('Unable to create profile. Please try again later.');
        }
    }

    // UI methods
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
        const profile = this.profile;
        
        return `
            <div class="profile-modal">
                <div class="profile-header">
                    <h2>${profile.display_name}'s Profile</h2>
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
                                <span class="username-display">${profile.username || profile.display_name || profile.player_id}</span>
                            </div>
                            <div class="identity-item primary-identity">
                                <label>💼 Wallet Address:</label>
                                <span class="mono wallet-display">${profile.wallet_address || 'Not Connected'}</span>
                                ${profile.wallet_address ? '<span class="wallet-status connected">✅ Connected</span>' : '<span class="wallet-status disconnected">❌ Not Connected</span>'}
                            </div>
                            
                            <!-- Secondary Identity Info -->
                            <div class="identity-item">
                                <label>🆔 Player ID:</label>
                                <span class="mono">${profile.player_id}</span>
                            </div>
                            ${profile.email ? `
                                <div class="identity-item">
                                    <label>📧 Email:</label>
                                    <span>${profile.email}</span>
                                </div>
                            ` : ''}
                            <div class="identity-item">
                                <label>📅 Member Since:</label>
                                <span>${profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}</span>
                            </div>
                            <div class="identity-item">
                                <label>🏆 Account Tier:</label>
                                <span class="tier-badge tier-${profile.tier}">${profile.tier}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Current Status -->
                    <div class="profile-section">
                        <h3>🎮 Current Status</h3>
                        <div class="status-grid">
                            <div class="status-item ${profile.status.has_unlimited_pass ? 'active' : ''}">
                                <span class="status-icon">${profile.status.has_unlimited_pass ? '✅' : '❌'}</span>
                                <span>Unlimited Pass</span>
                            </div>
                            <div class="status-item ${profile.status.can_play_free ? 'active' : ''}">
                                <span class="status-icon">${profile.status.can_play_free ? '✅' : '❌'}</span>
                                <span>Free Game Available</span>
                            </div>
                            <div class="status-item">
                                <span class="status-icon">🕐</span>
                                <span>Next Reset: ${new Date(profile.status.next_reset).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Gaming Stats -->
                    <div class="profile-section">
                        <h3>🏆 Gaming Statistics</h3>
                        <div class="stats-grid">
                            <div class="stat-card">
                                <div class="stat-value">${(profile.gaming.lifetime_high_score || 0).toLocaleString()}</div>
                                <div class="stat-label">Lifetime High Score</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">${profile.gaming.total_games_played || 0}</div>
                                <div class="stat-label">Games Played</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">${(profile.gaming.average_score || 0).toLocaleString()}</div>
                                <div class="stat-label">Average Score</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">${profile.gaming.current_streak || 0}</div>
                                <div class="stat-label">Current Streak</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">${profile.gaming.tournament_wins || 0}</div>
                                <div class="stat-label">Tournament Wins</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">${profile.gaming.total_prizes_won || 0}</div>
                                <div class="stat-label">Prizes Won</div>
                            </div>
                        </div>
                    </div>

                    <!-- Rankings -->
                    <div class="profile-section">
                        <h3>🏅 Rankings</h3>
                        <div class="rankings-grid">
                            <div class="ranking-item">
                                <label>Current Tournament:</label>
                                <span class="ranking-value">${profile.rankings.current_tournament}</span>
                            </div>
                            <div class="ranking-item">
                                <label>All Time:</label>
                                <span class="ranking-value">${profile.rankings.all_time}</span>
                            </div>
                            <div class="ranking-item">
                                <label>Weekly:</label>
                                <span class="ranking-value">${profile.rankings.weekly}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Payment History -->
                    <div class="profile-section">
                        <h3>💳 Payment History</h3>
                        <div class="payment-summary">
                            <div class="payment-item">
                                <label>Total Spent:</label>
                                <span class="payment-value">$${(profile.payments.total_spent || 0).toFixed(2)}</span>
                            </div>
                            <div class="payment-item">
                                <label>Day Passes:</label>
                                <span class="payment-value">${profile.payments.day_passes_purchased || 0}</span>
                            </div>
                            <div class="payment-item">
                                <label>Individual Games:</label>
                                <span class="payment-value">${profile.payments.individual_games_purchased || 0}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Education Progress -->
                    <div class="profile-section">
                        <h3>📚 Education Progress</h3>
                        <div class="education-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${profile.education.progress_percentage || 0}%"></div>
                            </div>
                            <div class="progress-stats">
                                <span>${profile.education.progress_percentage || 0}% Complete</span>
                                <span>${profile.education.courses_completed || 0} Courses</span>
                                <span>${profile.education.lessons_completed || 0} Lessons</span>
                                <span>${profile.education.certificates_earned || 0} Certificates</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}
