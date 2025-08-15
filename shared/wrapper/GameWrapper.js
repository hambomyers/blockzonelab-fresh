/**
 * BlockZone Lab - Game Wrapper
 * Central gatekeeper for all games
 * Ensures identity before any game can start
 */

import { IdentityManager } from '/shared/core/IdentityManager.js';
import { gameRouter } from '/shared/wrapper/GameRouter.js';
import { PlayerProfile } from '/shared/components/PlayerProfile.js';

class GameWrapper {
    constructor() {
        this.isInitialized = false;
        this.welcomeSystem = null;
        this.currentState = 'initializing';
        
        // Initialize IdentityManager
        this.identityManager = new IdentityManager();
        
        // Use singleton PlayerProfile to avoid multiple instances
        this.playerProfile = window.globalPlayerProfile || new PlayerProfile();
        if (!window.globalPlayerProfile) {
            window.globalPlayerProfile = this.playerProfile;
            // console.log('🏗️ GameWrapper: Created global PlayerProfile singleton');
        } else {
            // console.log('🏗️ GameWrapper: Using existing global PlayerProfile singleton');
        }
    }
    
    async initialize() {
        if (this.isInitialized) return;
        
        
        // Check for development mode but still require proper identity
        if (window.isDevelopment || window.location.hostname === 'localhost') {
            
        }
        
        // Production flow
        await this.identityManager.initialize();
        
        // Make IdentityManager globally available
        window.identityManager = this.identityManager;
        // console.log('🔐 IdentityManager assigned to window.identityManager');
        
        if (this.identityManager.hasValidIdentity()) {
            // Player exists - show welcome back with their personalized data
            const playerName = this.identityManager.getPlayerName();
            const playerId = this.identityManager.getPlayerId();
            // console.log('✅ Using existing local identity:', playerId);
            // console.log('👤 Player recognized as:', playerName);
            this.currentState = 'authenticated';
            
            // Use PaywallManager for all game start logic
            
            if (window.paywallManager) {
                await window.paywallManager.interceptGameStart('neondrop');
            } else {
                console.warn('⚠️ PaywallManager not available');
            }
        } else {
            this.currentState = 'needs_identity';
            await this.showWelcomeSystem();
        }
        
        this.isInitialized = true;
        
    }
    
    async showWelcomeSystem() {
      
        
        // Create welcome system overlay
        const overlay = document.createElement('div');
        overlay.id = 'game-wrapper-welcome';
        overlay.className = 'game-wrapper-overlay';
        
        overlay.innerHTML = `
            <style>
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes neonGlow { 
                    0%, 100% { text-shadow: 0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor; }
                    50% { text-shadow: 0 0 20px currentColor, 0 0 30px currentColor, 0 0 40px currentColor; }
                }
                @keyframes floatUp { 
                    0% { transform: translateY(20px); opacity: 0; }
                    100% { transform: translateY(0); opacity: 1; }
                }
                @keyframes chicletEntrance {
                    0% { transform: translateY(-30px) scale(0.3) rotate(10deg); opacity: 0; }
                    60% { transform: translateY(2px) scale(1.1) rotate(-3deg); opacity: 0.8; }
                    100% { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; }
                }
                .neon-title { animation: neonGlow 2s ease-in-out infinite; }
                .info-line { animation: floatUp 0.6s ease-out forwards; }
                .info-line:nth-child(1) { animation-delay: 0.1s; }
                .info-line:nth-child(2) { animation-delay: 0.2s; }
                .info-line:nth-child(3) { animation-delay: 0.3s; }
                .info-line:nth-child(4) { animation-delay: 0.4s; }
                .info-line:nth-child(5) { animation-delay: 0.5s; }
                .info-line:nth-child(6) { animation-delay: 0.6s; }
            </style>
            
            <div style="
                text-align: center !important;
                max-width: 800px !important;
                width: 90% !important;
                padding: 40px 20px !important;
            ">
                <!-- NEON DROP Title (matching game style) -->
                <div style="margin-bottom: 60px;">
                    <div style="
                        font-size: 48px !important;
                        font-weight: bold !important;
                        margin-bottom: 10px !important;
                    ">
                        <span style="color: #FFFF00 !important;" class="neon-title">NEON</span>
                        <span style="color: #8A2BE2 !important;" class="neon-title">DROP</span>
                    </div>
                </div>
                
                <!-- Welcome Title (minimalist, no boxes) -->
                <div style="
                    font-size: 36px !important;
                    font-weight: bold !important;
                    color: #00d4ff !important;
                    margin-bottom: 20px !important;
                    text-shadow: 0 0 15px #00d4ff, 0 0 25px #00d4ff !important;
                    animation: neonGlow 2s ease-in-out infinite !important;
                    font-family: 'Bungee', monospace !important;
                " class="info-line">Welcome to BlockZone Lab!</div>
                
                <!-- Subtitle (minimalist) -->
                <div style="
                    font-size: 18px !important;
                    color: #cccccc !important;
                    margin-bottom: 50px !important;
                    line-height: 1.5 !important;
                    text-shadow: 0 0 8px #cccccc !important;
                " class="info-line">Choose your game name to start your Web3 gaming journey</div>
                
                <!-- Identity Section (minimalist, no boxes) -->
                <div style="margin-bottom: 40px;">
                    <div style="
                        font-size: 24px !important;
                        color: #ffffff !important;
                        margin-bottom: 15px !important;
                        text-shadow: 0 0 8px #ffffff !important;
                    " class="info-line">Your Gaming Identity</div>
                    
                    <div style="
                        font-size: 16px !important;
                        color: #888888 !important;
                        margin-bottom: 25px !important;
                    " class="info-line">Enter your game name (3-12 characters):</div>
                    
                    <input type="text" 
                           id="gameNameInput" 
                           style="
                               background: rgba(0, 212, 255, 0.1) !important;
                               border: 2px solid #00d4ff !important;
                               border-radius: 12px !important;
                               padding: 15px !important;
                               font-size: 18px !important;
                               color: #fff !important;
                               width: 100% !important;
                               max-width: 300px !important;
                               text-align: center !important;
                               outline: none !important;
                               transition: all 0.3s ease !important;
                               font-family: 'Bungee', monospace !important;
                           "
                           placeholder="Enter your game name..."
                           maxlength="12"
                           autocomplete="off">
                    
                    <div id="errorMessage" style="
                        color: #ff4444 !important;
                        font-size: 14px !important;
                        margin-top: 10px !important;
                        display: none !important;
                    ">Game name must be 3-12 characters long</div>
                </div>
                
                <!-- Security Notice (minimalist) -->
                <div style="margin-bottom: 50px;">
                    <div style="
                        font-size: 16px !important;
                        color: #ffd700 !important;
                        margin-bottom: 5px !important;
                        text-shadow: 0 0 8px #ffd700 !important;
                    " class="info-line">Seamless Web3 Identity</div>
                    <div style="
                        font-size: 14px !important;
                        color: #cccccc !important;
                    " class="info-line">We'll create a real blockchain wallet tied to your username</div>
                </div>
                
                <!-- Action Button (minimalist) -->
                <div style="
                    display: flex !important;
                    gap: 30px !important;
                    justify-content: center !important;
                    flex-wrap: wrap !important;
                ">
                    <button id="startGameBtn" style="
                        background: none !important;
                        color: #00d4ff !important;
                        border: 2px solid #00d4ff !important;
                        padding: 15px 30px !important;
                        border-radius: 8px !important;
                        font-size: 18px !important;
                        font-weight: bold !important;
                        cursor: pointer !important;
                        transition: all 0.3s ease !important;
                        text-shadow: 0 0 10px #00d4ff !important;
                        box-shadow: 0 0 15px rgba(0, 212, 255, 0.3) !important;
                        font-family: 'Bungee', monospace !important;
                    "
                    onmouseover="this.style.backgroundColor='rgba(0, 212, 255, 0.1)'; this.style.boxShadow='0 0 25px rgba(0, 212, 255, 0.5)'"
                    onmouseout="this.style.backgroundColor='transparent'; this.style.boxShadow='0 0 15px rgba(0, 212, 255, 0.3)'"
                    class="info-line">
                        Start Gaming
                    </button>
                </div>
            </div>
        `;
        
      
        document.body.appendChild(overlay);
        
        // Check if overlay is visible
        setTimeout(() => {
            const overlayElement = document.getElementById('game-wrapper-welcome');
            if (!overlayElement) {
                console.error('❌ Welcome overlay not found in DOM');
            }
        }, 100);
        
        // Focus on input
        const input = document.getElementById('gameNameInput');
        if (input) {
            input.focus();
        } else {
            console.error('❌ Input element not found');
        }
        
        // Input validation
        input.addEventListener('input', (e) => {
            const value = e.target.value.trim();
            const errorDiv = document.getElementById('errorMessage');
            const startBtn = document.getElementById('startGameBtn');
            
            if (value.length >= 3) {
                errorDiv.style.display = 'none';
                startBtn.disabled = false;
                startBtn.style.opacity = '1';
            } else {
                errorDiv.style.display = 'block';
                startBtn.disabled = true;
                startBtn.style.opacity = '0.5';
            }
        });
        
        // Enter key handler
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const value = input.value.trim();
                if (value.length >= 3) {
                    this.handleGameNameSubmit(value, overlay);
                }
            }
        });
        
        // Button handler
        document.getElementById('startGameBtn').addEventListener('click', () => {
            const value = input.value.trim();
            if (value.length >= 3) {
                this.handleGameNameSubmit(value, overlay);
            }
        });
    }
    
    async handleGameNameSubmit(gameName, overlay) {
        try {
            // Show loading state
            const startBtn = document.getElementById('startGameBtn');
            startBtn.innerHTML = 'Creating Identity...';
            startBtn.disabled = true;
            
            // Register player
            const fingerprint = this.identityManager.generateFingerprint();
            const playerData = await this.identityManager.registerPlayer(gameName, fingerprint);
            
            // Show success briefly
            startBtn.innerHTML = 'Identity Created!';
            startBtn.style.background = 'linear-gradient(45deg, #00ff00, #00cc00)';
            
            setTimeout(() => {
                overlay.remove();
                this.currentState = 'authenticated';
                // Use PaywallManager for game start
                if (window.paywallManager) {
                    window.paywallManager.interceptGameStart('neondrop');
                } else {
                    this.startGameDirectly();
                }
            }, 1000);
            
        } catch (error) {
            console.error('Failed to create identity:', error);
            
            // Show error state
            const startBtn = document.getElementById('startGameBtn');
            startBtn.innerHTML = 'Try Again';
            startBtn.style.background = 'linear-gradient(45deg, #ff4444, #cc0000)';
            startBtn.disabled = false;
            
            setTimeout(() => {
                startBtn.innerHTML = 'Start Gaming';
                startBtn.style.background = 'linear-gradient(45deg, #00d4ff, #0099cc)';
            }, 2000);
        }
    }
    
    // REMOVED: showWelcomeBackSystem() - Now handled by PaywallManager
    
    // REMOVED: getPlayerStatus() - Now handled by PaywallManager
    
    showCriticalError(title, details) {
        console.error('🚨 CRITICAL ERROR:', title, details);
        
        // Create big red error overlay
        const errorOverlay = document.createElement('div');
        errorOverlay.id = 'critical-error-overlay';
        errorOverlay.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: rgba(255, 0, 0, 0.95) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            z-index: 9999999 !important;
            font-family: 'Courier New', monospace !important;
            color: white !important;
            text-align: center !important;
        `;
        
        errorOverlay.innerHTML = `
            <div style="
                background: #000 !important;
                border: 5px solid #ff0000 !important;
                padding: 40px !important;
                border-radius: 20px !important;
                max-width: 800px !important;
                margin: 20px !important;
            ">
                <div style="font-size: 72px !important; margin-bottom: 20px !important;">❌</div>
                <div style="font-size: 36px !important; margin-bottom: 20px !important; color: #ff0000 !important;">${title}</div>
                <div style="font-size: 18px !important; margin-bottom: 30px !important; color: #ffcccc !important;">
                    DEVELOPMENT ERROR - FIX THIS SHIT NOW!
                </div>
                <pre style="
                    background: #333 !important;
                    padding: 20px !important;
                    border-radius: 10px !important;
                    font-size: 14px !important;
                    text-align: left !important;
                    overflow: auto !important;
                    max-height: 400px !important;
                ">${JSON.stringify(details, null, 2)}</pre>
                <div style="margin-top: 20px !important; font-size: 16px !important; color: #ffcccc !important;">
                    Check the console for more details
                </div>
            </div>
        `;
        
        document.body.appendChild(errorOverlay);
        
        // Make it unremovable
        errorOverlay.addEventListener('click', (e) => {
            e.stopPropagation();
            console.error('🚨 CRITICAL ERROR OVERLAY CLICKED - NOT REMOVING!');
        });
    }
    
    // REMOVED: getStatusDisplay() - Now handled by PaywallManager
    
    // REMOVED: continueToGame() - Now handled by PaywallManager
    
    startGameDirectly() {
        // Continue to the intended game
        const currentPath = window.location.pathname;
        
        if (currentPath.includes('/games/neondrop/')) {
            // For Neon Drop, check if game is already running before starting
            // console.log('Continuing to Neon Drop game...');
            if (window.startGame && !window.gameEntry?.gameStarted) {
                
                window.startGame();
            } else if (window.gameEntry?.gameStarted) {
                // console.log('⚠️ Game already started, skipping restart');
            } else {
                console.error('startGame function not available');
            }
        } else if (currentPath.includes('/academy/')) {
            this.startGame('academy');
        } else {
            // Default to platform
            this.startGame('platform');
        }
    }
    

    
    async startGame(gameId) {
        try {
            await gameRouter.startGame(gameId);
        } catch (error) {
            console.error(`Failed to start game: ${gameId}`, error);
            
            // If identity is missing, show welcome system
            if (error.message.includes('identity')) {
                this.currentState = 'needs_identity';
                await this.showWelcomeSystem();
            }
        }
    }
    
    hasValidIdentity() {
        return this.identityManager.hasValidIdentity();
    }
    
    getCurrentPlayer() {
        return this.identityManager.getCurrentPlayer();
    }
    
    getPlayerName() {
        return this.identityManager.getPlayerName();
    }
    
    getPlayerId() {
        return this.identityManager.getPlayerId();
    }
    
    validateIdentity() {
        return this.identityManager.validateIdentity();
    }
    

}

// Export singleton instance
const gameWrapper = new GameWrapper();
export { GameWrapper, gameWrapper };

// Make available globally for GameOverSystem access
window.gameWrapper = gameWrapper;

 
