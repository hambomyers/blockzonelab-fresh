/**
 * Mercy Curve FLOAT System - Daily Seed Version
 * Reads predetermined FLOAT sequence from daily seed
 * Ensures fairness, reproducibility, and true "Midnight Prophecy" behavior
 */
class MercyCurveFloat {
  constructor(dailyPackage) {
    this.date = dailyPackage.date;
    this.seed = dailyPackage.seed;
    this.sequence = dailyPackage.floatSequence || [];
    this.pieceCount = 0;
    this.totalFloatsGiven = 0;
    
    console.log(`🌙 FLOAT system initialized for ${this.date}`);
    this.logDistribution();
  }
  
  // Hybrid system: Base sequence + Real-time stack height mercy
  shouldBeFloat(stackHeight = 0) {
    const index = this.pieceCount++;
    const baseDecision = this.sequence[index % 1000] === 1;
    
    // Calculate real-time mercy percentage based on actual stack height
    let mercyPercent = 5; // Base 5%
    if (stackHeight >= 3) {
      // Progressive scaling: 8% at height 3, up to 25% at height 20
      const heightFactor = Math.min((stackHeight - 3) / 17, 1); // 0 to 1 scale
      mercyPercent = 8 + (heightFactor * 17); // 8% to 25%
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
  
  // Debug helper
  logDistribution() {
    if (!this.sequence || this.sequence.length === 0) {
      console.warn('⚠️ No FLOAT sequence found in daily package!');
      return;
    }
    
    const first100 = this.sequence.slice(0, 100).reduce((a, b) => a + b, 0);
    const first500 = this.sequence.slice(0, 500).reduce((a, b) => a + b, 0);
    const total = this.sequence.reduce((a, b) => a + b, 0);
    
    console.log(`📊 Today's FLOAT Distribution:
      First 100 pieces: ${first100} FLOATs (${first100}%)
      First 500 pieces: ${first500} FLOATs (${(first500/5).toFixed(1)}%)
      All 1000 pieces: ${total} FLOATs (${(total/10).toFixed(1)}%)
    `);
    
    // Find first few FLOATs
    const firstFloats = [];
    for (let i = 0; i < this.sequence.length && firstFloats.length < 5; i++) {
      if (this.sequence[i] === 1) firstFloats.push(i + 1);
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

// Generate deterministic FLOAT sequence from daily seed
function generateDailyFloatSequence(dailySeed) {
  const sequence = [];
  let rng = dailySeed;
  let lastFloatIndex = -10;
  
  // Generate 1000 predetermined FLOAT decisions
  for (let i = 0; i < 1000; i++) {
    rng = (rng * 1103515245 + 12345) & 0x7fffffff;
    
    // Estimate difficulty progression
    const estimatedHeight = Math.floor(i / 40) + (rng % 3);
    
    // Mercy curve: 5% base → 20% at height 18+
    const mercyPercent = 5 + Math.min(estimatedHeight / 18, 1) * 15;
    
    // Enforce minimum gap
    const gapFromLast = i - lastFloatIndex;
    
    // Deterministic roll
    const roll = rng % 100;
    
    if (roll < mercyPercent && gapFromLast >= 10) {
      sequence.push(1);
      lastFloatIndex = i;
    } else {
      sequence.push(0);
    }
  }
  
  // Log distribution for debugging
  const totalFloats = sequence.reduce((a, b) => a + b, 0);
  console.log(`📊 Daily FLOAT distribution: ${totalFloats}/1000 (${(totalFloats/10).toFixed(1)}%)`);
  
  return sequence;
}

// Make available globally
window.MercyCurveFloat = MercyCurveFloat;
window.generateDailyFloatSequence = generateDailyFloatSequence;
export { MercyCurveFloat, generateDailyFloatSequence };
export default MercyCurveFloat;
