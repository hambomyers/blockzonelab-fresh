/**
 * Elegant Mercy Curve FLOAT System
 * Pure mathematical beauty: 2% → 24% mercy based on stack height
 * 100% deterministic for fair financial gaming
 */
class MercyCurveFloat {
    constructor(dailyPackage, gameConfig) {
        this.date = dailyPackage.date;
        this.seed = dailyPackage.seed;
        this.pieceCount = 0;
        this.totalFloatsGiven = 0;
        
        this.logDistribution();
    }
    
    // Elegant mercy logic: 2% at row 1, evenly increasing to 24% at row 20
    shouldBeFloat(stackHeight = 0) {
        const index = this.pieceCount++;
        
        // Mercy rate: 2% at row 1, increasing by 1.2% per row up to 24% at row 20
        const mercyRate = Math.min(2 + (stackHeight * 1.2), 24);
        
        // Deterministic roll using daily seed + piece index + stack height
        const pieceSeed = this.seed + index + stackHeight;
        const mercyRoll = this.quickRandom(pieceSeed) * 100;
        
        const shouldBeFloat = mercyRoll < mercyRate;
        
        console.log(`🔍 DEBUG: piece=${index + 1}, height=${stackHeight}, mercy=${mercyRate.toFixed(1)}%, roll=${mercyRoll.toFixed(1)}, shouldFloat=${shouldBeFloat}`);
        
        if (shouldBeFloat) {
            this.totalFloatsGiven++;
            console.log(`✨ FLOAT #${this.totalFloatsGiven} at piece ${index + 1} (height: ${stackHeight}, ${mercyRate.toFixed(1)}%, mercy@${stackHeight})`);
        } else {
            console.log(`🔹 Normal piece #${index + 1} (height: ${stackHeight}, mercy: ${mercyRate.toFixed(1)}%)`);
        }
        
        return shouldBeFloat;
    }
    
    // Fast deterministic random for mercy checks
    quickRandom(seed) {
        let x = seed;
        x = (x << 13) ^ x;
        x = (x >> 17) ^ x;
        x = (x << 5) ^ x;
        return (x & 0x7fffffff) / 0x7fffffff;
    }
    
    // Elegant logging
    logDistribution() {
        console.log(`🌙 FLOAT System: Elegant 2% → 24% mercy curve`);
        console.log(`📊 Mercy by row: Row 1 (2%) → Row 20 (24%)`);
        console.log(`🎯 Deterministic: Same seed = same mercy for all players`);
    }
    
    // Reset for new game (same daily seed for fairness)
    reset() {
        this.pieceCount = 0;
        this.totalFloatsGiven = 0;
        console.log(`🔄 Game reset - using same daily seed for fairness`);
    }
}

// Make available globally
window.MercyCurveFloat = MercyCurveFloat;
export { MercyCurveFloat };
export default MercyCurveFloat;
