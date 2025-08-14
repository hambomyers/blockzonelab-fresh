/**
 * ProfessionalFrame - Reusable Professional UI Frame Component
 * Creates a clean, centered, padded frame for consistent page layouts
 */
export class ProfessionalFrame {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        this.options = {
            showHeader: options.showHeader !== false,
            headerSize: options.headerSize || 'normal',
            headerSubtitle: options.headerSubtitle || 'Professional Gaming Platform',
            padding: options.padding || 'normal', // 'tight', 'normal', 'spacious'
            maxWidth: options.maxWidth || '900px',
            backgroundColor: options.backgroundColor || 'rgba(20, 20, 30, 0.95)',
            borderRadius: options.borderRadius || '12px',
            shadow: options.shadow !== false,
            responsive: options.responsive !== false,
            ...options
        };
        
        this.init();
    }

    init() {
        if (!this.container) {
            console.error('ProfessionalFrame: Container not found');
            return;
        }

        this.createStyles();
        this.createFrame();
        this.setupResponsive();
    }

    createStyles() {
        const styleId = 'professional-frame-styles';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            /* PROFESSIONAL FRAME COMPONENT STYLES */
            .professional-frame-wrapper {
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 2rem 1rem;
                box-sizing: border-box;
                position: relative;
                background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%);
            }

            .professional-frame {
                width: 100%;
                max-width: var(--frame-max-width);
                background: var(--frame-bg-color);
                border-radius: var(--frame-border-radius);
                padding: var(--frame-padding);
                box-sizing: border-box;
                position: relative;
                overflow: hidden;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .professional-frame.with-shadow {
                box-shadow: 
                    0 20px 40px rgba(0, 0, 0, 0.4),
                    0 8px 16px rgba(0, 0, 0, 0.3),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1);
            }

            /* Padding variants */
            .professional-frame.tight {
                --frame-padding: 1.5rem;
            }

            .professional-frame.normal {
                --frame-padding: 2.5rem;
            }

            .professional-frame.spacious {
                --frame-padding: 3.5rem;
            }

            .frame-content {
                position: relative;
                z-index: 2;
                width: 100%;
                max-height: calc(100vh - 8rem);
                overflow-y: auto;
                overflow-x: hidden;
            }

            /* Custom scrollbar for frame content */
            .frame-content::-webkit-scrollbar {
                width: 8px;
            }

            .frame-content::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 4px;
            }

            .frame-content::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.2);
                border-radius: 4px;
            }

            .frame-content::-webkit-scrollbar-thumb:hover {
                background: rgba(255, 255, 255, 0.3);
            }

            /* Background decorative elements */
            .professional-frame::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 1px;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
                z-index: 1;
            }

            .professional-frame::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: 
                    radial-gradient(circle at 20% 20%, rgba(138, 43, 226, 0.05) 0%, transparent 50%),
                    radial-gradient(circle at 80% 80%, rgba(255, 215, 0, 0.05) 0%, transparent 50%);
                pointer-events: none;
                z-index: 1;
            }

            /* Responsive design */
            @media (max-width: 768px) {
                .professional-frame-wrapper {
                    padding: 1rem 0.5rem;
                    align-items: flex-start;
                    min-height: 100vh;
                }

                .professional-frame {
                    margin-top: 1rem;
                    margin-bottom: 1rem;
                    min-height: calc(100vh - 2rem);
                }

                .professional-frame.tight {
                    --frame-padding: 1rem;
                }

                .professional-frame.normal {
                    --frame-padding: 1.5rem;
                }

                .professional-frame.spacious {
                    --frame-padding: 2rem;
                }

                .frame-content {
                    max-height: calc(100vh - 4rem);
                }
            }

            @media (max-width: 480px) {
                .professional-frame-wrapper {
                    padding: 0.5rem 0.25rem;
                }

                .professional-frame {
                    border-radius: 8px;
                    margin-top: 0.5rem;
                    margin-bottom: 0.5rem;
                    min-height: calc(100vh - 1rem);
                }

                .professional-frame.tight {
                    --frame-padding: 0.75rem;
                }

                .professional-frame.normal {
                    --frame-padding: 1rem;
                }

                .professional-frame.spacious {
                    --frame-padding: 1.5rem;
                }

                .frame-content {
                    max-height: calc(100vh - 2rem);
                }
            }

            /* Animation for frame entrance */
            .professional-frame {
                animation: frameEntrance 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
            }

            @keyframes frameEntrance {
                0% {
                    opacity: 0;
                    transform: translateY(20px) scale(0.98);
                }
                100% {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }

            /* Content sections styling */
            .frame-section {
                margin-bottom: 2rem;
            }

            .frame-section:last-child {
                margin-bottom: 0;
            }

            .frame-section h2 {
                color: #ffffff;
                font-size: 1.5rem;
                font-weight: 600;
                margin-bottom: 1rem;
                text-align: center;
            }

            .frame-section h3 {
                color: #e0e0e0;
                font-size: 1.2rem;
                font-weight: 500;
                margin-bottom: 0.75rem;
            }

            .frame-section p {
                color: #c0c0c0;
                line-height: 1.6;
                margin-bottom: 1rem;
            }

            /* Button styling within frames */
            .frame-button {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                padding: 0.75rem 2rem;
                border-radius: 8px;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                display: inline-block;
                text-decoration: none;
                text-align: center;
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
            }

            .frame-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
            }

            .frame-button:active {
                transform: translateY(0);
            }

            .frame-button.primary {
                background: linear-gradient(135deg, #FFFF00 0%, #FFD700 100%);
                color: #000;
                box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
            }

            .frame-button.primary:hover {
                box-shadow: 0 6px 20px rgba(255, 215, 0, 0.4);
            }

            .frame-button.secondary {
                background: linear-gradient(135deg, #8A2BE2 0%, #9932CC 100%);
                box-shadow: 0 4px 12px rgba(138, 43, 226, 0.3);
            }

            .frame-button.secondary:hover {
                box-shadow: 0 6px 20px rgba(138, 43, 226, 0.4);
            }
        `;
        
        document.head.appendChild(style);
    }

    createFrame() {
        // Clear existing content
        this.container.innerHTML = '';
        
        // Create wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'professional-frame-wrapper';
        
        // Create frame
        const frame = document.createElement('div');
        frame.className = `professional-frame ${this.options.padding}`;
        if (this.options.shadow) {
            frame.classList.add('with-shadow');
        }
        
        // Set CSS custom properties
        frame.style.setProperty('--frame-max-width', this.options.maxWidth);
        frame.style.setProperty('--frame-bg-color', this.options.backgroundColor);
        frame.style.setProperty('--frame-border-radius', this.options.borderRadius);
        
        // Create content container
        const content = document.createElement('div');
        content.className = 'frame-content';
        
        // Add header if enabled
        if (this.options.showHeader) {
            const headerContainer = document.createElement('div');
            headerContainer.className = 'frame-header';
            content.appendChild(headerContainer);
            
            // Import and create NeonDropHeader
            this.createHeader(headerContainer);
        }
        
        // Create main content area
        const mainContent = document.createElement('div');
        mainContent.className = 'frame-main-content';
        content.appendChild(mainContent);
        
        frame.appendChild(content);
        wrapper.appendChild(frame);
        this.container.appendChild(wrapper);
        
        // Store references
        this.frameElement = frame;
        this.contentElement = content;
        this.mainContentElement = mainContent;
        this.headerElement = this.options.showHeader ? headerContainer : null;
    }

    async createHeader(container) {
        try {
            const { NeonDropHeader } = await import('./NeonDropHeader.js');
            this.neonHeader = new NeonDropHeader(container, {
                size: this.options.headerSize,
                subtitle: this.options.headerSubtitle,
                showSubtitle: true
            });
        } catch (error) {
            console.error('Failed to load NeonDropHeader:', error);
            // Fallback header
            container.innerHTML = `
                <div style="text-align: center; margin-bottom: 2rem;">
                    <h1 style="color: #FFD700; font-size: 2.5rem; margin-bottom: 0.5rem; font-family: 'Bungee', monospace;">NEON DROP</h1>
                    <p style="color: #a0a0a0; font-size: 1.1rem;">${this.options.headerSubtitle}</p>
                </div>
            `;
        }
    }

    setupResponsive() {
        if (!this.options.responsive) return;
        
        const handleResize = () => {
            if (this.frameElement) {
                const vh = window.innerHeight * 0.01;
                document.documentElement.style.setProperty('--vh', `${vh}px`);
            }
        };
        
        window.addEventListener('resize', handleResize);
        handleResize();
        
        // Store for cleanup
        this.resizeHandler = handleResize;
    }

    // Method to add content to the main area
    setContent(content) {
        if (this.mainContentElement) {
            if (typeof content === 'string') {
                this.mainContentElement.innerHTML = content;
            } else if (content instanceof HTMLElement) {
                this.mainContentElement.innerHTML = '';
                this.mainContentElement.appendChild(content);
            }
        }
    }

    // Method to append content to the main area
    appendContent(content) {
        if (this.mainContentElement) {
            if (typeof content === 'string') {
                this.mainContentElement.insertAdjacentHTML('beforeend', content);
            } else if (content instanceof HTMLElement) {
                this.mainContentElement.appendChild(content);
            }
        }
    }

    // Method to update header subtitle
    updateHeaderSubtitle(subtitle) {
        if (this.neonHeader) {
            this.neonHeader.updateSubtitle(subtitle);
        }
        this.options.headerSubtitle = subtitle;
    }

    // Method to get the main content element for direct manipulation
    getContentElement() {
        return this.mainContentElement;
    }

    // Method to show loading state
    showLoading(message = 'Loading...') {
        if (this.mainContentElement) {
            this.mainContentElement.innerHTML = `
                <div style="text-align: center; padding: 3rem 1rem; color: #a0a0a0;">
                    <div style="width: 40px; height: 40px; border: 3px solid rgba(255, 255, 255, 0.1); border-top: 3px solid #FFD700; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
                    <p>${message}</p>
                </div>
                <style>
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            `;
        }
    }

    // Method to show error state
    showError(message = 'Something went wrong') {
        if (this.mainContentElement) {
            this.mainContentElement.innerHTML = `
                <div style="text-align: center; padding: 3rem 1rem; color: #ff6b6b;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
                    <h3 style="color: #ff6b6b; margin-bottom: 1rem;">Error</h3>
                    <p style="color: #a0a0a0;">${message}</p>
                </div>
            `;
        }
    }

    // Method to destroy the component
    destroy() {
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
        }
        
        if (this.neonHeader) {
            this.neonHeader.destroy();
        }
        
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// Export for use in other modules
export default ProfessionalFrame;
