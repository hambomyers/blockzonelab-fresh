/**
 * NeonDropHeader - Reusable Neon Drop Animation Component
 * Creates the animated "NEON DROP" chiclet effect for consistent branding
 */
export class NeonDropHeader {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        this.options = {
            size: options.size || 'normal', // 'small', 'normal', 'large'
            showSubtitle: options.showSubtitle !== false,
            subtitle: options.subtitle || 'Professional Gaming Platform',
            animationDelay: options.animationDelay || 100,
            ...options
        };
        
        this.init();
    }

    init() {
        if (!this.container) {
            console.error('NeonDropHeader: Container not found');
            return;
        }

        this.createStyles();
        this.createHTML();
        this.startAnimation();
    }

    createStyles() {
        const styleId = 'neon-drop-header-styles';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            /* NEON DROP HEADER COMPONENT STYLES */
            .neon-drop-header {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
                margin-bottom: 2rem;
                position: relative;
                z-index: 10;
            }

            .neon-chiclet-title {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 2px;
                margin-bottom: 1rem;
                filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.4));
            }

            .chiclet-word {
                display: flex;
                gap: 2px;
            }

            .chiclet-spacer {
                width: var(--chiclet-size);
                height: var(--chiclet-size);
            }

            .chiclet {
                width: var(--chiclet-size);
                height: var(--chiclet-size);
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: 'Bungee', monospace;
                font-weight: bold;
                font-size: var(--chiclet-font-size);
                line-height: 1;
                border-radius: 3px;
                position: relative;
                text-align: center;
                text-shadow: 1px 1px 0 #000000;
                transform: translateY(-30px) scale(0.3) rotate(10deg);
                opacity: 0;
                transition: transform 0.3s ease;
                animation: chicletEntrance 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                cursor: pointer;
            }

            .chiclet:hover {
                transform: translateY(0) scale(1.1) rotate(-2deg);
                transition: transform 0.2s ease;
            }

            .chiclet.neon {
                background: linear-gradient(135deg, #FFFF00 0%, #FFD700 50%, #FFA500 100%);
                color: transparent;
                box-shadow: 
                    inset 2px 2px 4px rgba(255, 255, 255, 0.3),
                    inset -2px -2px 4px rgba(0, 0, 0, 0.3),
                    0 0 15px rgba(255, 255, 0, 0.6),
                    0 0 30px rgba(255, 255, 0, 0.3);
                background-clip: text;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }

            .chiclet.drop {
                background: linear-gradient(135deg, #8A2BE2 0%, #9932CC 50%, #DA70D6 100%);
                color: transparent;
                box-shadow: 
                    inset 2px 2px 4px rgba(255, 255, 255, 0.3),
                    inset -2px -2px 4px rgba(0, 0, 0, 0.3),
                    0 0 15px rgba(138, 43, 226, 0.6),
                    0 0 30px rgba(138, 43, 226, 0.3);
                background-clip: text;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }

            /* Size variants */
            .neon-drop-header.small {
                --chiclet-size: 16px;
                --chiclet-font-size: 18px;
            }

            .neon-drop-header.normal {
                --chiclet-size: 24px;
                --chiclet-font-size: 28px;
            }

            .neon-drop-header.large {
                --chiclet-size: 32px;
                --chiclet-font-size: 36px;
            }

            /* Animation delays for staggered entrance */
            .chiclet:nth-child(1) { animation-delay: 0.1s; }
            .chiclet:nth-child(2) { animation-delay: 0.2s; }
            .chiclet:nth-child(3) { animation-delay: 0.3s; }
            .chiclet:nth-child(4) { animation-delay: 0.4s; }
            .chiclet:nth-child(5) { animation-delay: 0.5s; }
            .chiclet:nth-child(6) { animation-delay: 0.6s; }
            .chiclet:nth-child(7) { animation-delay: 0.7s; }
            .chiclet:nth-child(8) { animation-delay: 0.8s; }

            @keyframes chicletEntrance {
                0% { 
                    transform: translateY(-40px) scale(0.3) rotate(15deg); 
                    opacity: 0; 
                }
                60% { 
                    transform: translateY(3px) scale(1.15) rotate(-5deg); 
                    opacity: 0.9; 
                }
                100% { 
                    transform: translateY(0) scale(1) rotate(0deg); 
                    opacity: 1; 
                }
            }

            .neon-subtitle {
                font-size: 1.1rem;
                font-weight: 500;
                color: #a0a0a0;
                text-align: center;
                margin-top: 0.5rem;
                opacity: 0;
                animation: subtitleFadeIn 0.8s ease-out 1.2s forwards;
                letter-spacing: 0.5px;
            }

            @keyframes subtitleFadeIn {
                0% { 
                    opacity: 0; 
                    transform: translateY(10px); 
                }
                100% { 
                    opacity: 1; 
                    transform: translateY(0); 
                }
            }

            /* Responsive adjustments */
            @media (max-width: 768px) {
                .neon-drop-header.large {
                    --chiclet-size: 24px;
                    --chiclet-font-size: 28px;
                }
                
                .neon-drop-header.normal {
                    --chiclet-size: 20px;
                    --chiclet-font-size: 24px;
                }
                
                .neon-drop-header.small {
                    --chiclet-size: 16px;
                    --chiclet-font-size: 18px;
                }

                .neon-subtitle {
                    font-size: 0.95rem;
                }
            }

            @media (max-width: 480px) {
                .chiclet-word {
                    gap: 1px;
                }
                
                .chiclet-spacer {
                    width: calc(var(--chiclet-size) * 0.8);
                }

                .neon-subtitle {
                    font-size: 0.85rem;
                    padding: 0 1rem;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    createHTML() {
        const headerDiv = document.createElement('div');
        headerDiv.className = `neon-drop-header ${this.options.size}`;
        
        const titleDiv = document.createElement('div');
        titleDiv.className = 'neon-chiclet-title';
        
        // Create NEON word
        const neonWord = document.createElement('div');
        neonWord.className = 'chiclet-word';
        
        const neonLetters = ['N', 'E', 'O', 'N'];
        neonLetters.forEach(letter => {
            const chiclet = document.createElement('div');
            chiclet.className = 'chiclet neon';
            chiclet.textContent = letter;
            neonWord.appendChild(chiclet);
        });
        
        // Create spacer
        const spacer = document.createElement('div');
        spacer.className = 'chiclet-spacer';
        
        // Create DROP word
        const dropWord = document.createElement('div');
        dropWord.className = 'chiclet-word';
        
        const dropLetters = ['D', 'R', 'O', 'P'];
        dropLetters.forEach(letter => {
            const chiclet = document.createElement('div');
            chiclet.className = 'chiclet drop';
            chiclet.textContent = letter;
            dropWord.appendChild(chiclet);
        });
        
        titleDiv.appendChild(neonWord);
        titleDiv.appendChild(spacer);
        titleDiv.appendChild(dropWord);
        headerDiv.appendChild(titleDiv);
        
        // Add subtitle if enabled
        if (this.options.showSubtitle) {
            const subtitle = document.createElement('div');
            subtitle.className = 'neon-subtitle';
            subtitle.textContent = this.options.subtitle;
            headerDiv.appendChild(subtitle);
        }
        
        this.container.appendChild(headerDiv);
        this.headerElement = headerDiv;
    }

    startAnimation() {
        // Animation is handled by CSS, but we can add interactive effects
        if (this.headerElement) {
            const chiclets = this.headerElement.querySelectorAll('.chiclet');
            chiclets.forEach((chiclet, index) => {
                chiclet.addEventListener('mouseenter', () => {
                    chiclet.style.transform = 'translateY(0) scale(1.2) rotate(-3deg)';
                });
                
                chiclet.addEventListener('mouseleave', () => {
                    chiclet.style.transform = 'translateY(0) scale(1) rotate(0deg)';
                });
            });
        }
    }

    // Method to update subtitle
    updateSubtitle(newSubtitle) {
        const subtitleElement = this.headerElement?.querySelector('.neon-subtitle');
        if (subtitleElement) {
            subtitleElement.textContent = newSubtitle;
        }
    }

    // Method to trigger re-animation
    replay() {
        if (this.headerElement) {
            const chiclets = this.headerElement.querySelectorAll('.chiclet');
            chiclets.forEach(chiclet => {
                chiclet.style.animation = 'none';
                chiclet.offsetHeight; // Trigger reflow
                chiclet.style.animation = 'chicletEntrance 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';
            });
        }
    }

    // Method to destroy the component
    destroy() {
        if (this.headerElement) {
            this.headerElement.remove();
        }
    }
}

// Export for use in other modules
export default NeonDropHeader;
