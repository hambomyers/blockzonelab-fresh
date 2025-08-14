/**
 * Mobile Game Framework - Responsive Design and Touch Controls
 * Handles mobile detection, touch controls, and responsive behavior
 */

// console.log('📱 Loading Mobile Game Framework...');

// Mobile detection and responsive utilities
class MobileGameFramework {
    constructor() {
        this.isMobile = this.detectMobile();
        this.isTablet = this.detectTablet();
        this.hasTouch = this.detectTouch();
        this.isPWA = this.detectPWA();
        this.screenSize = this.getScreenSize();
        
        this.initialize();
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
    
    detectPWA() {
        return window.matchMedia('(display-mode: standalone)').matches || 
               window.navigator.standalone === true;
    }
    
    getScreenSize() {
        const w = window.innerWidth;
        if (w <= 480) return 'small';
        if (w <= 768) return 'medium';
        if (w <= 1024) return 'large';
        return 'xlarge';
    }
    
    hasPhysicalKeyboard() {
        return !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || 
               window.innerWidth > 1024;
    }
    
    needsMobileControls() {
        return (this.isMobile || this.isTablet) && !this.hasPhysicalKeyboard();
    }
    
    initialize() {
        // Set CSS custom properties for responsive design
        document.documentElement.style.setProperty('--is-mobile', this.isMobile ? '1' : '0');
        document.documentElement.style.setProperty('--has-touch', this.hasTouch ? '1' : '0');
        document.documentElement.style.setProperty('--has-keyboard', this.hasPhysicalKeyboard() ? '1' : '0');
        document.documentElement.style.setProperty('--needs-mobile-controls', this.needsMobileControls() ? '1' : '0');
        document.documentElement.style.setProperty('--screen-size', this.screenSize);
        
        // Add mobile-specific classes to body
        if (this.isMobile) document.body.classList.add('mobile');
        if (this.isTablet) document.body.classList.add('tablet');
        if (this.hasTouch) document.body.classList.add('touch');
        if (this.isPWA) document.body.classList.add('pwa');
        
        // Handle orientation changes
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleOrientationChange();
            }, 100);
        });
        
        // Handle resize events
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // console.log('📱 Mobile Framework initialized:', {
            isMobile: this.isMobile,
            isTablet: this.isTablet,
            hasTouch: this.hasTouch,
            isPWA: this.isPWA,
            screenSize: this.screenSize,
            needsMobileControls: this.needsMobileControls()
        });
    }
    
    handleOrientationChange() {
        // Update screen size after orientation change
        this.screenSize = this.getScreenSize();
        document.documentElement.style.setProperty('--screen-size', this.screenSize);
        
        // Emit orientation change event
        window.dispatchEvent(new CustomEvent('orientationChange', {
            detail: { screenSize: this.screenSize }
        }));
    }
    
    handleResize() {
        // Update mobile detection on resize
        const wasMobile = this.isMobile;
        this.isMobile = this.detectMobile();
        this.isTablet = this.detectTablet();
        this.screenSize = this.getScreenSize();
        
        // Update CSS properties
        document.documentElement.style.setProperty('--is-mobile', this.isMobile ? '1' : '0');
        document.documentElement.style.setProperty('--screen-size', this.screenSize);
        
        // Update body classes
        document.body.classList.toggle('mobile', this.isMobile);
        document.body.classList.toggle('tablet', this.isTablet);
        
        // Emit resize event if mobile state changed
        if (wasMobile !== this.isMobile) {
            window.dispatchEvent(new CustomEvent('mobileStateChange', {
                detail: { 
                    isMobile: this.isMobile,
                    screenSize: this.screenSize
                }
            }));
        }
    }
    
    // Touch control utilities
    createTouchControls(container, actions) {
        if (!this.needsMobileControls()) return;
        
        const controls = document.createElement('div');
        controls.className = 'mobile-controls';
        controls.innerHTML = `
            <div class="touch-left">
                <button class="touch-btn" data-action="left">◀</button>
            </div>
            <div class="touch-center">
                <button class="touch-btn" data-action="down">▼</button>
                <button class="touch-btn" data-action="rotate">↻</button>
            </div>
            <div class="touch-right">
                <button class="touch-btn" data-action="right">▶</button>
            </div>
            <div class="touch-bottom">
                <button class="touch-btn" data-action="drop">⬇⬇</button>
                <button class="touch-btn" data-action="hold">HOLD</button>
            </div>
        `;
        
        // Add event listeners
        controls.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action && actions[action]) {
                actions[action]();
            }
        });
        
        container.appendChild(controls);
        return controls;
    }
    
    // Prevent zoom on double tap
    preventZoom() {
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (event) => {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    }
    
    // Get device pixel ratio for high DPI displays
    getDevicePixelRatio() {
        return window.devicePixelRatio || 1;
    }
    
    // Check if device supports vibration
    supportsVibration() {
        return 'vibrate' in navigator;
    }
    
    // Vibrate device (if supported)
    vibrate(pattern) {
        if (this.supportsVibration()) {
            navigator.vibrate(pattern);
        }
    }
}

// Create global instance
window.BlockZoneMobile = new MobileGameFramework();

// Export for module usage
export { MobileGameFramework };
export default window.BlockZoneMobile; 
