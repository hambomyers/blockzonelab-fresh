/**
* core/physics-pure.js - Core collision detection and game physics
*
* Handles: collision detection, piece rotation, line clearing
* Pure functions only - no state, no side effects
*/

// Constants
const PHYSICS_CONSTANTS = {
   BOARD_WIDTH: 10,
   BOARD_HEIGHT: 20,
   MAX_SPAWN_HEIGHT: 6,
   MAX_ROTATION_STATES: 4
};

/**
* Check if piece fits at position - THE core physics function
*/
export const canPieceFitAt = (board, piece, x, y) => {
   if (!board || !piece || !piece.shape) return false;

   const shape = piece.shape;
   const size = shape.length;

   for (let py = 0; py < size; py++) {
       for (let px = 0; px < size; px++) {
           if (!shape[py] || !shape[py][px]) continue;

           const boardX = x + px;
           const boardY = y + py;

           // Boundary check
           if (boardX < 0 || boardX >= PHYSICS_CONSTANTS.BOARD_WIDTH) {
               return false;
           }

           // Floor check
           if (boardY >= PHYSICS_CONSTANTS.BOARD_HEIGHT) {
               return false;
           }

           // FIXED: Check collisions in visible board area (Y >= 0)
           // This allows pieces above the board to detect collisions with pieces below
           if (boardY >= 0 && boardY < PHYSICS_CONSTANTS.BOARD_HEIGHT) {
               if (board[boardY] && board[boardY][boardX] !== null) {
                   return false;
               }
           }
           // Pieces above the board (Y < 0) are allowed to exist but can't collide with anything
       }
   }

   return true;
};

/**
* Calculate shadow Y position - simple downward scan
*/
export const calculateStableShadow = (board, piece, currentX, currentY) => {
   let shadowY = currentY;

   const tempPiece = {
       ...piece,
       gridX: currentX,
       gridY: shadowY
   };

   // Scan down until collision
   while (shadowY < PHYSICS_CONSTANTS.BOARD_HEIGHT - 1) {
       tempPiece.gridY = shadowY + 1;

       if (!canPieceFitAt(board, tempPiece, currentX, shadowY + 1)) {
           break;
       }

       shadowY++;
   }

   return shadowY;
};

/**
* Rotate piece shape 90 degrees
*/
export const rotatePiece = (piece, direction) => {
   const n = piece.shape.length;
   const rotated = Array(n).fill().map(() => Array(n).fill(0));

   if (direction === 1) {
       // Clockwise
       for (let i = 0; i < n; i++) {
           for (let j = 0; j < n; j++) {
               rotated[i][j] = piece.shape[n - 1 - j][i];
           }
       }
   } else {
       // Counter-clockwise
       for (let i = 0; i < n; i++) {
           for (let j = 0; j < n; j++) {
               rotated[i][j] = piece.shape[j][n - 1 - i];
           }
       }
   }

   return {
       ...piece,
       shape: rotated,
       rotation: (piece.rotation + direction + 4) % 4
   };
};

/**
* Wall kick data - standard rotation system
*/
const WALL_KICKS = {
   I: {
       '0>1': [[-2,0], [1,0], [-2,-1], [1,2]],
       '1>0': [[2,0], [-1,0], [2,1], [-1,-2]],
       '1>2': [[-1,0], [2,0], [-1,2], [2,-1]],
       '2>1': [[1,0], [-2,0], [1,-2], [-2,1]],
       '2>3': [[2,0], [-1,0], [2,1], [-1,-2]],
       '3>2': [[-2,0], [1,0], [-2,-1], [1,2]],
       '3>0': [[1,0], [-2,0], [1,-2], [-2,1]],
       '0>3': [[-1,0], [2,0], [-1,2], [2,-1]]
   },
   default: {
       '0>1': [[-1,0], [-1,1], [0,-2], [-1,-2]],
       '1>0': [[1,0], [1,-1], [0,2], [1,2]],
       '1>2': [[1,0], [1,-1], [0,2], [1,2]],
       '2>1': [[-1,0], [-1,1], [0,-2], [-1,-2]],
       '2>3': [[1,0], [1,1], [0,-2], [1,-2]],
       '3>2': [[-1,0], [-1,-1], [0,2], [-1,2]],
       '3>0': [[-1,0], [-1,-1], [0,2], [-1,2]],
       '0>3': [[1,0], [1,1], [0,-2], [1,-2]]
   }
};

/**
* Get wall kicks for rotation
*/
export const getWallKicks = (piece, direction) => {
   const from = piece.rotation;
   const to = (from + direction + 4) % 4;
   const key = `${from}>${to}`;

   const table = piece.type === 'I' ? WALL_KICKS.I : WALL_KICKS.default;
   return table[key] || [];
};

/**
* Try rotation with wall kicks
*/
export const tryRotation = (board, piece, direction) => {
   const rotated = rotatePiece(piece, direction);

   // Try base position
   if (canPieceFitAt(board, rotated, rotated.gridX, rotated.gridY)) {
       return { success: true, piece: rotated };
   }

   // O-piece doesn't wall kick
   if (piece.type === 'O') {
       return { success: false };
   }

   // Try wall kicks
   const kicks = getWallKicks(piece, direction);
   for (const [dx, dy] of kicks) {
       const testX = rotated.gridX + dx;
       const testY = rotated.gridY + dy;

       if (canPieceFitAt(board, rotated, testX, testY)) {
           return {
               success: true,
               piece: { ...rotated, gridX: testX, gridY: testY }
           };
       }
   }

   return { success: false };
};

/**
* Place piece on board
*/
export const placePiece = (board, piece) => {
   if (!board || !piece || !piece.shape) return board;

   const newBoard = board.map(row => [...row]);

   piece.shape.forEach((row, dy) => {
       row.forEach((cell, dx) => {
           if (cell) {
               const x = piece.gridX + dx;
               const y = piece.gridY + dy;

               if (y >= 0 && y < PHYSICS_CONSTANTS.BOARD_HEIGHT &&
                   x >= 0 && x < PHYSICS_CONSTANTS.BOARD_WIDTH) {
                   newBoard[y][x] = piece.color;
               }
           }
       });
   });

   return newBoard;
};

/**
* Find completed lines
*/
export const findClearedLines = (board) => {
   const cleared = [];

   for (let y = 0; y < board.length; y++) {
       if (board[y].every(cell => cell !== null)) {
           cleared.push(y);
       }
   }

   return cleared;
};

/**
* Remove cleared lines and drop remaining pieces
*/
export const removeClearedLines = (board, lines) => {
   if (lines.length === 0) return board;

   const newBoard = board.filter((_, index) => !lines.includes(index));

   // Add empty lines at top
   while (newBoard.length < PHYSICS_CONSTANTS.BOARD_HEIGHT) {
       newBoard.unshift(Array(PHYSICS_CONSTANTS.BOARD_WIDTH).fill(null));
   }

   return newBoard;
};

/**
* Calculate spawn opacity for individual blocks as piece crosses boundary
* Rule: Smooth pixel-by-pixel fade as piece enters game board
*/
export const getBlockSpawnOpacity = (piece, pieceY, yOffset, blockDy) => {
   if (!piece || !piece.shape) return 1.0;
   
   const blockSize = 24; // Standard block size
   const realPixelY = (pieceY * blockSize) + yOffset;
   const blockPixelY = realPixelY + (blockDy * blockSize);
   const gameBoardTopPixel = 0; // Y=0 is top of main game board
   
   // Calculate how far this block has crossed into the game board
   const pixelsIntoBoard = blockPixelY - gameBoardTopPixel;
   
   if (pixelsIntoBoard <= 0) {
       // Block is above board - opaque
       return 0.25;
   } else if (pixelsIntoBoard >= blockSize) {
       // Block is fully on board - bright
       return 1.0;
   } else {
       // Block is crossing the boundary - smooth fade
       const fadeProgress = pixelsIntoBoard / blockSize;
       return 0.25 + (fadeProgress * 0.75); // Smooth transition from 25% to 100%
   }
};

/**
* Legacy function for whole-piece opacity (kept for compatibility)
*/
export const getSpawnOpacity = (piece, pieceY, yOffset = 0) => {
   // Use the block opacity for the piece origin as fallback
   return getBlockSpawnOpacity(piece, pieceY, yOffset, 0);
};

// Export constants
export { PHYSICS_CONSTANTS };

