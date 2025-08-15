/**
 * GameRouter.js - Game Routing and Navigation System
 * Handles game selection, navigation, and routing logic
 */

export class GameRouter {
    constructor() {
        this.availableGames = {
            'neondrop': {
                name: 'NeonDrop',
                description: 'Skill-based space shooter with real prizes',
                path: '/games/neondrop/',
                status: 'active'
            }
        };
    }

    /**
     * Get available games
     */
    getAvailableGames() {
        return this.availableGames;
    }

    /**
     * Check if a game is available
     */
    isGameAvailable(gameId) {
        return this.availableGames[gameId] && this.availableGames[gameId].status === 'active';
    }

    /**
     * Navigate to a specific game
     */
    navigateToGame(gameId) {
        if (!this.isGameAvailable(gameId)) {
            throw new Error(`Game ${gameId} is not available`);
        }
        
        const game = this.availableGames[gameId];
        window.location.href = game.path;
    }

    /**
     * Get game info
     */
    getGameInfo(gameId) {
        return this.availableGames[gameId] || null;
    }
}

// Export singleton instance
export const gameRouter = new GameRouter(); 
