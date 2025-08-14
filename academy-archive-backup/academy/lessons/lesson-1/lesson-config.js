/**
 * Lesson 1: Introduction to Cryptocurrency - Configuration
 * Basic lesson metadata and configuration
 */

const Lesson1Config = {
    // Lesson metadata
    id: 'lesson-1',
    title: 'Introduction to Cryptocurrency',
    subtitle: 'Understanding the basics of digital money and blockchain technology',
    description: 'Learn the fundamental concepts of cryptocurrency, blockchain technology, and how digital money works.',
    duration: '30 minutes',
    difficulty: 'Beginner',
    category: 'Fundamentals',
    
    // Learning objectives
    objectives: [
        'Understand what cryptocurrency is and how it differs from traditional money',
        'Learn the basics of blockchain technology',
        'Explore key benefits and challenges of cryptocurrencies',
        'Get familiar with major cryptocurrencies'
    ],
    
    // Prerequisites
    prerequisites: [
        'Basic computer literacy',
        'Interest in financial technology'
    ],
    
    // Sections configuration
    sections: [
        {
            id: 'overview',
            title: 'Lesson Overview',
            type: 'overview',
            duration: '5 minutes',
            content: 'Introduction to cryptocurrency fundamentals'
        },
        {
            id: 'fundamentals',
            title: 'Fundamental Concepts',
            type: 'content',
            duration: '10 minutes',
            content: 'What is cryptocurrency and key characteristics'
        },
        {
            id: 'core-concepts',
            title: 'Core Concepts',
            type: 'content',
            duration: '10 minutes',
            content: 'Blockchain technology and how it works'
        },
        {
            id: 'interactive-demos',
            title: 'Interactive Demonstrations',
            type: 'demo',
            duration: '15 minutes',
            content: 'Hands-on exploration of blockchain concepts'
        },
        {
            id: 'quiz',
            title: 'Knowledge Check',
            type: 'assessment',
            duration: '10 minutes',
            content: 'Test your understanding with interactive quiz'
        }
    ],
    
    // Interactive demos
    demos: [
        {
            id: 'blockchain-demo',
            title: 'Blockchain Visualization',
            type: 'merkle-tree',
            description: 'See how transactions are organized in a blockchain'
        },
        {
            id: 'crypto-demo',
            title: 'Cryptographic Hashing',
            type: 'sha256',
            description: 'Learn how cryptographic hashing works'
        }
    ],
    
    // Quiz configuration
    quiz: {
        id: 'lesson-1-quiz',
        title: 'Cryptocurrency Fundamentals Quiz',
        description: 'Test your knowledge of cryptocurrency basics',
        questions: 5,
        timeLimit: 10,
        passingScore: 80,
        quizBank: 'bitcoin-quiz'
    },
    
    // Resources
    resources: [
        {
            title: 'Bitcoin Whitepaper',
            url: 'https://bitcoin.org/bitcoin.pdf',
            type: 'document',
            description: 'Satoshi Nakamoto\'s original Bitcoin whitepaper'
        },
        {
            title: 'Blockchain Basics',
            url: 'https://blockchain.info/',
            type: 'website',
            description: 'Interactive blockchain explorer and learning resources'
        },
        {
            title: 'Cryptocurrency Glossary',
            url: '#',
            type: 'reference',
            description: 'Common terms and definitions in cryptocurrency'
        }
    ],
    
    // Navigation
    navigation: {
        previous: null,
        next: 'lesson-2',
        related: ['lesson-2', 'lesson-3']
    },
    
    // Progress tracking
    progress: {
        requiredSections: ['overview', 'fundamentals', 'core-concepts', 'interactive-demos', 'quiz'],
        completionCriteria: 'Complete all sections and pass the quiz',
        certificateEligible: true
    },
    
    // Accessibility
    accessibility: {
        screenReaderFriendly: true,
        keyboardNavigation: true,
        highContrast: true,
        reducedMotion: true
    },
    
    // Localization
    localization: {
        supportedLanguages: ['en'],
        defaultLanguage: 'en',
        translations: {}
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Lesson1Config;
}

// Make available globally
window.Lesson1Config = Lesson1Config; 