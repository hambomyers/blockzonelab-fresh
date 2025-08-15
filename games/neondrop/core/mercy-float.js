/**
 * Mercy Curve FLOAT System
 * Elegant, deterministic, and fair special piece generation
 */
class MercyCurveFloat {
  constructor(dailySeed = Date.now()) {
    this.seed = dailySeed;
    this.pieceCount = 0;
    this.lastFloatAt = 0; // Start fresh - no previous FLOATs
    
    // Pre-compute 1000 decisions for performance
    this.sequence = new Uint8Array(1000);
    this.generateSequence();
  }
  
  generateSequence() {
    let rng = this.seed;
    
    for (let i = 0; i < 1000; i++) {
      // Simple PRNG (same as your current)
      rng = (rng * 1103515245 + 12345) & 0x7fffffff;
      
      // Estimate stack height (gets harder over time)
      const estimatedHeight = Math.floor(i / 40) + (rng % 3);
      
      // Mercy curve: 5% base, up to 20% at height 18+
      const mercyPercent = 5 + Math.min(estimatedHeight / 18, 1) * 15;
      
      // Minimum gap between FLOATs (prevents clustering)
      const gapPenalty = (i - this.lastFloatAt < 10) ? -10 : 0;
      
      // Roll the dice
      const roll = (rng % 100);
      const threshold = mercyPercent + gapPenalty;
      
      if (roll < threshold) {
        this.sequence[i] = 1;
        this.lastFloatAt = i;
      } else {
        this.sequence[i] = 0;
      }
    }
  }
  
  // Call this when generating next piece
  shouldBeFloat(stackHeight = 0) {
    const index = this.pieceCount++;
    const baseDecision = this.sequence[index % 1000];
    
    console.log(`🎮 FLOAT Check #${this.pieceCount}: height=${stackHeight}, baseDecision=${baseDecision}, lastFloat=${this.lastFloatAt}`);
    
    // Dynamic adjustment based on actual stack height
    if (stackHeight >= 16 && baseDecision === 0) {
      // Emergency mercy: 30% chance override at danger zone
      const emergency = this.quickRandom(index + stackHeight) < 0.3;
      const gapSinceLastFloat = this.pieceCount - this.lastFloatAt;
      console.log(`🚨 Emergency mercy check: height=${stackHeight}, emergency=${emergency}, gap=${gapSinceLastFloat}`);
      if (emergency && gapSinceLastFloat >= 5) {
        this.lastFloatAt = this.pieceCount;
        console.log(`✨ EMERGENCY FLOAT GRANTED! Piece #${this.pieceCount}`);
        return true;
      }
    }
    
    if (baseDecision === 1) {
      this.lastFloatAt = this.pieceCount;
      console.log(`✨ FLOAT PIECE GENERATED! Piece #${this.pieceCount} (mercy curve)`);
      return true;
    }
    
    console.log(`🔹 Normal piece #${this.pieceCount}`);
    return false;
  }
  
  // Fast deterministic random [0,1)
  quickRandom(n) {
    const x = Math.sin(this.seed + n) * 10000;
    return x - Math.floor(x);
  }
  
  // Get stats for UI display
  getStats() {
    const total = Math.min(this.pieceCount, 1000);
    const floats = this.sequence.slice(0, total).reduce((a, b) => a + b, 0);
    return {
      totalPieces: this.pieceCount,
      floatPieces: floats,
      floatPercent: ((floats / total) * 100).toFixed(1)
    };
  }
}

// Export for use
window.MercyCurveFloat = MercyCurveFloat;
