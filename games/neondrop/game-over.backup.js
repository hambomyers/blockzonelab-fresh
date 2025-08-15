// BlockZone Lab - Fixed Game Over System (Refactored with EventBus)
//
// Professional Structure:
// - Uses EventBus for communication instead of DOM events
// - Only the new overlay/UI system is used for game over.
// - All legacy or duplicate game over rendering logic is removed.
// - This file is responsible for the game over overlay UI only.


class GameOverSystem {
    constructor(eventBus) {
        this.apiBase = 'https://api.blockzonelab.com';
        this.isVisible = false;
        this.currentScore = 0;
        this.identitySystem = null;
        this.eventBus = eventBus; // Use the shared event bus
        
        // ⚡ NEW: Add identity caching properties
        this.identityCache = null;
        this.cacheTimestamp = 0;
        this.CACHE_DURATION = 30000; // 30 seconds
        
        // 🚀 NEW: Store API response until overlay is ready
        this.pendingAPIResponse = null;
        
        // 🎯 FIXED API CALL GUARD: Return cached data instead of blocking
        this.cachedLeaderboardData = null;
        this.currentGameScore = null;
        this.apiCallInProgress = false;
        
        // 📊 LOGGING OPTIMIZATION
        this.LOG_LEVEL = {
            ERROR: 0,
            WARN: 1,
            INFO: 2,
            DEBUG: 3
        };
        this.currentLogLevel = this.LOG_LEVEL.WARN; // Reduce spam - only show WARN and ERROR
    }
    
    setIdentitySystem(identitySystem) {
        this.identitySystem = identitySystem;
    }
    
    // 🎯 PERFORMANCE OPTIMIZATION: Optimized logging
    log(level, message, data = null) {
        if (level <= this.currentLogLevel) {
            if (data) {
                console.log(message, data);
            } else {
                console.log(message);
            }
        }
    }
    
    // 🎯 PERFORMANCE OPTIMIZATION: Get current game session ID
    getCurrentGameSession() {
        // Use a combination of timestamp and player ID to create unique session
        const playerId = this.getPlayerId();
        const timestamp = Math.floor(Date.now() / 1000); // Round to nearest second
        return `${playerId}_${timestamp}`;
    }
    
    // 🎯 PERFORMANCE OPTIMIZATION: Reset game over state for new game
    resetGameOverState() {
        this.gameOverApiCallMade = false;
        this.currentGameSession = null;
        this.lastLeaderboardData = null;
        this.identityCache = null;
        this.cacheTimestamp = 0;
        this.pendingAPIResponse = null;
        
        // 🎯 FIXED API CALL GUARD: Reset API call state
        this.cachedLeaderboardData = null;
        this.currentGameScore = null;
        this.apiCallInProgress = false;
        
        this.log(this.LOG_LEVEL.INFO, '🔄 Game over state reset for new game');
    }
    
    // 🎯 PERFORMANCE OPTIMIZATION: Check if leaderboard data changed
    hasLeaderboardDataChanged(newData) {
        if (!this.lastLeaderboardData) return true;
        
        const oldData = this.lastLeaderboardData;
        const newScores = newData.scores || [];
        const oldScores = oldData.scores || [];
        
        // Check if total players changed
        if (newScores.length !== oldScores.length) return true;
        
        // Check if top 3 scores changed
        for (let i = 0; i < Math.min(3, newScores.length); i++) {
            if (!oldScores[i] || 
                oldScores[i].score !== newScores[i].score ||
                oldScores[i].display_name !== newScores[i].display_name) {
                return true;
            }
        }
        
        return false;
    }
    
    // NEW FLOW: Check email requirement before showing game over
    async show(data, metrics = {}) {
        this.log(this.LOG_LEVEL.INFO, '🎮 GameOverSystem.show() called', { data, metrics });
        
        // Handle both direct score and data object formats
        let score;
        if (typeof data === 'object' && data.score !== undefined) {
            score = data.score;
            this.log(this.LOG_LEVEL.DEBUG, '🎮 Extracted score from data object:', score);
        } else if (typeof data === 'number') {
            score = data;
            this.log(this.LOG_LEVEL.DEBUG, '🎮 Using direct score value:', score);
        } else {
            this.log(this.LOG_LEVEL.ERROR, '❌ Invalid score data:', data);
            return;
        }
        
        if (this.isVisible) {
            this.log(this.LOG_LEVEL.WARN, '⚠️ GameOverSystem already visible, returning early');
            return;
        }
        
        this.isVisible = true;
        this.currentScore = score;
        
        // ⚡ INSTANT: Create overlay IMMEDIATELY with hard-coded medal positions
        this.createOverlayWithHardcodedMedals(score);
        
        // ⚡ NEW: Get identity data ONCE at the very start
        const { playerName, playerID } = await this.getIdentityDataOnce();
        
        // ⚡ INSTANT: Update overlay with player info
        this.updateOverlayWithPlayerInfo(score, playerName, playerID);
        
        // 🚀 START API CALL IMMEDIATELY for real-time leaderboard data
        this.startBackgroundAPICalls(score, playerName, playerID);
        
        // Check if email capture is needed (now uses cached data - no lookup needed)
        const needsEmailCapture = await this.checkEmailRequirement(playerName, playerID);
        
        if (needsEmailCapture) {
            this.log(this.LOG_LEVEL.INFO, '📧 Email capture needed - showing email modal first');
            const emailCaptured = await this.showEmailCaptureBeforeGameOver(score, playerName, playerID);
            this.log(this.LOG_LEVEL.INFO, '📧 Email capture completed:', emailCaptured);
            // Score already submitted in email capture flow, update UI with fresh data
            await this.updateGameOverUIWithFreshData(score, playerName, playerID);
        } else {
            // this.log(this.LOG_LEVEL.INFO, '📧 Email capture not needed - API call already started during visual sequence');
            // API call was already started - no need to duplicate
        }
    }
    
    /**
     * Check if email capture is required for leaderboard eligibility
     * Now includes device recognition for returning players
     */
    async checkEmailRequirement(playerName, playerID) {
        // ✅ Use provided playerName instead of fetching
        const isAnonymous = playerName.startsWith('Player#');
        
        // Check for saved player profile (device recognition)
        const savedProfile = localStorage.getItem('blockzone_player_profile');
        if (savedProfile) {
            try {
                const profile = JSON.parse(savedProfile);
                const timeSinceLastSession = Date.now() - (profile.lastSession || 0);
                const isRecentSession = timeSinceLastSession < (7 * 24 * 60 * 60 * 1000); // 7 days
                
                if (profile.displayName && profile.displayName.includes('#') && isRecentSession) {
                    
                    
                    // Update current player identity with saved profile
                    if (window.gameWrapper?.identityManager?.playerIdentity) {
                        const currentPlayer = window.gameWrapper.identityManager.getCurrentPlayer();
                        if (currentPlayer) {
                            currentPlayer.displayName = profile.displayName;
                            currentPlayer.hasCustomName = true;
                            currentPlayer.username = profile.displayName.split('#')[0];
                            currentPlayer.email = profile.email;
                            
                            // Save updated player
                            await window.gameWrapper.identityManager.playerIdentity.saveToStorage(currentPlayer);
                    
                        }
                    }
                    
                    // No email capture needed - returning player recognized
                    
                    return false;
                }
            } catch (error) {
                console.error('❌ Error parsing saved profile:', error);
            }
        }
        
        const needsCapture = isAnonymous;
        

        //     playerName,
        //     isAnonymous,
        //     needsCapture,
        //     hasDeviceProfile: !!savedProfile
        // });
        
        return needsCapture;
    }
    
    /**
     * Show email capture modal before game over screen
     */
    async showEmailCaptureBeforeGameOver(score, playerName, playerID) {

        
        return new Promise((resolve) => {
            // Block game interaction while modal is open
            this.blockGameInteraction();
            
            // Create modal backdrop
            const modal = document.createElement('div');
            modal.id = 'email-capture-modal';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                font-family: 'Bungee', monospace;
            `;
            
            modal.innerHTML = `
                <div style="
                    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
                    border: 2px solid #00d4ff;
                    border-radius: 15px;
                    padding: 30px;
                    max-width: 500px;
                    width: 90%;
                    text-align: center;
                    box-shadow: 0 0 30px rgba(0, 212, 255, 0.5);
                ">
                    <h2 style="color: #00d4ff; margin-bottom: 20px; font-size: 24px;">🏆 Get on the Leaderboard!</h2>
                    <p style="color: #ffffff; margin-bottom: 25px; font-size: 16px; line-height: 1.5;">Enter your name and contact info to appear on the leaderboard instead of "${playerName}"</p>
                    
                    <input type="text" id="player-name-input" placeholder="Enter your name" style="
                        width: 100%;
                        padding: 12px;
                        margin-bottom: 15px;
                        border: 2px solid #00d4ff;
                        border-radius: 8px;
                        background: rgba(0, 0, 0, 0.7);
                        color: #ffffff;
                        font-size: 16px;
                        font-family: 'Bungee', monospace;
                        text-align: center;
                    " maxlength="30">
                    
                    <!-- Social Media Options -->
                    <div style="margin-bottom: 15px;">
                        <p style="color: #cccccc; font-size: 14px; margin-bottom: 10px;">Connect with social media (required for scoreboard):</p>
                        <div style="display: flex; gap: 10px; justify-content: center; margin-bottom: 15px;">
                            <button type="button" id="instagram-btn" style="
                                background: linear-gradient(45deg, #E4405F, #C13584);
                                color: white;
                                border: none;
                                padding: 10px 15px;
                                border-radius: 8px;
                                font-size: 14px;
                                cursor: pointer;
                                font-family: 'Bungee', monospace;
                                transition: all 0.3s;
                            " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                                📷 Instagram
                            </button>
                            
                            <button type="button" id="tiktok-btn" style="
                                background: linear-gradient(45deg, #000000, #ff0050);
                                color: white;
                                border: none;
                                padding: 10px 15px;
                                border-radius: 8px;
                                font-size: 14px;
                                cursor: pointer;
                                font-family: 'Bungee', monospace;
                                transition: all 0.3s;
                            " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                                🎥 TikTok
                            </button>
                            
                            <button type="button" id="twitter-btn" style="
                                background: linear-gradient(45deg, #1DA1F2, #0d8bd9);
                                color: white;
                                border: none;
                                padding: 10px 15px;
                                border-radius: 8px;
                                font-size: 14px;
                                cursor: pointer;
                                font-family: 'Bungee', monospace;
                                transition: all 0.3s;
                            " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                                🐦 Twitter
                            </button>
                        </div>
                    </div>
                    
                    <div style="text-align: center; margin-bottom: 15px; color: #888888; font-size: 14px;">OR</div>
                    
                    <input type="email" id="player-email-input" placeholder="Email (required for scoreboard)" style="
                        width: 100%;
                        padding: 12px;
                        margin-bottom: 20px;
                        border: 2px solid #00d4ff;
                        border-radius: 8px;
                        background: rgba(0, 0, 0, 0.7);
                        color: #ffffff;
                        font-size: 16px;
                        font-family: 'Bungee', monospace;
                        text-align: center;
                    ">
                    
                    <div style="display: flex; gap: 15px; justify-content: center;">
                        <button id="save-name-btn" style="
                            background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%);
                            color: #000000;
                            border: none;
                            padding: 12px 25px;
                            border-radius: 8px;
                            font-size: 16px;
                            font-weight: bold;
                            cursor: pointer;
                            font-family: 'Bungee', monospace;
                            transition: all 0.3s;
                        ">💾 Save & Continue</button>
                        
                        <button id="skip-name-btn" style="
                            background: transparent;
                            color: #888888;
                            border: 2px solid #555555;
                            padding: 12px 25px;
                            border-radius: 8px;
                            font-size: 16px;
                            cursor: pointer;
                            font-family: 'Bungee', monospace;
                            transition: all 0.3s;
                        ">Skip</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Focus on name input
            const nameInput = modal.querySelector('#player-name-input');
            const emailInput = modal.querySelector('#player-email-input');
            const saveBtn = modal.querySelector('#save-name-btn');
            const skipBtn = modal.querySelector('#skip-name-btn');
            
            setTimeout(() => nameInput.focus(), 100);
            
            // Handle social media buttons
            const instagramBtn = modal.querySelector('#instagram-btn');
            const tiktokBtn = modal.querySelector('#tiktok-btn');
            const twitterBtn = modal.querySelector('#twitter-btn');
            
            let selectedSocial = null;
            
            const handleSocialLogin = async (platform) => {
                // console.log(`📱 Starting ${platform} OAuth login`);
                
                try {
                    // Show loading state
                    const selectedBtn = modal.querySelector(`#${platform.toLowerCase()}-btn`);
                    if (selectedBtn) {
                        selectedBtn.textContent = 'Connecting...';
                        selectedBtn.disabled = true;
                    }
                    
                    // Initiate OAuth flow
                    const authResult = await this.initiateOAuthFlow(platform);
                    
                    if (authResult.success) {
                        selectedSocial = platform;
                        
                        // Reset all button styles
                        [instagramBtn, tiktokBtn, twitterBtn].forEach(btn => {
                            if (btn) btn.style.opacity = '0.5';
                        });
                        
                        // Highlight selected button
                        if (selectedBtn) {
                            selectedBtn.style.opacity = '1';
                            selectedBtn.style.boxShadow = '0 0 20px rgba(0, 255, 136, 0.5)';
                            selectedBtn.textContent = `✅ ${platform} Connected`;
                        }
                        
                        // Auto-fill name field with social profile data
                        if (authResult.profile.username) {
                            nameInput.value = authResult.profile.username;
                            nameInput.placeholder = `${platform} handle: ${authResult.profile.username}`;
                        }
                        
                        // Store social auth data
                        this.socialAuthData = {
                            platform: platform,
                            profile: authResult.profile,
                            accessToken: authResult.accessToken
                        };
                        
                        // console.log(`✅ ${platform} OAuth successful:`, authResult.profile);
                    } else {
                        throw new Error(authResult.error || 'OAuth failed');
                    }
                    
                } catch (error) {
                    console.error(`❌ ${platform} OAuth failed:`, error);
                    
                    // Reset button state
                    const selectedBtn = modal.querySelector(`#${platform.toLowerCase()}-btn`);
                    if (selectedBtn) {
                        selectedBtn.textContent = `❌ Try ${platform} Again`;
                        selectedBtn.disabled = false;
                        selectedBtn.style.opacity = '0.7';
                    }
                    
                    // Show error message
                    const errorMsg = document.createElement('div');
                    errorMsg.style.cssText = 'color: #ff4444; font-size: 12px; margin-top: 5px; text-align: center;';
                    errorMsg.textContent = `${platform} connection failed. You can still enter your name manually.`;
                    selectedBtn.parentNode.appendChild(errorMsg);
                    
                    setTimeout(() => errorMsg.remove(), 5000);
                }
            };
            
            if (instagramBtn) instagramBtn.addEventListener('click', () => handleSocialLogin('Instagram'));
            if (tiktokBtn) tiktokBtn.addEventListener('click', () => handleSocialLogin('TikTok'));
            if (twitterBtn) twitterBtn.addEventListener('click', () => handleSocialLogin('Twitter'));
            
            // Handle save button
            const handleSave = async () => {
                const playerName = nameInput.value.trim();
                const playerEmail = emailInput.value.trim();
                
                if (!playerName) {
                    nameInput.style.borderColor = '#ff4444';
                    nameInput.placeholder = 'Name is required!';
                    return;
                }
                
                // Require either email or social media selection
                if (!playerEmail && !selectedSocial) {
                    emailInput.style.borderColor = '#ff4444';
                    emailInput.placeholder = 'Email or social media required!';
                    return;
                }
                
                // console.log('💾 Saving player name and comprehensive profile data:', { playerName, playerEmail });
                
                try {
                    // Get current player data for composite name creation
                    const currentPlayer = window.gameWrapper?.identityManager?.getCurrentPlayer();
                    const walletSuffix = currentPlayer?.walletSuffix || currentPlayer?.id?.slice(-4)?.toUpperCase() || '0000';
                    
                    // Create composite display name: "Hambo#274F"
                    const compositeDisplayName = `${playerName}#${walletSuffix}`;
                    
                    
                    // Update player identity with composite name
                    if (window.gameWrapper && window.gameWrapper.identityManager) {
                        // Use the IdentityManager updateWithCustomName method
                        const success = await window.gameWrapper.identityManager.updateWithCustomName(playerName);
                        if (success) {
                            // console.log('✅ Player identity enhanced with custom name');
                        } else {
                            // console.warn('⚠️ Failed to update player name');
                        }
                    }
                    
                    // Update comprehensive PlayerProfile with all game data
                    if (window.playerProfile) {
                        const gameStats = {
                            lastGameScore: score,
                            lastGameMoves: window.neonDrop?.gameEngine?.moves || 0,
                            lastGameLevel: window.neonDrop?.gameEngine?.level || 1,
                            lastGameLines: window.neonDrop?.gameEngine?.linesCleared || 0,
                            lastGameTime: window.neonDrop?.gameEngine?.gameTime || 0,
                            gamesPlayedToday: (window.playerProfile.cache.status?.data?.games_played_today || 0) + 1,
                            freeGamesUsed: window.playerProfile.cache.status?.data?.has_used_free_game || false,
                            displayName: compositeDisplayName,
                            email: playerEmail,
                            lastPlayed: new Date().toISOString()
                        };
                        
                        // console.log('📊 Comprehensive game statistics:', gameStats);
                        
                        // Save to localStorage for device recognition
                        localStorage.setItem('blockzone_player_profile', JSON.stringify({
                            displayName: compositeDisplayName,
                            email: playerEmail,
                            playerId: playerID,
                            walletSuffix: walletSuffix,
                            deviceFingerprint: window.gameWrapper.identityManager.generateFingerprint(),
                            lastSession: Date.now(),
                            gameStats: gameStats
                        }));
                        
                        // console.log('💾 Player profile saved to localStorage for device recognition');
                    }
                    
                    // Re-submit score with composite display name
                    // console.log('🔄 Re-submitting score with composite name:', compositeDisplayName);
                    await this.submitScore(score, compositeDisplayName, playerID);
                    
                } catch (error) {
                    console.error('❌ Failed to update comprehensive player profile:', error);
                }
                
                // Remove modal, unblock game, and continue
                document.body.removeChild(modal);
                this.unblockGameInteraction();
                resolve({ playerName, playerEmail, socialPlatform: selectedSocial });
            };
            
            // Handle skip button
            const handleSkip = () => {

                document.body.removeChild(modal);
                this.unblockGameInteraction();
                resolve(false);
            };
            
            // Event listeners
            saveBtn.addEventListener('click', handleSave);
            skipBtn.addEventListener('click', handleSkip);
            
            // Enter key to save
            nameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handleSave();
            });
            emailInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handleSave();
            });
            
            // Escape key to skip
            document.addEventListener('keydown', function escapeHandler(e) {
                if (e.key === 'Escape') {
                    document.removeEventListener('keydown', escapeHandler);
                    handleSkip();
                }
            });
        });
    }
    
    /**
     * Block game interaction while modal is open
     */
    blockGameInteraction() {

        
        // Disable keyboard input
        if (window.neonDrop && window.neonDrop.gameEngine) {
            window.neonDrop.gameEngine.inputBlocked = true;
        }
        
        // Add overlay to block clicks
        const gameBlocker = document.createElement('div');
        gameBlocker.id = 'game-interaction-blocker';
        gameBlocker.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: transparent;
            z-index: 9999;
            pointer-events: all;
        `;
        
        // Add to game canvas area specifically
        const gameCanvas = document.getElementById('game');
        if (gameCanvas && gameCanvas.parentNode) {
            gameCanvas.parentNode.appendChild(gameBlocker);
        } else {
            document.body.appendChild(gameBlocker);
        }
    }
    
    /**
     * Unblock game interaction after modal closes
     */
    unblockGameInteraction() {

        
        // Re-enable keyboard input
        if (window.neonDrop && window.neonDrop.gameEngine) {
            window.neonDrop.gameEngine.inputBlocked = false;
        }
        
        // Remove interaction blocker
        const gameBlocker = document.getElementById('game-interaction-blocker');
        if (gameBlocker) {
            gameBlocker.remove();
        }
    }
    
    /**
     * Initiate OAuth flow for social media platforms
     */
    async initiateOAuthFlow(platform) {
        const clientIds = {
            Instagram: 'your_instagram_client_id', // Replace with actual client ID
            TikTok: 'your_tiktok_client_id',       // Replace with actual client ID
            Twitter: 'your_twitter_client_id'       // Replace with actual client ID
        };
        
        const redirectUri = `${window.location.origin}/auth/callback`;
        
        try {
            switch (platform) {
                case 'Instagram':
                    return await this.handleInstagramAuth(clientIds.Instagram, redirectUri);
                case 'TikTok':
                    return await this.handleTikTokAuth(clientIds.TikTok, redirectUri);
                case 'Twitter':
                    return await this.handleTwitterAuth(clientIds.Twitter, redirectUri);
                default:
                    throw new Error(`Unsupported platform: ${platform}`);
            }
        } catch (error) {
            console.error(`OAuth flow failed for ${platform}:`, error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Handle Instagram OAuth
     */
    async handleInstagramAuth(clientId, redirectUri) {
        const scopes = 'user_profile,user_media';
        const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&response_type=code`;
        
        return new Promise((resolve) => {
            const popup = window.open(authUrl, 'instagram-auth', 'width=500,height=600,scrollbars=yes,resizable=yes');
            
            const checkClosed = setInterval(() => {
                if (popup.closed) {
                    clearInterval(checkClosed);
                    resolve({ success: false, error: 'User cancelled authentication' });
                }
            }, 1000);
            
            // Listen for auth callback
            window.addEventListener('message', async (event) => {
                if (event.origin !== window.location.origin) return;
                
                if (event.data.type === 'instagram-auth-success') {
                    clearInterval(checkClosed);
                    popup.close();
                    
                    try {
                        // Exchange code for access token
                        const tokenResponse = await fetch('/api/auth/instagram/token', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ code: event.data.code })
                        });
                        
                        const tokenData = await tokenResponse.json();
                        
                        if (tokenData.success) {
                            resolve({
                                success: true,
                                accessToken: tokenData.access_token,
                                profile: {
                                    username: tokenData.username,
                                    id: tokenData.user_id,
                                    platform: 'Instagram'
                                }
                            });
                        } else {
                            resolve({ success: false, error: 'Failed to get access token' });
                        }
                    } catch (error) {
                        resolve({ success: false, error: error.message });
                    }
                }
            }, { once: true });
        });
    }
    
    /**
     * Handle TikTok OAuth
     */
    async handleTikTokAuth(clientId, redirectUri) {
        const scopes = 'user.info.basic';
        const authUrl = `https://www.tiktok.com/auth/authorize/?client_key=${clientId}&scope=${scopes}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}`;
        
        return new Promise((resolve) => {
            const popup = window.open(authUrl, 'tiktok-auth', 'width=500,height=600,scrollbars=yes,resizable=yes');
            
            const checkClosed = setInterval(() => {
                if (popup.closed) {
                    clearInterval(checkClosed);
                    resolve({ success: false, error: 'User cancelled authentication' });
                }
            }, 1000);
            
            // Listen for auth callback
            window.addEventListener('message', async (event) => {
                if (event.origin !== window.location.origin) return;
                
                if (event.data.type === 'tiktok-auth-success') {
                    clearInterval(checkClosed);
                    popup.close();
                    
                    try {
                        // Exchange code for access token
                        const tokenResponse = await fetch('/api/auth/tiktok/token', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ code: event.data.code })
                        });
                        
                        const tokenData = await tokenResponse.json();
                        
                        if (tokenData.success) {
                            resolve({
                                success: true,
                                accessToken: tokenData.access_token,
                                profile: {
                                    username: tokenData.username,
                                    id: tokenData.user_id,
                                    platform: 'TikTok'
                                }
                            });
                        } else {
                            resolve({ success: false, error: 'Failed to get access token' });
                        }
                    } catch (error) {
                        resolve({ success: false, error: error.message });
                    }
                }
            }, { once: true });
        });
    }
    
    /**
     * Handle Twitter OAuth
     */
    async handleTwitterAuth(clientId, redirectUri) {
        const scopes = 'tweet.read users.read';
        const authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&state=state&code_challenge=challenge&code_challenge_method=plain`;
        
        return new Promise((resolve) => {
            const popup = window.open(authUrl, 'twitter-auth', 'width=500,height=600,scrollbars=yes,resizable=yes');
            
            const checkClosed = setInterval(() => {
                if (popup.closed) {
                    clearInterval(checkClosed);
                    resolve({ success: false, error: 'User cancelled authentication' });
                }
            }, 1000);
            
            // Listen for auth callback
            window.addEventListener('message', async (event) => {
                if (event.origin !== window.location.origin) return;
                
                if (event.data.type === 'twitter-auth-success') {
                    clearInterval(checkClosed);
                    popup.close();
                    
                    try {
                        // Exchange code for access token
                        const tokenResponse = await fetch('/api/auth/twitter/token', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ code: event.data.code })
                        });
                        
                        const tokenData = await tokenResponse.json();
                        
                        if (tokenData.success) {
                            resolve({
                                success: true,
                                accessToken: tokenData.access_token,
                                profile: {
                                    username: tokenData.username,
                                    id: tokenData.user_id,
                                    platform: 'Twitter'
                                }
                            });
                        } else {
                            resolve({ success: false, error: 'Failed to get access token' });
                        }
                    } catch (error) {
                        resolve({ success: false, error: error.message });
                    }
                }
            }, { once: true });
        });
    }
    
    /**
     * ⚡ INSTANT: Show game over screen immediately with local data
     */
    async showGameOverScreenInstant(score, metrics, playerName, playerID) {
        this.log(this.LOG_LEVEL.INFO, '⚡ INSTANT: Showing game over screen with local data');
        
        // Show UI immediately with local data
        this.showWrapperInterface(score, metrics, playerName, playerID);
        
        // Mark instant display performance
        if (this.overlayPerformance) {
            this.overlayPerformance.markInstantDisplay();
        }
        
        // Show loading states for data that will be fetched
        const overlay = document.getElementById('game-over-wrapper');
        if (overlay) {
            this.showLoadingStates(overlay);
        }
        
        // 🚀 START API CALL IMMEDIATELY for real-time leaderboard data
        this.log(this.LOG_LEVEL.INFO, '🚀 Starting immediate API call for leaderboard data');
        this.startBackgroundAPICalls(score, playerName, playerID);
        
        this.log(this.LOG_LEVEL.INFO, '⚡ INSTANT: Game over screen displayed with local data');
    }
    
    /**
     * 🚀 Start real-time API call for lightning-fast performance
     */
    startBackgroundAPICalls(score, playerName = null, playerID = null) {
        // 🎯 FIXED: Return cached data if available for this score
        if (this.cachedLeaderboardData && this.cachedLeaderboardData.score === score) {
            this.updateLeaderboardInOverlay(this.cachedLeaderboardData);
            return Promise.resolve(this.cachedLeaderboardData);
        }
        
        // 🎯 FIXED: Only block if API call is in progress for this score
        if (this.apiCallInProgress && this.currentGameScore === score) {
            this.log(this.LOG_LEVEL.WARN, '⏳ API call already in progress for this score, waiting...');
            return this.waitForApiResult();
        }
        
        // Set guard flags
        this.apiCallInProgress = true;
        this.currentGameScore = score;
        
        this.log(this.LOG_LEVEL.INFO, '🚀 Starting API call for score:', score);
        
        // Get player data (use cached if available)
        const finalPlayerName = playerName || this.getPlayerName();
        const finalPlayerID = playerID || this.getPlayerId();
        
        // Submit score
        return fetch(`${this.apiBase}/api/game-over`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                score, 
                playerId: finalPlayerID, 
                gameData: {
                    playerName: finalPlayerName,
                    gameType: 'neon_drop',
                    timestamp: Date.now()
                }
            })
        })
        .then(response => response.json())
        .then(() => fetch(`${this.apiBase}/api/leaderboard`))
        .then(response => response.json())
        .then(leaderboardData => {
            this.log(this.LOG_LEVEL.INFO, '✅ Got leaderboard data:', leaderboardData);
            this.log(this.LOG_LEVEL.DEBUG, '🔍 API Response structure:', {
                hasScores: !!leaderboardData.scores,
                scoresLength: leaderboardData.scores?.length,
                firstScore: leaderboardData.scores?.[0],
                scoreKeys: leaderboardData.scores?.[0] ? Object.keys(leaderboardData.scores[0]) : []
            });
            
            // Log the first few scores in detail (DEBUG level only)
            if (leaderboardData.scores && leaderboardData.scores.length > 0) {
                this.log(this.LOG_LEVEL.DEBUG, '🔍 First 3 scores detail:', leaderboardData.scores.slice(0, 3).map((score, index) => ({
                    position: index + 1,
                    display_name: score.display_name,
                    player_id: score.player_id,
                    id: score.id,
                    score: score.score,
                    allKeys: Object.keys(score)
                })));
            }
            
            // 🎯 FIXED: Cache the leaderboard data with score
            this.cachedLeaderboardData = { score, ...leaderboardData };
            
            // Store for overlay
            this.pendingAPIResponse = leaderboardData;
            
            // 🎯 PERFORMANCE OPTIMIZATION: Only update if data changed
            if (this.hasLeaderboardDataChanged(leaderboardData)) {
                this.updateLeaderboardInOverlay(leaderboardData);
                this.lastLeaderboardData = { ...leaderboardData };
            } else {
                this.log(this.LOG_LEVEL.DEBUG, '🔄 Leaderboard data unchanged, skipping update');
            }
            
            return this.cachedLeaderboardData;
        })
        .catch(error => {
            this.log(this.LOG_LEVEL.ERROR, '❌ API call failed:', error);
            throw error;
        })
        .finally(() => {
            // 🎯 FIXED API CALL GUARD: Reset in-progress flag
            this.apiCallInProgress = false;
            this.log(this.LOG_LEVEL.DEBUG, '🔓 API call guard reset');
        });
    }
    
    /**
     * 🎯 FIXED: Wait for API result when call is in progress
     */
    waitForApiResult() {
        return new Promise((resolve, reject) => {
            const checkInterval = setInterval(() => {
                if (this.cachedLeaderboardData && this.cachedLeaderboardData.score === this.currentGameScore) {
                    clearInterval(checkInterval);
                    this.log(this.LOG_LEVEL.INFO, '📊 API result ready, returning cached data');
                    resolve(this.cachedLeaderboardData);
                } else if (!this.apiCallInProgress) {
                    clearInterval(checkInterval);
                    this.log(this.LOG_LEVEL.ERROR, '❌ API call failed while waiting');
                    reject(new Error('API call failed'));
                }
            }, 100);
            
            // Timeout after 10 seconds
            setTimeout(() => {
                clearInterval(checkInterval);
                this.log(this.LOG_LEVEL.ERROR, '❌ Timeout waiting for API result');
                reject(new Error('API call timeout'));
            }, 10000);
        });
    }
    
    /**
     * 🚀 Simple method to update leaderboard in overlay
     */
    updateLeaderboardInOverlay(leaderboardData) {

        
        const overlay = document.getElementById('game-over-wrapper');
        if (!overlay) {
            this.log(this.LOG_LEVEL.ERROR, '❌ No game-over-wrapper found');
            return;
        }
        
        const leaderboardContent = overlay.querySelector('#leaderboardContent');
        if (!leaderboardContent) {
            this.log(this.LOG_LEVEL.ERROR, '❌ No leaderboardContent found');
            return;
        }
        
        // Get top 3 players
        const top3 = leaderboardData.scores ? leaderboardData.scores.slice(0, 3) : [];
        this.log(this.LOG_LEVEL.DEBUG, '🏆 Top 3 players:', top3);
        
        // Get current player ID for comparison (use cached if available)
        const currentPlayerId = this.getPlayerId();
        this.log(this.LOG_LEVEL.DEBUG, '🏆 Current player ID for comparison:', currentPlayerId);
        
        // Hard-code the 3 slots with medals
        let html = '';
        
        // 1st Place - GOLD MEDAL
        const player1 = top3[0];
        const player1Name = player1 ? player1.display_name : 'No Data';
        const player1Score = player1 && player1.score ? player1.score.toLocaleString() : 'No Data';
        const player1Id = player1 ? (player1.player_id || player1.id || '') : '';
        const isPlayer1Current = player1Id === currentPlayerId;
        const player1Color = isPlayer1Current ? '#00ff88' : '#ffffff';
        const player1Marker = isPlayer1Current ? ' ← You' : '';
        
        html += `<div style="color: ${player1Color}; margin-bottom: 8px; font-size: 14px; font-weight: bold; text-align: center; padding: 4px; background: rgba(0,0,0,0.3); border-radius: 4px;">
            🥇 1st: ${player1Name} - ${player1Score} pts${player1Marker}
        </div>`;
        
        // 2nd Place - SILVER MEDAL
        const player2 = top3[1];
        const player2Name = player2 ? player2.display_name : 'No Data';
        const player2Score = player2 && player2.score ? player2.score.toLocaleString() : 'No Data';
        const player2Id = player2 ? (player2.player_id || player2.id || '') : '';
        const isPlayer2Current = player2Id === currentPlayerId;
        const player2Color = isPlayer2Current ? '#00ff88' : '#ffffff';
        const player2Marker = isPlayer2Current ? ' ← You' : '';
        
        html += `<div style="color: ${player2Color}; margin-bottom: 8px; font-size: 14px; font-weight: bold; text-align: center; padding: 4px; background: rgba(0,0,0,0.3); border-radius: 4px;">
            🥈 2nd: ${player2Name} - ${player2Score} pts${player2Marker}
        </div>`;
        
        // 3rd Place - BRONZE MEDAL
        const player3 = top3[2];
        const player3Name = player3 ? player3.display_name : 'No Data';
        const player3Score = player3 && player3.score ? player3.score.toLocaleString() : 'No Data';
        const player3Id = player3 ? (player3.player_id || player3.id || '') : '';
        const isPlayer3Current = player3Id === currentPlayerId;
        const player3Color = isPlayer3Current ? '#00ff88' : '#ffffff';
        const player3Marker = isPlayer3Current ? ' ← You' : '';
        
        html += `<div style="color: ${player3Color}; margin-bottom: 8px; font-size: 14px; font-weight: bold; text-align: center; padding: 4px; background: rgba(0,0,0,0.3); border-radius: 4px;">
            🥉 3rd: ${player3Name} - ${player3Score} pts${player3Marker}
        </div>`;
        
        // Total Players
        html += `<div style="margin-top: 10px; color: #00ff88; font-size: 12px; font-weight: bold; text-align: center; padding: 4px; background: rgba(0,255,0,0.1); border-radius: 4px;">
            Total Players: ${leaderboardData.scores ? leaderboardData.scores.length : 'No Data'}
        </div>`;
        
        this.log(this.LOG_LEVEL.DEBUG, '🏆 Player ID comparisons:', {
            currentPlayerId,
            player1Id,
            player2Id,
            player3Id,
            isPlayer1Current,
            isPlayer2Current,
            isPlayer3Current
        });
        
        leaderboardContent.innerHTML = html;
        this.log(this.LOG_LEVEL.INFO, '✅ Leaderboard updated with real data');
    }
    
    /**
     * 🚀 Update UI with real-time data
     */
    updateUIWithRealTimeData(data, score, playerName, playerID) {
        // console.log('🚀 Updating UI with real-time data:', data);
        
        const overlay = document.getElementById('game-over-wrapper');
        if (!overlay) {
            console.error('❌ CRITICAL: game-over-wrapper overlay not found!');
            return;
        }
        
        
        
        // Update leaderboard with real-time data
        if (data.leaderboard) {
            
            
            
            // Handle different API response structures
            let top3 = data.leaderboard.top3;
            let totalPlayers = data.leaderboard.totalPlayers;
            
            // Fallback: if top3 doesn't exist, try scores array
            if (!top3 && data.leaderboard.scores) {
                
                top3 = data.leaderboard.scores.slice(0, 3);
                totalPlayers = data.leaderboard.scores.length;
            }
            
            // Fallback: if still no data, create mock data for testing
            if (!top3 || top3.length === 0) {
                
                top3 = [
                    { name: 'Player 1', score: 1000, id: 'player1' },
                    { name: 'Player 2', score: 800, id: 'player2' },
                    { name: 'Player 3', score: 600, id: 'player3' }
                ];
                totalPlayers = 3;
            }
            
            this.updateOverlayLeaderboard({
                top3: top3,
                playerRank: data.scoreSubmission?.newRank || 'Unknown',
                totalPlayers: totalPlayers,
                freshness: data.metadata?.dataFreshness || 'real-time',
                responseTime: data.metadata?.responseTime || 'unknown',
                scope: data.metadata?.scope || 'global',
                region: data.metadata?.region || 'global'
            });
        } else {
            console.error('❌ CRITICAL: No leaderboard data in API response!');
        }
        
        // Update play again button with real-time data
        if (data.playerAccess) {
            const playAgainBtn = overlay.querySelector('#playAgainBtn');
            if (playAgainBtn) {
                this.updatePlayAgainButtonWithRealTimeData(playAgainBtn, data.playerAccess);
            }
        }
        
        // Update player stats if available
        if (data.playerStats) {
            this.updatePlayerStatsDisplay(data.playerStats);
        }
        
        // Show performance metrics
        this.showPerformanceMetrics(data.metadata);
        
        
    }
    
    /**
     * 🏆 Update overlay leaderboard with real-time data
     */
    updateOverlayLeaderboard({ top3, playerRank, totalPlayers, freshness, responseTime, scope, region }) {
        
        
        const overlay = document.getElementById('game-over-wrapper');
        if (!overlay) {
            console.error('❌ CRITICAL: game-over-wrapper not found in updateOverlayLeaderboard');
            return;
        }
        
        
        
        // Update leaderboard content
        const leaderboardContent = overlay.querySelector('#leaderboardContent');
        if (leaderboardContent) {
            
            let leaderboardHTML = '';
            
            if (top3 && top3.length > 0) {
                top3.forEach((player, index) => {
                    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
                    const isCurrentPlayer = player.player_id === this.getPlayerId() || player.id === this.getPlayerId();
                    const color = isCurrentPlayer ? '#00ff88' : '#ffffff';
                    const fontWeight = isCurrentPlayer ? 'bold' : 'normal';
                    const youMarker = isCurrentPlayer ? ' ← You' : '';
                    
                    leaderboardHTML += `
                        <div style="
                            display: flex !important;
                            justify-content: space-between !important;
                            margin-bottom: 8px !important;
                            font-size: 14px !important;
                            color: ${color} !important;
                            font-weight: ${fontWeight} !important;
                            font-family: 'Bungee', monospace !important;
                        ">
                            <span>${medal} ${index + 1}st: ${player.display_name || player.name || 'Unknown'} - ${(player.score || 0).toLocaleString()} pts${youMarker}</span>
                        </div>
                    `;
                });
            } else {
                leaderboardHTML = `
                    <div style="color: #888; font-size: 12px;">
                        No leaderboard data available
                    </div>
                `;
            }
            
            // Add player rank info
            if (playerRank && totalPlayers) {
                leaderboardHTML += `
                    <div style="
                        margin-top: 10px !important;
                        padding: 8px !important;
                        background: rgba(0, 255, 0, 0.1) !important;
                        border: 1px solid #00ff88 !important;
                        border-radius: 4px !important;
                        font-size: 12px !important;
                        color: #00ff88 !important;
                    ">
                        <strong>Your Rank:</strong> #${playerRank} of ${totalPlayers.toLocaleString()}
                    </div>
                `;
            }
            
            
            leaderboardContent.innerHTML = leaderboardHTML;
            
        } else {
            console.error('❌ CRITICAL: leaderboardContent element not found!');
        }
        
        // Update freshness indicator
        const freshnessIndicator = overlay.querySelector('.freshness-indicator');
        if (freshnessIndicator) {
            const indicator = freshness === 'real-time' ? '⚡' : '🟢';
            freshnessIndicator.textContent = `${indicator} ${freshness} (${responseTime})`;
            freshnessIndicator.className = `freshness-indicator ${freshness === 'real-time' ? 'real-time' : 'cached'}`;
        }
        
        // Update leaderboard title with scope/region info
        const leaderboardTitle = overlay.querySelector('.leaderboard-title');
        if (leaderboardTitle) {
            const regionText = scope === 'regional' ? ` (${region.toUpperCase()})` : '';
            leaderboardTitle.textContent = `🏆 Top Players${regionText}`;
        }
        
        
    }
    
    /**
     * 🎮 Update play again button with real-time data
     */
    updatePlayAgainButtonWithRealTimeData(button, playerAccess) {
        if (playerAccess.canPlayAgain) {
            this.updatePlayAgainButton(button, 'enabled', '🎮 Play Again ⚡');
        } else {
            this.updatePlayAgainButton(button, 'disabled', `💰 ${playerAccess.reason} ❌`);
        }
    }
    
    /**
     * 📊 Update player stats display
     */
    updatePlayerStatsDisplay(playerStats) {
        const overlay = document.getElementById('game-over-wrapper');
        if (!overlay) return;
        
        const statsElement = overlay.querySelector('.player-stats');
        if (statsElement && playerStats) {
            statsElement.innerHTML = `
                <div style="
                    margin-top: 10px !important;
                    padding: 8px !important;
                    background: rgba(0, 212, 255, 0.1) !important;
                    border: 1px solid #00d4ff !important;
                    border-radius: 4px !important;
                    font-size: 12px !important;
                    color: #00d4ff !important;
                ">
                    <strong>Your Stats:</strong><br>
                    Games Played: ${playerStats.gamesPlayed}<br>
                    Best Score: ${playerStats.bestScore.toLocaleString()}<br>
                    Total Play Time: ${Math.floor(playerStats.totalPlayTime / 60)}m ${playerStats.totalPlayTime % 60}s
                </div>
            `;
        }
    }
    
    /**
     * ⚡ Show performance metrics
     */
    showPerformanceMetrics(metadata) {
        if (!metadata) return;
        
        
        
        
        
        
        
        
        // Add performance indicator to UI if needed
        const overlay = document.getElementById('game-over-wrapper');
        if (overlay) {
            const performanceIndicator = overlay.querySelector('.performance-indicator');
            if (performanceIndicator) {
                performanceIndicator.textContent = `⚡ ${metadata.responseTime} | ${metadata.dataFreshness}`;
            }
        }
    }
    
    /**
     * 🌍 Get player region
     */
    getPlayerRegion() {
        // Try to get from existing systems
        if (window.gameWrapper?.identityManager?.getPlayerRegion) {
            return window.gameWrapper.identityManager.getPlayerRegion();
        }
        
        // Fallback to browser locale
        try {
            return navigator.language.split('-')[1]?.toLowerCase() || 'global';
        } catch (error) {
            return 'global';
        }
    }
    
    /**
     * 🎮 Get game data for API call
     */
    getGameData() {
        const gameData = {
            gameType: 'neon_drop',
            timestamp: Date.now(),
            version: '1.0.0'
        };
        
        // Add seed data if available
        if (window.neonDrop) {
            gameData.seed = window.neonDrop.dailySeed;
            gameData.seedDate = window.neonDrop.seedDate;
        }
        
        // Add play time if available
        if (window.neonDrop?.engine?.getPlayTime) {
            gameData.playTime = window.neonDrop.engine.getPlayTime();
        }
        
        return gameData;
    }
    
    /**
     * 🔄 Update UI with fresh data from API calls
     */
    async updateGameOverUIWithFreshData(score, playerName, playerID) {
        
        
        console.error('❌ GAME OVER API FAILED - NO FALLBACK');
        throw new Error('Must fix /api/game-over endpoint');
    }
    
    /**
     * Show loading states for data being fetched
     */
    showLoadingStates(overlay) {
        // Update leaderboard with loading state
        const leaderboardContent = overlay.querySelector('#leaderboardContent');
        if (leaderboardContent) {
            leaderboardContent.innerHTML = `
                <div style="color: #888; font-size: 12px;">
                    🔄 Loading leaderboard...
                </div>
            `;
        }
        
        // Update play again button with loading state
        const playAgainBtn = overlay.querySelector('#playAgainBtn');
        if (playAgainBtn) {
            playAgainBtn.textContent = '🔄 Loading...';
            playAgainBtn.disabled = true;
        }
    }
    

    
    /**
     * Update data freshness indicators
     */
    updateDataFreshnessIndicators(overlay, indicator, type = 'all') {
        const indicators = {
            '⚡': 'Just fetched',
            '🟢': 'Cached (recent)',
            '🟡': 'Cached (older)',
            '❌': 'Network issue'
        };
        
        
        
        // Add freshness indicator to relevant UI elements
        if (type === 'all' || type === 'leaderboard') {
            const leaderboardTitle = overlay.querySelector('.leaderboard-title');
            if (leaderboardTitle) {
                leaderboardTitle.textContent = `🏆 Leaderboard ${indicator}`;
            }
        }
        
        if (type === 'all' || type === 'access') {
            const playAgainBtn = overlay.querySelector('#playAgainBtn');
            if (playAgainBtn && !playAgainBtn.disabled) {
                playAgainBtn.textContent = `🎮 Play Again ${indicator}`;
            }
        }
    }
    

    

    
    /**
     * Show the actual game over screen (legacy method - now used for email capture flow)
     */
    async showGameOverScreen(score, metrics, skipSubmission = false, playerName, playerID) {
        
        
        // Show UI immediately (pass cached data - no lookup needed)
        this.showWrapperInterface(score, metrics, playerName, playerID);
        
        // Only submit score if not already submitted
        if (!skipSubmission) {
            try {
                // Wait for the combined API response
                const combinedResponse = await this.submitScore(score, playerName, playerID);
                
                
                console.error('❌ GAME OVER API FAILED - NO FALLBACK');
                throw new Error('Must fix /api/game-over endpoint');
            } catch (error) {
                console.error('❌ GAME OVER API FAILED - NO FALLBACK');
                throw new Error('Must fix /api/game-over endpoint');
            }
        } else {
            
        }
    }
    
    async submitScore(score, playerName, playerID) {
        console.error('❌ GAME OVER API FAILED - NO FALLBACK');
        throw new Error('Must fix /api/game-over endpoint');
    }
    


    
    showWrapperInterface(score, metrics, playerName, playerID) {
        
        
        // Add performance monitoring
        this.overlayPerformance = {
            startTime: Date.now(),
            markInstantDisplay() {
                
            },
            markDataLoaded(responseTime) {
                const totalTime = Date.now() - this.startTime;
                
            }
        };
        
        // Remove any existing overlay first
        const existingOverlay = document.getElementById('game-over-wrapper');
        if (existingOverlay) {
            
            existingOverlay.remove();
        }
        
        // Create the wrapper overlay with correct class for styling
        const overlay = document.createElement('div');
        overlay.id = 'game-over-wrapper';
        overlay.className = 'game-over-overlay';
        
        // NEW STREAMLINED DESIGN - Clean Apple-like Card Container with Fixed Frame
        overlay.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            z-index: 9999999 !important;
            animation: fadeIn 0.8s ease-out !important;
            font-family: 'Bungee', monospace !important;
            padding: 40px !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
        `;
        
        overlay.innerHTML = `
            <style>
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { 
                    0% { transform: translateY(50px); opacity: 0; }
                    100% { transform: translateY(0); opacity: 1; }
                }
                @keyframes scorePulse { 
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.02); }
                }
                @keyframes floatUp { 
                    0% { transform: translateY(20px); opacity: 0; }
                    100% { transform: translateY(0); opacity: 1; }
                }
                .game-over-card { animation: slideUp 0.6s ease-out; }
                .score-display { animation: scorePulse 3s ease-in-out infinite; }
                .info-line { animation: floatUp 0.6s ease-out forwards; }
                .info-line:nth-child(1) { animation-delay: 0.1s; }
                .info-line:nth-child(2) { animation-delay: 0.2s; }
                .info-line:nth-child(3) { animation-delay: 0.3s; }
                .info-line:nth-child(4) { animation-delay: 0.4s; }
                .info-line:nth-child(5) { animation-delay: 0.5s; }
                .info-line:nth-child(6) { animation-delay: 0.6s; }
                
                /* Responsive design for smaller screens */
                @media (max-height: 600px) {
                    .game-over-card {
                        max-height: 90vh !important;
                        padding: 20px !important;
                    }
                }
                
                @media (max-width: 480px) {
                    .game-over-card {
                        width: 90% !important;
                        padding: 20px !important;
                    }
                }
                
                /* Freshness indicator styles */
                .freshness-indicator {
                    font-size: 0.8em !important;
                    color: #666 !important;
                    margin-left: 10px !important;
                    font-family: 'Bungee', monospace !important;
                }
                
                .freshness-indicator.real-time {
                    color: #00ff00 !important;
                    text-shadow: 0 0 5px #00ff00 !important;
                }
                
                .freshness-indicator.cached {
                    color: #ffaa00 !important;
                    text-shadow: 0 0 5px #ffaa00 !important;
                }
                
                .leaderboard-entry.current-player {
                    background: rgba(0, 255, 0, 0.1) !important;
                    border: 1px solid #00ff00 !important;
                    border-radius: 4px !important;
                }
                
                .loading-placeholder {
                    text-align: center !important;
                    color: #999 !important;
                    padding: 20px !important;
                    font-family: 'Bungee', monospace !important;
                }
                
                .performance-indicator {
                    position: absolute !important;
                    top: 10px !important;
                    right: 10px !important;
                    font-size: 10px !important;
                    color: #00d4ff !important;
                    opacity: 0.7 !important;
                    font-family: 'Bungee', monospace !important;
                }
            </style>
            
            <!-- NEW STREAMLINED GAME OVER CARD -->
            <div class="game-over-card" style="
                background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%) !important;
                border: 3px solid #00d4ff !important;
                border-radius: 25px !important;
                padding: 25px !important;
                max-width: 600px !important;
                width: 85% !important;
                max-height: 80vh !important;
                text-align: center !important;
                box-shadow: 0 0 40px rgba(0, 212, 255, 0.4), inset 0 0 20px rgba(0, 212, 255, 0.1) !important;
                position: relative !important;
                overflow: hidden !important;
                margin: auto !important;
                backdrop-filter: blur(10px) !important;
            ">
                <!-- NEON DROP Header -->
                <div style="margin-bottom: 15px;">
                    <div style="
                        font-size: 28px !important;
                        font-weight: bold !important;
                        color: #00d4ff !important;
                        margin-bottom: 5px !important;
                        text-shadow: 0 0 15px #00d4ff !important;
                        font-family: 'Bungee', monospace !important;
                        letter-spacing: 2px !important;
                    ">NEON DROP</div>
                    
                    <div style="
                        font-size: 12px !important;
                        color: #888888 !important;
                        font-family: 'Bungee', monospace !important;
                    ">Tournament Challenge</div>
                </div>
                
                <!-- Score Display -->
                <div style="
                    font-size: 36px !important;
                    font-weight: bold !important;
                    color: #00d4ff !important;
                    margin-bottom: 10px !important;
                    text-shadow: 0 0 15px #00d4ff !important;
                    font-family: 'Bungee', monospace !important;
                " class="score-display">${score.toLocaleString()}</div>
                
                <!-- Player Info -->
                <div style="margin-bottom: 15px;">
                    <div style="
                        font-size: 14px !important;
                        color: #ffffff !important;
                        margin-bottom: 3px !important;
                        font-family: 'Bungee', monospace !important;
                    " class="info-line">👤 ${playerName}</div>
                </div>
                
                <!-- INTEGRATED LEADERBOARD SECTION -->
                <div id="leaderboardSection" style="
                    background: rgba(0, 212, 255, 0.1) !important;
                    border: 1px solid #00d4ff !important;
                    border-radius: 12px !important;
                    padding: 12px !important;
                    margin-bottom: 12px !important;
                    position: relative !important;
                ">
                    <!-- Performance indicator -->
                    <div class="performance-indicator">⚡ Loading...</div>
                    
                    <div style="
                        font-size: 18px !important;
                        color: #00d4ff !important;
                        margin-bottom: 15px !important;
                        font-weight: bold !important;
                        font-family: 'Bungee', monospace !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                    ">
                        🏆 LEADERBOARD
                        <span class="freshness-indicator">🔄 Loading...</span>
                    </div>
                    
                    <div id="leaderboardContent" style="
                        font-size: 14px !important;
                        color: #ffffff !important;
                        font-family: 'Bungee', monospace !important;
                        text-align: center !important;
                    ">
                        <div style="color: #ffffff; margin-bottom: 8px; font-size: 14px; font-weight: bold; text-align: center; padding: 4px; background: rgba(0,0,0,0.3); border-radius: 4px;">
                            🥇 1st: No Data - No Data pts
                        </div>
                        <div style="color: #ffffff; margin-bottom: 8px; font-size: 14px; font-weight: bold; text-align: center; padding: 4px; background: rgba(0,0,0,0.3); border-radius: 4px;">
                            🥈 2nd: No Data - No Data pts
                        </div>
                        <div style="color: #ffffff; margin-bottom: 8px; font-size: 14px; font-weight: bold; text-align: center; padding: 4px; background: rgba(0,0,0,0.3); border-radius: 4px;">
                            🥉 3rd: No Data - No Data pts
                        </div>
                        <div style="margin-top: 10px; color: #00ff88; font-size: 12px; font-weight: bold; text-align: center; padding: 4px; background: rgba(0,255,0,0.1); border-radius: 4px;">
                            Total Players: No Data
                        </div>
                    </div>
                    
                    <button id="viewLeaderboardBtn" style="
                        background: none !important;
                        color: #00d4ff !important;
                        border: 1px solid #00d4ff !important;
                        padding: 8px 16px !important;
                        border-radius: 8px !important;
                        font-size: 12px !important;
                        cursor: pointer !important;
                        transition: all 0.3s ease !important;
                        font-family: 'Bungee', monospace !important;
                        margin-top: 10px !important;
                    "
                    onmouseover="this.style.backgroundColor='rgba(0, 212, 255, 0.1)'"
                    onmouseout="this.style.backgroundColor='transparent'"
                    class="info-line">
                        View Full Leaderboard
                    </button>
                </div>
                
                <!-- CHALLENGE FRIENDS SECTION -->
                <div style="
                    background: rgba(0, 255, 136, 0.1) !important;
                    border: 1px solid #00ff88 !important;
                    border-radius: 12px !important;
                    padding: 12px !important;
                    margin-bottom: 15px !important;
                ">
                    <div style="
                        font-size: 18px !important;
                        color: #00ff88 !important;
                        margin-bottom: 15px !important;
                        font-weight: bold !important;
                        font-family: 'Bungee', monospace !important;
                    ">⚡ CHALLENGE FRIENDS</div>
                    
                    <div style="
                        font-size: 14px !important;
                        color: #ffffff !important;
                        margin-bottom: 15px !important;
                        font-family: 'Bungee', monospace !important;
                    ">Save this game and challenge others!</div>
                    
                    <div style="
                        display: flex !important;
                        justify-content: space-around !important;
                        margin-bottom: 15px !important;
                        flex-wrap: wrap !important;
                        gap: 10px !important;
                    ">
                        <button id="challenge2Btn" style="
                            background: rgba(0, 255, 136, 0.2) !important;
                            border: 2px solid #00ff88 !important;
                            border-radius: 8px !important;
                            padding: 12px !important;
                            text-align: center !important;
                            cursor: pointer !important;
                            transition: all 0.3s ease !important;
                            min-width: 120px !important;
                        "
                        onmouseover="this.style.background='rgba(0, 255, 136, 0.3)'; this.style.transform='scale(1.05)'"
                        onmouseout="this.style.background='rgba(0, 255, 136, 0.2)'; this.style.transform='scale(1)'"
                        class="info-line">
                            <div style="
                                font-size: 16px !important;
                                color: #00ff88 !important;
                                font-weight: bold !important;
                                font-family: 'Bungee', monospace !important;
                            ">💰 $2 Challenge</div>
                            <div style="
                                font-size: 12px !important;
                                color: #ffffff !important;
                                font-family: 'Bungee', monospace !important;
                            ">Winner gets $3.60</div>
                        </button>
                        
                        <button id="challenge5Btn" style="
                            background: rgba(0, 255, 136, 0.2) !important;
                            border: 2px solid #00ff88 !important;
                            border-radius: 8px !important;
                            padding: 12px !important;
                            text-align: center !important;
                            cursor: pointer !important;
                            transition: all 0.3s ease !important;
                            min-width: 120px !important;
                        "
                        onmouseover="this.style.background='rgba(0, 255, 136, 0.3)'; this.style.transform='scale(1.05)'"
                        onmouseout="this.style.background='rgba(0, 255, 136, 0.2)'; this.style.transform='scale(1)'"
                        class="info-line">
                            <div style="
                                font-size: 16px !important;
                                color: #00ff88 !important;
                                font-weight: bold !important;
                                font-family: 'Bungee', monospace !important;
                            ">💎 $5 Challenge</div>
                            <div style="
                                font-size: 12px !important;
                                color: #ffffff !important;
                                font-family: 'Bungee', monospace !important;
                            ">Winner gets $9.00</div>
                        </button>
                    </div>
                    
                    <div style="
                        display: flex !important;
                        gap: 10px !important;
                        justify-content: center !important;
                        flex-wrap: wrap !important;
                    ">
                        <button id="shareScoreBtn" style="
                            background: none !important;
                            color: #00ff88 !important;
                            border: 1px solid #00ff88 !important;
                            padding: 10px 16px !important;
                            border-radius: 8px !important;
                            font-size: 12px !important;
                            cursor: pointer !important;
                            transition: all 0.3s ease !important;
                            font-family: 'Bungee', monospace !important;
                        "
                        onmouseover="this.style.backgroundColor='rgba(0, 255, 136, 0.1)'"
                        onmouseout="this.style.backgroundColor='transparent'"
                        class="info-line">
                            Share Score
                        </button>
                    </div>
                </div>
                
                <!-- PRIMARY ACTION BUTTONS -->
                <div style="
                    display: flex !important;
                    gap: 10px !important;
                    justify-content: center !important;
                    margin-bottom: 12px !important;
                    flex-wrap: wrap !important;
                ">
                    <button id="playAgainBtn" style="
                        background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%) !important;
                        color: #000000 !important;
                        border: none !important;
                        padding: 10px 20px !important;
                        border-radius: 8px !important;
                        font-size: 13px !important;
                        font-weight: bold !important;
                        cursor: pointer !important;
                        transition: all 0.3s ease !important;
                        font-family: 'Bungee', monospace !important;
                        box-shadow: 0 0 20px rgba(0, 212, 255, 0.4) !important;
                        min-width: 120px !important;
                    "
                    onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 0 30px rgba(0, 212, 255, 0.6)'"
                    onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 0 20px rgba(0, 212, 255, 0.4)'"
                    class="info-line">
                        🔄 PLAY AGAIN
                    </button>
                    
                    <button id="gamesBtn" style="
                        background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%) !important;
                        color: #ffffff !important;
                        border: none !important;
                        padding: 10px 20px !important;
                        border-radius: 8px !important;
                        font-size: 13px !important;
                        font-weight: bold !important;
                        cursor: pointer !important;
                        transition: all 0.3s ease !important;
                        font-family: 'Bungee', monospace !important;
                        box-shadow: 0 0 20px rgba(255, 107, 107, 0.4) !important;
                        min-width: 120px !important;
                    "
                    onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 0 30px rgba(255, 107, 107, 0.6)'"
                    onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 0 20px rgba(255, 107, 107, 0.4)'"
                    class="info-line">
                        🎮 GAMES
                    </button>
                    
                    <button id="homeBtn" style="
                        background: none !important;
                        color: #ffaa00 !important;
                        border: 2px solid #ffaa00 !important;
                        padding: 10px 20px !important;
                        border-radius: 8px !important;
                        font-size: 13px !important;
                        font-weight: bold !important;
                        cursor: pointer !important;
                        transition: all 0.3s ease !important;
                        font-family: 'Bungee', monospace !important;
                        text-shadow: 0 0 10px #ffaa00 !important;
                        box-shadow: 0 0 15px rgba(255, 170, 0, 0.3) !important;
                        min-width: 120px !important;
                    "
                    onmouseover="this.style.backgroundColor='rgba(255, 170, 0, 0.1)'; this.style.boxShadow='0 0 25px rgba(255, 170, 0, 0.5)'"
                    onmouseout="this.style.backgroundColor='transparent'; this.style.boxShadow='0 0 15px rgba(255, 170, 0, 0.3)'"
                    class="info-line">
                        🏠 HOME
                    </button>
                </div>
            </div>
        `;
        
        // Add to document ONCE with error handling
        try {
            document.body.appendChild(overlay);
            this.log(this.LOG_LEVEL.INFO, '✅ Overlay successfully added to document.body');
            
            // 🎯 REMOVED: Redundant leaderboard update - API response handler will update when data arrives
            
        } catch (error) {
            this.log(this.LOG_LEVEL.ERROR, '❌ Error adding overlay to DOM:', error);
        }
        
        // Setup button handlers for NEW STREAMLINED DESIGN
        
        
        // Play Again Button - Smart routing with paywall check
        const playAgainBtn = overlay.querySelector('#playAgainBtn');
        if (playAgainBtn) {
            
            
            // Set up click handler for when button is enabled
            playAgainBtn.addEventListener('click', async (e) => {
                
                e.stopPropagation(); // Prevent event bubbling
                
                // Button should only be clickable if paywall check passed
                if (playAgainBtn.disabled) {
                    
                    return;
                }
                
                // Hide any leaderboard overlay that might be visible
                if (this.leaderboardInstance && this.leaderboardInstance.isVisible) {
                    
                    this.leaderboardInstance.hide();
                }
                
                // Hide this game over overlay
                this.hide();
                
                // Paywall already checked at game start - just start the game
                
                this.eventBus.emit('startGame');
            });
        } else {
            console.error('❌ Play Again button not found!');
        }
        
        // Home Button - Return to landing page
        const homeBtn = overlay.querySelector('#homeBtn');
        if (homeBtn) {
            homeBtn.addEventListener('click', () => {
                
                this.hide();
                window.location.href = '/';
            });
        }
        
        // View Leaderboard Button - Show full leaderboard
        const viewLeaderboardBtn = overlay.querySelector('#viewLeaderboardBtn');
        if (viewLeaderboardBtn) {
            
            viewLeaderboardBtn.addEventListener('click', (e) => {
                
                e.stopPropagation(); // Prevent event bubbling
                this.showStyledLeaderboard();
            });
        }
        
        // $2 Challenge Button - Direct challenge creation
        const challenge2Btn = overlay.querySelector('#challenge2Btn');
        if (challenge2Btn) {
            challenge2Btn.addEventListener('click', (e) => {
                
                e.stopPropagation();
                this.createChallenge(score, 2);
            });
        }
        
        // $5 Challenge Button - Direct challenge creation
        const challenge5Btn = overlay.querySelector('#challenge5Btn');
        if (challenge5Btn) {
            challenge5Btn.addEventListener('click', (e) => {
                
                e.stopPropagation();
                this.createChallenge(score, 5);
            });
        }
        
        // Share Score Button - Social sharing
        const shareScoreBtn = overlay.querySelector('#shareScoreBtn');
        if (shareScoreBtn) {
            shareScoreBtn.addEventListener('click', (e) => {
                
                e.stopPropagation();
                this.shareScore(score);
            });
        }
        
        // Games Button - Navigate to games page
        const gamesBtn = overlay.querySelector('#gamesBtn');
        if (gamesBtn) {
            gamesBtn.addEventListener('click', (e) => {
                
                e.stopPropagation();
                this.hide();
                window.location.href = '/games/';
            });
        }
    }
    
    // Load real leaderboard data from backend or combined response

    
    // NEW: Challenge creation functionality
    showChallengeCreation(score) {
        // console.log('⚡ Showing challenge creation for score:', score);
        
        // Create challenge modal
        const challengeModal = document.createElement('div');
        challengeModal.id = 'challenge-modal';
        challengeModal.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: rgba(0, 0, 0, 0.8) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            z-index: 9999999 !important;
            font-family: 'Bungee', monospace !important;
        `;
        
        challengeModal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%) !important;
                border: 2px solid #00ff88 !important;
                border-radius: 20px !important;
                padding: 30px !important;
                max-width: 500px !important;
                width: 90% !important;
                text-align: center !important;
                box-shadow: 0 0 30px rgba(0, 255, 136, 0.3) !important;
            ">
                <div style="
                    font-size: 24px !important;
                    color: #00ff88 !important;
                    margin-bottom: 20px !important;
                    font-weight: bold !important;
                ">⚡ CREATE CHALLENGE</div>
                
                <div style="
                    font-size: 16px !important;
                    color: #ffffff !important;
                    margin-bottom: 20px !important;
                ">Challenge others with your score of <span style="color: #00ff88; font-weight: bold;">${score.toLocaleString()}</span></div>
                
                <div style="
                    display: flex !important;
                    gap: 15px !important;
                    justify-content: center !important;
                    margin-bottom: 20px !important;
                    flex-wrap: wrap !important;
                ">
                    <button id="challenge2Btn" style="
                        background: linear-gradient(135deg, #00ff88 0%, #00cc66 100%) !important;
                        color: #000000 !important;
                        border: none !important;
                        padding: 15px 20px !important;
                        border-radius: 10px !important;
                        font-size: 14px !important;
                        font-weight: bold !important;
                        cursor: pointer !important;
                        transition: all 0.3s ease !important;
                        font-family: 'Bungee', monospace !important;
                    "
                    onmouseover="this.style.transform='scale(1.05)'"
                    onmouseout="this.style.transform='scale(1)'">
                        💰 $2 Challenge<br><span style="font-size: 12px;">Winner gets $3.60</span>
                    </button>
                    
                    <button id="challenge5Btn" style="
                        background: linear-gradient(135deg, #00ff88 0%, #00cc66 100%) !important;
                        color: #000000 !important;
                        border: none !important;
                        padding: 15px 20px !important;
                        border-radius: 10px !important;
                        font-size: 14px !important;
                        font-weight: bold !important;
                        cursor: pointer !important;
                        transition: all 0.3s ease !important;
                        font-family: 'Bungee', monospace !important;
                    "
                    onmouseover="this.style.transform='scale(1.05)'"
                    onmouseout="this.style.transform='scale(1)'">
                        💎 $5 Challenge<br><span style="font-size: 12px;">Winner gets $9.00</span>
                    </button>
                </div>
                
                <button id="closeChallengeBtn" style="
                    background: none !important;
                    color: #888888 !important;
                    border: 1px solid #555555 !important;
                    padding: 10px 20px !important;
                    border-radius: 8px !important;
                    font-size: 14px !important;
                    cursor: pointer !important;
                    transition: all 0.3s ease !important;
                    font-family: 'Bungee', monospace !important;
                "
                onmouseover="this.style.color='#ffffff'; this.style.borderColor='#888888'"
                onmouseout="this.style.color='#888888'; this.style.borderColor='#555555'">
                    Cancel
                </button>
            </div>
        `;
        
        // Add event listeners
        challengeModal.querySelector('#challenge2Btn').addEventListener('click', () => {
            this.createChallenge(score, 2);
            challengeModal.remove();
        });
        
        challengeModal.querySelector('#challenge5Btn').addEventListener('click', () => {
            this.createChallenge(score, 5);
            challengeModal.remove();
        });
        
        challengeModal.querySelector('#closeChallengeBtn').addEventListener('click', () => {
            challengeModal.remove();
        });
        
        document.body.appendChild(challengeModal);
    }
    
    // NEW: Create challenge functionality
    createChallenge(score, amount) {
        
        
        // For now, show a success message
        // In the future, this would integrate with your smart contracts
        const successMsg = document.createElement('div');
        successMsg.style.cssText = `
            position: fixed !important;
            top: 20px !important;
            right: 20px !important;
            background: linear-gradient(135deg, #00ff88 0%, #00cc66 100%) !important;
            color: #000000 !important;
            padding: 15px 20px !important;
            border-radius: 10px !important;
            font-family: 'Bungee', monospace !important;
            font-weight: bold !important;
            z-index: 9999999 !important;
            animation: slideIn 0.5s ease-out !important;
        `;
        
        successMsg.innerHTML = `
            <style>
                @keyframes slideIn { 
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            </style>
            ✅ $${amount} Challenge Created!<br>
            <span style="font-size: 12px;">Share with friends to start competing</span>
        `;
        
        document.body.appendChild(successMsg);
        
        // Remove after 3 seconds
        setTimeout(() => {
            successMsg.remove();
        }, 3000);
    }
    
    // NEW: Share score functionality
    shareScore(score) {
        
        
        const shareText = `I just scored ${score.toLocaleString()} points in NeonDrop on BlockZone Lab! 🎮 Can you beat my score? Play at blockzonelab.com`;
        
        if (navigator.share) {
            // Use native sharing if available
            navigator.share({
                title: 'My NeonDrop Score',
                text: shareText,
                url: 'https://blockzonelab.com'
            }).catch(err => {
                
                this.fallbackShare(shareText);
            });
        } else {
            // Fallback to clipboard
            this.fallbackShare(shareText);
        }
    }
    
    // NEW: Fallback sharing method
    fallbackShare(shareText) {
        navigator.clipboard.writeText(shareText).then(() => {
            const successMsg = document.createElement('div');
            successMsg.style.cssText = `
                position: fixed !important;
                top: 20px !important;
                right: 20px !important;
                background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%) !important;
                color: #000000 !important;
                padding: 15px 20px !important;
                border-radius: 10px !important;
                font-family: 'Bungee', monospace !important;
                font-weight: bold !important;
                z-index: 9999999 !important;
                animation: slideIn 0.5s ease-out !important;
            `;
            
            successMsg.innerHTML = `
                <style>
                    @keyframes slideIn { 
                        from { transform: translateX(100%); opacity: 0; }
                        to { transform: translateX(0); opacity: 1; }
                    }
                </style>
                📋 Score copied to clipboard!<br>
                <span style="font-size: 12px;">Paste it anywhere to share</span>
            `;
            
            document.body.appendChild(successMsg);
            
            // Remove after 3 seconds
            setTimeout(() => {
                successMsg.remove();
            }, 3000);
        });
    }
    
    // REMOVED: setupButtonHandlers method - not used, buttons are handled inline
    
    getPlayerName() {
        this.log(this.LOG_LEVEL.DEBUG, '🔍 Getting player name from multiple sources...');
        
        // Try IdentityManager first (most reliable)
        if (window.identityManager && window.identityManager.getPlayerName) {
            const name = window.identityManager.getPlayerName();
            this.log(this.LOG_LEVEL.DEBUG, '🔍 Got name from identityManager:', name);
            if (name && name !== 'Player') return name;
        }
        
        // Try GameWrapper
        if (window.gameWrapper && window.gameWrapper.getPlayerName) {
            const name = window.gameWrapper.getPlayerName();
            this.log(this.LOG_LEVEL.DEBUG, '🔍 Got name from gameWrapper:', name);
            if (name && name !== 'Player') return name;
        }
        
        // Try this.identitySystem
        if (this.identitySystem && this.identitySystem.getPlayerName) {
            const name = this.identitySystem.getPlayerName();
            this.log(this.LOG_LEVEL.DEBUG, '🔍 Got name from this.identitySystem:', name);
            if (name && name !== 'Player') return name;
        }
        
        // Try localStorage directly
        try {
            const playerData = localStorage.getItem('blockzone_player_data');
            if (playerData) {
                const parsed = JSON.parse(playerData);
                this.log(this.LOG_LEVEL.DEBUG, '🔍 Got name from localStorage:', parsed.display_name);
                if (parsed.display_name) return parsed.display_name;
            }
        } catch (e) {
            this.log(this.LOG_LEVEL.ERROR, '❌ Error reading from localStorage:', e);
        }
        
        this.log(this.LOG_LEVEL.WARN, '⚠️ No player name found, using default');
        return 'Player';
    }
    

    
    /**
     * Update Play Again button state
     */
    updatePlayAgainButton(button, state, text) {
        if (state === 'enabled') {
            button.disabled = false;
            button.style.color = '#00d4ff';
            button.style.borderColor = '#00d4ff';
            button.style.cursor = 'pointer';
            button.style.opacity = '1';
            button.style.textShadow = '0 0 10px #00d4ff';
            button.style.boxShadow = '0 0 15px rgba(0, 212, 255, 0.3)';
            button.onmouseover = () => {
                button.style.backgroundColor = 'rgba(0, 212, 255, 0.1)';
                button.style.boxShadow = '0 0 25px rgba(0, 212, 255, 0.5)';
            };
            button.onmouseout = () => {
                button.style.backgroundColor = 'transparent';
                button.style.boxShadow = '0 0 15px rgba(0, 212, 255, 0.3)';
            };
        } else {
            button.disabled = true;
            button.style.color = '#666666';
            button.style.borderColor = '#666666';
            button.style.cursor = 'not-allowed';
            button.style.opacity = '0.5';
            button.style.textShadow = '0 0 10px #666666';
            button.style.boxShadow = '0 0 15px rgba(102, 102, 102, 0.3)';
            button.onmouseover = null;
            button.onmouseout = null;
        }
        
        button.textContent = text;
        
    }
    
    getPlayerId() {
        this.log(this.LOG_LEVEL.DEBUG, '🔍 Getting player ID from multiple sources...');
        
        // Try IdentityManager first (most reliable)
        if (window.identityManager && window.identityManager.getPlayerId) {
            const id = window.identityManager.getPlayerId();
            this.log(this.LOG_LEVEL.DEBUG, '🔍 Got ID from identityManager:', id);
            if (id && id !== 'unknown') return id;
        }
        
        // Try GameWrapper
        if (window.gameWrapper && window.gameWrapper.getPlayerId) {
            const id = window.gameWrapper.getPlayerId();
            this.log(this.LOG_LEVEL.DEBUG, '🔍 Got ID from gameWrapper:', id);
            if (id && id !== 'unknown') return id;
        }
        
        // Try this.identitySystem
        if (this.identitySystem && this.identitySystem.getPlayerId) {
            const id = this.identitySystem.getPlayerId();
            this.log(this.LOG_LEVEL.DEBUG, '🔍 Got ID from this.identitySystem:', id);
            if (id && id !== 'unknown') return id;
        }
        
        // Try localStorage directly
        try {
            const playerData = localStorage.getItem('blockzone_player_data');
            if (playerData) {
                const parsed = JSON.parse(playerData);
                this.log(this.LOG_LEVEL.DEBUG, '🔍 Got ID from localStorage:', parsed.player_id);
                if (parsed.player_id) return parsed.player_id;
            }
        } catch (e) {
            this.log(this.LOG_LEVEL.ERROR, '❌ Error reading from localStorage:', e);
        }
        
        this.log(this.LOG_LEVEL.WARN, '⚠️ No player ID found, using default');
        return 'unknown';
    }
    
    hide() {
        const overlay = document.getElementById('game-over-wrapper');
        if (overlay) {
            overlay.remove();
        }
        this.isVisible = false;
    }
    
    async showStyledLeaderboard() {
        
        
        // Prevent multiple instances
        if (this.leaderboardInstance && this.leaderboardInstance.isVisible) {
            
            this.leaderboardInstance.hide();
            return;
        }
        
        try {
            // Dynamically import the LeaderboardDisplay component
            
            const { LeaderboardDisplay } = await import('/shared/components/LeaderboardDisplay.js');
            
            
            this.leaderboardInstance = new LeaderboardDisplay();
            
            
            await this.leaderboardInstance.show();
            
        } catch (error) {
            console.error('❌ Failed to show styled leaderboard:', error);
            console.error('❌ Error details:', error.message, error.stack);
            
            // Show a styled error message instead of opening raw API
            this.showLeaderboardError('Failed to load leaderboard component. Please try again.');
        }
    }
    
    showLeaderboardError(message) {
        
        
        // Remove any existing error overlay
        const existingError = document.getElementById('leaderboard-error');
        if (existingError) {
            existingError.remove();
        }
        
        const overlay = document.createElement('div');
        overlay.id = 'leaderboard-error';
        overlay.className = 'leaderboard-overlay';
        
        overlay.innerHTML = `
            <style>
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes neonGlow { 
                    0%, 100% { text-shadow: 0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor; }
                    50% { text-shadow: 0 0 20px currentColor, 0 0 30px currentColor, 0 0 40px currentColor; }
                }
                .leaderboard-overlay {
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    width: 100vw !important;
                    height: 100vh !important;
                    background: rgba(0, 0, 0, 0.9) !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    z-index: 10000000 !important;
                    animation: fadeIn 0.5s ease-out !important;
                }
                .error-container {
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%) !important;
                    border-radius: 20px !important;
                    padding: 40px !important;
                    max-width: 500px !important;
                    width: 90% !important;
                    text-align: center !important;
                    box-shadow: 0 20px 60px rgba(255, 68, 68, 0.3), 0 0 40px rgba(255, 68, 68, 0.1) !important;
                    border: 1px solid rgba(255, 68, 68, 0.2) !important;
                    color: white !important;
                    font-family: 'Bungee', monospace !important;
                }
                .error-icon {
                    font-size: 48px !important;
                    margin-bottom: 20px !important;
                }
                .error-title {
                    font-size: 24px !important;
                    font-weight: bold !important;
                    color: #ff4444 !important;
                    margin-bottom: 15px !important;
                    animation: neonGlow 2s ease-in-out infinite !important;
                }
                .error-message {
                    font-size: 16px !important;
                    color: #cccccc !important;
                    margin-bottom: 25px !important;
                    line-height: 1.5 !important;
                }
                .action-btn {
                    padding: 12px 24px !important;
                    border: none !important;
                    border-radius: 8px !important;
                    font-family: 'Bungee', monospace !important;
                    font-weight: 600 !important;
                    font-size: 14px !important;
                    cursor: pointer !important;
                    transition: all 0.3s ease !important;
                    min-width: 120px !important;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
                }
                .action-btn.secondary {
                    background: linear-gradient(45deg, #666, #444) !important;
                    color: #fff !important;
                    border: 2px solid #666 !important;
                }
                .action-btn.secondary:hover {
                    background: linear-gradient(45deg, #777, #555) !important;
                    transform: translateY(-2px) !important;
                    box-shadow: 0 8px 25px rgba(136, 136, 136, 0.4) !important;
                }
            </style>
            
            <div class="error-container">
                <div class="error-icon">⚠️</div>
                <div class="error-title">Leaderboard Error</div>
                <div class="error-message">${message}</div>
                <button id="closeErrorBtn" class="action-btn secondary">Close</button>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        document.getElementById('closeErrorBtn').addEventListener('click', () => {
            overlay.remove();
        });
        
        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });
    }
    
    // ⚡ NEW METHOD: Add this method to eliminate redundant identity lookups
    async getIdentityDataOnce() {
        const now = Date.now();
        
        // Return cached data if fresh (eliminates repeat lookups)
        if (this.identityCache && (now - this.cacheTimestamp) < this.CACHE_DURATION) {
            this.log(this.LOG_LEVEL.DEBUG, '🚀 Using cached identity data (0ms lookup time)');
            return this.identityCache;
        }

        this.log(this.LOG_LEVEL.INFO, '🔄 Fetching identity data once for entire game-over sequence...');
        
        // Fetch both name and ID in parallel (single network call)
        const [playerName, playerID] = await Promise.all([
            this.getPlayerName(),
            this.getPlayerId()
        ]);

        // Cache for immediate reuse
        this.identityCache = { playerName, playerID };
        this.cacheTimestamp = now;

        this.log(this.LOG_LEVEL.INFO, '✅ Identity data cached - all subsequent calls will be instant');
        return this.identityCache;
    }
    
    /**
     * ⚡ INSTANT: Create overlay immediately with hard-coded medal positions
     */
    createOverlayWithHardcodedMedals(score) {
        this.log(this.LOG_LEVEL.INFO, '⚡ INSTANT: Creating overlay with hard-coded medal positions');
        
        // 🎯 FIXED: Check for cached leaderboard data first
        const cachedData = this.getLeaderboardForOverlay(score);
        if (cachedData) {
            this.log(this.LOG_LEVEL.INFO, '📊 Found cached leaderboard data, will use real data instead of hard-coded');
        }
        
        // Remove any existing overlay first
        const existingOverlay = document.getElementById('game-over-wrapper');
        if (existingOverlay) {
            this.log(this.LOG_LEVEL.INFO, '🎮 Removing existing game-over-wrapper overlay');
            existingOverlay.remove();
        }
        
        // Create the wrapper overlay with correct class for styling
        const overlay = document.createElement('div');
        overlay.id = 'game-over-wrapper';
        overlay.className = 'game-over-overlay';
        
        // NEW STREAMLINED DESIGN - Clean Apple-like Card Container with Fixed Frame
        overlay.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            z-index: 9999999 !important;
            animation: fadeIn 0.8s ease-out !important;
            font-family: 'Bungee', monospace !important;
            padding: 40px !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
        `;
        
        overlay.innerHTML = `
            <style>
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { 
                    0% { transform: translateY(50px); opacity: 0; }
                    100% { transform: translateY(0); opacity: 1; }
                }
                @keyframes scorePulse { 
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.02); }
                }
                @keyframes floatUp { 
                    0% { transform: translateY(20px); opacity: 0; }
                    100% { transform: translateY(0); opacity: 1; }
                }
                .game-over-card { animation: slideUp 0.6s ease-out; }
                .score-display { animation: scorePulse 3s ease-in-out infinite; }
                .info-line { animation: floatUp 0.6s ease-out forwards; }
                .info-line:nth-child(1) { animation-delay: 0.1s; }
                .info-line:nth-child(2) { animation-delay: 0.2s; }
                .info-line:nth-child(3) { animation-delay: 0.3s; }
                .info-line:nth-child(4) { animation-delay: 0.4s; }
                .info-line:nth-child(5) { animation-delay: 0.5s; }
                .info-line:nth-child(6) { animation-delay: 0.6s; }
                
                /* Responsive design for smaller screens */
                @media (max-height: 600px) {
                    .game-over-card {
                        max-height: 90vh !important;
                        padding: 20px !important;
                    }
                }
                
                @media (max-width: 480px) {
                    .game-over-card {
                        width: 90% !important;
                        padding: 20px !important;
                    }
                }
                
                /* Freshness indicator styles */
                .freshness-indicator {
                    font-size: 0.8em !important;
                    color: #666 !important;
                    margin-left: 10px !important;
                    font-family: 'Bungee', monospace !important;
                }
                
                .freshness-indicator.real-time {
                    color: #00ff00 !important;
                    text-shadow: 0 0 5px #00ff00 !important;
                }
                
                .freshness-indicator.cached {
                    color: #ffaa00 !important;
                    text-shadow: 0 0 5px #ffaa00 !important;
                }
                
                .leaderboard-entry.current-player {
                    background: rgba(0, 255, 0, 0.1) !important;
                    border: 1px solid #00ff00 !important;
                    border-radius: 4px !important;
                }
                
                .loading-placeholder {
                    text-align: center !important;
                    color: #999 !important;
                    padding: 20px !important;
                    font-family: 'Bungee', monospace !important;
                }
                
                .performance-indicator {
                    position: absolute !important;
                    top: 10px !important;
                    right: 10px !important;
                    font-size: 10px !important;
                    color: #00d4ff !important;
                    opacity: 0.7 !important;
                    font-family: 'Bungee', monospace !important;
                }
            </style>
            
            <!-- NEW STREAMLINED GAME OVER CARD -->
            <div class="game-over-card" style="
                background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%) !important;
                border: 3px solid #00d4ff !important;
                border-radius: 25px !important;
                padding: 25px !important;
                max-width: 600px !important;
                width: 85% !important;
                max-height: 80vh !important;
                text-align: center !important;
                box-shadow: 0 0 40px rgba(0, 212, 255, 0.4), inset 0 0 20px rgba(0, 212, 255, 0.1) !important;
                position: relative !important;
                overflow: hidden !important;
                margin: auto !important;
                backdrop-filter: blur(10px) !important;
            ">
                <!-- NEON DROP Header -->
                <div style="margin-bottom: 15px;">
                    <div style="
                        font-size: 28px !important;
                        font-weight: bold !important;
                        color: #00d4ff !important;
                        margin-bottom: 5px !important;
                        text-shadow: 0 0 15px #00d4ff !important;
                        font-family: 'Bungee', monospace !important;
                        letter-spacing: 2px !important;
                    ">NEON DROP</div>
                    
                    <div style="
                        font-size: 12px !important;
                        color: #888888 !important;
                        font-family: 'Bungee', monospace !important;
                    ">Tournament Challenge</div>
                </div>
                
                <!-- Score Display -->
                <div style="
                    font-size: 36px !important;
                    font-weight: bold !important;
                    color: #00d4ff !important;
                    margin-bottom: 10px !important;
                    text-shadow: 0 0 15px #00d4ff !important;
                    font-family: 'Bungee', monospace !important;
                " class="score-display">${score.toLocaleString()}</div>
                
                <!-- Player Info (will be updated) -->
                <div id="playerInfoSection" style="margin-bottom: 15px;">
                    <div style="
                        font-size: 14px !important;
                        color: #ffffff !important;
                        margin-bottom: 3px !important;
                        font-family: 'Bungee', monospace !important;
                    " class="info-line">👤 Loading player...</div>
                </div>
                
                <!-- INTEGRATED LEADERBOARD SECTION -->
                <div id="leaderboardSection" style="
                    background: rgba(0, 212, 255, 0.1) !important;
                    border: 1px solid #00d4ff !important;
                    border-radius: 12px !important;
                    padding: 12px !important;
                    margin-bottom: 12px !important;
                    position: relative !important;
                ">
                    <!-- Performance indicator -->
                    <div class="performance-indicator">⚡ Loading...</div>
                    
                    <div style="
                        font-size: 18px !important;
                        color: #00d4ff !important;
                        margin-bottom: 15px !important;
                        font-weight: bold !important;
                        font-family: 'Bungee', monospace !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                    ">
                        🏆 LEADERBOARD
                        <span class="freshness-indicator">🔄 Loading...</span>
                    </div>
                    
                    <div id="leaderboardContent" style="
                        font-size: 14px !important;
                        color: #ffffff !important;
                        font-family: 'Bungee', monospace !important;
                        text-align: center !important;
                    ">
                        <div style="color: #ffffff; margin-bottom: 8px; font-size: 14px; font-weight: bold; text-align: center; padding: 4px; background: rgba(0,0,0,0.3); border-radius: 4px;">
                            🥇 1st: No Data - No Data pts
                        </div>
                        <div style="color: #ffffff; margin-bottom: 8px; font-size: 14px; font-weight: bold; text-align: center; padding: 4px; background: rgba(0,0,0,0.3); border-radius: 4px;">
                            🥈 2nd: No Data - No Data pts
                        </div>
                        <div style="color: #ffffff; margin-bottom: 8px; font-size: 14px; font-weight: bold; text-align: center; padding: 4px; background: rgba(0,0,0,0.3); border-radius: 4px;">
                            🥉 3rd: No Data - No Data pts
                        </div>
                        <div style="margin-top: 10px; color: #00ff88; font-size: 12px; font-weight: bold; text-align: center; padding: 4px; background: rgba(0,255,0,0.1); border-radius: 4px;">
                            Total Players: No Data
                        </div>
                    </div>
                    
                    <button id="viewLeaderboardBtn" style="
                        background: none !important;
                        color: #00d4ff !important;
                        border: 1px solid #00d4ff !important;
                        padding: 8px 16px !important;
                        border-radius: 8px !important;
                        font-size: 12px !important;
                        cursor: pointer !important;
                        transition: all 0.3s ease !important;
                        font-family: 'Bungee', monospace !important;
                        margin-top: 10px !important;
                    "
                    onmouseover="this.style.backgroundColor='rgba(0, 212, 255, 0.1)'"
                    onmouseout="this.style.backgroundColor='transparent'"
                    class="info-line">
                        View Full Leaderboard
                    </button>
                </div>
                
                <!-- CHALLENGE FRIENDS SECTION -->
                <div style="
                    background: rgba(0, 255, 136, 0.1) !important;
                    border: 1px solid #00ff88 !important;
                    border-radius: 12px !important;
                    padding: 12px !important;
                    margin-bottom: 15px !important;
                ">
                    <div style="
                        font-size: 18px !important;
                        color: #00ff88 !important;
                        margin-bottom: 15px !important;
                        font-weight: bold !important;
                        font-family: 'Bungee', monospace !important;
                    ">⚡ CHALLENGE FRIENDS</div>
                    
                    <div style="
                        font-size: 14px !important;
                        color: #ffffff !important;
                        margin-bottom: 15px !important;
                        font-family: 'Bungee', monospace !important;
                    ">Save this game and challenge others!</div>
                    
                    <div style="
                        display: flex !important;
                        justify-content: space-around !important;
                        margin-bottom: 15px !important;
                        flex-wrap: wrap !important;
                        gap: 10px !important;
                    ">
                        <button id="challenge2Btn" style="
                            background: rgba(0, 255, 136, 0.2) !important;
                            border: 2px solid #00ff88 !important;
                            border-radius: 8px !important;
                            padding: 12px !important;
                            text-align: center !important;
                            cursor: pointer !important;
                            transition: all 0.3s ease !important;
                            min-width: 120px !important;
                        "
                        onmouseover="this.style.background='rgba(0, 255, 136, 0.3)'; this.style.transform='scale(1.05)'"
                        onmouseout="this.style.background='rgba(0, 255, 136, 0.2)'; this.style.transform='scale(1)'"
                        class="info-line">
                            <div style="
                                font-size: 16px !important;
                                color: #00ff88 !important;
                                font-weight: bold !important;
                                font-family: 'Bungee', monospace !important;
                            ">💰 $2 Challenge</div>
                            <div style="
                                font-size: 12px !important;
                                color: #ffffff !important;
                                font-family: 'Bungee', monospace !important;
                            ">Winner gets $3.60</div>
                        </button>
                        
                        <button id="challenge5Btn" style="
                            background: rgba(0, 255, 136, 0.2) !important;
                            border: 2px solid #00ff88 !important;
                            border-radius: 8px !important;
                            padding: 12px !important;
                            text-align: center !important;
                            cursor: pointer !important;
                            transition: all 0.3s ease !important;
                            min-width: 120px !important;
                        "
                        onmouseover="this.style.background='rgba(0, 255, 136, 0.3)'; this.style.transform='scale(1.05)'"
                        onmouseout="this.style.background='rgba(0, 255, 136, 0.2)'; this.style.transform='scale(1)'"
                        class="info-line">
                            <div style="
                                font-size: 16px !important;
                                color: #00ff88 !important;
                                font-weight: bold !important;
                                font-family: 'Bungee', monospace !important;
                            ">💎 $5 Challenge</div>
                            <div style="
                                font-size: 12px !important;
                                color: #ffffff !important;
                                font-family: 'Bungee', monospace !important;
                            ">Winner gets $9.00</div>
                        </button>
                    </div>
                    
                    <div style="
                        display: flex !important;
                        gap: 10px !important;
                        justify-content: center !important;
                        flex-wrap: wrap !important;
                    ">
                        <button id="shareScoreBtn" style="
                            background: none !important;
                            color: #00ff88 !important;
                            border: 1px solid #00ff88 !important;
                            padding: 10px 16px !important;
                            border-radius: 8px !important;
                            font-size: 12px !important;
                            cursor: pointer !important;
                            transition: all 0.3s ease !important;
                            font-family: 'Bungee', monospace !important;
                        "
                        onmouseover="this.style.backgroundColor='rgba(0, 255, 136, 0.1)'"
                        onmouseout="this.style.backgroundColor='transparent'"
                        class="info-line">
                            Share Score
                        </button>
                    </div>
                </div>
                
                <!-- PRIMARY ACTION BUTTONS -->
                <div style="
                    display: flex !important;
                    gap: 10px !important;
                    justify-content: center !important;
                    margin-bottom: 12px !important;
                    flex-wrap: wrap !important;
                ">
                    <button id="playAgainBtn" style="
                        background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%) !important;
                        color: #000000 !important;
                        border: none !important;
                        padding: 10px 20px !important;
                        border-radius: 8px !important;
                        font-size: 13px !important;
                        font-weight: bold !important;
                        cursor: pointer !important;
                        transition: all 0.3s ease !important;
                        font-family: 'Bungee', monospace !important;
                        box-shadow: 0 0 20px rgba(0, 212, 255, 0.4) !important;
                        min-width: 120px !important;
                    "
                    onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 0 30px rgba(0, 212, 255, 0.6)'"
                    onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 0 20px rgba(0, 212, 255, 0.4)'"
                    class="info-line">
                        🔄 PLAY AGAIN
                    </button>
                    
                    <button id="gamesBtn" style="
                        background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%) !important;
                        color: #ffffff !important;
                        border: none !important;
                        padding: 10px 20px !important;
                        border-radius: 8px !important;
                        font-size: 13px !important;
                        font-weight: bold !important;
                        cursor: pointer !important;
                        transition: all 0.3s ease !important;
                        font-family: 'Bungee', monospace !important;
                        box-shadow: 0 0 20px rgba(255, 107, 107, 0.4) !important;
                        min-width: 120px !important;
                    "
                    onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 0 30px rgba(255, 107, 107, 0.6)'"
                    onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 0 20px rgba(255, 107, 107, 0.4)'"
                    class="info-line">
                        🎮 GAMES
                    </button>
                    
                    <button id="homeBtn" style="
                        background: none !important;
                        color: #ffaa00 !important;
                        border: 2px solid #ffaa00 !important;
                        padding: 10px 20px !important;
                        border-radius: 8px !important;
                        font-size: 13px !important;
                        font-weight: bold !important;
                        cursor: pointer !important;
                        transition: all 0.3s ease !important;
                        font-family: 'Bungee', monospace !important;
                        text-shadow: 0 0 10px #ffaa00 !important;
                        box-shadow: 0 0 15px rgba(255, 170, 0, 0.3) !important;
                        min-width: 120px !important;
                    "
                    onmouseover="this.style.backgroundColor='rgba(255, 170, 0, 0.1)'; this.style.boxShadow='0 0 25px rgba(255, 170, 0, 0.5)'"
                    onmouseout="this.style.backgroundColor='transparent'; this.style.boxShadow='0 0 15px rgba(255, 170, 0, 0.3)'"
                    class="info-line">
                        🏠 HOME
                    </button>
                </div>
            </div>
        `;
        
        // Add to document
        try {
            document.body.appendChild(overlay);
            this.log(this.LOG_LEVEL.INFO, '✅ Overlay with hard-coded medals created and added to document.body');
            
            // Setup button handlers immediately
            this.setupButtonHandlers(overlay, score);
            
        } catch (error) {
            this.log(this.LOG_LEVEL.ERROR, '❌ Error creating overlay with hard-coded medals:', error);
        }
    }
    
    /**
     * ⚡ INSTANT: Update overlay with player info
     */
    updateOverlayWithPlayerInfo(score, playerName, playerID) {
        this.log(this.LOG_LEVEL.INFO, '⚡ INSTANT: Updating overlay with player info');
        
        const overlay = document.getElementById('game-over-wrapper');
        if (!overlay) {
            this.log(this.LOG_LEVEL.ERROR, '❌ No game-over-wrapper found for player info update');
            return;
        }
        
        // Update player info section
        const playerInfoSection = overlay.querySelector('#playerInfoSection');
        if (playerInfoSection) {
            playerInfoSection.innerHTML = `
                <div style="
                    font-size: 14px !important;
                    color: #ffffff !important;
                    margin-bottom: 3px !important;
                    font-family: 'Bungee', monospace !important;
                " class="info-line">👤 ${playerName}</div>
            `;
            this.log(this.LOG_LEVEL.INFO, '✅ Player info updated in overlay');
        }
        
        // 🎯 FIXED: Check for cached leaderboard data and update overlay
        const cachedData = this.getLeaderboardForOverlay(score);
        if (cachedData) {
            this.log(this.LOG_LEVEL.INFO, '📊 Updating overlay with cached leaderboard data');
            this.updateLeaderboardInOverlay(cachedData);
        } else {
            this.log(this.LOG_LEVEL.INFO, '📊 No cached data available, overlay will show hard-coded medals');
        }
    }
    
    /**
     * Setup button handlers for the overlay
     */
    setupButtonHandlers(overlay, score) {
        this.log(this.LOG_LEVEL.INFO, '🔍 Setting up button handlers for overlay...');
        
        // Play Again Button - Smart routing with paywall check
        const playAgainBtn = overlay.querySelector('#playAgainBtn');
        if (playAgainBtn) {
            this.log(this.LOG_LEVEL.INFO, '🎮 Setting up Play Again button - will be updated with API data');
            
            // Set up click handler for when button is enabled
            playAgainBtn.addEventListener('click', async (e) => {
                this.log(this.LOG_LEVEL.INFO, '🎮 Play Again button clicked');
                e.stopPropagation(); // Prevent event bubbling
                
                // Button should only be clickable if paywall check passed
                if (playAgainBtn.disabled) {
                    this.log(this.LOG_LEVEL.INFO, '🎯 Play Again button is disabled - ignoring click');
                    return;
                }
                
                // Hide any leaderboard overlay that might be visible
                if (this.leaderboardInstance && this.leaderboardInstance.isVisible) {
                    this.log(this.LOG_LEVEL.INFO, '🎮 Hiding leaderboard instance');
                    this.leaderboardInstance.hide();
                }
                
                // Hide this game over overlay
                this.hide();
                
                // Paywall already checked at game start - just start the game
                this.log(this.LOG_LEVEL.INFO, '🎮 Play Again clicked - starting new game');
                this.eventBus.emit('startGame');
            });
        } else {
            this.log(this.LOG_LEVEL.ERROR, '❌ Play Again button not found!');
        }
        
        // Home Button - Return to landing page
        const homeBtn = overlay.querySelector('#homeBtn');
        if (homeBtn) {
            homeBtn.addEventListener('click', () => {
                this.log(this.LOG_LEVEL.INFO, '🏠 Home button clicked');
                this.hide();
                window.location.href = '/';
            });
        }
        
        // View Leaderboard Button - Show full leaderboard
        const viewLeaderboardBtn = overlay.querySelector('#viewLeaderboardBtn');
        if (viewLeaderboardBtn) {
            this.log(this.LOG_LEVEL.INFO, '🏆 Setting up Leaderboard button listener');
            viewLeaderboardBtn.addEventListener('click', (e) => {
                this.log(this.LOG_LEVEL.INFO, '🏆 Leaderboard button clicked - showing leaderboard');
                e.stopPropagation(); // Prevent event bubbling
                this.showStyledLeaderboard();
            });
        }
        
        // $2 Challenge Button - Direct challenge creation
        const challenge2Btn = overlay.querySelector('#challenge2Btn');
        if (challenge2Btn) {
            challenge2Btn.addEventListener('click', (e) => {
                this.log(this.LOG_LEVEL.INFO, '💰 $2 Challenge button clicked');
                e.stopPropagation();
                this.createChallenge(score, 2);
            });
        }
        
        // $5 Challenge Button - Direct challenge creation
        const challenge5Btn = overlay.querySelector('#challenge5Btn');
        if (challenge5Btn) {
            challenge5Btn.addEventListener('click', (e) => {
                this.log(this.LOG_LEVEL.INFO, '💎 $5 Challenge button clicked');
                e.stopPropagation();
                this.createChallenge(score, 5);
            });
        }
        
        // Share Score Button - Social sharing
        const shareScoreBtn = overlay.querySelector('#shareScoreBtn');
        if (shareScoreBtn) {
            shareScoreBtn.addEventListener('click', (e) => {
                this.log(this.LOG_LEVEL.INFO, '📤 Share Score button clicked');
                e.stopPropagation();
                this.shareScore(score);
            });
        }
        
        // Games Button - Navigate to games page
        const gamesBtn = overlay.querySelector('#gamesBtn');
        if (gamesBtn) {
            gamesBtn.addEventListener('click', (e) => {
                this.log(this.LOG_LEVEL.INFO, '🎮 Games button clicked');
                e.stopPropagation();
                this.hide();
                window.location.href = '/games/';
            });
        }
    }
    
    /**
     * 🎯 FIXED: Get leaderboard data for overlay (uses cache when available)
     */
    getLeaderboardForOverlay(score) {
        // Return cached data if available for this score
        if (this.cachedLeaderboardData && this.cachedLeaderboardData.score === score) {
            this.log(this.LOG_LEVEL.INFO, '📊 Using cached leaderboard data for overlay');
            return this.cachedLeaderboardData;
        }
        
        // If API call is in progress for this score, wait for it
        if (this.apiCallInProgress && this.currentGameScore === score) {
            this.log(this.LOG_LEVEL.INFO, '⏳ API call in progress, waiting for result...');
            return null; // Overlay will retry or use hard-coded fallback
        }
        
        this.log(this.LOG_LEVEL.WARN, '❌ No leaderboard data available for overlay');
        return null;
    }
}

// Export for use in other modules
export { GameOverSystem }; 
