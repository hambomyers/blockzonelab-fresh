/**
 * NeonDrop Game Over Overlay - Clean Professional Frame Implementation
 * Uses reusable ProfessionalFrame and NeonDropHeader components
 */

import { ProfessionalFrame } from '../../shared/components/ProfessionalFrame.js';

class GameOverOverlay {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.isVisible = false;
        this.currentScore = 0;
        this.overlayElement = null;
        this.professionalFrame = null;
    }

    /**
     * Create overlay container for the professional frame
     */
    createOverlayContainer() {
        const overlay = document.createElement('div');
        overlay.id = 'game-over-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 9999999;
            animation: fadeIn 0.8s ease-out;
        `;
        
        // Add fade in animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                0% { opacity: 0; }
                100% { opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        return overlay;
    }

    /**
     * Create game over content for the professional frame
     */
    createGameOverContent(score, playerName) {
        return `
            <div class="frame-section">
                <div style="text-align: center; margin-bottom: 2rem;">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">🏆</div>
                    <h2 style="color: #FFD700; margin-bottom: 0.5rem; font-size: 2rem;">Game Over!</h2>
                    <div style="font-size: 3rem; font-weight: bold; color: #ffffff; margin-bottom: 1rem;">${score.toLocaleString()}</div>
                    <p style="color: #a0a0a0; font-size: 1.2rem;">Well played, ${playerName}!</p>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin: 2rem 0;">
                    <div style="background: rgba(255, 255, 255, 0.05); padding: 1rem; border-radius: 8px; text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #667eea;">${Math.floor(score / 100)}</div>
                        <p style="font-size: 0.9rem; color: #a0a0a0;">Lines Cleared</p>
                    </div>
                    <div style="background: rgba(255, 255, 255, 0.05); padding: 1rem; border-radius: 8px; text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #8A2BE2;">Level ${Math.floor(score / 1000) + 1}</div>
                        <p style="font-size: 0.9rem; color: #a0a0a0;">Max Level</p>
                    </div>
                    <div style="background: rgba(255, 255, 255, 0.05); padding: 1rem; border-radius: 8px; text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #FFD700;">+${Math.floor(score / 100)}</div>
                        <p style="font-size: 0.9rem; color: #a0a0a0;">Quark Earned</p>
                    </div>
                </div>

                ${score > 10000 ? `
                <div style="background: rgba(255, 215, 0, 0.1); padding: 1.5rem; border-radius: 8px; margin: 2rem 0; text-align: center;">
                    <h3 style="color: #FFD700; margin-bottom: 1rem;">🎯 Impressive Score!</h3>
                    <p style="margin-bottom: 1.5rem;">Your skills are tournament-ready! Join the daily competition for real prizes.</p>
                    <button id="tournamentBtn" class="frame-button primary">💰 Enter Tournament ($0.25)</button>
                </div>
                ` : ''}

                <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 2rem; flex-wrap: wrap;">
                    <button id="playAgainBtn" class="frame-button primary">🎮 Play Again</button>
                    <button id="viewProfileBtn" class="frame-button secondary">📊 View Stats</button>
                    <button id="homeBtn" class="frame-button">🏠 Home</button>
                </div>
            </div>
        `;
    }

    /**
     * Show the overlay with given score and player info using Professional Frame
     */
    show(score, playerName = 'Player') {
        if (this.isVisible) return;
        
        this.isVisible = true;
        this.currentScore = score;

        // Remove any existing overlay
        const existing = document.getElementById('game-over-overlay');
        if (existing) existing.remove();

        // Create overlay container
        const overlay = this.createOverlayContainer();
        document.body.appendChild(overlay);
        this.overlayElement = overlay;

        // Create professional frame inside overlay
        this.professionalFrame = new ProfessionalFrame(overlay, {
            headerSubtitle: score > 10000 ? 'Exceptional Performance!' : 'Game Complete',
            padding: 'normal',
            maxWidth: '800px'
        });

        // Set game over content
        const content = this.createGameOverContent(score, playerName);
        this.professionalFrame.setContent(content);
        
        // Setup event listeners
        this.setupEventListeners();
    }

    /**
     * Setup button event listeners
     */
    setupEventListeners() {
        if (!this.overlayElement) return;

        // Play Again button
        const playAgainBtn = this.overlayElement.querySelector('#playAgainBtn');
        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', () => {
                this.hide();
                this.eventBus.emit('startGame');
            });
        }

        // Home button
        const homeBtn = this.overlayElement.querySelector('#homeBtn');
        if (homeBtn) {
            homeBtn.addEventListener('click', () => {
                this.hide();
                window.location.href = '/';
            });
        }

        // Tournament button (for high scores)
        const tournamentBtn = this.overlayElement.querySelector('#tournamentBtn');
        if (tournamentBtn) {
            tournamentBtn.addEventListener('click', () => {
                this.createChallenge(this.currentScore, 0.25);
            });
        }

        // View Profile/Stats button
        const viewProfileBtn = this.overlayElement.querySelector('#viewProfileBtn');
        if (viewProfileBtn) {
            viewProfileBtn.addEventListener('click', () => {
                this.showStyledLeaderboard();
            });
        }
    }

    /**
     * Hide the overlay
     */
    hide() {
        if (!this.isVisible) return;
        
        this.isVisible = false;
        
        // Clean up professional frame
        if (this.professionalFrame) {
            this.professionalFrame.destroy();
            this.professionalFrame = null;
        }
        
        if (this.overlayElement) {
            this.overlayElement.remove();
            this.overlayElement = null;
        }
    }

    /**
     * Start background API calls - called by game engine when piece locks
     * This method is required for compatibility with the game engine
     */
    startBackgroundAPICalls(score, playerName = null, playerId = null) {
        console.log(`🚀 Starting background API calls for score: ${score}`);
        // This method is called by the game engine when pieces lock
        // We can use this to prepare for game over or update leaderboards
        // For now, just log the call - the actual game over will be triggered separately
        return Promise.resolve({ score, playerName, playerId });
    }

    /**
     * Placeholder methods for existing functionality
     */
    createChallenge(score, amount) {
        console.log(`Creating $${amount} challenge with score ${score}`);
        // Implement challenge creation logic
    }

    showStyledLeaderboard() {
        console.log('Showing leaderboard');
        // Implement leaderboard display logic
    }
}

// Create alias for backward compatibility
const GameOverSystem = GameOverOverlay;

// Export for use in existing system
export { GameOverOverlay, GameOverSystem };
