# Claude Prompt: Fix FLOAT System in Minified Game Engine

## Context
I have a NeonDrop Tetris-like game with a FLOAT mercy system that should spawn special FLOAT pieces at higher stack heights. The mercy system calculates percentages correctly (2% to 24% based on stack height) but never actually spawns FLOAT pieces.

## Problem
The game engine is minified and the FLOAT integration is broken. The mercy system logs show it's working:
- `🔹 Normal piece #72 (height: 20, mercy: 24.0%)` - even at 24% mercy, no FLOAT pieces spawn
- The engine has FLOAT generation code but it's not connecting properly

## Current Broken Code in game-engine.js (minified):
```javascript
}generatePiece(){
// Check for FLOAT piece generation first
if (this.floatSystem && this.floatSystem.shouldBeFloat) {
    const stackHeight = this.calculateStackHeight();
    if (this.floatSystem.shouldBeFloat(stackHeight)) {
        console.log(`🎯 ENGINE: Generating FLOAT piece at height ${stackHeight}`);
        return this.createPiece('FLOAT');
    }
}

// Normal piece generation
this.bagRandomizer.currentBag.length===0&&this.fillBag();
const t=this.bagRandomizer.currentBag.pop();
return this.createPiece(t)
}
```

## Issues Identified:
1. The engine calls `this.calculateStackHeight()` but this method doesn't exist in the minified engine
2. The FLOAT system is connected via `this.engine.floatSystem = this.floatSystem` in main.js
3. The mercy system (`MercyCurveFloat`) works correctly and has its own stack height calculation

## What I Need:
Rewrite the `generatePiece()` method to properly integrate with the FLOAT mercy system without relying on a missing `calculateStackHeight()` method. The FLOAT system should be called directly and handle its own stack height calculation.

## Key Requirements:
- Keep the minified style for the normal piece generation part
- The FLOAT system (`this.floatSystem`) has a `shouldBeFloat(stackHeight)` method that handles everything
- Stack height calculation exists in main.js as `calculateStackHeight()` method
- Must actually spawn FLOAT pieces when mercy conditions are met
- Preserve all existing functionality for normal pieces

## Expected Behavior:
- At low stack heights (0-5): 2-8% chance of FLOAT pieces
- At high stack heights (15-20): 20-24% chance of FLOAT pieces  
- Console should show `✨ FLOAT #X` messages when FLOAT pieces spawn
- FLOAT pieces should appear visually in the game

Please provide a corrected `generatePiece()` method that will actually spawn FLOAT pieces based on the mercy system calculations.
