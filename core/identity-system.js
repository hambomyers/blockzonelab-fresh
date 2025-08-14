/**
 * BlockZone Lab Identity System - Clean Architecture
 * Preserving your proven wallet-as-identity onboarding flow
 */

class IdentitySystem {
    constructor() {
        this.player = null;
        this.isInitialized = false;
        this.deviceFingerprint = null;
        
        // Your proven onboarding strategy
        this.onboardingConfig = {
            welcomeQuarks: 10,
            freeGamesDaily: 1,
            gamePrice: 0.25,
            dayPassPrice: 2.50,
            dayPassCutoff: '23:00' // 11pm EST
        };
        
        console.log('🔐 Identity System initialized - Your proven wallet-as-identity flow');
    }
    
    async initialize() {
        if (this.isInitialized) return this.player;
        
        try {
            // Generate device fingerprint (your proven method)
            this.deviceFingerprint = await this.generateDeviceFingerprint();
            
            // Check for existing player
            this.player = await this.loadExistingPlayer();
            
            if (!this.player) {
                // Create new player with gentle onboarding
                this.player = await this.createNewPlayer();
            }
            
            this.isInitialized = true;
            console.log('✅ Player identity ready:', this.player.name);
            return this.player;
            
        } catch (error) {
            console.error('❌ Identity initialization failed:', error);
            // Graceful fallback - temporary local player
            this.player = this.createTemporaryPlayer();
            this.isInitialized = true;
            return this.player;
        }
    }
    
    async generateDeviceFingerprint() {
        // Your proven fingerprinting method - clean implementation
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('BlockZone Lab Device ID', 2, 2);
        
        const fingerprint = {
            canvas: canvas.toDataURL(),
            screen: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            platform: navigator.platform,
            userAgent: navigator.userAgent.substring(0, 100), // Truncated for privacy
            timestamp: Date.now()
        };
        
        // Generate hash
        const fingerprintString = JSON.stringify(fingerprint);
        const hash = await this.simpleHash(fingerprintString);
        
        return hash.substring(0, 12); // Short, clean device ID
    }
    
    async simpleHash(str) {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    async loadExistingPlayer() {
        // Check localStorage first (instant)
        const localPlayer = localStorage.getItem('bzl_player');
        if (localPlayer) {
            try {
                const player = JSON.parse(localPlayer);
                console.log('🔄 Loaded existing player from local storage');
                
                // Background sync with backend (non-blocking)
                this.syncWithBackend(player);
                
                return player;
            } catch (error) {
                console.warn('⚠️ Invalid local player data, creating new');
            }
        }
        
        // Try backend lookup (with timeout)
        try {
            const response = await Promise.race([
                fetch('/api/player/lookup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ deviceId: this.deviceFingerprint })
                }),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout')), 2000)
                )
            ]);
            
            if (response.ok) {
                const player = await response.json();
                this.savePlayerLocally(player);
                return player;
            }
        } catch (error) {
            console.log('🔄 Backend lookup failed, proceeding with local creation');
        }
        
        return null;
    }
    
    async createNewPlayer() {
        console.log('🎯 Creating new player - Your gentle onboarding flow');
        
        // Generate player name (your proven method)
        const playerName = await this.generatePlayerName();
        
        const newPlayer = {
            id: `player_${this.deviceFingerprint}`,
            name: playerName,
            deviceId: this.deviceFingerprint,
            createdAt: new Date().toISOString(),
            
            // Wallet info (created on first payment)
            wallet: null,
            
            // Game stats
            stats: {
                gamesPlayed: 0,
                bestScore: 0,
                totalScore: 0,
                averageScore: 0
            },
            
            // Payment status
            payment: {
                freeGamesUsed: 0,
                hasDayPass: false,
                dayPassExpiry: null,
                quarksBalance: this.onboardingConfig.welcomeQuarks // Welcome gift!
            },
            
            // Preferences
            preferences: {
                soundEnabled: true,
                musicEnabled: true,
                showGhost: true,
                keyBindings: 'default'
            }
        };
        
        // Save locally immediately
        this.savePlayerLocally(newPlayer);
        
        // Background registration with backend (non-blocking)
        this.registerWithBackend(newPlayer);
        
        console.log(`🎉 Welcome ${playerName}! You received ${this.onboardingConfig.welcomeQuarks} Quarks!`);
        
        return newPlayer;
    }
    
    async generatePlayerName() {
        // Your proven name generation - fun, memorable names
        const adjectives = [
            'Quantum', 'Neon', 'Cyber', 'Digital', 'Electric', 'Plasma',
            'Stellar', 'Cosmic', 'Atomic', 'Neural', 'Photon', 'Matrix'
        ];
        
        const nouns = [
            'Gamer', 'Player', 'Pilot', 'Warrior', 'Master', 'Champion',
            'Legend', 'Hero', 'Ace', 'Pro', 'Elite', 'Ninja'
        ];
        
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        const num = Math.floor(Math.random() * 999) + 1;
        
        return `${adj}${noun}${num}`;
    }
    
    createTemporaryPlayer() {
        // Emergency fallback - local-only player
        return {
            id: `temp_${Date.now()}`,
            name: 'TempPlayer',
            deviceId: this.deviceFingerprint || 'unknown',
            createdAt: new Date().toISOString(),
            wallet: null,
            stats: { gamesPlayed: 0, bestScore: 0, totalScore: 0, averageScore: 0 },
            payment: { freeGamesUsed: 0, hasDayPass: false, quarksBalance: 10 },
            preferences: { soundEnabled: true, musicEnabled: true, showGhost: true },
            isTemporary: true
        };
    }
    
    savePlayerLocally(player) {
        try {
            localStorage.setItem('bzl_player', JSON.stringify(player));
        } catch (error) {
            console.warn('⚠️ Failed to save player locally:', error);
        }
    }
    
    async syncWithBackend(player) {
        // Background sync - non-blocking
        try {
            const response = await fetch('/api/player/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(player)
            });
            
            if (response.ok) {
                const updatedPlayer = await response.json();
                this.player = updatedPlayer;
                this.savePlayerLocally(updatedPlayer);
                console.log('🔄 Player synced with backend');
            }
        } catch (error) {
            console.log('🔄 Background sync failed, continuing offline');
        }
    }
    
    async registerWithBackend(player) {
        // Background registration - non-blocking
        try {
            const response = await fetch('/api/player/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(player)
            });
            
            if (response.ok) {
                console.log('✅ Player registered with backend');
            }
        } catch (error) {
            console.log('🔄 Background registration failed, continuing offline');
        }
    }
    
    canPlayGame() {
        if (!this.player) return false;
        
        // Check day pass
        if (this.player.payment.hasDayPass) {
            const now = new Date();
            const expiry = new Date(this.player.payment.dayPassExpiry);
            if (now < expiry) {
                return { canPlay: true, reason: 'day_pass' };
            } else {
                // Day pass expired
                this.player.payment.hasDayPass = false;
                this.player.payment.dayPassExpiry = null;
                this.savePlayerLocally(this.player);
            }
        }
        
        // Check free games
        if (this.player.payment.freeGamesUsed < this.onboardingConfig.freeGamesDaily) {
            return { canPlay: true, reason: 'free_game' };
        }
        
        // Need payment
        return { 
            canPlay: false, 
            reason: 'payment_required',
            options: {
                perGame: this.onboardingConfig.gamePrice,
                dayPass: this.onboardingConfig.dayPassPrice
            }
        };
    }
    
    consumeGameCredit(reason) {
        if (!this.player) return false;
        
        if (reason === 'free_game') {
            this.player.payment.freeGamesUsed++;
        }
        
        this.savePlayerLocally(this.player);
        return true;
    }
    
    updateGameStats(score, lines, time) {
        if (!this.player) return;
        
        this.player.stats.gamesPlayed++;
        this.player.stats.totalScore += score;
        this.player.stats.averageScore = Math.floor(this.player.stats.totalScore / this.player.stats.gamesPlayed);
        
        if (score > this.player.stats.bestScore) {
            this.player.stats.bestScore = score;
        }
        
        this.savePlayerLocally(this.player);
        
        // Background stats sync
        this.syncGameStats(score, lines, time);
    }
    
    async syncGameStats(score, lines, time) {
        try {
            await fetch('/api/player/game-complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playerId: this.player.id,
                    score,
                    lines,
                    time,
                    timestamp: new Date().toISOString()
                })
            });
        } catch (error) {
            console.log('🔄 Stats sync failed, saved locally');
        }
    }
    
    getPlayer() {
        return this.player;
    }
    
    isReady() {
        return this.isInitialized && this.player !== null;
    }
}

// Global identity system
const identitySystem = new IdentitySystem();

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    identitySystem.initialize();
});

console.log('🔐 Identity System loaded - Your proven onboarding strategy');
