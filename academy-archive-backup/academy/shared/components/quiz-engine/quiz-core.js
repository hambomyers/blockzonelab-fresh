/**
 * BLOCKZONE ACADEMY - QUIZ CORE ENGINE
 * Manages quiz logic, question flow, and user interactions
 */

class QuizCore {
    constructor(config = {}) {
        this.config = {
            requireConfirmation: true,
            showImmediateFeedback: true,
            allowRetakes: true,
            maxAttempts: 3,
            timeLimit: null, // in seconds
            ...config
        };
        
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.userAnswers = new Map();
        this.quizState = 'not-started'; // not-started, in-progress, completed
        this.startTime = null;
        this.endTime = null;
        this.score = 0;
        this.totalQuestions = 0;
        
        this.container = null;
        this.eventListeners = new Map();
        
        this.init();
    }
    
    init() {
        this.bindEvents();
    }
    
    loadQuiz(quizData) {
        if (!quizData || !Array.isArray(quizData.questions)) {
            throw new Error('Invalid quiz data format');
        }
        
        this.questions = quizData.questions;
        this.totalQuestions = this.questions.length;
        this.currentQuestionIndex = 0;
        this.userAnswers.clear();
        this.quizState = 'not-started';
        this.score = 0;
        
        // Validate question structure
        this.validateQuestions();
        
        // Emit quiz loaded event
        this.emit('quizLoaded', {
            totalQuestions: this.totalQuestions,
            quizData: quizData
        });
    }
    
    validateQuestions() {
        this.questions.forEach((question, index) => {
            if (!question.text || !question.options || !Array.isArray(question.options)) {
                throw new Error(`Invalid question structure at index ${index}`);
            }
            
            if (!question.correctAnswer && question.type !== 'essay') {
                throw new Error(`Question ${index} missing correct answer`);
            }
        });
    }
    
    startQuiz() {
        if (this.quizState !== 'not-started') {
            throw new Error('Quiz cannot be started in current state');
        }
        
        this.quizState = 'in-progress';
        this.startTime = Date.now();
        this.currentQuestionIndex = 0;
        
        this.emit('quizStarted', {
            startTime: this.startTime,
            totalQuestions: this.totalQuestions
        });
        
        this.showQuestion(0);
    }
    
    showQuestion(index) {
        if (index < 0 || index >= this.questions.length) {
            throw new Error('Invalid question index');
        }
        
        this.currentQuestionIndex = index;
        const question = this.questions[index];
        
        this.emit('questionShown', {
            questionIndex: index,
            question: question,
            totalQuestions: this.totalQuestions,
            progress: this.getProgress()
        });
        
        return question;
    }
    
    submitAnswer(questionIndex, answer, requireConfirmation = null) {
        const shouldConfirm = requireConfirmation !== null ? requireConfirmation : this.config.requireConfirmation;
        
        if (shouldConfirm) {
            this.showConfirmationDialog(questionIndex, answer);
            return;
        }
        
        this.processAnswer(questionIndex, answer);
    }
    
    showConfirmationDialog(questionIndex, answer) {
        const question = this.questions[questionIndex];
        const dialog = document.createElement('div');
        dialog.className = 'quiz-confirmation-dialog';
        dialog.innerHTML = `
            <div class="confirmation-content">
                <h3>Confirm Your Answer</h3>
                <p><strong>Question:</strong> ${question.text}</p>
                <p><strong>Your Answer:</strong> ${this.formatAnswer(answer)}</p>
                <div class="confirmation-actions">
                    <button class="btn btn-secondary" data-action="cancel">Cancel</button>
                    <button class="btn btn-primary" data-action="confirm">Confirm Answer</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Handle confirmation actions
        dialog.querySelector('[data-action="confirm"]').addEventListener('click', () => {
            this.processAnswer(questionIndex, answer);
            document.body.removeChild(dialog);
        });
        
        dialog.querySelector('[data-action="cancel"]').addEventListener('click', () => {
            document.body.removeChild(dialog);
        });
    }
    
    formatAnswer(answer) {
        if (Array.isArray(answer)) {
            return answer.join(', ');
        }
        if (typeof answer === 'object' && answer.text) {
            return answer.text;
        }
        return String(answer);
    }
    
    processAnswer(questionIndex, answer) {
        const question = this.questions[questionIndex];
        const isCorrect = this.checkAnswer(question, answer);
        
        // Store user answer
        this.userAnswers.set(questionIndex, {
            answer: answer,
            isCorrect: isCorrect,
            timestamp: Date.now()
        });
        
        // Update score
        if (isCorrect) {
            this.score++;
        }
        
        // Emit answer submitted event
        this.emit('answerSubmitted', {
            questionIndex: questionIndex,
            answer: answer,
            isCorrect: isCorrect,
            score: this.score,
            totalQuestions: this.totalQuestions
        });
        
        // Show feedback if enabled
        if (this.config.showImmediateFeedback) {
            this.showFeedback(questionIndex, isCorrect);
        }
        
        // Check if quiz is complete
        if (this.userAnswers.size === this.totalQuestions) {
            this.completeQuiz();
        }
    }
    
    checkAnswer(question, userAnswer) {
        switch (question.type) {
            case 'multiple-choice':
                return this.checkMultipleChoice(question, userAnswer);
            case 'multiple-select':
                return this.checkMultipleSelect(question, userAnswer);
            case 'true-false':
                return this.checkTrueFalse(question, userAnswer);
            case 'essay':
                return this.checkEssay(question, userAnswer);
            case 'matching':
                return this.checkMatching(question, userAnswer);
            default:
                return this.checkMultipleChoice(question, userAnswer);
        }
    }
    
    checkMultipleChoice(question, userAnswer) {
        return userAnswer === question.correctAnswer;
    }
    
    checkMultipleSelect(question, userAnswer) {
        if (!Array.isArray(userAnswer) || !Array.isArray(question.correctAnswer)) {
            return false;
        }
        
        if (userAnswer.length !== question.correctAnswer.length) {
            return false;
        }
        
        return userAnswer.every(answer => question.correctAnswer.includes(answer));
    }
    
    checkTrueFalse(question, userAnswer) {
        return userAnswer === question.correctAnswer;
    }
    
    checkEssay(question, userAnswer) {
        // For essay questions, we'll consider them correct if they have content
        // In a real system, this would be reviewed by instructors
        return userAnswer && userAnswer.trim().length > 0;
    }
    
    checkMatching(question, userAnswer) {
        if (!Array.isArray(userAnswer) || !Array.isArray(question.correctAnswer)) {
            return false;
        }
        
        return userAnswer.every((match, index) => 
            match.left === question.correctAnswer[index].left && 
            match.right === question.correctAnswer[index].right
        );
    }
    
    showFeedback(questionIndex, isCorrect) {
        const question = this.questions[questionIndex];
        const feedback = {
            isCorrect: isCorrect,
            explanation: question.explanation || '',
            correctAnswer: question.correctAnswer,
            userAnswer: this.userAnswers.get(questionIndex)?.answer
        };
        
        this.emit('feedbackShown', {
            questionIndex: questionIndex,
            feedback: feedback
        });
    }
    
    nextQuestion() {
        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.currentQuestionIndex++;
            return this.showQuestion(this.currentQuestionIndex);
        }
        return null;
    }
    
    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            return this.showQuestion(this.currentQuestionIndex);
        }
        return null;
    }
    
    goToQuestion(index) {
        if (index >= 0 && index < this.questions.length) {
            return this.showQuestion(index);
        }
        return null;
    }
    
    completeQuiz() {
        this.quizState = 'completed';
        this.endTime = Date.now();
        
        const results = this.getResults();
        
        this.emit('quizCompleted', results);
        
        return results;
    }
    
    getResults() {
        const duration = this.endTime ? (this.endTime - this.startTime) / 1000 : 0;
        const percentage = (this.score / this.totalQuestions) * 100;
        
        return {
            score: this.score,
            totalQuestions: this.totalQuestions,
            percentage: percentage,
            duration: duration,
            startTime: this.startTime,
            endTime: this.endTime,
            userAnswers: Array.from(this.userAnswers.entries()),
            passed: percentage >= 70 // 70% passing threshold
        };
    }
    
    getProgress() {
        return {
            currentQuestion: this.currentQuestionIndex + 1,
            totalQuestions: this.totalQuestions,
            answeredQuestions: this.userAnswers.size,
            percentage: (this.userAnswers.size / this.totalQuestions) * 100
        };
    }
    
    getCurrentQuestion() {
        return this.questions[this.currentQuestionIndex];
    }
    
    getQuestionByIndex(index) {
        return this.questions[index];
    }
    
    getUserAnswer(questionIndex) {
        return this.userAnswers.get(questionIndex);
    }
    
    isQuestionAnswered(questionIndex) {
        return this.userAnswers.has(questionIndex);
    }
    
    resetQuiz() {
        this.currentQuestionIndex = 0;
        this.userAnswers.clear();
        this.quizState = 'not-started';
        this.score = 0;
        this.startTime = null;
        this.endTime = null;
        
        this.emit('quizReset');
    }
    
    retakeQuiz() {
        if (!this.config.allowRetakes) {
            throw new Error('Quiz retakes are not allowed');
        }
        
        this.resetQuiz();
        this.startQuiz();
    }
    
    // Event handling
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }
    
    off(event, callback) {
        if (this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }
    
    emit(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
        
        // Also dispatch custom DOM event
        document.dispatchEvent(new CustomEvent(`quiz:${event}`, {
            detail: data
        }));
    }
    
    // Utility methods
    getTimeRemaining() {
        if (!this.config.timeLimit || !this.startTime) {
            return null;
        }
        
        const elapsed = (Date.now() - this.startTime) / 1000;
        const remaining = this.config.timeLimit - elapsed;
        
        return Math.max(0, remaining);
    }
    
    isTimeUp() {
        const timeRemaining = this.getTimeRemaining();
        return timeRemaining !== null && timeRemaining <= 0;
    }
    
    destroy() {
        // Remove all event listeners
        this.eventListeners.clear();
        
        // Reset state
        this.resetQuiz();
        
        // Clear container reference
        this.container = null;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuizCore;
} else {
    window.QuizCore = QuizCore;
} 