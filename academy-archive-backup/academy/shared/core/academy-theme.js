/**
 * BlockZone Academy - Theme Management System
 * Handles dynamic theme switching and customization
 */

class AcademyThemeManager {
    constructor() {
        this.currentTheme = 'default';
        this.availableThemes = ['default', 'light', 'dark', 'bitcoin', 'austrian'];
        this.customThemes = {};
        this.themePreferences = {};
        this.eventBus = new EventTarget();
        
        this.init();
    }
    
    init() {
        this.loadThemePreferences();
        this.setupThemeDetection();
        this.setupThemeControls();
        this.applyCurrentTheme();
    }
    
    /**
     * Load theme preferences from localStorage
     */
    loadThemePreferences() {
        try {
            const savedTheme = localStorage.getItem('academy-theme');
            if (savedTheme && this.availableThemes.includes(savedTheme)) {
                this.currentTheme = savedTheme;
            }
            
            const savedPreferences = localStorage.getItem('academy-theme-preferences');
            if (savedPreferences) {
                this.themePreferences = JSON.parse(savedPreferences);
            }
            
            const savedCustomThemes = localStorage.getItem('academy-custom-themes');
            if (savedCustomThemes) {
                this.customThemes = JSON.parse(savedCustomThemes);
            }
        } catch (error) {
            console.warn('Failed to load theme preferences:', error);
        }
    }
    
    /**
     * Save theme preferences to localStorage
     */
    saveThemePreferences() {
        try {
            localStorage.setItem('academy-theme', this.currentTheme);
            localStorage.setItem('academy-theme-preferences', JSON.stringify(this.themePreferences));
            localStorage.setItem('academy-custom-themes', JSON.stringify(this.customThemes));
        } catch (error) {
            console.warn('Failed to save theme preferences:', error);
        }
    }
    
    /**
     * Setup automatic theme detection
     */
    setupThemeDetection() {
        // Check system preference
        if (window.matchMedia) {
            const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
            const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
            
            // Handle system theme changes
            darkModeQuery.addEventListener('change', (e) => {
                if (this.currentTheme === 'default') {
                    this.applySystemTheme(e.matches ? 'dark' : 'light');
                }
            });
            
            // Handle high contrast changes
            highContrastQuery.addEventListener('change', (e) => {
                this.applyHighContrast(e.matches);
            });
            
            // Handle reduced motion changes
            reducedMotionQuery.addEventListener('change', (e) => {
                this.applyReducedMotion(e.matches);
            });
            
            // Apply initial system preferences
            if (this.currentTheme === 'default') {
                this.applySystemTheme(darkModeQuery.matches ? 'dark' : 'light');
            }
        }
    }
    
    /**
     * Setup theme control elements
     */
    setupThemeControls() {
        // Create theme toggle button if it doesn't exist
        if (!document.querySelector('[data-theme-toggle]')) {
            this.createThemeToggle();
        }
        
        // Create theme selector if it doesn't exist
        if (!document.querySelector('[data-theme-selector]')) {
            this.createThemeSelector();
        }
        
        // Create custom theme editor if it doesn't exist
        if (!document.querySelector('[data-theme-editor]')) {
            this.createThemeEditor();
        }
    }
    
    /**
     * Create theme toggle button
     */
    createThemeToggle() {
        const toggle = document.createElement('button');
        toggle.setAttribute('data-theme-toggle', '');
        toggle.className = 'theme-toggle-btn';
        toggle.innerHTML = `
            <span class="theme-icon">🎨</span>
            <span class="theme-label">Theme</span>
        `;
        
        toggle.addEventListener('click', () => {
            this.cycleTheme();
        });
        
        // Insert into header if available
        const header = document.querySelector('.academy-header');
        if (header) {
            const nav = header.querySelector('.main-nav');
            if (nav) {
                nav.appendChild(toggle);
            }
        }
    }
    
    /**
     * Create theme selector dropdown
     */
    createThemeSelector() {
        const selector = document.createElement('div');
        selector.setAttribute('data-theme-selector', '');
        selector.className = 'theme-selector';
        selector.innerHTML = `
            <select class="theme-select">
                <option value="default">System Default</option>
                <option value="light">Light Theme</option>
                <option value="dark">Dark Theme</option>
                <option value="bitcoin">Bitcoin Theme</option>
                <option value="austrian">Austrian Economics</option>
            </select>
        `;
        
        const select = selector.querySelector('.theme-select');
        select.value = this.currentTheme;
        
        select.addEventListener('change', (e) => {
            this.setTheme(e.target.value);
        });
        
        // Insert into header if available
        const header = document.querySelector('.academy-header');
        if (header) {
            const nav = header.querySelector('.main-nav');
            if (nav) {
                nav.appendChild(selector);
            }
        }
    }
    
    /**
     * Create custom theme editor
     */
    createThemeEditor() {
        const editor = document.createElement('div');
        editor.setAttribute('data-theme-editor', '');
        editor.className = 'theme-editor';
        editor.innerHTML = `
            <button class="theme-editor-toggle">Customize Theme</button>
            <div class="theme-editor-panel" style="display: none;">
                <h4>Custom Theme Editor</h4>
                <div class="color-controls">
                    <label>
                        Primary Color:
                        <input type="color" data-color="primary" value="#6366f1">
                    </label>
                    <label>
                        Secondary Color:
                        <input type="color" data-color="secondary" value="#10b981">
                    </label>
                    <label>
                        Accent Color:
                        <input type="color" data-color="accent" value="#f59e0b">
                    </label>
                </div>
                <div class="theme-actions">
                    <button class="save-theme">Save Theme</button>
                    <button class="reset-theme">Reset</button>
                </div>
            </div>
        `;
        
        // Setup editor functionality
        this.setupThemeEditor(editor);
        
        // Insert into header if available
        const header = document.querySelector('.academy-header');
        if (header) {
            const nav = header.querySelector('.main-nav');
            if (nav) {
                nav.appendChild(editor);
            }
        }
    }
    
    /**
     * Setup theme editor functionality
     */
    setupThemeEditor(editor) {
        const toggle = editor.querySelector('.theme-editor-toggle');
        const panel = editor.querySelector('.theme-editor-panel');
        const saveBtn = editor.querySelector('.save-theme');
        const resetBtn = editor.querySelector('.reset-theme');
        const colorInputs = editor.querySelectorAll('input[type="color"]');
        
        // Toggle editor panel
        toggle.addEventListener('click', () => {
            const isVisible = panel.style.display !== 'none';
            panel.style.display = isVisible ? 'none' : 'block';
        });
        
        // Save custom theme
        saveBtn.addEventListener('click', () => {
            const themeName = `custom-${Date.now()}`;
            const colors = {};
            
            colorInputs.forEach(input => {
                colors[input.dataset.color] = input.value;
            });
            
            this.createCustomTheme(themeName, colors);
        });
        
        // Reset to current theme
        resetBtn.addEventListener('click', () => {
            this.applyCurrentTheme();
        });
        
        // Live preview
        colorInputs.forEach(input => {
            input.addEventListener('input', () => {
                this.previewCustomTheme();
            });
        });
    }
    
    /**
     * Apply system theme
     */
    applySystemTheme(theme) {
        this.currentTheme = theme;
        this.applyTheme(theme);
        this.saveThemePreferences();
    }
    
    /**
     * Apply high contrast mode
     */
    applyHighContrast(enabled) {
        const root = document.documentElement;
        if (enabled) {
            root.setAttribute('data-high-contrast', 'true');
        } else {
            root.removeAttribute('data-high-contrast');
        }
    }
    
    /**
     * Apply reduced motion mode
     */
    applyReducedMotion(enabled) {
        const root = document.documentElement;
        if (enabled) {
            root.setAttribute('data-reduced-motion', 'true');
        } else {
            root.removeAttribute('data-reduced-motion');
        }
    }
    
    /**
     * Cycle through available themes
     */
    cycleTheme() {
        const currentIndex = this.availableThemes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % this.availableThemes.length;
        const nextTheme = this.availableThemes[nextIndex];
        
        this.setTheme(nextTheme);
    }
    
    /**
     * Set specific theme
     */
    setTheme(theme) {
        if (this.availableThemes.includes(theme) || this.customThemes[theme]) {
            this.currentTheme = theme;
            this.applyTheme(theme);
            this.saveThemePreferences();
            
            // Update theme selector if it exists
            const selector = document.querySelector('.theme-select');
            if (selector) {
                selector.value = theme;
            }
            
            // Dispatch theme change event
            this.eventBus.dispatchEvent(new CustomEvent('themeChanged', { 
                detail: { theme } 
            }));
        }
    }
    
    /**
     * Apply theme to document
     */
    applyTheme(theme) {
        const root = document.documentElement;
        
        // Remove existing theme classes
        root.classList.remove(...this.availableThemes.map(t => `theme-${t}`));
        Object.keys(this.customThemes).forEach(t => root.classList.remove(`theme-${t}`));
        
        // Add new theme class
        root.classList.add(`theme-${theme}`);
        root.setAttribute('data-theme', theme);
        
        // Apply theme-specific styles
        this.applyThemeStyles(theme);
        
        // Update theme-specific content
        this.updateThemeContent(theme);
    }
    
    /**
     * Apply theme-specific CSS styles
     */
    applyThemeStyles(theme) {
        let styleElement = document.getElementById('academy-theme-styles');
        
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = 'academy-theme-styles';
            document.head.appendChild(styleElement);
        }
        
        const themeStyles = this.getThemeStyles(theme);
        styleElement.textContent = themeStyles;
    }
    
    /**
     * Get theme-specific CSS styles
     */
    getThemeStyles(theme) {
        const baseStyles = `
            /* Theme: ${theme} */
            [data-theme="${theme}"] {
                transition: all 0.3s ease;
            }
        `;
        
        const themeSpecificStyles = this.getThemeSpecificStyles(theme);
        
        return baseStyles + themeSpecificStyles;
    }
    
    /**
     * Get theme-specific styles
     */
    getThemeSpecificStyles(theme) {
        const themes = {
            light: `
                [data-theme="light"] {
                    --bg-primary: #ffffff;
                    --bg-secondary: #f9fafb;
                    --bg-tertiary: #f3f4f6;
                    --text-primary: #111827;
                    --text-secondary: #6b7280;
                    --text-muted: #9ca3af;
                    --border-primary: #e5e7eb;
                    --border-secondary: #d1d5db;
                    --accent-primary: #6366f1;
                    --accent-secondary: #10b981;
                    --accent-tertiary: #f59e0b;
                    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                }
            `,
            dark: `
                [data-theme="dark"] {
                    --bg-primary: #111827;
                    --bg-secondary: #1f2937;
                    --bg-tertiary: #374151;
                    --text-primary: #f9fafb;
                    --text-secondary: #d1d5db;
                    --text-muted: #9ca3af;
                    --border-primary: #374151;
                    --border-secondary: #4b5563;
                    --accent-primary: #818cf8;
                    --accent-secondary: #34d399;
                    --accent-tertiary: #fbbf24;
                    --shadow-sm: 0 1px 2px 0 rgba(255, 255, 255, 0.05);
                    --shadow-md: 0 4px 6px -1px rgba(255, 255, 255, 0.1);
                    --shadow-lg: 0 10px 15px -3px rgba(255, 255, 255, 0.1);
                }
            `,
            bitcoin: `
                [data-theme="bitcoin"] {
                    --bg-primary: #fff7ed;
                    --bg-secondary: #fed7aa;
                    --bg-tertiary: #fdba74;
                    --text-primary: #7c2d12;
                    --text-secondary: #c2410c;
                    --text-muted: #ea580c;
                    --border-primary: #fb923c;
                    --border-secondary: #f97316;
                    --accent-primary: #f7931a;
                    --accent-secondary: #ffd700;
                    --accent-tertiary: #eab308;
                    --shadow-sm: 0 1px 2px 0 rgba(247, 147, 26, 0.1);
                    --shadow-md: 0 4px 6px -1px rgba(247, 147, 26, 0.2);
                    --shadow-lg: 0 10px 15px -3px rgba(247, 147, 26, 0.3);
                }
            `,
            austrian: `
                [data-theme="austrian"] {
                    --bg-primary: #eff6ff;
                    --bg-secondary: #dbeafe;
                    --bg-tertiary: #bfdbfe;
                    --text-primary: #1e3a8a;
                    --text-secondary: #3b82f6;
                    --text-muted: #60a5fa;
                    --border-primary: #60a5fa;
                    --border-secondary: #93c5fd;
                    --accent-primary: #1e40af;
                    --accent-secondary: #ffd700;
                    --accent-tertiary: #eab308;
                    --shadow-sm: 0 1px 2px 0 rgba(30, 64, 175, 0.1);
                    --shadow-md: 0 4px 6px -1px rgba(30, 64, 175, 0.2);
                    --shadow-lg: 0 10px 15px -3px rgba(30, 64, 175, 0.3);
                }
            `
        };
        
        return themes[theme] || '';
    }
    
    /**
     * Update theme-specific content
     */
    updateThemeContent(theme) {
        // Update theme-specific images
        this.updateThemeImages(theme);
        
        // Update theme-specific text
        this.updateThemeText(theme);
        
        // Update theme-specific icons
        this.updateThemeIcons(theme);
    }
    
    /**
     * Update theme-specific images
     */
    updateThemeImages(theme) {
        const images = document.querySelectorAll('[data-theme-image]');
        
        images.forEach(img => {
            const themeImage = img.dataset.themeImage;
            if (themeImage) {
                const imageMap = JSON.parse(themeImage);
                if (imageMap[theme]) {
                    img.src = imageMap[theme];
                    img.alt = img.alt.replace(/\(.*?\)/, `(${theme} theme)`);
                }
            }
        });
    }
    
    /**
     * Update theme-specific text
     */
    updateThemeText(theme) {
        const textElements = document.querySelectorAll('[data-theme-text]');
        
        textElements.forEach(element => {
            const themeText = element.dataset.themeText;
            if (themeText) {
                const textMap = JSON.parse(themeText);
                if (textMap[theme]) {
                    element.textContent = textMap[theme];
                }
            }
        });
    }
    
    /**
     * Update theme-specific icons
     */
    updateThemeIcons(theme) {
        const iconElements = document.querySelectorAll('[data-theme-icon]');
        
        iconElements.forEach(element => {
            const themeIcon = element.dataset.themeIcon;
            if (themeIcon) {
                const iconMap = JSON.parse(themeIcon);
                if (iconMap[theme]) {
                    element.innerHTML = iconMap[theme];
                }
            }
        });
    }
    
    /**
     * Create custom theme
     */
    createCustomTheme(name, colors) {
        const customTheme = {
            name,
            colors,
            createdAt: new Date().toISOString()
        };
        
        this.customThemes[name] = customTheme;
        this.availableThemes.push(name);
        
        // Generate CSS for custom theme
        const customCSS = this.generateCustomThemeCSS(name, colors);
        this.applyCustomThemeCSS(customCSS);
        
        // Save preferences
        this.saveThemePreferences();
        
        // Switch to custom theme
        this.setTheme(name);
        
        return customTheme;
    }
    
    /**
     * Generate CSS for custom theme
     */
    generateCustomThemeCSS(name, colors) {
        return `
            [data-theme="${name}"] {
                --bg-primary: ${colors.primary || '#6366f1'};
                --bg-secondary: ${colors.secondary || '#10b981'};
                --bg-tertiary: ${colors.accent || '#f59e0b'};
                --text-primary: ${this.getContrastColor(colors.primary)};
                --text-secondary: ${this.getContrastColor(colors.secondary)};
                --accent-primary: ${colors.primary || '#6366f1'};
                --accent-secondary: ${colors.secondary || '#10b981'};
                --accent-tertiary: ${colors.accent || '#f59e0b'};
            }
        `;
    }
    
    /**
     * Apply custom theme CSS
     */
    applyCustomThemeCSS(css) {
        let customStyleElement = document.getElementById('academy-custom-theme-styles');
        
        if (!customStyleElement) {
            customStyleElement = document.createElement('style');
            customStyleElement.id = 'academy-custom-theme-styles';
            document.head.appendChild(customStyleElement);
        }
        
        customStyleElement.textContent = css;
    }
    
    /**
     * Get contrast color for text
     */
    getContrastColor(hexColor) {
        // Convert hex to RGB
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        
        // Calculate luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        // Return black or white based on luminance
        return luminance > 0.5 ? '#000000' : '#ffffff';
    }
    
    /**
     * Preview custom theme
     */
    previewCustomTheme() {
        const colorInputs = document.querySelectorAll('[data-theme-editor] input[type="color"]');
        const colors = {};
        
        colorInputs.forEach(input => {
            colors[input.dataset.color] = input.value;
        });
        
        const previewCSS = this.generateCustomThemeCSS('preview', colors);
        this.applyCustomThemeCSS(previewCSS);
        
        // Apply preview theme temporarily
        document.documentElement.setAttribute('data-theme', 'preview');
        document.documentElement.classList.add('theme-preview');
    }
    
    /**
     * Get current theme
     */
    getCurrentTheme() {
        return this.currentTheme;
    }
    
    /**
     * Get available themes
     */
    getAvailableThemes() {
        return [...this.availableThemes];
    }
    
    /**
     * Get custom themes
     */
    getCustomThemes() {
        return { ...this.customThemes };
    }
    
    /**
     * Delete custom theme
     */
    deleteCustomTheme(name) {
        if (this.customThemes[name]) {
            delete this.customThemes[name];
            this.availableThemes = this.availableThemes.filter(t => t !== name);
            this.saveThemePreferences();
            
            // Switch to default theme if current theme was deleted
            if (this.currentTheme === name) {
                this.setTheme('default');
            }
            
            return true;
        }
        return false;
    }
    
    /**
     * Export theme configuration
     */
    exportThemeConfig() {
        const config = {
            currentTheme: this.currentTheme,
            availableThemes: this.availableThemes,
            customThemes: this.customThemes,
            themePreferences: this.themePreferences,
            exportedAt: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(config, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = 'academy-theme-config.json';
        link.click();
    }
    
    /**
     * Import theme configuration
     */
    async importThemeConfig(file) {
        try {
            const text = await file.text();
            const config = JSON.parse(text);
            
            // Validate config
            if (config.availableThemes && config.customThemes) {
                this.availableThemes = config.availableThemes;
                this.customThemes = config.customThemes;
                this.themePreferences = config.themePreferences || {};
                
                // Apply imported theme if it exists
                if (config.currentTheme && this.availableThemes.includes(config.currentTheme)) {
                    this.setTheme(config.currentTheme);
                }
                
                this.saveThemePreferences();
                return true;
            }
        } catch (error) {
            console.error('Error importing theme config:', error);
            return false;
        }
    }
    
    /**
     * Apply current theme
     */
    applyCurrentTheme() {
        this.applyTheme(this.currentTheme);
    }
}

// Initialize Theme Manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.academyThemeManager = new AcademyThemeManager();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AcademyThemeManager;
} 