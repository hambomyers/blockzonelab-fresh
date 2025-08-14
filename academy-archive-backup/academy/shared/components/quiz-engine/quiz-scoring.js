/**
 * BLOCKZONE ACADEMY - QUIZ SCORING SYSTEM
 * Manages points, progress tracking, and scoring algorithms
 */

class QuizScoring {
    constructor(config = {}) {
        this.config = {
            basePoints: 10,
            difficultyMultiplier: true,
            timeBonus: true,
            streakBonus: true,
            penaltyForIncorrect: false,
            passingThreshold: 70,
            ...config
        };
        
        this.scoreHistory = [];
        this.currentStreak = 0;
        this.maxStreak = 0;
        this.totalPoints = 0;
        this.bonusPoints = 0;
        this.penaltyPoints = 0;
        
        this.init();
    }
    
    init() {
        this.resetScoring();
    }
    
    resetScoring() {
        this.scoreHistory = [];
        this.currentStreak = 0;
        this.maxStreak = 0;
        this.totalPoints = 0;
        this.bonusPoints = 0;
        this.penaltyPoints = 0;
    }
    
    calculateQuestionScore(question, userAnswer, timeTaken = null, attemptNumber = 1) {
        const isCorrect = this.checkAnswer(question, userAnswer);
        let baseScore = 0;
        let bonusScore = 0;
        let penaltyScore = 0;
        
        if (isCorrect) {
            // Base points for correct answer
            baseScore = this.config.basePoints;
            
            // Difficulty multiplier
            if (this.config.difficultyMultiplier && question.difficulty) {
                baseScore = this.applyDifficultyMultiplier(baseScore, question.difficulty);
            }
            
            // Time bonus (faster = more points)
            if (this.config.timeBonus && timeTaken && question.timeLimit) {
                bonusScore += this.calculateTimeBonus(timeTaken, question.timeLimit);
            }
            
            // Streak bonus
            if (this.config.streakBonus) {
                bonusScore += this.calculateStreakBonus();
            }
            
            // Update streak
            this.updateStreak(true);
            
        } else {
            // Penalty for incorrect answers
            if (this.config.penaltyForIncorrect) {
                penaltyScore = this.calculatePenalty(attemptNumber);
            }
            
            // Reset streak
            this.updateStreak(false);
        }
        
        const totalScore = Math.max(0, baseScore + bonusScore - penaltyScore);
        
        // Record score
        const scoreRecord = {
            questionId: question.id || question.text,
            isCorrect: isCorrect,
            baseScore: baseScore,
            bonusScore: bonusScore,
            penaltyScore: penaltyScore,
            totalScore: totalScore,
            timeTaken: timeTaken,
            attemptNumber: attemptNumber,
            timestamp: Date.now()
        };
        
        this.scoreHistory.push(scoreRecord);
        
        // Update totals
        this.totalPoints += totalScore;
        this.bonusPoints += bonusScore;
        this.penaltyPoints += penaltyScore;
        
        return {
            score: totalScore,
            breakdown: scoreRecord
        };
    }
    
    applyDifficultyMultiplier(baseScore, difficulty) {
        const multipliers = {
            'easy': 1.0,
            'medium': 1.2,
            'hard': 1.5,
            'expert': 2.0
        };
        
        return Math.round(baseScore * (multipliers[difficulty] || 1.0));
    }
    
    calculateTimeBonus(timeTaken, timeLimit) {
        if (!timeTaken || !timeLimit) return 0;
        
        const timeRatio = timeTaken / timeLimit;
        let bonus = 0;
        
        if (timeRatio <= 0.5) {
            bonus = 5; // Fast answer bonus
        } else if (timeRatio <= 0.75) {
            bonus = 3; // Good time bonus
        } else if (timeRatio <= 1.0) {
            bonus = 1; // On time bonus
        }
        
        return bonus;
    }
    
    calculateStreakBonus() {
        if (this.currentStreak < 3) return 0;
        
        // Bonus increases with streak length
        if (this.currentStreak >= 10) return 5;
        if (this.currentStreak >= 7) return 3;
        if (this.currentStreak >= 5) return 2;
        if (this.currentStreak >= 3) return 1;
        
        return 0;
    }
    
    calculatePenalty(attemptNumber) {
        // Penalty increases with each attempt
        const penaltyMultiplier = Math.min(attemptNumber - 1, 3);
        return this.config.basePoints * 0.2 * penaltyMultiplier;
    }
    
    updateStreak(isCorrect) {
        if (isCorrect) {
            this.currentStreak++;
            this.maxStreak = Math.max(this.maxStreak, this.currentStreak);
        } else {
            this.currentStreak = 0;
        }
    }
    
    getCurrentScore() {
        return {
            total: this.totalPoints,
            base: this.totalPoints - this.bonusPoints + this.penaltyPoints,
            bonus: this.bonusPoints,
            penalty: this.penaltyPoints,
            currentStreak: this.currentStreak,
            maxStreak: this.maxStreak
        };
    }
    
    getScoreBreakdown() {
        const totalQuestions = this.scoreHistory.length;
        const correctAnswers = this.scoreHistory.filter(record => record.isCorrect).length;
        const incorrectAnswers = totalQuestions - correctAnswers;
        
        return {
            totalQuestions: totalQuestions,
            correctAnswers: correctAnswers,
            incorrectAnswers: incorrectAnswers,
            accuracy: totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0,
            averageScore: totalQuestions > 0 ? this.totalPoints / totalQuestions : 0,
            scoreHistory: [...this.scoreHistory]
        };
    }
    
    getPerformanceGrade() {
        const breakdown = this.getScoreBreakdown();
        const accuracy = breakdown.accuracy;
        
        if (accuracy >= 95) return { grade: 'A+', level: 'Mastery', color: 'var(--color-success)' };
        if (accuracy >= 90) return { grade: 'A', level: 'Excellent', color: 'var(--color-success)' };
        if (accuracy >= 80) return { grade: 'B', level: 'Very Good', color: 'var(--color-primary)' };
        if (accuracy >= 70) return { grade: 'C', level: 'Good', color: 'var(--color-warning)' };
        if (accuracy >= 60) return { grade: 'D', level: 'Satisfactory', color: 'var(--color-warning)' };
        return { grade: 'F', level: 'Needs Improvement', color: 'var(--color-error)' };
    }
    
    hasPassed() {
        const breakdown = this.getScoreBreakdown();
        return breakdown.accuracy >= this.config.passingThreshold;
    }
    
    getProgressTowardsGoal(goalPercentage = 80) {
        const breakdown = this.getScoreBreakdown();
        const currentPercentage = breakdown.accuracy;
        const progress = Math.min(100, (currentPercentage / goalPercentage) * 100);
        
        return {
            current: currentPercentage,
            goal: goalPercentage,
            progress: progress,
            remaining: Math.max(0, goalPercentage - currentPercentage),
            isComplete: currentPercentage >= goalPercentage
        };
    }
    
    getStreakInfo() {
        return {
            current: this.currentStreak,
            max: this.maxStreak,
            isActive: this.currentStreak > 0,
            nextMilestone: this.getNextStreakMilestone()
        };
    }
    
    getNextStreakMilestone() {
        const milestones = [3, 5, 7, 10, 15, 20];
        const nextMilestone = milestones.find(milestone => this.currentStreak < milestone);
        
        if (!nextMilestone) {
            return { milestone: null, progress: 100, description: 'All milestones achieved!' };
        }
        
        const progress = (this.currentStreak / nextMilestone) * 100;
        const remaining = nextMilestone - this.currentStreak;
        
        return {
            milestone: nextMilestone,
            progress: progress,
            remaining: remaining,
            description: `${remaining} more correct answers to reach ${nextMilestone} in a row!`
        };
    }
    
    getScoreTrend() {
        if (this.scoreHistory.length < 2) {
            return { trend: 'stable', direction: 'none', change: 0 };
        }
        
        const recentScores = this.scoreHistory.slice(-5);
        const olderScores = this.scoreHistory.slice(-10, -5);
        
        if (olderScores.length === 0) {
            return { trend: 'stable', direction: 'none', change: 0 };
        }
        
        const recentAverage = recentScores.reduce((sum, record) => sum + record.totalScore, 0) / recentScores.length;
        const olderAverage = olderScores.reduce((sum, record) => sum + record.totalScore, 0) / olderScores.length;
        
        const change = recentAverage - olderAverage;
        const changePercent = olderAverage > 0 ? (change / olderAverage) * 100 : 0;
        
        let trend = 'stable';
        let direction = 'none';
        
        if (Math.abs(changePercent) < 5) {
            trend = 'stable';
        } else if (changePercent > 5) {
            trend = 'improving';
            direction = 'up';
        } else {
            trend = 'declining';
            direction = 'down';
        }
        
        return {
            trend: trend,
            direction: direction,
            change: changePercent,
            recentAverage: recentAverage,
            olderAverage: olderAverage
        };
    }
    
    // Export scoring data for external use
    exportScoreData() {
        return {
            currentScore: this.getCurrentScore(),
            breakdown: this.getScoreBreakdown(),
            performance: this.getPerformanceGrade(),
            progress: this.getProgressTowardsGoal(),
            streak: this.getStreakInfo(),
            trend: this.getScoreTrend(),
            timestamp: Date.now()
        };
    }
    
    // Import scoring data (useful for persistence)
    importScoreData(data) {
        if (data.scoreHistory) {
            this.scoreHistory = data.scoreHistory;
        }
        if (data.currentStreak !== undefined) {
            this.currentStreak = data.currentStreak;
        }
        if (data.maxStreak !== undefined) {
            this.maxStreak = data.maxStreak;
        }
        if (data.totalPoints !== undefined) {
            this.totalPoints = data.totalPoints;
        }
        if (data.bonusPoints !== undefined) {
            this.bonusPoints = data.bonusPoints;
        }
        if (data.penaltyPoints !== undefined) {
            this.penaltyPoints = data.penaltyPoints;
        }
    }
    
    // Reset scoring for a new quiz
    resetForNewQuiz() {
        this.resetScoring();
    }
    
    // Get summary for display
    getScoreSummary() {
        const current = this.getCurrentScore();
        const breakdown = this.getScoreBreakdown();
        const performance = this.getPerformanceGrade();
        const streak = this.getStreakInfo();
        
        return {
            totalScore: current.total,
            accuracy: breakdown.accuracy.toFixed(1) + '%',
            grade: performance.grade,
            level: performance.level,
            currentStreak: streak.current,
            maxStreak: streak.max,
            questionsAnswered: breakdown.totalQuestions,
            correctAnswers: breakdown.correctAnswers
        };
    }
    
    // Helper method to check if answer is correct
    checkAnswer(question, userAnswer) {
        // This would typically be provided by the quiz core
        // For now, we'll assume it's passed in or calculated elsewhere
        return true; // Placeholder
    }
    
    destroy() {
        this.resetScoring();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuizScoring;
} else {
    window.QuizScoring = QuizScoring;
} 