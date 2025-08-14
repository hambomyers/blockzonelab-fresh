/**
 * Lesson 2 Configuration
 * Bitcoin & Austrian Economics
 */

class LessonConfig {
    constructor() {
        this.lessonId = 'lesson-2';
        this.currentSection = 0;
        this.sections = [];
        this.quizEngine = null;
        this.progress = 0;
        this.init();
    }

    async init() {
        try {
            await this.loadLessonData();
            this.initializeComponents();
            this.setupEventListeners();
            this.loadCurrentSection();
        } catch (error) {
            console.error('Failed to initialize lesson:', error);
        }
    }

    async loadLessonData() {
        try {
            const response = await fetch('../../shared/data/lessons/lesson-2.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const lessonData = await response.json();
            this.sections = lessonData.sections;
            this.lessonTitle = lessonData.title;
            this.lessonDescription = lessonData.description;
            this.updatePageTitle();
        } catch (error) {
            console.error('Failed to load lesson data:', error);
            // Fallback to basic content
            this.sections = this.getFallbackContent();
        }
    }

    getFallbackContent() {
        return [
            {
                id: 'introduction',
                title: 'Introduction to Bitcoin & Austrian Economics',
                content: 'Content loading failed. Please refresh the page.',
                type: 'text'
            }
        ];
    }

    initializeComponents() {
        // Initialize quiz engine if available
        if (typeof QuizEngine !== 'undefined') {
            this.quizEngine = new QuizEngine();
        }

        // Initialize navigation components
        this.initializeNavigation();
        this.initializeProgress();
    }

    initializeNavigation() {
        const sectionList = document.querySelector('.section-list');
        if (sectionList && this.sections.length > 0) {
            sectionList.innerHTML = this.sections.map((section, index) => `
                <li class="section-item ${index === 0 ? 'active' : ''}">
                    <button class="section-button" data-section="${index}">
                        ${section.title}
                    </button>
                </li>
            `).join('');
        }
    }

    initializeProgress() {
        const progressFill = document.querySelector('.progress-fill');
        if (progressFill) {
            this.updateProgress(0);
        }
    }

    setupEventListeners() {
        // Section navigation
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('section-button')) {
                const sectionIndex = parseInt(e.target.dataset.section);
                this.navigateToSection(sectionIndex);
            }
        });

        // Navigation buttons
        const prevBtn = document.getElementById('previous-section');
        const nextBtn = document.getElementById('next-section');
        const completeBtn = document.getElementById('complete-lesson');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousSection());
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextSection());
        }
        if (completeBtn) {
            completeBtn.addEventListener('click', () => this.completeLesson());
        }

        // Theme toggle
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
    }

    navigateToSection(sectionIndex) {
        if (sectionIndex >= 0 && sectionIndex < this.sections.length) {
            this.currentSection = sectionIndex;
            this.loadCurrentSection();
            this.updateNavigation();
            this.updateProgress();
        }
    }

    loadCurrentSection() {
        const contentSections = document.querySelector('.content-sections');
        if (!contentSections || !this.sections[this.currentSection]) return;

        const section = this.sections[this.currentSection];
        contentSections.innerHTML = this.renderSection(section);
        
        // Initialize interactive components for this section
        this.initializeSectionComponents(section);
    }

    renderSection(section) {
        switch (section.type) {
            case 'text':
                return `<div class="content-section text-section">
                    <h2>${section.title}</h2>
                    <div class="content-body">${section.content}</div>
                </div>`;
            
            case 'quiz':
                return `<div class="content-section quiz-section">
                    <h2>${section.title}</h2>
                    <div class="quiz-container" data-quiz-id="${section.quizId}"></div>
                </div>`;
            
            case 'demo':
                return `<div class="content-section demo-section">
                    <h2>${section.title}</h2>
                    <div class="demo-container" data-demo-type="${section.demoType}"></div>
                </div>`;
            
            default:
                return `<div class="content-section">
                    <h2>${section.title}</h2>
                    <div class="content-body">${section.content}</div>
                </div>`;
        }
    }

    initializeSectionComponents(section) {
        // Initialize quiz if present
        if (section.type === 'quiz' && this.quizEngine) {
            this.quizEngine.loadQuiz(section.quizId);
        }

        // Initialize demo if present
        if (section.type === 'demo') {
            this.initializeDemo(section.demoType);
        }
    }

    initializeDemo(demoType) {
        // Initialize different types of interactive demos
        switch (demoType) {
            case 'sha256':
                if (typeof SHA256Demo !== 'undefined') {
                    new SHA256Demo();
                }
                break;
            case 'merkle-tree':
                if (typeof MerkleTreeDemo !== 'undefined') {
                    new MerkleTreeDemo();
                }
                break;
            case 'inflation-calculator':
                if (typeof InflationCalculator !== 'undefined') {
                    new InflationCalculator();
                }
                break;
            case 'economic-charts':
                if (typeof EconomicCharts !== 'undefined') {
                    new EconomicCharts();
                }
                break;
        }
    }

    previousSection() {
        if (this.currentSection > 0) {
            this.navigateToSection(this.currentSection - 1);
        }
    }

    nextSection() {
        if (this.currentSection < this.sections.length - 1) {
            this.navigateToSection(this.currentSection + 1);
        }
    }

    completeLesson() {
        // Show completion dialog
        if (confirm('Are you sure you want to complete this lesson?')) {
            this.markLessonComplete();
        }
    }

    markLessonComplete() {
        this.progress = 100;
        this.updateProgress();
        
        // Show completion message
        this.showToast('🎉 Lesson completed! Great job!', 'success');
        
        // Update UI
        const completeBtn = document.getElementById('complete-lesson');
        if (completeBtn) {
            completeBtn.textContent = 'Completed ✓';
            completeBtn.disabled = true;
        }
    }

    updateNavigation() {
        // Update section list active state
        const sectionItems = document.querySelectorAll('.section-item');
        sectionItems.forEach((item, index) => {
            item.classList.toggle('active', index === this.currentSection);
        });

        // Update navigation buttons
        const prevBtn = document.getElementById('previous-section');
        const nextBtn = document.getElementById('next-section');
        const completeBtn = document.getElementById('complete-lesson');

        if (prevBtn) {
            prevBtn.disabled = this.currentSection === 0;
        }
        if (nextBtn) {
            nextBtn.disabled = this.currentSection === this.sections.length - 1;
        }
        if (completeBtn) {
            completeBtn.style.display = this.currentSection === this.sections.length - 1 ? 'block' : 'none';
        }
    }

    updateProgress() {
        const progressPercentage = Math.round((this.currentSection / (this.sections.length - 1)) * 100);
        this.progress = progressPercentage;
        
        const progressFill = document.querySelector('.progress-fill');
        if (progressFill) {
            progressFill.style.width = `${progressPercentage}%`;
        }

        const progressText = document.querySelector('.progress-text');
        if (progressText) {
            progressText.textContent = `${progressPercentage}% Complete`;
        }
    }

    updatePageTitle() {
        if (this.lessonTitle) {
            document.title = `${this.lessonTitle} - BlockZone Academy`;
        }
    }

    toggleTheme() {
        document.body.classList.toggle('dark-theme');
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.textContent = document.body.classList.contains('dark-theme') ? '☀️' : '🌙';
        }
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toast-container');
        if (toastContainer) {
            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            toast.textContent = message;
            toastContainer.appendChild(toast);
            
            setTimeout(() => {
                toast.remove();
            }, 3000);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.lessonConfig = new LessonConfig();
}); 