/**
 * Real-Time Leaderboard Configuration
 * 
 * Configuration settings for the lightning-fast leaderboard system
 */

export const leaderboardConfig = {
    // Leaderboard Scope (global or regional)
    scope: process.env.LEADERBOARD_SCOPE || 'global',
    
    // KV Namespace for Cloudflare Workers
    kvNamespace: process.env.KV_NAMESPACE || 'LEADERBOARD_KV',
    
    // API Base URL
    apiBaseUrl: process.env.API_BASE_URL || 'https://api.blockzonelab.com',
    
    // Performance Settings
    maxResponseTimeMs: parseInt(process.env.MAX_RESPONSE_TIME_MS) || 100,
    cacheTtlSeconds: parseInt(process.env.CACHE_TTL_SECONDS) || 300,
    
    // Regional Settings (for future scaling)
    enableRegionalLeaderboards: process.env.ENABLE_REGIONAL_LEADERBOARDS === 'true',
    defaultRegion: process.env.DEFAULT_REGION || 'global',
    
    // Development Settings
    enableDevMode: process.env.ENABLE_DEV_MODE === 'true',
    enablePerformanceLogging: process.env.ENABLE_PERFORMANCE_LOGGING !== 'false',
    
    // Leaderboard Settings
    topPlayersCount: 3,
    maxPlayersPerRegion: 10000,
    
    // Performance Targets
    targets: {
        instantDisplay: 0,      // Overlay should appear instantly
        leaderboardLoad: 50,    // Leaderboard should load in <50ms
        totalResponse: 100      // Total API response should be <100ms
    }
};

// Export for use in other modules
export default leaderboardConfig; 
