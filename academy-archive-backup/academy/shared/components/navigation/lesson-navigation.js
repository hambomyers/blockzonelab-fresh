/**
 * BLOCKZONE ACADEMY - LESSON NAVIGATION COMPONENT
 * Handles lesson section navigation and progress tracking
 */

class LessonNavigation {
    constructor(config = {}) {
        this.config = {
            showProgress: true,
            showSectionNumbers: true,
            enableKeyboardNavigation: true,
            ...config
        };
        
        this.currentSection = 0;
        this.totalSections = 0;
        this.sections = [];
        this.navContainer = null;
        
        this.init();
    }
    
    init() {
        this.createNavigationInterface();
        this.bindEvents();
    }
    
    createNavigationInterface() {
        if (!this.navContainer) {
            this.navContainer = document.getElementById('lesson-nav');
        }
        
        if (!this.navContainer) {
            console.warn('LessonNavigation: Navigation container not found');
            return;
        }
        
        this.navContainer.innerHTML = `
            <div class="lesson-nav-header">
                <h3>Lesson Sections</h3>
                <div class="nav-progress" id="nav-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" id="nav-progress-fill"></div>
                    </div>
                    <span id="nav-progress-text">0% Complete</span>
                </div>
            </div>
            <ul class="lesson-nav-list" id="lesson-nav-list">
                <!-- Navigation items will be populated here -->
            </ul>
        `;
    }
    
    loadSections(sections) {
        this.sections = sections;
        this.totalSections = sections.length;
        this.renderNavigation();
        this.updateProgress();
    }
    
    renderNavigation() {
        const navList = document.getElementById('lesson-nav-list');
        if (!navList) return;
        
        navList.innerHTML = this.sections.map((section, index) => `
            <li class="nav-item ${index === this.currentSection ? 'active' : ''}" 
                data-section="${index}">
                <button class="nav-button" data-section="${index}">
                    <span class="section-number">${index + 1}</span>
                    <span class="section-title">${section.title}</span>
                    <span class="section-status" id="section-status-${index}">
                        ${index < this.currentSection ? '✓' : index === this.currentSection ? '●' : '○'}
                    </span>
                </button>
            </li>
        `).join('');
    }
    
    setCurrentSection(sectionIndex) {
        if (sectionIndex < 0 || sectionIndex >= this.totalSections) return;
        
        // Remove active class from previous section
        const prevActive = this.navContainer?.querySelector('.nav-item.active');
        if (prevActive) {
            prevActive.classList.remove('active');
        }
        
        // Update current section
        this.currentSection = sectionIndex;
        
        // Add active class to new section
        const newActive = this.navContainer?.querySelector(`[data-section="${sectionIndex}"]`);
        if (newActive) {
            newActive.classList.add('active');
        }
        
        // Update section statuses
        this.updateSectionStatuses();
        this.updateProgress();
    }
    
    updateSectionStatuses() {
        this.sections.forEach((section, index) => {
            const statusElement = document.getElementById(`section-status-${index}`);
            if (statusElement) {
                if (index < this.currentSection) {
                    statusElement.textContent = '✓';
                    statusElement.className = 'section-status completed';
                } else if (index === this.currentSection) {
                    statusElement.textContent = '●';
                    statusElement.className = 'section-status current';
                } else {
                    statusElement.textContent = '○';
                    statusElement.className = 'section-status pending';
                }
            }
        });
    }
    
    updateProgress() {
        const progressFill = document.getElementById('nav-progress-fill');
        const progressText = document.getElementById('nav-progress-text');
        
        if (progressFill && progressText) {
            const percentage = this.totalSections > 0 ? 
                Math.round((this.currentSection / this.totalSections) * 100) : 0;
            
            progressFill.style.width = `${percentage}%`;
            progressText.textContent = `${percentage}% Complete`;
        }
    }
    
    bindEvents() {
        if (!this.navContainer) return;
        
        // Navigation button clicks
        this.navContainer.addEventListener('click', (e) => {
            if (e.target.closest('.nav-button')) {
                const button = e.target.closest('.nav-button');
                const sectionIndex = parseInt(button.dataset.section);
                this.navigateToSection(sectionIndex);
            }
        });
        
        // Keyboard navigation
        if (this.config.enableKeyboardNavigation) {
            document.addEventListener('keydown', (e) => {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
                
                switch (e.key) {
                    case 'ArrowLeft':
                    case 'ArrowUp':
                        e.preventDefault();
                        this.previousSection();
                        break;
                    case 'ArrowRight':
                    case 'ArrowDown':
                        e.preventDefault();
                        this.nextSection();
                        break;
                    case 'Home':
                        e.preventDefault();
                        this.navigateToSection(0);
                        break;
                    case 'End':
                        e.preventDefault();
                        this.navigateToSection(this.totalSections - 1);
                        break;
                }
            });
        }
    }
    
    navigateToSection(sectionIndex) {
        if (sectionIndex < 0 || sectionIndex >= this.totalSections) return;
        
        // Emit custom event for section change
        const event = new CustomEvent('sectionChange', {
            detail: {
                fromSection: this.currentSection,
                toSection: sectionIndex,
                section: this.sections[sectionIndex]
            }
        });
        
        document.dispatchEvent(event);
        
        // Update current section
        this.setCurrentSection(sectionIndex);
    }
    
    nextSection() {
        if (this.currentSection < this.totalSections - 1) {
            this.navigateToSection(this.currentSection + 1);
        }
    }
    
    previousSection() {
        if (this.currentSection > 0) {
            this.navigateToSection(this.currentSection - 1);
        }
    }
    
    markSectionComplete(sectionIndex) {
        if (sectionIndex < 0 || sectionIndex >= this.totalSections) return;
        
        // Mark section as completed
        const statusElement = document.getElementById(`section-status-${sectionIndex}`);
        if (statusElement) {
            statusElement.textContent = '✓';
            statusElement.className = 'section-status completed';
        }
    }
    
    getCurrentSection() {
        return this.currentSection;
    }
    
    getTotalSections() {
        return this.totalSections;
    }
    
    destroy() {
        if (this.navContainer) {
            this.navContainer.innerHTML = '';
        }
        
        // Remove event listeners
        document.removeEventListener('keydown', this.handleKeydown);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LessonNavigation;
} else {
    window.LessonNavigation = LessonNavigation;
} 