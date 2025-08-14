/**
 * BLOCKZONE ACADEMY - QUIZ FEEDBACK SYSTEM
 * Provides detailed explanations and learning insights for quiz questions
 */

class QuizFeedback {
    constructor(config = {}) {
        this.config = {
            showImmediateFeedback: true,
            showDetailedExplanations: true,
            showLearningResources: true,
            showRelatedConcepts: true,
            feedbackDelay: 1000, // ms delay before showing feedback
            ...config
        };
        
        this.feedbackHistory = new Map();
        this.learningResources = new Map();
        this.relatedConcepts = new Map();
        
        this.init();
    }
    
    init() {
        this.loadLearningResources();
        this.loadRelatedConcepts();
    }
    
    loadLearningResources() {
        // Pre-load common learning resources for different topics
        this.learningResources.set('bitcoin', [
            { type: 'video', title: 'Bitcoin Whitepaper Explained', url: '/academy/resources/videos/bitcoin-whitepaper' },
            { type: 'article', title: 'Understanding Bitcoin Mining', url: '/academy/resources/articles/mining-explained' },
            { type: 'demo', title: 'SHA-256 Hash Demo', url: '/academy/demos/sha256' }
        ]);
        
        this.learningResources.set('economics', [
            { type: 'video', title: 'Austrian Economics Principles', url: '/academy/resources/videos/austrian-economics' },
            { type: 'article', title: 'Sound Money vs Fiat Currency', url: '/academy/resources/articles/sound-money' },
            { type: 'demo', title: 'Inflation Calculator', url: '/academy/demos/inflation' }
        ]);
        
        this.learningResources.set('cryptography', [
            { type: 'video', title: 'Cryptography Basics', url: '/academy/resources/videos/crypto-basics' },
            { type: 'article', title: 'Public Key Cryptography', url: '/academy/resources/articles/public-key' },
            { type: 'demo', title: 'Merkle Tree Demo', url: '/academy/demos/merkle-tree' }
        ]);
    }
    
    loadRelatedConcepts() {
        // Pre-load related concepts for different topics
        this.relatedConcepts.set('bitcoin', [
            'Blockchain Technology',
            'Cryptographic Hashing',
            'Digital Signatures',
            'Peer-to-Peer Networks',
            'Proof of Work'
        ]);
        
        this.relatedConcepts.set('economics', [
            'Supply and Demand',
            'Monetary Policy',
            'Inflation and Deflation',
            'Market Forces',
            'Economic Freedom'
        ]);
        
        this.relatedConcepts.set('cryptography', [
            'Hash Functions',
            'Symmetric Encryption',
            'Asymmetric Encryption',
            'Digital Certificates',
            'Zero-Knowledge Proofs'
        ]);
    }
    
    generateFeedback(question, userAnswer, isCorrect, context = {}) {
        const feedback = {
            isCorrect: isCorrect,
            question: question,
            userAnswer: userAnswer,
            correctAnswer: question.correctAnswer,
            explanation: this.getExplanation(question, isCorrect, context),
            learningPoints: this.getLearningPoints(question, isCorrect, context),
            relatedResources: this.getRelatedResources(question),
            relatedConcepts: this.getRelatedConcepts(question),
            improvementTips: this.getImprovementTips(question, isCorrect, context),
            timestamp: Date.now()
        };
        
        // Store feedback in history
        this.feedbackHistory.set(question.id || question.text, feedback);
        
        return feedback;
    }
    
    getExplanation(question, isCorrect, context) {
        if (question.explanation) {
            return question.explanation;
        }
        
        // Generate contextual explanation based on question type and topic
        const topic = this.identifyTopic(question);
        const type = question.type || 'multiple-choice';
        
        if (isCorrect) {
            return this.generateCorrectExplanation(question, topic, type, context);
        } else {
            return this.generateIncorrectExplanation(question, topic, type, context);
        }
    }
    
    generateCorrectExplanation(question, topic, type, context) {
        const explanations = {
            'bitcoin': {
                'multiple-choice': 'Excellent! You correctly identified the fundamental concept of Bitcoin.',
                'true-false': 'Perfect! You understand this key Bitcoin principle.',
                'essay': 'Great analysis! You\'ve captured the essential elements of this concept.'
            },
            'economics': {
                'multiple-choice': 'Well done! You\'ve grasped this important economic principle.',
                'true-false': 'Correct! This is a fundamental concept in Austrian economics.',
                'essay': 'Excellent understanding! You\'ve articulated the economic principles clearly.'
            },
            'cryptography': {
                'multiple-choice': 'Perfect! You understand this cryptographic concept correctly.',
                'true-false': 'Excellent! You\'ve identified the right cryptographic principle.',
                'essay': 'Great work! You\'ve explained the cryptographic concept accurately.'
            }
        };
        
        return explanations[topic]?.[type] || 'Great job! You answered this question correctly.';
    }
    
    generateIncorrectExplanation(question, topic, type, context) {
        const explanations = {
            'bitcoin': {
                'multiple-choice': 'Not quite right. Let me explain the correct concept...',
                'true-false': 'That\'s incorrect. Here\'s why...',
                'essay': 'Good effort, but there are some misconceptions. Let me clarify...'
            },
            'economics': {
                'multiple-choice': 'That\'s not the right answer. Here\'s the economic principle...',
                'true-false': 'Incorrect. Let me explain the economic concept...',
                'essay': 'You\'re on the right track, but let me provide the correct perspective...'
            },
            'cryptography': {
                'multiple-choice': 'That\'s not correct. Here\'s the cryptographic principle...',
                'true-false': 'Incorrect. Let me explain the cryptographic concept...',
                'essay': 'Good thinking, but let me clarify the cryptographic details...'
            }
        };
        
        return explanations[topic]?.[type] || 'That\'s not quite right. Let me explain...';
    }
    
    getLearningPoints(question, isCorrect, context) {
        const learningPoints = [];
        const topic = this.identifyTopic(question);
        
        if (isCorrect) {
            // Reinforce correct understanding
            learningPoints.push({
                type: 'reinforcement',
                text: 'You\'ve demonstrated a solid understanding of this concept.',
                importance: 'high'
            });
            
            // Suggest next learning steps
            if (topic === 'bitcoin') {
                learningPoints.push({
                    type: 'next-step',
                    text: 'Consider exploring how this concept applies to other cryptocurrencies.',
                    importance: 'medium'
                });
            }
        } else {
            // Identify misconceptions
            learningPoints.push({
                type: 'correction',
                text: 'This is a common misconception. The correct understanding is...',
                importance: 'high'
            });
            
            // Provide foundational knowledge
            learningPoints.push({
                type: 'foundation',
                text: 'To understand this better, review the basic principles of ' + topic + '.',
                importance: 'high'
            });
        }
        
        // Add topic-specific learning points
        const topicLearningPoints = this.getTopicLearningPoints(topic, question);
        learningPoints.push(...topicLearningPoints);
        
        return learningPoints;
    }
    
    getTopicLearningPoints(topic, question) {
        const learningPoints = {
            'bitcoin': [
                {
                    type: 'concept',
                    text: 'Bitcoin operates on a decentralized network without central authority.',
                    importance: 'high'
                },
                {
                    type: 'concept',
                    text: 'The blockchain provides immutable record-keeping through cryptographic proof.',
                    importance: 'high'
                }
            ],
            'economics': [
                {
                    type: 'concept',
                    text: 'Sound money maintains its value over time and cannot be easily inflated.',
                    importance: 'high'
                },
                {
                    type: 'concept',
                    text: 'Market forces naturally regulate supply and demand without central planning.',
                    importance: 'high'
                }
            ],
            'cryptography': [
                {
                    type: 'concept',
                    text: 'Cryptographic hashing provides one-way verification of data integrity.',
                    importance: 'high'
                },
                {
                    type: 'concept',
                    text: 'Public key cryptography enables secure communication without shared secrets.',
                    importance: 'high'
                }
            ]
        };
        
        return learningPoints[topic] || [];
    }
    
    getRelatedResources(question) {
        const topic = this.identifyTopic(question);
        return this.learningResources.get(topic) || [];
    }
    
    getRelatedConcepts(question) {
        const topic = this.identifyTopic(question);
        return this.relatedConcepts.get(topic) || [];
    }
    
    getImprovementTips(question, isCorrect, context) {
        const tips = [];
        
        if (!isCorrect) {
            tips.push({
                type: 'study',
                text: 'Review the foundational concepts before moving to advanced topics.',
                priority: 'high'
            });
            
            tips.push({
                type: 'practice',
                text: 'Try similar questions to reinforce your understanding.',
                priority: 'medium'
            });
        }
        
        // Add general improvement tips
        tips.push({
            type: 'general',
            text: 'Take notes on concepts you find challenging for later review.',
            priority: 'medium'
        });
        
        return tips;
    }
    
    identifyTopic(question) {
        const text = question.text.toLowerCase();
        const options = question.options ? question.options.join(' ').toLowerCase() : '';
        const fullText = text + ' ' + options;
        
        if (fullText.includes('bitcoin') || fullText.includes('blockchain') || fullText.includes('mining')) {
            return 'bitcoin';
        }
        
        if (fullText.includes('economics') || fullText.includes('inflation') || fullText.includes('money') || fullText.includes('market')) {
            return 'economics';
        }
        
        if (fullText.includes('cryptography') || fullText.includes('hash') || fullText.includes('encryption') || fullText.includes('signature')) {
            return 'cryptography';
        }
        
        return 'general';
    }
    
    showFeedback(feedback, container) {
        if (!container) return;
        
        const feedbackElement = this.createFeedbackElement(feedback);
        
        // Remove existing feedback
        const existingFeedback = container.querySelector('.quiz-feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }
        
        // Add new feedback with delay if configured
        if (this.config.feedbackDelay > 0) {
            setTimeout(() => {
                container.appendChild(feedbackElement);
                this.scrollToFeedback(feedbackElement);
            }, this.config.feedbackDelay);
        } else {
            container.appendChild(feedbackElement);
            this.scrollToFeedback(feedbackElement);
        }
    }
    
    createFeedbackElement(feedback) {
        const feedbackDiv = document.createElement('div');
        feedbackDiv.className = `quiz-feedback ${feedback.isCorrect ? 'correct' : 'incorrect'}`;
        
        feedbackDiv.innerHTML = `
            <div class="feedback-header">
                <div class="feedback-status">
                    <span class="feedback-icon">${feedback.isCorrect ? '✅' : '❌'}</span>
                    <span class="feedback-title">${feedback.isCorrect ? 'Correct!' : 'Incorrect'}</span>
                </div>
                <button class="feedback-close" aria-label="Close feedback">×</button>
            </div>
            
            <div class="feedback-content">
                <div class="feedback-explanation">
                    <h4>Explanation</h4>
                    <p>${feedback.explanation}</p>
                </div>
                
                ${this.config.showLearningPoints ? `
                    <div class="feedback-learning-points">
                        <h4>Key Learning Points</h4>
                        <ul>
                            ${feedback.learningPoints.map(point => `
                                <li class="learning-point ${point.type} ${point.importance}">
                                    <span class="point-icon">${this.getLearningPointIcon(point.type)}</span>
                                    <span class="point-text">${point.text}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                ${this.config.showRelatedResources && feedback.relatedResources.length > 0 ? `
                    <div class="feedback-resources">
                        <h4>Related Resources</h4>
                        <div class="resource-links">
                            ${feedback.relatedResources.map(resource => `
                                <a href="${resource.url}" class="resource-link ${resource.type}">
                                    <span class="resource-icon">${this.getResourceIcon(resource.type)}</span>
                                    <span class="resource-title">${resource.title}</span>
                                </a>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${this.config.showRelatedConcepts && feedback.relatedConcepts.length > 0 ? `
                    <div class="feedback-concepts">
                        <h4>Related Concepts</h4>
                        <div class="concept-tags">
                            ${feedback.relatedConcepts.map(concept => `
                                <span class="concept-tag">${concept}</span>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${feedback.improvementTips.length > 0 ? `
                    <div class="feedback-tips">
                        <h4>Improvement Tips</h4>
                        <ul>
                            ${feedback.improvementTips.map(tip => `
                                <li class="improvement-tip ${tip.priority}">
                                    <span class="tip-icon">💡</span>
                                    <span class="tip-text">${tip.text}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
            
            <div class="feedback-actions">
                <button class="btn btn-primary continue-quiz">Continue</button>
                <button class="btn btn-secondary review-concept">Review Concept</button>
            </div>
        `;
        
        // Add event listeners
        this.bindFeedbackEvents(feedbackDiv, feedback);
        
        return feedbackDiv;
    }
    
    getLearningPointIcon(type) {
        const icons = {
            'reinforcement': '✅',
            'next-step': '➡️',
            'correction': '🔄',
            'foundation': '🏗️',
            'concept': '💡'
        };
        return icons[type] || '📚';
    }
    
    getResourceIcon(type) {
        const icons = {
            'video': '🎥',
            'article': '📄',
            'demo': '🔬',
            'book': '📚',
            'podcast': '🎧'
        };
        return icons[type] || '📖';
    }
    
    bindFeedbackEvents(feedbackElement, feedback) {
        // Close button
        feedbackElement.querySelector('.feedback-close').addEventListener('click', () => {
            feedbackElement.remove();
        });
        
        // Continue button
        feedbackElement.querySelector('.continue-quiz').addEventListener('click', () => {
            feedbackElement.remove();
            // Emit event for quiz to continue
            document.dispatchEvent(new CustomEvent('feedback:continue', { detail: feedback }));
        });
        
        // Review concept button
        feedbackElement.querySelector('.review-concept').addEventListener('click', () => {
            // Emit event for concept review
            document.dispatchEvent(new CustomEvent('feedback:reviewConcept', { detail: feedback }));
        });
    }
    
    scrollToFeedback(feedbackElement) {
        feedbackElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest' 
        });
    }
    
    getFeedbackHistory() {
        return Array.from(this.feedbackHistory.values());
    }
    
    clearFeedbackHistory() {
        this.feedbackHistory.clear();
    }
    
    destroy() {
        this.clearFeedbackHistory();
        this.learningResources.clear();
        this.relatedConcepts.clear();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuizFeedback;
} else {
    window.QuizFeedback = QuizFeedback;
} 