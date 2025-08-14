/**
 * QuantumPieceGenerator - Enhanced piece generation with quantum FLOAT probability
 * 
 * This module extends NeonDrop's existing bag randomizer system with quantum-enhanced
 * FLOAT piece generation. It maintains compatibility with the existing game engine
 * while adding dynamic probability scaling based on stack height.
 * 
 * Integration approach:
 * - Hooks into existing fillBag() method
 * - Uses existing ProfessionalRNG for determinism
 * - Maintains bag randomizer structure
 * - Adds quantum probability calculations
 */

import { CONSTANTS } from '../config.js';

export class QuantumPieceGenerator {
    constructor(gameEngine, quantumFloat) {
        this.gameEngine = gameEngine;
        this.quantumFloat = quantumFloat;
        
        // Store original methods for fallback
        this.originalFillBag = null;
        this.originalGeneratePiece = null;
        
        console.log('🎲 QuantumPieceGenerator initialized');
    }
    
    /**
     * Enhanced fillBag method with quantum FLOAT probability
     * Replaces the game engine's original fillBag method
     */
    quantumFillBag() {
        const engine = this.gameEngine;
        const state = engine.getState();
        
        // Calculate current stack height
        const stackHeight = this.getMaxStackHeight(state.board);
        
        // Get quantum-enhanced FLOAT probability
        const floatProbability = this.quantumFloat.getFloatProbability(stackHeight);
        
        // Get unlocked pieces (excluding FLOAT for separate handling)
        const unlockedPieces = state.unlockedPieces || CONSTANTS.PIECES.STARTING;
        const normalPieces = unlockedPieces.filter(p => p !== 'FLOAT');
        
        // Calculate bag composition
        const bagSize = unlockedPieces.length;
        const pieces = [];
        
        // Calculate how many FLOAT pieces for this bag based on quantum probability
        const expectedFloats = Math.floor(bagSize * floatProbability);
        const remainder = (bagSize * floatProbability) % 1;
        
        // Add deterministic chance for remainder using game engine's RNG
        const floatCount = expectedFloats + (engine.rng.random() < remainder ? 1 : 0);
        
        // Add FLOAT pieces based on quantum calculation
        for (let i = 0; i < floatCount; i++) {
            pieces.push('FLOAT');
        }
        
        // Fill remaining slots with normal pieces
        const remaining = bagSize - floatCount;
        for (let i = 0; i < remaining; i++) {
            const pieceIndex = Math.floor(engine.rng.random() * normalPieces.length);
            pieces.push(normalPieces[pieceIndex]);
        }
        
        // Shuffle the bag using game engine's RNG for determinism
        pieces.sort(() => engine.rng.random() - 0.5);
        
        // Update bag randomizer state
        if (engine.bagRandomizer) {
            engine.bagRandomizer.currentBag = pieces;
            engine.bagRandomizer.bagCount = (engine.bagRandomizer.bagCount || 0) + 1;
        }
        
        // Debug logging
        console.log(`🎯 Quantum bag generated: ${floatCount} FLOAT pieces (${(floatProbability * 100).toFixed(1)}% probability) at height ${stackHeight}`);
        
        return pieces;
    }
    
    /**
     * Calculate maximum stack height from board state
     * Compatible with NeonDrop's board structure
     */
    getMaxStackHeight(board) {
        if (!board || !Array.isArray(board)) return 0;
        
        for (let y = 0; y < board.length; y++) {
            for (let x = 0; x < board[y].length; x++) {
                if (board[y][x] !== null) {
                    return board.length - y;
                }
            }
        }
        return 0;
    }
    
    /**
     * Enhanced piece generation with quantum probability
     * This method can be called directly or used to override the game engine's generatePiece
     */
    generateQuantumPiece() {
        const engine = this.gameEngine;
        
        // Ensure bag is filled
        if (!engine.bagRandomizer?.currentBag?.length) {
            this.quantumFillBag();
        }
        
        // Get piece from bag
        const pieceType = engine.bagRandomizer.currentBag.pop();
        
        // Create piece using game engine's existing method
        if (engine.createPiece) {
            return engine.createPiece(pieceType);
        }
        
        // Fallback: create piece manually using CONSTANTS
        const definition = CONSTANTS.PIECES.DEFINITIONS[pieceType];
        if (!definition) {
            console.error('Unknown piece type:', pieceType);
            return null;
        }
        
        return {
            type: pieceType,
            shape: definition.shape,
            color: definition.color,
            spawn: definition.spawn,
            rotation: 0,
            upMovesUsed: 0
        };
    }
    
    /**
     * Install quantum enhancements into the game engine
     * This method hooks into the existing game engine methods
     */
    installQuantumEnhancements() {
        const engine = this.gameEngine;
        
        // Store original methods
        this.originalFillBag = engine.fillBag?.bind(engine);
        this.originalGeneratePiece = engine.generatePiece?.bind(engine);
        
        // Override fillBag method
        engine.fillBag = () => {
            return this.quantumFillBag();
        };
        
        // Override generatePiece method if it exists
        if (engine.generatePiece) {
            engine.generatePiece = () => {
                return this.generateQuantumPiece();
            };
        }
        
        console.log('🔬 Quantum enhancements installed in game engine');
    }
    
    /**
     * Remove quantum enhancements and restore original methods
     */
    uninstallQuantumEnhancements() {
        const engine = this.gameEngine;
        
        // Restore original methods
        if (this.originalFillBag) {
            engine.fillBag = this.originalFillBag;
        }
        
        if (this.originalGeneratePiece) {
            engine.generatePiece = this.originalGeneratePiece;
        }
        
        console.log('🔄 Quantum enhancements removed, original methods restored');
    }
    
    /**
     * Get current quantum statistics for debugging/UI
     */
    getQuantumStats() {
        const engine = this.gameEngine;
        const state = engine.getState();
        const stackHeight = this.getMaxStackHeight(state.board);
        const floatProbability = this.quantumFloat.getFloatProbability(stackHeight);
        
        return {
            stackHeight,
            floatProbability: floatProbability * 100, // As percentage
            quantumState: this.quantumFloat.getQuantumState(),
            bagCount: engine.bagRandomizer?.bagCount || 0,
            currentBagSize: engine.bagRandomizer?.currentBag?.length || 0
        };
    }
    
    /**
     * Reset quantum system for new game
     */
    resetForNewGame() {
        this.quantumFloat.resetForNewGame();
        console.log('🔄 QuantumPieceGenerator reset for new game');
    }
}
