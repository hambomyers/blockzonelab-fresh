/**
 * BLOCKZONE ACADEMY - QUIZ TEMPLATES
 * Generates HTML templates for different quiz types and elements
 */

class QuizTemplates {
    constructor() {
        this.templates = new Map();
        this.initTemplates();
    }
    
    initTemplates() {
        // Multiple choice template
        this.templates.set('multiple-choice', this.createMultipleChoiceTemplate.bind(this));
        
        // Multiple select template
        this.templates.set('multiple-select', this.createMultipleSelectTemplate.bind(this));
        
        // True/False template
        this.templates.set('true-false', this.createTrueFalseTemplate.bind(this));
        
        // Essay template
        this.templates.set('essay', this.createEssayTemplate.bind(this));
        
        // Matching template
        this.templates.set('matching', this.createMatchingTemplate.bind(this));
        
        // Quiz container template
        this.templates.set('container', this.createQuizContainerTemplate.bind(this));
        
        // Progress bar template
        this.templates.set('progress', this.createProgressTemplate.bind(this));
        
        // Results template
        this.templates.set('results', this.createResultsTemplate.bind(this));
    }
    
    createQuizContainerTemplate(config = {}) {
        const {
            title = 'Knowledge Check',
            showProgress = true,
            showTimer = false,
            showScore = true
        } = config;
        
        return `
            <div class="quiz-container" data-quiz-container>
                <div class="quiz-header">
                    <h3 class="quiz-title">${title}</h3>
                    ${showProgress ? '<div class="quiz-progress" data-quiz-progress></div>' : ''}
                    ${showTimer ? '<div class="quiz-timer" data-quiz-timer></div>' : ''}
                </div>
                
                <div class="quiz-content" data-quiz-content>
                    <!-- Questions will be rendered here -->
                </div>
                
                <div class="quiz-controls" data-quiz-controls>
                    <!-- Navigation buttons -->
                </div>
                
                ${showScore ? '<div class="quiz-score" data-quiz-score style="display: none;"></div>' : ''}
            </div>
        `;
    }
    
    createProgressTemplate(progress) {
        const { currentQuestion, totalQuestions, answeredQuestions, percentage } = progress;
        
        return `
            <div class="quiz-progress-container">
                <div class="quiz-progress-bar">
                    <div class="quiz-progress-fill" style="width: ${percentage}%"></div>
                </div>
                <div class="quiz-progress-text">
                    <span class="progress-current">${currentQuestion}</span>
                    <span class="progress-separator">/</span>
                    <span class="progress-total">${totalQuestions}</span>
                    <span class="progress-answered">(${answeredQuestions} answered)</span>
                </div>
            </div>
        `;
    }
    
    createMultipleChoiceTemplate(question, questionIndex) {
        const { text, options, explanation, image } = question;
        
        let optionsHtml = '';
        options.forEach((option, optionIndex) => {
            optionsHtml += `
                <div class="quiz-option" data-option="${optionIndex}">
                    <input type="radio" 
                           name="q${questionIndex}" 
                           value="${optionIndex}" 
                           id="opt${questionIndex}_${optionIndex}"
                           class="quiz-option-input">
                    <label for="opt${questionIndex}_${optionIndex}" class="quiz-option-label">
                        <span class="quiz-option-text">${option}</span>
                    </label>
                </div>
            `;
        });
        
        return `
            <div class="quiz-question" data-question="${questionIndex}">
                <div class="question-header">
                    <h4 class="question-number">Question ${questionIndex + 1}</h4>
                    ${image ? `<div class="question-image"><img src="${image}" alt="Question illustration"></div>` : ''}
                </div>
                
                <div class="question-content">
                    <p class="question-text">${text}</p>
                    ${explanation ? `<div class="question-context">💡 ${explanation}</div>` : ''}
                </div>
                
                <div class="question-options">
                    ${optionsHtml}
                </div>
                
                <div class="question-actions">
                    <button class="btn btn-primary submit-answer" data-question="${questionIndex}">
                        Submit Answer
                    </button>
                </div>
            </div>
        `;
    }
    
    createMultipleSelectTemplate(question, questionIndex) {
        const { text, options, explanation, image, maxSelections } = question;
        
        let optionsHtml = '';
        options.forEach((option, optionIndex) => {
            optionsHtml += `
                <div class="quiz-option" data-option="${optionIndex}">
                    <input type="checkbox" 
                           name="q${questionIndex}" 
                           value="${optionIndex}" 
                           id="opt${questionIndex}_${optionIndex}"
                           class="quiz-option-input"
                           ${maxSelections ? `data-max="${maxSelections}"` : ''}>
                    <label for="opt${questionIndex}_${optionIndex}" class="quiz-option-label">
                        <span class="quiz-option-text">${option}</span>
                    </label>
                </div>
            `;
        });
        
        const maxSelectionText = maxSelections ? 
            `<div class="selection-limit">Select up to ${maxSelections} options</div>` : '';
        
        return `
            <div class="quiz-question" data-question="${questionIndex}">
                <div class="question-header">
                    <h4 class="question-number">Question ${questionIndex + 1}</h4>
                    ${image ? `<div class="question-image"><img src="${image}" alt="Question illustration"></div>` : ''}
                </div>
                
                <div class="question-content">
                    <p class="question-text">${text}</p>
                    ${explanation ? `<div class="question-context">💡 ${explanation}</div>` : ''}
                    ${maxSelectionText}
                </div>
                
                <div class="question-options">
                    ${optionsHtml}
                </div>
                
                <div class="question-actions">
                    <button class="btn btn-primary submit-answer" data-question="${questionIndex}">
                        Submit Answer
                    </button>
                </div>
            </div>
        `;
    }
    
    createTrueFalseTemplate(question, questionIndex) {
        const { text, explanation, image } = question;
        
        return `
            <div class="quiz-question" data-question="${questionIndex}">
                <div class="question-header">
                    <h4 class="question-number">Question ${questionIndex + 1}</h4>
                    ${image ? `<div class="question-image"><img src="${image}" alt="Question illustration"></div>` : ''}
                </div>
                
                <div class="question-content">
                    <p class="question-text">${text}</p>
                    ${explanation ? `<div class="question-context">💡 ${explanation}</div>` : ''}
                </div>
                
                <div class="question-options">
                    <div class="quiz-option" data-option="true">
                        <input type="radio" 
                               name="q${questionIndex}" 
                               value="true" 
                               id="opt${questionIndex}_true"
                               class="quiz-option-input">
                        <label for="opt${questionIndex}_true" class="quiz-option-label">
                            <span class="quiz-option-text">True</span>
                        </label>
                    </div>
                    <div class="quiz-option" data-option="false">
                        <input type="radio" 
                               name="q${questionIndex}" 
                               value="false" 
                               id="opt${questionIndex}_false"
                               class="quiz-option-input">
                        <label for="opt${questionIndex}_false" class="quiz-option-label">
                            <span class="quiz-option-text">False</span>
                        </label>
                    </div>
                </div>
                
                <div class="question-actions">
                    <button class="btn btn-primary submit-answer" data-question="${questionIndex}">
                        Submit Answer
                    </button>
                </div>
            </div>
        `;
    }
    
    createEssayTemplate(question, questionIndex) {
        const { text, explanation, image, wordLimit, minWords } = question;
        
        const wordLimitText = wordLimit ? 
            `<div class="word-limit">Word limit: ${minWords || 0} - ${wordLimit} words</div>` : '';
        
        return `
            <div class="quiz-question" data-question="${questionIndex}">
                <div class="question-header">
                    <h4 class="question-number">Question ${questionIndex + 1}</h4>
                    ${image ? `<div class="question-image"><img src="${image}" alt="Question illustration"></div>` : ''}
                </div>
                
                <div class="question-content">
                    <p class="question-text">${text}</p>
                    ${explanation ? `<div class="question-context">💡 ${explanation}</div>` : ''}
                    ${wordLimitText}
                </div>
                
                <div class="question-input">
                    <textarea 
                        class="essay-input" 
                        name="q${questionIndex}" 
                        placeholder="Type your answer here..."
                        rows="6"
                        ${wordLimit ? `maxlength="${wordLimit * 10}"` : ''}
                        data-question="${questionIndex}">
                    </textarea>
                    ${wordLimit ? `<div class="word-count"><span class="current-words">0</span> / ${wordLimit} words</div>` : ''}
                </div>
                
                <div class="question-actions">
                    <button class="btn btn-primary submit-answer" data-question="${questionIndex}">
                        Submit Answer
                    </button>
                </div>
            </div>
        `;
    }
    
    createMatchingTemplate(question, questionIndex) {
        const { text, leftItems, rightItems, explanation, image } = question;
        
        let matchingHtml = '';
        leftItems.forEach((leftItem, index) => {
            const rightOptions = rightItems.map((rightItem, rightIndex) => 
                `<option value="${rightIndex}">${rightItem}</option>`
            ).join('');
            
            matchingHtml += `
                <div class="matching-pair">
                    <div class="matching-left">${leftItem}</div>
                    <div class="matching-arrow">→</div>
                    <select class="matching-select" data-left="${index}" data-question="${questionIndex}">
                        <option value="">Select...</option>
                        ${rightOptions}
                    </select>
                </div>
            `;
        });
        
        return `
            <div class="quiz-question" data-question="${questionIndex}">
                <div class="question-header">
                    <h4 class="question-number">Question ${questionIndex + 1}</h4>
                    ${image ? `<div class="question-image"><img src="${image}" alt="Question illustration"></div>` : ''}
                </div>
                
                <div class="question-content">
                    <p class="question-text">${text}</p>
                    ${explanation ? `<div class="question-context">💡 ${explanation}</div>` : ''}
                </div>
                
                <div class="matching-container">
                    ${matchingHtml}
                </div>
                
                <div class="question-actions">
                    <button class="btn btn-primary submit-answer" data-question="${questionIndex}">
                        Submit Answer
                    </button>
                </div>
            </div>
        `;
    }
    
    createResultsTemplate(results) {
        const { score, totalQuestions, percentage, duration, passed, userAnswers } = results;
        
        const scoreClass = percentage >= 90 ? 'excellent' : 
                          percentage >= 80 ? 'great' : 
                          percentage >= 70 ? 'good' : 
                          percentage >= 60 ? 'fair' : 'needs-improvement';
        
        const scoreMessage = percentage >= 90 ? '🎯 Excellent! You have mastered this material.' :
                            percentage >= 80 ? '🌟 Great job! You have a solid understanding.' :
                            percentage >= 70 ? '👍 Good work! You have a good grasp of the concepts.' :
                            percentage >= 60 ? '📚 Not bad! Review the material to strengthen your knowledge.' :
                            '📖 Keep studying! Focus on the areas where you struggled.';
        
        let breakdownHtml = '';
        userAnswers.forEach(([questionIndex, answerData]) => {
            const { isCorrect, answer } = answerData;
            const question = this.getQuestionByIndex(questionIndex);
            breakdownHtml += `
                <div class="result-item ${isCorrect ? 'correct' : 'incorrect'}">
                    <div class="result-status">${isCorrect ? '✅' : '❌'}</div>
                    <div class="result-question">Q${questionIndex + 1}: ${question.text}</div>
                    <div class="result-answer">Your answer: ${this.formatAnswer(answer)}</div>
                    ${!isCorrect && question.correctAnswer ? 
                        `<div class="result-correct">Correct: ${this.formatAnswer(question.correctAnswer)}</div>` : ''}
                </div>
            `;
        });
        
        return `
            <div class="quiz-results">
                <div class="results-header">
                    <h3>🎉 Quiz Complete!</h3>
                </div>
                
                <div class="results-summary">
                    <div class="final-score ${scoreClass}">
                        <h2>Final Score: ${score} / ${totalQuestions}</h2>
                        <div class="score-percentage">${percentage.toFixed(1)}%</div>
                        <div class="score-status">${passed ? 'PASSED' : 'NOT PASSED'}</div>
                    </div>
                    
                    <div class="results-details">
                        <div class="detail-item">
                            <span class="detail-label">Time taken:</span>
                            <span class="detail-value">${Math.round(duration)} seconds</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Performance:</span>
                            <span class="detail-value">${scoreMessage}</span>
                        </div>
                    </div>
                </div>
                
                <div class="results-breakdown">
                    <h4>Question Breakdown:</h4>
                    <div class="breakdown-list">
                        ${breakdownHtml}
                    </div>
                </div>
                
                <div class="results-actions">
                    <button class="btn btn-secondary retake-quiz">Take Quiz Again</button>
                    <button class="btn btn-primary review-answers">Review Answers</button>
                </div>
            </div>
        `;
    }
    
    // Helper method to get question by index (would need to be passed from quiz core)
    getQuestionByIndex(index) {
        // This would typically be provided by the quiz core
        return { text: 'Question text', correctAnswer: null };
    }
    
    // Helper method to format answers for display
    formatAnswer(answer) {
        if (Array.isArray(answer)) {
            return answer.join(', ');
        }
        if (typeof answer === 'object' && answer.text) {
            return answer.text;
        }
        return String(answer);
    }
    
    // Generate template for a specific question type
    generateQuestionTemplate(question, questionIndex) {
        const templateMethod = this.templates.get(question.type);
        if (templateMethod) {
            return templateMethod(question, questionIndex);
        }
        
        // Fallback to multiple choice
        return this.createMultipleChoiceTemplate(question, questionIndex);
    }
    
    // Generate complete quiz HTML
    generateQuizHTML(quizData, config = {}) {
        const containerTemplate = this.createQuizContainerTemplate(config);
        const progressTemplate = this.createProgressTemplate({
            currentQuestion: 1,
            totalQuestions: quizData.questions.length,
            answeredQuestions: 0,
            percentage: 0
        });
        
        return {
            container: containerTemplate,
            progress: progressTemplate,
            questions: quizData.questions.map((question, index) => 
                this.generateQuestionTemplate(question, index)
            )
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuizTemplates;
} else {
    window.QuizTemplates = QuizTemplates;
} 