// === THE MIDNIGHT PROPHECY SYSTEM ===
// "At the witching hour, destiny is rewritten"

class MidnightProphecy {
  constructor() {
    // 11:15 PM - The moment of cosmic reset
    this.PROPHECY_HOUR = 23;
    this.PROPHECY_MINUTE = 15;
    
    // Get or generate the midnight seed
    this.cosmicSeed = this.getMidnightSeed();
    
    // Generate the 8 quantum states from your whitepaper
    this.quantumStates = this.birthQuantumStates();
    
    // Track the prophecy
    this.prophecyLog = [];
    
    console.log(`🌙 Midnight Seed ${this.cosmicSeed} has awakened`);
  }

  getMidnightSeed() {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(23, 15, 0, 0); // 11:15 PM
    
    // If we're past 11:15 PM today, use today's seed
    // Otherwise use yesterday's (still in effect)
    if (now < midnight) {
      midnight.setDate(midnight.getDate() - 1);
    }
    
    const dateKey = `${midnight.getFullYear()}${midnight.getMonth()}${midnight.getDate()}`;
    
    // Check cache first (your existing optimization)
    const cached = sessionStorage.getItem(`midnight-seed-${dateKey}`);
    if (cached) {
      console.log('✨ Using cached Midnight Prophecy');
      return parseInt(cached);
    }
    
    // Generate new midnight seed - deterministic from date
    const seed = this.generateCosmicSeed(dateKey);
    sessionStorage.setItem(`midnight-seed-${dateKey}`, seed);
    
    return seed;
  }
  
  generateCosmicSeed(dateKey) {
    // Simple but deterministic - same date always = same seed
    let hash = 0;
    for (let i = 0; i < dateKey.length; i++) {
      hash = ((hash << 5) - hash) + dateKey.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
  
  birthQuantumStates() {
    // The 8-fold path from your whitepaper
    const states = [];
    let seed = this.cosmicSeed;
    
    for (let i = 0; i < 8; i++) {
      // Each state is deterministically derived from the midnight seed
      seed = (seed * 1103515245 + 12345) & 0x7fffffff; // LCG algorithm
      states.push({
        frequency: (seed % 100) / 100,
        amplitude: (seed % 1000) / 1000,
        phase: (seed % 360)
      });
    }
    
    return states;
  }
  
  // Calculate FLOAT probability based on stack height
  getQuantumFloatProbability(stackHeight) {
    // Base probability wave function
    let probability = 0.07; // 7% ground state
    
    // Each quantum state contributes to final probability
    this.quantumStates.forEach((state, index) => {
      const contribution = Math.sin(
        (stackHeight * state.frequency + state.phase) * Math.PI / 180
      ) * state.amplitude * 0.02;
      
      probability += contribution;
    });
    
    // Clamp between min and max as stack grows
    const heightFactor = Math.min(stackHeight / 20, 1); // Max at height 20
    probability = probability + (heightFactor * 0.16); // Up to +16% at danger
    
    // Never exceed 23% (from your data)
    probability = Math.min(probability, 0.23);
    
    console.log(`🎯 Quantum probability at height ${stackHeight}: ${(probability * 100).toFixed(1)}%`);
    
    return probability;
  }
  
  // Determine if next piece should be FLOAT
  collapseQuantumState(stackHeight, pieceIndex) {
    const probability = this.getQuantumFloatProbability(stackHeight);
    
    // Use deterministic "random" based on seed + piece index
    // This ensures same seed = same sequence of pieces
    const deterministicRandom = this.getPseudoRandom(pieceIndex);
    
    const isFloat = deterministicRandom < probability;
    
    // Log the prophecy
    if (isFloat) {
      this.prophecyLog.push({
        pieceIndex,
        stackHeight,
        probability,
        timestamp: Date.now()
      });
      
      console.log(`✨ FLOAT manifested at height ${stackHeight} (${(probability * 100).toFixed(1)}% chance)`);
    }
    
    return isFloat;
  }
  
  getPseudoRandom(index) {
    // Deterministic "random" using seed and index
    let x = Math.sin(this.cosmicSeed + index) * 10000;
    return x - Math.floor(x);
  }
  
  // Get time until next midnight reset
  getTimeUntilProphecy() {
    const now = new Date();
    const nextMidnight = new Date();
    nextMidnight.setHours(23, 15, 0, 0);
    
    if (now >= nextMidnight) {
      nextMidnight.setDate(nextMidnight.getDate() + 1);
    }
    
    const msUntil = nextMidnight - now;
    const hoursUntil = Math.floor(msUntil / (1000 * 60 * 60));
    const minutesUntil = Math.floor((msUntil % (1000 * 60 * 60)) / (1000 * 60));
    
    return { hours: hoursUntil, minutes: minutesUntil, ms: msUntil };
  }
  
  // Get prophecy statistics
  getProphecyStats() {
    return {
      cosmicSeed: this.cosmicSeed,
      quantumStates: this.quantumStates.length,
      floatsManifested: this.prophecyLog.length,
      timeUntilNext: this.getTimeUntilProphecy()
    };
  }
}

// Export for integration
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MidnightProphecy;
} else {
  window.MidnightProphecy = MidnightProphecy;
}
