/**
* config.js - Game configuration and constants
*
* Central store for all game settings and constants
* Handles persistence via localStorage
* 
* Cache bust: 2025-01-17 - Fixed GAME_CONFIG export
*/

export class Config {
   constructor() {
       this.data = {};
       this.listeners = new Map();
       this.validators = new Map();

       this.setupValidators();
       this.reset();
   }

   // ============ CONSTANTS ============
   static CONSTANTS = {
       // Board
       BOARD: {
           WIDTH: 10,
           HEIGHT: 20,
           BLOCK_SIZE: 24
       },

       // Timing
       TIMING: {
           TICK_RATE: 16.67,
           LOCK_DELAY: 750,
           LOCK_DELAY_FLOAT: 900,
           LOCK_DELAY_DANGER: 1500,
           MAX_LOCK_TIME: 5000,
           CLEAR_ANIMATION_TIME: 200,
           SPAWN_FADE_TIME: 400,
           GRAVITY_BASE: 1000,
           GRAVITY_MIN: 100,
           // Centralized lock delay logic
           getLockDelay: (pieceType, positionY) => {
               if (positionY < 0) return Config.CONSTANTS.TIMING.LOCK_DELAY_DANGER;
               if (pieceType === 'FLOAT') return Config.CONSTANTS.TIMING.LOCK_DELAY_FLOAT;
               return Config.CONSTANTS.TIMING.LOCK_DELAY;
           }
       },

       // Input
       INPUT: {
           DAS_DELAY_DEFAULT: 133,
           DAS_DELAY_MIN: 50,
           DAS_DELAY_MAX: 300,
           ARR_RATE_DEFAULT: 10,
           ARR_RATE_MIN: 0,
           ARR_RATE_MAX: 50,
           SOUND_COOLDOWN: 50,
           SWIPE_THRESHOLD_PHONE: 25
       },

       // Scoring
       SCORING: {
           SOFT_DROP: 1,
           HARD_DROP: 2,
           LINE_VALUES: [0, 100, 300, 500, 800],
           COMBO_VALUE: 50,
           LINES_PER_LEVEL: 10,
           PIECE_UNLOCK_INTERVAL: 2000
       },

       // Pieces
       PIECES: {
           TYPES: ['I', 'J', 'L', 'O', 'S', 'T', 'Z', 'FLOAT', 'PLUS', 'U', 'DOT', 'CORNER', 'PIPE', 'STAR', 'ZIGZAG', 'BRIDGE', 'DIAMOND', 'TWINS'],
           STANDARD: ['I', 'J', 'L', 'O', 'S', 'T', 'Z'],
           SPECIAL: ['FLOAT', 'PLUS', 'U', 'DOT', 'CORNER', 'PIPE', 'STAR', 'ZIGZAG', 'BRIDGE', 'DIAMOND', 'TWINS'],
           STARTING: ['I', 'J', 'L', 'O', 'S', 'T', 'Z', 'FLOAT'],
           FLOAT_CHANCE: 0.07,
           FLOAT_MAX_UP_MOVES: 7,
           SPECIAL_WEIGHT: 0.5,
           // Dynamic FLOAT frequency: increases 10-25% based on unlocked pieces AND game progress
           FLOAT_DYNAMIC_BOOST: {
               BASE_BOOST: 0.10,    // 10% minimum increase from advanced pieces
               MAX_BOOST: 0.15,     // 15% maximum increase from advanced pieces
               PROGRESS_BOOST: 0.10, // 10% maximum increase from game progress
               ADVANCED_PIECES: ['DOT', 'CORNER', 'PIPE', 'STAR', 'ZIGZAG', 'BRIDGE', 'DIAMOND', 'TWINS'],
               PROGRESSION_MILESTONES: [
                   { pieces: 0, boost: 0.00 },    // Start: no boost
                   { pieces: 50, boost: 0.02 },   // Early game: 2% boost
                   { pieces: 100, boost: 0.04 },  // Mid-early: 4% boost
                   { pieces: 200, boost: 0.06 },  // Mid game: 6% boost
                   { pieces: 350, boost: 0.08 },  // Mid-late: 8% boost
                   { pieces: 500, boost: 0.10 }   // Late game: 10% boost
               ]
           },
           UNLOCK_THRESHOLDS: {
               'PLUS': 2000,
               'U': 4000,
               'DOT': 6000,
               'CORNER': 8000,
               'PIPE': 10000,
               'STAR': 12000,
               'ZIGZAG': 14000,
               'BRIDGE': 16000,
               'DIAMOND': 18000,
               'TWINS': 20000
           },
           DEFINITIONS: {
               I: { shape: [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]], color: '#00FFFF', spawn: { x: 3, y: -2 } },
               J: { shape: [[1,0,0], [1,1,1], [0,0,0]], color: '#0000FF', spawn: { x: 3, y: -2 } },
               L: { shape: [[0,0,1], [1,1,1], [0,0,0]], color: '#FF7F00', spawn: { x: 3, y: -2 } },
               O: { shape: [[1,1], [1,1]], color: '#FFFF00', spawn: { x: 4, y: -2 } },
               S: { shape: [[0,1,1], [1,1,0], [0,0,0]], color: '#00FF00', spawn: { x: 3, y: -2 } },
               T: { shape: [[0,1,0], [1,1,1], [0,0,0]], color: '#8A2BE2', spawn: { x: 3, y: -2 } },
               Z: { shape: [[1,1,0], [0,1,1], [0,0,0]], color: '#FF0000', spawn: { x: 3, y: -2 } },
               FLOAT: { shape: [[1]], color: '#FFFFFF', spawn: { x: 4, y: -1 }, special: true },
               PLUS: { shape: [[0,1,0], [1,1,1], [0,1,0]], color: '#DFFF00', spawn: { x: 3, y: -3 } },
               U: { shape: [[1,0,1], [1,0,1], [1,1,1]], color: '#FF69B4', spawn: { x: 3, y: -3 } },
               DOT: { shape: [[1,1,0], [1,0,1], [0,1,1]], color: '#000000', spawn: { x: 3, y: -3 } },
               CORNER: { shape: [[1,1,0], [1,0,0], [1,0,0]], color: '#BF00FF', spawn: { x: 3, y: -3 } },
               PIPE: { shape: [[1,0,1], [1,0,1], [1,0,1]], color: '#00FFCC', spawn: { x: 3, y: -3 } },
               STAR: { shape: [[1,0,1], [0,1,0], [1,0,1]], color: '#FF00FF', spawn: { x: 3, y: -3 } },
               ZIGZAG: { shape: [[1,0,0], [1,1,0], [0,1,1]], color: '#00FF7F', spawn: { x: 3, y: -3 } },
               BRIDGE: { shape: [[1,1,1], [0,0,0], [1,1,1]], color: '#FF4500', spawn: { x: 3, y: -3 } },
               DIAMOND: { shape: [[0,1,0], [1,0,1], [0,1,0]], color: '#7FFF00', spawn: { x: 3, y: -3 } },
               TWINS: { shape: [[1,0,1], [0,0,0], [1,0,1]], color: '#FF1493', spawn: { x: 3, y: -3 } }
           }
       },

       // Particles
       PARTICLES: {
           PER_BLOCK_MIN: 15,
           PER_BLOCK_MAX: 25,
           LIFETIME: 1000,
           GRAVITY: 300,
           MAX_PARTICLES: 500,
           BOARD_WIDTH: 10
       },

       // Audio
       AUDIO: {
           MASTER_VOLUME_DEFAULT: 0.8,
           SOUND_COOLDOWN: 50
       },

       // Blockchain (for future use)
       BLOCKCHAIN: {
           MIN_SCORE_TO_SUBMIT: 1000,
           PROOF_CHECKPOINT_INTERVAL: 60,
           DAILY_PRIZE_POOL: 100,
           WINNER_PERCENTAGE: 0.60,
           HYPERBOLIC_K: 0.85,
           MINIMUM_REWARD: 0.01
       },

       // UI
       UI: {
           MA_GAP: 2,
           EDGE_GLOW_DISTANCE: 2,
           EDGE_GLOW_OPACITY: 0.16,
           PREVIEW_SCALE: 0.75,
           HOLD_OPACITY_ACTIVE: 0.5,
           HOLD_OPACITY_INACTIVE: 0.25
       }
   };

   // ============ DEFAULT SETTINGS ============
   defaults() {
       return {
           game: {
               highScore: 0,
               gamesPlayed: 0,
               totalLines: 0,
               totalScore: 0,
               tickRate: Config.CONSTANTS.TIMING.TICK_RATE
           },

           graphics: {
               particles: true,
               ghostPiece: true,
               ghostPieceOpacity: 0.25,
               showFPS: false,
               showGrid: false,
               edgeGlow: true,
               starfield: false
           },

           audio: {
               masterVolume: Config.CONSTANTS.AUDIO.MASTER_VOLUME_DEFAULT,
               soundEffects: true
           },

           input: {
               dasDelay: Config.CONSTANTS.INPUT.DAS_DELAY_DEFAULT,
               arrRate: Config.CONSTANTS.INPUT.ARR_RATE_DEFAULT
           },

           wallet: {
               connected: false,
               address: null,
               network: 'testnet'
           },

           gameplay: {
               unlockNotifications: true
           }
       };
   }

   // ============ VALIDATION ============
   setupValidators() {
       this.validators.set('audio.masterVolume', (value) => {
           return typeof value === 'number' && value >= 0 && value <= 1;
       });

       this.validators.set('input.dasDelay', (value) => {
           return typeof value === 'number' &&
                  value >= Config.CONSTANTS.INPUT.DAS_DELAY_MIN &&
                  value <= Config.CONSTANTS.INPUT.DAS_DELAY_MAX;
       });

       this.validators.set('input.arrRate', (value) => {
           return typeof value === 'number' &&
                  value >= Config.CONSTANTS.INPUT.ARR_RATE_MIN &&
                  value <= Config.CONSTANTS.INPUT.ARR_RATE_MAX;
       });
   }

   // ============ CORE METHODS ============
   async load() {
       try {
           const saved = localStorage.getItem('neonDropConfig');
           if (saved) {
               const parsed = JSON.parse(saved);
               this.data = this.merge(this.defaults(), parsed);
           } else {
               this.data = this.defaults();
           }
       } catch (error) {
           // Failed to load config - use defaults
           this.data = this.defaults();
       }
   }

   save() {
       try {
           localStorage.setItem('neonDropConfig', JSON.stringify(this.data));
       } catch (error) {
           // Failed to save config - continue silently
       }
   }

   get(path, defaultValue = undefined) {
       const keys = path.split('.');
       let value = this.data;

       for (const key of keys) {
           value = value?.[key];
           if (value === undefined) return defaultValue;
       }

       return value;
   }

   set(path, value) {
       const validator = this.validators.get(path);
       if (validator && !validator(value)) {
           // Invalid value - return false silently
           return false;
       }

       const keys = path.split('.');
       let obj = this.data;

       for (let i = 0; i < keys.length - 1; i++) {
           if (!obj[keys[i]]) obj[keys[i]] = {};
           obj = obj[keys[i]];
       }

       const lastKey = keys[keys.length - 1];
       const oldValue = obj[lastKey];
       obj[lastKey] = value;

       this.save();
       this.notify(path, value, oldValue);

       return true;
   }

   reset(section = null) {
       if (section) {
           const defaults = this.defaults();
           if (defaults[section]) {
               this.data[section] = defaults[section];
               this.save();
               this.notify(section, this.data[section], null);
           }
       } else {
           this.data = this.defaults();
           this.save();
           this.notify('', this.data, null);
       }
   }

   // ============ OBSERVERS ============
   onChange(path, callback) {
       if (!this.listeners.has(path)) {
           this.listeners.set(path, new Set());
       }

       this.listeners.get(path).add(callback);

       return () => {
           this.listeners.get(path)?.delete(callback);
       };
   }

   notify(path, newValue, oldValue) {
       // Notify direct listeners
       this.listeners.get(path)?.forEach(cb => cb(newValue, oldValue, path));

       // Notify parent listeners
       const parts = path.split('.');
       for (let i = parts.length - 1; i > 0; i--) {
           const parentPath = parts.slice(0, i).join('.');
           this.listeners.get(parentPath)?.forEach(cb =>
               cb(this.get(parentPath), undefined, parentPath)
           );
       }

       // Notify root listeners
       this.listeners.get('')?.forEach(cb => cb(this.data, undefined, ''));
   }

   // ============ UTILITY ============
   merge(target, source) {
       const result = { ...target };

       for (const key in source) {
           if (source.hasOwnProperty(key)) {
               if (typeof source[key] === 'object' &&
                   source[key] !== null &&
                   !Array.isArray(source[key])) {
                   result[key] = this.merge(result[key] || {}, source[key]);
               } else {
                   result[key] = source[key];
               }
           }
       }

       return result;
   }

   // ============ STATISTICS ============
   incrementStat(path, amount = 1) {
       const current = this.get(path) || 0;
       this.set(path, current + amount);
   }

   getStats() {
       return {
           gamesPlayed: this.get('game.gamesPlayed') || 0,
           highScore: this.get('game.highScore') || 0,
           totalLines: this.get('game.totalLines') || 0,
           totalScore: this.get('game.totalScore') || 0,
           averageScore: this.get('game.gamesPlayed') > 0 ?
               Math.floor((this.get('game.totalScore') || 0) / this.get('game.gamesPlayed')) : 0
       };
   }
}

// Export constants directly
export const CONSTANTS = Config.CONSTANTS;
export const PIECE_DEFINITIONS = Config.CONSTANTS.PIECES.DEFINITIONS;

// NEW: Centralized game configuration (extracted magic numbers)
export const GAME_CONFIG = {
  // Drop speeds and timing
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
  
  // Rendering and effects
  RENDERING: {
    FPS_TARGET: 60,
    PARTICLE_LIMIT: 500,
    EDGE_GLOW_DISTANCE: 2,
    EDGE_GLOW_OPACITY: 0.16,
    PREVIEW_SCALE: 0.75,
    HOLD_OPACITY_ACTIVE: 0.5,
    HOLD_OPACITY_INACTIVE: 0.25
  },
  
  // Audio cooldowns
  AUDIO: {
    COOLDOWNS: {
      LAND: 50,
      ROTATE: 100,
      CLEAR: 200
    }
  },
  
  // Game over and transitions
  TRANSITIONS: {
    GAME_OVER_LOCKOUT: 3000,
    MENU_TRANSITION: 500,
    COUNTDOWN_DURATION: 3000
  },
  
  // Performance monitoring
  PERFORMANCE: {
    FPS_TARGET: 60,
    FPS_WARNING_THRESHOLD: 50,
    FRAME_TIME_WARNING: 20, // ms
    LOG_INTERVAL: 300, // frames
    ENABLE_MONITORING: true
  }
};

// Helper functions
export const calculateGravityDelay = (startTime, score, level) => {
   const timeFactor = (Date.now() - startTime) / 2000;
   const scoreFactor = score / 200;
   const progress = Math.max(timeFactor, scoreFactor);

   const baseDelay = Math.max(100, 1000 - progress * 2);
   const levelRelief = Math.pow(1.05, level - 1);

   return Math.round(baseDelay * levelRelief);
};

// Blockchain reward calculation (kept for future use)
export const calculateReward = (rank, totalPlayers, prizePool) => {
   const C = CONSTANTS.BLOCKCHAIN;

   if (rank === 1) {
       return prizePool * C.WINNER_PERCENTAGE;
   }

   const remainingPool = prizePool * (1 - C.WINNER_PERCENTAGE);
   const k = remainingPool * C.HYPERBOLIC_K;
   const reward = k / Math.pow(rank, 1.5);

   return Math.max(reward, C.MINIMUM_REWARD);
};
