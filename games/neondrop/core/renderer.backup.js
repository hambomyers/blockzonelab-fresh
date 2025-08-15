/**
 * PREMIUM WEB3 GAMING RENDERER - COMPLETE VERSION
 * 
 * Built for visual excellence on modern hardware.
 * This renderer pushes the boundaries of what's possible in a browser,
 * creating stunning visual experiences that rival native games.
 * 
 * Philosophy: High-end devices deserve cutting-edge visuals.
 * Low-end devices get graceful degradation, but we optimize for WOW factor.
 */

import * as Physics from './physics-pure.js';
import { PIECE_DEFINITIONS, CONSTANTS } from '../config.js';
import { ChicletRenderer } from '../gameplay/chiclet.js';
import { createStarfieldRenderer } from '../gameplay/starfield.js';

export class Renderer {
    constructor(canvas, bgCanvas, config, dimensions = null) {
        this.canvas = canvas;
        this.bgCanvas = bgCanvas;
        
        // Enable premium canvas features
        this.ctx = canvas.getContext('2d', {
            alpha: true,
            desynchronized: true,
            willReadFrequently: false,
            powerPreference: 'high-performance'
        });
        this.bgCtx = bgCanvas.getContext('2d', {
            alpha: false,
            desynchronized: true,
            powerPreference: 'high-performance'
        });
        
        this.config = config;

        this.dimensions = dimensions || {
            blockSize: 24,
            boardWidth: 240,
            boardHeight: 480,
            canvasWidth: 312,
            canvasHeight: 750,
            boardX: 36,
            boardY: 192
        };

        // Detect device capability for adaptive quality
        this.deviceTier = this.detectDeviceTier();
        this.qualityMultiplier = this.getQualityMultiplier();
        
        if (window.timeStart) window.timeStart('renderer-init');
        console.log(`🎮 Premium Renderer initialized - Device Tier: ${this.deviceTier} (Quality: ${this.qualityMultiplier}x)`);
        if (window.timeEnd) window.timeEnd('renderer-init');

        // Premium rendering systems
        this.chicletRenderer = new ChicletRenderer();
        this.starfieldRenderer = createStarfieldRenderer();
        
        // Advanced visual effects
        this.premiumEffects = {
            bloom: { enabled: this.deviceTier >= 2, intensity: 0.3 },
            chromaticAberration: { enabled: this.deviceTier >= 3, strength: 0.002 },
            volumetricLighting: { enabled: this.deviceTier >= 2, samples: 8 },
            particleComplexity: this.deviceTier >= 2 ? 'ultra' : 'standard',
            shadowQuality: this.deviceTier >= 2 ? 'high' : 'medium',
            reflections: { enabled: this.deviceTier >= 3, quality: 'realtime' }
        };

        // Enhanced animation state with premium features
        this.animations = {
            countdown: { scale: 1, lastNumber: 0, glowIntensity: 0 },
            gameOver: {
                shakeX: 0, shakeY: 0, particles: [], initialized: false,
                startTime: null, stage: 1, impactWaves: [], screenDistortion: 0
            },
            unlock: { alpha: 0, message: '', particleTrail: [], hologramEffect: 0 },
            combo: { scale: 1, count: 0, alpha: 0, energyRings: [], lightBurst: 0 }
        };

        // Premium transition effects
        this.transitionEffects = {
            blur: 0, fadeAlpha: 0, vignetteRadius: 1, desaturation: 0, zoomScale: 1,
            // Premium additions
            pixelate: 0, colorShift: { r: 0, g: 0, b: 0 }, screenTear: 0,
            holographicNoise: 0, energyField: 0, quantumFlicker: 0
        };

        // Advanced lighting system
        this.lighting = {
            ambientIntensity: 0.1,
            dynamicLights: [],
            globalIllumination: this.deviceTier >= 3,
            shadowCascades: this.deviceTier >= 2 ? 3 : 1
        };

        // Premium particle systems
        this.particleSystems = {
            standard: { maxParticles: 100 * this.qualityMultiplier },
            premium: { maxParticles: 500 * this.qualityMultiplier },
            ultra: { maxParticles: 1000 * this.qualityMultiplier }
        };

        // Defer premium initialization to background for performance
        // this.initialize(); // Moved to upgradeToPremiumRenderer()
    }

    detectDeviceTier() {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        
        if (!gl) return 1;
        
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '';
        
        const memory = navigator.deviceMemory || 4;
        const cores = navigator.hardwareConcurrency || 4;
        
        const isPremiumGPU = /RTX|RX 6|RX 7|Apple M[1-9]|A1[4-9]|Snapdragon 8/i.test(renderer);
        const isGamingDevice = memory >= 16 && cores >= 8;
        const isModernMobile = /iPhone1[3-9]|iPad.*A1[4-9]|Pixel [6-9]|Galaxy S2[1-9]/i.test(navigator.userAgent);
        
        if (isPremiumGPU || isGamingDevice || isModernMobile) return 3;
        if (memory >= 8 && cores >= 4) return 2;
        return 1;
    }

    getQualityMultiplier() {
        switch(this.deviceTier) {
            case 3: return 2.0;
            case 2: return 1.5;
            case 1: return 1.0;
            default: return 1.0;
        }
    }

    initialize() {
        this.chicletRenderer.setBlockSize(this.dimensions.blockSize);
        this.chicletRenderer.setScale(this.qualityMultiplier);
        this.precalculateLayouts();
        this.initializePremiumEffects();
        this.gameOverUIReadyDispatched = false;
        
        this.setupAdvancedLighting();
        
        console.log('✨ Premium visual systems initialized');
    }

    initializePremiumEffects() {
        this.edgeGlow = {
            maxDistance: 3 * this.qualityMultiplier,
            baseOpacity: 0.12 * this.qualityMultiplier,
            maxOpacity: 0.25 * this.qualityMultiplier,
            volumetricSamples: this.premiumEffects.volumetricLighting.samples,
            dynamicPulse: true,
            colorShifting: this.deviceTier >= 3,
            
            edges: {
                left: {
                    x: this.dimensions.boardX - (20 * this.qualityMultiplier),
                    y: this.dimensions.boardY,
                    width: 25 * this.qualityMultiplier,
                    height: this.dimensions.boardHeight
                },
                right: {
                    x: this.dimensions.boardX + this.dimensions.boardWidth - (5 * this.qualityMultiplier),
                    y: this.dimensions.boardY,
                    width: 25 * this.qualityMultiplier,
                    height: this.dimensions.boardHeight
                },
                bottom: {
                    x: this.dimensions.boardX,
                    y: this.dimensions.boardY + this.dimensions.boardHeight - (5 * this.qualityMultiplier),
                    width: this.dimensions.boardWidth,
                    height: 25 * this.qualityMultiplier
                }
            }
        };

        if (this.premiumEffects.bloom.enabled) {
            this.bloomBuffer = document.createElement('canvas');
            this.bloomBuffer.width = this.canvas.width;
            this.bloomBuffer.height = this.canvas.height;
            this.bloomCtx = this.bloomBuffer.getContext('2d');
        }
    }

    setupAdvancedLighting() {
        this.lighting.dynamicLights = [
            {
                type: 'ambient',
                color: [0.1, 0.1, 0.2],
                intensity: 0.3
            },
            {
                type: 'directional',
                direction: [0.5, -1, 0.5],
                color: [1, 0.9, 0.8],
                intensity: 0.7
            }
        ];
    }
    
    resetForNewGame() {
        this.gameOverUIReadyDispatched = false;
        
        this.animations.gameOver = {
            shakeX: 0, shakeY: 0, particles: [], initialized: false,
            startTime: null, stage: 1, impactWaves: [], screenDistortion: 0
        };
        
        this.transitionEffects = {
            blur: 0, fadeAlpha: 0, vignetteRadius: 1, desaturation: 0, zoomScale: 1,
            pixelate: 0, colorShift: { r: 0, g: 0, b: 0 }, screenTear: 0,
            holographicNoise: 0, energyField: 0, quantumFlicker: 0
        };
        
        console.log('✨ Premium renderer reset for new game');
    }

    render(state, particles = [], starfieldState = null) {
        this.updateTransitionEffects(state);
        this.clearCanvas();

        if (this.transitionEffects.blur > 0) {
            this.canvas.style.filter = `blur(${this.transitionEffects.blur}px)`;
        } else {
            this.canvas.style.filter = 'none';
        }

        this.renderBackground(starfieldState);

        if (this.transitionEffects.zoomScale !== 1) {
            this.ctx.save();
            const centerX = this.dimensions.boardX + this.dimensions.boardWidth / 2;
            const centerY = this.dimensions.boardY + this.dimensions.boardHeight / 2;
            this.ctx.translate(centerX, centerY);
            this.ctx.scale(this.transitionEffects.zoomScale, this.transitionEffects.zoomScale);
            this.ctx.translate(-centerX, -centerY);
        }

        const shakeActive = this.animations.gameOver.shakeX !== 0;
        if (shakeActive) {
            this.ctx.save();
            this.ctx.translate(
                this.animations.gameOver.shakeX,
                this.animations.gameOver.shakeY
            );
        }

        this.renderBoard(state);
        this.renderActivePieces(state);
        this.renderEdgeGlow(state);
        this.renderParticles(particles);
        this.renderParticlesOverflow(particles);

        if (shakeActive) {
            this.ctx.restore();
            this.updateShake();
        }

        if (this.transitionEffects.zoomScale !== 1) {
            this.ctx.restore();
        }

        this.renderUI(state);
        this.renderPostProcessing(state);
        this.renderOverlays(state);

        if (state.timeDilation && state.timeDilation !== 1) {
            this.renderTimeDilationEffect(state.timeDilation);
        }

        if (state.gameMode === 'practice') {
            this.renderPracticeIndicator();
        }
    }

    updateTransitionEffects(state) {
        if (!state.transition) {
            this.transitionEffects = {
                blur: 0, fadeAlpha: 0, vignetteRadius: 1, desaturation: 0, zoomScale: 1,
                pixelate: 0, colorShift: { r: 0, g: 0, b: 0 }, screenTear: 0,
                holographicNoise: 0, energyField: 0, quantumFlicker: 0
            };
            return;
        }

        const { type, progress } = state.transition;

        switch (type) {
            case 'menu-fade':
                this.transitionEffects.fadeAlpha = progress;
                this.transitionEffects.zoomScale = 1 + (progress * 0.05);
                break;
            case 'countdown-end':
                const pulse = Math.sin(progress * Math.PI);
                this.transitionEffects.zoomScale = 1 + (pulse * 0.02);
                break;
            case 'pause':
                this.transitionEffects.blur = progress * 8;
                break;
            case 'unpause':
                this.transitionEffects.blur = (1 - progress) * 8;
                break;
            case 'game-over-slow':
                this.transitionEffects.zoomScale = 1 - (progress * 0.03);
                break;
            case 'game-over-fade':
                this.transitionEffects.vignetteRadius = 1 - (progress * 0.8);
                this.transitionEffects.desaturation = progress;
                this.transitionEffects.fadeAlpha = progress * 0.8;
                break;
            case 'fade-out':
                this.transitionEffects.fadeAlpha = progress;
                break;
        }
    }

    renderPostProcessing(state) {
        if (this.transitionEffects.desaturation > 0) {
            this.ctx.save();
            this.ctx.globalCompositeOperation = 'saturation';
            this.ctx.fillStyle = `rgba(128, 128, 128, ${this.transitionEffects.desaturation})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.restore();
        }

        if (this.transitionEffects.vignetteRadius < 1) {
            const centerX = this.dimensions.boardX + this.dimensions.boardWidth / 2;
            const centerY = this.dimensions.boardY + this.dimensions.boardHeight / 2;
            const maxRadius = Math.sqrt(
                Math.pow(this.dimensions.boardWidth / 2, 2) +
                Math.pow(this.dimensions.boardHeight / 2, 2)
            );

            const gradient = this.ctx.createRadialGradient(
                centerX, centerY, maxRadius * this.transitionEffects.vignetteRadius,
                centerX, centerY, maxRadius * 1.5
            );
            gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');

            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(
                this.dimensions.boardX,
                this.dimensions.boardY,
                this.dimensions.boardWidth,
                this.dimensions.boardHeight
            );
        }

        if (this.transitionEffects.fadeAlpha > 0) {
            this.ctx.fillStyle = `rgba(0, 0, 0, ${this.transitionEffects.fadeAlpha})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    renderTimeDilationEffect(timeDilation) {
        if (timeDilation >= 0.8) return;

        const centerX = this.dimensions.boardX + this.dimensions.boardWidth / 2;
        const centerY = this.dimensions.boardY + this.dimensions.boardHeight / 2;
        const pulse = Math.sin(Date.now() * 0.01) * 0.05 + 0.95;

        this.ctx.save();
        this.ctx.globalAlpha = (1 - timeDilation) * 0.1;

        const gradient = this.ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, this.dimensions.boardWidth * pulse
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(
            this.dimensions.boardX,
            this.dimensions.boardY,
            this.dimensions.boardWidth,
            this.dimensions.boardHeight
        );

        this.ctx.restore();
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.bgCtx.clearRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);
    }

    renderBackground(starfieldState) {
        if (starfieldState?.enabled) {
            this.starfieldRenderer.render(
                this.bgCtx,
                starfieldState,
                { width: this.bgCanvas.width, height: this.bgCanvas.height }
            );
        } else {
            this.bgCtx.fillStyle = '#000000';
            this.bgCtx.fillRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);
        }
    }

    renderBoard(state) {
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(
            this.dimensions.boardX,
            this.dimensions.boardY,
            this.dimensions.boardWidth,
            this.dimensions.boardHeight
        );

        if (this.config.get('graphics.showGrid')) {
            this.renderGrid();
        }

        this.renderBoardPieces(state.board, state.clearingLines);
    }

    renderBoardPieces(board, clearingLines = []) {
        for (let y = 0; y < board.length; y++) {
            for (let x = 0; x < board[y].length; x++) {
                const color = board[y][x];
                if (!color) continue;

                if (clearingLines.includes(y)) {
                    const flash = Math.sin(Date.now() * 0.05) * 0.5 + 0.5;
                    this.ctx.globalAlpha = 0.5 + flash * 0.5;
                }

                const pixelX = this.dimensions.boardX + x * this.dimensions.blockSize;
                const pixelY = this.dimensions.boardY + y * this.dimensions.blockSize;

                this.chicletRenderer.drawBlock(
                    this.ctx, pixelX, pixelY, color, y, x
                );

                this.ctx.globalAlpha = 1;
            }
        }
    }

    renderActivePieces(state) {
        if (!state.current) return;

        if (this.config.get('graphics.ghostPiece') &&
            (state.phase === 'PLAYING' || state.phase === 'LOCKING')) {
            this.renderGhostPiece(state);
        }

        const hideCurrentPiece = state.phase === 'GAME_OVER' ||
                               (state.phase === 'GAME_OVER_SEQUENCE' && state.gameOverSequencePhase > 0);

        if (!hideCurrentPiece) {
            this.renderCurrentPiece(state);
        }
    }

    renderGhostPiece(state) {
        if (state.shadowY === state.current.gridY) return;

        const opacity = this.config.get('graphics.ghostPieceOpacity') || 0.15;
        this.ctx.globalAlpha = opacity;

        this.drawPieceWithSpawn(
            state.current,
            state.current.gridX,
            state.shadowY,
            0,
            true
        );

        this.ctx.globalAlpha = 1;
    }

    renderCurrentPiece(state) {
        if (!state.current) return;

        let opacity = 1;
        let yOffset = 0;

        if (state.phase === 'PLAYING') {
            if (state.current.gridY < state.shadowY) {
                const progress = Math.min(1, state.gravityAccumulator / state.currentGravityDelay);
                yOffset = progress * this.dimensions.blockSize;

                const currentPixelY = state.current.gridY * this.dimensions.blockSize + yOffset;
                const shadowPixelY = state.shadowY * this.dimensions.blockSize;

                if (currentPixelY > shadowPixelY) {
                    yOffset = shadowPixelY - (state.current.gridY * this.dimensions.blockSize);
                }
            }
        }

        if (state.phase === 'LOCKING' && state.lockTimer && !state.isSpawning) {
            const lockDelay = this.getLockDelay(state.current.type);
            const progress = Math.min(1, state.lockTimer / lockDelay);
            const pulseSpeed = 3 + progress * 12;
            opacity *= Math.sin(Date.now() * 0.001 * pulseSpeed) * 0.3 + 0.7;
        }

        this.ctx.globalAlpha = opacity;

        this.drawPieceWithSpawn(
            state.current,
            state.current.gridX,
            state.current.gridY,
            yOffset,
            false
        );

        this.ctx.globalAlpha = 1;
    }

    drawPieceWithSpawn(piece, gridX, gridY, pixelYOffset, isGhost = false) {
        piece.shape.forEach((row, dy) => {
            row.forEach((cell, dx) => {
                if (!cell) return;

                const x = gridX + dx;
                const y = gridY + dy;

                if (y < -6 || y >= 20 || x < 0 || x >= 10) {
                    return;
                }

                let color = piece.color;

                let blockOpacity = 1.0;
                if (!isGhost) {
                    blockOpacity = Physics.getBlockSpawnOpacity(piece, gridY, pixelYOffset, dy);
                }

                if (isGhost) {
                    color = '#404040';
                } else if (piece.type === 'FLOAT' && piece.upMovesUsed > 0) {
                    const brightness = 255 - (piece.upMovesUsed * 30);
                    const hex = Math.max(0, brightness).toString(16).padStart(2, '0');
                    color = `#${hex}${hex}${hex}`;
                }

                const pixelX = this.dimensions.boardX + x * this.dimensions.blockSize;
                const pixelY = this.dimensions.boardY + y * this.dimensions.blockSize + pixelYOffset;

                this.ctx.save();
                if (isGhost) {
                    this.ctx.globalAlpha = this.ctx.globalAlpha * blockOpacity;
                } else {
                    this.ctx.globalAlpha = blockOpacity;
                }

                try {
                    this.chicletRenderer.drawBlock(
                        this.ctx, pixelX, pixelY, color, y, x,
                        isGhost ? null : piece
                    );
                } catch (error) {
                    this.ctx.fillStyle = color;
                    this.ctx.fillRect(pixelX, pixelY, this.dimensions.blockSize, this.dimensions.blockSize);
                    
                    this.ctx.strokeStyle = '#000000';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(pixelX, pixelY, this.dimensions.blockSize, this.dimensions.blockSize);
                }

                this.ctx.restore();
            });
        });
    }

    renderDeathPiece(piece) {
        if (!piece) return;
        piece.shape.forEach((row, dy) => {
            row.forEach((cell, dx) => {
                if (!cell) return;
                const boardX = piece.gridX + dx;
                const boardY = piece.gridY + dy;
                if (boardX >= 0 && boardX < CONSTANTS.BOARD.WIDTH) {
                    const pixelX = this.dimensions.boardX + boardX * this.dimensions.blockSize;
                    const pixelY = this.dimensions.boardY + boardY * this.dimensions.blockSize;
                    this.chicletRenderer.drawBlock(
                        this.ctx, pixelX, pixelY, '#FF0000', boardY, boardX
                    );
                }
            });
        });
    }

    renderUI(state) {
        this.renderTitle();
        this.renderScore(state);
        this.renderStats(state);
        this.renderPreviewAndHold(state);
        this.renderNotifications(state);
    }

    renderTitle() {
        const blockSize = this.dimensions.blockSize;
        const titleZone = this.dimensions.zones.title;

        for (let i = 0; i < 4; i++) {
            const x = titleZone.x + (i * blockSize);
            this.renderTitleLetter('NEON'[i], x, titleZone.y, '#FFFF00', blockSize);
        }

        for (let i = 0; i < 4; i++) {
            const x = titleZone.x + ((i + 6) * blockSize);
            this.renderTitleLetter('DROP'[i], x, titleZone.y, '#8A2BE2', blockSize);
        }
    }

    renderTitleLetter(letter, x, y, color, size) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = size;
        tempCanvas.height = size;
        const tempCtx = tempCanvas.getContext('2d');

        tempCtx.clearRect(0, 0, size, size);

        this.chicletRenderer.drawBlock(tempCtx, 0, 0, color, 0, 0);

        tempCtx.save();
        tempCtx.globalCompositeOperation = 'destination-out';
        tempCtx.font = `bold ${size * 1.2}px Bungee, monospace`;
        tempCtx.textAlign = 'center';
        tempCtx.textBaseline = 'middle';
        tempCtx.fillText(letter, size / 2, size / 2 + size * 0.1);
        tempCtx.restore();

        tempCtx.strokeStyle = '#000000';
        tempCtx.lineWidth = 1;
        tempCtx.font = `bold ${size * 1.2}px Bungee, monospace`;
        tempCtx.textAlign = 'center';
        tempCtx.textBaseline = 'middle';
        tempCtx.strokeText(letter, size / 2, size / 2 + size * 0.1);

        this.ctx.drawImage(tempCanvas, x, y);
    }

    renderScore(state) {
        if (state.phase === 'COUNTDOWN' || state.phase === 'COUNTDOWN_TO_PLAYING' || state.phase === 'MENU_TO_COUNTDOWN') {
            return;
        }

        const scoreZone = this.dimensions.zones.score;

        this.ctx.font = `${this.dimensions.blockSize * 0.6}px monospace`;
        this.ctx.textBaseline = 'top';

        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(
            `P1 ${state.score.toString().padStart(6, '0')}`,
            scoreZone.x,
            scoreZone.y
        );

        this.ctx.textAlign = 'right';

        if (state.isNewHighScore && state.score > 0) {
            const flash = Math.sin(Date.now() * 0.005) * 0.5 + 0.5;
            this.ctx.fillStyle = `rgb(255, ${Math.floor(255 * flash)}, 0)`;
        } else {
            this.ctx.fillStyle = '#FFFFFF';
        }

        this.ctx.fillText(
            `HS ${(state.displayHighScore || 0).toString().padStart(6, '0')}`,
            scoreZone.x + scoreZone.width,
            scoreZone.y
        );
    }

    renderStats(state) {
        this.statsBottom = this.dimensions.zones.score.y + this.dimensions.blockSize * 0.7;
    }

    renderPreviewAndHold(state) {
        if (state.next && state.phase !== 'GAME_OVER' && state.phase !== 'MENU') {
            const layout = this.pieceLayouts.get(state.next.type);
            if (layout) {
                const scale = 0.75;
                const blockSize = Math.floor(this.dimensions.blockSize * 0.6 * scale);
                const gap = Math.floor(this.dimensions.blockSize * 0.15 * scale);
                const pieceHeight = layout.height * (blockSize + gap) - gap;

                const previewZone = this.dimensions.zones.preview;
                const previewY = previewZone.y - pieceHeight;

                this.renderMiniPieceAtPosition(state.next, previewZone.centerX, previewY, scale, 0.5);
            }
        }

        if (state.hold) {
            const holdZone = this.dimensions.zones.hold;

            const layout = this.pieceLayouts.get(state.hold.type);
            if (layout) {
                const scale = 0.75;
                const opacity = state.canHold ? 0.5 : 0.25;

                this.renderMiniPieceAtPosition(state.hold, holdZone.centerX, holdZone.y, scale, opacity);
            }
        }
    }

    renderMiniPieceAtPosition(piece, centerX, topY, scale, opacity) {
        const layout = this.pieceLayouts.get(piece.type);
        if (!layout) return;

        const blockSize = Math.floor(this.dimensions.blockSize * 0.6 * scale);
        const gap = Math.floor(this.dimensions.blockSize * 0.15 * scale);

        this.ctx.save();
        this.ctx.globalAlpha = opacity;

        const totalWidth = layout.width * (blockSize + gap) - gap;
        const startX = centerX - totalWidth / 2;

        layout.blocks.forEach(({ dx, dy }) => {
            const x = startX + dx * (blockSize + gap);
            const y = topY + dy * (blockSize + gap);

            this.drawMiniBlock(x, y, blockSize, piece.color);
        });

        this.ctx.restore();
    }

    drawMiniBlock(x, y, size, color) {
        const radius = size * 0.3;

        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + size - radius, y);
        this.ctx.quadraticCurveTo(x + size, y, x + size, y + radius);
        this.ctx.lineTo(x + size, y + size - radius);
        this.ctx.quadraticCurveTo(x + size, y + size, x + size - radius, y + size);
        this.ctx.lineTo(x + radius, y + size);
        this.ctx.quadraticCurveTo(x, y + size, x, y + size - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();

        this.ctx.fillStyle = color;
        this.ctx.fill();

        const gradient = this.ctx.createRadialGradient(
            x + size/2, y + size/2, size * 0.1,
            x + size/2, y + size/2, size * 0.7
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');

        this.ctx.fillStyle = gradient;
        this.ctx.fill();
    }

    renderOverlays(state) {
        switch (state.phase) {
            case 'MENU':
                this.renderMenu(state);
                break;
            case 'MENU_TO_COUNTDOWN':
                this.renderMenuTransition(state);
                break;
            case 'COUNTDOWN':
                this.renderCountdown(state);
                break;
            case 'COUNTDOWN_TO_PLAYING':
                this.renderCountdownTransition(state);
                break;
            case 'PLAYING_TO_PAUSE':
            case 'PAUSED':
            case 'PAUSE_TO_PLAYING':
                this.renderPaused(state);
                break;
            case 'GAME_OVER_SEQUENCE':
            case 'GAME_OVER':
            case 'GAME_OVER_TO_MENU':
                this.renderGameOverSequence(state);
                break;
        }
    }

    renderMenu(state) {
        this.dimBoard(0.7);

        this.renderTitle();

        const pulse = Math.sin(Date.now() * 0.001) * 0.3 + 0.7;

        this.ctx.save();
        this.ctx.globalAlpha = pulse;

        this.ctx.font = `${this.dimensions.blockSize * 0.6}px monospace`;
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = '#FFFF00';
        this.ctx.shadowBlur = 10;

        const centerX = this.dimensions.boardX + this.dimensions.boardWidth / 2;
        const promptY = this.dimensions.zones.title.y + this.dimensions.blockSize * 3;
        this.ctx.fillText('PRESS SPACE TO START', centerX, promptY);

        this.ctx.restore();
    }

    renderMenuTransition(state) {
        const progress = state.transition?.progress || 0;
        const fadeOut = 1 - progress;

        this.dimBoard(0.7 * fadeOut);

        if (fadeOut > 0.01) {
            this.ctx.save();
            this.ctx.globalAlpha = fadeOut;

            this.ctx.font = `${this.dimensions.blockSize * 0.7}px monospace`;
            this.ctx.fillStyle = '#FFFF00';
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = '#FFFF00';
            this.ctx.shadowBlur = 10 * fadeOut;

            const centerX = this.dimensions.boardX + this.dimensions.boardWidth / 2;
            const centerY = this.dimensions.boardY + this.dimensions.boardHeight / 2;
            this.ctx.fillText('PRESS SPACE TO START', centerX, centerY);

            this.ctx.restore();
        }
    }

    renderCountdown(state) {
        this.dimBoard(0.5);

        const seconds = Math.ceil((state.countdownTimer || 0) / 1000);

        if (seconds !== this.animations.countdown.lastNumber) {
            this.animations.countdown.lastNumber = seconds;
            this.animations.countdown.scale = 2;
        }

        this.animations.countdown.scale = Math.max(1, this.animations.countdown.scale * 0.95);

        const centerX = this.dimensions.boardX + this.dimensions.boardWidth / 2;
        const centerY = this.dimensions.boardY + this.dimensions.boardHeight / 2;

        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        this.ctx.scale(
            this.animations.countdown.scale,
            this.animations.countdown.scale
        );

        this.ctx.font = `bold ${this.dimensions.blockSize * 3}px monospace`;
        this.ctx.fillStyle = seconds === 1 ? '#FF0000' : '#FFFF00';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.shadowColor = this.ctx.fillStyle;
        this.ctx.shadowBlur = 20;

        this.ctx.fillText(seconds.toString(), 0, 0);

        this.ctx.restore();
    }

    renderCountdownTransition(state) {
        const progress = state.transition?.progress || 0;
        const fadeOut = 1 - progress;

        this.dimBoard(0.5 * fadeOut);

        if (fadeOut > 0.01) {
            const centerX = this.dimensions.boardX + this.dimensions.boardWidth / 2;
            const centerY = this.dimensions.boardY + this.dimensions.boardHeight / 2;

            this.ctx.save();
            this.ctx.globalAlpha = fadeOut;
            this.ctx.translate(centerX, centerY);

            const scale = 1 + (progress * 3);
            this.ctx.scale(scale, scale);

            this.ctx.font = `bold ${this.dimensions.blockSize * 3}px monospace`;
            this.ctx.fillStyle = '#FF0000';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.shadowColor = this.ctx.fillStyle;
            this.ctx.shadowBlur = 20;

            this.ctx.fillText('1', 0, 0);

            this.ctx.restore();
        }
    }

    renderPaused(state) {
        const progress = state.transition?.progress || 1;
        const isUnpausing = state.phase === 'PAUSE_TO_PLAYING';
        const effectiveProgress = isUnpausing ? 1 - progress : progress;

        this.dimBoard(0.7);

        const pulse = Math.sin(Date.now() * 0.003) * 0.1 + 0.9;

        this.ctx.save();

        const yOffset = (1 - effectiveProgress) * -50;
        this.ctx.translate(0, yOffset);

        this.ctx.globalAlpha = effectiveProgress * pulse;

        this.ctx.font = `${this.dimensions.blockSize * 1.5}px monospace`;
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = '#FFFF00';
        this.ctx.shadowBlur = 15;

        const centerX = this.dimensions.boardX + this.dimensions.boardWidth / 2;
        const centerY = this.dimensions.boardY + this.dimensions.boardHeight / 2;

        this.ctx.fillText('PAUSED', centerX, centerY);

        this.ctx.restore();
    }

    renderGameOverSequence(state) {
        const now = Date.now();
        const gameOverElapsed = now - state.gameOverStartTime;
        
        if (gameOverElapsed < 3000) {
            if (state.deathPiece) {
                const blinkSpeed = 2.0;
                const blinkAlpha = Math.sin(now * 0.001 * blinkSpeed * Math.PI) * 0.5 + 0.5;
                
                const phaseProgress = gameOverElapsed / 3000;
                const fadeOut = phaseProgress > 0.8 ? (1 - phaseProgress) / 0.2 : 1;
                
                this.ctx.save();
                this.ctx.globalAlpha = blinkAlpha * fadeOut;
                this.renderDeathPiece(state.deathPiece);
                this.ctx.restore();
            }
            return;
        }
        
        const transitionElapsed = gameOverElapsed - 3000;
        const transitionProgress = Math.min(1, transitionElapsed / 4000);
        
        this.ctx.save();
        this.ctx.globalAlpha = 1 - transitionProgress;
        this.renderBoard(state);
        this.ctx.restore();
        
        this.renderProfessionalGameOverText(state, transitionProgress);
        
        if (transitionProgress >= 1 && !this.gameOverUIReadyDispatched) {
            this.gameOverUIReadyDispatched = true;
            document.dispatchEvent(new CustomEvent('gameOverUIReady', {
                detail: { score: state.score }
            }));
        }
    }
    
    renderProfessionalGameOverText(state, progress) {
        const boardX = this.dimensions.boardX;
        const boardY = this.dimensions.boardY;
        const boardWidth = this.dimensions.boardWidth;
        const boardHeight = this.dimensions.boardHeight;
        
        const centerX = boardX + boardWidth / 2;
        const centerY = boardY + boardHeight / 2;
        
        this.ctx.save();
        
        const textAlpha = Math.min(1, progress * 2);
        this.ctx.globalAlpha = textAlpha;
        
        const fontSize = Math.min(boardWidth * 0.15, boardHeight * 0.1);
        this.ctx.font = `bold ${fontSize}px monospace`;
        this.ctx.fillStyle = '#FF0000';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        this.ctx.shadowColor = '#FF0000';
        this.ctx.shadowBlur = fontSize * 0.2;
        this.ctx.shadowOffsetX = fontSize * 0.02;
        this.ctx.shadowOffsetY = fontSize * 0.02;
        
        this.ctx.fillText('GAME OVER', centerX, centerY);
        
        const pulse = Math.sin(Date.now() * 0.005) * 0.2 + 0.8;
        this.ctx.globalAlpha = textAlpha * pulse * 0.7;
        this.ctx.shadowBlur = fontSize * 0.3;
        this.ctx.fillText('GAME OVER', centerX, centerY);
        
        this.ctx.restore();
    }

    updateShake() {
        if (this.animations.gameOver.shakeX !== 0) {
            this.animations.gameOver.shakeX *= 0.9;
            this.animations.gameOver.shakeY *= 0.9;

            if (Math.abs(this.animations.gameOver.shakeX) < 0.1) {
                this.animations.gameOver.shakeX = 0;
                this.animations.gameOver.shakeY = 0;
            } else {
                this.animations.gameOver.shakeX =
                    (Math.random() - 0.5) * this.animations.gameOver.shakeX;
                this.animations.gameOver.shakeY =
                    (Math.random() - 0.5) * this.animations.gameOver.shakeY;
            }
        }
    }

    renderNotifications(state) {
        if (state.phase === 'GAME_OVER' ||
            state.phase === 'GAME_OVER_SEQUENCE' ||
            state.phase === 'GAME_OVER_TO_MENU') {
            return;
        }

        if (state.lastUnlockScore > 0 &&
            state.score >= state.lastUnlockScore &&
             state.score < state.lastUnlockScore + 1000) {

            if (this.animations.unlock.alpha < 1) {
                this.animations.unlock.alpha = Math.min(1, this.animations.unlock.alpha + 0.1);
                this.animations.unlock.message = 'NEW PIECE UNLOCKED!';
            }

            this.ctx.save();
            this.ctx.globalAlpha = this.animations.unlock.alpha;
            this.ctx.font = `bold ${this.dimensions.blockSize * 0.75}px monospace`;
            this.ctx.fillStyle = '#FFD700';
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = '#FFD700';
            this.ctx.shadowBlur = 10;

            const centerX = this.dimensions.boardX + this.dimensions.boardWidth / 2;
            const notificationY = this.dimensions.boardY - this.dimensions.blockSize * 2 - 5;
            this.ctx.fillText(this.animations.unlock.message, centerX, notificationY);
            this.ctx.restore();
        } else {
            this.animations.unlock.alpha = Math.max(0, this.animations.unlock.alpha - 0.05);
        }

        if (state.combo > 1 &&
            state.phase !== 'GAME_OVER' &&
            state.phase !== 'GAME_OVER_SEQUENCE') {
            
            if (this.animations.combo.count !== state.combo) {
                this.animations.combo.count = state.combo;
                this.animations.combo.scale = 2;
                this.animations.combo.alpha = 1.0;
            }

            this.animations.combo.scale = Math.max(1, this.animations.combo.scale * 0.95);
            this.animations.combo.alpha = Math.max(0, this.animations.combo.alpha - 0.02);

            const centerX = this.dimensions.boardX + this.dimensions.boardWidth / 2;
            const comboY = this.dimensions.boardY + this.dimensions.boardHeight + this.dimensions.blockSize * 2 + 5;

            this.ctx.save();
            this.ctx.globalAlpha = this.animations.combo.alpha;
            this.ctx.font = `bold ${this.dimensions.blockSize * 0.75}px monospace`;
            this.ctx.fillStyle = '#FFD700';
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = '#FFD700';
            this.ctx.shadowBlur = 10;

            this.ctx.fillText(`${state.combo}x COMBO!`, centerX, comboY);
            this.ctx.restore();
        } else {
            this.animations.combo.count = 0;
            this.animations.combo.alpha = 0;
        }
    }

    renderParticles(particles) {
        if (particles.length === 0) return;

        particles.forEach(p => {
            this.ctx.save();
            this.ctx.globalAlpha = p.opacity || 1;

            const x = this.dimensions.boardX + p.x;
            const y = this.dimensions.boardY + p.y;

            if (p.type === 'glow') {
                const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, p.size);
                gradient.addColorStop(0, p.color);
                gradient.addColorStop(0.4, p.color);
                gradient.addColorStop(1, 'transparent');

                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(x - p.size, y - p.size, p.size * 2, p.size * 2);
            } else if (p.type === 'spark') {
                this.ctx.strokeStyle = p.color;
                this.ctx.lineWidth = p.size * 0.5;
                this.ctx.lineCap = 'round';

                this.ctx.beginPath();
                this.ctx.moveTo(x - p.vx * 0.1, y - p.vy * 0.1);
                this.ctx.lineTo(x, y);
                this.ctx.stroke();
            } else if (p.type === 'lightSparkler') {
                // LIGHT: Simple bright white sparkler
                this.ctx.fillStyle = p.color;
                this.ctx.fillRect(x - p.size/2, y - p.size/2, p.size, p.size);
            } else {
                this.ctx.fillStyle = p.color;
                this.ctx.fillRect(x - p.size/2, y - p.size/2, p.size, p.size);
            }

            this.ctx.restore();
        });
    }

    renderParticlesOverflow(particles) {
        if (particles.length === 0) return;

        const gameRect = this.canvas.getBoundingClientRect();

        const overflowParticles = particles.filter(p => {
            const gameX = this.dimensions.boardX + p.x;
            const gameY = this.dimensions.boardY + p.y;

            return gameX < 0 || gameX > this.dimensions.canvasWidth ||
                   gameY < 0 || gameY > this.dimensions.canvasHeight;
        });

        if (overflowParticles.length === 0) return;

        overflowParticles.forEach(p => {
            this.bgCtx.save();
            this.bgCtx.globalAlpha = p.opacity || 1;

            const x = gameRect.left + this.dimensions.boardX + p.x;
            const y = gameRect.top + this.dimensions.boardY + p.y;

            this.bgCtx.fillStyle = p.color;
            this.bgCtx.fillRect(x - p.size/2, y - p.size/2, p.size, p.size);
            this.bgCtx.restore();
        });
    }

    renderEdgeGlow(state) {
        if (!this.config.get('graphics.edgeGlow')) return;

        const glow = { left: 0, right: 0, bottom: 0 };

        if (state.current && (state.phase === 'PLAYING' || state.phase === 'LOCKING')) {
            state.current.shape.forEach((row, dy) => {
                row.forEach((cell, dx) => {
                    if (!cell) return;

                    const blockX = state.current.gridX + dx;
                    const blockY = state.current.gridY + dy;

                    if (blockY < 0) return;

                    if (blockX <= this.edgeGlow.maxDistance) {
                        const intensity = 1 - (blockX / this.edgeGlow.maxDistance);
                        glow.left = Math.max(glow.left, intensity);
                    }

                    if (blockX >= 10 - this.edgeGlow.maxDistance - 1) {
                        const intensity = 1 - ((9 - blockX) / this.edgeGlow.maxDistance);
                        glow.right = Math.max(glow.right, intensity);
                    }

                    if (blockY >= 20 - this.edgeGlow.maxDistance - 1) {
                        const intensity = 1 - ((19 - blockY) / this.edgeGlow.maxDistance);
                        glow.bottom = Math.max(glow.bottom, intensity);
                    }
                });
            });
        }

        this.ctx.save();

        ['left', 'right', 'bottom'].forEach(edge => {
            if (glow[edge] > 0.01) {
                this.renderEdge(edge, glow[edge]);
            }
        });

        this.ctx.restore();
    }

    renderEdge(edge, intensity) {
        const edgeData = this.edgeGlow.edges[edge];
        const opacity = this.edgeGlow.baseOpacity +
                       (this.edgeGlow.maxOpacity - this.edgeGlow.baseOpacity) * intensity;

        let gradient;

        switch(edge) {
            case 'left':
                gradient = this.ctx.createLinearGradient(
                    edgeData.x, edgeData.y,
                    edgeData.x + edgeData.width, edgeData.y
                );
                break;
            case 'right':
                gradient = this.ctx.createLinearGradient(
                    edgeData.x + edgeData.width, edgeData.y,
                    edgeData.x, edgeData.y
                );
                break;
            case 'bottom':
                gradient = this.ctx.createLinearGradient(
                    edgeData.x, edgeData.y + edgeData.height,
                    edgeData.x, edgeData.y
                );
                break;
        }

        gradient.addColorStop(0, 'rgba(138, 43, 226, 0)');
        gradient.addColorStop(0.3, `rgba(138, 43, 226, ${opacity * 0.7})`);
        gradient.addColorStop(0.7, `rgba(138, 43, 226, ${opacity})`);
        gradient.addColorStop(1, 'rgba(138, 43, 226, 0)');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(edgeData.x, edgeData.y, edgeData.width, edgeData.height);
    }

    renderGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;

        this.ctx.beginPath();

        for (let x = 1; x < 10; x++) {
            const xPos = this.dimensions.boardX + x * this.dimensions.blockSize;
            this.ctx.moveTo(xPos, this.dimensions.boardY);
            this.ctx.lineTo(xPos, this.dimensions.boardY + this.dimensions.boardHeight);
        }

        for (let y = 1; y < 20; y++) {
            const yPos = this.dimensions.boardY + y * this.dimensions.blockSize;
            this.ctx.moveTo(this.dimensions.boardX, yPos);
            this.ctx.lineTo(this.dimensions.boardX + this.dimensions.boardWidth, yPos);
        }

        this.ctx.stroke();
    }

    dimBoard(opacity) {
        this.ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
        this.ctx.fillRect(
            this.dimensions.boardX,
            this.dimensions.boardY,
            this.dimensions.boardWidth,
            this.dimensions.boardHeight
        );
    }

    getLockDelay(pieceType) {
        if (pieceType === 'FLOAT') {
            return CONSTANTS.TIMING.LOCK_DELAY_FLOAT;
        }
        return CONSTANTS.TIMING.LOCK_DELAY;
    }

    precalculateLayouts() {
        this.pieceLayouts = new Map();

        Object.entries(PIECE_DEFINITIONS).forEach(([type, def]) => {
            const blocks = [];
            let minX = def.shape[0].length, maxX = 0;
            let minY = def.shape.length, maxY = 0;

            def.shape.forEach((row, y) => {
                row.forEach((cell, x) => {
                    if (cell) {
                        blocks.push({ dx: x, dy: y });
                        minX = Math.min(minX, x);
                        maxX = Math.max(maxX, x);
                        minY = Math.min(minY, y);
                        maxY = Math.max(maxY, y);
                    }
                });
            });

            const normalizedBlocks = blocks.map(b => ({
                dx: b.dx - minX,
                dy: b.dy - minY
            }));

            this.pieceLayouts.set(type, {
                blocks: normalizedBlocks,
                width: maxX - minX + 1,
                height: maxY - minY + 1
            });
        });
    }

    renderPracticeIndicator() {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(128, 128, 128, 0.7)';
        this.ctx.font = '14px monospace';
        this.ctx.fillText('PRACTICE MODE - No Rewards', 10, 25);
        this.ctx.restore();
    }

    toggleGrid() {
        const current = this.config.get('graphics.showGrid');
        this.config.set('graphics.showGrid', !current);
    }

    resetAnimations() {
        this.animations = {
            countdown: { scale: 1, lastNumber: 0, glowIntensity: 0 },
            gameOver: {
                shakeX: 0, shakeY: 0, particles: [], initialized: false,
                startTime: null, stage: 1, impactWaves: [], screenDistortion: 0
            },
            unlock: { alpha: 0, message: '', particleTrail: [], hologramEffect: 0 },
            combo: { scale: 1, count: 0, alpha: 0, energyRings: [], lightBurst: 0 }
        };

        this.transitionEffects = {
            blur: 0, fadeAlpha: 0, vignetteRadius: 1, desaturation: 0, zoomScale: 1,
            pixelate: 0, colorShift: { r: 0, g: 0, b: 0 }, screenTear: 0,
            holographicNoise: 0, energyField: 0, quantumFlicker: 0
        };

        this.canvas.style.filter = 'none';
    }
}
