/**
 * NeonDrop Game Entry Point - Simple Fallback
 * Provides basic game functionality without complex module dependencies
 */

// Performance optimized - console.log removed

// Simple game initialization without complex imports
async function startGame() {
    // Performance optimized - console.log removed
    
    try {
        // Try to load the main game module
        const { startGame: mainStartGame } = await import('/games/neondrop/main.js?v=' + Date.now());
        return await mainStartGame();
    } catch (error) {
        console.error('❌ Failed to load main game module:', error);
        
        // Show error message with retry option
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100vh; color: white; text-align: center; font-family: Arial, sans-serif; background: #0a0a0a;">
                <div>
                    <h2 style="color: #00ff41; margin-bottom: 20px;">🎮 Game Loading Issue</h2>
                    <p>There was a problem loading the game modules.</p>
                    <p style="color: #888; font-size: 14px; margin: 20px 0;">Error: ${error.message}</p>
                    <div style="margin: 20px 0;">
                        <button onclick="location.reload()" style="
                            padding: 10px 20px; 
                            margin: 5px; 
                            background: #00ff41; 
                            color: black; 
                            border: none; 
                            border-radius: 5px; 
                            cursor: pointer;
                            font-weight: bold;
                        ">🔄 Retry</button>
                        <button onclick="window.location.href='/'" style="
                            padding: 10px 20px; 
                            margin: 5px; 
                            background: transparent; 
                            color: #00ff41; 
                            border: 1px solid #00ff41; 
                            border-radius: 5px; 
                            cursor: pointer;
                        ">🏠 Back to Home</button>
                    </div>
                </div>
            </div>
        `;
    }
}

// Export for module system
export { startGame };

// Also make available globally for compatibility
window.startGame = startGame; 
