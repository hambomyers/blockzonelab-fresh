/**
 * LessonLoader - Dynamic content loader for BlockZone Academy lessons
 * Loads lesson content from JSON files and populates the template
 */

class LessonLoader {
    constructor() {
        this.currentSection = 0;
        this.lessonData = null;
        this.totalSections = 0;
    }

    async init() {
        try {
            // Get lesson ID from URL or default to lesson-2
            const lessonId = this.getLessonIdFromUrl() || 'lesson-2';
            
            // Load lesson data
            await this.loadLessonData(lessonId);
            
            // Populate the template
            this.populateTemplate();
            
            // Setup navigation
            this.setupNavigation();
            
            // Setup progress tracking
            this.setupProgressTracking();
            
            console.log(`Lesson ${lessonId} loaded successfully`);
        } catch (error) {
            console.error('Failed to load lesson:', error);
            this.showError('Failed to load lesson content');
        }
    }

    getLessonIdFromUrl() {
        const urlParts = window.location.pathname.split('/');
        const lessonIndex = urlParts.indexOf('lesson-');
        if (lessonIndex !== -1) {
            return urlParts[lessonIndex];
        }
        return null;
    }

    async loadLessonData(lessonId) {
        const response = await fetch(`../../shared/data/lessons/${lessonId}.json`);
        if (!response.ok) {
            throw new Error(`Failed to load lesson data: ${response.statusText}`);
        }
        this.lessonData = await response.json();
        this.totalSections = this.lessonData.sections.length;
    }

    populateTemplate() {
        if (!this.lessonData) return;

        // Populate lesson header
        this.populateLessonHeader();
        
        // Populate lesson content
        this.populateLessonContent();
        
        // Populate quiz
        this.populateQuiz();
    }

    populateLessonHeader() {
        const titleElement = document.querySelector('.lesson-header h1');
        const subtitleElement = document.querySelector('.lesson-header .lesson-subtitle');
        const durationElement = document.querySelector('.lesson-header .lesson-duration');
        const difficultyElement = document.querySelector('.lesson-header .lesson-difficulty');
        const topicsElement = document.querySelector('.lesson-header .lesson-topics');

        if (titleElement) titleElement.textContent = this.lessonData.title;
        if (subtitleElement) subtitleElement.textContent = this.lessonData.subtitle;
        if (durationElement) durationElement.textContent = `⏱️ ${this.lessonData.duration}`;
        if (difficultyElement) difficultyElement.textContent = `📚 ${this.lessonData.difficulty}`;
        if (topicsElement) topicsElement.textContent = `🎯 ${this.lessonData.topics}`;
    }

    populateLessonContent() {
        const contentContainer = document.getElementById('lesson-content');
        if (!contentContainer) return;

        contentContainer.innerHTML = '';
        
        this.lessonData.sections.forEach((section, index) => {
            const sectionElement = this.createSectionElement(section, index);
            contentContainer.appendChild(sectionElement);
        });
    }

    createSectionElement(section, index) {
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'lesson-section';
        sectionDiv.id = `section-${index}`;
        sectionDiv.style.display = index === 0 ? 'block' : 'none';

        const sectionHeader = document.createElement('div');
        sectionHeader.className = 'section-header';
        sectionHeader.innerHTML = `
            <h2>${section.title}</h2>
            <p class="section-subtitle">${section.subtitle}</p>
        `;

        const sectionContent = document.createElement('div');
        sectionContent.className = 'section-content';
        
        section.content.forEach(item => {
            const contentElement = this.createContentElement(item);
            sectionContent.appendChild(contentElement);
        });

        sectionDiv.appendChild(sectionHeader);
        sectionDiv.appendChild(sectionContent);
        
        return sectionDiv;
    }

    createContentElement(item) {
        const element = document.createElement('div');
        element.className = `content-${item.type}`;

        switch (item.type) {
            case 'text':
                element.innerHTML = `<p>${item.content}</p>`;
                break;
                
            case 'story':
                element.innerHTML = `
                    <div class="story-section">
                        <h4>${item.title}</h4>
                        <p>${item.content}</p>
                    </div>
                `;
                break;
                
            case 'fun-fact':
                element.innerHTML = `
                    <div class="fun-fact">
                        <p>${item.content}</p>
                    </div>
                `;
                break;
                
            case 'comparison':
                element.innerHTML = `
                    <div class="comparison-grid">
                        <h4>${item.title}</h4>
                        ${item.items.map(item => `
                            <div class="comparison-card">
                                <h5>${item.title}</h5>
                                <p>${item.description}</p>
                            </div>
                        `).join('')}
                    </div>
                `;
                break;
                
            case 'interactive-demo':
                element.innerHTML = `
                    <div class="interactive-demo">
                        <h4>${item.title}</h4>
                        <p>${item.description}</p>
                        <button class="demo-button" onclick="this.loadDemo('${item.id}')">
                            Launch Demo
                        </button>
                    </div>
                `;
                break;
                
            default:
                element.innerHTML = `<p>${item.content || 'Content not available'}</p>`;
        }

        return element;
    }

    populateQuiz() {
        const quizContainer = document.getElementById('quiz-container');
        if (!quizContainer) return;

        // Load quiz data if available
        this.loadQuizData();
    }

    async loadQuizData() {
        try {
            const quizId = this.lessonData.quizId || 'bitcoin-quiz';
            const response = await fetch(`../../shared/data/quiz-banks/${quizId}.json`);
            if (response.ok) {
                const quizData = await response.json();
                // Initialize quiz engine with data
                if (window.quizEngine) {
                    window.quizEngine.loadQuiz(quizData);
                }
            }
        } catch (error) {
            console.warn('Quiz data not available:', error);
        }
    }

    setupNavigation() {
        const prevButton = document.getElementById('prev-section');
        const nextButton = document.getElementById('next-section');

        if (prevButton) {
            prevButton.addEventListener('click', () => this.navigateSection(-1));
        }

        if (nextButton) {
            nextButton.addEventListener('click', () => this.navigateSection(1));
        }

        // Update button states
        this.updateNavigationButtons();
    }

    navigateSection(direction) {
        const newSection = this.currentSection + direction;
        
        if (newSection >= 0 && newSection < this.totalSections) {
            // Hide current section
            const currentSectionElement = document.getElementById(`section-${this.currentSection}`);
            if (currentSectionElement) {
                currentSectionElement.style.display = 'none';
            }

            // Show new section
            this.currentSection = newSection;
            const newSectionElement = document.getElementById(`section-${this.currentSection}`);
            if (newSectionElement) {
                newSectionElement.style.display = 'block';
            }

            // Update navigation and progress
            this.updateNavigationButtons();
            this.updateProgress();
        }
    }

    updateNavigationButtons() {
        const prevButton = document.getElementById('prev-section');
        const nextButton = document.getElementById('next-section');

        if (prevButton) {
            prevButton.disabled = this.currentSection === 0;
        }

        if (nextButton) {
            nextButton.disabled = this.currentSection === this.totalSections - 1;
        }
    }

    setupProgressTracking() {
        this.updateProgress();
    }

    updateProgress() {
        const progressFill = document.getElementById('lesson-progress-fill');
        const progressText = document.getElementById('lesson-progress-text');
        
        if (progressFill && progressText) {
            const progress = ((this.currentSection + 1) / this.totalSections) * 100;
            progressFill.style.width = `${progress}%`;
            progressText.textContent = `${Math.round(progress)}% Complete`;
        }
    }

    showError(message) {
        const contentContainer = document.getElementById('lesson-content');
        if (contentContainer) {
            contentContainer.innerHTML = `
                <div class="error-message">
                    <h3>⚠️ Error Loading Lesson</h3>
                    <p>${message}</p>
                    <button onclick="location.reload()">Retry</button>
                </div>
            `;
        }
    }

    loadDemo(demoId) {
        console.log(`Loading demo: ${demoId}`);
        // Demo loading logic would go here
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.lessonLoader = new LessonLoader();
    window.lessonLoader.init();
}); 