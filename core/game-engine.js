/**
 * NeonDrop Game Engine - Clean Architecture
 * Preserving your exact gameplay experience with zero technical debt
 */

class NeonDropEngine {
    constructor(canvasId, bgCanvasId) {
        this.canvas = document.getElementById(canvasId);
        this.bgCanvas = document.getElementById(bgCanvasId);
        this.ctx = this.canvas.getContext('2d');
        this.bgCtx = this.bgCanvas.getContext('2d');
        
        // Game state
        this.state = {
            phase: 'READY', // READY, COUNTDOWN, PLAYING, PAUSED, GAME_OVER
            score: 0,
            level: 1,
            lines: 0,
            time: 0,
            isPaused: false
        };
        
        // Game configuration - your proven settings
        this.config = {
            boardWidth: 10,
            boardHeight: 20,
            cellSize: 20,
            dropSpeed: 1000, // ms
            fastDropSpeed: 50,
            colors: {
                I: '#00d4ff', // Neon cyan
                O: '#ffd700', // Neon gold  
                T: '#ff6b6b', // Neon red
                S: '#00ff00', // Neon green
                Z: '#ff4444', // Red
                J: '#4169e1', // Blue
                L: '#ffa500'  // Orange
            }
        };
        
        // Game board
        this.board = this.createEmptyBoard();
        this.currentPiece = null;
        this.nextPieces = [];
        this.holdPiece = null;
        this.canHold = true;
        
        // Timing
        this.lastDrop = 0;
        this.gameStartTime = 0;
        
        // Input handling
        this.keys = {};
        this.setupInputHandling();
        
        console.log('🎮 NeonDrop Engine initialized with your proven gameplay');
    }
    
    createEmptyBoard() {
        return Array(this.config.boardHeight).fill().map(() => 
            Array(this.config.boardWidth).fill(0)
        );
    }
    
    setupInputHandling() {
        // Your exact input system - clean implementation
        document.addEventListener('keydown', (e) => {
            if (this.state.phase === 'COUNTDOWN') {
                // Only allow left/right during countdown
                if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
                    this.handleInput(e.code);
                }
                return;
            }
            
            if (this.state.phase === 'PLAYING') {
                this.handleInput(e.code);
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    handleInput(keyCode) {
        switch(keyCode) {
            case 'ArrowLeft':
                this.movePiece(-1, 0);
                break;
            case 'ArrowRight':
                this.movePiece(1, 0);
                break;
            case 'ArrowDown':
                this.movePiece(0, 1);
                break;
            case 'ArrowUp':
            case 'KeyX':
                this.rotatePiece();
                break;
            case 'Space':
                this.hardDrop();
                break;
            case 'KeyC':
                this.holdCurrentPiece();
                break;
            case 'KeyP':
            case 'Escape':
                this.togglePause();
                break;
        }
    }
    
    async startGame() {
        console.log('🚀 Starting NeonDrop with your proven mechanics');
        
        // Check game access with backend
        const access = await identitySystem.canPlayGame();
        if (!access.canPlay) {
            console.log('❌ Game access denied:', access.reason);
            this.showPaymentRequired(access);
            return false;
        }
        
        // Start game session with backend
        try {
            const response = await fetch('/api/game/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playerId: identitySystem.getPlayer().id,
                    gameType: 'neon_drop'
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                this.sessionId = result.sessionId;
                this.gameSeed = result.gameSession.seed;
                console.log('✅ Game session started:', result.message);
            } else {
                const error = await response.json();
                if (response.status === 402) {
                    this.showPaymentRequired(error);
                    return false;
                }
                throw new Error(error.error);
            }
        } catch (error) {
            console.warn('⚠️ Backend game start failed, continuing offline:', error);
            this.sessionId = `offline_${Date.now()}`;
            this.gameSeed = Math.floor(Math.random() * 1000000);
        }
        
        this.state.phase = 'COUNTDOWN';
        this.state.score = 0;
        this.state.level = 1;
        this.state.lines = 0;
        this.state.time = 0;
        this.board = this.createEmptyBoard();
        this.gameStartTime = Date.now();
        
        // Your countdown system
        this.startCountdown();
        return true;
    }
    
    startCountdown() {
        let count = 3;
        const countdownInterval = setInterval(() => {
            this.render();
            this.renderCountdown(count);
            
            count--;
            if (count < 0) {
                clearInterval(countdownInterval);
                this.state.phase = 'PLAYING';
                this.spawnNewPiece();
                this.gameLoop();
            }
        }, 1000);
    }
    
    gameLoop() {
        if (this.state.phase !== 'PLAYING') return;
        
        const now = Date.now();
        this.state.time = Math.floor((now - this.gameStartTime) / 1000);
        
        // Drop piece based on level speed
        if (now - this.lastDrop > this.getDropSpeed()) {
            this.movePiece(0, 1);
            this.lastDrop = now;
        }
        
        this.render();
        this.updateUI();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    getDropSpeed() {
        // Your proven speed curve
        return Math.max(50, 1000 - (this.state.level - 1) * 50);
    }
    
    spawnNewPiece() {
        // Generate next pieces if needed
        while (this.nextPieces.length < 5) {
            this.nextPieces.push(this.generateRandomPiece());
        }
        
        this.currentPiece = this.nextPieces.shift();
        this.currentPiece.x = Math.floor(this.config.boardWidth / 2) - 1;
        this.currentPiece.y = 0;
        
        // Check game over
        if (this.checkCollision(this.currentPiece, 0, 0)) {
            this.gameOver();
        }
    }
    
    generateRandomPiece() {
        const pieces = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
        const type = pieces[Math.floor(Math.random() * pieces.length)];
        
        return {
            type: type,
            shape: this.getPieceShape(type),
            color: this.config.colors[type],
            x: 0,
            y: 0,
            rotation: 0
        };
    }
    
    getPieceShape(type) {
        // Your exact piece definitions
        const shapes = {
            I: [[1,1,1,1]],
            O: [[1,1],[1,1]],
            T: [[0,1,0],[1,1,1]],
            S: [[0,1,1],[1,1,0]],
            Z: [[1,1,0],[0,1,1]],
            J: [[1,0,0],[1,1,1]],
            L: [[0,0,1],[1,1,1]]
        };
        return shapes[type];
    }
    
    movePiece(dx, dy) {
        if (!this.currentPiece) return false;
        
        if (!this.checkCollision(this.currentPiece, dx, dy)) {
            this.currentPiece.x += dx;
            this.currentPiece.y += dy;
            return true;
        }
        
        // If moving down failed, lock the piece
        if (dy > 0) {
            this.lockPiece();
        }
        
        return false;
    }
    
    rotatePiece() {
        if (!this.currentPiece) return;
        
        const rotated = this.getRotatedPiece(this.currentPiece);
        if (!this.checkCollision(rotated, 0, 0)) {
            this.currentPiece.shape = rotated.shape;
            this.currentPiece.rotation = rotated.rotation;
        }
    }
    
    hardDrop() {
        if (!this.currentPiece) return;
        
        let dropDistance = 0;
        while (this.movePiece(0, 1)) {
            dropDistance++;
        }
        
        // Bonus points for hard drop
        this.state.score += dropDistance * 2;
    }
    
    lockPiece() {
        if (!this.currentPiece) return;
        
        // Place piece on board
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const boardX = this.currentPiece.x + x;
                    const boardY = this.currentPiece.y + y;
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.color;
                    }
                }
            }
        }
        
        // Check for line clears
        this.clearLines();
        
        // Spawn next piece
        this.spawnNewPiece();
        this.canHold = true;
    }
    
    clearLines() {
        let linesCleared = 0;
        
        for (let y = this.config.boardHeight - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                this.board.splice(y, 1);
                this.board.unshift(Array(this.config.boardWidth).fill(0));
                linesCleared++;
                y++; // Check the same line again
            }
        }
        
        if (linesCleared > 0) {
            this.state.lines += linesCleared;
            this.state.level = Math.floor(this.state.lines / 10) + 1;
            
            // Your proven scoring system
            const lineScores = [0, 100, 300, 500, 800];
            this.state.score += lineScores[linesCleared] * this.state.level;
        }
    }
    
    checkCollision(piece, dx, dy) {
        const newX = piece.x + dx;
        const newY = piece.y + dy;
        
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const boardX = newX + x;
                    const boardY = newY + y;
                    
                    // Check boundaries
                    if (boardX < 0 || boardX >= this.config.boardWidth || 
                        boardY >= this.config.boardHeight) {
                        return true;
                    }
                    
                    // Check board collision
                    if (boardY >= 0 && this.board[boardY][boardX] !== 0) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render board
        this.renderBoard();
        
        // Render current piece
        if (this.currentPiece && this.state.phase === 'PLAYING') {
            this.renderPiece(this.currentPiece);
        }
        
        // Render ghost piece
        if (this.currentPiece && this.state.phase === 'PLAYING') {
            this.renderGhostPiece();
        }
    }
    
    renderBoard() {
        for (let y = 0; y < this.config.boardHeight; y++) {
            for (let x = 0; x < this.config.boardWidth; x++) {
                if (this.board[y][x] !== 0) {
                    this.ctx.fillStyle = this.board[y][x];
                    this.ctx.fillRect(
                        x * this.config.cellSize,
                        y * this.config.cellSize,
                        this.config.cellSize - 1,
                        this.config.cellSize - 1
                    );
                }
            }
        }
    }
    
    renderPiece(piece) {
        this.ctx.fillStyle = piece.color;
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    this.ctx.fillRect(
                        (piece.x + x) * this.config.cellSize,
                        (piece.y + y) * this.config.cellSize,
                        this.config.cellSize - 1,
                        this.config.cellSize - 1
                    );
                }
            }
        }
    }
    
    renderGhostPiece() {
        if (!this.currentPiece) return;
        
        // Find ghost position
        let ghostY = this.currentPiece.y;
        while (!this.checkCollision(this.currentPiece, 0, ghostY - this.currentPiece.y + 1)) {
            ghostY++;
        }
        
        // Render ghost
        this.ctx.fillStyle = this.currentPiece.color + '40'; // Semi-transparent
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    this.ctx.fillRect(
                        (this.currentPiece.x + x) * this.config.cellSize,
                        (ghostY + y) * this.config.cellSize,
                        this.config.cellSize - 1,
                        this.config.cellSize - 1
                    );
                }
            }
        }
    }
    
    renderCountdown(count) {
        this.ctx.fillStyle = '#00ff41';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            count > 0 ? count.toString() : 'GO!',
            this.canvas.width / 2,
            this.canvas.height / 2
        );
    }
    
    updateUI() {
        // Update score displays
        document.getElementById('score-display').textContent = this.state.score.toLocaleString();
        document.getElementById('level-display').textContent = this.state.level;
        document.getElementById('lines-display').textContent = this.state.lines;
        
        // Update time display
        const minutes = Math.floor(this.state.time / 60);
        const seconds = this.state.time % 60;
        document.getElementById('time-display').textContent = 
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    togglePause() {
        if (this.state.phase === 'PLAYING') {
            this.state.phase = 'PAUSED';
        } else if (this.state.phase === 'PAUSED') {
            this.state.phase = 'PLAYING';
            this.gameLoop();
        }
    }
    
    async gameOver() {
        this.state.phase = 'GAME_OVER';
        console.log('🎯 Game Over - Final Score:', this.state.score);
        
        // Submit score to backend
        await this.submitScore();
        
        // Trigger your game over overlay
        this.showGameOverScreen();
    }
    
    async submitScore() {
        if (!this.sessionId) {
            console.log('⚠️ No session ID, skipping score submission');
            return;
        }
        
        try {
            const response = await fetch('/api/game/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: this.sessionId,
                    score: this.state.score,
                    lines: this.state.lines,
                    time: this.state.time,
                    playerName: identitySystem.getPlayer()?.name
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ Score submitted successfully');
                console.log(`🏆 You ranked #${result.playerRank} today!`);
                
                // Store leaderboard data for game over screen
                this.gameResults = {
                    rank: result.playerRank,
                    leaderboard: result.leaderboard,
                    playerStats: result.playerStats,
                    message: result.message
                };
                
                // Update local player stats
                identitySystem.updateGameStats(this.state.score, this.state.lines, this.state.time);
                
            } else {
                console.warn('⚠️ Score submission failed');
            }
        } catch (error) {
            console.warn('⚠️ Score submission error:', error);
        }
    }
    
    showGameOverScreen() {
        // This will integrate with your beautiful game-over overlay
        console.log('🎮 Showing game over screen with your proven UI');
        
        // Display results if available
        if (this.gameResults) {
            console.log('🏆 Game Results:', this.gameResults);
        }
    }
    
    showPaymentRequired(accessInfo) {
        console.log('💳 Payment required:', accessInfo);
        // This will trigger your payment modal
        if (window.paymentSystem) {
            paymentSystem.showPaymentModal();
        }
    }
}

// Global game instance
let neonDropGame = null;

function initializeNeonDrop() {
    neonDropGame = new NeonDropEngine('game-canvas', 'bg-canvas');
    
    // Setup button handlers
    document.getElementById('start-btn').addEventListener('click', () => {
        neonDropGame.startGame();
    });
    
    document.getElementById('pause-btn').addEventListener('click', () => {
        neonDropGame.togglePause();
    });
    
    document.getElementById('reset-btn').addEventListener('click', () => {
        neonDropGame.startGame();
    });
    
    console.log('🎯 NeonDrop initialized - Your exact gameplay, zero technical debt');
}
