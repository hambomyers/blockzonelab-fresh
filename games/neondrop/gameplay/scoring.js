/**
 * gameplay/scoring.js - The Actual File You Need to Create
 *
 * SAVE THIS AS A NEW FILE: gameplay/scoring.js
 * Put it in the same folder as your other game files
 * This tracks score, combos, and anti-cheat metrics
 */

export class ScoringSystem {
    constructor(config) {
        this.config = config;
        this.reset(); // Initialize with default values
    }

    reset() {
        // Core score tracking
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.combo = 0;

        // Performance metrics
        this.metrics = {
            startTime: null,
            pieces: 0,
            inputs: 0,
            drops: { soft: 0, hard: 0 },
            clears: { single: 0, double: 0, triple: 0, tetris: 0 },
            techniques: { tspins: 0, perfects: 0 }
        };

        // For blockchain verification
        this.history = [];
        this.stateHashes = [];

        // Optionally, if you want to log the reset in development
        if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') {
            // ScoringSystem reset
        }
    }

    startGame() {
        this.reset(); // Ensure all states are fresh for a new game
        this.metrics.startTime = Date.now();
        this.recordState('game_start');
    }

    // Separate method for each scoring event
    softDrop(rows) {
        const points = rows;
        this.score += points;
        this.metrics.drops.soft += rows;

        this.recordEvent({
            type: 'soft_drop',
            rows,
            points,
            timestamp: Date.now()
        });

        return points;
    }

    hardDrop(rows) {
        const points = rows * 2;
        this.score += points;
        this.metrics.drops.hard += rows;

        this.recordEvent({
            type: 'hard_drop',
            rows,
            points,
            timestamp: Date.now()
        });

        return points;
    }

    lineClear(lines, boardState) {
        let points = 0;
        let message = '';

        // Base points
        const baseValues = [0, 100, 300, 500, 800];
        const basePoints = baseValues[lines] || 0;
        points = basePoints * this.level;

        // Update metrics
        const clearTypes = ['', 'single', 'double', 'triple', 'tetris'];
        if (clearTypes[lines]) {
            this.metrics.clears[clearTypes[lines]]++;
        }

        // FIXED COMBO SYSTEM - Only continues if you clear lines
        if (lines > 0) {
            // Combo continues
            if (this.combo > 0) {
                const comboBonus = 50 * this.combo * this.level;
                points += comboBonus;
                message = `${this.combo + 1}x COMBO!`;
            }
            this.combo++;
        } else {
            // NO LINES CLEARED = COMBO BREAKS
            this.combo = 0;
        }

        // Perfect clear detection
        if (this.isBoardEmpty(boardState)) {
            const perfectBonus = 1000 * this.level;
            points += perfectBonus;
            this.metrics.techniques.perfects++;
            message = 'PERFECT CLEAR!';
        }

        // Update state
        this.score += points;
        this.lines += lines;

        // Check level up
        if (Math.floor(this.lines / 10) + 1 > this.level) {
            this.level = Math.floor(this.lines / 10) + 1;
        }

        // Record for verification
        this.recordEvent({
            type: 'line_clear',
            lines,
            points,
            combo: this.combo,
            level: this.level,
            timestamp: Date.now()
        });

        return {
            points,
            message,
            combo: this.combo
        };
    }

    piecePlaced() {
        this.metrics.pieces++;
        this.recordState('piece_placed');
    }

    inputMade() {
        this.metrics.inputs++;
    }

    // Calculate current performance
    getPerformanceMetrics() {
        const gameTime = (Date.now() - this.metrics.startTime) / 1000;

        return {
            apm: Math.round((this.metrics.inputs / gameTime) * 60),
            pps: (this.metrics.pieces / gameTime).toFixed(2),
            efficiency: this.calculateEfficiency(),
            gameTime: Math.floor(gameTime)
        };
    }

    calculateEfficiency() {
        // Efficiency = score per piece (normalized)
        if (this.metrics.pieces === 0) return 0;

        const scorePerPiece = this.score / this.metrics.pieces;
        const expectedScorePerPiece = 50 + (this.level * 10);

        return Math.min(100, Math.round((scorePerPiece / expectedScorePerPiece) * 100));
    }

    // For blockchain submission
    generateProof() {
        const finalMetrics = this.getPerformanceMetrics();

        return {
            score: this.score,
            lines: this.lines,
            level: this.level,
            metrics: finalMetrics,

            // Detailed breakdown
            breakdown: {
                drops: this.metrics.drops,
                clears: this.metrics.clears,
                techniques: this.metrics.techniques
            },

            // Verification data
            eventCount: this.history.length,
            stateHashes: this.stateHashes,
            finalHash: this.generateHash()
        };
    }

    // Helper methods
    isBoardEmpty(board) {
        return board.every(row => row.every(cell => !cell));
    }

    recordEvent(event) {
        this.history.push(event);

        // Keep history manageable
        if (this.history.length > 1000) {
            this.history = this.history.slice(-500);
        }
    }

    recordState(type) {
        const stateString = `${type}-${this.score}-${this.lines}-${this.metrics.pieces}`;
        const hash = this.simpleHash(stateString);
        this.stateHashes.push(hash);
    }

    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(16);
    }

    generateHash() {
        const data = {
            score: this.score,
            pieces: this.metrics.pieces,
            time: Date.now() - this.metrics.startTime,
            stateCount: this.stateHashes.length
        };

        return this.simpleHash(JSON.stringify(data));
    }

    // Get current state for UI
    getState() {
        return {
            score: this.score,
            lines: this.lines,
            level: this.level,
            combo: this.combo,
            metrics: this.getPerformanceMetrics()
        };
    }
}

