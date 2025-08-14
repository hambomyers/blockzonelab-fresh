// Academy Main Controller - ES Module
// Follows same pattern as main site's event-bus.js

class AcademyCore {
    constructor() {
        this.currentLesson = null;
        this.progress = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadProgress();
        console.log('Academy Core initialized');
    }

    async loadLesson(lessonId) {
        try {
            const module = await import(`./lessons/${lessonId}.js`);
            this.currentLesson = new module.default();
            this.currentLesson.render();
            this.updateProgress(lessonId);
        } catch (error) {
            console.error(`Failed to load lesson ${lessonId}:`, error);
        }
    }

    setupEventListeners() {
        // Navigation events
        document.addEventListener('click', (e) => {
            if (e.target.dataset.lesson) {
                this.loadLesson(e.target.dataset.lesson);
            }
        });
    }

    loadProgress() {
        const saved = localStorage.getItem('academy-progress');
        this.progress = saved ? JSON.parse(saved) : {};
    }

    updateProgress(lessonId) {
        this.progress[lessonId] = {
            completed: false,
            lastAccessed: new Date().toISOString()
        };
        localStorage.setItem('academy-progress', JSON.stringify(this.progress));
    }
}

// Auto-initialize when loaded
window.academyCore = new AcademyCore();

export default AcademyCore;
