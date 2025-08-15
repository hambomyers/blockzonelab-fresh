/**
 * core/game-engine.js - Premature game over and audio spam issues resolved
 * 
 * Key Fixes:
 * 1. Fixed overly aggressive game over detection in lockPiece()
 * 2. Fixed audio spam during gravity/falling
 * 3. Improved collision detection to prevent false positives
 * 4. Better spawn zone checking
 * 5. Fixed death zone detection logic
 */

import * as Physics from './physics-pure.js';
import { ParticleSystem } from '../gameplay/particles.js';
import { CONSTANTS, calculateGravityDelay } from '../config.js';
import { ScoringSystem } from '../gameplay/scoring.js';

// Fallback GAME_CONFIG if import fails
const GAME_CONFIG = {
  DROP_SPEEDS: {
    NORMAL: 1000,
    FAST: 50,
    LOCK_DELAY: 750,
    LOCK_DELAY_FLOAT: 900,
    LOCK_DELAY_DANGER: 1500,
    MAX_LOCK_TIME: 5000,
    CLEAR_ANIMATION_TIME: 200,
    SPAWN_FADE_TIME: 400
  },
  AUDIO: {
    COOLDOWNS: {
      LAND: 50,
      ROTATE: 100,
      CLEAR: 200
    }
  },
  TRANSITIONS: {
    GAME_OVER_LOCKOUT: 3000,
    MENU_TRANSITION: 500,
    COUNTDOWN_DURATION: 3000
  }
};

/**
* Game states enum
*/
const GameState = {
   MENU: 'MENU',
   MENU_TO_COUNTDOWN: 'MENU_TO_COUNTDOWN',
   COUNTDOWN: 'COUNTDOWN',
   COUNTDOWN_TO_PLAYING: 'COUNTDOWN_TO_PLAYING',
   PLAYING: 'PLAYING',
   PLAYING_TO_PAUSE: 'PLAYING_TO_PAUSE',
   PAUSED: 'PAUSED',
   PAUSE_TO_PLAYING: 'PAUSE_TO_PLAYING',
   CLEARING: 'CLEARING',
   GAME_OVER_SEQUENCE: 'GAME_OVER_SEQUENCE',
   GAME_OVER: 'GAME_OVER',
   GAME_OVER_TO_MENU: 'GAME_OVER_TO_MENU'
};

export class GameEngine {
   constructor(config, audioSystem = null, blockchain = null, eventBus = null) {
       this.config = config;
       this.audio = audioSystem;
       this.blockchain = blockchain;
       this.eventBus = eventBus; // Add EventBus support

       // Core systems
       this.particleSystem = new ParticleSystem();
       this.rng = new ProfessionalRNG(this.getDailySeed());
       this.scoring = new ScoringSystem(config);

       // State management
       this.state = this.createInitialState();
       this.frameNumber = 0;

       // Input buffering
       this.inputBuffer = {
           action: null,
           timestamp: 0,
           bufferWindow: 100
       };

       // Transition system
       this.transitions = {
           active: false,
           type: null,
           startTime: 0,
           duration: 0,
           data: {}
       };

       this.timeDilation = 1.0;

       // Deterministic replay system
       this.inputLog = [];
       this.gameLog = {
           seed: this.rng.seed,
           startTime: Date.now(),
           inputs: [],
           stateSnapshots: [],
           finalScore: 0,
           finalState: null,
           frameStates: [],
           stateChanges: []
       };

       // 7-Bag Randomizer
       this.bagRandomizer = {
           currentBag: [],
           nextBag: [],
           bagHistory: [],
           bagCount: 0
       };

       this.previousGameState = null;

       // Game over state tracking
       this.gameOverTriggered = false;
       this.gameOverUITriggered = false;
       this.gameOverComplete = false;
       this.gameOverEventDispatched = false; // CRITICAL: Prevent multiple event dispatches
       
       // Game over lockout system
       this.gameOverLockout = {
           active: false,
           startTime: 0,
           duration: GAME_CONFIG.TRANSITIONS.GAME_OVER_LOCKOUT,
           canStartNewGame: false
       };

       
       this.audioState = {
           lastLandSound: 0,
           lastRotateSound: 0,
           lastClearSound: 0,
           landCooldown: GAME_CONFIG.AUDIO.COOLDOWNS.LAND,
           rotateCooldown: GAME_CONFIG.AUDIO.COOLDOWNS.ROTATE,
           clearCooldown: GAME_CONFIG.AUDIO.COOLDOWNS.CLEAR
       };

       
       this.debugState = {
           lastGameOverReason: '',
           boardStateAtGameOver: null,
           pieceStateAtGameOver: null,
           frameAtGameOver: 0
       };
   }

   createInitialState() {
       return {
           gameState: GameState.MENU,
           board: Array(CONSTANTS.BOARD.HEIGHT).fill().map(() =>
               Array(CONSTANTS.BOARD.WIDTH).fill(null)
           ),

           isLocking: false,

           currentPiece: null,
           currentPosition: { x: 0, y: 0 },

           shadowPosition: { x: 0, y: 0 },
           shadowValid: false,
           lastShadowKey: '',
           shadowY: 0,

           nextPiece: null,
           heldPiece: null,
           canHold: true,

           score: 0,
           lines: 0,
           level: 1,
           combo: 0,

           lockTimer: 0,
           clearTimer: 0,
           countdownTimer: 0,
           gravitySpeed: GAME_CONFIG.DROP_SPEEDS.NORMAL,
           gravityAccumulator: 0,

           clearingLines: [],
           startTime: null,

           unlockedPieces: [...CONSTANTS.PIECES.STARTING],
           lastUnlockScore: 0,
           statistics: {
               piecesPlaced: 0,
               maxCombo: 0,
               floatUsed: 0,
               linesCleared: 0,
               tetrises: 0,
               playTime: 0
           },

           transitionTimer: 0,
           gameOverSequencePhase: 0,
           gameOverStartTime: null,
           
           deathPiece: null, // Will be set at game over by the engine

           gameMode: 'practice',
           pendingRewards: false
       };
   }

   update(deltaTime) {
       this.frameNumber++;

       if (this.frameNumber % 300 === 0) { 
           this.logFrameState();
       }
       
       const dilatedTime = deltaTime * this.timeDilation;

       switch (this.state.gameState) {
           case GameState.MENU:
               break;
           case GameState.MENU_TO_COUNTDOWN:
               this.updateMenuTransition(dilatedTime);
               break;
           case GameState.COUNTDOWN:
               this.updateCountdown(dilatedTime);
               break;
           case GameState.COUNTDOWN_TO_PLAYING:
               this.updateCountdownTransition(dilatedTime);
               break;
           case GameState.PLAYING:
               if (!this.gameOverTriggered && !this.gameOverComplete) {
                   this.updatePlaying(dilatedTime);
               }
               break;
           case GameState.PLAYING_TO_PAUSE:
               this.updatePauseTransition(dilatedTime);
               break;
           case GameState.PAUSED:
               break;
           case GameState.PAUSE_TO_PLAYING:
               this.updateUnpauseTransition(dilatedTime);
               break;
           case GameState.CLEARING:
               if (!this.gameOverTriggered && !this.gameOverComplete) {
                   this.updateClearing(dilatedTime);
               }
               break;
           case GameState.GAME_OVER_SEQUENCE:
               
               break;
           case GameState.GAME_OVER:
               break;
           case GameState.GAME_OVER_TO_MENU:
               this.updateReturnToMenuTransition(dilatedTime);
               break;
       }

       if (this.previousGameState !== this.state.gameState && 
           (this.state.gameState === GameState.GAME_OVER_SEQUENCE || 
            this.state.gameState === GameState.PLAYING ||
            this.state.gameState === GameState.MENU)) {
           this.logStateChange(this.previousGameState, this.state.gameState);
           this.previousGameState = this.state.gameState;
       }
       this.particleSystem.update(dilatedTime);
   }

   /**
    *
    */
   updatePlaying(deltaTime) {
       if (this.gameOverTriggered || this.gameOverComplete) {
           return;
       }

       // Update spawn fade effect
       if (this.state.isSpawning) {
           this.state.spawnTimer += deltaTime;
           if (this.state.spawnTimer >= CONSTANTS.TIMING.SPAWN_FADE_TIME) {
               this.state.isSpawning = false;
               this.state.spawnTimer = 0;
           }
       }

       // Update gravity
       this.state.gravitySpeed = calculateGravityDelay(
           this.state.startTime,
           this.state.score,
           this.state.level
       );

       // Update shadow position
       this.updateShadow();

       const isAtShadow = this.state.currentPosition.y >= this.state.shadowPosition.y;

       if (this.state.currentPosition.y < this.state.shadowPosition.y) {
           this.state.gravityAccumulator += deltaTime;

           if (this.state.gravityAccumulator >= this.state.gravitySpeed) {
               this.state.gravityAccumulator -= this.state.gravitySpeed;

               const moved = this.movePiece(0, 1);
               if (!moved) {
                   this.state.gravityAccumulator = 0;
               }
           }
       } else if (!this.state.isLocking && isAtShadow) {
           this.startLocking();
       }

       // Update lock timer if locking
       if (this.state.lockTimer > 0) {
           this.updateLocking(deltaTime);
       }
   }

   /**
    *
    */
   canPieceSpawnOnBoard(pieceType, board) {
       const def = CONSTANTS.PIECES.DEFINITIONS[pieceType];
       if (!def) {
           
           return false;
       }

       const spawnPos = def.spawn;
       const pieceShape = def.shape;

       // Check each block of the piece
       for (let dy = 0; dy < pieceShape.length; dy++) {
           for (let dx = 0; dx < pieceShape[0].length; dx++) {
               if (pieceShape[dy][dx]) {
                   const boardX = spawnPos.x + dx;
                   const boardY = spawnPos.y + dy;

                   // Check horizontal bounds
                   if (boardX < 0 || boardX >= CONSTANTS.BOARD.WIDTH) {
                       
                       return false;
                   }

                   // Allow pieces to spawn above the board (negative Y is spawn zone)
                   if (boardY >= 0 && boardY < CONSTANTS.BOARD.HEIGHT) {
                       if (board[boardY][boardX] !== null) {
                           
                           return false;
                       }
                   }
                   // Negative Y is fine - that's the spawn zone above the board
               }
           }
       }

       return true;
   }

   /**
    *
    */
   checkStackDanger() {
       // SIMPLE: Game over only when piece locks at Y < 0 (above the visible board)
       // This means part of the piece is above the neon drop sign

       if (this.state.currentPosition.y < 0) {
           
           return true; // Game over - piece is above the visible gameplay area
       }

       
       return false; // Continue game - piece is in visible area
   }

   /**
    *
    */
   checkAlternativeSpawns(pieceType) {
       const def = CONSTANTS.PIECES.DEFINITIONS[pieceType];
       if (!def) return false;

       // Try spawning one row higher
       const altSpawn = { x: def.spawn.x, y: def.spawn.y - 1 };

       // Temporarily modify the piece definition for testing
       const testPiece = {
           ...def,
           spawn: altSpawn
       };

       // Test if piece can fit at alternative position
       for (let dy = 0; dy < def.shape.length; dy++) {
           for (let dx = 0; dx < def.shape[0].length; dx++) {
               if (def.shape[dy][dx]) {
                   const boardX = altSpawn.x + dx;
                   const boardY = altSpawn.y + dy;

                   // Check bounds
                   if (boardX < 0 || boardX >= CONSTANTS.BOARD.WIDTH) {
                       continue; // Try next position
                   }

                   // Check collision in visible area
                   if (boardY >= 0 && boardY < CONSTANTS.BOARD.HEIGHT) {
                       if (this.state.board[boardY][boardX] !== null) {
                           return false; // Alternative also blocked
                       }
                   }
               }
           }
       }

       return true; // Alternative spawn position works
   }

   /**
    *
    */
   debugGameOver(reason, extraData = null) {
       this.debugState.lastGameOverReason = reason;
       this.debugState.boardStateAtGameOver = JSON.parse(JSON.stringify(this.state.board));
       this.debugState.pieceStateAtGameOver = {
           type: this.state.currentPiece?.type,
           position: { ...this.state.currentPosition },
           extraData: extraData
       };
       this.debugState.frameAtGameOver = this.frameNumber;

       // Debug info available if needed
   }

   /**
    *
    */
   playAudioWithCooldown(soundType, data = {}) {
       if (!this.audio) return;

       const now = Date.now();

       switch (soundType) {
           case 'land':
               if (now - this.audioState.lastLandSound > this.audioState.landCooldown) {
                   this.audio.playSound('land', data);
                   this.audioState.lastLandSound = now;
               }
               break;

           case 'rotate':
               if (now - this.audioState.lastRotateSound > this.audioState.rotateCooldown) {
                   this.audio.playSound('rotate', data);
                   this.audioState.lastRotateSound = now;
               }
               break;

           case 'clear':
               if (now - this.audioState.lastClearSound > this.audioState.clearCooldown) {
                   this.audio.playSound('clear', data);
                   this.audioState.lastClearSound = now;
               }
               break;

           default:
               // Other sounds play normally
               this.audio.playSound(soundType, data);
               break;
       }
   }

   /**
    *
    */
   startLocking() {

       this.playAudioWithCooldown('land');

       const lockDelay = CONSTANTS.TIMING.getLockDelay(
           this.state.currentPiece.type,
           this.state.currentPosition.y
       );

       this.state.lockTimer = lockDelay;
       this.state.isLocking = true;
   }

   /**
    *
    */
   hardDrop() {
       if (!this.state.currentPiece) return;

       const dropDistance = this.state.shadowPosition.y - this.state.currentPosition.y;

       if (dropDistance > 0) {
           this.state.currentPosition.y = this.state.shadowPosition.y;
           const points = this.scoring.hardDrop(dropDistance);
           this.state.score = this.scoring.score;
       }

       // Play land sound with cooldown
       this.playAudioWithCooldown('land');

       // This allows pieces above the board to trigger game over properly
       this.lockPiece();
   }

   /**
    *
    */
   rotatePiece(direction) {
       if (!this.state.currentPiece) return false;

       const currentPiece = {
           ...this.state.currentPiece,
           gridX: this.state.currentPosition.x,
           gridY: this.state.currentPosition.y
       };

       const result = Physics.tryRotation(this.state.board, currentPiece, direction);

       if (result.success) {
           this.state.currentPiece = {
               ...result.piece,
               upMovesUsed: this.state.currentPiece.upMovesUsed
           };
           this.state.currentPosition.x = result.piece.gridX;
           this.state.currentPosition.y = result.piece.gridY;

           this.state.shadowValid = false;

           this.playAudioWithCooldown('rotate');

           if (this.state.lockTimer > 0) {
               this.state.lockTimer = 0;
               this.state.isLocking = false;
           }

           return true;
       }

       return false;
   }

   /**
    *
    */
   startClearing(lines) {
       this.state.gameState = GameState.CLEARING;
       this.state.clearingLines = lines;
       this.state.clearTimer = CONSTANTS.TIMING.CLEAR_ANIMATION_TIME;

       
       this.playAudioWithCooldown('clear', { lines: lines.length });

       if (this.config.get('graphics.particles')) {
           this.particleSystem.createLineExplosion(lines, this.state.board);
       }
   }

   /**
    * Game over with clean event-driven architecture
    */
   gameOver() {
       if (this.gameOverTriggered) {
           
           return;
       }
       
       this.gameOverTriggered = true;
       
       
       // Store the death piece that caused game over
       this.state.deathPiece = {
           ...this.state.currentPiece,
           gridX: this.state.currentPosition.x,
           gridY: this.state.currentPosition.y,
           rotation: this.state.currentPiece.rotation,
           color: this.state.currentPiece.color,
           type: this.state.currentPiece.type
       };
       
       this.state.finalScore = this.state.score;
       this.state.gameOverStartTime = Date.now();
       this.state.gameState = GameState.GAME_OVER_SEQUENCE;
       
       // Dispatch game over event using EventBus (preferred) or fallback to DOM events
       const gameOverData = {
           score: this.state.score,
           level: this.state.level,
           lines: this.state.lines,
           time: Date.now() - this.state.startTime,
           isNewHighScore: this.state.score > (this.config.get('game.highScore') || 0),
           timestamp: Date.now(),
           deathPiece: this.state.deathPiece,
           gameOverStartTime: this.state.gameOverStartTime
       };
       
       // 🚀 API call already triggered at death detection - no need to duplicate
       // The API call is now triggered immediately when death is detected in lockPiece()
       
       if (this.eventBus) {
           
           this.eventBus.emit('gameOver', gameOverData);
       } else {
           
           const gameOverEvent = new CustomEvent('gameOver', { detail: gameOverData });
           document.dispatchEvent(gameOverEvent);
       }
       
       
   }

   
   // The renderer handles the visual sequence independently

   
   // The UI is now handled entirely by the main.js event listener

   // Keep all other existing methods unchanged...
   startTransition(type, duration, data = {}) {
       this.transitions = {
           active: true,
           type: type,
           startTime: Date.now(),
           duration: duration,
           data: data
       };
   }

   getTransitionProgress() {
       if (!this.transitions.active) return 1;
       const elapsed = Date.now() - this.transitions.startTime;
       return Math.min(1, elapsed / this.transitions.duration);
   }

   finishClearing() {
       if (this.gameOverTriggered || this.gameOverComplete) {
           
           return;
       }

       const linesCleared = this.state.clearingLines.length;
       // Lines cleared successfully

       this.state.board = Physics.removeClearedLines(
           this.state.board,
           this.state.clearingLines
       );

       const scoreResult = this.scoring.lineClear(linesCleared, this.state.board);
       const scoringState = this.scoring.getState();
       this.state.score = scoringState.score;
       this.state.lines = scoringState.lines;
       this.state.level = scoringState.level;
       this.state.combo = scoringState.combo;

       this.state.statistics.maxCombo = Math.max(
           this.state.statistics.maxCombo,
           this.state.combo
       );

       this.checkUnlocks();
       this.state.clearingLines = [];
       
       if (!this.gameOverTriggered && !this.gameOverComplete) {
           this.state.gameState = GameState.PLAYING;
           
           const nextPieceType = this.state.nextPiece ? this.state.nextPiece.type : this.generatePiece().type;
           if (!this.canPieceSpawnOnBoard(nextPieceType, this.state.board)) {
               console.log('💀 Game Over: Next piece cannot spawn after line clear');
               this.debugGameOver('post_clear_spawn_blocked', nextPieceType);
               this.gameOver();
               return;
           }
           
           this.spawnNextPiece();
           this.processBufferedInput();
       } else {
           console.log('🚫 Not returning to PLAYING - game over active');
       }
   }

   spawnNextPiece() {
       if (this.gameOverTriggered || this.gameOverComplete) {
           
           return;
       }

       if (!this.state.nextPiece) {
           this.state.nextPiece = this.generatePiece();
       }

       this.state.currentPiece = this.state.nextPiece;
       this.state.nextPiece = this.generatePiece();
       this.state.currentPosition = {
           x: this.state.currentPiece.spawn.x,
           y: this.state.currentPiece.spawn.y
       };
       this.state.canHold = true;

       this.state.spawnTimer = 0;
       this.state.isSpawning = true;
       this.state.pieceSpawnTime = Date.now();
       this.state.shadowValid = false;
   }

   // Add all the other required methods for a complete game engine...
   updateShadow() {
       if (!this.state.currentPiece) return;

       const stateKey = `${this.state.currentPosition.x},${this.state.currentPosition.y},${this.state.currentPiece.rotation}`;
       if (this.state.lastShadowKey === stateKey && this.state.shadowValid) {
           return;
       }

       const shadowX = this.state.currentPosition.x;
       let shadowY = this.state.currentPosition.y;

       const tempPiece = {
           ...this.state.currentPiece,
           gridX: shadowX,
           gridY: shadowY
       };

       shadowY = Physics.calculateStableShadow(
           this.state.board,
           tempPiece,
           shadowX,
           this.state.currentPosition.y
       );

       this.state.shadowPosition = { x: shadowX, y: shadowY };
       this.state.shadowValid = true;
       this.state.lastShadowKey = stateKey;
       this.state.shadowY = shadowY;
   }

   movePiece(dx, dy) {
       if (!this.state.currentPiece || this.state.gameState !== GameState.PLAYING) {
           return false;
       }

       const newX = this.state.currentPosition.x + dx;
       const newY = this.state.currentPosition.y + dy;

       const tempPiece = {
           ...this.state.currentPiece,
           gridX: newX,
           gridY: newY
       };

       // Standard movement for all pieces (including FLOAT)
       if (Physics.canPieceFitAt(this.state.board, tempPiece, newX, newY)) {
           this.state.currentPosition.x = newX;
           this.state.currentPosition.y = newY;
           
           this.state.lockTimer = 0;
           this.state.isLocking = false;
           this.state.shadowValid = false;
           
           return true;
       }

       // FLOAT piece diagonal movement when normal movement fails
       if (this.state.currentPiece.type === 'FLOAT' && dx !== 0) {
           return this.tryFloatDiagonalMovement(dx, dy);
       }

       return false;
   }

   /**
    * Try diagonal movement for FLOAT piece when normal movement is blocked
    */
   tryFloatDiagonalMovement(dx, dy) {
       // If we're trying to move up (dy < 0), try diagonal up movement
       if (dy < 0) {
           return this.tryFloatUpDiagonalMovement(dx);
       }
       
       // Otherwise try diagonal down movement
       return this.tryFloatDownDiagonalMovement(dx);
   }

   /**
    * Try diagonal up movement for FLOAT piece (even after 7 up-moves)
    */
   tryFloatUpDiagonalMovement(dx) {
       // Try diagonal movement: one row over and one row up
       const diagonalX = this.state.currentPosition.x + dx;
       const diagonalY = this.state.currentPosition.y - 1;

       const diagonalPiece = {
           ...this.state.currentPiece,
           gridX: diagonalX,
           gridY: diagonalY
       };

       if (Physics.canPieceFitAt(this.state.board, diagonalPiece, diagonalX, diagonalY)) {
           this.state.currentPosition.x = diagonalX;
           this.state.currentPosition.y = diagonalY;
           
           this.state.lockTimer = 0;
           this.state.isLocking = false;
           this.state.shadowValid = false;
           
           return true;
       }

       return false;
   }

   /**
    * Try diagonal down movement for FLOAT piece when normal movement is blocked
    */
   tryFloatDownDiagonalMovement(dx) {
       // Try diagonal movement: one row over and one row down
       const diagonalX = this.state.currentPosition.x + dx;
       const diagonalY = this.state.currentPosition.y + 1;

       const diagonalPiece = {
           ...this.state.currentPiece,
           gridX: diagonalX,
           gridY: diagonalY
       };

       if (Physics.canPieceFitAt(this.state.board, diagonalPiece, diagonalX, diagonalY)) {
           this.state.currentPosition.x = diagonalX;
           this.state.currentPosition.y = diagonalY;
           
           this.state.lockTimer = 0;
           this.state.isLocking = false;
           this.state.shadowValid = false;
           
           return true;
       }

       return false;
   }

   updateLocking(deltaTime) {
       this.state.lockTimer -= deltaTime;
       if (this.state.lockTimer <= 0) {
           this.lockPiece();
       }
   }

   findLinesToClear() {
       const linesToClear = [];
       for (let y = 0; y < CONSTANTS.BOARD.HEIGHT; y++) {
           let isFull = true;
           for (let x = 0; x < CONSTANTS.BOARD.WIDTH; x++) {
               if (!this.state.board[y][x]) {
                   isFull = false;
                   break;
               }
           }
           if (isFull) {
               linesToClear.push(y);
           }
       }
       return linesToClear;
   }

   // Include essential transition and state management methods...
   updateMenuTransition(deltaTime) {
       const progress = this.getTransitionProgress();
       if (progress >= 1) {
           this.state.gameState = GameState.COUNTDOWN;
           this.state.countdownTimer = 3000;
           this.transitions.active = false;
       }
   }

   updateCountdown(deltaTime) {
       this.state.countdownTimer -= deltaTime;
       if (this.state.countdownTimer <= 0) {
           this.state.gameState = GameState.COUNTDOWN_TO_PLAYING;
           this.startTransition('countdown-end', 300);
       }
   }

   updateCountdownTransition(deltaTime) {
       const progress = this.getTransitionProgress();
       if (progress >= 1) {
           this.state.gameState = GameState.PLAYING;
           this.transitions.active = false;
           this.processBufferedInput();
       }
   }

   updateClearing(deltaTime) {
       if (this.gameOverTriggered || this.gameOverComplete) {
           return;
       }

       if (this.state.clearTimer > CONSTANTS.TIMING.CLEAR_ANIMATION_TIME * 0.9) {
           this.timeDilation = 0.5;
       } else if (this.state.clearTimer < CONSTANTS.TIMING.CLEAR_ANIMATION_TIME * 0.1) {
           this.timeDilation = 0.5 + (0.5 * (1 - this.state.clearTimer / (CONSTANTS.TIMING.CLEAR_ANIMATION_TIME * 0.1)));
       } else {
           this.timeDilation = 1.0;
       }

       this.state.clearTimer -= deltaTime;
       if (this.state.clearTimer <= 0) {
           this.timeDilation = 1.0;
           this.finishClearing();
       }
   }

   // Add remaining essential methods for input handling, game management...
   handleInput(action) {
       
       this.recordInput(action);

       if (this.isInputBlocked()) {
           console.log(`🚫 Input blocked during game over lockout: ${action.type}`);
           return;
       }
       
       if (this.gameOverTriggered || this.gameOverComplete ||
           this.state.gameState === GameState.GAME_OVER_SEQUENCE ||
           this.state.gameState === GameState.GAME_OVER) {
           
           if (action.type === 'START_GAME' && this.canStartNewGame()) {
               this.startFreePlay();
               this.resetGameOverLockout();
               return;
           }
           
           if (action.type === 'RETURN_TO_MENU') {
               this.returnToMenu();
               this.resetGameOverLockout();
               return;
           }
           
           return;
       }

       if (this.shouldBufferInput(action)) {
           this.inputBuffer = {
               action: action,
               timestamp: Date.now()
           };
           return;
       }

       // REMOVED: Excessive logging
       this.processInputAction(action);
   }

   getDailySeed() {
       // Calculate daily seed based on tournament cycle (11:15 PM EST reset)
       const now = new Date();
       const estOffset = -5; // EST is UTC-5
       const estTime = new Date(now.getTime() + (estOffset * 60 * 60 * 1000));
       
       // Get current tournament day (resets at 11:15 PM EST)
       let tournamentDay;
       if (estTime.getHours() >= 23 && estTime.getMinutes() >= 15) {
           // After 11:15 PM EST, use tomorrow's date
           tournamentDay = new Date(estTime.getTime() + (24 * 60 * 60 * 1000));
       } else {
           // Before 11:15 PM EST, use today's date
           tournamentDay = new Date(estTime);
       }
       
       // Create deterministic seed from date
       const dateString = tournamentDay.toISOString().split('T')[0]; // YYYY-MM-DD
       const seed = this.hashString(dateString);
       
       console.log(`🎲 Daily seed for ${dateString}: ${seed}`);
       return seed;
   }
   
   hashString(str) {
       // Simple hash function for deterministic seed generation
       let hash = 0;
       for (let i = 0; i < str.length; i++) {
           const char = str.charCodeAt(i);
           hash = ((hash << 5) - hash) + char;
           hash = hash & hash; // Convert to 32-bit integer
       }
       return Math.abs(hash);
   }
   
   startGame(mode = 'practice') {
       this.gameOverTriggered = false;
       this.gameOverUITriggered = false;
       this.gameOverComplete = false;
       this.gameOverEventDispatched = false; // Reset event dispatch flag
       
       // 🎯 PERFORMANCE OPTIMIZATION: Reset game over system state for new game
       if (this.gameOverSystem && this.gameOverSystem.resetGameOverState) {
           this.gameOverSystem.resetGameOverState();
       }
       
       // Reset RNG with daily seed for consistency
       this.rng = new ProfessionalRNG(this.getDailySeed());
       
       this.state = this.createInitialState();
       this.state.gameMode = mode;
       this.state.startTime = Date.now();
       
       this.particleSystem.clear();
       this.scoring.reset();
       this.fillBag();
       this.fillBag();
       this.spawnNextPiece();
       
       this.state.gameState = GameState.MENU_TO_COUNTDOWN;
       this.startTransition('countdown', 1000);
       
       window.dispatchEvent(new CustomEvent('gameStarted', { 
           detail: { mode, timestamp: Date.now() } 
       }));
   }

   startFreePlay() {
       this.startGame('practice');
   }

   returnToMenu() {
       this.gameOverTriggered = false;
       this.gameOverUITriggered = false;
       this.gameOverComplete = false;
       this.gameOverEventDispatched = false; // Reset event dispatch flag
       
       // 🎯 PERFORMANCE OPTIMIZATION: Reset game over system state when returning to menu
       if (this.gameOverSystem && this.gameOverSystem.resetGameOverState) {
           this.gameOverSystem.resetGameOverState();
       }
       
       this.state = this.createInitialState();
       this.particleSystem.clear();
       this.resetGameOverLockout();
   }

   getState() {
       let phase = this.state.gameState;
       if (phase === GameState.PLAYING && this.state.isLocking) {
           phase = 'LOCKING';
       }

       return {
           phase: phase,
           board: this.state.board,
           current: this.state.currentPiece ? {
               ...this.state.currentPiece,
               gridX: this.state.currentPosition.x,
               gridY: this.state.currentPosition.y,
               rotation: this.state.currentPiece.rotation || 0
           } : null,
           shadowY: this.state.shadowPosition.y,
           next: this.state.nextPiece,
           hold: this.state.heldPiece,
           canHold: this.state.canHold,
           score: this.state.score,
           lines: this.state.lines,
           level: this.state.level,
           combo: this.state.combo,
           countdownTimer: this.state.countdownTimer || 0,
           lockTimer: this.state.lockTimer,
           clearingLines: this.state.clearingLines,
           startTime: this.state.startTime,
           frameCount: this.frameNumber,
           maxCombo: this.state.statistics.maxCombo,
           pieces: this.state.statistics.piecesPlaced,
           isNewHighScore: this.state.score > (this.config.get('game.highScore') || 0),
           displayHighScore: Math.max(this.state.score, this.config.get('game.highScore') || 0),
           lastUnlockScore: this.state.lastUnlockScore || 0,
           unlockedPieces: this.state.unlockedPieces,
           gravityAccumulator: this.state.gravityAccumulator,
           currentGravityDelay: this.state.gravitySpeed,
           isLocking: this.state.isLocking,
           hasBufferedInput: this.inputBuffer.action !== null,
           transition: this.transitions.active ? {
               type: this.transitions.type,
               progress: this.getTransitionProgress(),
               data: this.transitions.data
           } : null,
           timeDilation: this.timeDilation,
           metrics: this.scoring.getPerformanceMetrics(),
           deathPiece: this.state.deathPiece, // Death piece data for renderer
           gameOverStartTime: this.state.gameOverStartTime, // For renderer timing
           dailySeed: this.getCurrentSeed(), // Add seed for verification
           dailyDate: this.getCurrentDate() // Add date for verification
       };
   }
   
   getCurrentSeed() {
       return this.rng.seed;
   }
   
   getCurrentDate() {
       const now = new Date();
       const estOffset = -5; // EST is UTC-5
       const estTime = new Date(now.getTime() + (estOffset * 60 * 60 * 1000));
       
       let tournamentDay;
       if (estTime.getHours() >= 23 && estTime.getMinutes() >= 15) {
           tournamentDay = new Date(estTime.getTime() + (24 * 60 * 60 * 1000));
       } else {
           tournamentDay = new Date(estTime);
       }
       
       return tournamentDay.toISOString().split('T')[0];
   }

   getParticles() {
       return this.particleSystem.getParticles();
   }

   tick(deltaTime) {
       this.update(deltaTime);
   }

   // Include remaining utility methods as needed...
   isInputBlocked() {
       if (!this.gameOverLockout.active) return false;
       const elapsed = Date.now() - this.gameOverLockout.startTime;
       if (elapsed >= this.gameOverLockout.duration) {
           this.gameOverLockout.canStartNewGame = true;
           return this.state.gameState === GameState.GAME_OVER_SEQUENCE;
       }
       return true;
   }

   canStartNewGame() {
       return this.gameOverLockout.canStartNewGame || this.state.gameState === GameState.GAME_OVER;
   }

   resetGameOverLockout() {
       this.gameOverLockout = {
           active: false,
           startTime: 0,
           duration: 3000,
           canStartNewGame: false
       };
   }

   /**
    * Set the game over system for external integration
    */
   setGameOverSystem(gameOverSystem) {
       this.gameOverSystem = gameOverSystem;
   }

   /**
    * Set the audio system for external integration
    */
   setAudioSystem(audioSystem) {
       this.audio = audioSystem;
       console.log('✅ Audio system set in game engine');
   }

   /**
    * Set the blockchain manager for external integration
    */
   setBlockchainManager(blockchainManager) {
       this.blockchain = blockchainManager;
       console.log('✅ Blockchain manager set in game engine');
   }

   // Simplified stubs for remaining methods that would be in complete implementation
   updatePauseTransition() { 
       // Handle transition from PLAYING to PAUSED
       const progress = this.getTransitionProgress();
       if (progress >= 1.0) {
           this.state.gameState = GameState.PAUSED;
           this.transitions.active = false;
           console.log('⏸️ Game paused');
       }
   }
   
   updateUnpauseTransition() { 
       // Handle transition from PAUSED to PLAYING
       const progress = this.getTransitionProgress();
       if (progress >= 1.0) {
           this.state.gameState = GameState.PLAYING;
           this.transitions.active = false;
           console.log('▶️ Game unpaused');
       }
   }
   updateReturnToMenuTransition() { /* simplified */ }
   shouldBufferInput() { return false; }
   processBufferedInput() { /* simplified */ }
   processInputAction(action) {
       
       
       if (!this.state.currentPiece) {
           return;
       }
       
       switch (action.type) {
           case 'MOVE':
               // REMOVED: Excessive logging
               this.movePiece(action.dx, action.dy);
               break;
               
           case 'ROTATE':
               // REMOVED: Excessive logging
               this.rotatePiece(action.direction);
               break;
               
           case 'HARD_DROP':
               // REMOVED: Excessive logging
               this.hardDrop();
               break;
               
           case 'HOLD':
               // REMOVED: Excessive logging
               // TODO: Implement hold functionality
               break;
               
           case 'PAUSE':
               // Implement pause functionality
               if (this.state.gameState === GameState.PLAYING) {
                   console.log('⏸️ Pausing game');
                   this.startTransition('PAUSE', 300);
                   this.state.gameState = GameState.PLAYING_TO_PAUSE;
               } else if (this.state.gameState === GameState.PAUSED) {
                   console.log('▶️ Unpausing game');
                   this.startTransition('UNPAUSE', 300);
                   this.state.gameState = GameState.PAUSE_TO_PLAYING;
               }
               break;
               
           case 'UP_PRESSED': {
            const piece = this.state.currentPiece;
            if (piece && piece.type === 'FLOAT') {
                if ((piece.upMovesUsed || 0) < 7) {
                    // Try to move up
                    const moved = this.movePiece(0, -1);
                    if (moved) {
                        // Increment upMovesUsed on the in-place piece object
                        this.state.currentPiece.upMovesUsed = (piece.upMovesUsed || 0) + 1;
                        // Optional: play a soft floaty sound if you have one
                        this.playAudioWithCooldown && this.playAudioWithCooldown('float');
                    } else {
                        // Optionally: play a blocked sound or do nothing
                    }
                } else {
                    // Optionally: play a "no more up-moves" sound or show a visual cue
                }
                // Block rotation for FLOAT on up arrow
                break;
            }
            // All other pieces rotate as usual
            this.rotatePiece(1);
            break;
        }
               
           case 'SPACE':
               // REMOVED: Excessive logging
               this.hardDrop();
               break;
               
           default:
               // Unknown action type - silently ignore
               break;
       }
   }
   recordInput() { /* simplified */ }
   logFrameState() { /* simplified */ }
   logStateChange() { /* simplified */ }
   recordStateSnapshot() { /* simplified */ }
   checkUnlocks() {
    const thresholds = CONSTANTS.PIECES.UNLOCK_THRESHOLDS;
    let unlocked = false;
    for (const [piece, scoreReq] of Object.entries(thresholds)) {
        if (this.state.score >= scoreReq && !this.state.unlockedPieces.includes(piece)) {
            this.state.unlockedPieces.push(piece);
            this.state.lastUnlockScore = this.state.score;
            unlocked = true;
            
        }
    }
    if (unlocked) {
        this.fillBag(); // Refill bag to include new pieces
    }
}
   generatePiece() { 
       // Use 7-bag randomizer
       if (this.bagRandomizer.currentBag.length === 0) {
           this.fillBag();
       }
       
       const pieceType = this.bagRandomizer.currentBag.pop();
       return this.createPiece(pieceType);
   }
   
   fillBag() {
    // Use all currently unlocked pieces
    const pieceTypes = [...this.state.unlockedPieces];
    const shuffled = [...pieceTypes].sort(() => this.rng.random() - 0.5);
    this.bagRandomizer.currentBag = shuffled;
    this.bagRandomizer.bagCount++;
    
}   
   createPiece(type) { 
       const def = CONSTANTS.PIECES.DEFINITIONS[type];
       return {
           type,
           shape: def.shape,
           color: def.color,
           spawn: def.spawn,
           rotation: 0,
           upMovesUsed: 0
       };
   }

   /**
    * lockPiece: Handles locking the current piece and checks for game over.
    * If game over is detected, captures a full snapshot of the death piece and stores it in state.deathPiece.
    * Only the engine sets and manages deathPiece. Renderer is a pure consumer.
    */
   lockPiece() {
       if (this.gameOverTriggered || this.gameOverComplete) {
           console.log('🚫 Blocking lockPiece - game over already triggered');
           return;
       }

       if (!this.state.currentPiece) {
           
           return;
       }

       // Place the piece on the board
       this.state.board = Physics.placePiece(this.state.board, {
           ...this.state.currentPiece,
           gridX: this.state.currentPosition.x,
           gridY: this.state.currentPosition.y
       });

       this.state.statistics.piecesPlaced++;

       // Check if ANY part of the piece is above visible area (Y < 0)
       let pieceAboveVisibleArea = false;
       this.state.currentPiece.shape.forEach((row, dy) => {
           row.forEach((cell, dx) => {
               if (cell) {
                   const blockY = this.state.currentPosition.y + dy;
                   if (blockY < 0) {
                       pieceAboveVisibleArea = true;
                   }
               }
           });
       });
       
       if (pieceAboveVisibleArea) {
           console.log('💀 Game Over: Piece locked above visible gameplay area');
           
           // 🚀 IMMEDIATE API CALL TRIGGER - Start API call NOW
           console.log('🚀 DEATH DETECTED - Starting API call NOW');
           if (this.gameOverSystem) {
               this.gameOverSystem.startBackgroundAPICalls(this.state.score, null, null);
           } else {
               console.error('❌ CRITICAL: gameOverSystem not connected to engine');
           }
           
           // Store the death piece that caused game over
           this.state.deathPiece = {
               ...this.state.currentPiece,
               gridX: this.state.currentPosition.x,
               gridY: this.state.currentPosition.y,
               rotation: this.state.currentPiece.rotation,
               color: this.state.currentPiece.color,
               type: this.state.currentPiece.type
           };
           this.debugGameOver('piece_above_visible_area', this.state.currentPosition.y);
           this.gameOver();
           return; // CRITICAL: Stop execution immediately
       }

       // Find lines to clear
       const linesToClear = this.findLinesToClear();

       if (linesToClear.length > 0) {
           this.startClearing(linesToClear);
       } else {
           // Check if next piece can spawn
           const nextPieceType = this.state.nextPiece ? this.state.nextPiece.type : this.generatePiece().type;
           if (!this.canPieceSpawnOnBoard(nextPieceType, this.state.board)) {
               console.log('💀 Game Over: Next piece cannot spawn');
               
               // 🚀 IMMEDIATE API CALL TRIGGER - Start API call NOW
               console.log('🚀 DEATH DETECTED - Starting API call NOW');
               if (this.gameOverSystem) {
                   this.gameOverSystem.startBackgroundAPICalls(this.state.score, null, null);
               } else {
                   console.error('❌ CRITICAL: gameOverSystem not connected to engine');
               }
               
               // Store the death piece that can't spawn
               this.state.deathPiece = {
                   ...this.state.nextPiece,
                   gridX: this.state.nextPiece.spawn.x,
                   gridY: this.state.nextPiece.spawn.y,
                   rotation: this.state.nextPiece.rotation,
                   color: this.state.nextPiece.color,
                   type: this.state.nextPiece.type
               };
               this.debugGameOver('spawn_blocked', nextPieceType);
               this.gameOver();
               return; // CRITICAL: Stop execution immediately
           }
           // Safe to spawn next piece
           this.spawnNextPiece();
       }

       // Reset locking state
       this.state.lockTimer = 0;
       this.state.isLocking = false;
   }
}

export class ProfessionalRNG {
   constructor(seed) {
       this.seed = seed;
       this.state = seed;
   }

   random() {
       this.state ^= this.state << 13;
       this.state ^= this.state >> 17;
       this.state ^= this.state << 5;
       return (this.state >>> 0) / 4294967296;
   }
}
