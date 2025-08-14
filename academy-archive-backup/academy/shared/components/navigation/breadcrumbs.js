/**
 * BLOCKZONE ACADEMY - BREADCRUMBS COMPONENT
 * Provides navigation breadcrumbs for lesson structure
 */

class Breadcrumbs {
    constructor(config = {}) {
        this.config = {
            enableLinks: true,
            enableHome: true,
            separator: ' / ',
            maxDepth: 5,
            ...config
        };
        
        this.breadcrumbs = [];
        this.container = null;
        this.init();
    }
    
    init() {
        this.createBreadcrumbContainer();
        this.bindEvents();
    }
    
    createBreadcrumbContainer() {
        this.container = document.createElement('nav');
        this.container.className = 'breadcrumbs-container';
        this.container.setAttribute('aria-label', 'Breadcrumb navigation');
        
        // Insert into page if header exists
        const header = document.querySelector('.academy-header');
        if (header) {
            header.appendChild(this.container);
        }
    }
    
    setBreadcrumbs(breadcrumbData) {
        this.breadcrumbs = Array.isArray(breadcrumbData) ? breadcrumbData : [];
        this.render();
    }
    
    addBreadcrumb(breadcrumb) {
        if (this.breadcrumbs.length >= this.config.maxDepth) {
            this.breadcrumbs.shift(); // Remove oldest breadcrumb
        }
        
        this.breadcrumbs.push(breadcrumb);
        this.render();
    }
    
    removeBreadcrumb(index) {
        if (index >= 0 && index < this.breadcrumbs.length) {
            this.breadcrumbs.splice(index, 1);
            this.render();
        }
    }
    
    clearBreadcrumbs() {
        this.breadcrumbs = [];
        this.render();
    }
    
    render() {
        if (!this.container) return;
        
        this.container.innerHTML = '';
        
        if (this.breadcrumbs.length === 0) {
            if (this.config.enableHome) {
                this.addHomeBreadcrumb();
            }
            return;
        }
        
        // Add home breadcrumb if enabled
        if (this.config.enableHome) {
            this.addHomeBreadcrumb();
        }
        
        // Render breadcrumb items
        this.breadcrumbs.forEach((breadcrumb, index) => {
            const breadcrumbElement = this.createBreadcrumbItem(breadcrumb, index);
            this.container.appendChild(breadcrumbElement);
            
            // Add separator (except for the last item)
            if (index < this.breadcrumbs.length - 1) {
                const separator = document.createElement('span');
                separator.className = 'breadcrumb-separator';
                separator.textContent = this.config.separator;
                separator.setAttribute('aria-hidden', 'true');
                this.container.appendChild(separator);
            }
        });
    }
    
    addHomeBreadcrumb() {
        const homeBreadcrumb = {
            text: 'Home',
            url: '/',
            icon: '🏠'
        };
        
        const homeElement = this.createBreadcrumbItem(homeBreadcrumb, -1);
        this.container.appendChild(homeElement);
        
        // Add separator if there are other breadcrumbs
        if (this.breadcrumbs.length > 0) {
            const separator = document.createElement('span');
            separator.className = 'breadcrumb-separator';
            separator.textContent = this.config.separator;
            separator.setAttribute('aria-hidden', 'true');
            this.container.appendChild(separator);
        }
    }
    
    createBreadcrumbItem(breadcrumb, index) {
        const breadcrumbElement = document.createElement('span');
        breadcrumbElement.className = 'breadcrumb-item';
        
        // Check if this is the current page
        const isCurrent = index === this.breadcrumbs.length - 1;
        if (isCurrent) {
            breadcrumbElement.classList.add('current');
            breadcrumbElement.setAttribute('aria-current', 'page');
        }
        
        // Add icon if present
        if (breadcrumb.icon) {
            const iconElement = document.createElement('span');
            iconElement.className = 'breadcrumb-icon';
            iconElement.textContent = breadcrumb.icon;
            iconElement.setAttribute('aria-hidden', 'true');
            breadcrumbElement.appendChild(iconElement);
        }
        
        // Create text/link content
        if (this.config.enableLinks && breadcrumb.url && !isCurrent) {
            const linkElement = document.createElement('a');
            linkElement.href = breadcrumb.url;
            linkElement.className = 'breadcrumb-link';
            linkElement.textContent = breadcrumb.text;
            linkElement.title = breadcrumb.text;
            
            // Add click handler for programmatic navigation
            linkElement.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleBreadcrumbClick(breadcrumb, index);
            });
            
            breadcrumbElement.appendChild(linkElement);
        } else {
            const textElement = document.createElement('span');
            textElement.className = 'breadcrumb-text';
            textElement.textContent = breadcrumb.text;
            breadcrumbElement.appendChild(textElement);
        }
        
        return breadcrumbElement;
    }
    
    handleBreadcrumbClick(breadcrumb, index) {
        // Emit custom event for breadcrumb navigation
        document.dispatchEvent(new CustomEvent('breadcrumbClicked', {
            detail: {
                breadcrumb,
                index,
                breadcrumbs: this.breadcrumbs
            }
        }));
        
        // Navigate to URL if provided
        if (breadcrumb.url) {
            if (breadcrumb.url.startsWith('#')) {
                // Handle anchor links
                const targetElement = document.querySelector(breadcrumb.url);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }
            } else if (breadcrumb.url.startsWith('/')) {
                // Handle internal navigation
                window.location.href = breadcrumb.url;
            } else {
                // Handle external links
                window.open(breadcrumb.url, '_blank');
            }
        }
    }
    
    // Convenience methods for common breadcrumb patterns
    setLessonBreadcrumbs(lessonTitle, lessonId = null) {
        this.setBreadcrumbs([
            {
                text: 'Academy',
                url: '/academy/',
                icon: '🎓'
            },
            {
                text: 'Lessons',
                url: '/academy/lessons/',
                icon: '📚'
            },
            {
                text: lessonTitle,
                url: lessonId ? `/academy/lessons/${lessonId}/` : null,
                icon: '📖'
            }
        ]);
    }
    
    setSectionBreadcrumbs(lessonTitle, lessonId, sectionTitle, sectionId = null) {
        this.setBreadcrumbs([
            {
                text: 'Academy',
                url: '/academy/',
                icon: '🎓'
            },
            {
                text: 'Lessons',
                url: '/academy/lessons/',
                icon: '📚'
            },
            {
                text: lessonTitle,
                url: `/academy/lessons/${lessonId}/`,
                icon: '📖'
            },
            {
                text: sectionTitle,
                url: sectionId ? `/academy/lessons/${lessonId}/#${sectionId}` : null,
                icon: '📝'
            }
        ]);
    }
    
    setResourceBreadcrumbs(resourceType, resourceTitle, resourceId = null) {
        this.setBreadcrumbs([
            {
                text: 'Academy',
                url: '/academy/',
                icon: '🎓'
            },
            {
                text: 'Resources',
                url: '/academy/resources/',
                icon: '📋'
            },
            {
                text: resourceType,
                url: `/academy/resources/${resourceType.toLowerCase()}/`,
                icon: '📁'
            },
            {
                text: resourceTitle,
                url: resourceId ? `/academy/resources/${resourceType.toLowerCase()}/${resourceId}/` : null,
                icon: '📄'
            }
        ]);
    }
    
    // Update breadcrumb for current section
    updateCurrentSection(sectionTitle, sectionId = null) {
        if (this.breadcrumbs.length > 0) {
            const lastBreadcrumb = this.breadcrumbs[this.breadcrumbs.length - 1];
            lastBreadcrumb.text = sectionTitle;
            if (sectionId) {
                lastBreadcrumb.url = `#${sectionId}`;
            }
            this.render();
        }
    }
    
    // Get current breadcrumb path
    getCurrentPath() {
        return this.breadcrumbs.map(b => b.text).join(this.config.separator);
    }
    
    // Get breadcrumb data for external use
    getBreadcrumbData() {
        return [...this.breadcrumbs];
    }
    
    // Set custom separator
    setSeparator(separator) {
        this.config.separator = separator;
        this.render();
    }
    
    // Enable/disable links
    setLinksEnabled(enabled) {
        this.config.enableLinks = enabled;
        this.render();
    }
    
    // Enable/disable home breadcrumb
    setHomeEnabled(enabled) {
        this.config.enableHome = enabled;
        this.render();
    }
    
    // Set maximum depth
    setMaxDepth(depth) {
        this.config.maxDepth = Math.max(1, Math.min(10, depth));
        if (this.breadcrumbs.length > this.config.maxDepth) {
            this.breadcrumbs = this.breadcrumbs.slice(-this.config.maxDepth);
            this.render();
        }
    }
    
    bindEvents() {
        // Listen for navigation events
        document.addEventListener('lessonLoaded', (e) => {
            if (e.detail.lessonData) {
                this.setLessonBreadcrumbs(e.detail.lessonData.title, e.detail.lessonId);
            }
        });
        
        document.addEventListener('sectionLoaded', (e) => {
            if (e.detail.sectionData && e.detail.lessonData) {
                this.setSectionBreadcrumbs(
                    e.detail.lessonData.title,
                    e.detail.lessonId,
                    e.detail.sectionData.title,
                    e.detail.sectionId
                );
            }
        });
    }
    
    destroy() {
        // Remove event listeners
        document.removeEventListener('lessonLoaded', this.handleLessonLoaded);
        document.removeEventListener('sectionLoaded', this.handleSectionLoaded);
        
        // Remove container
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        
        this.container = null;
        this.breadcrumbs = [];
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Breadcrumbs;
} else {
    window.Breadcrumbs = Breadcrumbs;
} 