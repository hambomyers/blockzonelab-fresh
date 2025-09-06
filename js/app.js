/**
 * Main application initialization
 */

import { IdentityManager } from '../shared/core/IdentityManager.js';
import { PaywallManager } from '../shared/components/PaywallManager.js';

// Initialize the application
async function initApp() {
    try {
        // Initialize Identity Manager
        const identityManager = new IdentityManager();
        await identityManager.initialize();
        
        // Initialize Paywall Manager with Identity Manager
        const paywallManager = new PaywallManager();
        await paywallManager.initialize(identityManager);
        
        // Make available globally for debugging
        window.identityManager = identityManager;
        window.paywallManager = paywallManager;
        
        console.log('🚀 Application initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize application:', error);
    }
}

// Start the application when the DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
