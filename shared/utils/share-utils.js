// shared/utils/share-utils.js
// Utility functions for URL generation and share data formatting

/**
 * Share utility functions for NeonDrop game
 */
class ShareUtils {
    constructor() {
        this.platformConfigs = {
            twitter: {
                baseUrl: 'https://twitter.com/intent/tweet',
                params: ['text', 'url', 'hashtags', 'via'],
                maxTextLength: 280
            },
            facebook: {
                baseUrl: 'https://www.facebook.com/sharer/sharer.php',
                params: ['u', 'quote'],
                maxTextLength: 500
            },
            whatsapp: {
                baseUrl: 'https://wa.me/',
                params: ['text'],
                maxTextLength: 500
            },
            linkedin: {
                baseUrl: 'https://www.linkedin.com/sharing/share-offsite/',
                params: ['url', 'title', 'summary'],
                maxTextLength: 700
            },
            telegram: {
                baseUrl: 'https://t.me/share/url',
                params: ['url', 'text'],
                maxTextLength: 400
            },
            reddit: {
                baseUrl: 'https://reddit.com/submit',
                params: ['url', 'title'],
                maxTextLength: 300
            }
        };

        this.gameMetadata = {
            name: 'NeonDrop',
            description: 'The ultimate block-dropping puzzle game',
            hashtags: ['#NeonDrop', '#BlockZoneLab', '#Gaming', '#PuzzleGame'],
            websiteUrl: 'https://blockzonelab.com',
            gameUrl: 'https://blockzonelab.com/games/neondrop',
            imageUrl: 'https://blockzonelab.com/images/neondrop-preview.jpg'
        };
    }

    /**
     * Generate share URL for specific platform
     */
    generateShareUrl(platform, shareData) {
        // console.log('🔗 Generating share URL for:', platform, shareData);

        const config = this.platformConfigs[platform.toLowerCase()];
        if (!config) {
            console.warn('⚠️ Unknown platform:', platform);
            return this.gameMetadata.gameUrl;
        }

        try {
            const url = new URL(config.baseUrl);
            const formattedData = this.formatShareDataForPlatform(platform, shareData);

            // Add platform-specific parameters
            Object.entries(formattedData).forEach(([key, value]) => {
                if (config.params.includes(key) && value) {
                    url.searchParams.set(key, value);
                }
            });

            // console.log('✅ Generated URL:', url.toString());
            return url.toString();

        } catch (error) {
            console.error('❌ Error generating share URL:', error);
            return this.gameMetadata.gameUrl;
        }
    }

    /**
     * Format share data for specific platform
     */
    formatShareDataForPlatform(platform, shareData) {
        const baseText = this.formatShareText(shareData.type, shareData);
        const gameUrl = this.buildGameUrl(shareData);
        
        // Truncate text to platform limits
        const maxLength = this.platformConfigs[platform.toLowerCase()]?.maxTextLength || 280;
        const truncatedText = this.truncateText(baseText, maxLength);

        switch (platform.toLowerCase()) {
            case 'twitter':
                return {
                    text: truncatedText,
                    url: gameUrl,
                    hashtags: this.gameMetadata.hashtags.join(',').replace(/#/g, ''),
                    via: 'BlockZoneLab'
                };
            
            case 'facebook':
                return {
                    u: gameUrl,
                    quote: truncatedText
                };
            
            case 'whatsapp':
                return {
                    text: `${truncatedText} ${gameUrl}`
                };
            
            case 'linkedin':
                return {
                    url: gameUrl,
                    title: `${shareData.playerName} scored ${shareData.score} in NeonDrop!`,
                    summary: truncatedText
                };
            
            case 'telegram':
                return {
                    url: gameUrl,
                    text: truncatedText
                };
            
            case 'reddit':
                return {
                    url: gameUrl,
                    title: `${shareData.playerName} scored ${shareData.score} in NeonDrop! Can you beat it?`
                };
            
            default:
                return {
                    text: truncatedText,
                    url: gameUrl
                };
        }
    }

    /**
     * Format share text based on type
     */
    formatShareText(type, data) {
        const templates = {
            score: `🎮 ${data.playerName} scored ${data.score.toLocaleString()} points in NeonDrop! Can you beat this score?`,
            challenge: `⚡ ${data.playerName} scored ${data.score.toLocaleString()} points! Accept my $${data.amount} challenge!`,
            leaderboard: `🏆 ${data.playerName} ranked #${data.position} with ${data.score.toLocaleString()} points in NeonDrop!`,
            achievement: `🎉 ${data.playerName} unlocked "${data.achievement}" in NeonDrop!`,
            tournament: `🏅 ${data.playerName} is competing in the NeonDrop tournament! Current score: ${data.score.toLocaleString()}`,
            daily: `📅 ${data.playerName} completed today's NeonDrop challenge with ${data.score.toLocaleString()} points!`
        };

        const template = templates[type] || templates.score;
        return template + ' ' + this.gameMetadata.hashtags.join(' ');
    }

    /**
     * Build game URL with parameters
     */
    buildGameUrl(shareData) {
        const baseUrl = this.gameMetadata.gameUrl;
        const params = new URLSearchParams();
        
        // Add tracking parameters
        params.set('ref', 'share');
        params.set('source', shareData.type);
        
        // Add content-specific parameters
        if (shareData.score) params.set('score', shareData.score);
        if (shareData.challengeId) params.set('challenge', shareData.challengeId);
        if (shareData.position) params.set('rank', shareData.position);
        if (shareData.playerName) params.set('player', encodeURIComponent(shareData.playerName));
        if (shareData.achievement) params.set('achievement', encodeURIComponent(shareData.achievement));
        
        return `${baseUrl}?${params.toString()}`;
    }

    /**
     * Truncate text to fit platform limits
     */
    truncateText(text, maxLength) {
        if (text.length <= maxLength) {
            return text;
        }
        
        // Try to truncate at word boundary
        const truncated = text.substring(0, maxLength - 3);
        const lastSpace = truncated.lastIndexOf(' ');
        
        if (lastSpace > maxLength * 0.8) {
            return truncated.substring(0, lastSpace) + '...';
        }
        
        return truncated + '...';
    }

    /**
     * Generate share image URL (for platforms that support it)
     */
    generateShareImageUrl(shareData) {
        // This would generate a custom share image with the score
        // For now, return the default game image
        return this.gameMetadata.imageUrl;
    }

    /**
     * Create share preview data
     */
    createSharePreview(shareData) {
        return {
            title: this.generateShareTitle(shareData),
            description: this.formatShareText(shareData.type, shareData),
            image: this.generateShareImageUrl(shareData),
            url: this.buildGameUrl(shareData)
        };
    }

    /**
     * Generate share title
     */
    generateShareTitle(shareData) {
        const titles = {
            score: `Beat ${shareData.playerName}'s NeonDrop Score!`,
            challenge: `Accept ${shareData.playerName}'s $${shareData.amount} Challenge!`,
            leaderboard: `${shareData.playerName} is Rank #${shareData.position} in NeonDrop!`,
            achievement: `${shareData.playerName} Unlocked an Achievement!`,
            tournament: `${shareData.playerName} is Competing in NeonDrop Tournament!`,
            daily: `${shareData.playerName} Completed Today's Challenge!`
        };

        return titles[shareData.type] || titles.score;
    }

    /**
     * Validate share data
     */
    validateShareData(shareData) {
        const required = ['type', 'playerName', 'score'];
        const missing = required.filter(field => !shareData[field]);
        
        if (missing.length > 0) {
            console.error('❌ Missing required share data:', missing);
            return false;
        }

        if (shareData.score < 0) {
            console.error('❌ Invalid score:', shareData.score);
            return false;
        }

        if (shareData.type === 'challenge' && !shareData.amount) {
            console.error('❌ Challenge amount required');
            return false;
        }

        if (shareData.type === 'leaderboard' && !shareData.position) {
            console.error('❌ Leaderboard position required');
            return false;
        }

        return true;
    }

    /**
     * Get supported platforms
     */
    getSupportedPlatforms() {
        return Object.keys(this.platformConfigs);
    }

    /**
     * Check if platform is supported
     */
    isPlatformSupported(platform) {
        return this.platformConfigs.hasOwnProperty(platform.toLowerCase());
    }

    /**
     * Get platform configuration
     */
    getPlatformConfig(platform) {
        return this.platformConfigs[platform.toLowerCase()] || null;
    }

    /**
     * Update game metadata
     */
    updateGameMetadata(metadata) {
        this.gameMetadata = { ...this.gameMetadata, ...metadata };
        // console.log('🔧 Game metadata updated:', this.gameMetadata);
    }

    /**
     * Add new platform configuration
     */
    addPlatformConfig(platform, config) {
        this.platformConfigs[platform.toLowerCase()] = config;
        // console.log('🔧 Platform config added:', platform, config);
    }

    /**
     * Remove platform configuration
     */
    removePlatformConfig(platform) {
        delete this.platformConfigs[platform.toLowerCase()];
        // console.log('🔧 Platform config removed:', platform);
    }

    /**
     * Get share analytics data
     */
    getShareAnalyticsData(shareData) {
        return {
            platform: shareData.platform,
            type: shareData.type,
            score: shareData.score,
            playerName: shareData.playerName,
            timestamp: Date.now(),
            gameVersion: '1.0.0',
            shareId: this.generateShareId(shareData)
        };
    }

    /**
     * Generate unique share ID
     */
    generateShareId(shareData) {
        const data = `${shareData.type}_${shareData.playerName}_${shareData.score}_${Date.now()}`;
        return btoa(data).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
    }

    /**
     * Parse share URL parameters
     */
    parseShareUrl(url) {
        try {
            const urlObj = new URL(url);
            const params = urlObj.searchParams;
            
            return {
                ref: params.get('ref'),
                source: params.get('source'),
                score: parseInt(params.get('score')) || 0,
                challengeId: params.get('challenge'),
                rank: parseInt(params.get('rank')) || 0,
                player: decodeURIComponent(params.get('player') || ''),
                achievement: decodeURIComponent(params.get('achievement') || '')
            };
        } catch (error) {
            console.error('❌ Error parsing share URL:', error);
            return {};
        }
    }

    /**
     * Create deep link for mobile apps
     */
    createDeepLink(shareData) {
        const baseUrl = 'blockzonelab://game/neondrop';
        const params = new URLSearchParams();
        
        params.set('action', 'share');
        params.set('type', shareData.type);
        params.set('score', shareData.score);
        params.set('player', shareData.playerName);
        
        if (shareData.challengeId) params.set('challenge', shareData.challengeId);
        if (shareData.position) params.set('rank', shareData.position);
        
        return `${baseUrl}?${params.toString()}`;
    }

    /**
     * Check if device supports deep linking
     */
    supportsDeepLinking() {
        return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    }

    /**
     * Get optimal share text length for platform
     */
    getOptimalTextLength(platform) {
        const config = this.getPlatformConfig(platform);
        return config ? config.maxTextLength * 0.8 : 200; // Use 80% of max length
    }

    /**
     * Create share summary for analytics
     */
    createShareSummary(shareData) {
        return {
            type: shareData.type,
            score: shareData.score,
            playerName: shareData.playerName,
            platform: shareData.platform,
            timestamp: Date.now(),
            shareId: this.generateShareId(shareData),
            gameUrl: this.buildGameUrl(shareData)
        };
    }
}

// Create singleton instance
const shareUtils = new ShareUtils();

export { ShareUtils, shareUtils }; 
