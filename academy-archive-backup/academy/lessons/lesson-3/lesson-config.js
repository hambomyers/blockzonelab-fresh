/**
 * Lesson 3: Advanced Cryptocurrency Concepts - Configuration
 * Basic lesson metadata and configuration
 */

const Lesson3Config = {
    // Lesson metadata
    id: 'lesson-3',
    title: 'Advanced Cryptocurrency Concepts',
    subtitle: 'Exploring DeFi, smart contracts, and token economics',
    description: 'Learn advanced concepts in cryptocurrency including DeFi protocols, smart contracts, and token economics.',
    duration: '45 minutes',
    difficulty: 'Intermediate',
    category: 'Advanced',
    
    // Learning objectives
    objectives: [
        'Understand DeFi protocols and their applications',
        'Learn how smart contracts work and their use cases',
        'Explore token economics and governance',
        'Analyze yield farming and staking mechanisms'
    ],
    
    // Prerequisites
    prerequisites: [
        'Completion of Lesson 1 and 2',
        'Basic understanding of blockchain and cryptocurrency',
        'Familiarity with Ethereum concepts'
    ],
    
    // Sections configuration
    sections: [
        {
            id: 'overview',
            title: 'Lesson Overview',
            type: 'overview',
            duration: '5 minutes',
            content: 'Introduction to advanced cryptocurrency concepts'
        },
        {
            id: 'defi-fundamentals',
            title: 'DeFi Fundamentals',
            type: 'content',
            duration: '15 minutes',
            content: 'Understanding decentralized finance protocols'
        },
        {
            id: 'smart-contracts',
            title: 'Smart Contracts',
            type: 'content',
            duration: '15 minutes',
            content: 'Advanced smart contract concepts and applications'
        },
        {
            id: 'interactive-demos',
            title: 'Interactive Demonstrations',
            type: 'demo',
            duration: '20 minutes',
            content: 'Hands-on exploration of DeFi and smart contracts'
        },
        {
            id: 'quiz',
            title: 'Knowledge Check',
            type: 'assessment',
            duration: '15 minutes',
            content: 'Test your understanding with interactive quiz'
        }
    ],
    
    // Interactive demos
    demos: [
        {
            id: 'defi-demo',
            title: 'DeFi Protocol Simulation',
            type: 'merkle-tree',
            description: 'Interactive simulation of DeFi protocol operations'
        },
        {
            id: 'smart-contract-demo',
            title: 'Smart Contract Interaction',
            type: 'sha256',
            description: 'Demonstration of smart contract execution and interaction'
        }
    ],
    
    // Quiz configuration
    quiz: {
        id: 'lesson-3-quiz',
        title: 'Advanced Concepts Quiz',
        description: 'Test your knowledge of DeFi, smart contracts, and token economics',
        questions: 8,
        timeLimit: 15,
        passingScore: 80,
        quizBank: 'technical-quiz'
    },
    
    // Resources
    resources: [
        {
            title: 'DeFi Pulse',
            url: 'https://defipulse.com/',
            type: 'website',
            description: 'DeFi protocol rankings and analytics'
        },
        {
            title: 'Ethereum Documentation',
            url: 'https://ethereum.org/developers/',
            type: 'documentation',
            description: 'Official Ethereum developer documentation'
        },
        {
            title: 'Token Economics Guide',
            url: '#',
            type: 'reference',
            description: 'Comprehensive guide to token economics'
        }
    ],
    
    // Navigation
    navigation: {
        previous: 'lesson-2',
        next: 'lesson-6',
        related: ['lesson-1', 'lesson-2', 'lesson-6']
    },
    
    // Progress tracking
    progress: {
        requiredSections: ['overview', 'defi-fundamentals', 'smart-contracts', 'interactive-demos', 'quiz'],
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
    module.exports = Lesson3Config;
}

// Make available globally
window.Lesson3Config = Lesson3Config; 