/**
 * CloudflareKV - Client-side KV storage interface
 * Provides a consistent API for working with Cloudflare KV from the frontend
 */

export class CloudflareKV {
    constructor(baseURL = 'https://api.blockzonelab.com') {
        this.baseURL = baseURL;
    }

    /**
     * Get a value from KV storage
     */
    async get(key, namespace = 'default') {
        try {
            const response = await fetch(`${this.baseURL}/api/kv/${namespace}/${encodeURIComponent(key)}`);
            
            if (!response.ok) {
                if (response.status === 404) {
                    return null; // Key doesn't exist
                }
                throw new Error(`KV get failed: ${response.status}`);
            }
            
            const data = await response.json();
            return data.value;
        } catch (error) {
            console.error('❌ KV get error:', error);
            return null;
        }
    }

    /**
     * Set a value in KV storage
     */
    async put(key, value, namespace = 'default', options = {}) {
        try {
            const response = await fetch(`${this.baseURL}/api/kv/${namespace}/${encodeURIComponent(key)}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    value: value,
                    expiration: options.expiration,
                    expirationTtl: options.expirationTtl
                })
            });
            
            if (!response.ok) {
                throw new Error(`KV put failed: ${response.status}`);
            }
            
            return true;
        } catch (error) {
            console.error('❌ KV put error:', error);
            return false;
        }
    }

    /**
     * Delete a value from KV storage
     */
    async delete(key, namespace = 'default') {
        try {
            const response = await fetch(`${this.baseURL}/api/kv/${namespace}/${encodeURIComponent(key)}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`KV delete failed: ${response.status}`);
            }
            
            return true;
        } catch (error) {
            console.error('❌ KV delete error:', error);
            return false;
        }
    }

    /**
     * List keys in a namespace
     */
    async list(prefix = '', namespace = 'default', limit = 1000) {
        try {
            const params = new URLSearchParams({
                prefix: prefix,
                limit: limit.toString()
            });
            
            const response = await fetch(`${this.baseURL}/api/kv/${namespace}/list?${params}`);
            
            if (!response.ok) {
                throw new Error(`KV list failed: ${response.status}`);
            }
            
            const data = await response.json();
            return data.keys || [];
        } catch (error) {
            console.error('❌ KV list error:', error);
            return [];
        }
    }

    /**
     * Batch operations
     */
    async batch(operations, namespace = 'default') {
        try {
            const response = await fetch(`${this.baseURL}/api/kv/${namespace}/batch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ operations })
            });
            
            if (!response.ok) {
                throw new Error(`KV batch failed: ${response.status}`);
            }
            
            const result = await response.json();
            return result.results || [];
        } catch (error) {
            console.error('❌ KV batch error:', error);
            return [];
        }
    }

    /**
     * Get player data (convenience method)
     */
    async getPlayer(playerId) {
        return await this.get(`player:${playerId}`, 'PLAYERS');
    }

    /**
     * Set player data (convenience method)
     */
    async setPlayer(playerId, data) {
        return await this.put(`player:${playerId}`, data, 'PLAYERS');
    }

    /**
     * Get score data (convenience method)
     */
    async getScore(scoreId) {
        return await this.get(`score:${scoreId}`, 'SCORES');
    }

    /**
     * Set score data (convenience method)
     */
    async setScore(scoreId, data) {
        return await this.put(`score:${scoreId}`, data, 'SCORES');
    }

    /**
     * Get leaderboard data (convenience method)
     */
    async getLeaderboard(game, period) {
        return await this.get(`leaderboard:${game}:${period}`, 'SCORES');
    }

    /**
     * Set leaderboard data (convenience method)
     */
    async setLeaderboard(game, period, data) {
        return await this.put(`leaderboard:${game}:${period}`, data, 'SCORES');
    }
}

// Export a default instance
export const kv = new CloudflareKV(); 
