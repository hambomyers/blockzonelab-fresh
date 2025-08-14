/**
 * BLOCKZONE ACADEMY - SECTION NAVIGATION COMPONENT
 * Provides navigation between lesson sections
 */

class SectionNav {
    constructor(config = {}) {
        this.config = {
            enableSticky: true,
            enableProgress: true,
            enableQuickJump: true,
            showSectionNumbers: true,
            ...config
        };
        
        this.sections = [];
        this.currentSection = 0;
        this.container = null;
        this.progressBar = null;
        this.init();
    }
    
    init() {
        this.createNavigationContainer();
        this.bindEvents();
    }
    
    createNavigationContainer() {
        this.container = document.createElement('nav');
        this.container.className = 'section-navigation';
        this.container.setAttribute('aria-label', 'Section navigation');
        
        // Create navigation header
        const navHeader = document.createElement('div');
        navHeader.className = 'nav-header';
        navHeader.innerHTML = `
            <h3 class="nav-title">Lesson Sections</h3>
            <div class="nav-controls">
                <button class="nav-toggle" aria-label="Toggle navigation">
                    <span class="toggle-icon">☰</span>
                </button>
            </div>
        `;
        
        this.container.appendChild(navHeader);
        
        // Create sections list container
        this.sectionsContainer = document.createElement('div');
        this.sectionsContainer.className = 'sections-list';
        this.container.appendChild(this.sectionsContainer);
        
        // Create progress bar if enabled
        if (this.config.enableProgress) {
            this.createProgressBar();
        }
        
        // Insert into page
        const mainContent = document.querySelector('.academy-main') || document.querySelector('main');
        if (mainContent) {
            mainContent.insertBefore(this.container, mainContent.firstChild);
        }
        
        // Make sticky if enabled
        if (this.config.enableSticky) {
            this.makeSticky();
        }
    }
    
    createProgressBar() {
        this.progressBar = document.createElement('div');
        this.progressBar.className = 'section-progress';
        
        const progressContainer = document.createElement('div');
        progressContainer.className = 'progress-container';
        
        const progressFill = document.createElement('div');
        progressFill.className = 'progress-fill';
        progressFill.style.width = '0%';
        
        const progressText = document.createElement('span');
        progressText.className = 'progress-text';
        progressText.textContent = '0%';
        
        progressContainer.appendChild(progressFill);
        progressContainer.appendChild(progressText);
        this.progressBar.appendChild(progressContainer);
        
        this.container.appendChild(this.progressBar);
        
        this.progressFill = progressFill;
        this.progressText = progressText;
    }
    
    makeSticky() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.container.classList.remove('sticky');
                } else {
                    this.container.classList.add('sticky');
                }
            });
        }, {
            threshold: 0,
            rootMargin: '-20px 0px 0px 0px'
        });
        
        // Observe the first section to determine when to make nav sticky
        const firstSection = document.querySelector('.lesson-section');
        if (firstSection) {
            observer.observe(firstSection);
        }
    }
    
    setSections(sectionsData) {
        this.sections = Array.isArray(sectionsData) ? sectionsData : [];
        this.render();
    }
    
    render() {
        if (!this.sectionsContainer) return;
        
        this.sectionsContainer.innerHTML = '';
        
        if (this.sections.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'no-sections';
            emptyMessage.textContent = 'No sections available';
            this.sectionsContainer.appendChild(emptyMessage);
            return;
        }
        
        // Create section navigation items
        this.sections.forEach((section, index) => {
            const sectionItem = this.createSectionItem(section, index);
            this.sectionsContainer.appendChild(sectionItem);
        });
        
        // Update progress
        this.updateProgress();
    }
    
    createSectionItem(section, index) {
        const sectionItem = document.createElement('div');
        sectionItem.className = 'section-item';
        sectionItem.dataset.sectionIndex = index;
        
        if (index === this.currentSection) {
            sectionItem.classList.add('current');
        }
        
        // Section number
        if (this.config.showSectionNumbers) {
            const numberElement = document.createElement('span');
            numberElement.className = 'section-number';
            numberElement.textContent = index + 1;
            sectionItem.appendChild(numberElement);
        }
        
        // Section title
        const titleElement = document.createElement('span');
        titleElement.className = 'section-title';
        titleElement.textContent = section.title || `Section ${index + 1}`;
        sectionItem.appendChild(titleElement);
        
        // Section status indicator
        if (section.completed) {
            const statusElement = document.createElement('span');
            statusElement.className = 'section-status completed';
            statusElement.textContent = '✓';
            statusElement.setAttribute('aria-label', 'Completed');
            sectionItem.appendChild(statusElement);
        }
        
        // Add click handler
        sectionItem.addEventListener('click', () => {
            this.navigateToSection(index);
        });
        
        return sectionItem;
    }
    
    navigateToSection(sectionIndex) {
        if (sectionIndex < 0 || sectionIndex >= this.sections.length) return;
        
        // Update current section
        this.setCurrentSection(sectionIndex);
        
        // Scroll to section
        const targetSection = document.querySelector(`[data-section-id="${this.sections[sectionIndex].id}"]`);
        if (targetSection) {
            targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        
        // Emit navigation event
        document.dispatchEvent(new CustomEvent('sectionNavigated', {
            detail: {
                sectionIndex,
                sectionData: this.sections[sectionIndex]
            }
        }));
    }
    
    setCurrentSection(sectionIndex) {
        if (sectionIndex < 0 || sectionIndex >= this.sections.length) return;
        
        // Remove current class from previous section
        const previousCurrent = this.sectionsContainer.querySelector('.section-item.current');
        if (previousCurrent) {
            previousCurrent.classList.remove('current');
        }
        
        // Add current class to new section
        const newCurrent = this.sectionsContainer.querySelector(`[data-section-index="${sectionIndex}"]`);
        if (newCurrent) {
            newCurrent.classList.add('current');
        }
        
        this.currentSection = sectionIndex;
        this.updateProgress();
    }
    
    updateProgress() {
        if (!this.progressBar || !this.progressFill || !this.progressText) return;
        
        const progress = this.sections.length > 0 ? ((this.currentSection + 1) / this.sections.length) * 100 : 0;
        this.progressFill.style.width = `${progress}%`;
        this.progressText.textContent = `${Math.round(progress)}%`;
    }
    
    markSectionComplete(sectionIndex) {
        if (sectionIndex >= 0 && sectionIndex < this.sections.length) {
            this.sections[sectionIndex].completed = true;
            this.render();
        }
    }
    
    markSectionIncomplete(sectionIndex) {
        if (sectionIndex >= 0 && sectionIndex < this.sections.length) {
            this.sections[sectionIndex].completed = false;
            this.render();
        }
    }
    
    nextSection() {
        if (this.currentSection < this.sections.length - 1) {
            this.navigateToSection(this.currentSection + 1);
        }
    }
    
    previousSection() {
        if (this.currentSection > 0) {
            this.navigateToSection(this.currentSection - 1);
        }
    }
    
    getCurrentSection() {
        return this.currentSection;
    }
    
    getCurrentSectionData() {
        return this.sections[this.currentSection] || null;
    }
    
    getTotalSections() {
        return this.sections.length;
    }
    
    // Quick jump functionality
    enableQuickJump() {
        if (!this.config.enableQuickJump) return;
        
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'ArrowLeft':
                        e.preventDefault();
                        this.previousSection();
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        this.nextSection();
                        break;
                    case 'Home':
                        e.preventDefault();
                        this.navigateToSection(0);
                        break;
                    case 'End':
                        e.preventDefault();
                        this.navigateToSection(this.sections.length - 1);
                        break;
                }
            }
        });
    }
    
    // Section filtering
    filterSections(filterText) {
        const filteredSections = this.sections.filter(section => 
            section.title.toLowerCase().includes(filterText.toLowerCase()) ||
            (section.description && section.description.toLowerCase().includes(filterText.toLowerCase()))
        );
        
        this.renderFilteredSections(filteredSections);
    }
    
    renderFilteredSections(filteredSections) {
        if (!this.sectionsContainer) return;
        
        this.sectionsContainer.innerHTML = '';
        
        if (filteredSections.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.textContent = 'No sections match your search';
            this.sectionsContainer.appendChild(noResults);
            return;
        }
        
        filteredSections.forEach((section, index) => {
            const sectionItem = this.createSectionItem(section, this.sections.indexOf(section));
            this.sectionsContainer.appendChild(sectionItem);
        });
    }
    
    // Search functionality
    addSearchBox() {
        const searchContainer = document.createElement('div');
        searchContainer.className = 'section-search';
        
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search sections...';
        searchInput.className = 'search-input';
        
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.trim();
            if (searchTerm === '') {
                this.render(); // Show all sections
            } else {
                this.filterSections(searchTerm);
            }
        });
        
        searchContainer.appendChild(searchInput);
        
        // Insert after nav header
        const navHeader = this.container.querySelector('.nav-header');
        if (navHeader) {
            navHeader.parentNode.insertBefore(searchContainer, navHeader.nextSibling);
        }
    }
    
    // Collapsible navigation
    toggleNavigation() {
        this.container.classList.toggle('collapsed');
        
        const toggleIcon = this.container.querySelector('.toggle-icon');
        if (toggleIcon) {
            toggleIcon.textContent = this.container.classList.contains('collapsed') ? '☰' : '✕';
        }
    }
    
    // Auto-hide on scroll (for mobile)
    enableAutoHide() {
        let lastScrollTop = 0;
        let isHidden = false;
        
        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            if (scrollTop > lastScrollTop && scrollTop > 100 && !isHidden) {
                // Scrolling down, hide nav
                this.container.classList.add('hidden');
                isHidden = true;
            } else if (scrollTop < lastScrollTop && isHidden) {
                // Scrolling up, show nav
                this.container.classList.remove('hidden');
                isHidden = false;
            }
            
            lastScrollTop = scrollTop;
        });
    }
    
    bindEvents() {
        // Toggle navigation
        const toggleButton = this.container.querySelector('.nav-toggle');
        if (toggleButton) {
            toggleButton.addEventListener('click', () => {
                this.toggleNavigation();
            });
        }
        
        // Listen for section events
        document.addEventListener('sectionLoaded', (e) => {
            if (e.detail.sectionIndex !== undefined) {
                this.setCurrentSection(e.detail.sectionIndex);
            }
        });
        
        document.addEventListener('sectionCompleted', (e) => {
            if (e.detail.sectionIndex !== undefined) {
                this.markSectionComplete(e.detail.sectionIndex);
            }
        });
        
        // Enable quick jump
        this.enableQuickJump();
    }
    
    destroy() {
        // Remove event listeners
        document.removeEventListener('sectionLoaded', this.handleSectionLoaded);
        document.removeEventListener('sectionCompleted', this.handleSectionCompleted);
        
        // Remove container
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        
        this.container = null;
        this.sectionsContainer = null;
        this.progressBar = null;
        this.progressFill = null;
        this.progressText = null;
        this.sections = [];
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SectionNav;
} else {
    window.SectionNav = SectionNav;
} 