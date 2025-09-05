/**
 * NeonDrop v2 - Clean Renderer
 * 
 * Optimized rendering with particle system
 * Target: 150 lines, 60fps guaranteed
 */

export class RendererV2 {
    constructor(canvas, config) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.config = config;
        this.particles = [];
        this.blockSize = config.CONSTANTS.BOARD.BLOCK_SIZE;
        
        // Pre-calculate board dimensions
        this.boardWidth = config.CONSTANTS.BOARD.WIDTH * this.blockSize;
        this.boardHeight = config.CONSTANTS.BOARD.HEIGHT * this.blockSize;
        this.offsetX = (canvas.width - this.boardWidth) / 2;
        this.offsetY = 50;
        
        console.log('🎨 Renderer v2 initialized - optimized for 60fps');
    }

    render(gameState, deltaTime) {
        // Clear canvas
        this.ctx.fillStyle = '#000011';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render game board
        this.renderBoard(gameState.board);
        
        // Render current piece
        if (gameState.currentPiece) {
            this.renderPiece(gameState.currentPiece, gameState.position, gameState.rotation);
        }
        
        // Render ghost piece
        if (gameState.currentPiece) {
            this.renderGhostPiece(gameState);
        }
        
        // Render next piece preview
        if (gameState.nextPiece) {
            this.renderNextPiece(gameState.nextPiece);
        }
        
        // Render held piece
        if (gameState.heldPiece) {
            this.renderHeldPiece(gameState.heldPiece);
        }
        
        // Render UI
        this.renderUI(gameState);
        
        // Update and render particles
        this.updateParticles(deltaTime);
        this.renderParticles();
    }

    renderBoard(board) {
        for (let y = 0; y < board.length; y++) {
            for (let x = 0; x < board[y].length; x++) {
                if (board[y][x] !== 0) {
                    this.renderBlock(x, y, board[y][x]);
                }
            }
        }
        
        // Render board border
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.offsetX - 1, this.offsetY - 1, this.boardWidth + 2, this.boardHeight + 2);
    }

    renderPiece(piece, position, rotation) {
        const shape = this.getRotatedShape(piece.shape, rotation);
        
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const boardX = position.x + x;
                    const boardY = position.y + y;
                    if (boardY >= 0) { // Don't render above board
                        this.renderBlock(boardX, boardY, piece.color);
                    }
                }
            }
        }
    }

    renderGhostPiece(gameState) {
        if (!gameState.currentPiece) return;
        
        // Calculate ghost position
        let ghostY = gameState.position.y;
        while (this.isValidPosition(gameState.currentPiece, gameState.position.x, ghostY + 1, gameState.rotation, gameState.board)) {
            ghostY++;
        }
        
        // Render ghost piece with transparency
        const shape = this.getRotatedShape(gameState.currentPiece.shape, gameState.rotation);
        this.ctx.globalAlpha = 0.3;
        
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const boardX = gameState.position.x + x;
                    const boardY = ghostY + y;
                    if (boardY >= 0) {
                        this.renderBlock(boardX, boardY, gameState.currentPiece.color);
                    }
                }
            }
        }
        
        this.ctx.globalAlpha = 1.0;
    }

    renderBlock(x, y, color) {
        const pixelX = this.offsetX + x * this.blockSize;
        const pixelY = this.offsetY + y * this.blockSize;
        
        // Main block
        this.ctx.fillStyle = color;
        this.ctx.fillRect(pixelX, pixelY, this.blockSize, this.blockSize);
        
        // Block border for definition
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(pixelX, pixelY, this.blockSize, this.blockSize);
    }

    renderNextPiece(piece) {
        const previewX = this.offsetX + this.boardWidth + 20;
        const previewY = this.offsetY + 20;
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px monospace';
        this.ctx.fillText('NEXT', previewX, previewY);
        
        const shape = piece.shape;
        const scale = 0.7;
        
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const blockX = previewX + x * this.blockSize * scale;
                    const blockY = previewY + 10 + y * this.blockSize * scale;
                    
                    this.ctx.fillStyle = piece.color;
                    this.ctx.fillRect(blockX, blockY, this.blockSize * scale, this.blockSize * scale);
                }
            }
        }
    }

    renderHeldPiece(piece) {
        const holdX = this.offsetX - 120;
        const holdY = this.offsetY + 20;
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px monospace';
        this.ctx.fillText('HOLD', holdX, holdY);
        
        const shape = piece.shape;
        const scale = 0.7;
        
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const blockX = holdX + x * this.blockSize * scale;
                    const blockY = holdY + 10 + y * this.blockSize * scale;
                    
                    this.ctx.fillStyle = piece.color;
                    this.ctx.fillRect(blockX, blockY, this.blockSize * scale, this.blockSize * scale);
                }
            }
        }
    }

    renderUI(gameState) {
        const uiX = this.offsetX + this.boardWidth + 20;
        let uiY = this.offsetY + 120;
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px monospace';
        
        this.ctx.fillText(`Score: ${gameState.score.toLocaleString()}`, uiX, uiY);
        uiY += 25;
        this.ctx.fillText(`Lines: ${gameState.lines}`, uiX, uiY);
        uiY += 25;
        this.ctx.fillText(`Level: ${gameState.level}`, uiX, uiY);
        
        // FLOAT statistics
        if (gameState.statistics) {
            uiY += 40;
            this.ctx.fillText(`Pieces: ${gameState.statistics.piecesPlaced}`, uiX, uiY);
            uiY += 25;
            this.ctx.fillText(`FLOAT: ${gameState.statistics.floatPiecesSpawned}`, uiX, uiY);
        }
    }

    // Optimized particle system
    createLineParticles(lineY, boardWidth) {
        const particleCount = 20;
        
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: this.offsetX + Math.random() * this.boardWidth,
                y: this.offsetY + lineY * this.blockSize,
                vx: (Math.random() - 0.5) * 200,
                vy: -Math.random() * 150 - 50,
                life: 1.0,
                decay: 0.02,
                color: `hsl(${Math.random() * 60 + 180}, 100%, 70%)`
            });
        }
    }

    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            particle.x += particle.vx * deltaTime / 1000;
            particle.y += particle.vy * deltaTime / 1000;
            particle.vy += 300 * deltaTime / 1000; // Gravity
            particle.life -= particle.decay;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    renderParticles() {
        for (const particle of this.particles) {
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4);
        }
        this.ctx.globalAlpha = 1.0;
    }

    // Utility methods
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

    isValidPosition(piece, x, y, rotation, board) {
        const shape = this.getRotatedShape(piece.shape, rotation);
        
        for (let py = 0; py < shape.length; py++) {
            for (let px = 0; px < shape[py].length; px++) {
                if (shape[py][px]) {
                    const boardX = x + px;
                    const boardY = y + py;
                    
                    if (boardX < 0 || boardX >= 10 || boardY >= 20) {
                        return false;
                    }
                    
                    if (boardY >= 0 && board[boardY][boardX] !== 0) {
                        return false;
                    }
                }
            }
        }
        
        return true;
    }
}
