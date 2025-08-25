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
    
    // ENHANCED: Ensure we maintain FLOAT density even at high speeds
    // If we're falling behind on FLOAT distribution, increase mercy chance
    const currentFloatRate = this.totalFloatsGiven / Math.max(this.pieceCount, 1);
    const targetFloatRate = 0.15; // Target 15% FLOAT rate overall
    
    if (currentFloatRate < targetFloatRate && stackHeight >= 5) {
      // Boost mercy chance if we're below target FLOAT rate
      mercyPercent = Math.min(mercyPercent * 1.5, 35); // Cap at 35%
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
    
    // Keep important initialization logs outside DEBUG
    console.log(`🌙 FLOAT system initialized for ${this.date}`);
    console.log(`📊 Today's FLOAT Distribution:
      Total FLOAT Pool: ${total}
      First 100 pieces: ${first100} FLOATs (${(first100/100*100).toFixed(1)}% of pieces, ${total > 0 ? (first100/total*100).toFixed(1) : 0}% of total FLOATs)
      First 500 pieces: ${first500} FLOATs (${(first500/500*100).toFixed(1)}% of pieces, ${total > 0 ? (first500/total*100).toFixed(1) : 0}% of total FLOATs)
      All 1000 pieces: ${total} FLOATs (${(total/1000*100).toFixed(1)}% of pieces, 100% of total FLOATs)
    `);
    
    // Find first few FLOATs - ensure we have some early ones for engagement
    const firstFloats = [];
    for (let i = 0; i < this.sequence.length && firstFloats.length < 5; i++) {
      if (this.sequence[i] === 1) firstFloats.push(i + 1);
    }
    
    // If no early FLOATs found, add some strategic ones for player engagement
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
    
    // ENHANCED: Ensure early FLOATs for player engagement
    let earlyBonus = 0;
    if (i < 50) {
      // Boost early pieces (first 50) to ensure engagement
      earlyBonus = 15 - (i * 0.3); // 15% at start, decreasing to 0% at piece 50
    }
    
    // Enforce minimum gap
    const gapFromLast = i - lastFloatIndex;
    
    // Deterministic roll with early bonus
    const roll = rng % 100;
    const adjustedMercy = Math.min(mercyPercent + earlyBonus, 40); // Cap at 40%
    
    if (roll < adjustedMercy && gapFromLast >= 8) { // Reduced gap for better distribution
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
