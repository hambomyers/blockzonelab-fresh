// BlockZone Academy - Main JavaScript
class AcademyManager {
    constructor() {
        this.currentSection = null;
        this.progress = this.loadProgress();
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupSmoothScrolling();
        this.setupProgressTracking();
        this.setupInteractiveElements();
        this.loadUserIdentity();
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                this.scrollToSection(targetId);
                this.updateActiveNav(link);
            });
        });

        // Update active nav on scroll
        window.addEventListener('scroll', () => {
            this.updateActiveNavOnScroll();
        });
    }

    setupSmoothScrolling() {
        const sections = document.querySelectorAll('.academy-section');
        sections.forEach(section => {
            section.style.scrollMarginTop = '100px';
        });
    }

    scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }

    updateActiveNav(activeLink) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        activeLink.classList.add('active');
    }

    updateActiveNavOnScroll() {
        const sections = document.querySelectorAll('.academy-section');
        const navLinks = document.querySelectorAll('.nav-link');
        
        let currentSection = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 150;
            const sectionHeight = section.clientHeight;
            if (window.pageYOffset >= sectionTop && window.pageYOffset < sectionTop + sectionHeight) {
                currentSection = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    }

    setupProgressTracking() {
        // Track lesson completion
        const lessonLinks = document.querySelectorAll('.lesson-card a');
        lessonLinks.forEach(link => {
            link.addEventListener('click', () => {
                const lessonId = link.closest('.lesson-card').querySelector('h3').textContent;
                this.markLessonCompleted(lessonId);
            });
        });

        // Track course completion
        const courseLinks = document.querySelectorAll('.course-item');
        courseLinks.forEach(course => {
            course.addEventListener('click', () => {
                const courseId = course.querySelector('h4').textContent;
                this.markCourseViewed(courseId);
            });
        });
    }

    setupInteractiveElements() {
        // Add hover effects to cards
        const cards = document.querySelectorAll('.curriculum-card, .lesson-card, .semester-card, .project-card, .resource-card');
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-5px)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
            });
        });

        // Add click effects to buttons
        const buttons = document.querySelectorAll('.btn-primary, .btn-secondary');
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.createRippleEffect(e);
            });
        });
    }

    createRippleEffect(event) {
        const button = event.currentTarget;
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');
        
        button.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    markLessonCompleted(lessonId) {
        if (!this.progress.completedLessons.includes(lessonId)) {
            this.progress.completedLessons.push(lessonId);
            this.saveProgress();
            this.updateProgressDisplay();
        }
    }

    markCourseViewed(courseId) {
        if (!this.progress.viewedCourses.includes(courseId)) {
            this.progress.viewedCourses.push(courseId);
            this.saveProgress();
            this.updateProgressDisplay();
        }
    }

    loadProgress() {
        const saved = localStorage.getItem('academy-progress');
        return saved ? JSON.parse(saved) : {
            completedLessons: [],
            viewedCourses: [],
            quizScores: {},
            projectSubmissions: []
        };
    }

    saveProgress() {
        localStorage.setItem('academy-progress', JSON.stringify(this.progress));
    }

    updateProgressDisplay() {
        // Update progress indicators if they exist
        const progressBars = document.querySelectorAll('.progress-fill');
        progressBars.forEach(bar => {
            const total = parseInt(bar.dataset.total) || 100;
            const completed = parseInt(bar.dataset.completed) || 0;
            const percentage = (completed / total) * 100;
            bar.style.width = `${percentage}%`;
        });

        // Update completion badges
        const lessonCards = document.querySelectorAll('.lesson-card');
        lessonCards.forEach(card => {
            const lessonTitle = card.querySelector('h3').textContent;
            if (this.progress.completedLessons.includes(lessonTitle)) {
                this.addCompletionBadge(card);
            }
        });
    }

    addCompletionBadge(card) {
        if (!card.querySelector('.completion-badge')) {
            const badge = document.createElement('div');
            badge.className = 'completion-badge';
            badge.innerHTML = '✓';
            badge.style.cssText = `
                position: absolute;
                top: 10px;
                right: 10px;
                width: 24px;
                height: 24px;
                background: var(--academy-success);
                color: var(--academy-dark);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 12px;
            `;
            card.style.position = 'relative';
            card.appendChild(badge);
        }
    }

    async loadUserIdentity() {
        try {
            // Import the identity manager
            const { IdentityManager } = await import('/shared/core/IdentityManager.js');
            
            const identityManager = new IdentityManager();
            if (identityManager.hasValidIdentity()) {
                const playerName = identityManager.getPlayerName();
                this.displayWelcomeMessage(playerName);
            }
        } catch (error) {
            console.log('Identity manager not available, continuing without user identity');
        }
    }

    displayWelcomeMessage(playerName) {
        const welcomeBanner = document.createElement('div');
        welcomeBanner.style.cssText = `
            background: linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(0, 212, 255, 0.05));
            border: 1px solid rgba(0, 212, 255, 0.3);
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
            animation: fadeIn 0.5s ease-out;
        `;
        
        welcomeBanner.innerHTML = `
            <h3 style="color: var(--academy-primary); margin-bottom: 10px;">Welcome back, ${playerName}!</h3>
            <p style="color: var(--academy-text-secondary); margin-bottom: 15px;">Continue your blockchain learning journey where you left off.</p>
            <div style="color: var(--academy-text-secondary); font-size: 0.9rem;">
                <strong>Progress:</strong> ${this.progress.completedLessons.length} lessons completed
            </div>
        `;
        
        // Insert at top of main content
        const main = document.querySelector('.academy-main');
        main.insertBefore(welcomeBanner, main.firstChild);
    }

    // Utility methods for external use
    static getInstance() {
        if (!AcademyManager.instance) {
            AcademyManager.instance = new AcademyManager();
        }
        return AcademyManager.instance;
    }

    getProgress() {
        return this.progress;
    }

    resetProgress() {
        this.progress = {
            completedLessons: [],
            viewedCourses: [],
            quizScores: {},
            projectSubmissions: []
        };
        this.saveProgress();
        this.updateProgressDisplay();
    }
}

// Initialize academy when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const academy = AcademyManager.getInstance();
    
    // Add CSS for ripple effect
    const style = document.createElement('style');
    style.textContent = `
        .ripple {
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            transform: scale(0);
            animation: ripple-animation 0.6s linear;
            pointer-events: none;
        }
        
        @keyframes ripple-animation {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
        
        .nav-link.active {
            color: var(--academy-primary);
            background: rgba(0, 212, 255, 0.1);
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);
});

// Export for external use
window.AcademyManager = AcademyManager;
