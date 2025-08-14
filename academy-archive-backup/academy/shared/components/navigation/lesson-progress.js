/**
 * BLOCKZONE ACADEMY - LESSON PROGRESS COMPONENT
 * Tracks and displays lesson completion progress
 */

class LessonProgress {
    constructor(config = {}) {
        this.config = {
            storageKey: 'academy-lesson-progress',
            enablePersistence: true,
            enableAnimations: true,
            ...config
        };
        
        this.progress = new Map();
        this.currentLesson = null;
        this.init();
    }
    
    init() {
        this.loadProgress();
        this.createProgressUI();
        this.bindEvents();
    }
    
    loadProgress() {
        if (this.config.enablePersistence) {
            try {
                const savedProgress = localStorage.getItem(this.config.storageKey);
                if (savedProgress) {
                    const parsed = JSON.parse(savedProgress);
                    Object.keys(parsed).forEach(lessonId => {
                        this.progress.set(lessonId, parsed[lessonId]);
                    });
                }
            } catch (error) {
                console.warn('Failed to load progress from localStorage:', error);
            }
        }
    }
    
    saveProgress() {
        if (this.config.enablePersistence) {
            try {
                const progressObj = {};
                this.progress.forEach((value, key) => {
                    progressObj[key] = value;
                });
                localStorage.setItem(this.config.storageKey, JSON.stringify(progressObj));
            } catch (error) {
                console.warn('Failed to save progress to localStorage:', error);
            }
        }
    }
    
    createProgressUI() {
        const progressContainer = document.createElement('div');
        progressContainer.className = 'lesson-progress-container';
        progressContainer.innerHTML = `
            <div class="progress-header">
                <h3 class="progress-title">Lesson Progress</h3>
                <div class="progress-stats">
                    <span class="completed-lessons">0</span> / <span class="total-lessons">0</span> completed
                </div>
            </div>
            <div class="progress-list"></div>
            <div class="progress-summary">
                <div class="overall-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 0%"></div>
                    </div>
                    <span class="progress-percentage">0%</span>
                </div>
            </div>
        `;
        
        // Insert into page if header exists
        const header = document.querySelector('.academy-header');
        if (header) {
            header.appendChild(progressContainer);
        }
        
        this.progressContainer = progressContainer;
        this.updateProgressDisplay();
    }
    
    bindEvents() {
        // Listen for lesson completion events
        document.addEventListener('lessonCompleted', (e) => {
            this.markLessonComplete(e.detail.lessonId, e.detail.score);
        });
        
        // Listen for section completion events
        document.addEventListener('sectionCompleted', (e) => {
            this.markSectionComplete(e.detail.lessonId, e.detail.sectionId);
        });
        
        // Listen for quiz completion events
        document.addEventListener('quizCompleted', (e) => {
            this.updateQuizScore(e.detail.lessonId, e.detail.score, e.detail.maxScore);
        });
    }
    
    startLesson(lessonId, lessonData) {
        if (!this.progress.has(lessonId)) {
            this.progress.set(lessonId, {
                id: lessonId,
                title: lessonData.title || 'Untitled Lesson',
                started: new Date().toISOString(),
                completed: false,
                completedAt: null,
                sections: new Map(),
                quizScores: [],
                totalTime: 0,
                lastAccessed: new Date().toISOString()
            });
        }
        
        this.currentLesson = lessonId;
        this.updateLastAccessed(lessonId);
        this.updateProgressDisplay();
    }
    
    markSectionComplete(lessonId, sectionId) {
        const lessonProgress = this.progress.get(lessonId);
        if (lessonProgress) {
            if (!lessonProgress.sections.has(sectionId)) {
                lessonProgress.sections.set(sectionId, {
                    id: sectionId,
                    completed: true,
                    completedAt: new Date().toISOString()
                });
            }
            this.saveProgress();
            this.updateProgressDisplay();
        }
    }
    
    markLessonComplete(lessonId, score = null) {
        const lessonProgress = this.progress.get(lessonId);
        if (lessonProgress) {
            lessonProgress.completed = true;
            lessonProgress.completedAt = new Date().toISOString();
            if (score !== null) {
                lessonProgress.finalScore = score;
            }
            this.saveProgress();
            this.updateProgressDisplay();
            
            // Emit completion event
            document.dispatchEvent(new CustomEvent('lessonFullyCompleted', {
                detail: { lessonId, lessonProgress }
            }));
        }
    }
    
    updateQuizScore(lessonId, score, maxScore) {
        const lessonProgress = this.progress.get(lessonId);
        if (lessonProgress) {
            lessonProgress.quizScores.push({
                score,
                maxScore,
                timestamp: new Date().toISOString()
            });
            
            // Keep only the last 10 quiz attempts
            if (lessonProgress.quizScores.length > 10) {
                lessonProgress.quizScores = lessonProgress.quizScores.slice(-10);
            }
            
            this.saveProgress();
            this.updateProgressDisplay();
        }
    }
    
    updateLastAccessed(lessonId) {
        const lessonProgress = this.progress.get(lessonId);
        if (lessonProgress) {
            lessonProgress.lastAccessed = new Date().toISOString();
            this.saveProgress();
        }
    }
    
    updateProgressDisplay() {
        if (!this.progressContainer) return;
        
        const progressList = this.progressContainer.querySelector('.progress-list');
        const completedLessons = this.progressContainer.querySelector('.completed-lessons');
        const totalLessons = this.progressContainer.querySelector('.total-lessons');
        const progressFill = this.progressContainer.querySelector('.progress-fill');
        const progressPercentage = this.progressContainer.querySelector('.progress-percentage');
        
        if (!progressList || !completedLessons || !totalLessons || !progressFill || !progressPercentage) return;
        
        // Clear existing progress items
        progressList.innerHTML = '';
        
        let completedCount = 0;
        const totalCount = this.progress.size;
        
        // Create progress items for each lesson
        this.progress.forEach((lessonProgress, lessonId) => {
            const progressItem = this.createProgressItem(lessonProgress);
            progressList.appendChild(progressItem);
            
            if (lessonProgress.completed) {
                completedCount++;
            }
        });
        
        // Update stats
        completedLessons.textContent = completedCount;
        totalLessons.textContent = totalCount;
        
        // Update overall progress
        const overallProgress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
        progressFill.style.width = `${overallProgress}%`;
        progressPercentage.textContent = `${Math.round(overallProgress)}%`;
        
        // Add animation if enabled
        if (this.config.enableAnimations) {
            progressFill.classList.add('animate');
            setTimeout(() => progressFill.classList.remove('animate'), 500);
        }
    }
    
    createProgressItem(lessonProgress) {
        const progressItem = document.createElement('div');
        progressItem.className = 'progress-item';
        progressItem.classList.add(lessonProgress.completed ? 'completed' : 'in-progress');
        
        const titleElement = document.createElement('div');
        titleElement.className = 'progress-item-title';
        titleElement.textContent = lessonProgress.title;
        
        const statusElement = document.createElement('div');
        statusElement.className = 'progress-item-status';
        statusElement.textContent = lessonProgress.completed ? '✓ Completed' : '⏳ In Progress';
        
        const progressElement = document.createElement('div');
        progressElement.className = 'progress-item-bar';
        
        const progressFill = document.createElement('div');
        progressFill.className = 'progress-item-fill';
        
        // Calculate section completion
        const totalSections = lessonProgress.sections.size;
        const completedSections = Array.from(lessonProgress.sections.values()).filter(s => s.completed).length;
        const sectionProgress = totalSections > 0 ? (completedSections / totalSections) * 100 : 0;
        
        progressFill.style.width = `${sectionProgress}%`;
        progressElement.appendChild(progressFill);
        
        progressItem.appendChild(titleElement);
        progressItem.appendChild(statusElement);
        progressItem.appendChild(progressElement);
        
        return progressItem;
    }
    
    getLessonProgress(lessonId) {
        return this.progress.get(lessonId);
    }
    
    getOverallProgress() {
        const totalLessons = this.progress.size;
        const completedLessons = Array.from(this.progress.values()).filter(l => l.completed).length;
        
        return {
            total: totalLessons,
            completed: completedLessons,
            percentage: totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0
        };
    }
    
    getLessonStats(lessonId) {
        const lessonProgress = this.progress.get(lessonId);
        if (!lessonProgress) return null;
        
        const totalSections = lessonProgress.sections.size;
        const completedSections = Array.from(lessonProgress.sections.values()).filter(s => s.completed).length;
        const averageQuizScore = lessonProgress.quizScores.length > 0 
            ? lessonProgress.quizScores.reduce((sum, q) => sum + q.score, 0) / lessonProgress.quizScores.length
            : 0;
        
        return {
            totalSections,
            completedSections,
            sectionProgress: totalSections > 0 ? (completedSections / totalSections) * 100 : 0,
            quizAttempts: lessonProgress.quizScores.length,
            averageQuizScore: Math.round(averageQuizScore),
            timeSpent: lessonProgress.totalTime,
            lastAccessed: lessonProgress.lastAccessed
        };
    }
    
    resetLessonProgress(lessonId) {
        this.progress.delete(lessonId);
        this.saveProgress();
        this.updateProgressDisplay();
    }
    
    resetAllProgress() {
        this.progress.clear();
        this.saveProgress();
        this.updateProgressDisplay();
    }
    
    exportProgress() {
        const progressObj = {};
        this.progress.forEach((value, key) => {
            progressObj[key] = value;
        });
        return JSON.stringify(progressObj, null, 2);
    }
    
    importProgress(progressData) {
        try {
            const parsed = JSON.parse(progressData);
            this.progress.clear();
            Object.keys(parsed).forEach(lessonId => {
                this.progress.set(lessonId, parsed[lessonId]);
            });
            this.saveProgress();
            this.updateProgressDisplay();
            return true;
        } catch (error) {
            console.error('Failed to import progress:', error);
            return false;
        }
    }
    
    destroy() {
        // Remove event listeners
        document.removeEventListener('lessonCompleted', this.handleLessonCompleted);
        document.removeEventListener('sectionCompleted', this.handleSectionCompleted);
        document.removeEventListener('quizCompleted', this.handleQuizCompleted);
        
        // Remove UI elements
        if (this.progressContainer && this.progressContainer.parentNode) {
            this.progressContainer.parentNode.removeChild(this.progressContainer);
        }
        
        this.progress.clear();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LessonProgress;
} else {
    window.LessonProgress = LessonProgress;
} 