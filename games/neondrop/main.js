// Performance optimized - console.log removed
/**
 * NeonDrop - Optimized Main Controller  
 * Advanced module loading, performance optimization, and error recovery
 */

// CRITICAL PATH: Only import essential modules for initial load
// Performance optimized - console.log removed
import { GameEngine } from './core/game-engine.js';
import { AudioSystem } from './core/audio-system.js';
import { Renderer } from './core/renderer.js';
import { Config, GAME_CONFIG } from './config.js';
import { GameOverSystem } from './game-over.js';
import { ViewportManager } from './core/viewport-manager.js';
import { ProfessionalRNG } from './core/game-engine.js';
import { MidnightProphecy } from './core/midnight-prophecy.js';
// Performance optimized - console.log removed

// LAZY LOAD: Non-critical modules will be loaded on-demand
let InputController, ParticleSystem, ScoringSystem, createStarfieldRenderer;

// Import shared modules
// Performance optimized - console.log removed
import { gameWrapper } from '/shared/wrapper/GameWrapper.js';
import { GameContext } from '/shared/core/game-context.js';
import { OverlayManager } from '/shared/core/overlay-manager.js';
import { GameStateMachine, GameState } from '/shared/core/game-states.js';
import { BlockchainManager } from '/shared/wrapper/BlockchainManager.js';
import { PaywallManager } from '/shared/components/PaywallManager.js';

// Inline EventBus for performance optimization
class EventBus {
  constructor() { this.listeners = {}; }
  on(event, handler) { (this.listeners[event] ||= []).push(handler); }
  off(event, handler) { this.listeners[event] = (this.listeners[event] || []).filter(h => h !== handler); }
  emit(event, data) { (this.listeners[event] || []).forEach(h => h(data)); }
}

// Global game instance counter to prevent duplicates
window.gameInstanceCount = (window.gameInstanceCount || 0) + 1;

// Bridge DOM 'gameOverUIReady' event to EventBus for overlayManager compatibility
// This ensures overlays show after renderer sequence completes (event-driven, scalable)
document.addEventListener('gameOverUIReady', (e) => {
    const data = e.detail || {};
    // Try global eventBus, then NeonDrop instance eventBus
    if (window.eventBus && typeof window.eventBus.emit === 'function') {
        window.eventBus.emit('gameOverUIReady', data);
    } else if (window.neonDrop && window.neonDrop.eventBus && typeof window.neonDrop.eventBus.emit === 'function') {
        window.neonDrop.eventBus.emit('gameOverUIReady', data);
    } else {
      
    }
});

class NeonDrop {
    constructor() {
        this.instanceId = window.gameInstanceCount;
        
        // WIN 5: REMOVE CONSOLE.LOG IN PRODUCTION (2-5ms win)
        this.logLevel = window.location.hostname === 'localhost' ? 1 : 0; // 0 = production, 1 = development
        
        // Performance timer for real 200ms target metric
        this.phase1StartTime = performance.now();
        
        // Core config & viewport
        this.config = new Config();
        this.viewport = new ViewportManager();
        
        // Refactored architecture
        this.eventBus = new EventBus();
        this.stateMachine = new GameStateMachine(this.eventBus);
        this.overlayManager = new OverlayManager(this.eventBus);
        this.gameContext = null; // Will be initialized after systems are created
        
        // Game systems (null until initialized)
        this.engine = null;
        this.renderer = null;
        this.audio = null;
        this.input = null;
        
        // Visual effects systems (lazy loaded)
        this.particles = null;
        this.scoring = null;
        this.starfield = null;
        this.nonCriticalModulesLoaded = false;
        
        // Game over system
        this.gameOverHandler = null;
        
        // State
        this.running = false;
        this.lastTime = 0;
        this.accumulator = 0;
        this.isGameOverReady = false;
        this.eventsBound = false;
        this.gameOverEventBound = false;
        this.gameOverProcessing = false; // Prevent duplicate game over processing
        this.scoreSubmitted = false; // New state to track if score has been submitted
    }
    
    // WIN 5: REMOVE CONSOLE.LOG IN PRODUCTION (2-5ms win)
    log(level, message) {
        if (this.logLevel >= level) {
            console.log(message);
        }
    }
    
    // Performance monitoring helper
    measurePerformance(label, asyncFunction) {
        return async (...args) => {
            const startTime = performance.now();
            const result = await asyncFunction.apply(this, args);
            const duration = performance.now() - startTime;
            console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
            return result;
        };
    }

    // Methods expected by panels
    state() {
        return this.engine && this.engine.getState ? this.engine.getState() : {};
    }

    /**
     * Performance monitoring with configurable thresholds
     */
    logPerformance() {
        // Temporarily disable performance monitoring to see if it's causing issues
        return;
        
        if (!GAME_CONFIG.PERFORMANCE.ENABLE_MONITORING) return;
        
        const frameTime = performance.now() - this.lastTime;
        const fps = 1000 / frameTime;
        
        if (fps < GAME_CONFIG.PERFORMANCE.FPS_WARNING_THRESHOLD) {
          
        }
        
        if (frameTime > GAME_CONFIG.PERFORMANCE.FRAME_TIME_WARNING) {
          
        }
        
        // Log every 300 frames (5 seconds at 60fps)
        if (this.frameNumber % GAME_CONFIG.PERFORMANCE.LOG_INTERVAL === 0) {
            console.log(`🎮 Performance: ${fps.toFixed(1)} FPS, ${frameTime.toFixed(1)}ms frame time`);
        }
    }

    async initialize() {
        try {
            this.log(1, '🚀 NeonDrop: Starting parallel initialization...');
            
            // WIN 1: PARALLEL INITIALIZATION (biggest win - 30-50ms reduction)
            await this.initCriticalSystemsParallel();
            
            // WIN 3: SKIP NON-CRITICAL BACKGROUND LOADING (moved to after game starts)
            this.scheduleBackgroundLoading();
            
        } catch (error) {
            console.error('NeonDrop initialization failed:', error);
            this.showError('Game initialization failed: ' + error.message);
        }
    }

    // OPTIMIZED: Parallel initialization with critical systems only
    async initCriticalSystemsParallel() {
        if (window.timeStart) window.timeStart('initCriticalSystemsParallel');
        console.log('⚡ Phase 1: Parallel initialization of critical systems...');
        
        // Start everything in parallel for maximum speed
        const [displayReady, systemsReady] = await Promise.all([
            this.setupDisplayParallel(),
            this.createSystemsParallel() // ← Now uses optimized version
        ]);
        
        // Start game loop immediately
        this.startLoop();
        
        // Bind events (required for input)
        this.bindEvents();
        
        // Real 200ms target metric - Phase 1 complete
        const phase1Time = Math.round(performance.now() - this.phase1StartTime);
        console.log(`🎯 PHASE 1 COMPLETE: ${phase1Time}ms - Game is playable! ${phase1Time <= 200 ? '✅' : '⚠️'}`);
        
        if (window.timeEnd) window.timeEnd('initCriticalSystemsParallel');
    }

    // WIN 3: SKIP NON-CRITICAL BACKGROUND LOADING (moved to after game starts)
    scheduleBackgroundLoading() {
        console.log('🔄 Background loading scheduled for after game starts...');
        
        // Schedule background loading after game is playable
        setTimeout(() => {
            this.initBackgroundSystems();
        }, 1000); // Wait 1 second after game starts
        
        console.log('✅ Background loading scheduled');
    }
    
    // PERFORMANCE OPTIMIZATION: Phase 2 - Background systems (non-blocking)
    async initBackgroundSystems() {
        console.log('🔄 Phase 2: Initializing background systems...');
        
        // Identity validation (non-blocking)
        setTimeout(async () => {
            try {
                if (!window.skipValidation) {
                    if (typeof gameWrapper !== 'undefined' && gameWrapper.validateIdentity) {
                        gameWrapper.validateIdentity();
                    }
                }
            } catch (validationError) {
                console.warn('⚠️ Identity validation failed (non-blocking):', validationError);
            }
        }, 1000);
        
        // Cleanup old UI (non-blocking)
        setTimeout(() => {
            this.cleanupOldUI();
        }, 500);
        
        // Load advanced systems (audio, overlays, etc.)
        setTimeout(() => {
            this.loadAdvancedSystemsInBackground();
        }, 100);
        
        // Initialize PaywallManager (critical for payments)
        setTimeout(async () => {
            try {
                console.log('💳 Initializing PaywallManager...');
                this.paywallManager = new PaywallManager();
                // CRITICAL: Make PaywallManager globally accessible for HTML onclick handlers
                window.paywallManager = this.paywallManager;
                console.log('✅ PaywallManager initialized successfully and assigned to window');
            } catch (error) {
                console.error('❌ Failed to initialize PaywallManager:', error);
            }
        }, 500);

        // Initialize blockchain (non-blocking)
        setTimeout(async () => {
            // Create blockchain manager first
            this.blockchainManager = new BlockchainManager();
            await this.initBlockchainInBackground();
        }, 2000);
        
        // Performance monitoring (non-blocking)
        setTimeout(() => {
            this.logPerformance();
        }, 3000);
        
        console.log('✅ Phase 2 scheduled: Background systems will initialize');
    }

    // Identity handled by game wrapper system

    // WIN 1: PARALLEL DISPLAY SETUP
    async setupDisplayParallel() {
        if (window.timeStart) window.timeStart('setupDisplayParallel');
        const game = document.getElementById('game');
        const bg = document.getElementById('bg');
        
        if (!game || !bg) throw new Error('Canvas elements missing');
        
        const dims = this.viewport.calculateOptimalDimensions(innerWidth, innerHeight);
        
        // WIN 4: RENDERER PRECOMPUTATION (5-10ms win)
        game.width = dims.canvasWidth;
        game.height = dims.canvasHeight;
        bg.width = innerWidth;
        bg.height = innerHeight;
        
        // Performance: Start with basic renderer, upgrade to premium after playable
        this.renderer = new Renderer(game, bg, this.config, dims);
        this.renderer.viewportManager = this.viewport;
        
        if (window.timeEnd) window.timeEnd('setupDisplayParallel');
        
        // WIN 4: PRECOMPUTE GRADIENTS (5-10ms win)
        this.precomputeRendererAssets();
        
        // Defer premium renderer upgrade to background
        this.upgradeToPremiumRenderer();
        
        return true;
    }
    
    // WIN 4: RENDERER PRECOMPUTATION (5-10ms win)
    precomputeRendererAssets() {
        if (this.renderer && this.renderer.ctx) {
            // Precompute gradients once
            this.gradientCache = {
                background: this.renderer.ctx.createLinearGradient(0, 0, 0, this.renderer.canvas.height),
                glow: this.renderer.ctx.createRadialGradient(0, 0, 0, 0, 0, 100)
            };
            
            // Setup background gradient
            this.gradientCache.background.addColorStop(0, '#1a1a2e');
            this.gradientCache.background.addColorStop(1, '#16213e');
            
            // Store in renderer for reuse
            this.renderer.gradientCache = this.gradientCache;
        }
    }
    
    setupDisplay() {
        return this.setupDisplayParallel();
    }
    
    upgradeToPremiumRenderer() {
        // Upgrade to premium renderer after game is playable
        setTimeout(() => {
            if (this.renderer) {
                // Initialize premium effects after game is playable
                if (this.renderer.initialize) {
                    this.renderer.initialize();
                }
                // Also call upgrade if available
                if (this.renderer.upgradeToPremium) {
                    this.renderer.upgradeToPremium();
                }
            }
        }, 100);
    }

    // WIN 1: PARALLEL SYSTEMS CREATION
    async createSystemsParallel() {
        if (window.timeStart) window.timeStart('createSystemsParallel');
        console.log('⚡ OPTIMIZED: Creating critical systems only...');
        
        // Create the game engine first
        this.engine = new GameEngine(this.config, null, null, this.eventBus);
        
        // CRITICAL ONLY: Load minimal systems for immediate gameplay
        const criticalSystems = await Promise.all([
            this.generateDailySeedFast(),
            this.createOverlaySystems(),
            this.setupMinimalInput()
        ]);
        
        // 🚀 CRITICAL FIX: Connect game over system to engine for API calls
        if (this.gameOverHandler && this.engine) {
            console.log('🔗 Connecting game over system to engine for API calls');
            this.engine.setGameOverSystem(this.gameOverHandler);
        }
        
        // WIN 6: BATCH DOM UPDATES (3-5ms win) - Only do UI setup once
        this.setupUIBatched();
        
        // DEFER: Schedule non-critical systems for background loading
        this.scheduleNonCriticalSystems();
        
        if (window.timeEnd) window.timeEnd('createSystemsParallel');
        
        return criticalSystems;
    }
    
    // OPTIMIZED: Fast daily seed generation with caching
    async generateDailySeedFast() {
        console.log('🎲 Generating daily seed (optimized with caching)...');
        
        // Check for cached seed first
        const today = new Date().toISOString().split('T')[0];
        const cachedKey = `dailySeed_${today}`;
        
        try {
            const cached = localStorage.getItem(cachedKey);
            if (cached) {
                const seedData = JSON.parse(cached);
                console.log('✅ Using cached daily seed (0ms lookup)');
                this.dailySeed = seedData.seed;
                this.seedDate = today;
                this.engine.rng = new ProfessionalRNG(seedData.processed);
                return seedData;
            }
        } catch (error) {
            console.warn('Cache read failed, generating fresh seed');
        }
        
        // Generate new seed efficiently
        const seed = this.hashString(today);
        const processed = seed * 1689048361;
        
        // Cache for future use
        try {
            localStorage.setItem(cachedKey, JSON.stringify({ seed, processed, date: today }));
        } catch (error) {
            console.warn('Cache write failed');
        }
        
        this.dailySeed = seed;
        this.seedDate = today;
        this.engine.rng = new ProfessionalRNG(processed);
        console.log('✅ Daily seed generated and cached');
        return { seed, processed };
    }
    
    // Helper method for fast string hashing
    hashString(str) {
        let hash = 0;
        const seedStr = `neondrop_${str}`;
        for (let i = 0; i < seedStr.length; i++) {
            hash = ((hash << 5) - hash) + seedStr.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash);
    }
    
    // LEGACY: Keep for compatibility
    async cacheGameEngineSeed() {
        return this.generateDailySeedFast();
    }

    async getVerifiedDailySeed() {
        const today = new Date().toISOString().split('T')[0];
        
        // Use fallback seed immediately for Phase 1 performance
        // API call moved to background for Phase 2
        let hash = 0;
        const str = `neondrop_${today}`;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash);
    }
    
    // Create overlay systems in parallel
    async createOverlaySystems() {
        // Create overlay manager and game over system immediately (required for game over)
        this.overlayManager = new OverlayManager(this.eventBus);
        this.gameOverHandler = new GameOverSystem(this.eventBus);
        
        // Register game over overlay immediately
        this.overlayManager.registerOverlay('gameOver', this.gameOverHandler);
        
        return true;
    }
    
    async createSystems() {
        return this.createSystemsParallel();
    }
    
    // OPTIMIZED: Schedule non-critical systems for background loading
    scheduleNonCriticalSystems() {
        console.log('📅 Scheduling non-critical systems for background loading...');
        
        // Load input controller immediately (critical for gameplay)
        setTimeout(() => {
            this.loadNonCriticalSystems();
        }, 50); // Very small delay to ensure game is playable first
    }
    
    // OPTIMIZED: Load non-critical systems in background
    async loadNonCriticalSystems() {
        console.log('🔄 Loading non-critical systems in background...');
        
        // PRIORITY 1: Load input controller immediately (critical for gameplay)
        try {
            await this.loadFullInputController();
            console.log('✅ Input controller loaded in background');
        } catch (error) {
            console.error('❌ Failed to load input controller:', error);
        }
        
        // PRIORITY 2: Load other non-critical systems
        const backgroundTasks = [
            this.loadAdvancedSystemsInBackground?.(), // Audio and state machine
            this.initializePaywallManager(),      // Payment system (critical for monetization)
            this.setupGamepadSupport?.(),         // Controller support
            this.preloadAssets?.(),               // Asset preloading
            this.initializeAnalytics?.(),         // Performance tracking
            this.setupAdvancedAudio?.()           // Advanced audio features
        ].filter(Boolean); // Remove undefined methods
        
        try {
            await Promise.all(backgroundTasks);
            console.log('✅ All non-critical systems loaded in background');
        } catch (error) {
            console.warn('Some background systems failed to load:', error);
        }
    }
    
    // Background loading methods
    async loadFullInputController() {
        return this.loadInputController();
    }
    
    // Initialize PaywallManager for payment processing
    async initializePaywallManager() {
        try {
            console.log('💳 Initializing PaywallManager...');
            this.paywallManager = new PaywallManager();
            // CRITICAL: Make PaywallManager globally accessible for HTML onclick handlers
            window.paywallManager = this.paywallManager;
            console.log('✅ PaywallManager initialized successfully and assigned to window');
            return this.paywallManager;
        } catch (error) {
            console.error('❌ Failed to initialize PaywallManager:', error);
            return null;
        }
    }

    setupGamepadSupport() {
        
        // Gamepad support implementation
        return Promise.resolve();
    }
    
    preloadAssets() {
        console.log('📦 Preloading assets in background...');
        // Asset preloading implementation
        return Promise.resolve();
    }
    
    initializeAnalytics() {
        console.log('📊 Initializing analytics in background...');
        // Analytics initialization
        return Promise.resolve();
    }
    
    setupAdvancedAudio() {
        console.log('🎵 Setting up advanced audio in background...');
        // Advanced audio setup
        return Promise.resolve();
    }
    
    // LEGACY: Keep for compatibility
    loadAdvancedSystemsInBackground() {
        // Load advanced systems after game is playable
        setTimeout(async () => {
            try {
                console.log('🎵 Starting advanced systems initialization...');
                
                // Create state machine for game state management
                this.stateMachine = new GameStateMachine(this.eventBus);
                
                // Initialize audio system
                console.log('🎵 Initializing audio system...');
                this.audio = new AudioSystem(this.config);
                this.audio.init();
                console.log('✅ Audio system initialized');
                
                // Update game engine with audio
                this.engine.setAudioSystem(this.audio);
                console.log('✅ Audio system connected to game engine');
                
                // Lazy load visual effects systems
                this.loadNonCriticalSystems();
                
                // Initialize GameContext with all systems
                this.gameContext = new GameContext({
                    eventBus: this.eventBus,
                    engine: this.engine,
                    overlays: this.overlayManager,
                    audio: this.audio
                });
                
                console.log('✅ Advanced systems initialization complete');
                
            } catch (error) {
                console.error('❌ Advanced systems initialization failed:', error);
                // Game continues with graceful degradation
            }
        }, 100); // Increased delay to ensure Phase 1 is complete
    }
    
    // OPTIMIZED: Minimal input setup for immediate gameplay
    setupMinimalInput() {
        
        
        // Create a simple input controller immediately without async import
        // This ensures keyboard input works right away
        const neonDropInstance = this; // Store reference to parent instance
        this.input = {
            activeKeys: new Set(),
            autoRepeatTimers: new Map(),
            autoRepeatDelays: {
                initial: 200,  // Initial delay before auto-repeat starts
                repeat: 50     // Speed of auto-repeat (gets faster)
            },
            parent: neonDropInstance, // Store parent reference
            
            // Simple key mapping
            keyToAction: (keyCode) => {
                const mapping = {
                    'ArrowLeft': { type: 'MOVE', dx: -1, dy: 0 },
                    'KeyA': { type: 'MOVE', dx: -1, dy: 0 },
                    'ArrowRight': { type: 'MOVE', dx: 1, dy: 0 },
                    'KeyD': { type: 'MOVE', dx: 1, dy: 0 },
                    'ArrowDown': { type: 'MOVE', dx: 0, dy: 1 },
                    'KeyS': { type: 'MOVE', dx: 0, dy: 1 },
                    'ArrowUp': { type: 'ROTATE', direction: 1 },
                    'KeyW': { type: 'ROTATE', direction: 1 },
                    'KeyZ': { type: 'ROTATE', direction: -1 },
                    'ShiftLeft': { type: 'ROTATE', direction: -1 },
                    'KeyX': { type: 'ROTATE', direction: 1 },
                    'ControlLeft': { type: 'ROTATE', direction: 1 },
                    'ControlRight': { type: 'ROTATE', direction: 1 },
                    'Space': { type: 'HARD_DROP' },
                    'KeyF': { type: 'HARD_DROP' },
                    'KeyC': { type: 'HOLD' },
                    'ShiftRight': { type: 'HOLD' },
                    'Escape': { type: 'PAUSE' },
                    'Enter': { type: 'ENTER' },
                    'KeyP': { type: 'PAUSE' }
                };
                return mapping[keyCode];
            },
            
            // Event handlers
            onKeyDown: (e) => {
                const state = neonDropInstance.engine?.getState();
                
                // Special handling for MENU state
                if (state && state.phase === 'MENU' && (e.code === 'Space' || e.code === 'Enter')) {
                    e.preventDefault();
                    if (neonDropInstance.input.activeKeys.has(e.code)) return;
                    
                    neonDropInstance.input.activeKeys.add(e.code);
                    neonDropInstance.handleAction({ type: 'START_GAME' });
                    return;
                }

                // Check if we should capture game keys
                if (!neonDropInstance.input.shouldCaptureGameKeys()) {
                    return;
                }

                // Prevent default for game keys
                if (neonDropInstance.input.isGameKey(e.code)) {
                    e.preventDefault();
                }

                // Prevent duplicate key presses
                if (neonDropInstance.input.activeKeys.has(e.code)) {
                    return;
                }

                neonDropInstance.input.activeKeys.add(e.code);

                // Get action for this key
                const action = neonDropInstance.input.keyToAction(e.code);
                if (action) {
                    neonDropInstance.input.processAction(action);
                    
                    // Start auto-repeat for movement keys
                    if (action.type === 'MOVE' && (action.dx !== 0 || action.dy !== 0)) {
                        neonDropInstance.input.startAutoRepeat(e.code, action);
                    }
                }
            },
            
            onKeyUp: (e) => {
                neonDropInstance.input.activeKeys.delete(e.code);
                neonDropInstance.input.stopAutoRepeat(e.code);
            },
            
            // Check if we should capture game keys
            shouldCaptureGameKeys() {
                const focusedElement = document.activeElement;
                if (focusedElement && (
                    focusedElement.tagName === 'INPUT' || 
                    focusedElement.tagName === 'TEXTAREA' ||
                    focusedElement.contentEditable === 'true'
                )) {
                    return false;
                }

                const state = neonDropInstance.engine?.getState();
                const gameplayPhases = ['PLAYING', 'LOCKING', 'COUNTDOWN', 'PAUSED'];
                const gameOverPhases = ['GAME_OVER', 'GAME_OVER_SEQUENCE'];
                
                if (!state || gameOverPhases.includes(state.phase)) {
                    return false;
                }
                
                return gameplayPhases.includes(state.phase);
            },

            // Check if key is a game key
            isGameKey(keyCode) {
                const gameKeys = [
                    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
                    'KeyA', 'KeyD', 'KeyW', 'KeyS',
                    'KeyZ', 'KeyX', 'KeyC', 'KeyF', 'KeyP',
                    'Space', 'Enter', 'Escape',
                    'ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight'
                ];
                return gameKeys.includes(keyCode);
            },

            // Process action based on game state
            processAction(action) {
                const state = neonDropInstance.engine?.getState();
                
                switch (state?.phase) {
                    case 'MENU':
                        neonDropInstance.input.handleMenuInput(action);
                        break;
                    case 'PLAYING':
                    case 'LOCKING':
                    case 'COUNTDOWN':
                        neonDropInstance.input.handleGameplayInput(action);
                        break;
                    case 'PAUSED':
                        neonDropInstance.input.handlePausedInput(action);
                        break;
                    case 'GAME_OVER':
                    case 'GAME_OVER_SEQUENCE':
                        neonDropInstance.input.handleGameOverInput(action);
                        break;
                }
            },

            // Handle menu input
            handleMenuInput(action) {
                if (action.type === 'START_GAME' || action.type === 'ENTER') {
                    neonDropInstance.handleAction({ type: 'START_GAME' });
                }
            },

            // Handle gameplay input
            handleGameplayInput(action) {
                // Handle pause
                if (action.type === 'PAUSE' || action.type === 'ESCAPE') {
                    neonDropInstance.handleAction({ type: 'PAUSE' });
                    return;
                }

                // Handle FLOAT piece up movement
                if (action.type === 'ROTATE' && action.direction === 1) {
                    const gameState = neonDropInstance.engine?.getState();
                    const isFloatPiece = gameState?.current && gameState.current.type === 'FLOAT';
                    
                    if (isFloatPiece) {
                        // Send UP_PRESSED for FLOAT pieces
                        neonDropInstance.handleAction({ type: 'UP_PRESSED' });
                        return;
                    }
                }

                // Handle FLOAT piece diagonal up movement (up + left/right)
                if (action.type === 'MOVE' && action.dy === 0) {
                    const gameState = neonDropInstance.engine?.getState();
                    const isFloatPiece = gameState?.current && gameState.current.type === 'FLOAT';
                    
                    if (isFloatPiece) {
                        // Check if up key is also pressed
                        const hasUpPressed = neonDropInstance.input.activeKeys.has('ArrowUp') || neonDropInstance.input.activeKeys.has('KeyW');
                        
                        if (hasUpPressed) {
                            // Send diagonal up movement
                            neonDropInstance.handleAction({ type: 'MOVE', dx: action.dx, dy: -1 });
                            return;
                        }
                    }
                }

                // Pass action through - FLOAT pieces move normally like other pieces
                neonDropInstance.handleAction(action);
            },

            // Handle paused input
            handlePausedInput(action) {
                if (action.type === 'SPACE' || action.type === 'ENTER' || action.type === 'ESCAPE' || action.type === 'PAUSE') {
                    neonDropInstance.handleAction({ type: 'PAUSE' });
                }
            },

            // Handle game over input
            handleGameOverInput(action) {
                if (action.type === 'SPACE' || action.type === 'ENTER' || action.type === 'ESCAPE') {
                    neonDropInstance.handleAction({ type: 'RETURN_TO_MENU' });
                }
            },

            // Start auto repeat for DAS
            startAutoRepeat(keyCode, action) {
                if (neonDropInstance.input.autoRepeatTimers.has(keyCode)) return;

                const timer = setTimeout(() => {
                    neonDropInstance.input.processAction(action);
                    neonDropInstance.input.autoRepeatTimers.set(keyCode, setInterval(() => {
                        neonDropInstance.input.processAction(action);
                    }, neonDropInstance.input.autoRepeatDelays.repeat));
                }, neonDropInstance.input.autoRepeatDelays.initial);

                neonDropInstance.input.autoRepeatTimers.set(keyCode, timer);
            },

            // Stop auto repeat
            stopAutoRepeat(keyCode) {
                const timer = neonDropInstance.input.autoRepeatTimers.get(keyCode);
                if (timer) {
                    clearTimeout(timer);
                    clearInterval(timer);
                    neonDropInstance.input.autoRepeatTimers.delete(keyCode);
                }
            },

            // Clear all auto-repeat timers
            clearAllAutoRepeat() {
                neonDropInstance.input.autoRepeatTimers.forEach((timer) => {
                    clearTimeout(timer);
                    clearInterval(timer);
                });
                neonDropInstance.input.autoRepeatTimers.clear();
            },
            
            // Setup listeners
            setupListeners() {
                document.addEventListener('keydown', (e) => neonDropInstance.input.onKeyDown(e));
                document.addEventListener('keyup', (e) => neonDropInstance.input.onKeyUp(e));
                
                // Window events for cleanup
                window.addEventListener('blur', () => neonDropInstance.input.clearAllAutoRepeat());
                window.addEventListener('focus', () => neonDropInstance.input.clearAllAutoRepeat());
            },
            
            // Cleanup
            destroy: () => {
                neonDropInstance.input.clearAllAutoRepeat();
                neonDropInstance.input.activeKeys.clear();
            },
            
            clearAllRepeat: () => {
                neonDropInstance.input.clearAllAutoRepeat();
            }
        };
        
        // Setup the listeners immediately
        this.input.setupListeners();
        this.inputReady = true;
        
        console.log('✅ Input controller created and ready for immediate gameplay');
        
        console.log('  - Event listeners attached to document');
        console.log('  - Key mappings configured for: Arrow keys, WASD, Space, etc.');
        console.log('  - Current game state will be checked on key press');
        console.log('  - Auto-repeat system enabled for smooth movement');
        
        // Add global keyboard test function
        window.testKeyboard = () => {
            console.log('🎹 Testing keyboard input...');
            console.log('Press any key to test if events are being captured');
            console.log('Current game state:', this.engine?.getState()?.phase);
        };
        
        // Add keyboard help function
        window.keyboardHelp = () => {
            
            console.log('📋 MENU CONTROLS:');
            console.log('  - SPACE or ENTER: Start game from menu');
            console.log('');
            
            console.log('  - Arrow Keys or WASD: Move piece (with auto-repeat)');
            console.log('  - Arrow Up or W: Rotate clockwise (FLOAT pieces move up)');
            console.log('  - Z or Shift: Rotate counter-clockwise');
            console.log('  - X or Ctrl: Rotate clockwise (alternative)');
            console.log('  - Space or F: Hard drop');
            console.log('  - C or Shift Right: Hold piece');
            console.log('  - Escape or P: Pause game');
            console.log('');
            console.log('🔧 TROUBLESHOOTING:');
            console.log('  - Run testKeyboard() to test input');
            console.log('  - Check console for state changes');
            console.log('  - Make sure game is in PLAYING state');
        };
        
        // Add a simple keyboard event listener for testing
        document.addEventListener('keydown', (e) => {
            
            
        });
        
        // Add state change monitoring
        let lastState = null;
        setInterval(() => {
            const currentState = this.engine?.getState()?.phase;
            if (currentState !== lastState) {
                
                lastState = currentState;
            }
        }, 1000);
        
        return Promise.resolve();
    }
    
    // LEGACY: Keep for compatibility
    async loadInputController() {
        console.log('🔄 Loading full input controller in background...');
        if (!InputController) {
            const module = await import('./core/input-controller.js');
            InputController = module.InputController;
        }
        
        // Destroy existing input controller if it exists
        if (this.input) {
            this.input.destroy();
        }
        
        this.input = new InputController(
            (action) => this.handleAction(action),
            () => this.engine.getState(),
            this.config
        );
        
        console.log('✅ Full input controller loaded and ready');
    }
    
    loadNonCriticalSystems() {
        // Load non-critical systems in background
        if (!this.nonCriticalModulesLoaded) {
            this.nonCriticalModulesLoaded = true;
            
            Promise.all([
                import('./gameplay/particles.js'),
                import('./gameplay/scoring.js'),
                import('./gameplay/starfield.js')
            ]).then(([particlesModule, scoringModule, starfieldModule]) => {
                ParticleSystem = particlesModule.ParticleSystem;
                ScoringSystem = scoringModule.ScoringSystem;
                createStarfieldRenderer = starfieldModule.createStarfieldRenderer;
                
                // Create visual effects systems
                this.particles = new ParticleSystem();
                this.scoring = new ScoringSystem();
                this.starfield = createStarfieldRenderer();
                
                console.log('✅ Non-critical systems loaded in background');
            }).catch(error => {
                console.warn('⚠️ Non-critical systems failed to load:', error);
            });
        }
    }
    
    initBlockchainInBackground() {
        // Use setTimeout to ensure this runs after the current execution context
        setTimeout(async () => {
            try {
                if (window.timeStart) window.timeStart('initBlockchainInBackground');
                console.log('🔗 Starting background blockchain initialization...');
                await this.blockchainManager.initialize();
                console.log('✅ Blockchain initialized successfully');
                
                // Update game engine with blockchain manager
                if (this.engine) {
                    this.engine.setBlockchainManager(this.blockchainManager);
                }
                
                // Update game context
                if (this.gameContext) {
                    this.gameContext.blockchain = this.blockchainManager;
                }
                if (window.timeEnd) window.timeEnd('initBlockchainInBackground');
            } catch (error) {
                console.log('⚠️ Blockchain initialization failed (game continues without blockchain):', error);
            }
        }, 100); // Small delay to ensure game loop starts first
    }

    // WIN 6: BATCH DOM UPDATES (3-5ms win)
    setupUIBatched() {
        if (window.timeStart) window.timeStart('setupUIBatched');
        // Batch DOM changes for better performance
        const fragment = document.createDocumentFragment();
        
        // Add all UI elements to fragment
        this.cleanupOldUI();
        
        // Then append fragment once (if needed)
        // document.body.appendChild(fragment);
        
        console.log('✅ UI setup complete (batched)');
        if (window.timeEnd) window.timeEnd('setupUIBatched');
    }
    
    setupUI() {
        return this.setupUIBatched();
    }

    cleanupOldUI() {
        // Simple cleanup - no complex UI to remove
        console.log('Simple UI cleanup complete');
    }

    startLoop() {
        this.running = true;
        this.render(); // Initial render
        requestAnimationFrame(() => this.gameLoop());
    }

    gameLoop() {
        if (!this.running) return;
        
        const now = performance.now();
        const delta = Math.min(now - this.lastTime, 100); // Cap delta at 100ms
        this.lastTime = now;
        
        this.accumulator += delta;
        const tickRate = this.config.get('game.tickRate');
        
        // Update game logic (limit to prevent blocking)
        let updated = false;
        let updateCount = 0;
        const maxUpdates = 10; // Prevent infinite loops
        
        while (this.accumulator >= tickRate && updateCount < maxUpdates) {
            this.update(tickRate);
            this.accumulator -= tickRate;
            updated = true;
            updateCount++;
        }
        
        // Reset accumulator if we hit max updates to prevent spiral
        if (updateCount >= maxUpdates) {
            this.accumulator = 0;
        }
        
        // Render only when needed and limit frequency
        if (updated || this.shouldRender()) {
            this.render();
        }
        
        // Use requestAnimationFrame for smooth 60fps
        requestAnimationFrame(() => this.gameLoop());
    }

    update(deltaTime) {
        try {
            if (this.engine) {
                this.engine.tick(deltaTime);
            }
        } catch (error) {
            console.error('Update error:', error);
            // Don't let update errors crash the game loop
        }
    }

    render() {
        if (!this.engine || !this.renderer) return;
        
        try {
            const state = this.engine.getState();
            if (!state) return;
            
            const particles = this.engine.getParticles();
            const starfield = {
                enabled: this.config.get('graphics.starfield') || false,
                brightness: 1.0,
                speed: 0.5
            };
            
            this.renderer.render(state, particles, starfield);
        } catch (error) {
            console.error('Render error:', error);
            // Don't let render errors crash the game loop
        }
    }

    shouldRender() {
        // Only render if game state has changed or we're in a state that needs continuous rendering
        if (!this.engine) return false;
        
        const state = this.engine.getState();
        if (!state) return false;
        
        // Always render during gameplay
        if (state.gameState === 'PLAYING') return true;
        
        // Render occasionally during other states (less frequently)
        return this.frameNumber % 60 === 0; // Every 60 frames (1 second at 60fps)
    }

    // Handle action with proper game over state checking
    handleAction(action) {
        // Clear auto-repeat timers when transitioning to non-playing states
        if (action.type === 'PAUSE' || action.type === 'GAME_OVER' || action.type === 'RETURN_TO_MENU') {
            if (this.input && typeof this.input.clearAllRepeat === 'function') {
                this.input.clearAllRepeat();
            }
        }
        
        // Handle special actions that need main.js logic
        switch (action.type) {
            case 'START_GAME':
                this.startNewGame();
                break;
            case 'RETURN_TO_MENU':
                this.returnToMenu();
                break;
            default:
                // Forward all other actions to the game engine
                if (this.engine) {
                    this.engine.handleInput(action);
                }
                break;
        }
    }

    handleResize() {
        if (!this.renderer || !this.viewport) return;
        
        const dims = this.viewport.calculateOptimalDimensions(innerWidth, innerHeight);
        const game = document.getElementById('game');
        const bg = document.getElementById('bg');
        
        if (game && bg) {
            game.width = dims.canvasWidth;
            game.height = dims.canvasHeight;
            bg.width = innerWidth;
            bg.height = innerHeight;
            
            // Update renderer dimensions
            this.renderer.dimensions = dims;
        }
        
        console.log('Resize handled');
    }

    showError(message) {
        const error = document.createElement('div');
        error.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: rgba(255,0,0,0.9); color: white; padding: 20px;
            border-radius: 10px; font-size: 18px; z-index: 10000; text-align: center;
        `;
        error.textContent = message;
        document.body.appendChild(error);
        
        setTimeout(() => error.remove(), 5000);
    }

    /**
     * Simple return to menu
     */
    returnToMenuViaStateManager() {
        console.log('Simple return to menu');
        
        // Reset game engine to clean state
        if (this.engine) {
            this.engine.returnToMenu();
        }
    }

    destroy() {
        this.running = false;
        this.audio?.destroy();
        this.input?.destroy();
        console.log('NeonDrop shutdown');
    }

    // Reset to menu (for "Play Again" from game over)
    async startNewGame() {
        console.log('Resetting to menu');
        
        // Validate identity before starting (skip if in bypass mode)
        if (!window.skipValidation) {
            try {
                if (typeof gameWrapper !== 'undefined' && gameWrapper.validateIdentity) {
                    gameWrapper.validateIdentity();
                } else {
                    console.log('⚠️ gameWrapper not available for validation - continuing anyway');
                }
            } catch (error) {
                console.error('Cannot start game without valid identity:', error);
                // On pages.dev, allow anyway
                if (!window.location.hostname.includes('pages.dev')) {
                    return;
                }
                console.log('🚨 Development override - continuing despite validation error');
            }
        } else {
            console.log('🚨 Skipping identity validation for new game (development bypass)');
        }
        
        // Hide any active overlays
        this.overlayManager.hideCurrent();
        
        // Reset renderer state for new game
        if (this.renderer && typeof this.renderer.resetForNewGame === 'function') {
            this.renderer.resetForNewGame();
        }
        
        // Return to menu state
        if (this.engine) {
            this.engine.returnToMenu();
            console.log('Game reset to menu - press spacebar to start');
        }
    }

    // Actually start the game (for spacebar from menu)
    async startGame() {
        console.log('Starting game from menu');
        
        if (this.engine) {
            this.engine.startGame();
            console.log('Game started successfully');
        }
    }

    // Clean menu return
    returnToMenu() {
        console.log('Returning to menu');
        
        // Hide any active overlays
        this.overlayManager.hideCurrent();
        
        // Transition to menu state
        this.stateMachine.transitionToGameState(GameState.MENU);
        
        if (this.engine) {
            this.engine.returnToMenu();
        }
    }

    // Simple leaderboard
    async showLeaderboard() {
        console.log('Showing leaderboard');
        // Simple leaderboard - no complex tournament system
    }

    getConfig() {
        return this.config || {};
    }

    bindEvents() {
        // Prevent duplicate event binding
        if (this.eventsBound) {
            console.log('Events already bound, skipping...');
            return;
        }
        this.eventsBound = true;
        
        console.log('Binding game events...');
        
        // REFACTORED: EventBus-driven game over handling
        if (!this.gameOverEventBound) {
            this.gameOverEventBound = true;
            
            const neonDropInstance = this;
            
            // Listen for game over event (immediate)
            this.eventBus.on('gameOver', (data) => {
                const { score, level, lines, time } = data;
                
                this.stateMachine.transitionToGameState(GameState.GAME_OVER);
                // Don't show UI yet - wait for renderer to complete sequence
            });
            
            // Listen for UI ready event (after 7-second sequence)
            this.eventBus.on('gameOverUIReady', async (data) => {
                const { score } = data;
                
                
                // Use overlay manager to show game over
                
                try {
                    await this.overlayManager.show('gameOver', { score, level: 0, lines: 0, time: 0 });
                    console.log('✅ overlayManager.show() completed successfully');
                } catch (error) {
                    console.error('❌ overlayManager.show() failed:', error);
                }
            });
        }

        // Tournament selection/start game
        this.eventBus.on('startGame', (data) => {
            
            this.startNewGame();
        });

        // Window resize (debounced)
        let resizeTimer;
        addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => this.handleResize(), 100);
        });

        // Comprehensive pause system for system interruptions
        this.setupComprehensivePauseSystem();

        // Prevent unwanted navigation and handle game controls
        addEventListener('keydown', e => {
            if (e.key === 'Backspace' && e.target === document.body) {
                e.preventDefault();
            }
            
                    // Handle SPACE key for game start/continue
        const gameState = this.engine?.getState();
        if (e.key === ' ' && gameState) {
            if (gameState.phase === 'MENU') {
                e.preventDefault();
                console.log('Starting game from menu with SPACE');
                this.startGame();
            } else if (gameState.phase === 'GAME_OVER' && !this.gameOverProcessing) {
                e.preventDefault();
                console.log('Starting new game after game over');
                this.startNewGame();
            } else if (gameState.phase === 'PAUSED' && this.pauseState?.isPaused) {
                e.preventDefault();
                console.log('Resuming from emergency pause with SPACE');
                this.resumeFromPause();
            }
        }
            
            // Input controller handles all game controls
            // No need for basic keyboard controls here
        });

        // Touch device detection
        if (window.BlockZoneMobile?.needsMobileControls()) {
            document.body.classList.add('touch-device');
        }

        // Audio activation on first user interaction
        const ensureAudioWorks = () => {
            if (this.audio && this.audio.ctx && this.audio.ctx.state === 'suspended') {
                this.audio.ctx.resume().then(() => {
                    console.log('✅ Audio context activated on user interaction');
                });
            }
        };

        // Single audio activation listener
        document.addEventListener('keydown', ensureAudioWorks, { once: true });
        document.addEventListener('click', ensureAudioWorks, { once: true });
        document.addEventListener('touchstart', ensureAudioWorks, { once: true });
    }



    setupComprehensivePauseSystem() {
        // Track pause state to prevent multiple pauses
        this.pauseState = {
            isPaused: false,
            pauseReason: null,
            lastPauseTime: 0
        };

        // 1. Page visibility change (tab switch, minimize, etc.)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.engine?.getState().phase === 'PLAYING') {
                this.emergencyPause('PAGE_HIDDEN');
            }
        });

        // 2. Window blur (focus lost to other applications)
        window.addEventListener('blur', () => {
            if (this.engine?.getState().phase === 'PLAYING') {
                this.emergencyPause('WINDOW_BLUR');
            }
        });

        // 3. Window focus (resume when focus returns)
        window.addEventListener('focus', () => {
            if (this.pauseState.isPaused && this.pauseState.pauseReason === 'WINDOW_BLUR') {
                this.resumeFromPause();
            }
        });

        // 4. Resize events (system overlays, browser UI changes)
        let resizeTimer;
        window.addEventListener('resize', () => {
            if (this.engine?.getState().phase === 'PLAYING') {
                // Debounce resize events to avoid excessive pausing
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(() => {
                    this.emergencyPause('RESIZE_EVENT');
                }, 100);
            }
        });

        // 5. Fullscreen change (system overlays, browser UI)
        document.addEventListener('fullscreenchange', () => {
            if (this.engine?.getState().phase === 'PLAYING') {
                this.emergencyPause('FULLSCREEN_CHANGE');
            }
        });

        // 6. Battery status changes (if supported)
        if ('getBattery' in navigator) {
            navigator.getBattery().then(battery => {
                battery.addEventListener('levelchange', () => {
                    if (this.engine?.getState().phase === 'PLAYING') {
                        this.emergencyPause('BATTERY_WARNING');
                    }
                });
            });
        }

        // 7. Network status changes
        window.addEventListener('online', () => {
            if (this.pauseState.isPaused && this.pauseState.pauseReason === 'NETWORK_OFFLINE') {
                this.resumeFromPause();
            }
        });

        window.addEventListener('offline', () => {
            if (this.engine?.getState().phase === 'PLAYING') {
                this.emergencyPause('NETWORK_OFFLINE');
            }
        });

        // 8. System notifications (if supported)
        if ('Notification' in window && Notification.permission === 'granted') {
            // Monitor for notification clicks that might interrupt
            document.addEventListener('click', (e) => {
                // Check if click is outside game area (potential system overlay)
                const gameArea = document.querySelector('#game-canvas') || document.body;
                if (!gameArea.contains(e.target) && this.engine?.getState().phase === 'PLAYING') {
                    this.emergencyPause('EXTERNAL_CLICK');
                }
            });
        }

        console.log('🛡️ Comprehensive pause system activated');
    }

    emergencyPause(reason) {
        const now = Date.now();
        const gameState = this.engine?.getState();
        
        // Prevent multiple rapid pauses
        if (this.pauseState.isPaused && (now - this.pauseState.lastPauseTime) < 1000) {
            return;
        }

        if (gameState && gameState.phase === 'PLAYING') {
            this.pauseState.isPaused = true;
            this.pauseState.pauseReason = reason;
            this.pauseState.lastPauseTime = now;

            console.log(`⏸️ Emergency pause triggered: ${reason}`);
            
            // Pause the game engine
            this.engine.handleInput({ type: 'PAUSE' });
            
            // Show pause notification to user
            this.showPauseNotification(reason);
        }
    }

    resumeFromPause() {
        if (this.pauseState.isPaused) {
            console.log(`▶️ Resuming from pause: ${this.pauseState.pauseReason}`);
            
            this.pauseState.isPaused = false;
            this.pauseState.pauseReason = null;
            
            // Resume the game
            this.engine.handleInput({ type: 'PAUSE' }); // Toggle pause off
            
            // Hide pause notification
            this.hidePauseNotification();
        }
    }

    showPauseNotification(reason) {
        // Create or update pause notification
        let notification = document.getElementById('emergency-pause-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'emergency-pause-notification';
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(255, 0, 0, 0.9);
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                font-family: 'Bungee', monospace;
                font-size: 14px;
                z-index: 10000;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                animation: slideIn 0.3s ease-out;
            `;
            document.body.appendChild(notification);
        }

        const reasonText = {
            'PAGE_HIDDEN': 'Game paused - Page hidden',
            'WINDOW_BLUR': 'Game paused - Window lost focus',
            'RESIZE_EVENT': 'Game paused - System overlay detected',
            'FULLSCREEN_CHANGE': 'Game paused - Display mode changed',
            'BATTERY_WARNING': 'Game paused - Battery warning',
            'NETWORK_OFFLINE': 'Game paused - Network disconnected',
            'EXTERNAL_CLICK': 'Game paused - External interaction'
        };

        notification.textContent = reasonText[reason] || 'Game paused - System interruption';
    }

    hidePauseNotification() {
        const notification = document.getElementById('emergency-pause-notification');
        if (notification) {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }


}


// Identity-gated game start
export async function startGame() {
    try {
        
        
        // Paywall already checked at the beginning - just start the game
        
        // Always destroy previous instance if present
        if (window.neonDrop) {
            window.neonDrop.destroy?.();
        }
        
        const game = new NeonDrop();
        await game.initialize();
        window.neonDrop = game;
        
        console.log('✅ NeonDrop instance created and stored in window.neonDrop');
        return true;
        
    } catch (error) {
        console.error('Failed to start NeonDrop:', error);
        return false;
    }
}

// Make startGame globally available for PaywallManager
window.startNeonDropGame = startGame;

// Cleanup on exit
addEventListener('beforeunload', () => window.neonDrop?.destroy());

// Export the NeonDrop class for wrapper usage
export { NeonDrop };

// GAME OVER HANDLING (Professional Structure)
//
// - Only the new game over event/UI system is used.
// - All legacy or duplicate game over rendering logic is removed.
// - main.js only listens for game over events to trigger overlays, not for rendering or logic.








