/**
 * QuantumFloatGenerator - Quantum-inspired deterministic FLOAT piece probability system
 * 
 * Integrates seamlessly with NeonDrop's existing architecture:
 * - Uses daily seed for perfect determinism
 * - Enhances bag randomizer system
 * - Dynamic probability scaling based on stack height (7% → 23%)
 * - Quantum superposition mechanics for natural variation
 * 
 * Integration with existing NeonDrop systems:
 * - dailySeed: Uses NeonDrop's existing daily seed
 * - ProfessionalRNG: Works with existing RNG system
 * - FLOAT piece: Enhances existing white piece mechanics
 * - Stack height: Uses existing board state calculation
 */

export class QuantumFloatGenerator {
    constructor(dailySeed) {
        this.dailySeed = dailySeed;
        this.quantumStates = this.initializeQuantumStates(dailySeed);
        this.pieceCount = 0;
        
        // Debug logging for development
        console.log('🔬 QuantumFloatGenerator initialized with seed:', dailySeed);
        console.log('🌊 Quantum states generated:', this.quantumStates.length);
    }
    
    /**
     * Initialize 8 quantum states using the daily seed
     * Each state has amplitude, phase, and frequency for superposition calculations
     */
    initializeQuantumStates(seed) {
        const states = [];
        let currentSeed = seed;
        
        for (let i = 0; i < 8; i++) {
            // Use NeonDrop's existing hash pattern for consistency
            currentSeed = ((currentSeed << 5) - currentSeed) + (i * 7919);
            currentSeed = currentSeed & currentSeed;
            currentSeed = Math.abs(currentSeed);
            
            states.push({
                amplitude: Math.sin(currentSeed * 0.001),
                phase: (currentSeed % 360) * Math.PI / 180,
                frequency: 1 + (currentSeed % 10)
            });
        }
        
        return states;
    }
    
    /**
     * Calculate quantum-enhanced FLOAT probability based on stack height
     * 
     * @param {number} stackHeight - Current maximum stack height (0-20)
     * @returns {number} Probability between 0.07 (7%) and 0.23 (23%)
     */
    getFloatProbability(stackHeight) {
        // Quantum superposition based on stack height
        const measurementStrength = Math.min(stackHeight / 20, 1);
        
        let superposition = 0;
        let totalAmplitude = 0;
        
        // Calculate quantum superposition from all 8 states
        this.quantumStates.forEach((state, i) => {
            // Height resonance: quantum states respond to stack danger
            const heightResonance = Math.sin(
                stackHeight * state.frequency * 0.1 + state.phase
            );
            
            // Time evolution: quantum states evolve with piece count
            const timeEvolution = Math.cos(
                this.pieceCount * state.frequency * 0.01 + state.phase
            );
            
            // Combine height and time influences
            const contribution = state.amplitude * 
                (heightResonance * measurementStrength + 
                 timeEvolution * (1 - measurementStrength));
            
            superposition += contribution;
            totalAmplitude += Math.abs(state.amplitude);
        });
        
        // Normalize superposition
        const normalizedSuperposition = superposition / (totalAmplitude || 1);
        
        // NeonDrop's exact probability ranges (matching Claude's specification)
        const baseProbability = 0.07;  // 7% (matches CONSTANTS.PIECES.FLOAT_CHANCE)
        const mediumProbability = 0.12; // 12% at height 5
        const maxProbability = 0.23;    // 23% at height 15+
        
        // Smooth scaling based on height thresholds
        let targetProbability;
        if (stackHeight >= 15) {
            targetProbability = maxProbability;
        } else if (stackHeight >= 5) {
            const t = (stackHeight - 5) / 10;
            targetProbability = mediumProbability + t * (maxProbability - mediumProbability);
        } else {
            const t = stackHeight / 5;
            targetProbability = baseProbability + t * (mediumProbability - baseProbability);
        }
        
        // Add quantum variation (±2% natural fluctuation)
        const variation = normalizedSuperposition * 0.02;
        const finalProbability = targetProbability + variation;
        
        // Increment piece counter for quantum evolution
        this.pieceCount++;
        
        // Clamp to valid range
        return Math.max(baseProbability, Math.min(maxProbability, finalProbability));
    }
    
    /**
     * Determine if a FLOAT piece should be generated
     * Works with NeonDrop's existing ProfessionalRNG system
     * 
     * @param {ProfessionalRNG} rng - NeonDrop's existing RNG instance
     * @param {number} stackHeight - Current stack height
     * @returns {boolean} Whether to generate a FLOAT piece
     */
    shouldGenerateFloat(rng, stackHeight) {
        const probability = this.getFloatProbability(stackHeight);
        const roll = rng.random(); // Uses NeonDrop's ProfessionalRNG
        
        // Debug logging for development (can be removed in production)
        if (roll < probability) {
            console.log(`🎯 FLOAT generated! Height: ${stackHeight}, Probability: ${(probability * 100).toFixed(1)}%, Roll: ${roll.toFixed(3)}`);
        }
        
        return roll < probability;
    }
    
    /**
     * Get current FLOAT probability for UI display
     * 
     * @param {number} stackHeight - Current stack height
     * @returns {number} Current probability as percentage (7.0 to 23.0)
     */
    getCurrentFloatProbabilityPercent(stackHeight) {
        return this.getFloatProbability(stackHeight) * 100;
    }
    
    /**
     * Reset piece counter for new game
     */
    resetForNewGame() {
        this.pieceCount = 0;
        console.log('🔄 QuantumFloatGenerator reset for new game');
    }
    
    /**
     * Get quantum system state for debugging/analytics
     */
    getQuantumState() {
        return {
            dailySeed: this.dailySeed,
            pieceCount: this.pieceCount,
            quantumStates: this.quantumStates.length,
            currentAmplitude: this.quantumStates.reduce((sum, state) => sum + Math.abs(state.amplitude), 0)
        };
    }
}
