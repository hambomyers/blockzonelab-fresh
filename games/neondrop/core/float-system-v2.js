/**
 * NeonDrop v2 - Clean FLOAT System
 * 
 * Elegant mercy curve system with zero wrapper complexity
 * Target: 50 lines, direct integration
 */

export class FloatSystemV2 {
    constructor(dailySeed, config) {
        this.seed = dailySeed;
        this.config = config;
        this.pieceCount = 0;
        this.floatPiecesSpawned = 0;
        
        console.log(`🌙 FLOAT System v2: Clean 2% → 24% mercy curve (seed: ${dailySeed})`);
    }

    // Clean mercy logic - no wrappers, no context issues
    shouldSpawnFloat(stackHeight = 0) {
        const pieceIndex = this.pieceCount++;
        
        // Elegant mercy curve: 2% at height 0, up to 24% at height 20+
        const mercyRate = Math.min(2 + (stackHeight * 1.1), 24);
        
        // Deterministic roll using daily seed + piece count + stack height
        const rollSeed = this.seed + pieceIndex + stackHeight;
        const mercyRoll = this.deterministicRandom(rollSeed) * 100;
        
        const shouldSpawn = mercyRoll < mercyRate;
        
        if (shouldSpawn) {
            this.floatPiecesSpawned++;
            console.log(`✨ FLOAT #${this.floatPiecesSpawned} spawned (piece ${pieceIndex + 1}, height: ${stackHeight}, mercy: ${mercyRate.toFixed(1)}%)`);
        }
        
        return shouldSpawn;
    }

    // Fast deterministic random for consistent mercy across players
    deterministicRandom(seed) {
        let x = seed;
        x = (x << 13) ^ x;
        x = (x >> 17) ^ x;
        x = (x << 5) ^ x;
        return (x & 0x7fffffff) / 0x7fffffff;
    }

    // Reset for new game (keep same daily seed for fairness)
    reset() {
        this.pieceCount = 0;
        this.floatPiecesSpawned = 0;
        console.log('🔄 FLOAT system reset - same daily seed maintained');
    }

    // Get statistics for UI display
    getStats() {
        return {
            totalPieces: this.pieceCount,
            floatPieces: this.floatPiecesSpawned,
            floatPercentage: this.pieceCount > 0 ? (this.floatPiecesSpawned / this.pieceCount * 100).toFixed(1) : 0
        };
    }
}
