/**
 * Modern Mobile Touch Handler - Clean Swipe Controls for iPhone
 * Uses intuitive swipe gestures instead of clunky buttons
 */

console.log('📱 Loading Modern Mobile Touch Handler...');

class ModernMobileTouchHandler {
    constructor() {
        this.isMobile = this.detectMobile();
        this.isTablet = this.detectTablet();
        this.hasTouch = this.detectTouch();
        
        // Touch state tracking
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchStartTime = 0;
        this.longPressTimer = null;
        this.longPressThreshold = 500; // 500ms for long press
        this.swipeThreshold = 30; // Minimum distance for swipe
        this.isLongPressing = false;
        
        if (this.isMobile || this.isTablet || this.hasTouch) {
            this.initialize();
        }
    }
    
    detectMobile() {
        return window.innerWidth <= 768 || 
               /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    }
    
    detectTablet() {
        return window.innerWidth > 768 && 
               window.innerWidth <= 1024 && 
               'ontouchstart' in window;
    }
    
    detectTouch() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }
    
    initialize() {
        console.log('📱 Modern Mobile Touch Handler: Initializing swipe controls');
        
        // Remove old touch controls
        this.removeOldTouchControls();
        
        // Add swipe event listeners to game canvas
        this.addSwipeListeners();
        
        // Add space bar simulation for game start
        this.addSpaceBarSimulation();
        
        // Prevent zoom and other mobile annoyances
        this.preventMobileIssues();
        
        console.log('✅ Modern swipe controls initialized');
    }
    
    removeOldTouchControls() {
        // Hide the old touch controls
        const touchControls = document.getElementById('touch-controls');
        if (touchControls) {
            touchControls.style.display = 'none';
            console.log('📱 Removed old touch controls');
        }
    }
    
    addSwipeListeners() {
        // Get the game canvas
        const gameCanvas = document.getElementById('game');
        const bgCanvas = document.getElementById('bg');
        
        if (!gameCanvas) {
            console.warn('📱 Game canvas not found, adding listeners to body');
            this.addSwipeListenersToElement(document.body);
            return;
        }
        
        this.addSwipeListenersToElement(gameCanvas);
        
        // Also add to background canvas if it exists
        if (bgCanvas) {
            this.addSwipeListenersToElement(bgCanvas);
        }
        
        console.log('📱 Swipe listeners added to game canvas');
    }
    
    addSwipeListenersToElement(element) {
        // Touch start
        element.addEventListener('touchstart', (event) => {
            event.preventDefault();
            
            const touch = event.touches[0];
            this.touchStartX = touch.clientX;
            this.touchStartY = touch.clientY;
            this.touchStartTime = Date.now();
            this.isLongPressing = false;
            
            // Start long press timer
            this.longPressTimer = setTimeout(() => {
                this.isLongPressing = true;
                this.handleLongPress();
            }, this.longPressThreshold);
            
            console.log('📱 Touch started at:', this.touchStartX, this.touchStartY);
        }, { passive: false });
        
        // Touch move
        element.addEventListener('touchmove', (event) => {
            event.preventDefault();
            
            // Cancel long press if user moves finger
            if (this.longPressTimer) {
                clearTimeout(this.longPressTimer);
                this.longPressTimer = null;
            }
            
            const touch = event.touches[0];
            const deltaX = touch.clientX - this.touchStartX;
            const deltaY = touch.clientY - this.touchStartY;
            
            // If moved significantly, cancel long press
            if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
                this.isLongPressing = false;
            }
        }, { passive: false });
        
        // Touch end
        element.addEventListener('touchend', (event) => {
            event.preventDefault();
            
            // Cancel long press timer
            if (this.longPressTimer) {
                clearTimeout(this.longPressTimer);
                this.longPressTimer = null;
            }
            
            // If it was a long press, don't process as swipe
            if (this.isLongPressing) {
                this.isLongPressing = false;
                return;
            }
            
            const touch = event.changedTouches[0];
            const deltaX = touch.clientX - this.touchStartX;
            const deltaY = touch.clientY - this.touchStartY;
            const deltaTime = Date.now() - this.touchStartTime;
            
            // Determine gesture type
            if (deltaTime < 300) { // Quick gesture
                if (Math.abs(deltaX) > this.swipeThreshold) {
                    // Horizontal swipe
                    if (deltaX > 0) {
                        this.handleSwipeRight();
                    } else {
                        this.handleSwipeLeft();
                    }
                } else if (Math.abs(deltaY) > this.swipeThreshold) {
                    // Vertical swipe
                    if (deltaY > 0) {
                        this.handleSwipeDown();
                    } else {
                        this.handleSwipeUp();
                    }
                } else {
                    // Tap (no significant movement)
                    this.handleTap();
                }
            }
        }, { passive: false });
        
        // Touch cancel
        element.addEventListener('touchcancel', (event) => {
            event.preventDefault();
            
            if (this.longPressTimer) {
                clearTimeout(this.longPressTimer);
                this.longPressTimer = null;
            }
            
            this.isLongPressing = false;
        }, { passive: false });
    }
    
    handleSwipeLeft() {
        console.log('📱 Swipe Left: Move piece left');
        this.simulateKeyPress('ArrowLeft');
    }
    
    handleSwipeRight() {
        console.log('📱 Swipe Right: Move piece right');
        this.simulateKeyPress('ArrowRight');
    }
    
    handleSwipeDown() {
        console.log('📱 Swipe Down: Soft drop');
        this.simulateKeyPress('ArrowDown');
    }
    
    handleSwipeUp() {
        console.log('📱 Swipe Up: Rotate piece');
        this.simulateKeyPress('ArrowUp');
    }
    
    handleTap() {
        console.log('📱 Tap: Rotate piece');
        this.simulateKeyPress('ArrowUp');
    }
    
    handleLongPress() {
        console.log('📱 Long Press: Hard drop');
        this.simulateKeyPress('Space');
    }
    
    simulateKeyPress(key) {
        // Create and dispatch a keyboard event
        const event = new KeyboardEvent('keydown', {
            key: key,
            code: key === 'Space' ? 'Space' : `Key${key}`,
            keyCode: key === 'Space' ? 32 : key.charCodeAt(0),
            which: key === 'Space' ? 32 : key.charCodeAt(0),
            bubbles: true,
            cancelable: true
        });
        
        document.dispatchEvent(event);
        
        // Also try to trigger the game's input handler directly
        if (window.neonDrop && window.neonDrop.inputController) {
            window.neonDrop.inputController.handleKeyDown(event);
        }
    }
    
    addSpaceBarSimulation() {
        // Add a visual indicator for space bar simulation
        const spaceIndicator = document.createElement('div');
        spaceIndicator.id = 'space-indicator';
        spaceIndicator.innerHTML = `
            <div style="
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 212, 255, 0.2);
                border: 2px solid #00d4ff;
                border-radius: 25px;
                padding: 15px 30px;
                color: #00d4ff;
                font-family: 'Bungee', monospace;
                font-size: 14px;
                font-weight: bold;
                text-align: center;
                z-index: 1000;
                backdrop-filter: blur(10px);
                box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
                display: none;
            ">
                <div style="margin-bottom: 5px;">🎮 GAME CONTROLS</div>
                <div style="font-size: 12px; opacity: 0.8;">
                    ← → Move | ↓ Drop | Tap Rotate | Hold Hard Drop
                </div>
            </div>
        `;
        
        document.body.appendChild(spaceIndicator);
        
        // Show indicator when game is active
        const showIndicator = () => {
            spaceIndicator.style.display = 'block';
        };
        
        const hideIndicator = () => {
            spaceIndicator.style.display = 'none';
        };
        
        // Show indicator when game starts
        window.addEventListener('gameStarted', showIndicator);
        window.addEventListener('gamePaused', hideIndicator);
        window.addEventListener('gameOver', hideIndicator);
        
        // Auto-hide after 5 seconds
        setTimeout(hideIndicator, 5000);
    }
    
    preventMobileIssues() {
        // Prevent zoom on input focus
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.style.fontSize = '16px';
        });
        
        // Prevent pull-to-refresh
        document.body.style.overscrollBehavior = 'none';
        
        // Prevent text selection
        document.body.style.webkitUserSelect = 'none';
        document.body.style.userSelect = 'none';
        
        // Prevent touch callouts
        document.body.style.webkitTouchCallout = 'none';
        
        // Prevent tap highlights
        document.body.style.webkitTapHighlightColor = 'transparent';
        
        console.log('📱 Mobile issues prevented');
    }
    
    // Utility method to add swipe events to specific elements
    addSwipeEventsToElement(element) {
        if (!element) return;
        this.addSwipeListenersToElement(element);
    }
}

// Initialize modern mobile touch handler
const modernMobileTouchHandler = new ModernMobileTouchHandler();

// Make it available globally
window.modernMobileTouchHandler = modernMobileTouchHandler;

// Export for module use
export { ModernMobileTouchHandler }; 
