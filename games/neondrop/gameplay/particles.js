/**
 * gameplay/particles.js - AAA Particle System
 *
 * SIMPLE FIX:
 * - 5x more gravity so they curve down faster
 * - 75% longer lifetime so they stay on screen
 * - Everything else EXACTLY the same
 */

import { CONSTANTS } from '../config.js';

export class ParticleSystem {
    constructor() {
        this.particles = [];
        this.maxParticles = CONSTANTS.PARTICLES.MAX_PARTICLES * 3; // Allow bursts
    }

    // ============ PUBLIC API ============

    /**
     * Create explosion effect when lines are cleared
     * @param {number[]} lines - Array of line indices that were cleared
     * @param {Array<Array>} board - Game board for color info
     */
    createLineExplosion(lines, board) {
        const lineCount = lines.length;
        const intensity = lineCount / 4; // 0.25, 0.5, 0.75, 1.0

        lines.forEach((lineY, lineIndex) => {
            for (let x = 0; x < CONSTANTS.BOARD.WIDTH; x++) {
                if (board[lineY][x]) {
                    const color = board[lineY][x];
                    const blockCenterX = x * CONSTANTS.BOARD.BLOCK_SIZE + CONSTANTS.BOARD.BLOCK_SIZE / 2;
                    const blockCenterY = lineY * CONSTANTS.BOARD.BLOCK_SIZE + CONSTANTS.BOARD.BLOCK_SIZE / 2;

                    // ORIGINAL: Particle count scales with intensity
                    const particleCount = Math.floor(20 * (1 + intensity * 2)); // 20, 30, 40, 60

                    for (let i = 0; i < particleCount; i++) {
                        const particle = this.createFireworkParticle(
                            blockCenterX,
                            blockCenterY,
                            color,
                            lineCount,
                            intensity,
                            x,
                            i / particleCount,
                            lineIndex / lineCount
                        );

                        this.particles.push(particle);
                    }

                    // LIGHT: Add just 1-2 bright white sparklers per block
                    const sparklerCount = Math.floor(1 + intensity); // 1, 1, 2, 2
                    for (let i = 0; i < sparklerCount; i++) {
                        const sparkler = this.createLightSparklerParticle(
                            blockCenterX,
                            blockCenterY,
                            lineCount,
                            intensity,
                            x,
                            i / sparklerCount,
                            lineIndex / lineCount
                        );
                        this.particles.push(sparkler);
                    }
                }
            }
        });

        // Limit particle count
        if (this.particles.length > this.maxParticles) {
            this.particles = this.particles.slice(-this.maxParticles);
        }
    }

    /**
     * Update all particles
     * @param {number} deltaTime - Time since last update in milliseconds
     */
    update(deltaTime) {
        const dt = deltaTime / 1000;

        this.particles = this.particles.filter(p => {
            // Update lifetime
            p.life -= dt;
            if (p.life <= 0) return false;

            // ENHANCED: Punch phase physics for firework particles
            let currentGravity = CONSTANTS.PARTICLES.GRAVITY * 5; // Normal gravity (5x)
            
            if (p.punchPhase && p.punchTimer > 0) {
                // Punch phase: 4x gravity to compensate for 2x velocity
                currentGravity = CONSTANTS.PARTICLES.GRAVITY * 5 * 4; // 20x gravity during punch
                p.punchTimer -= dt;
                
                if (p.punchTimer <= 0) {
                    p.punchPhase = false; // Exit punch phase
                }
            }

            // Physics update - parabolic motion
            p.x += p.vx * dt;
            p.y += p.vy * dt;

            // ENHANCED: Dynamic gravity based on particle phase
            p.vy += currentGravity * dt;

            // Calculate progress for effects
            const progress = 1 - (p.life / p.maxLife);

            // Rainbow color shift for tetris
            if (p.rainbow) {
                const hue = (p.rainbowOffset + progress * 180) % 360;
                p.color = `hsl(${hue}, 100%, ${70 - progress * 20}%)`;
            }

            // Each particle has its own fade curve
            p.opacity = Math.pow(1 - progress, p.fadeExponent);

            return true;
        });
    }

    /**
     * Get all active particles for rendering
     * @returns {Array} Array of particle objects
     */
    getParticles() {
        return this.particles;
    }

    /**
     * Clear all particles
     */
    clear() {
        this.particles = [];
    }

    /**
     * Get particle count for debugging
     */
    getCount() {
        return this.particles.length;
    }

    // ============ PRIVATE METHODS ============

    createFireworkParticle(x, y, color, lineCount, intensity, columnX, particleRatio, lineRatio) {
        // Start position with some spread
        const startX = x + (Math.random() - 0.5) * CONSTANTS.BOARD.BLOCK_SIZE * 0.5;
        const startY = y + (Math.random() - 0.5) * CONSTANTS.BOARD.BLOCK_SIZE * 0.5;

        // Calculate base height
        const availableHeight = CONSTANTS.BOARD.HEIGHT * CONSTANTS.BOARD.BLOCK_SIZE * 0.8;
        const baseHeight = availableHeight * (0.3 + intensity * 0.5);

        // ANGLE: Spread increases with line count - particles go UP and OUT
        const maxSpread = (Math.PI / 3) * (1 + intensity); // 60° to 120° total spread
        const angle = (Math.PI / 2) + (Math.random() - 0.5) * maxSpread;

        // HEIGHT: More variation with more lines
        const heightVariation = 0.7 + Math.random() * (0.6 * (1 + intensity));
        const maxHeight = baseHeight * heightVariation;

        // VELOCITY: Initial velocity to reach maxHeight - ENHANCED with punch
        const baseVelocity = Math.sqrt(2 * CONSTANTS.PARTICLES.GRAVITY * maxHeight);
        const velocity = baseVelocity * 2; // 2x initial velocity for punch

        // Much higher velocity multiplier to reach edges of viewport
        const velocityMultiplier = 1.5 + Math.random() * 2.5; // 1.5 to 4.0x

        // CHANGED: 75% LONGER LIFETIME
        const lifeVariation = 0.7 + Math.random() * (0.6 * (1 + intensity));
        const lifetime = (2 + intensity * 4) * lifeVariation * 1.75; // 75% longer life

        // SIZE: More variation with more lines - ENHANCED for visibility
        const sizeVariation = 0.8 + Math.random() * (0.4 * (1 + intensity));
        const size = (2 + intensity * 6) * sizeVariation * 1.2; // 20% larger for punch

        // Create particle
        const particle = {
            // Position
            startX: startX,
            startY: startY,
            x: startX,
            y: startY,

            // Velocity components - UP and OUT with more force
            vx: Math.cos(angle) * velocity * velocityMultiplier,
            vy: -Math.sin(angle) * velocity * velocityMultiplier, // Negative for upward

            // Visual properties - ENHANCED colors
            color: this.enhanceColor(color, intensity),
            size: size,
            type: Math.random() > (1 - intensity * 0.5) ? 'glow' : 'spark',

            // Lifetime
            maxLife: lifetime,
            life: lifetime,

            // Unique fade rate
            fadeExponent: 1.5 + Math.random() * (2 * (1 + intensity)),

            // Special effects
            rainbow: lineCount === 4 && Math.random() > 0.3,
            rainbowOffset: columnX * 36 + lineRatio * 60,

            // ENHANCED: Punch phase tracking
            punchPhase: true,
            punchTimer: 0.05 // 0.05 seconds of punch phase
        };

        // Color variations for multi-line clears - ENHANCED
        if (lineCount >= 2 && Math.random() > 0.7) {
            const hue = Math.random() * 360;
            particle.color = `hsl(${hue}, 95%, 65%)`; // More saturated
        }

        if (lineCount >= 3 && Math.random() > 0.6) {
            particle.color = Math.random() > 0.5 ? '#FFD700' : '#C0C0C0';
        }

        return particle;
    }

    // LIGHT: Create simple bright white sparkler particles (CPU-friendly)
    createLightSparklerParticle(x, y, lineCount, intensity, columnX, particleRatio, lineRatio) {
        // Start position with small spread
        const startX = x + (Math.random() - 0.5) * CONSTANTS.BOARD.BLOCK_SIZE * 0.3;
        const startY = y + (Math.random() - 0.5) * CONSTANTS.BOARD.BLOCK_SIZE * 0.3;

        // Simple physics - go up and out
        const angle = (Math.PI / 2) + (Math.random() - 0.5) * (Math.PI / 3); // 60° spread
        const velocity = 200 + Math.random() * 300; // Simple velocity
        const velocityMultiplier = 1.5 + Math.random() * 1.5; // 1.5 to 3.0x

        // Short lifetime
        const lifetime = 1.5 + Math.random() * 1.0;

        // Small size
        const size = 2 + Math.random() * 3;

        // Create simple sparkler particle
        const sparkler = {
            // Position
            startX: startX,
            startY: startY,
            x: startX,
            y: startY,

            // Velocity components
            vx: Math.cos(angle) * velocity * velocityMultiplier,
            vy: -Math.sin(angle) * velocity * velocityMultiplier,

            // Visual properties - Bright white
            color: '#FFFFFF',
            size: size,
            type: 'lightSparkler',

            // Lifetime
            maxLife: lifetime,
            life: lifetime,

            // Simple fade
            fadeExponent: 1.5 + Math.random() * 1.0
        };

        return sparkler;
    }

    // ENHANCED: Color enhancement method
    enhanceColor(color, intensity) {
        // If it's already an HSL color, enhance saturation
        if (color.startsWith('hsl')) {
            return color.replace(/,\s*(\d+)%/, (match, sat) => {
                const newSat = Math.min(100, parseInt(sat) + 20); // +20% saturation
                return `, ${newSat}%`;
            });
        }
        
        // For hex colors, return as-is (they're already vibrant)
        return color;
    }
}

