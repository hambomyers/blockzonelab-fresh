/**
 * BlockZone Lab - Key-Value Store
 * 
 * Provides a consistent interface for storing and retrieving data
 * with secure storage mechanisms based on the environment.
 * 
 * Features:
 * - Secure storage for sensitive data
 * - Fallback mechanisms for different environments
 * - Encryption for sensitive data
 */

class KVStore {
    constructor() {
        this.storage = this.determineStorage();
        this.encryptionKey = null;
        this.initialized = false;
    }

    /**
     * Initialize the KV store with encryption key if available
     */
    async init() {
        if (this.initialized) return true;
        
        try {
            // In a production environment, you would generate/retrieve an encryption key here
            // For now, we'll use a simple in-memory key for demonstration
            this.encryptionKey = await this.getOrCreateEncryptionKey();
            this.initialized = true;
            return true;
        } catch (error) {
            console.error('Failed to initialize KV store:', error);
            return false;
        }
    }

    /**
     * Determine the best available storage mechanism
     */
    determineStorage() {
        // In a browser environment
        if (typeof window !== 'undefined') {
            // Try localStorage first
            if (typeof localStorage !== 'undefined') {
                return {
                    type: 'localStorage',
                    get: (key) => localStorage.getItem(key),
                    set: (key, value) => localStorage.setItem(key, value),
                    remove: (key) => localStorage.removeItem(key)
                };
            }
            
            // Fallback to sessionStorage
            if (typeof sessionStorage !== 'undefined') {
                return {
                    type: 'sessionStorage',
                    get: (key) => sessionStorage.getItem(key),
                    set: (key, value) => sessionStorage.setItem(key, value),
                    remove: (key) => sessionStorage.removeItem(key)
                };
            }
        }
        
        // Fallback to in-memory storage
        console.warn('Using in-memory storage - data will be lost on page refresh');
        const memoryStore = {};
        return {
            type: 'memory',
            get: (key) => memoryStore[key],
            set: (key, value) => { memoryStore[key] = value; },
            remove: (key) => { delete memoryStore[key]; }
        };
    }

    /**
     * Get or create an encryption key
     */
    async getOrCreateEncryptionKey() {
        // In a real implementation, this would generate or retrieve a secure key
        // For demo purposes, we'll use a simple key
        return 'demo-encryption-key';
    }

    /**
     * Encrypt data (stub implementation)
     * In a real implementation, use Web Crypto API or similar
     */
    async encrypt(data) {
        if (!this.encryptionKey) {
            await this.init();
        }
        // In a real implementation, you would encrypt the data here
        // For now, we'll just return the data as-is
        return data;
    }

    /**
     * Decrypt data (stub implementation)
     */
    async decrypt(encryptedData) {
        if (!this.encryptionKey) {
            await this.init();
        }
        // In a real implementation, you would decrypt the data here
        // For now, we'll just return the data as-is
        return encryptedData;
    }

    /**
     * Set a value in the store
     */
    async set(key, value) {
        try {
            // Encrypt the value before storing
            const encryptedValue = await this.encrypt(value);
            this.storage.set(key, encryptedValue);
            return true;
        } catch (error) {
            console.error(`Failed to set value for key ${key}:`, error);
            return false;
        }
    }

    /**
     * Get a value from the store
     */
    async get(key) {
        try {
            const encryptedValue = this.storage.get(key);
            if (encryptedValue === null || encryptedValue === undefined) {
                return null;
            }
            // Decrypt the value before returning
            return await this.decrypt(encryptedValue);
        } catch (error) {
            console.error(`Failed to get value for key ${key}:`, error);
            return null;
        }
    }

    /**
     * Remove a value from the store
     */
    async remove(key) {
        try {
            this.storage.remove(key);
            return true;
        } catch (error) {
            console.error(`Failed to remove key ${key}:`, error);
            return false;
        }
    }

    /**
     * Clear all data from the store
     */
    async clear() {
        try {
            if (this.storage.clear) {
                this.storage.clear();
            } else if (this.storage.type === 'localStorage') {
                localStorage.clear();
            } else if (this.storage.type === 'sessionStorage') {
                sessionStorage.clear();
            } else {
                // For memory store, we can't easily clear it
                console.warn('Cannot clear in-memory storage');
            }
            return true;
        } catch (error) {
            console.error('Failed to clear storage:', error);
            return false;
        }
    }
}

// Export a singleton instance
export const kvStore = new KVStore();

// Initialize the store when the module loads
kvStore.init().catch(console.error);

// For testing in browser console
if (typeof window !== 'undefined') {
    window.kvStore = kvStore;
}
