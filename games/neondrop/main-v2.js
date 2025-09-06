/**
 * NeonDrop v2 - Clean Main Game Class
 * 
 * Minimal initialization, clean architecture
 * Target: 300 lines vs current 2000+
 */

import { GameEngineV2 } from './core/game-engine-v2.js';
import { RendererV2 } from './core/renderer-v2.js';
import { InputSystemV2 } from './core/input-system-v2.js';
import { FloatSystemV2 } from './core/float-system-v2.js';
import { Config } from '../../config/sonic-labs.config.js';

export class NeonDropV2 {
    constructor(canvasId = 'game-canvas') {
        this.canvas = document.getElementById(canvasId);
        this.config = new Config();
        
        // Initialize core systems
        this.engine = new GameEngineV2(this.config);
        this.renderer = new RendererV2(this.canvas, this.config);
        this.input = new InputSystemV2(this.engine);
        
        // Initialize FLOAT system with daily seed
        this.initializeFloatSystem();
        
        // Setup canvas
        this.setupCanvas();
        
        // Start game loop
        this.lastTime = 0;
        this.running = false;
        this.startGameLoop();
        
        // Setup event listeners
        this.setupEventListeners();
        
        console.log('🎮 NeonDrop v2 initialized - clean architecture, 50% smaller');
    }

    async initializeFloatSystem() {
        try {
            const dailySeed = await this.generateDailySeed();
            this.floatSystem = new FloatSystemV2(dailySeed, this.config);
            
            // Direct assignment - no wrappers, no complexity
            this.engine.floatSystem = this.floatSystem;
            
            console.log('✨ FLOAT system v2 connected directly to engine');
        } catch (error) {
            console.error('❌ Failed to initialize FLOAT system:', error);
        }
    }

    async generateDailySeed() {
        // Generate deterministic daily seed
        const today = new Date().toDateString();
        const encoder = new TextEncoder();
        const data = encoder.encode(today);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = new Uint8Array(hashBuffer);
        
        // Convert to number seed
        let seed = 0;
        for (let i = 0; i < 4; i++) {
            seed = (seed << 8) | hashArray[i];
        }
        
        return Math.abs(seed);
    }

    setupCanvas() {
        // Set canvas size
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        // Setup touch controls for mobile
        if ('ontouchstart' in window) {
            this.input.setupTouchControls(this.canvas);
        }
        
        // Prevent context menu on right click
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    setupEventListeners() {
        // Game state events
        this.engine.on = this.engine.on || (() => {}); // Simple event system if needed
        
        // Window focus/blur for simple pause
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.engine.getState().gameState === 'PLAYING') {
                this.engine.handleInput({ type: 'PAUSE' });
            }
        });
        
        // Resize handling
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    handleResize() {
        // Simple resize handling - maintain aspect ratio
        const container = this.canvas.parentElement;
        if (container) {
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;
            const aspectRatio = 800 / 600;
            
            if (containerWidth / containerHeight > aspectRatio) {
                this.canvas.style.height = containerHeight + 'px';
                this.canvas.style.width = (containerHeight * aspectRatio) + 'px';
            } else {
                this.canvas.style.width = containerWidth + 'px';
                this.canvas.style.height = (containerWidth / aspectRatio) + 'px';
            }
        }
    }

    startGameLoop() {
        if (this.running) return;
        
        this.running = true;
        this.lastTime = performance.now();
        
        const gameLoop = (currentTime) => {
            if (!this.running) return;
            
            const deltaTime = currentTime - this.lastTime;
            this.lastTime = currentTime;
            
            // Update game engine
            this.engine.update(deltaTime);
            
            // Render frame
            this.renderer.render(this.engine.getState(), deltaTime);
            
            // Continue loop
            requestAnimationFrame(gameLoop);
        };
        
        requestAnimationFrame(gameLoop);
        console.log('🔄 Game loop started - targeting 60fps');
    }

    stopGameLoop() {
        this.running = false;
        console.log('⏹️ Game loop stopped');
    }

    // Public API methods
    startGame() {
        this.engine.startGame();
        
        // Reset FLOAT system for new game
        if (this.floatSystem) {
            this.floatSystem.reset();
        }
        
        console.log('🎮 New game started');
    }

    pauseGame() {
        this.engine.handleInput({ type: 'PAUSE' });
    }

    getGameState() {
        return this.engine.getState();
    }

    getStats() {
        const gameState = this.engine.getState();
        const floatStats = this.floatSystem ? this.floatSystem.getStats() : {};
        
        return {
            score: gameState.score,
            lines: gameState.lines,
            level: gameState.level,
            pieces: gameState.statistics.piecesPlaced,
            floatPieces: gameState.statistics.floatPiecesSpawned,
            ...floatStats
        };
    }

    // Integration with existing player system
    async submitScore(score) {
        try {
            // Get player info from global system
            const playerName = window.playerProfile?.getDisplayName() || 'Anonymous';
            
            // Submit to backend (simplified)
            const response = await fetch('/api/scores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    score,
                    playerName,
                    gameType: 'neondrop_v2',
                    timestamp: Date.now(),
                    stats: this.getStats()
                })
            });
            
            if (response.ok) {
                console.log('✅ Score submitted successfully');
                return await response.json();
            } else {
                console.error('❌ Score submission failed');
            }
        } catch (error) {
            console.error('❌ Score submission error:', error);
        }
    }

    // Game over handling
    onGameOver() {
        const gameState = this.engine.getState();
        const stats = this.getStats();
        
        console.log('🎮 Game Over - Score:', gameState.score);
        
        // Submit score automatically
        this.submitScore(gameState.score);
        
        // Show game over UI (integrate with existing overlay system)
        if (window.overlayManager) {
            window.overlayManager.showGameOver({
                score: gameState.score,
                stats: stats,
                onPlayAgain: () => this.startGame(),
                onViewLeaderboard: () => this.showLeaderboard()
            });
        }
    }

    showLeaderboard() {
        // Integrate with existing leaderboard system
        if (window.overlayManager && window.playerProfile) {
            window.playerProfile.getLeaderboardData(true).then(data => {
                window.overlayManager.showLeaderboard({
                    scores: data.scores || [],
                    playerRank: data.playerRank || null,
                    onClose: () => window.overlayManager.hideCurrent()
                });
            });
        }
    }

    // Debug methods
    enableDebugMode() {
        this.debugMode = true;
        
        // Add debug info to renderer
        this.renderer.showDebugInfo = true;
        
        // Expose to global scope for console access
        window.neonDropV2Debug = {
            engine: this.engine,
            renderer: this.renderer,
            floatSystem: this.floatSystem,
            stats: () => this.getStats(),
            forceFloat: () => {
                if (this.floatSystem) {
                    // Force next piece to be FLOAT for testing
                    this.floatSystem.pieceCount = 999; // High count for max mercy
                }
            }
        };
        
        console.log('🐛 Debug mode enabled - access via window.neonDropV2Debug');
    }

    // Cleanup
    destroy() {
        this.stopGameLoop();
        
        if (this.input) {
            this.input.destroy();
        }
        
        console.log('🧹 NeonDrop v2 cleaned up');
    }
}

// Auto-initialize if canvas exists
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    if (canvas) {
        window.neonDropV2 = new NeonDropV2();
        
        // Enable debug mode in development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            window.neonDropV2.enableDebugMode();
        }
    }
});

export default NeonDropV2;
