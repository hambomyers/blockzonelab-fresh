/**
 * BlockZone Academy - Core JavaScript Functionality
 * Provides the foundation for all academy features
 */

class AcademyCore {
    constructor() {
        this.currentTheme = 'default';
        this.currentLesson = null;
        this.currentSection = null;
        this.userProgress = {};
        this.eventBus = new EventTarget();
        
        this.init();
    }
    
    init() {
        this.loadUserPreferences();
        this.setupEventListeners();
        this.initializeComponents();
        this.setupThemeSystem();
    }
    
    /**
     * Load user preferences from localStorage
     */
    loadUserPreferences() {
        try {
            const savedTheme = localStorage.getItem('academy-theme');
            if (savedTheme) {
                this.currentTheme = savedTheme;
            }
            
            const savedProgress = localStorage.getItem('academy-progress');
            if (savedProgress) {
                this.userProgress = JSON.parse(savedProgress);
            }
        } catch (error) {
            console.warn('Failed to load user preferences:', error);
        }
    }
    
    /**
     * Save user preferences to localStorage
     */
    saveUserPreferences() {
        try {
            localStorage.setItem('academy-theme', this.currentTheme);
            localStorage.setItem('academy-progress', JSON.stringify(this.userProgress));
        } catch (error) {
            console.warn('Failed to save user preferences:', error);
        }
    }
    
    /**
     * Setup global event listeners
     */
    setupEventListeners() {
        // Handle theme toggle
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-theme-toggle]')) {
                this.toggleTheme();
            }
        });
        
        // Handle lesson navigation
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-lesson-nav]')) {
                const lessonId = e.target.dataset.lessonNav;
                this.navigateToLesson(lessonId);
            }
        });
        
        // Handle section navigation
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-section-nav]')) {
                const sectionId = e.target.dataset.sectionNav;
                this.navigateToSection(sectionId);
            }
        });
        
        // Handle progress updates
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-mark-complete]')) {
                const itemId = e.target.dataset.markComplete;
                this.markItemComplete(itemId);
            }
        });
        
        // Handle beforeunload to save progress
        window.addEventListener('beforeunload', () => {
            this.saveUserPreferences();
        });
    }
    
    /**
     * Initialize core components
     */
    initializeComponents() {
        // Initialize theme system
        this.applyTheme(this.currentTheme);
        
        // Initialize progress tracking
        this.updateProgressDisplay();
        
        // Initialize accessibility features
        this.setupAccessibility();
        
        // Initialize keyboard navigation
        this.setupKeyboardNavigation();
    }
    
    /**
     * Setup theme system
     */
    setupThemeSystem() {
        // Check for system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            if (this.currentTheme === 'default') {
                this.currentTheme = 'dark';
                this.applyTheme('dark');
            }
        }
        
        // Listen for system theme changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (this.currentTheme === 'default') {
                    this.currentTheme = e.matches ? 'dark' : 'light';
                    this.applyTheme(this.currentTheme);
                }
            });
        }
    }
    
    /**
     * Apply theme to the document
     */
    applyTheme(theme) {
        const root = document.documentElement;
        
        // Remove existing theme classes
        root.classList.remove('theme-light', 'theme-dark', 'theme-bitcoin', 'theme-austrian');
        
        // Add new theme class
        root.classList.add(`theme-${theme}`);
        root.setAttribute('data-theme', theme);
        
        // Update theme-specific styles
        this.updateThemeStyles(theme);
        
        // Dispatch theme change event
        this.eventBus.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
    }
    
    /**
     * Update theme-specific styles
     */
    updateThemeStyles(theme) {
        const styleElement = document.getElementById('academy-theme-styles');
        
        if (!styleElement) {
            const newStyleElement = document.createElement('style');
            newStyleElement.id = 'academy-theme-styles';
            document.head.appendChild(newStyleElement);
        }
        
        const themeStyles = this.getThemeStyles(theme);
        styleElement.textContent = themeStyles;
    }
    
    /**
     * Get theme-specific CSS styles
     */
    getThemeStyles(theme) {
        const themes = {
            light: `
                :root {
                    --bg-primary: #ffffff;
                    --bg-secondary: #f9fafb;
                    --text-primary: #111827;
                    --text-secondary: #6b7280;
                    --border-color: #e5e7eb;
                }
            `,
            dark: `
                :root {
                    --bg-primary: #111827;
                    --bg-secondary: #1f2937;
                    --text-primary: #f9fafb;
                    --text-secondary: #9ca3af;
                    --border-color: #374151;
                }
            `,
            bitcoin: `
                :root {
                    --bg-primary: #fff7ed;
                    --bg-secondary: #fed7aa;
                    --text-primary: #7c2d12;
                    --text-secondary: #c2410c;
                    --border-color: #fb923c;
                }
            `,
            austrian: `
                :root {
                    --bg-primary: #eff6ff;
                    --bg-secondary: #dbeafe;
                    --text-primary: #1e3a8a;
                    --text-secondary: #3b82f6;
                    --border-color: #60a5fa;
                }
            `
        };
        
        return themes[theme] || themes.light;
    }
    
    /**
     * Toggle between themes
     */
    toggleTheme() {
        const themes = ['light', 'dark', 'bitcoin', 'austrian'];
        const currentIndex = themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        const nextTheme = themes[nextIndex];
        
        this.currentTheme = nextTheme;
        this.applyTheme(nextTheme);
        this.saveUserPreferences();
    }
    
    /**
     * Navigate to a specific lesson
     */
    navigateToLesson(lessonId) {
        this.currentLesson = lessonId;
        
        // Update URL
        const url = new URL(window.location);
        url.searchParams.set('lesson', lessonId);
        window.history.pushState({ lesson: lessonId }, '', url);
        
        // Dispatch navigation event
        this.eventBus.dispatchEvent(new CustomEvent('lessonChanged', { 
            detail: { lessonId } 
        }));
        
        // Load lesson content
        this.loadLessonContent(lessonId);
    }
    
    /**
     * Navigate to a specific section
     */
    navigateToSection(sectionId) {
        this.currentSection = sectionId;
        
        // Update URL
        const url = new URL(window.location);
        url.searchParams.set('section', sectionId);
        window.history.pushState({ section: sectionId }, '', url);
        
        // Dispatch navigation event
        this.eventBus.dispatchEvent(new CustomEvent('sectionChanged', { 
            detail: { sectionId } 
        }));
        
        // Scroll to section
        this.scrollToSection(sectionId);
    }
    
    /**
     * Load lesson content
     */
    async loadLessonContent(lessonId) {
        try {
            const response = await fetch(`/academy/shared/data/lessons/${lessonId}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load lesson: ${response.statusText}`);
            }
            
            const lessonData = await response.json();
            this.renderLessonContent(lessonData);
            
        } catch (error) {
            console.error('Error loading lesson content:', error);
            this.showError('Failed to load lesson content. Please try again.');
        }
    }
    
    /**
     * Render lesson content
     */
    renderLessonContent(lessonData) {
        const contentContainer = document.querySelector('.lesson-content');
        if (!contentContainer) return;
        
        // Clear existing content
        contentContainer.innerHTML = '';
        
        // Render lesson header
        const header = this.createLessonHeader(lessonData);
        contentContainer.appendChild(header);
        
        // Render lesson sections
        lessonData.sections.forEach((section, index) => {
            const sectionElement = this.createSectionElement(section, index);
            contentContainer.appendChild(sectionElement);
        });
        
        // Initialize interactive elements
        this.initializeInteractiveElements();
        
        // Update progress
        this.updateProgressDisplay();
    }
    
    /**
     * Create lesson header element
     */
    createLessonHeader(lessonData) {
        const header = document.createElement('div');
        header.className = 'lesson-header';
        header.innerHTML = `
            <h1>${lessonData.title}</h1>
            <p class="lesson-subtitle">${lessonData.subtitle}</p>
            <div class="lesson-meta">
                <span class="lesson-duration">⏱️ ${lessonData.duration}</span>
                <span class="lesson-difficulty">📊 ${lessonData.difficulty}</span>
                <span class="lesson-objectives">🎯 ${lessonData.objectives.length} Objectives</span>
            </div>
        `;
        return header;
    }
    
    /**
     * Create section element
     */
    createSectionElement(section, index) {
        const sectionElement = document.createElement('div');
        sectionElement.className = 'lesson-section';
        sectionElement.id = `section-${index}`;
        sectionElement.innerHTML = `
            <h2>${section.title}</h2>
            <div class="section-content">${section.content}</div>
            ${section.key_concepts ? `<div class="key-concepts">${this.renderKeyConcepts(section.key_concepts)}</div>` : ''}
        `;
        return sectionElement;
    }
    
    /**
     * Render key concepts
     */
    renderKeyConcepts(concepts) {
        if (Array.isArray(concepts)) {
            return `
                <h4>Key Concepts:</h4>
                <ul>
                    ${concepts.map(concept => `<li>${concept}</li>`).join('')}
                </ul>
            `;
        }
        return concepts;
    }
    
    /**
     * Scroll to a specific section
     */
    scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }
    }
    
    /**
     * Mark an item as complete
     */
    markItemComplete(itemId) {
        if (!this.userProgress[itemId]) {
            this.userProgress[itemId] = {
                completed: true,
                completedAt: new Date().toISOString(),
                progress: 100
            };
            
            this.saveUserPreferences();
            this.updateProgressDisplay();
            
            // Dispatch completion event
            this.eventBus.dispatchEvent(new CustomEvent('itemCompleted', { 
                detail: { itemId } 
            }));
        }
    }
    
    /**
     * Update progress display
     */
    updateProgressDisplay() {
        const progressElements = document.querySelectorAll('[data-progress]');
        
        progressElements.forEach(element => {
            const itemId = element.dataset.progress;
            const progress = this.userProgress[itemId]?.progress || 0;
            
            // Update progress bar
            const progressBar = element.querySelector('.progress-fill');
            if (progressBar) {
                progressBar.style.width = `${progress}%`;
            }
            
            // Update progress text
            const progressText = element.querySelector('.progress-text');
            if (progressText) {
                progressText.textContent = `${progress}% Complete`;
            }
        });
    }
    
    /**
     * Initialize interactive elements
     */
    initializeInteractiveElements() {
        // Initialize tooltips
        this.initializeTooltips();
        
        // Initialize collapsible sections
        this.initializeCollapsibleSections();
        
        // Initialize code highlighting
        this.initializeCodeHighlighting();
    }
    
    /**
     * Initialize tooltips
     */
    initializeTooltips() {
        const tooltipElements = document.querySelectorAll('[data-tooltip]');
        
        tooltipElements.forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                this.showTooltip(e.target, e.target.dataset.tooltip);
            });
            
            element.addEventListener('mouseleave', () => {
                this.hideTooltip();
            });
        });
    }
    
    /**
     * Show tooltip
     */
    showTooltip(element, text) {
        const tooltip = document.createElement('div');
        tooltip.className = 'academy-tooltip';
        tooltip.textContent = text;
        document.body.appendChild(tooltip);
        
        const rect = element.getBoundingClientRect();
        tooltip.style.position = 'absolute';
        tooltip.style.left = `${rect.left + rect.width / 2}px`;
        tooltip.style.top = `${rect.top - 10}px`;
        tooltip.style.transform = 'translateX(-50%)';
        
        this.currentTooltip = tooltip;
    }
    
    /**
     * Hide tooltip
     */
    hideTooltip() {
        if (this.currentTooltip) {
            this.currentTooltip.remove();
            this.currentTooltip = null;
        }
    }
    
    /**
     * Initialize collapsible sections
     */
    initializeCollapsibleSections() {
        const collapsibleHeaders = document.querySelectorAll('.collapsible-header');
        
        collapsibleHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const section = header.nextElementSibling;
                const isCollapsed = section.style.display === 'none';
                
                section.style.display = isCollapsed ? 'block' : 'none';
                header.classList.toggle('collapsed', !isCollapsed);
            });
        });
    }
    
    /**
     * Initialize code highlighting
     */
    initializeCodeHighlighting() {
        const codeBlocks = document.querySelectorAll('pre code');
        
        codeBlocks.forEach(block => {
            // Add line numbers
            const lines = block.textContent.split('\n');
            const lineNumbers = document.createElement('div');
            lineNumbers.className = 'line-numbers';
            
            lines.forEach((_, index) => {
                const lineNumber = document.createElement('span');
                lineNumber.textContent = index + 1;
                lineNumbers.appendChild(lineNumber);
            });
            
            block.parentNode.insertBefore(lineNumbers, block);
        });
    }
    
    /**
     * Setup accessibility features
     */
    setupAccessibility() {
        // Add skip links
        this.addSkipLinks();
        
        // Setup focus management
        this.setupFocusManagement();
        
        // Setup ARIA labels
        this.setupARIALabels();
    }
    
    /**
     * Add skip links for keyboard navigation
     */
    addSkipLinks() {
        const skipLinks = document.createElement('div');
        skipLinks.className = 'skip-links';
        skipLinks.innerHTML = `
            <a href="#main-content" class="skip-link">Skip to main content</a>
            <a href="#navigation" class="skip-link">Skip to navigation</a>
        `;
        
        document.body.insertBefore(skipLinks, document.body.firstChild);
    }
    
    /**
     * Setup focus management
     */
    setupFocusManagement() {
        // Trap focus in modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' && e.target.closest('.modal')) {
                this.trapFocus(e);
            }
        });
    }
    
    /**
     * Trap focus within a modal
     */
    trapFocus(e) {
        const modal = e.target.closest('.modal');
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (e.shiftKey) {
            if (document.activeElement === firstElement) {
                lastElement.focus();
                e.preventDefault();
            }
        } else {
            if (document.activeElement === lastElement) {
                firstElement.focus();
                e.preventDefault();
            }
        }
    }
    
    /**
     * Setup ARIA labels
     */
    setupARIALabels() {
        // Add ARIA labels to interactive elements
        const buttons = document.querySelectorAll('button:not([aria-label])');
        buttons.forEach(button => {
            if (button.textContent.trim()) {
                button.setAttribute('aria-label', button.textContent.trim());
            }
        });
    }
    
    /**
     * Setup keyboard navigation
     */
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Navigation shortcuts
            if (e.altKey) {
                switch (e.key) {
                    case 'h':
                        e.preventDefault();
                        this.navigateToLesson('home');
                        break;
                    case 'n':
                        e.preventDefault();
                        this.navigateToNextSection();
                        break;
                    case 'p':
                        e.preventDefault();
                        this.navigateToPreviousSection();
                        break;
                    case 't':
                        e.preventDefault();
                        this.toggleTheme();
                        break;
                }
            }
        });
    }
    
    /**
     * Navigate to next section
     */
    navigateToNextSection() {
        if (this.currentSection) {
            const sections = document.querySelectorAll('.lesson-section');
            const currentIndex = Array.from(sections).findIndex(
                section => section.id === this.currentSection
            );
            
            if (currentIndex < sections.length - 1) {
                const nextSection = sections[currentIndex + 1];
                this.navigateToSection(nextSection.id);
            }
        }
    }
    
    /**
     * Navigate to previous section
     */
    navigateToPreviousSection() {
        if (this.currentSection) {
            const sections = document.querySelectorAll('.lesson-section');
            const currentIndex = Array.from(sections).findIndex(
                section => section.id === this.currentSection
            );
            
            if (currentIndex > 0) {
                const prevSection = sections[currentIndex - 1];
                this.navigateToSection(prevSection.id);
            }
        }
    }
    
    /**
     * Show error message
     */
    showError(message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'academy-error';
        errorElement.textContent = message;
        
        document.body.appendChild(errorElement);
        
        setTimeout(() => {
            errorElement.remove();
        }, 5000);
    }
    
    /**
     * Get current lesson progress
     */
    getLessonProgress(lessonId) {
        const lessonSections = this.userProgress[lessonId]?.sections || {};
        const totalSections = Object.keys(lessonSections).length;
        const completedSections = Object.values(lessonSections).filter(
            section => section.completed
        ).length;
        
        return totalSections > 0 ? (completedSections / totalSections) * 100 : 0;
    }
    
    /**
     * Export user progress
     */
    exportProgress() {
        const dataStr = JSON.stringify(this.userProgress, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = 'academy-progress.json';
        link.click();
    }
    
    /**
     * Import user progress
     */
    async importProgress(file) {
        try {
            const text = await file.text();
            const progress = JSON.parse(text);
            
            // Validate progress data
            if (typeof progress === 'object' && progress !== null) {
                this.userProgress = { ...this.userProgress, ...progress };
                this.saveUserPreferences();
                this.updateProgressDisplay();
                
                this.showSuccess('Progress imported successfully!');
            } else {
                throw new Error('Invalid progress data format');
            }
        } catch (error) {
            console.error('Error importing progress:', error);
            this.showError('Failed to import progress. Please check the file format.');
        }
    }
    
    /**
     * Show success message
     */
    showSuccess(message) {
        const successElement = document.createElement('div');
        successElement.className = 'academy-success';
        successElement.textContent = message;
        
        document.body.appendChild(successElement);
        
        setTimeout(() => {
            successElement.remove();
        }, 3000);
    }
}

// Initialize Academy Core when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.academyCore = new AcademyCore();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AcademyCore;
}
