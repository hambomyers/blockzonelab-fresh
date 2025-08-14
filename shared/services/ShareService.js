// shared/services/ShareService.js
// Main service to coordinate sharing and integrate with game systems

import { SocialSharing } from '../components/SocialSharing.js';
import { ShareButtons } from '../components/ShareButtons.js';

class ShareService {
    constructor(config = {}) {
        this.config = {
            autoInject: true,
            enableAnalytics: true,
            viralMode: true,
            ...config
        };

        this.socialSharing = new SocialSharing(this.config);
        this.shareButtons = new ShareButtons(this.socialSharing);
        this.gameOverSystem = null;
        this.isInitialized = false;
        
        // console.log('🚀 ShareService initialized with config:', this.config);
    }

    /**
     * Initialize with game over system
     */
    initializeGameOverSharing(gameOverSystem) {
        // console.log('🎮 Initializing ShareService with GameOverSystem');
        
        this.gameOverSystem = gameOverSystem;
        this.isInitialized = true;

        // Hook into game over events if EventBus is available
        if (gameOverSystem.eventBus) {
            this.setupEventListeners(gameOverSystem.eventBus);
        }

        // Auto-inject sharing if enabled
        if (this.config.autoInject) {
            this.setupGameOverInjection();
        }

        // console.log('✅ ShareService initialized successfully');
        return this;
    }

    /**
     * Setup event listeners for game events
     */
    setupEventListeners(eventBus) {
        // console.log('📡 Setting up ShareService event listeners');

        // Listen for game over events
        eventBus.on('gameOver', (data) => {
            // console.log('🎮 Game over event received:', data);
            this.handleGameOver(data);
        });

        // Listen for score submission events
        eventBus.on('scoreSubmitted', (data) => {
            // console.log('🎯 Score submitted event received:', data);
            this.handleScoreSubmission(data);
        });

        // Listen for leaderboard updates
        eventBus.on('leaderboardUpdated', (data) => {
            // console.log('🏆 Leaderboard updated event received:', data);
            this.handleLeaderboardUpdate(data);
        });
    }

    /**
     * Setup automatic injection into game over UI
     */
    setupGameOverInjection() {
        // console.log('🔧 Setting up automatic game over injection');

        // Monitor for game over UI creation
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Look for game over overlay
                        if (node.id === 'game-over-wrapper' || node.classList?.contains('game-over-overlay')) {
                            // console.log('🎮 Game over overlay detected, injecting share buttons');
                            this.injectShareButtons(node);
                        }
                    }
                });
            });
        });

        // Start observing
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // console.log('✅ Game over injection observer started');
    }

    /**
     * Inject share buttons into game over overlay
     */
    injectShareButtons(overlay) {
        // console.log('🔧 Injecting share buttons into overlay');

        try {
            // Find the action buttons container
            const actionContainer = overlay.querySelector('.game-over-buttons') || 
                                   overlay.querySelector('[class*="button"]') ||
                                   overlay;

            if (!actionContainer) {
                console.warn('⚠️ No action container found for share buttons');
                return;
            }

            // Create share buttons
            const shareButtonsContainer = document.createElement('div');
            shareButtonsContainer.className = 'share-buttons-container';
            shareButtonsContainer.style.cssText = `
                display: flex;
                gap: 10px;
                justify-content: center;
                margin-top: 15px;
                flex-wrap: wrap;
            `;

            // Add share score button
            const shareScoreBtn = this.shareButtons.createScoreShareButton(
                this.gameOverSystem.currentScore,
                this.gameOverSystem.getPlayerName()
            );
            shareButtonsContainer.appendChild(shareScoreBtn);

            // Add challenge buttons if enabled
            if (this.config.enableChallenges) {
                const challenge2Btn = this.shareButtons.createChallengeShareButton(
                    'challenge_2',
                    2,
                    this.gameOverSystem.currentScore,
                    this.gameOverSystem.getPlayerName()
                );
                shareButtonsContainer.appendChild(challenge2Btn);

                const challenge5Btn = this.shareButtons.createChallengeShareButton(
                    'challenge_5',
                    5,
                    this.gameOverSystem.currentScore,
                    this.gameOverSystem.getPlayerName()
                );
                shareButtonsContainer.appendChild(challenge5Btn);
            }

            // Insert share buttons
            actionContainer.appendChild(shareButtonsContainer);
            // console.log('✅ Share buttons injected successfully');

        } catch (error) {
            console.error('❌ Failed to inject share buttons:', error);
        }
    }

    /**
     * Handle game over events
     */
    handleGameOver(data) {
        // console.log('🎮 Handling game over event:', data);
        
        // Track game over for analytics
        this.trackGameOver(data);
        
        // Auto-share if viral mode is enabled
        if (this.config.viralMode && data.score > 1000) {
            this.autoShareHighScore(data);
        }
    }

    /**
     * Handle score submission events
     */
    handleScoreSubmission(data) {
        // console.log('🎯 Handling score submission:', data);
        
        // Track score submission
        this.trackScoreSubmission(data);
        
        // Check if score is share-worthy
        if (data.score > 500) {
            this.suggestSharing(data);
        }
    }

    /**
     * Handle leaderboard updates
     */
    handleLeaderboardUpdate(data) {
        // console.log('🏆 Handling leaderboard update:', data);
        
        // Track leaderboard activity
        this.trackLeaderboardUpdate(data);
        
        // Auto-share if player achieved a high rank
        if (data.position <= 10) {
            this.autoShareLeaderboardPosition(data);
        }
    }

    /**
     * Auto-share high scores
     */
    async autoShareHighScore(data) {
        // console.log('🚀 Auto-sharing high score:', data.score);
        
        try {
            const result = await this.socialSharing.shareScore(data.score, data.playerName);
            
            if (result.success) {
                // console.log('✅ Auto-share successful:', result.platform);
                this.showAutoShareSuccess('High Score', result.platform);
            }
        } catch (error) {
            console.error('❌ Auto-share failed:', error);
        }
    }

    /**
     * Auto-share leaderboard positions
     */
    async autoShareLeaderboardPosition(data) {
        // console.log('🏆 Auto-sharing leaderboard position:', data.position);
        
        try {
            const result = await this.socialSharing.shareLeaderboard(
                data.position,
                data.score,
                data.playerName
            );
            
            if (result.success) {
                // console.log('✅ Leaderboard auto-share successful:', result.platform);
                this.showAutoShareSuccess(`Rank #${data.position}`, result.platform);
            }
        } catch (error) {
            console.error('❌ Leaderboard auto-share failed:', error);
        }
    }

    /**
     * Suggest sharing to user
     */
    suggestSharing(data) {
        // console.log('💡 Suggesting sharing for score:', data.score);
        
        // Show a subtle suggestion notification
        this.showShareSuggestion(data);
    }

    /**
     * Show share suggestion notification
     */
    showShareSuggestion(data) {
        const suggestion = document.createElement('div');
        suggestion.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%);
            color: #000000;
            padding: 15px 20px;
            border-radius: 10px;
            font-family: 'Bungee', monospace;
            font-weight: bold;
            z-index: 9999999;
            animation: slideIn 0.5s ease-out;
            box-shadow: 0 4px 20px rgba(0, 212, 255, 0.4);
            cursor: pointer;
        `;
        
        suggestion.innerHTML = `
            <style>
                @keyframes slideIn { 
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            </style>
            🎉 Great score! Share it?<br>
            <span style="font-size: 12px;">Click to share ${data.score.toLocaleString()} points</span>
        `;
        
        suggestion.addEventListener('click', () => {
            this.socialSharing.shareScore(data.score, data.playerName);
            suggestion.remove();
        });
        
        document.body.appendChild(suggestion);
        
        // Remove after 5 seconds
        setTimeout(() => {
            if (suggestion.parentNode) {
                suggestion.remove();
            }
        }, 5000);
    }

    /**
     * Show auto-share success notification
     */
    showAutoShareSuccess(type, platform) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #00ff88 0%, #00cc66 100%);
            color: #000000;
            padding: 15px 20px;
            border-radius: 10px;
            font-family: 'Bungee', monospace;
            font-weight: bold;
            z-index: 9999999;
            animation: slideIn 0.5s ease-out;
            box-shadow: 0 4px 20px rgba(0, 255, 136, 0.4);
        `;
        
        notification.innerHTML = `
            <style>
                @keyframes slideIn { 
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            </style>
            ✅ ${type} shared via ${platform}!<br>
            <span style="font-size: 12px;">Your friends can now challenge you</span>
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    /**
     * Track game over events
     */
    trackGameOver(data) {
        // console.log('📊 Tracking game over:', data);
        
        if (this.config.enableAnalytics && window.gtag) {
            window.gtag('event', 'game_over', {
                score: data.score,
                player_name: data.playerName,
                game_type: 'neon_drop'
            });
        }
    }

    /**
     * Track score submissions
     */
    trackScoreSubmission(data) {
        // console.log('📊 Tracking score submission:', data);
        
        if (this.config.enableAnalytics && window.gtag) {
            window.gtag('event', 'score_submit', {
                score: data.score,
                player_name: data.playerName,
                game_type: 'neon_drop'
            });
        }
    }

    /**
     * Track leaderboard updates
     */
    trackLeaderboardUpdate(data) {
        // console.log('📊 Tracking leaderboard update:', data);
        
        if (this.config.enableAnalytics && window.gtag) {
            window.gtag('event', 'leaderboard_update', {
                position: data.position,
                score: data.score,
                player_name: data.playerName,
                game_type: 'neon_drop'
            });
        }
    }

    /**
     * Get sharing analytics
     */
    getSharingAnalytics() {
        return {
            socialSharing: this.socialSharing.getShareAnalytics(),
            isInitialized: this.isInitialized,
            config: this.config
        };
    }

    /**
     * Update configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        // console.log('🔧 ShareService config updated:', this.config);
    }
}

export { ShareService }; 
