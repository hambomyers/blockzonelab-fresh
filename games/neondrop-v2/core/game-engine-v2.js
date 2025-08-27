/**
 * NeonDrop v2 - Clean Game Engine
 * 
 * Minimal, elegant Tetris engine with direct FLOAT integration
 * Target: 200 lines, zero technical debt
 */

export class GameEngineV2 {
    constructor(config) {
        this.config = config;
        this.state = this.createInitialState();
        this.floatSystem = null; // Direct assignment - no wrappers
        this.lastUpdate = 0;
        this.dropTimer = 0;
    }

    createInitialState() {
        return {
            board: Array(20).fill().map(() => Array(10).fill(0)),
            currentPiece: null,
            nextPiece: null,
            position: { x: 0, y: 0 },
            rotation: 0,
            score: 0,
            lines: 0,
            level: 1,
            gameState: 'MENU', // MENU, PLAYING, PAUSED, GAME_OVER
            dropSpeed: 1000,
            lockDelay: 0,
            canHold: true,
            heldPiece: null,
            bag: [],
            statistics: {
                piecesPlaced: 0,
                floatPiecesSpawned: 0
            }
        };
    }

    // Clean piece generation with direct FLOAT integration
    generatePiece() {
        // Direct FLOAT system integration - no wrappers
        if (this.floatSystem) {
            const stackHeight = this.calculateStackHeight();
            if (this.floatSystem.shouldSpawnFloat(stackHeight)) {
                console.log(`✨ FLOAT piece spawned at height ${stackHeight}`);
                this.state.statistics.floatPiecesSpawned++;
                return this.createPiece('FLOAT');
            }
        }

        // Standard bag randomizer
        if (this.state.bag.length === 0) {
            this.fillBag();
        }
        
        const pieceType = this.state.bag.pop();
        return this.createPiece(pieceType);
    }

    createPiece(type) {
        const definition = this.config.CONSTANTS.PIECES.DEFINITIONS[type];
        return {
            type,
            shape: definition.shape,
            color: definition.color,
            spawn: definition.spawn,
            rotation: 0
        };
    }

    fillBag() {
        const standardPieces = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
        this.state.bag = [...standardPieces].sort(() => Math.random() - 0.5);
    }

    // Clean stack height calculation for FLOAT system
    calculateStackHeight() {
        let maxHeight = 0;
        for (let x = 0; x < 10; x++) {
            for (let y = 0; y < 20; y++) {
                if (this.state.board[y][x] !== 0) {
                    maxHeight = Math.max(maxHeight, 20 - y);
                    break;
                }
            }
        }
        return maxHeight;
    }

    // Main game update loop
    update(deltaTime) {
        if (this.state.gameState !== 'PLAYING') return;

        this.dropTimer += deltaTime;
        
        if (this.dropTimer >= this.state.dropSpeed) {
            this.dropPiece();
            this.dropTimer = 0;
        }

        // Handle lock delay
        if (this.state.lockDelay > 0) {
            this.state.lockDelay -= deltaTime;
            if (this.state.lockDelay <= 0) {
                this.lockPiece();
            }
        }
    }

    dropPiece() {
        if (!this.state.currentPiece) return;

        const newY = this.state.position.y + 1;
        if (this.isValidPosition(this.state.currentPiece, this.state.position.x, newY, this.state.rotation)) {
            this.state.position.y = newY;
        } else {
            // Start lock delay
            this.state.lockDelay = this.getLockDelay();
        }
    }

    getLockDelay() {
        const baseDelay = this.config.CONSTANTS.TIMING.LOCK_DELAY;
        if (this.state.currentPiece?.type === 'FLOAT') {
            return this.config.CONSTANTS.TIMING.LOCK_DELAY_FLOAT;
        }
        return baseDelay;
    }

    lockPiece() {
        if (!this.state.currentPiece) return;

        // Place piece on board
        this.placePieceOnBoard();
        
        // Check for line clears
        const clearedLines = this.checkAndClearLines();
        
        // Update score and statistics
        this.updateScore(clearedLines);
        
        // Spawn next piece
        this.spawnNextPiece();
        
        // Check game over
        if (this.isGameOver()) {
            this.state.gameState = 'GAME_OVER';
        }
    }

    placePieceOnBoard() {
        const piece = this.state.currentPiece;
        const shape = this.getRotatedShape(piece.shape, this.state.rotation);
        
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const boardX = this.state.position.x + x;
                    const boardY = this.state.position.y + y;
                    if (boardY >= 0 && boardY < 20 && boardX >= 0 && boardX < 10) {
                        this.state.board[boardY][boardX] = piece.color;
                    }
                }
            }
        }
        
        this.state.statistics.piecesPlaced++;
    }

    checkAndClearLines() {
        const linesToClear = [];
        
        for (let y = 0; y < 20; y++) {
            if (this.state.board[y].every(cell => cell !== 0)) {
                linesToClear.push(y);
            }
        }
        
        // Remove cleared lines
        for (const lineY of linesToClear.reverse()) {
            this.state.board.splice(lineY, 1);
            this.state.board.unshift(Array(10).fill(0));
        }
        
        return linesToClear.length;
    }

    updateScore(linesCleared) {
        if (linesCleared === 0) return;
        
        const baseScore = [0, 100, 300, 500, 800][linesCleared] || 800;
        const levelMultiplier = this.state.level;
        
        this.state.score += baseScore * levelMultiplier;
        this.state.lines += linesCleared;
        this.state.level = Math.floor(this.state.lines / 10) + 1;
        
        // Update drop speed based on level
        this.state.dropSpeed = Math.max(50, 1000 - (this.state.level - 1) * 50);
    }

    spawnNextPiece() {
        if (!this.state.nextPiece) {
            this.state.nextPiece = this.generatePiece();
        }
        
        this.state.currentPiece = this.state.nextPiece;
        this.state.nextPiece = this.generatePiece();
        this.state.position = { ...this.state.currentPiece.spawn };
        this.state.rotation = 0;
        this.state.lockDelay = 0;
        this.state.canHold = true;
    }

    // Input handling
    handleInput(input) {
        if (this.state.gameState !== 'PLAYING') {
            if (input.type === 'START' && this.state.gameState === 'MENU') {
                this.startGame();
            }
            return;
        }

        switch (input.type) {
            case 'MOVE_LEFT':
                this.movePiece(-1, 0);
                break;
            case 'MOVE_RIGHT':
                this.movePiece(1, 0);
                break;
            case 'SOFT_DROP':
                this.movePiece(0, 1);
                break;
            case 'HARD_DROP':
                this.hardDrop();
                break;
            case 'ROTATE_CW':
                this.rotatePiece(1);
                break;
            case 'ROTATE_CCW':
                this.rotatePiece(-1);
                break;
            case 'HOLD':
                this.holdPiece();
                break;
            case 'PAUSE':
                this.togglePause();
                break;
        }
    }

    movePiece(dx, dy) {
        if (!this.state.currentPiece) return;
        
        const newX = this.state.position.x + dx;
        const newY = this.state.position.y + dy;
        
        if (this.isValidPosition(this.state.currentPiece, newX, newY, this.state.rotation)) {
            this.state.position.x = newX;
            this.state.position.y = newY;
        }
    }

    rotatePiece(direction) {
        if (!this.state.currentPiece) return;
        
        const newRotation = (this.state.rotation + direction + 4) % 4;
        
        if (this.isValidPosition(this.state.currentPiece, this.state.position.x, this.state.position.y, newRotation)) {
            this.state.rotation = newRotation;
        }
    }

    hardDrop() {
        if (!this.state.currentPiece) return;
        
        while (this.isValidPosition(this.state.currentPiece, this.state.position.x, this.state.position.y + 1, this.state.rotation)) {
            this.state.position.y++;
        }
        
        this.lockPiece();
    }

    isValidPosition(piece, x, y, rotation) {
        const shape = this.getRotatedShape(piece.shape, rotation);
        
        for (let py = 0; py < shape.length; py++) {
            for (let px = 0; px < shape[py].length; px++) {
                if (shape[py][px]) {
                    const boardX = x + px;
                    const boardY = y + py;
                    
                    // Check boundaries
                    if (boardX < 0 || boardX >= 10 || boardY >= 20) {
                        return false;
                    }
                    
                    // Check collision with existing pieces
                    if (boardY >= 0 && this.state.board[boardY][boardX] !== 0) {
                        return false;
                    }
                }
            }
        }
        
        return true;
    }

    getRotatedShape(shape, rotation) {
        let rotated = shape;
        for (let i = 0; i < rotation; i++) {
            rotated = this.rotateMatrix(rotated);
        }
        return rotated;
    }

    rotateMatrix(matrix) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const rotated = Array(cols).fill().map(() => Array(rows).fill(0));
        
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                rotated[x][rows - 1 - y] = matrix[y][x];
            }
        }
        
        return rotated;
    }

    startGame() {
        this.state = this.createInitialState();
        this.state.gameState = 'PLAYING';
        this.spawnNextPiece();
        console.log('🎮 NeonDrop v2 game started');
    }

    togglePause() {
        if (this.state.gameState === 'PLAYING') {
            this.state.gameState = 'PAUSED';
        } else if (this.state.gameState === 'PAUSED') {
            this.state.gameState = 'PLAYING';
        }
    }

    isGameOver() {
        return !this.isValidPosition(this.state.currentPiece, this.state.position.x, this.state.position.y, this.state.rotation);
    }

    getState() {
        return { ...this.state };
    }
}
