# Claude AI Prompt: NeonDrop Game Over Overlay Redesign

## Context
I have a minified JavaScript file for a NeonDrop game over overlay that needs visual/UX improvements while preserving ALL existing functionality, especially paywall integration and business logic.

## Current Working System
- The overlay is part of a professional Web3 Tetris-style game (BlockZone Lab NeonDrop)
- Contains critical paywall logic that prevents free unlimited gameplay
- Handles player identity, leaderboards, social auth, API calls, and challenge creation
- Currently works perfectly but has visual constraints that need improvement

## Required Changes (VISUAL ONLY - Preserve ALL Logic)

### 1. Viewport Sizing (Critical)
**Current:** `max-width: 400px !important; width: 90% !important; max-height: 85vh !important;`
**Target:** `max-width: calc(100vw - 60px) !important; width: calc(100vw - 60px) !important; max-height: calc(100vh - 60px) !important;`

### 2. Remove Scrollbars (Critical)
**Current:** `overflow-y: auto !important;`
**Target:** `overflow: hidden !important;`

### 3. Perfect Square Chiclets (Critical)
**Current:** NEON DROP chiclet blocks use `padding: 6px 6px` making them rectangular
**Target:** Use `width: 19px !important; height: 19px !important; padding: 0 !important; display: flex !important; align-items: center !important; justify-content: center !important;`

### 4. Animation Consistency (Important)
Ensure all chiclet animations match the existing leaderboard styling exactly (should already be good but verify)

## CRITICAL REQUIREMENTS (DO NOT MODIFY)

### ✅ MUST PRESERVE (Zero Changes Allowed)
1. **All paywall logic** - Any interceptGameStart, payment checks, or game start blocking
2. **All API calls** - Leaderboard submissions, player identity, backend communication
3. **All event handlers** - Button clicks, game restart, navigation
4. **All business logic** - Challenge creation, score submission, social sharing
5. **All class structure** - Method names, exports, imports compatibility
6. **All functionality** - Everything that currently works must continue working

### ⚠️ ONLY MODIFY (Safe Visual Changes)
1. **CSS styling within HTML template strings** - Only the inline styles
2. **Overlay container dimensions** - The viewport sizing changes above
3. **Chiclet block dimensions** - Making them perfectly square
4. **Overflow properties** - Removing scrollbars

## Technical Details

### File Structure
- File: `games/neondrop/game-over.js` (minified)
- Export: `GameOverSystem` class
- Integration: Imported by `games/neondrop/main.js`
- Critical method: `showWrapperInterface()` contains the overlay HTML/CSS

### Styling Location
The overlay styling is embedded as inline CSS within HTML template strings in the `showWrapperInterface` method. Look for:
- `<div class="game-over-card" style="...">` - Main overlay container
- `.chiclet` elements with inline styles - The NEON DROP letter blocks

### Testing Requirements
After modification, the overlay must:
1. ✅ Start game without paywall loops
2. ✅ Display properly on all screen sizes
3. ✅ Handle all button interactions correctly
4. ✅ Submit scores and show leaderboards
5. ✅ Maintain all existing animations and effects

## Expected Output
Please provide the modified JavaScript file with:
1. **Viewport-filling overlay** with 30px buffer margin on all sides
2. **No scrollbars** on the overlay content
3. **Perfectly square chiclet blocks** (19x19px) for NEON DROP letters
4. **All existing functionality preserved** - zero breaking changes
5. **Professional appearance** matching the leaderboard styling

## Validation Checklist
Before returning the code, please verify:
- [ ] All method signatures unchanged
- [ ] All event handlers preserved
- [ ] All API calls intact
- [ ] Only CSS styling modified
- [ ] Viewport sizing uses calc() formulas
- [ ] Chiclets are perfectly square
- [ ] No scrollbars on overlay
- [ ] All !important declarations preserved

## Additional Context
This is for a production Web3 gaming platform where any breaking changes could affect revenue and user experience. The paywall system is critical for business model protection. Visual improvements are important but must not compromise functionality.

---

**Instructions for Claude AI:**
Please analyze the provided minified JavaScript file and make ONLY the visual styling changes specified above while preserving 100% of the existing functionality. Focus on the HTML template strings within the `showWrapperInterface` method where the overlay CSS is defined.
