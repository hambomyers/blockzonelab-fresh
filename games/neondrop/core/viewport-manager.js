/**
 * core/viewport-manager.js - Single source of truth for ALL UI positioning
 *
 * Calculates optimal dimensions and zones for entire game UI
 * Bottom-anchored layout system
 *
 * REFACTORED:
 * - Added centerX/centerY to all zones
 * - Added board edge calculations
 * - Nothing removed, only enhanced
 */

export class ViewportManager {
    constructor() {
        this.BOARD_TILES_X = 10;
        this.BOARD_TILES_Y = 20;
    }    calculateOptimalDimensions(viewportWidth, viewportHeight) {
        // Board is always 10 blocks wide
        const TOTAL_WIDTH_BLOCKS = 10;

        // Define our layout in blocks (bottom to top):
        const BOTTOM_GAP = 2;      // 2px gap from screen bottom
        const HOLD_BLOCKS = 0.5;   // Hold piece area
        const SCORE_BLOCKS = 1.2;  // Score/stats area
        const BOARD_BLOCKS = 20;   // Main game board
        const TITLE_BLOCKS = 1;    // Title area
        const TITLE_GAP = 2;       // 2px gap between title and board

        // Calculate total blocks needed
        const KNOWN_BLOCKS = HOLD_BLOCKS + SCORE_BLOCKS + BOARD_BLOCKS + TITLE_BLOCKS;

        // SCROLLBAR-AWARE CENTERING: Calculate effective viewport width for all devices
        const scrollbarWidth = viewportWidth - document.documentElement.clientWidth;
        const effectiveViewportWidth = viewportWidth - scrollbarWidth;

        // Calculate optimal block size that fits the screen
        const blockSize = Math.floor(Math.min(
            effectiveViewportWidth / TOTAL_WIDTH_BLOCKS,
            (viewportHeight - BOTTOM_GAP - TITLE_GAP) / (KNOWN_BLOCKS + 2) // +2 for minimum spawn room
        ));

        // Board dimensions
        const boardWidth = blockSize * this.BOARD_TILES_X;
        const boardHeight = blockSize * this.BOARD_TILES_Y;
        // Center board in effective viewport (excluding scrollbar)
        const boardX = (effectiveViewportWidth - boardWidth) / 2;        // Build layout from bottom up
        const holdY = viewportHeight - BOTTOM_GAP - (blockSize * HOLD_BLOCKS);
        const scoreY = holdY - (blockSize * SCORE_BLOCKS);
        const boardY = scoreY - boardHeight;
        const titleY = boardY - TITLE_GAP - blockSize;

        // Calculate side panel widths using effective viewport for perfect symmetry
        const leftPanelWidth = boardX;
        const rightPanelWidth = effectiveViewportWidth - (boardX + boardWidth);

        // Return complete dimension system
        return {
            // Core dimensions
            blockSize,
            boardWidth,
            boardHeight,
            canvasWidth: viewportWidth,
            canvasHeight: viewportHeight,
            boardX,
            boardY,

            // Complete UI zone system
            zones: {
                // Main game board - ENHANCED with center and edges
                board: {
                    x: boardX,
                    y: boardY,
                    width: boardWidth,
                    height: boardHeight,
                    // NEW: Pre-calculated values
                    centerX: boardX + boardWidth / 2,
                    centerY: boardY + boardHeight / 2,
                    rightEdge: boardX + boardWidth,
                    bottomEdge: boardY + boardHeight
                },

                // Left panel (for guide)
                leftPanel: {
                    x: 0,
                    y: 0,
                    width: leftPanelWidth,
                    height: viewportHeight,
                    centerX: leftPanelWidth / 2,
                    // NEW: Center Y for vertical centering
                    centerY: viewportHeight / 2
                },

                // Right panel (for future features)
                rightPanel: {
                    x: boardX + boardWidth,
                    y: 0,
                    width: rightPanelWidth,
                    height: viewportHeight,
                    centerX: boardX + boardWidth + (rightPanelWidth / 2),
                    // NEW: Center Y
                    centerY: viewportHeight / 2
                },

                // Title area (NEON DROP) - ENHANCED
                title: {
                    x: boardX,
                    y: titleY,
                    width: boardWidth,
                    height: blockSize,
                    // NEW: Centers
                    centerX: boardX + boardWidth / 2,
                    centerY: titleY + blockSize / 2
                },

                // Score/stats area - ENHANCED
                score: {
                    x: boardX,
                    y: scoreY,
                    width: boardWidth,
                    height: blockSize * SCORE_BLOCKS,
                    // NEW: Centers
                    centerX: boardX + boardWidth / 2,
                    centerY: scoreY + (blockSize * SCORE_BLOCKS) / 2
                },

                // Hold piece area - ENHANCED
                hold: {
                    x: boardX,
                    y: boardY + boardHeight + 2, // 2px gap below board
                    width: boardWidth,
                    height: blockSize * HOLD_BLOCKS,
                    centerX: boardX + boardWidth / 2,
                    // NEW: Center Y
                    centerY: boardY + boardHeight + 2 + (blockSize * HOLD_BLOCKS) / 2
                },

                // Preview area (next piece) - ENHANCED
                preview: {
                    x: boardX + (boardWidth / 2), // Centered
                    y: boardY - 2, // 2px above board
                    centerX: boardX + boardWidth / 2,
                    // NEW: Center Y (though y is already the top)
                    centerY: boardY - 2 - (blockSize / 2) // Approximate
                }
            },

            // Legacy format for compatibility
            positions: {
                titleY: titleY,
                scoreY: scoreY,
                holdY: holdY,
                previewY: boardY - 2,
                spawnRoomBlocks: titleY / blockSize,
                bottomToHold: viewportHeight - holdY - (blockSize * HOLD_BLOCKS)
            }
        };
    }

    positionPanel() {
        if (this.isMobile) return;

        const getZones = () => {
            if (!window.neonDrop?.game?.renderer?.dimensions?.zones) {
                setTimeout(() => this.positionPanel(), 100);
                return false;
            }
            return window.neonDrop.game.renderer.dimensions.zones;
        };

        const zones = getZones();
        if (!zones) return;

        const board = zones.board;
        const rightZone = zones.rightPanel;

        // Match game board dimensions exactly
        const collapsedWidth = 80;
        const expandedWidth = board.width; // Same as game board
        const panelHeight = board.height + (zones.hold.y + zones.hold.height - board.y); // Board + score + hold

        // Position to align with board
        const collapsedLeft = rightZone.centerX - (collapsedWidth / 2);
        const expandedLeft = board.x + board.width + 20; // 20px gap from board

        // Store positions
        this.container.dataset.collapsedLeft = collapsedLeft;
        this.container.dataset.expandedLeft = expandedLeft;
        this.container.dataset.collapsedWidth = collapsedWidth;
        this.container.dataset.expandedWidth = expandedWidth;

        // Set initial position aligned with board top
        this.container.style.left = `${collapsedLeft}px`;
        this.container.style.width = `${collapsedWidth}px`;
        this.container.style.top = `${board.y}px`;
        this.container.style.height = `${panelHeight}px`;
        this.container.style.transform = 'none'; // Remove vertical centering
    }
}

