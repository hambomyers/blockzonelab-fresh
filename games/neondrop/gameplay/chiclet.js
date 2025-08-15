/**
 * gameplay/chiclet.js - Beautiful procedurally-varied glowing blocks
 * This is the visual heart of the game - each block is unique
 *
 * UPDATED: Enhanced FLOAT piece visual feedback
 * - Shows remaining up moves as a number
 * - Better visual distinction for FLOAT pieces
 * - Improved arrow animation
 *
 * REFACTORED:
 * - Better cache management with proper LRU clearing
 * - No more arbitrary 50-item limit
 * - Added cache configuration and performance metrics.
 */

export class ChicletRenderer {
    constructor() {
        this.blockSize = 24;  // Default size, will be updated
        this.scale = 1;       // Display scale
        this.cache = new Map();
        this.styleCache = new Map();
        this.initialized = false;
        this.floatPulse = 0; // Animation state for FLOAT pieces
        this.MAX_CACHE_SIZE = 200;
        this.MAX_STYLE_CACHE_SIZE = 100;
    }

    initialize() {
        if (this.initialized) return;
        this.initialized = true;
        // Chiclet renderer ready
    }

    setBlockSize(size) {
        if (this.blockSize !== size) {
            this.blockSize = size;
            this.clearCache(); // This will also reset metrics
        }
    }

    setScale(scale) {
        if (this.scale !== scale) {
            this.scale = scale;
            this.clearCache(); // This will also reset metrics
        }
    }    clearCache() {
        this.cache.clear();
        this.styleCache.clear();
        if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') {
            // ChicletRenderer: Caches cleared
        }
    }      drawBlock(ctx, x, y, color, row, col, pieceData = null) {
        if (!this.initialized) {
            this.initialize();
        }

        // Validate inputs to prevent rendering errors
        if (!ctx || !Number.isFinite(x) || !Number.isFinite(y) || 
            !this.blockSize || this.blockSize <= 0) {
            return; // Skip invalid draw calls
        }

        // Update animation state - slower, more zen pulse (1 second intervals)
        this.floatPulse = (this.floatPulse + 0.006) % (Math.PI * 2);

        // Determine variant
        let variant;
        let cacheKey;

        if (pieceData) {
            // Active piece - use its stable variant (now 0-99 for variety)
            variant = pieceData.variant || 0;

            if (pieceData.type === 'FLOAT') {
                const upMovesUsed = pieceData.upMovesUsed || 0;
                const brightness = Math.floor(255 - (upMovesUsed * 30));
                cacheKey = `FLOAT_${brightness}_v${variant}_${this.blockSize}_${upMovesUsed}`;
            } else {
                cacheKey = `${color}_v${variant}_${this.blockSize}`;
            }
        } else {
            // Board piece - use position-based variant
            variant = (row * 7 + col * 11) % 100;
            cacheKey = `${color}_board_v${variant}_${this.blockSize}`;
        }

        // Check cache
        let cachedBlock = this.cache.get(cacheKey);

        if (!cachedBlock) {
            // Create cached block
            let renderColor = color;
            if (pieceData && pieceData.type === 'FLOAT') {
                const upMovesUsed = pieceData.upMovesUsed || 0;
                const brightness = Math.floor(255 - (upMovesUsed * 30));
                const hexBrightness = brightness.toString(16).padStart(2, '0');
                renderColor = `#${hexBrightness}${hexBrightness}${hexBrightness}`;
            }

            cachedBlock = this.createCachedBlock(renderColor, variant, pieceData);

            // REFACTORED: Better cache management
            if (this.cache.size >= this.MAX_CACHE_SIZE) {
                this.clearOldestEntries();
            }

            this.cache.set(cacheKey, cachedBlock);
        }        // Draw the cached block with error handling
        try {
            ctx.drawImage(cachedBlock, x, y);
        } catch (error) {
          
            return; // Skip drawing this block
        }

        // Draw FLOAT piece overlay (not cached for animation)
        if (pieceData && pieceData.type === 'FLOAT') {
            this.drawFloatOverlay(ctx, x, y, pieceData);
        }
    }
      /**
     * REFACTORED: Clear 25% of oldest cache entries
     */
    clearOldestEntries() {
        const entriesToRemove = Math.floor(this.cache.size * 0.25);
        const keys = Array.from(this.cache.keys()).slice(0, entriesToRemove);
        keys.forEach(key => this.cache.delete(key));

        // Also clear style cache if needed
        if (this.styleCache.size > this.MAX_STYLE_CACHE_SIZE) {
            const stylesToRemove = Math.floor(this.styleCache.size * 0.25);
            const styleKeys = Array.from(this.styleCache.keys()).slice(0, stylesToRemove);
            styleKeys.forEach(key => this.styleCache.delete(key));
        }
    }

    /**
     * NEW: Enhanced FLOAT overlay with remaining moves indicator
     */
    drawFloatOverlay(ctx, x, y, pieceData) {
        ctx.save();

        const centerX = x + this.blockSize / 2;
        const centerY = y + this.blockSize / 2;
        const upMovesUsed = pieceData.upMovesUsed || 0;
        const movesRemaining = 7 - upMovesUsed; // CONSTANTS.PIECES.FLOAT_MAX_UP_MOVES

        // Only show arrow/number on UNUSED float pieces
        if (upMovesUsed === 0) {
            // Pulsing glow effect
            const pulse = Math.sin(this.floatPulse) * 0.15 + 0.85;

            // Arrow with number
            this.drawFloatArrowWithNumber(ctx, centerX, centerY, movesRemaining, pulse);

            // Zen-like soft blur glow for unused FLOAT pieces
            const glowRadius = Math.max(1, this.blockSize * 0.8); // Moderate glow radius
            if (Number.isFinite(centerX) && Number.isFinite(centerY) && Number.isFinite(glowRadius)) {
                try {
                    // Soft, organic radial glow (no harsh edges)
                    const softGlow = ctx.createRadialGradient(centerX, centerY, this.blockSize * 0.2, centerX, centerY, glowRadius);
                    softGlow.addColorStop(0, `rgba(255, 255, 255, ${0.15 * pulse})`);
                    softGlow.addColorStop(0.4, `rgba(255, 255, 255, ${0.08 * pulse})`);
                    softGlow.addColorStop(0.8, `rgba(255, 255, 255, ${0.03 * pulse})`);
                    softGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');

                    ctx.fillStyle = softGlow;
                    ctx.fillRect(x - this.blockSize * 0.3, y - this.blockSize * 0.3, 
                               this.blockSize * 1.6, this.blockSize * 1.6);

                } catch (error) {
                    // Skip glow effect on render error
                }
            }
        }
        // No visual indicator after first use - just the darkening

        ctx.restore();
    }

    /**
     * Draw arrow with number of moves remaining
     */
    drawFloatArrowWithNumber(ctx, centerX, centerY, movesRemaining, pulse) {
        // Scale elements with block size
        const arrowHeight = this.blockSize * 0.5;
        const arrowWidth = this.blockSize * 0.4;
        const numberSize = this.blockSize * 0.35;

        // Position arrow in upper portion
        const arrowY = centerY - this.blockSize * 0.15;

        // Draw upward arrow
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2 * this.scale;

        // Arrow shape (simplified triangle)
        ctx.beginPath();
        ctx.moveTo(centerX, arrowY - arrowHeight/2);
        ctx.lineTo(centerX - arrowWidth/2, arrowY);
        ctx.lineTo(centerX - arrowWidth/4, arrowY);
        ctx.lineTo(centerX - arrowWidth/4, arrowY + arrowHeight/3);
        ctx.lineTo(centerX + arrowWidth/4, arrowY + arrowHeight/3);
        ctx.lineTo(centerX + arrowWidth/4, arrowY);
        ctx.lineTo(centerX + arrowWidth/2, arrowY);
        ctx.closePath();

        // Shadow for depth
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 3 * this.scale;
        ctx.shadowOffsetX = 1 * this.scale;
        ctx.shadowOffsetY = 1 * this.scale;

        ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.stroke();

        // Glowing outline
        ctx.globalAlpha = pulse;
        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 1 * this.scale;
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Draw number below arrow
        const numberY = centerY + this.blockSize * 0.25;        // Number background circle with validation
        const radius = Math.max(1, numberSize * 0.6); // Ensure positive radius
        if (Number.isFinite(centerX) && Number.isFinite(numberY) && Number.isFinite(radius)) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.beginPath();
            ctx.arc(centerX, numberY, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Number text
        ctx.font = `bold ${numberSize}px monospace`;
        ctx.fillStyle = movesRemaining <= 2 ? '#FF6666' : '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(movesRemaining.toString(), centerX, numberY);

        // Urgent glow for low moves
        if (movesRemaining <= 2) {
            ctx.strokeStyle = '#FF0000';
            ctx.lineWidth = 1;
            ctx.globalAlpha = pulse * 0.5;
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
    }

    /**
     * Show depleted FLOAT indicator
     */
    drawDepletedFloat(ctx, centerX, centerY) {
        ctx.globalAlpha = 0.3;

        // Draw X mark
        const size = this.blockSize * 0.3;
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 3 * this.scale;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(centerX - size/2, centerY - size/2);
        ctx.lineTo(centerX + size/2, centerY + size/2);
        ctx.moveTo(centerX + size/2, centerY - size/2);
        ctx.lineTo(centerX - size/2, centerY + size/2);
        ctx.stroke();

        ctx.globalAlpha = 1;
    }    createCachedBlock(color, variant, pieceData = null) {
        // Validate inputs to prevent IndexSizeError
        if (!this.blockSize || this.blockSize <= 0 || !Number.isFinite(this.blockSize)) {
          
            return this.createEmptyCanvas();
        }

        const canvas = document.createElement('canvas');
        canvas.width = this.blockSize;
        canvas.height = this.blockSize;
        const ctx = canvas.getContext('2d', { alpha: true });

        if (!ctx) {
          
            return this.createEmptyCanvas();
        }

        try {
            // Use variant as consistent seed for this piece
            this.drawChiclet(ctx, 0, 0, color, variant, pieceData);
        } catch (error) {
          
            return this.createEmptyCanvas();
        }

        return canvas;
    }

    createEmptyCanvas() {
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, this.blockSize || 24);
        canvas.height = Math.max(1, this.blockSize || 24);
        return canvas;
    }
      getChicletStyle(variant, color, isPiece = false) {
        // REFACTORED: Check style cache first
        const styleCacheKey = `${variant}_${color}_${isPiece}`;
        let cachedStyle = this.styleCache.get(styleCacheKey);
        if (cachedStyle) return cachedStyle;

        // For pieces, use variant directly as seed
        // For board cells, variant is already position-based
        const seed = variant * 37;

        // Parse color
        let r = 255, g = 255, b = 255;
        if (color.startsWith('#')) {
            r = parseInt(color.substr(1, 2), 16);
            g = parseInt(color.substr(3, 2), 16);
            b = parseInt(color.substr(5, 2), 16);
        }

        // Special handling for black pieces
        const isBlack = (r === 0 && g === 0 && b === 0);
        if (isBlack) {
            // Black pieces get silver/white edges for visibility
            const style = {
                edge: '#222222',
                middle: '#111111',
                highlight: '#444444',

                // Edge variations based on variant
                topCurve: (seed % 3) === 0,
                rightCurve: ((seed + 1) % 3) === 0,
                bottomCurve: ((seed + 2) % 3) === 0,
                leftCurve: ((seed + 3) % 3) === 0,

                // Scale variations
                topVar: ((seed % 200 - 100) / 150) * this.scale,
                rightVar: (((seed * 3) % 200 - 100) / 150) * this.scale,
                bottomVar: (((seed * 5) % 200 - 100) / 150) * this.scale,
                leftVar: (((seed * 7) % 200 - 100) / 150) * this.scale,

                shineSpots: this.calculateShineSpots(variant, false),
                isBlack: true
            };
            this.styleCache.set(styleCacheKey, style);
            return style;
        }

        // Special handling for white/float pieces
        const isWhite = (r === 255 && g === 255 && b === 255) ||
                       (r === g && g === b && r > 200); // Also catch grayed FLOAT pieces

        if (isWhite) {
            // Enhanced visual for FLOAT pieces
            const floatTints = [
                { r: 10, g: 5, b: 15 },  // Slight purple
                { r: 5, g: 10, b: 15 },  // Slight blue
                { r: 5, g: 15, b: 10 },  // Slight cyan
                { r: 10, g: 10, b: 5 },  // Slight yellow
            ];

            const tint = floatTints[seed % floatTints.length];
            r = Math.min(255, r + tint.r);
            g = Math.min(255, g + tint.g);
            b = Math.min(255, b + tint.b);
        }

        const style = {
            edge: `rgb(${Math.max(0, r - 60)}, ${Math.max(0, g - 60)}, ${Math.max(0, b - 60)})`,
            middle: `rgb(${Math.min(255, r + 60)}, ${Math.min(255, g + 60)}, ${Math.min(255, b + 60)})`,
            highlight: `rgb(${Math.min(255, r + 120)}, ${Math.min(255, g + 120)}, ${Math.min(255, b + 120)})`,

            // Edge variations based on variant
            topCurve: (seed % 3) === 0,
            rightCurve: ((seed + 1) % 3) === 0,
            bottomCurve: ((seed + 2) % 3) === 0,
            leftCurve: ((seed + 3) % 3) === 0,

            // Scale variations with display scale
            topVar: ((seed % 200 - 100) / 150) * this.scale,
            rightVar: (((seed * 3) % 200 - 100) / 150) * this.scale,
            bottomVar: (((seed * 5) % 200 - 100) / 150) * this.scale,
            leftVar: (((seed * 7) % 200 - 100) / 150) * this.scale,

            shineSpots: this.calculateShineSpots(variant, isWhite),
            isWhite: isWhite
        };

        this.styleCache.set(styleCacheKey, style);
        return style;
    }    calculateShineSpots(variant, isWhite) {
        const spots = [];
        const seed = variant * 79;
        const numSpots = isWhite ? 7 : 3 + (seed % 3); // More spots for FLOAT pieces

        for (let i = 0; i < numSpots; i++) {
            const spotSeed = seed + i * 89;
            const angle = (spotSeed * 0.1) % (Math.PI * 2);
            const radius = 0.15 + ((spotSeed * 97) % 100) / 100 * 0.25;

            const x = 0.5 + Math.cos(angle) * radius;
            const y = 0.5 + Math.sin(angle) * radius;
            const size = isWhite ? 0.18 : 0.08 + ((spotSeed * 101) % 100) / 100 * 0.12;
            const intensity = isWhite ? 0.95 : 0.7 + ((spotSeed * 103) % 100) / 100 * 0.3;
            const isEdge = ((spotSeed * 131) % 100) < 60;

            spots.push({ x, y, size, intensity, isEdge, angle });
        }

        return spots;
    }    drawChiclet(ctx, x, y, color, variant, pieceData = null) {
        const size = this.blockSize;
        const isPiece = pieceData !== null;
        const style = this.getChicletStyle(variant, color, isPiece);
        const cornerRadius = Math.min(4 * this.scale, size * 0.15); // Scale corner radius

        // Draw shape with edge variations
        ctx.beginPath();

        // Top edge
        ctx.moveTo(x + cornerRadius, y);
        if (style.topCurve) {
            ctx.quadraticCurveTo(
                x + size/2, y + style.topVar,
                x + size - cornerRadius, y
            );
        } else {
            ctx.lineTo(x + size - cornerRadius, y);
        }

        // Top-right corner
        ctx.quadraticCurveTo(x + size, y, x + size, y + cornerRadius);

        // Right edge
        if (style.rightCurve) {
            ctx.quadraticCurveTo(
                x + size + style.rightVar, y + size/2,
                x + size, y + size - cornerRadius
            );
        } else {
            ctx.lineTo(x + size, y + size - cornerRadius);
        }

        // Bottom-right corner
        ctx.quadraticCurveTo(x + size, y + size, x + size - cornerRadius, y + size);

        // Bottom edge
        if (style.bottomCurve) {
            ctx.quadraticCurveTo(
                x + size/2, y + size + style.bottomVar,
                x + cornerRadius, y + size
            );
        } else {
            ctx.lineTo(x + cornerRadius, y + size);
        }

        // Bottom-left corner
        ctx.quadraticCurveTo(x, y + size, x, y + size - cornerRadius);

        // Left edge
        if (style.leftCurve) {
            ctx.quadraticCurveTo(
                x + style.leftVar, y + size/2,
                x, y + cornerRadius
            );
        } else {
            ctx.lineTo(x, y + cornerRadius);
        }

        // Top-left corner
        ctx.quadraticCurveTo(x, y, x + cornerRadius, y);
        ctx.closePath();        // Fill with edge color
        ctx.fillStyle = style.edge;
        ctx.fill();

        // Gradient fill with validation
        const centerX = x + size/2;
        const centerY = y + size/2;
        const innerRadius = Math.max(0, size * 0.15);
        const outerRadius = Math.max(innerRadius + 1, size * 0.9);
        
        // Apply gradient if parameters are valid
        if (Number.isFinite(centerX) && Number.isFinite(centerY) && 
            Number.isFinite(innerRadius) && Number.isFinite(outerRadius) &&
            outerRadius > 0) {
            try {
                const gradient = ctx.createRadialGradient(
                    centerX, centerY, innerRadius,
                    centerX, centerY, outerRadius
                );

                gradient.addColorStop(0, style.middle);
                gradient.addColorStop(0.6, color);
                gradient.addColorStop(1, style.edge);

                ctx.fillStyle = gradient;
                ctx.fill();
            } catch (error) {
                // Fallback to solid color
                ctx.fillStyle = color;
                ctx.fill();
            }
        } else {
            // Fallback to solid color for invalid parameters
            ctx.fillStyle = color;
            ctx.fill();
        }

        // Draw shine spots
        ctx.save();
        ctx.clip();        style.shineSpots.forEach(spot => {
            const spotX = x + spot.x * size;
            const spotY = y + spot.y * size;
            const spotSize = Math.max(0.1, spot.size * size); // Prevent zero/negative size

            // Validate spot position
            if (!Number.isFinite(spotX) || !Number.isFinite(spotY) || !Number.isFinite(spotSize)) {
                return; // Skip invalid spots
            }

            if (spot.isEdge) {
                // Elongated edge highlights
                ctx.save();
                ctx.translate(spotX, spotY);
                ctx.rotate(spot.angle);
                ctx.scale(1, 2.5);

                try {
                    const shine = ctx.createRadialGradient(0, 0, 0, 0, 0, spotSize);
                    shine.addColorStop(0, `rgba(255, 255, 255, ${spot.intensity})`);
                    shine.addColorStop(0.5, `rgba(255, 255, 255, ${spot.intensity * 0.3})`);
                    shine.addColorStop(1, 'rgba(255, 255, 255, 0)');

                    ctx.fillStyle = shine;
                    ctx.beginPath();
                    ctx.arc(0, 0, spotSize, 0, Math.PI * 2);
                    ctx.fill();
                } catch (error) {
                    // Skip this spot on error
                }
                ctx.restore();
            } else {
                // Round shine spots
                try {
                    const shine = ctx.createRadialGradient(spotX, spotY, 0, spotX, spotY, spotSize);
                    shine.addColorStop(0, `rgba(255, 255, 255, ${spot.intensity})`);
                    shine.addColorStop(0.6, `rgba(255, 255, 255, ${spot.intensity * 0.5})`);
                    shine.addColorStop(1, 'rgba(255, 255, 255, 0)');

                    ctx.fillStyle = shine;
                    ctx.beginPath();
                    ctx.arc(spotX, spotY, spotSize, 0, Math.PI * 2);
                    ctx.fill();
                } catch (error) {
                    // Skip this spot on error
                }
            }
        });

        ctx.restore();

        // Edge highlight
        ctx.strokeStyle = style.highlight;
        ctx.lineWidth = 1 * this.scale;
        ctx.globalAlpha = 0.6;

        ctx.beginPath();
        ctx.moveTo(x + cornerRadius, y);
        if (style.topCurve) {
            ctx.quadraticCurveTo(x + size/2, y + style.topVar, x + size - cornerRadius, y);
        } else {
            ctx.lineTo(x + size - cornerRadius, y);
        }
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x + cornerRadius, y);
        ctx.quadraticCurveTo(x, y, x, y + cornerRadius);
        if (style.leftCurve) {
            ctx.quadraticCurveTo(x + style.leftVar, y + size/2, x, y + size - cornerRadius);
        } else {
            ctx.lineTo(x, y + size - cornerRadius);
        }
        ctx.stroke();

        ctx.globalAlpha = 1;

        // Extra subtle glow for white pieces
        if (style.isWhite) {
            ctx.save();
            ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
            ctx.shadowBlur = 4 * this.scale;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1 * this.scale;

            ctx.stroke();
            ctx.restore();
        }

        // Extra glow for black pieces to make them visible
        if (style.isBlack) {
            ctx.save();
            ctx.strokeStyle = 'rgba(192, 192, 192, 0.6)';
            ctx.lineWidth = 2 * this.scale;
            ctx.stroke();
            ctx.restore();
        }
    }
    clearCache() {
        this.cache.clear();
        this.styleCache.clear();
    }
}

// Create a global shared chiclet renderer instance
const globalChicletRenderer = new ChicletRenderer();

/**
 * Simple wrapper function for easy chiclet drawing
 * Compatible with NEONDROP usage patterns
 */
export function drawChiclet(ctx, x, y, size, color, borderColor = '#004488') {
    // Set block size if different
    if (globalChicletRenderer.blockSize !== size) {
        globalChicletRenderer.setBlockSize(size);
    }

    // Initialize if needed
    globalChicletRenderer.initialize();

    // Draw using the existing NEONDROP method
    // The original drawBlock method expects: ctx, x, y, color, boardY, boardX, piece
    globalChicletRenderer.drawBlock(ctx, x, y, color, 0, 0, null);
}

