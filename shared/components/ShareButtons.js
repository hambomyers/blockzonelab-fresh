// shared/components/ShareButtons.js
// Reusable share button components with modern styling

class ShareButtons {
    constructor(socialSharing) {
        this.socialSharing = socialSharing;
        this.buttonStyles = this.getButtonStyles();
    }

    /**
     * Create score share button component
     */
    createScoreShareButton(score, playerName, options = {}) {
        const button = document.createElement('button');
        button.className = 'share-score-btn game-over-action-btn';
        button.innerHTML = `
            <div class="btn-icon">📤</div>
            <div class="btn-text">SHARE</div>
            <div class="btn-subtext">SCORE</div>
        `;

        this.applyButtonStyle(button, 'shareScore');
        
        button.addEventListener('click', async (e) => {
            e.stopPropagation();
            button.disabled = true;
            button.innerHTML = `
                <div class="btn-icon">⏳</div>
                <div class="btn-text">SHARING...</div>
            `;

            try {
                const result = await this.socialSharing.shareScore(score, playerName);
                this.showShareFeedback(button, result, 'score');
            } catch (error) {
                console.error('Share failed:', error);
                this.showShareError(button);
            }
        });

        return button;
    }

    /**
     * Create challenge share button component
     */
    createChallengeShareButton(challengeId, amount, score, playerName, options = {}) {
        const button = document.createElement('button');
        button.className = `challenge-${amount}-btn game-over-action-btn`;
        button.innerHTML = `
            <div class="btn-icon">${amount === 2 ? '💰' : '💎'}</div>
            <div class="btn-text">$${amount} CHAL</div>
            <div class="btn-subtext">LENGE</div>
        `;

        this.applyButtonStyle(button, amount === 2 ? 'challenge2' : 'challenge5');
        
        button.addEventListener('click', async (e) => {
            e.stopPropagation();
            button.disabled = true;
            button.innerHTML = `
                <div class="btn-icon">⏳</div>
                <div class="btn-text">CREATING...</div>
            `;

            try {
                // First create the challenge
                const challenge = await this.createChallenge(amount, score, playerName);
                
                // Then share it
                const result = await this.socialSharing.shareChallenge(
                    challenge.id, 
                    amount, 
                    score, 
                    playerName
                );
                
                this.showShareFeedback(button, result, 'challenge');
            } catch (error) {
                console.error('Challenge creation/share failed:', error);
                this.showShareError(button);
            }
        });

        return button;
    }

    /**
     * Create leaderboard share button component
     */
    createLeaderboardShareButton(position, score, playerName, options = {}) {
        const button = document.createElement('button');
        button.className = 'share-leaderboard-btn game-over-action-btn';
        button.innerHTML = `
            <div class="btn-icon">🏆</div>
            <div class="btn-text">SHARE</div>
            <div class="btn-subtext">RANK #${position}</div>
        `;

        this.applyButtonStyle(button, 'leaderboard');
        
        button.addEventListener('click', async (e) => {
            e.stopPropagation();
            button.disabled = true;
            button.innerHTML = `
                <div class="btn-icon">⏳</div>
                <div class="btn-text">SHARING...</div>
            `;

            try {
                const result = await this.socialSharing.shareLeaderboard(position, score, playerName);
                this.showShareFeedback(button, result, 'leaderboard');
            } catch (error) {
                console.error('Leaderboard share failed:', error);
                this.showShareError(button);
            }
        });

        return button;
    }

    /**
     * Create universal share modal button
     */
    createUniversalShareButton(content, options = {}) {
        const button = document.createElement('button');
        button.className = 'universal-share-btn';
        button.innerHTML = `
            <div class="btn-icon">📤</div>
            <div class="btn-text">SHARE</div>
        `;

        this.applyButtonStyle(button, 'universal');
        
        button.addEventListener('click', async (e) => {
            e.stopPropagation();
            this.showUniversalShareModal(content, options);
        });

        return button;
    }

    /**
     * Show universal share modal for any content
     */
    async showUniversalShareModal(content, options = {}) {
        const modal = document.createElement('div');
        modal.className = 'universal-share-modal';
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
            font-family: 'Bungee', monospace;
        `;

        const platforms = [
            { name: 'Twitter', icon: '🐦', color: '#1DA1F2' },
            { name: 'Facebook', icon: '📘', color: '#4267B2' },
            { name: 'WhatsApp', icon: '💬', color: '#25D366' },
            { name: 'LinkedIn', icon: '💼', color: '#0077B5' },
            { name: 'Telegram', icon: '📱', color: '#0088cc' },
            { name: 'Reddit', icon: '🤖', color: '#FF4500' }
        ];

        const platformButtons = platforms.map(platform => `
            <button class="platform-btn" data-platform="${platform.name.toLowerCase()}" style="
                background: linear-gradient(135deg, ${platform.color} 0%, ${this.darkenColor(platform.color, 20)} 100%);
                color: white;
                border: none;
                padding: 15px 20px;
                border-radius: 12px;
                font-size: 14px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
                font-family: 'Bungee', monospace;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                margin: 5px;
                min-width: 120px;
            " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 20px rgba(0, 0, 0, 0.3)'"
               onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(0, 0, 0, 0.2)'">
                <div style="font-size: 24px; margin-bottom: 5px;">${platform.icon}</div>
                ${platform.name}
            </button>
        `).join('');

        modal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
                border: 2px solid #00d4ff;
                border-radius: 20px;
                padding: 30px;
                max-width: 600px;
                width: 90%;
                text-align: center;
                box-shadow: 0 0 40px rgba(0, 212, 255, 0.3);
            ">
                <div style="
                    font-size: 24px;
                    color: #00d4ff;
                    margin-bottom: 15px;
                    font-weight: bold;
                ">📤 Share Content</div>
                
                <div style="
                    color: #ffffff;
                    margin-bottom: 25px;
                    font-size: 16px;
                    line-height: 1.4;
                    background: rgba(0, 212, 255, 0.1);
                    padding: 15px;
                    border-radius: 10px;
                    border: 1px solid rgba(0, 212, 255, 0.3);
                ">${content.text || content}</div>
                
                <div style="
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                    gap: 10px;
                    margin-bottom: 20px;
                ">
                    ${platformButtons}
                </div>
                
                ${navigator.clipboard ? `
                <div style="
                    border-top: 1px solid #333;
                    padding-top: 20px;
                    margin-top: 20px;
                ">
                    <button id="copyContentBtn" style="
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
                        📋 Copy to Clipboard
                    </button>
                </div>
                ` : ''}
                
                <button id="closeModalBtn" style="
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
        this.setupUniversalModalListeners(modal, content, options);
        document.body.appendChild(modal);
    }

    /**
     * Setup universal modal event listeners
     */
    setupUniversalModalListeners(modal, content, options) {
        // Platform buttons
        modal.querySelectorAll('.platform-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const platform = btn.dataset.platform;
                const shareUrl = this.buildPlatformShareUrl(platform, content);
                
                // Open share window
                window.open(shareUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
                
                // Track share
                this.trackShare(platform, 'universal', content);
                
                // Close modal
                modal.remove();
            });
        });

        // Copy button
        const copyBtn = modal.querySelector('#copyContentBtn');
        if (copyBtn) {
            copyBtn.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(content.text || content);
                    copyBtn.textContent = '✅ Copied!';
                    copyBtn.style.background = 'linear-gradient(135deg, #00ff88 0%, #00cc66 100%)';
                    copyBtn.style.color = '#000';
                    
                    this.trackShare('clipboard', 'universal', content);
                    
                    setTimeout(() => {
                        modal.remove();
                    }, 1000);
                } catch (error) {
                    console.error('Failed to copy:', error);
                    copyBtn.textContent = '❌ Copy Failed';
                }
            });
        }

        // Close button
        const closeBtn = modal.querySelector('#closeModalBtn');
        closeBtn.addEventListener('click', () => {
            modal.remove();
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    /**
     * Build platform-specific share URLs
     */
    buildPlatformShareUrl(platform, content) {
        const text = encodeURIComponent(content.text || content);
        const url = encodeURIComponent(content.url || window.location.href);
        const title = encodeURIComponent(content.title || 'Check this out!');

        switch (platform) {
            case 'twitter':
                return `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
            case 'facebook':
                return `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`;
            case 'whatsapp':
                return `https://wa.me/?text=${text}%20${url}`;
            case 'linkedin':
                return `https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}&summary=${text}`;
            case 'telegram':
                return `https://t.me/share/url?url=${url}&text=${text}`;
            case 'reddit':
                return `https://reddit.com/submit?url=${url}&title=${title}`;
            default:
                return url;
        }
    }

    /**
     * Create challenge (placeholder for now)
     */
    async createChallenge(amount, score, playerName) {
        // This would integrate with your smart contracts
        // console.log('Creating challenge:', { amount, score, playerName });
        
        return {
            id: `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            amount,
            score,
            playerName,
            timestamp: Date.now()
        };
    }

    /**
     * Show share feedback
     */
    showShareFeedback(button, result, type) {
        if (result.success) {
            button.innerHTML = `
                <div class="btn-icon">✅</div>
                <div class="btn-text">SHARED!</div>
            `;
            button.style.background = 'linear-gradient(135deg, #00ff88 0%, #00cc66 100%)';
            button.style.color = '#000';
            
            // Reset after 2 seconds
            setTimeout(() => {
                this.resetButton(button, type);
            }, 2000);
        } else if (result.cancelled) {
            this.resetButton(button, type);
        } else {
            this.showShareError(button);
        }
    }

    /**
     * Show share error
     */
    showShareError(button) {
        button.innerHTML = `
            <div class="btn-icon">❌</div>
            <div class="btn-text">FAILED</div>
        `;
        button.style.background = 'linear-gradient(135deg, #ff4444 0%, #cc0000 100%)';
        button.style.color = '#fff';
        
        // Reset after 2 seconds
        setTimeout(() => {
            this.resetButton(button, 'error');
        }, 2000);
    }

    /**
     * Reset button to original state
     */
    resetButton(button, type) {
        const originalContent = this.getOriginalButtonContent(type);
        button.innerHTML = originalContent;
        this.applyButtonStyle(button, type);
        button.disabled = false;
    }

    /**
     * Get original button content
     */
    getOriginalButtonContent(type) {
        switch (type) {
            case 'shareScore':
                return `
                    <div class="btn-icon">📤</div>
                    <div class="btn-text">SHARE</div>
                    <div class="btn-subtext">SCORE</div>
                `;
            case 'challenge2':
                return `
                    <div class="btn-icon">💰</div>
                    <div class="btn-text">$2 CHAL</div>
                    <div class="btn-subtext">LENGE</div>
                `;
            case 'challenge5':
                return `
                    <div class="btn-icon">💎</div>
                    <div class="btn-text">$5 CHAL</div>
                    <div class="btn-subtext">LENGE</div>
                `;
            case 'leaderboard':
                return `
                    <div class="btn-icon">🏆</div>
                    <div class="btn-text">SHARE</div>
                    <div class="btn-subtext">RANK</div>
                `;
            default:
                return `
                    <div class="btn-icon">📤</div>
                    <div class="btn-text">SHARE</div>
                `;
        }
    }

    /**
     * Apply button styling
     */
    applyButtonStyle(button, type) {
        const style = this.buttonStyles[type] || this.buttonStyles.default;
        
        Object.assign(button.style, style);
        
        // Add hover effects
        button.onmouseover = () => {
            button.style.transform = 'translateY(-2px)';
            button.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.3)';
        };
        
        button.onmouseout = () => {
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
        };
    }

    /**
     * Get button styles
     */
    getButtonStyles() {
        return {
            default: {
                background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
                color: '#000000',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontFamily: "'Bungee', monospace",
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                minWidth: '120px',
                textAlign: 'center'
            },
            shareScore: {
                background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
                color: '#000000',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontFamily: "'Bungee', monospace",
                boxShadow: '0 4px 12px rgba(0, 212, 255, 0.3)',
                minWidth: '120px',
                textAlign: 'center'
            },
            challenge2: {
                background: 'linear-gradient(135deg, #00ff88 0%, #00cc66 100%)',
                color: '#000000',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontFamily: "'Bungee', monospace",
                boxShadow: '0 4px 12px rgba(0, 255, 136, 0.3)',
                minWidth: '120px',
                textAlign: 'center'
            },
            challenge5: {
                background: 'linear-gradient(135deg, #ffaa00 0%, #ff8800 100%)',
                color: '#000000',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontFamily: "'Bungee', monospace",
                boxShadow: '0 4px 12px rgba(255, 170, 0, 0.3)',
                minWidth: '120px',
                textAlign: 'center'
            },
            leaderboard: {
                background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontFamily: "'Bungee', monospace",
                boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)',
                minWidth: '120px',
                textAlign: 'center'
            },
            universal: {
                background: 'linear-gradient(135deg, #9c88ff 0%, #6c5ce7 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontFamily: "'Bungee', monospace",
                boxShadow: '0 4px 12px rgba(156, 136, 255, 0.3)',
                minWidth: '120px',
                textAlign: 'center'
            }
        };
    }

    /**
     * Track share events
     */
    trackShare(platform, type, content) {
        // console.log('📊 Share tracked:', { platform, type, content });
        
        // Send to analytics if available
        if (window.gtag) {
            window.gtag('event', 'share', {
                method: platform,
                content_type: type,
                content_id: content
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
}

export { ShareButtons }; 
