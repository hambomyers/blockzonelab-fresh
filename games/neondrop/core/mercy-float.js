/**
 * Mercy Curve FLOAT System - Fixed Version
 * Proper mercy curve: 5% at low stacks → 25% at high stacks
 * No more broken percentage calculations
 */
class MercyCurveFloat {
  constructor(dailyPackage) {
    this.date = dailyPackage.date;
    this.seed = dailyPackage.seed;
    this.pieceCount = 0;
    this.totalFloatsGiven = 0;
    
    // FIXED: Generate proper daily sequence with realistic FLOAT counts
    this.sequence = this.generateRealisticFloatSequence();
    
    this.logDistribution();
  }
  
  // FIXED: Generate realistic FLOAT sequence (not 68,000+ FLOATs!)
  generateRealisticFloatSequence() {
    const sequence = [];
    let rng = this.seed;
    let lastFloatIndex = -8; // Minimum 8 piece gap
    
    // Generate 1000 pieces with realistic FLOAT distribution
    for (let i = 0; i < 1000; i++) {
      rng = (rng * 1103515245 + 12345) & 0x7fffffff;
      
      // Estimate stack height based on piece number
      const estimatedHeight = Math.floor(i / 50) + (rng % 3);
      
      // PROPER MERCY CURVE: 5% → 25% based on height
      let mercyPercent = 5; // Base 5%
      if (estimatedHeight >= 3) {
        // Progressive scaling: 8% at height 3, up to 25% at height 20+
        const heightFactor = Math.min((estimatedHeight - 3) / 17, 1);
        mercyPercent = 8 + (heightFactor * 17); // 8% to 25%
      }
      
      // Early game bonus: First 50 pieces get slight boost for engagement
      if (i < 50) {
        mercyPercent += 3; // +3% early game boost
      }
      
      // Enforce minimum gap between FLOATs
      const gapFromLast = i - lastFloatIndex;
      const roll = rng % 100;
      
      if (roll < mercyPercent && gapFromLast >= 8) {
        sequence.push(1);
        lastFloatIndex = i;
      } else {
        sequence.push(0);
      }
    }
    
    return sequence;
  }
  
  // FIXED: Proper mercy curve based on actual stack height
  shouldBeFloat(stackHeight = 0) {
    const index = this.pieceCount++;
    
    // Base decision from daily sequence
    const baseDecision = this.sequence[index % 1000] === 1;
    
    // PROPER MERCY CURVE: 5% → 25% based on actual stack height
    let mercyPercent = 5; // Base 5% at low stacks
    
    if (stackHeight >= 3) {
      // Progressive scaling: 8% at height 3, up to 25% at height 20+
      const heightFactor = Math.min((stackHeight - 3) / 17, 1);
      mercyPercent = 8 + (heightFactor * 17); // 8% to 25%
    }
    
    // ENHANCED: Maintain consistent FLOAT rate even at high speeds
    const currentFloatRate = this.totalFloatsGiven / Math.max(this.pieceCount, 1);
    const targetFloatRate = 0.12; // Target 12% FLOAT rate overall
    
    if (currentFloatRate < targetFloatRate && stackHeight >= 5) {
      // Boost mercy if falling behind target rate
      mercyPercent = Math.min(mercyPercent * 1.3, 30); // Cap at 30%
    }
    
    // Use daily seed for deterministic real-time rolls
    const heightSeed = this.seed + index + stackHeight;
    const heightRoll = this.quickRandom(heightSeed) * 100;
    
    // Check both base sequence AND real-time mercy
    const realTimeMercy = heightRoll < mercyPercent;
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
  
  // FIXED: Proper distribution logging with realistic numbers
  logDistribution() {
    if (!this.sequence || this.sequence.length === 0) {
      console.warn('⚠️ No FLOAT sequence found in daily package!');
      return;
    }
    
    const first100 = this.sequence.slice(0, 100).reduce((a, b) => a + b, 0);
    const first500 = this.sequence.slice(0, 500).reduce((a, b) => a + b, 0);
    const total = this.sequence.reduce((a, b) => a + b, 0);
    
    // FIXED: Show realistic percentages (should be 5-25%, not 36,000%!)
    console.log(`🌙 FLOAT system initialized for ${this.date}`);
    console.log(`📊 Today's FLOAT Distribution:
      Total FLOAT Pool: ${total}
      First 100 pieces: ${first100} FLOATs (${(first100/100*100).toFixed(1)}% of pieces)
      First 500 pieces: ${first500} FLOATs (${(first500/500*100).toFixed(1)}% of pieces)
      All 1000 pieces: ${total} FLOATs (${(total/1000*100).toFixed(1)}% of pieces)
      Expected Range: 5-25% based on stack height
    `);
    
    // Find first few FLOATs for early engagement
    const firstFloats = [];
    for (let i = 0; i < this.sequence.length && firstFloats.length < 5; i++) {
      if (this.sequence[i] === 1) firstFloats.push(i + 1);
    }
    
    // Ensure we have early FLOATs for player engagement
    if (firstFloats.length === 0) {
      console.log(`🎯 No early FLOATs found - adding strategic ones for player engagement`);
      // Add FLOATs at pieces 5, 10, 15 for early engagement
      this.sequence[4] = 1;  // Piece 5
      this.sequence[9] = 1;  // Piece 10  
      this.sequence[14] = 1; // Piece 15
      firstFloats.push(5, 10, 15);
    }
    
    console.log(`🎯 First 5 FLOATs at pieces:`, firstFloats);
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
