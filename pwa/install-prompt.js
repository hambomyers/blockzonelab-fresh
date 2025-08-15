/**
 * BlockZone Lab PWA Installation Manager
 * Industry-standard PWA installation following Web3 gaming best practices
 */

class PWAInstaller {
  constructor() {
    this.deferredPrompt = null;
    this.isInstalled = false;
    this.isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    this.init();
  }
  
  init() {
    // Register service worker
    this.registerServiceWorker();
    
    // Set up install prompt handling
    this.setupInstallPrompt();
    
    // Check if already installed
    this.checkInstallStatus();
    
    // Add install button if appropriate
    this.setupInstallUI();
  }
  
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {        const registration = await navigator.serviceWorker.register('/pwa/service-worker.js', {
          scope: '/pwa/'
        });
        
        // console.log('[PWA] Service Worker registered:', registration.scope);
        
        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.showUpdateAvailable();
            }
          });
        });
        
      } catch (error) {
        console.error('[PWA] Service Worker registration failed:', error);
      }
    }
  }
  
  setupInstallPrompt() {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      // console.log('[PWA] Install prompt available');
      e.preventDefault(); // Prevent default browser prompt
      this.deferredPrompt = e;
      this.showInstallButton();
    });
    
    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      // console.log('[PWA] App installed successfully');
      this.isInstalled = true;
      this.hideInstallButton();
      this.trackInstallation();
    });
  }
  
  checkInstallStatus() {
    // Check if running in standalone mode (already installed)
    if (this.isStandalone) {
      this.isInstalled = true;
      // console.log('[PWA] Running in standalone mode');
    }
    
    // Check for iOS Safari installation
    if (window.navigator.standalone === true) {
      this.isInstalled = true;
      // console.log('[PWA] Installed on iOS Safari');
    }
  }
  
  setupInstallUI() {
    // Create install button (only show if not installed and prompt available)
    if (!this.isInstalled && !this.isStandalone) {
      this.createInstallButton();
    }
  }
  
  createInstallButton() {
    // Check if button already exists
    if (document.getElementById('pwa-install-btn')) return;
    
    const installButton = document.createElement('button');
    installButton.id = 'pwa-install-btn';
    installButton.className = 'pwa-install-button hidden';
    installButton.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19,13H13V19H11V13H5L12,6L19,13Z"/>
      </svg>
      <span>Install App</span>
    `;
    
    installButton.addEventListener('click', () => this.promptInstall());
    
    // Add to header or floating position
    const header = document.querySelector('header') || document.querySelector('nav') || document.body;
    header.appendChild(installButton);
    
    // Add styles
    this.addInstallButtonStyles();
  }
  
  addInstallButtonStyles() {
    if (document.getElementById('pwa-install-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'pwa-install-styles';
    styles.textContent = `
      .pwa-install-button {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        
        display: flex;
        align-items: center;
        gap: 0.5rem;
        
        padding: 0.75rem 1rem;
        background: linear-gradient(135deg, #d4af37, #f4d03f);
        color: #1a1d29;
        border: none;
        border-radius: 12px;
        
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        
        box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
        transition: all 0.3s ease;
        
        transform: translateY(-100px);
        opacity: 0;
      }
      
      .pwa-install-button:not(.hidden) {
        transform: translateY(0);
        opacity: 1;
      }
      
      .pwa-install-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(212, 175, 55, 0.4);
      }
      
      .pwa-install-button:active {
        transform: translateY(0);
      }
      
      @media (max-width: 768px) {
        .pwa-install-button {
          top: auto;
          bottom: 20px;
          right: 20px;
          left: 20px;
          justify-content: center;
        }
      }
      
      .pwa-install-button.hidden {
        display: none;
      }
    `;
    
    document.head.appendChild(styles);
  }
  
  showInstallButton() {
    const button = document.getElementById('pwa-install-btn');
    if (button) {
      button.classList.remove('hidden');
      
      // Auto-hide after 10 seconds to avoid being annoying
      setTimeout(() => {
        if (button && !button.matches(':hover')) {
          button.style.opacity = '0.6';
        }
      }, 10000);
    }
  }
  
  hideInstallButton() {
    const button = document.getElementById('pwa-install-btn');
    if (button) {
      button.classList.add('hidden');
    }
  }
  
  async promptInstall() {
    if (!this.deferredPrompt) {
      // console.log('[PWA] No install prompt available');
      return;
    }
    
    try {
      // Show the install prompt
      this.deferredPrompt.prompt();
      
      // Wait for user response
      const { outcome } = await this.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        // console.log('[PWA] User accepted install prompt');
        this.trackInstallAttempt(true);
      } else {
        // console.log('[PWA] User dismissed install prompt');
        this.trackInstallAttempt(false);
      }
      
      // Clear the prompt
      this.deferredPrompt = null;
      this.hideInstallButton();
      
    } catch (error) {
      console.error('[PWA] Install prompt failed:', error);
    }
  }
  
  showUpdateAvailable() {
    // Show subtle notification about update
    const notification = document.createElement('div');
    notification.className = 'pwa-update-notification';
    notification.innerHTML = `
      <div class="pwa-update-content">
        <span>🎮 New features available!</span>
        <button onclick="window.location.reload()">Update</button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 10000);
  }
  
  trackInstallation() {
    // Track successful installation for analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', 'pwa_installed', {
        event_category: 'PWA',
        event_label: 'BlockZone Lab'
      });
    }
    
    // console.log('[PWA] Installation tracked');
  }
  
  trackInstallAttempt(accepted) {
    // Track install prompt interaction
    if (typeof gtag !== 'undefined') {
      gtag('event', 'pwa_install_prompt', {
        event_category: 'PWA',
        event_label: accepted ? 'accepted' : 'dismissed'
      });
    }
  }
  
  // Utility methods for games to use
  isInstalled() {
    return this.isInstalled || this.isStandalone;
  }
  
  canInstall() {
    return !!this.deferredPrompt && !this.isInstalled();
  }
  
  // Gaming-specific PWA features
  requestFullscreen() {
    if (this.isInstalled() && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    }
  }
  
  preventSleep() {
    // Request wake lock for gaming sessions (if supported)
    if ('wakeLock' in navigator) {
      navigator.wakeLock.request('screen').catch(err => {
        // console.log('[PWA] Wake lock failed:', err);
      });
    }
  }
}

// Initialize PWA installer when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.PWAInstaller = new PWAInstaller();
  });
} else {
  window.PWAInstaller = new PWAInstaller();
}

// Export for use by games
window.BlockZonePWA = {
  isInstalled: () => window.PWAInstaller?.isInstalled() || false,
  canInstall: () => window.PWAInstaller?.canInstall() || false,
  promptInstall: () => window.PWAInstaller?.promptInstall(),
  requestFullscreen: () => window.PWAInstaller?.requestFullscreen(),
  preventSleep: () => window.PWAInstaller?.preventSleep()
};
