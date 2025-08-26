/**
 * Elegant Mercy Curve FLOAT System
 * Dynamic mercy curve: 5% → 25% + piece unlock scaling
 * Deterministic daily sequence for fair financial gaming
 */
class MercyCurveFloat {
    constructor(dailyPackage, gameConfig) {
        this.date = dailyPackage.date;
        this.seed = dailyPackage.seed;
        this.pieceUnlocks = this.calculatePieceUnlocks(gameConfig);
        this.sequence = this.generateDailySequence();
        this.pieceCount = 0;
        this.totalFloatsGiven = 0;
        
        this.logDistribution();
    }
    
    // Calculate when new pieces unlock based on score progression
    calculatePieceUnlocks(config) {
        if (!config || !config.PIECES || !config.PIECES.UNLOCK_THRESHOLDS) {
            return [];
        }
        
        const unlocks = [];
        let pieceIndex = 0;
        
        for (const [pieceType, threshold] of Object.entries(config.PIECES.UNLOCK_THRESHOLDS)) {
            // Estimate piece count needed to reach score threshold
            const piecesNeeded = Math.ceil(threshold / 100); // Rough estimate
            unlocks.push({
                pieceType,
                pieceIndex: pieceIndex + piecesNeeded,
                score: threshold
            });
            pieceIndex += piecesNeeded;
        }
        return unlocks;
    }
    
    // Generate deterministic FLOAT sequence with dynamic gaps
    generateDailySequence() {
        const sequence = [];
        let rng = this.seed;
        let lastFloatIndex = -1;
        
        for (let i = 0; i < 1000; i++) {
            // Base height estimation
            const height = Math.floor(i / 50);
            
            // Adjust for piece unlocks (new pieces = harder = more FLOATs)
            const unlockedPieces = this.pieceUnlocks.filter(u => u.pieceIndex <= i).length;
            const difficultyBoost = Math.min(unlockedPieces * 0.5, 10); // +0.5% per new piece, max +10%
            
            // Target FLOAT rate: 5% → 25% + difficulty boost
            const targetRate = Math.min(5 + (height * 1.2) + difficultyBoost, 30);
            
            // Dynamic gap based on target rate
            const gap = Math.max(2, Math.floor(100 / targetRate));
            
            // Place FLOAT if conditions met
            if (i - lastFloatIndex >= gap && (rng % 100) < targetRate) {
                sequence.push(1);
                lastFloatIndex = i;
            } else {
                sequence.push(0);
            }
            
            rng = (rng * 1103515245 + 12345) & 0x7fffffff;
        }
        return sequence;
    }
    
    // Elegant mercy logic with deterministic RNG
    shouldBeFloat(stackHeight = 0) {
        const index = this.pieceCount++;
        
        // Base decision from daily sequence
        const baseDecision = this.sequence[index % 1000] === 1;
        
        // Simple mercy curve: 5% at height 0, 25% at height 20+
        const mercyPercent = Math.min(5 + (stackHeight * 1), 25);
        
        // Real-time mercy check with deterministic RNG
        const heightSeed = this.seed + index + stackHeight;
        const realTimeMercy = (this.quickRandom(heightSeed) * 100) < mercyPercent;
        
        const finalDecision = baseDecision || realTimeMercy;
        
        if (finalDecision) {
            this.totalFloatsGiven++;
            const reason = baseDecision ? 'sequence' : `mercy@${stackHeight}`;
            console.log(`✨ FLOAT #${this.totalFloatsGiven} at piece ${index + 1} (height: ${stackHeight}, ${mercyPercent.toFixed(1)}%, ${reason})`);
        } else {
            console.log(`🔹 Normal piece #${index + 1} (height: ${stackHeight}, mercy: ${mercyPercent.toFixed(1)}%)`);
        }
        
        return finalDecision;
    }
    
    // Fast deterministic random for real-time mercy checks
    quickRandom(seed) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }
    
    // Get distribution statistics
    getDistributionStats() {
        const first100 = this.sequence.slice(0, 100).reduce((a, b) => a + b, 0);
        const first500 = this.sequence.slice(0, 500).reduce((a, b) => a + b, 0);
        const total = this.sequence.reduce((a, b) => a + b, 0);
        
        return {
            totalFloats: total,
            first100: (first100 / 100 * 100).toFixed(1),
            first500: (first500 / 500 * 100).toFixed(1),
            total: (total / 1000 * 100).toFixed(1),
            avgRate: (total / 10).toFixed(1)
        };
    }
    
    // Get early FLOAT positions for engagement
    getEarlyFloats() {
        const earlyFloats = [];
        for (let i = 0; i < this.sequence.length && earlyFloats.length < 5; i++) {
            if (this.sequence[i] === 1) earlyFloats.push(i + 1);
        }
        return earlyFloats;
    }
    
    // Elegant, concise logging
    logDistribution() {
        const stats = this.getDistributionStats();
        const earlyFloats = this.getEarlyFloats();
        
        console.log(`🌙 FLOAT System: ${stats.totalFloats}/1000 pieces (${stats.avgRate}% avg)`);
        console.log(`📊 Distribution: ${stats.first100}% (100) → ${stats.first500}% (500) → ${stats.total}% (1000)`);
        console.log(`🎯 Early FLOATs: ${earlyFloats.join(', ')}`);
        
        // Ensure we have early FLOATs for engagement
        if (earlyFloats.length === 0) {
            console.log(`🎯 Adding strategic early FLOATs for player engagement`);
            this.sequence[4] = 1;  // Piece 5
            this.sequence[9] = 1;  // Piece 10  
            this.sequence[14] = 1; // Piece 15
        }
    }
    
    // Get current stats
    getStats() {
        return {
            date: this.date,
            totalPieces: this.pieceCount,
            totalFloats: this.totalFloatsGiven,
            floatPercent: this.pieceCount > 0 
                ? ((this.totalFloatsGiven / this.pieceCount) * 100).toFixed(1) 
                : '0.0'
        };
    }
    
    // Reset for new game (keeps same sequence)
    reset() {
        this.pieceCount = 0;
        this.totalFloatsGiven = 0;
        console.log(`🔄 Game reset - using same daily FLOAT sequence`);
    }
}

// Make available globally
window.MercyCurveFloat = MercyCurveFloat;
export { MercyCurveFloat };
export default MercyCurveFloat;
