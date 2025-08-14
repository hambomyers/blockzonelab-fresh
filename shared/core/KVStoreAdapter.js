/**
 * KVStoreAdapter.js - Cloudflare KV Store Integration
 * Provides a unified interface for KV store operations
 */

import { getNamespaceConfig, validateData } from '/shared/config/kv-namespaces.js';
import { kvStore } from './kv-store.js';

export class KVStoreAdapter {
    /**
     * Create a new KVStoreAdapter instance for a specific namespace
     * @param {string} namespace - The namespace to interact with
     */
    constructor(namespace) {
        this.namespace = namespace.toLowerCase();
        this.config = getNamespaceConfig(this.namespace);
        this.prefix = `${this.namespace}:`;
    }

    /**
     * Generate a namespaced key
     * @private
     */
    _getKey(key) {
        return `${this.prefix}${key}`;
    }

    /**
     * Validate data against the namespace schema
     * @private
     */
    _validate(data) {
        return validateData(this.namespace, data);
    }

    /**
     * Set a value in the KV store
     * @param {string} key - The key to set
     * @param {Object} value - The value to store
     * @param {Object} options - Additional options
     * @param {number} [options.ttl] - Time to live in seconds (overrides namespace default)
     * @returns {Promise<boolean>} True if successful
     */
    async set(key, value, options = {}) {
        try {
            // Validate against schema
            this._validate(value);
            
            // Add timestamps if not present
            const now = new Date().toISOString();
            if (this.config.schema.createdAt && value.createdAt === undefined) {
                value.createdAt = now;
            }
            if (this.config.schema.updatedAt) {
                value.updatedAt = now;
            }
            
            // Set TTL (time to live)
            const ttl = options.ttl || this.config.ttl;
            
            // Store the value
            const result = await kvStore.set(
                this._getKey(key),
                JSON.stringify(value),
                ttl
            );
            
            return result;
        } catch (error) {
            console.error(`[KVStore:${this.namespace}] Error setting key ${key}:`, error);
            throw error;
        }
    }

    /**
     * Get a value from the KV store
     * @param {string} key - The key to get
     * @returns {Promise<Object|null>} The stored value or null if not found
     */
    async get(key) {
        try {
            const value = await kvStore.get(this._getKey(key));
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error(`[KVStore:${this.namespace}] Error getting key ${key}:`, error);
            return null;
        }
    }

    /**
     * Delete a value from the KV store
     * @param {string} key - The key to delete
     * @returns {Promise<boolean>} True if successful
     */
    async delete(key) {
        try {
            return await kvStore.remove(this._getKey(key));
        } catch (error) {
            console.error(`[KVStore:${this.namespace}] Error deleting key ${key}:`, error);
            return false;
        }
    }

    /**
     * Get multiple values by keys
     * @param {string[]} keys - Array of keys to get
     * @returns {Promise<Array<Object|null>>} Array of values in the same order as keys
     */
    async getMany(keys) {
        try {
            const prefixedKeys = keys.map(key => this._getKey(key));
            const values = await Promise.all(
                prefixedKeys.map(key => kvStore.get(key))
            );
            
            return values.map(value => value ? JSON.parse(value) : null);
        } catch (error) {
            console.error(`[KVStore:${this.namespace}] Error getting multiple keys:`, error);
            return keys.map(() => null);
        }
    }

    /**
     * Set multiple values
     * @param {Object} keyValuePairs - Object mapping keys to values
     * @param {Object} options - Additional options
     * @param {number} [options.ttl] - Time to live in seconds (overrides namespace default)
     * @returns {Promise<boolean>} True if all operations were successful
     */
    async setMany(keyValuePairs, options = {}) {
        try {
            const entries = Object.entries(keyValuePairs);
            const results = await Promise.all(
                entries.map(([key, value]) => this.set(key, value, options))
            );
            return results.every(Boolean);
        } catch (error) {
            console.error(`[KVStore:${this.namespace}] Error setting multiple keys:`, error);
            return false;
        }
    }

    /**
     * Find entries matching a query
     * @param {Object} query - The query object
     * @param {number} [limit=100] - Maximum number of results to return
     * @param {string} [cursor] - Pagination cursor
     * @returns {Promise<{items: Array<Object>, cursor: string|null}>} Matching items and pagination cursor
     */
    async find(query = {}, limit = 100, cursor = null) {
        // This is a simplified implementation
        // In a real-world scenario, you would use the indexes defined in the namespace config
        // and implement proper querying based on those indexes
        
        // Note: This is a placeholder implementation that would need to be adapted
        // to work with the actual KV store implementation
        console.warn('find() is not fully implemented and may not work as expected');
        
        try {
            // This would need to be implemented based on the actual KV store capabilities
            // For Cloudflare Workers KV, you would use list() with prefix and cursor
            return { items: [], cursor: null };
        } catch (error) {
            console.error(`[KVStore:${this.namespace}] Error finding items:`, error);
            return { items: [], cursor: null };
        }
    }

    /**
     * Update a value atomically
     * @param {string} key - The key to update
     * @param {Function} updateFn - Function that takes the current value and returns the new value
     * @param {Object} options - Additional options
     * @param {number} [options.retries=3] - Number of retry attempts on conflict
     * @returns {Promise<Object|null>} The updated value or null if not found
     */
    async update(key, updateFn, options = {}) {
        const maxRetries = options.retries || 3;
        let attempts = 0;
        
        while (attempts < maxRetries) {
            try {
                // Get current value
                const current = await this.get(key);
                if (!current) return null;
                
                // Apply updates
                const updated = await updateFn(JSON.parse(JSON.stringify(current)));
                
                // Validate the updated value
                this._validate(updated);
                
                // Update timestamps
                if (this.config.schema.updatedAt) {
                    updated.updatedAt = new Date().toISOString();
                }
                
                // Save the updated value
                await this.set(key, updated, options);
                
                return updated;
            } catch (error) {
                attempts++;
                if (attempts >= maxRetries) {
                    console.error(`[KVStore:${this.namespace}] Failed to update key ${key} after ${maxRetries} attempts:`, error);
                    throw error;
                }
                
                // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempts)));
            }
        }
        
        return null;
    }

    /**
     * Increment a numeric field
     * @param {string} key - The key of the document
     * @param {string} field - The field to increment
     * @param {number} [amount=1] - The amount to increment by
     * @returns {Promise<number|null>} The new value or null if not found
     */
    async increment(key, field, amount = 1) {
        if (typeof amount !== 'number' || isNaN(amount)) {
            throw new Error('Amount must be a number');
        }
        
        try {
            return await this.update(
                key,
                (current) => {
                    if (typeof current[field] !== 'number') {
                        current[field] = 0;
                    }
                    current[field] += amount;
                    return current;
                },
                { retries: 5 }
            );
        } catch (error) {
            console.error(`[KVStore:${this.namespace}] Error incrementing field ${field}:`, error);
            return null;
        }
    }

    /**
     * Add an item to an array field
     * @param {string} key - The key of the document
     * @param {string} field - The array field to add to
     * @param {*} item - The item to add
     * @param {Object} options - Additional options
     * @param {boolean} [options.unique=false] - If true, only add the item if it doesn't already exist
     * @returns {Promise<boolean>} True if the item was added
     */
    async addToArray(key, field, item, options = {}) {
        try {
            const result = await this.update(
                key,
                (current) => {
                    if (!Array.isArray(current[field])) {
                        current[field] = [];
                    }
                    
                    if (options.unique && current[field].includes(item)) {
                        return current; // No change needed
                    }
                    
                    current[field].push(item);
                    return current;
                },
                { retries: 3 }
            );
            
            return result !== null;
        } catch (error) {
            console.error(`[KVStore:${this.namespace}] Error adding to array ${field}:`, error);
            return false;
        }
    }

    /**
     * Remove an item from an array field
     * @param {string} key - The key of the document
     * @param {string} field - The array field to remove from
     * @param {*} item - The item to remove
     * @returns {Promise<boolean>} True if the item was removed
     */
    async removeFromArray(key, field, item) {
        try {
            const result = await this.update(
                key,
                (current) => {
                    if (!Array.isArray(current[field])) {
                        return current; // Nothing to remove
                    }
                    
                    current[field] = current[field].filter(i => i !== item);
                    return current;
                },
                { retries: 3 }
            );
            
            return result !== null;
        } catch (error) {
            console.error(`[KVStore:${this.namespace}] Error removing from array ${field}:`, error);
            return false;
        }
    }
}

// Create and export pre-configured instances for each namespace
export const playersStore = new KVStoreAdapter('players');
export const gamingStatsStore = new KVStoreAdapter('gaming-stats');
export const paymentsStore = new KVStoreAdapter('payments');
export const socialStore = new KVStoreAdapter('social');
export const analyticsStore = new KVStoreAdapter('analytics');
export const sessionsStore = new KVStoreAdapter('sessions');
export const challengesStore = new KVStoreAdapter('challenges');
export const configStore = new KVStoreAdapter('config');

// For testing in browser console
if (typeof window !== 'undefined') {
    window.kvStores = {
        players: playersStore,
        gamingStats: gamingStatsStore,
        payments: paymentsStore,
        social: socialStore,
        analytics: analyticsStore,
        sessions: sessionsStore,
        challenges: challengesStore,
        config: configStore
    };
}
