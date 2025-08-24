/**
 * core/input-controller.js - Clean & Minimal Game Input System
 * 
 * Direct, predictable input handling with DAS auto-repeat and FLOAT diagonal movement
 */



export class InputController {
    constructor(onAction, getState, config) {
        this.onAction = onAction;
        this.getState = getState;
        this.config = config;
        
        // Simple key tracking
        this.activeKeys = new Set();
        
        // Auto-repeat system for DAS (Delayed Auto Shift)
        this.autoRepeatTimers = new Map();
        this.autoRepeatDelays = {
            initial: 200,  // Initial delay before auto-repeat starts
            repeat: 50     // Speed of auto-repeat (gets faster)
        };
        

        
        // Setup listeners
        this.setupListeners();
    }

    /**
     * Setup event listeners
     */
    setupListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
        
        // Window events for cleanup
        window.addEventListener('blur', () => this.clearAllAutoRepeat());
        window.addEventListener('focus', () => this.clearAllAutoRepeat());
    }

    /**
     * Keyboard key down handler
     */
    onKeyDown(e) {
        const state = this.getCurrentGameState();
        
        // Special handling for MENU state
        if (state.phase === 'MENU' && (e.code === 'Space' || e.code === 'Enter')) {
            e.preventDefault();
            if (this.activeKeys.has(e.code)) return;
            
            this.activeKeys.add(e.code);
            this.processAction({ type: 'START_GAME' });
            return;
        }

        // Check if we should capture game keys
        if (!this.shouldCaptureGameKeys()) {
            return;
        }

        // Prevent default for game keys
        if (this.isGameKey(e.code)) {
            e.preventDefault();
        }

        // Prevent duplicate key presses
        if (this.activeKeys.has(e.code)) {
            return;
        }

        this.activeKeys.add(e.code);

        // Get action for this key
        const action = this.keyToAction(e.code);
        if (action) {
            this.processAction(action);
            
            // Start auto-repeat for movement keys
            if (action.type === 'MOVE' && (action.dx !== 0 || action.dy !== 0)) {
                this.startAutoRepeat(e.code, action);
            }
        }
    }

    /**
     * Keyboard key up handler
     */
    onKeyUp(e) {
        this.activeKeys.delete(e.code);
        this.stopAutoRepeat(e.code);
    }

    /**
     * Convert key code to action
     */
    keyToAction(keyCode) {
        const mapping = {
            // Movement
            'ArrowLeft': { type: 'MOVE', dx: -1, dy: 0 },
            'KeyA': { type: 'MOVE', dx: -1, dy: 0 },
            'ArrowRight': { type: 'MOVE', dx: 1, dy: 0 },
            'KeyD': { type: 'MOVE', dx: 1, dy: 0 },
            'ArrowDown': { type: 'MOVE', dx: 0, dy: 1 },
            'KeyS': { type: 'MOVE', dx: 0, dy: 1 },

            // Rotation
            'ArrowUp': { type: 'ROTATE', direction: 1 },
            'KeyW': { type: 'ROTATE', direction: 1 },
            'KeyZ': { type: 'ROTATE', direction: -1 },
            'ShiftLeft': { type: 'ROTATE', direction: -1 },
            'KeyX': { type: 'ROTATE', direction: 1 },
            'ControlLeft': { type: 'ROTATE', direction: 1 },
            'ControlRight': { type: 'ROTATE', direction: 1 },

            // Actions
            'Space': { type: 'HARD_DROP' },
            'KeyF': { type: 'HARD_DROP' },
            'KeyC': { type: 'HOLD' },
            'ShiftRight': { type: 'HOLD' },
            'Escape': { type: 'PAUSE' },
            'Enter': { type: 'ENTER' },
            'KeyP': { type: 'PAUSE' }
        };

        return mapping[keyCode];
    }

    /**
     * Check if we should capture game keys
     */
    shouldCaptureGameKeys() {
        const focusedElement = document.activeElement;
        if (focusedElement && (
            focusedElement.tagName === 'INPUT' || 
            focusedElement.tagName === 'TEXTAREA' ||
            focusedElement.contentEditable === 'true'
        )) {
            return false;
        }

        const state = this.getCurrentGameState();
        

        
        const gameplayPhases = ['PLAYING', 'LOCKING', 'PAUSED'];
        const gameOverPhases = ['GAME_OVER', 'GAME_OVER_SEQUENCE'];
        
        if (gameOverPhases.includes(state.phase)) {
            return false;
        }
        
        return gameplayPhases.includes(state.phase);
    }

    /**
     * Check if key is a game key
     */
    isGameKey(keyCode) {
        const gameKeys = [
            'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
            'KeyA', 'KeyD', 'KeyW', 'KeyS',
            'KeyZ', 'KeyX', 'KeyC', 'KeyF', 'KeyP',
            'Space', 'Enter', 'Escape',
            'ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight'
        ];
        return gameKeys.includes(keyCode);
    }

    /**
     * Process action based on game state
     */
    processAction(action) {
        const state = this.getCurrentGameState();
        
        switch (state.phase) {
            case 'MENU':
                this.handleMenuInput(action);
                break;
            case 'PLAYING':
            case 'LOCKING':
                this.handleGameplayInput(action);
                break;
            case 'PAUSED':
                this.handlePausedInput(action);
                break;
            case 'GAME_OVER':
            case 'GAME_OVER_SEQUENCE':
                this.handleGameOverInput(action);
                break;
        }
    }

    /**
     * Handle menu input
     */
    handleMenuInput(action) {
        if (action.type === 'START_GAME' || action.type === 'ENTER') {
            this.onAction({ type: 'START_GAME' });
        }
    }

    /**
     * Handle gameplay input
     */
    handleGameplayInput(action) {
        // Handle pause
        if (action.type === 'PAUSE' || action.type === 'ESCAPE') {
            this.onAction({ type: 'PAUSE' });
            return;
        }

        // Handle FLOAT piece up movement
        if (action.type === 'ROTATE' && action.direction === 1) {
            const gameState = this.getCurrentGameState();
            const isFloatPiece = gameState.current && gameState.current.type === 'FLOAT';
            
            if (isFloatPiece) {
                // Send UP_PRESSED for FLOAT pieces
                this.onAction({ type: 'UP_PRESSED' });
                return;
            }
        }

        // Handle FLOAT piece diagonal up movement (up + left/right)
        if (action.type === 'MOVE' && action.dy === 0) {
            const gameState = this.getCurrentGameState();
            const isFloatPiece = gameState.current && gameState.current.type === 'FLOAT';
            
            if (isFloatPiece) {
                // Check if up key is also pressed
                const hasUpPressed = this.activeKeys.has('ArrowUp') || this.activeKeys.has('KeyW');
                
                if (hasUpPressed) {
                    // Send diagonal up movement
                    this.onAction({ type: 'MOVE', dx: action.dx, dy: -1 });
                    return;
                }
            }
        }

        // Pass action through - FLOAT pieces move normally like other pieces
        this.onAction(action);
    }

    /**
     * Handle paused input
     */
    handlePausedInput(action) {
        if (action.type === 'SPACE' || action.type === 'ENTER' || action.type === 'ESCAPE' || action.type === 'PAUSE') {
            this.onAction({ type: 'PAUSE' });
        }
    }

    /**
     * Handle game over input
     */
    handleGameOverInput(action) {
        if (action.type === 'SPACE' || action.type === 'ENTER' || action.type === 'ESCAPE') {
            this.onAction({ type: 'RETURN_TO_MENU' });
        }
    }

    /**
     * Get current game state
     */
    getCurrentGameState() {
        return this.getState ? this.getState() : { phase: 'MENU' };
    }

    /**
     * Start auto repeat for DAS
     */
    startAutoRepeat(keyCode, action) {
        if (this.autoRepeatTimers.has(keyCode)) return;

        const timer = setTimeout(() => {
            this.processAction(action);
            this.autoRepeatTimers.set(keyCode, setInterval(() => {
                this.processAction(action);
            }, this.autoRepeatDelays.repeat));
        }, this.autoRepeatDelays.initial);

        this.autoRepeatTimers.set(keyCode, timer);
    }

    /**
     * Stop auto repeat
     */
    stopAutoRepeat(keyCode) {
        const timer = this.autoRepeatTimers.get(keyCode);
        if (timer) {
            clearTimeout(timer);
            clearInterval(timer);
            this.autoRepeatTimers.delete(keyCode);
        }
    }

    /**
     * Clear all auto-repeat timers
     */
    clearAllAutoRepeat() {
        this.autoRepeatTimers.forEach((timer) => {
            clearTimeout(timer);
            clearInterval(timer);
        });
        this.autoRepeatTimers.clear();
    }

    /**
     * Clear all active keys
     */
    clearActiveKeys() {
        this.activeKeys.clear();
    }

    /**
     * Destroy the input controller
     */
    destroy() {
        this.clearAllAutoRepeat();
        this.clearActiveKeys();
        // Note: We don't remove event listeners to avoid memory leaks
        // The controller will be garbage collected when no longer referenced
    }
}

