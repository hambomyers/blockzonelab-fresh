// shared/components/SocialSharing.js
// Core sharing functionality using Native Web Share API with fallbacks

class SocialSharing {
    // Singleton instance
    static instance = null;
    
    constructor(config = {}) {
        // Check if instance already exists
        if (SocialSharing.instance) {
            // console.log('✅ Using existing SocialSharing instance');
            return SocialSharing.instance;
        }
        
        this.gameConfig = {
            name: 'NeonDrop',
            url: 'https://blockzonelab.com/games/neondrop',
            hashtags: '#NeonDrop #BlockZoneLab #Gaming',
            shareTexts: {
                score: '{playerName} scored {score} points in NeonDrop! Can you beat it?',
                challenge: 'I scored {score} points! Accept my ${amount} challenge!',
                leaderboard: 'I ranked #{position} with {score} points in NeonDrop!'
            },
            ...config
        };

        this.analytics = {
            shares: 0,
            sharesByPlatform: {},
            sharesByType: {}
        };

        // Store the instance
        SocialSharing.instance = this;
        
        this.init();
    }

    init() {
        // console.log('🚀 SocialSharing initialized with config:', this.gameConfig);
        this.detectShareCapabilities();
    }

    detectShareCapabilities() {
        this.hasNativeShare = navigator.share && this.isMobile();
        this.hasClipboard = navigator.clipboard && navigator.clipboard.writeText;
        
        // console.log('📱 Share capabilities:', {
            nativeShare: this.hasNativeShare,
            clipboard: this.hasClipboard,
            isMobile: this.isMobile()
        });
    }

    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    /**
     * Share game score with viral messaging
     */
    async shareScore(score, playerName) {
        // console.log('📤 Sharing score:', { score, playerName });

        const shareData = {
            type: 'score',
            title: `Beat my ${this.gameConfig.name} score!`,
            text: this.formatShareText('score', { playerName, score }),
            url: this.buildShareUrl('score', { score, playerName }),
            score,
            playerName
        };

        return await this.executeShare(shareData);
    }

    /**
     * Share challenge with bet amount
     */
    async shareChallenge(challengeId, amount, score, playerName) {
        // console.log('⚡ Sharing challenge:', { challengeId, amount, score, playerName });

        const shareData = {
            type: 'challenge',
            title: `Accept my $${amount} ${this.gameConfig.name} challenge!`,
            text: this.formatShareText('challenge', { playerName, score, amount }),
            url: this.buildShareUrl('challenge', { challengeId, amount, score }),
            challengeId,
            amount,
            score,
            playerName
        };

        return await this.executeShare(shareData);
    }

    /**
     * Share leaderboard position
     */
    async shareLeaderboard(position, score, playerName) {
        // console.log('🏆 Sharing leaderboard position:', { position, score, playerName });

        const shareData = {
            type: 'leaderboard',
            title: `I'm ranked #${position} in ${this.gameConfig.name}!`,
            text: this.formatShareText('leaderboard', { playerName, score, position }),
            url: this.buildShareUrl('leaderboard', { position, score }),
            position,
            score,
            playerName
        };

        return await this.executeShare(shareData);
    }

    /**
     * Execute share using preferred method
     */
    async executeShare(shareData) {
        try {
            if (this.hasNativeShare) {
                // console.log('📱 Using native share API');
                return await this.nativeShare(shareData);
            } else {
                // console.log('💻 Using fallback share options');
                return await this.showShareOptions(shareData);
            }
        } catch (error) {
            console.error('❌ Share failed:', error);
            return await this.showShareOptions(shareData);
        }
    }

    /**
     * Native Web Share API
     */
    async nativeShare(shareData) {
        try {
            await navigator.share({
                title: shareData.title,
                text: shareData.text,
                url: shareData.url
            });

            this.trackShare('native', shareData.type, shareData.score || shareData.amount);
            // console.log('✅ Native share successful');
            return { success: true, platform: 'native' };

        } catch (error) {
            if (error.name === 'AbortError') {
                // console.log('ℹ️ User cancelled native share');
                return { success: false, cancelled: true };
            }
            throw error;
        }
    }

    /**
     * Show fallback share options modal
     */
    async showShareOptions(shareData) {
        return new Promise((resolve) => {
            const modal = this.createShareModal(shareData, resolve);
            document.body.appendChild(modal);
            
            // Add entrance animation
            requestAnimationFrame(() => {
                modal.style.opacity = '1';
                modal.querySelector('.share-modal-content').style.transform = 'scale(1)';
            });
        });
    }

    /**
     * Create stylized share modal
     */
    createShareModal(shareData, resolve) {
        const modal = document.createElement('div');
        modal.className = 'share-modal-overlay';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease;
            font-family: 'Bungee', monospace;
        `;

        const shareButtons = this.createShareButtons(shareData);
        
        modal.innerHTML = `
            <div class="share-modal-content" style="
                background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
                border: 2px solid #00d4ff;
                border-radius: 20px;
                padding: 30px;
                max-width: 500px;
                width: 90%;
                text-align: center;
                box-shadow: 0 0 40px rgba(0, 212, 255, 0.3);
                transform: scale(0.9);
                transition: transform 0.3s ease;
            ">
                <div style="
                    font-size: 24px;
                    color: #00d4ff;
                    margin-bottom: 15px;
                    font-weight: bold;
                ">📤 Share Your ${shareData.type === 'score' ? 'Score' : shareData.type === 'challenge' ? 'Challenge' : 'Achievement'}!</div>
                
                <div style="
                    color: #ffffff;
                    margin-bottom: 25px;
                    font-size: 16px;
                    line-height: 1.4;
                ">${shareData.text}</div>
                
                <div class="share-buttons-container" style="
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                    gap: 15px;
                    margin-bottom: 20px;
                ">
                    ${shareButtons}
                </div>
                
                ${this.hasClipboard ? `
                <div style="
                    border-top: 1px solid #333;
                    padding-top: 20px;
                    margin-top: 20px;
                ">
                    <button id="copyLinkBtn" style="
                        background: linear-gradient(135deg, #666 0%, #444 100%);
                        color: #ffffff;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 8px;
                        font-size: 14px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        font-family: 'Bungee', monospace;
                        width: 100%;
                    " onmouseover="this.style.background='linear-gradient(135deg, #777 0%, #555 100%)'"
                       onmouseout="this.style.background='linear-gradient(135deg, #666 0%, #444 100%)'">
                        📋 Copy Link to Clipboard
                    </button>
                </div>
                ` : ''}
                
                <button id="closeShareBtn" style="
                    background: none;
                    color: #888;
                    border: 1px solid #555;
                    padding: 10px 20px;
                    border-radius: 8px;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-family: 'Bungee', monospace;
                    margin-top: 15px;
                " onmouseover="this.style.color='#fff'; this.style.borderColor='#888'"
                   onmouseout="this.style.color='#888'; this.style.borderColor='#555'">
                    Close
                </button>
            </div>
        `;

        // Add event listeners
        this.setupModalEventListeners(modal, shareData, resolve);

        return modal;
    }

    /**
     * Create share buttons HTML
     */
    createShareButtons(shareData) {
        const platforms = [
            {
                name: 'Twitter',
                icon: '🐦',
                color: '#1DA1F2',
                url: this.buildPlatformUrl('twitter', shareData)
            },
            {
                name: 'Facebook',
                icon: '📘',
                color: '#4267B2',
                url: this.buildPlatformUrl('facebook', shareData)
            },
            {
                name: 'WhatsApp',
                icon: '💬',
                color: '#25D366',
                url: this.buildPlatformUrl('whatsapp', shareData)
            },
            {
                name: 'LinkedIn',
                icon: '💼',
                color: '#0077B5',
                url: this.buildPlatformUrl('linkedin', shareData)
            }
        ];

        return platforms.map(platform => `
            <button class="share-platform-btn" data-platform="${platform.name.toLowerCase()}" data-url="${platform.url}" style="
                background: linear-gradient(135deg, ${platform.color} 0%, ${this.darkenColor(platform.color, 20)} 100%);
                color: white;
                border: none;
                padding: 15px 10px;
                border-radius: 10px;
                font-size: 12px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
                font-family: 'Bungee', monospace;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 20px rgba(0, 0, 0, 0.3)'"
               onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(0, 0, 0, 0.2)'">
                <div style="font-size: 20px; margin-bottom: 5px;">${platform.icon}</div>
                ${platform.name}
            </button>
        `).join('');
    }

    /**
     * Setup modal event listeners
     */
    setupModalEventListeners(modal, shareData, resolve) {
        // Platform share buttons
        modal.querySelectorAll('.share-platform-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const platform = btn.dataset.platform;
                const url = btn.dataset.url;
                
                // Open share window
                const shareWindow = window.open(url, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
                
                // Track share
                this.trackShare(platform, shareData.type, shareData.score || shareData.amount);
                
                // Close modal
                this.closeModal(modal);
                resolve({ success: true, platform });
            });
        });

        // Copy link button
        const copyBtn = modal.querySelector('#copyLinkBtn');
        if (copyBtn) {
            copyBtn.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(shareData.url);
                    copyBtn.textContent = '✅ Link Copied!';
                    copyBtn.style.background = 'linear-gradient(135deg, #00ff88 0%, #00cc66 100%)';
                    copyBtn.style.color = '#000';
                    
                    this.trackShare('clipboard', shareData.type, shareData.score || shareData.amount);
                    
                    setTimeout(() => {
                        this.closeModal(modal);
                        resolve({ success: true, platform: 'clipboard' });
                    }, 1000);
                } catch (error) {
                    console.error('Failed to copy link:', error);
                    copyBtn.textContent = '❌ Copy Failed';
                }
            });
        }

        // Close button
        const closeBtn = modal.querySelector('#closeShareBtn');
        closeBtn.addEventListener('click', () => {
            this.closeModal(modal);
            resolve({ success: false, cancelled: true });
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modal);
                resolve({ success: false, cancelled: true });
            }
        });
    }

    /**
     * Close modal with animation
     */
    closeModal(modal) {
        modal.style.opacity = '0';
        modal.querySelector('.share-modal-content').style.transform = 'scale(0.9)';
        
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }

    /**
     * Build platform-specific share URLs
     */
    buildPlatformUrl(platform, shareData) {
        const encodedText = encodeURIComponent(shareData.text);
        const encodedUrl = encodeURIComponent(shareData.url);
        const encodedTitle = encodeURIComponent(shareData.title);

        switch (platform) {
            case 'twitter':
                return `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}&hashtags=${encodeURIComponent(this.gameConfig.hashtags.replace(/^#/, '').replace(/ #/g, ','))}`;
            
            case 'facebook':
                return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
            
            case 'whatsapp':
                return `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
            
            case 'linkedin':
                return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}&summary=${encodedText}`;
            
            default:
                return shareData.url;
        }
    }

    /**
     * Format share text with template variables
     */
    formatShareText(type, data) {
        let template = this.gameConfig.shareTexts[type] || 'Check out this awesome game!';
        
        // Replace template variables
        template = template.replace('{playerName}', data.playerName || 'Someone');
        template = template.replace('{score}', data.score ? data.score.toLocaleString() : '0');
        template = template.replace('{amount}', data.amount || '0');
        template = template.replace('{position}', data.position || '0');
        
        return template + ' ' + this.gameConfig.hashtags;
    }

    /**
     * Build game URL with share parameters
     */
    buildShareUrl(type, data) {
        const baseUrl = this.gameConfig.url;
        const params = new URLSearchParams();
        
        params.set('ref', 'share');
        params.set('type', type);
        
        if (data.score) params.set('score', data.score);
        if (data.challengeId) params.set('challenge', data.challengeId);
        if (data.position) params.set('rank', data.position);
        if (data.playerName) params.set('player', data.playerName);
        
        return `${baseUrl}?${params.toString()}`;
    }

    /**
     * Track share events for analytics
     */
    trackShare(platform, type, value) {
        this.analytics.shares++;
        this.analytics.sharesByPlatform[platform] = (this.analytics.sharesByPlatform[platform] || 0) + 1;
        this.analytics.sharesByType[type] = (this.analytics.sharesByType[type] || 0) + 1;

        // console.log('📊 Share tracked:', { platform, type, value });
        // console.log('📊 Share analytics:', this.analytics);

        // Send to analytics service if available
        if (window.gtag) {
            window.gtag('event', 'share', {
                method: platform,
                content_type: type,
                content_id: value
            });
        }

        // Custom analytics event
        if (window.customAnalytics) {
            window.customAnalytics.track('game_share', {
                platform,
                type,
                value,
                game: this.gameConfig.name
            });
        }
    }

    /**
     * Utility: Darken color by percentage
     */
    darkenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    /**
     * Get share analytics
     */
    getShareAnalytics() {
        return { ...this.analytics };
    }
    
    /**
     * Static method to get singleton instance
     */
    static getInstance(config = {}) {
        if (!SocialSharing.instance) {
            SocialSharing.instance = new SocialSharing(config);
        }
        return SocialSharing.instance;
    }
    
    /**
     * Reset singleton instance (for testing)
     */
    static reset() {
        SocialSharing.instance = null;
    }
}

export { SocialSharing }; 
