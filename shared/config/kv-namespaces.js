/**
 * BlockZone Lab - KV Namespaces Configuration
 * 
 * Defines the structure and access patterns for all KV namespaces
 * used in the application.
 */

export const KV_NAMESPACES = {
    // Player profiles and wallet information
    PLAYERS: {
        name: 'players',
        description: 'Stores player profiles, wallet information, and authentication data',
        ttl: 60 * 60 * 24 * 30, // 30 days
        schema: {
            id: 'string', // Player ID (wallet address)
            username: 'string',
            displayName: 'string',
            email: 'string?',
            isEmailVerified: 'boolean',
            walletAddress: 'string',
            createdAt: 'timestamp',
            lastLogin: 'timestamp',
            metadata: 'object?' // Additional player metadata
        },
        indexes: [
            { name: 'email', type: 'string', unique: true },
            { name: 'username', type: 'string', unique: true },
            { name: 'createdAt', type: 'timestamp' }
        ]
    },

    // Game statistics and player progress
    GAMING_STATS: {
        name: 'gaming-stats',
        description: 'Stores game statistics, scores, and player progress',
        ttl: 60 * 60 * 24 * 90, // 90 days
        schema: {
            playerId: 'string',
            gameId: 'string',
            highScore: 'number',
            totalScore: 'number',
            gamesPlayed: 'number',
            achievements: 'array',
            lastPlayed: 'timestamp',
            stats: 'object' // Game-specific statistics
        },
        indexes: [
            { name: 'playerId', type: 'string' },
            { name: 'gameId', type: 'string' },
            { name: 'highScore', type: 'number' },
            { name: 'lastPlayed', type: 'timestamp' }
        ]
    },

    // Payment transactions and history
    PAYMENTS: {
        name: 'payments',
        description: 'Stores payment transactions, challenge entries, and USDC.E transactions',
        ttl: 60 * 60 * 24 * 365, // 1 year
        schema: {
            id: 'string',
            playerId: 'string',
            type: 'string', // 'challenge_entry', 'payout', 'deposit', 'withdrawal'
            amount: 'number',
            currency: 'string', // 'USDC.E', 'ETH', etc.
            status: 'string', // 'pending', 'completed', 'failed', 'refunded'
            txHash: 'string?',
            metadata: 'object?',
            createdAt: 'timestamp',
            updatedAt: 'timestamp'
        },
        indexes: [
            { name: 'playerId', type: 'string' },
            { name: 'type', type: 'string' },
            { name: 'status', type: 'string' },
            { name: 'createdAt', type: 'timestamp' }
        ]
    },

    // Social features and leaderboards
    SOCIAL: {
        name: 'social',
        description: 'Stores social features, friend relationships, and leaderboard data',
        ttl: 60 * 60 * 24 * 30, // 30 days
        schema: {
            playerId: 'string',
            friends: 'array', // List of friend player IDs
            friendRequests: 'array',
            blockedPlayers: 'array',
            socialStats: {
                followers: 'number',
                following: 'number',
                likes: 'number',
                shares: 'number'
            },
            preferences: 'object',
            lastActive: 'timestamp'
        },
        indexes: [
            { name: 'playerId', type: 'string', unique: true },
            { name: 'lastActive', type: 'timestamp' }
        ]
    },

    // Player analytics and behavior data
    ANALYTICS: {
        name: 'analytics',
        description: 'Stores player behavior, game analytics, and retention data',
        ttl: 60 * 60 * 24 * 180, // 180 days
        schema: {
            eventType: 'string',
            playerId: 'string?',
            sessionId: 'string',
            gameId: 'string?',
            data: 'object',
            timestamp: 'timestamp',
            userAgent: 'string?',
            ipAddress: 'string?',
            referrer: 'string?'
        },
        indexes: [
            { name: 'eventType', type: 'string' },
            { name: 'playerId', type: 'string' },
            { name: 'sessionId', type: 'string' },
            { name: 'gameId', type: 'string' },
            { name: 'timestamp', type: 'timestamp' }
        ]
    },

    // Active sessions and authentication tokens
    SESSIONS: {
        name: 'sessions',
        description: 'Stores active sessions, authentication tokens, and device information',
        ttl: 60 * 60 * 24 * 7, // 7 days
        schema: {
            sessionId: 'string',
            playerId: 'string',
            token: 'string',
            deviceInfo: 'object',
            ipAddress: 'string',
            userAgent: 'string',
            expiresAt: 'timestamp',
            lastActive: 'timestamp',
            isActive: 'boolean'
        },
        indexes: [
            { name: 'sessionId', type: 'string', unique: true },
            { name: 'playerId', type: 'string' },
            { name: 'token', type: 'string', unique: true },
            { name: 'expiresAt', type: 'timestamp' }
        ]
    },

    // Challenge definitions and participation
    CHALLENGES: {
        name: 'challenges',
        description: 'Stores challenge definitions, active challenges, and participation data',
        ttl: 60 * 60 * 24 * 30, // 30 days
        schema: {
            id: 'string',
            name: 'string',
            description: 'string',
            type: 'string', // 'daily', 'weekly', 'special', 'tournament'
            entryFee: 'number',
            prizePool: 'number',
            currency: 'string',
            startTime: 'timestamp',
            endTime: 'timestamp',
            status: 'string', // 'upcoming', 'active', 'completed', 'cancelled'
            participants: 'array',
            leaderboard: 'array',
            rules: 'object',
            metadata: 'object?'
        },
        indexes: [
            { name: 'id', type: 'string', unique: true },
            { name: 'type', type: 'string' },
            { name: 'status', type: 'string' },
            { name: 'startTime', type: 'timestamp' },
            { name: 'endTime', type: 'timestamp' }
        ]
    },

    // System configuration and feature flags
    CONFIG: {
        name: 'config',
        description: 'Stores system configuration, feature flags, and global settings',
        ttl: 0, // Never expire
        schema: {
            key: 'string',
            value: 'any',
            description: 'string',
            updatedBy: 'string',
            updatedAt: 'timestamp'
        },
        indexes: [
            { name: 'key', type: 'string', unique: true },
            { name: 'updatedAt', type: 'timestamp' }
        ]
    }
};

/**
 * Get the KV namespace configuration by name
 * @param {string} namespaceName - The name of the namespace
 * @returns {Object} The namespace configuration
 */
export function getNamespaceConfig(namespaceName) {
    const namespace = Object.values(KV_NAMESPACES).find(
        ns => ns.name === namespaceName.toLowerCase()
    );
    
    if (!namespace) {
        throw new Error(`KV Namespace '${namespaceName}' not found`);
    }
    
    return namespace;
}

/**
 * Validate data against a namespace schema
 * @param {string} namespaceName - The name of the namespace
 * @param {Object} data - The data to validate
 * @returns {boolean} True if valid, throws error if invalid
 */
export function validateData(namespaceName, data) {
    const namespace = getNamespaceConfig(namespaceName);
    const { schema } = namespace;
    
    // Check required fields
    for (const [field, type] of Object.entries(schema)) {
        // Handle optional fields (ending with '?')
        const isOptional = field.endsWith('?');
        const fieldName = isOptional ? field.slice(0, -1) : field;
        const fieldType = isOptional ? type : type;
        
        if (!isOptional && data[fieldName] === undefined) {
            throw new Error(`Missing required field: ${fieldName}`);
        }
        
        // Skip type checking for undefined optional fields
        if (data[fieldName] === undefined) continue;
        
        // Check type
        if (fieldType.endsWith('?')) {
            // Skip type checking for optional fields
            continue;
        } else if (fieldType === 'timestamp') {
            if (isNaN(new Date(data[fieldName]).getTime())) {
                throw new Error(`Invalid timestamp for field: ${fieldName}`);
            }
        } else if (fieldType === 'array') {
            if (!Array.isArray(data[fieldName])) {
                throw new Error(`Field ${fieldName} must be an array`);
            }
        } else if (fieldType === 'object') {
            if (typeof data[fieldName] !== 'object' || data[fieldName] === null) {
                throw new Error(`Field ${fieldName} must be an object`);
            }
        } else if (typeof data[fieldName] !== fieldType) {
            throw new Error(`Field ${fieldName} must be of type ${fieldType}`);
        }
    }
    
    return true;
}

// For testing in browser console
if (typeof window !== 'undefined') {
    window.kvNamespaces = KV_NAMESPACES;
    window.getNamespaceConfig = getNamespaceConfig;
    window.validateData = validateData;
}
