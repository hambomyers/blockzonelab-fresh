/**
 * NeonDrop v2 - Clean Input System
 * 
 * Essential controls only, no bloat
 * Target: 100 lines, responsive input
 */

export class InputSystemV2 {
    constructor(engine) {
        this.engine = engine;
        this.keys = new Set();
        this.keyMappings = {
            'ArrowLeft': 'MOVE_LEFT',
            'KeyA': 'MOVE_LEFT',
            'ArrowRight': 'MOVE_RIGHT',
            'KeyD': 'MOVE_RIGHT',
            'ArrowDown': 'SOFT_DROP',
            'KeyS': 'SOFT_DROP',
            'ArrowUp': 'ROTATE_CW',
            'KeyW': 'ROTATE_CW',
            'KeyZ': 'ROTATE_CCW',
            'Space': 'HARD_DROP',
            'KeyC': 'HOLD',
            'Escape': 'PAUSE',
            'KeyP': 'PAUSE',
            'Enter': 'START'
        };
        
        // Auto-repeat system (DAS/ARR)
        this.repeatTimers = new Map();
        this.dasDelay = 133; // Delayed Auto Shift
        this.arrRate = 33;   // Auto Repeat Rate
        
        this.setupEventListeners();
        console.log('🎮 Input System v2 initialized - essential controls only');
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Prevent default browser behaviors for game keys
        document.addEventListener('keydown', (e) => {
            if (this.keyMappings[e.code]) {
                e.preventDefault();
            }
        });
    }

    handleKeyDown(e) {
        const action = this.keyMappings[e.code];
        if (!action) return;

        // Prevent key repeat from OS
        if (this.keys.has(e.code)) return;
        
        this.keys.add(e.code);
        
        // Immediate action
        this.engine.handleInput({ type: action });
        
        // Setup auto-repeat for movement keys
        if (this.isMovementKey(action)) {
            this.setupAutoRepeat(e.code, action);
        }
    }

    handleKeyUp(e) {
        const action = this.keyMappings[e.code];
        if (!action) return;
        
        this.keys.delete(e.code);
        
        // Clear auto-repeat timer
        if (this.repeatTimers.has(e.code)) {
            clearInterval(this.repeatTimers.get(e.code));
            this.repeatTimers.delete(e.code);
        }
    }

    setupAutoRepeat(keyCode, action) {
        // DAS delay before auto-repeat starts
        setTimeout(() => {
            if (this.keys.has(keyCode)) {
                // Start auto-repeat
                const timer = setInterval(() => {
                    if (this.keys.has(keyCode)) {
                        this.engine.handleInput({ type: action });
                    } else {
                        clearInterval(timer);
                        this.repeatTimers.delete(keyCode);
                    }
                }, this.arrRate);
                
                this.repeatTimers.set(keyCode, timer);
            }
        }, this.dasDelay);
    }

    isMovementKey(action) {
        return ['MOVE_LEFT', 'MOVE_RIGHT', 'SOFT_DROP'].includes(action);
    }

    // Touch support for mobile
    setupTouchControls(canvas) {
        let touchStartX = 0;
        let touchStartY = 0;
        let touchStartTime = 0;
        
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            touchStartTime = Date.now();
        });
        
        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            const deltaX = touch.clientX - touchStartX;
            const deltaY = touch.clientY - touchStartY;
            const deltaTime = Date.now() - touchStartTime;
            
            // Swipe detection
            const minSwipeDistance = 50;
            const maxSwipeTime = 300;
            
            if (deltaTime < maxSwipeTime) {
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    // Horizontal swipe
                    if (Math.abs(deltaX) > minSwipeDistance) {
                        if (deltaX > 0) {
                            this.engine.handleInput({ type: 'MOVE_RIGHT' });
                        } else {
                            this.engine.handleInput({ type: 'MOVE_LEFT' });
                        }
                    }
                } else {
                    // Vertical swipe
                    if (Math.abs(deltaY) > minSwipeDistance) {
                        if (deltaY > 0) {
                            this.engine.handleInput({ type: 'SOFT_DROP' });
                        } else {
                            this.engine.handleInput({ type: 'HARD_DROP' });
                        }
                    }
                }
            } else {
                // Tap (short touch)
                if (deltaTime < 200 && Math.abs(deltaX) < 20 && Math.abs(deltaY) < 20) {
                    this.engine.handleInput({ type: 'ROTATE_CW' });
                }
            }
        });
        
        console.log('📱 Touch controls enabled');
    }

    // Update DAS/ARR settings
    updateSettings(dasDelay, arrRate) {
        this.dasDelay = dasDelay;
        this.arrRate = arrRate;
        console.log(`🎮 Input settings updated: DAS=${dasDelay}ms, ARR=${arrRate}ms`);
    }

    // Cleanup
    destroy() {
        // Clear all timers
        for (const timer of this.repeatTimers.values()) {
            clearInterval(timer);
        }
        this.repeatTimers.clear();
        
        // Remove event listeners would go here if needed
        console.log('🎮 Input system cleaned up');
    }
}
