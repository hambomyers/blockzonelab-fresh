/**
 * BLOCKZONE ACADEMY - SHA-256 INTERACTIVE DEMO
 * Demonstrates Bitcoin's cryptographic foundation through interactive hashing
 */

class SHA256Demo {
    constructor(containerId, config = {}) {
        this.config = {
            showStepByStep: true,
            enableRealTimeHashing: true,
            includeBitcoinExamples: true,
            ...config
        };
        
        this.container = document.getElementById(containerId);
        this.isInitialized = false;
        this.currentInput = '';
        this.hashHistory = [];
        this.animationSpeed = 1000;
        
        this.init();
    }

    init() {
        if (!this.container) {
            console.error('SHA256Demo: Container not found');
            return;
        }

        this.createInterface();
        this.bindEvents();
        this.isInitialized = true;
        
        if (this.config.includeBitcoinExamples) {
            this.loadBitcoinExamples();
        }
    }

    createInterface() {
        this.container.innerHTML = `
            <div class="sha256-demo">
                <div class="demo-header">
                    <h3>SHA-256 Hash Function Demo</h3>
                    <p>Experience the cryptographic foundation that secures Bitcoin</p>
                </div>
                
                <div class="input-section">
                    <div class="input-group">
                        <label for="sha256-input">Enter text to hash:</label>
                        <div class="input-wrapper">
                            <input type="text" 
                                   id="sha256-input" 
                                   placeholder="Type something to see it transformed..."
                                   maxlength="100">
                            <button class="btn btn-primary" id="hash-btn">Generate Hash</button>
                        </div>
                    </div>
                    
                    <div class="preset-examples">
                        <span class="example-label">Try these examples:</span>
                        <button class="example-btn" data-text="Hello, Bitcoin!">Hello, Bitcoin!</button>
                        <button class="example-btn" data-text="Satoshi Nakamoto">Satoshi Nakamoto</button>
                        <button class="example-btn" data-text="Genesis Block">Genesis Block</button>
                    </div>
                </div>
                
                <div class="hash-display">
                    <div class="hash-label">SHA-256 Hash:</div>
                    <div class="hash-value" id="hash-output">
                        <span class="placeholder">Hash will appear here...</span>
                    </div>
                    <div class="hash-info">
                        <span class="hash-length">Length: <span id="hash-length">0</span> characters</span>
                        <span class="hash-time">Generated in: <span id="hash-time">0</span>ms</span>
                    </div>
                </div>
                
                <div class="demo-features">
                    <div class="feature-section">
                        <h4>Key Properties</h4>
                        <ul class="feature-list">
                            <li><strong>Deterministic:</strong> Same input always produces same output</li>
                            <li><strong>One-way:</strong> Cannot reverse hash to get original input</li>
                            <li><strong>Avalanche effect:</strong> Small input changes create completely different hashes</li>
                            <li><strong>Collision resistant:</strong> Extremely unlikely for different inputs to produce same hash</li>
                        </ul>
                    </div>
                    
                    <div class="feature-section">
                        <h4>Bitcoin Applications</h4>
                        <ul class="feature-list">
                            <li><strong>Transaction IDs:</strong> Every Bitcoin transaction gets a unique hash</li>
                            <li><strong>Block headers:</strong> Each block is identified by its header hash</li>
                            <li><strong>Merkle trees:</strong> Efficient verification of transaction inclusion</li>
                            <li><strong>Proof of Work:</strong> Miners must find hashes below target difficulty</li>
                        </ul>
                    </div>
                </div>
                
                <div class="hash-history" id="hash-history">
                    <h4>Recent Hashes</h4>
                    <div class="history-list"></div>
                </div>
                
                <div class="educational-content">
                    <div class="content-section">
                        <h4>Why SHA-256?</h4>
                        <p>SHA-256 was chosen by Satoshi Nakamoto for Bitcoin because it's:</p>
                        <ul>
                            <li><strong>Cryptographically secure:</strong> No known attacks can break it</li>
                            <li><strong>Fast to compute:</strong> Efficient for both hashing and verification</li>
                            <li><strong>Widely adopted:</strong> Standard in cryptography and security</li>
                            <li><strong>Well-tested:</strong> Years of cryptanalysis without vulnerabilities</li>
                        </ul>
                    </div>
                    
                    <div class="content-section">
                        <h4>Hash Collision Probability</h4>
                        <p>The probability of two different inputs producing the same SHA-256 hash is approximately:</p>
                        <div class="probability-display">
                            <span class="probability-number">1 in 2^256</span>
                            <span class="probability-description">That's roughly 1 in 10^77 - more than the estimated number of atoms in the observable universe!</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    bindEvents() {
        const input = document.getElementById('sha256-input');
        const hashBtn = document.getElementById('hash-btn');
        const exampleBtns = document.querySelectorAll('.example-btn');
        
        // Real-time hashing
        if (this.config.enableRealTimeHashing) {
            input.addEventListener('input', (e) => {
                this.currentInput = e.target.value;
                if (this.currentInput.length > 0) {
                    this.debounce(() => this.generateHash(this.currentInput), 500);
                } else {
                    this.clearHashDisplay();
                }
            });
        }
        
        // Manual hash button
        hashBtn.addEventListener('click', () => {
            const text = input.value.trim();
            if (text) {
                this.generateHash(text);
            }
        });
        
        // Example buttons
        exampleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const text = btn.dataset.text;
                input.value = text;
                this.currentInput = text;
                this.generateHash(text);
            });
        });
        
        // Enter key support
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const text = input.value.trim();
                if (text) {
                    this.generateHash(text);
                }
            }
        });
    }

    async generateHash(input) {
        if (!input || input.trim().length === 0) {
            this.clearHashDisplay();
            return;
        }

        const startTime = performance.now();
        
        try {
            // Use Web Crypto API for real SHA-256 hashing
            const encoder = new TextEncoder();
            const data = encoder.encode(input);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            
            const endTime = performance.now();
            const duration = Math.round(endTime - startTime);
            
            this.displayHash(hashHex, input, duration);
            this.addToHistory(input, hashHex, duration);
            
        } catch (error) {
            console.error('SHA-256 hashing failed:', error);
            this.displayError('Failed to generate hash. Please try again.');
        }
    }

    displayHash(hash, input, duration) {
        const hashOutput = document.getElementById('hash-output');
        const hashLength = document.getElementById('hash-length');
        const hashTime = document.getElementById('hash-time');
        
        // Clear previous content
        hashOutput.innerHTML = '';
        
        // Create hash display with character-by-character animation
        const hashContainer = document.createElement('div');
        hashContainer.className = 'hash-container';
        
        // Split hash into groups of 8 characters for readability
        const hashGroups = this.groupHash(hash, 8);
        
        hashGroups.forEach((group, groupIndex) => {
            const groupElement = document.createElement('span');
            groupElement.className = 'hash-group';
            
            group.split('').forEach((char, charIndex) => {
                const charElement = document.createElement('span');
                charElement.className = 'hash-char';
                charElement.textContent = char;
                charElement.style.animationDelay = `${(groupIndex * 8 + charIndex) * 50}ms`;
                groupElement.appendChild(charElement);
            });
            
            hashContainer.appendChild(groupElement);
            
            // Add space between groups
            if (groupIndex < hashGroups.length - 1) {
                const space = document.createElement('span');
                space.className = 'hash-space';
                space.textContent = ' ';
                hashContainer.appendChild(space);
            }
        });
        
        hashOutput.appendChild(hashContainer);
        
        // Update metadata
        hashLength.textContent = hash.length;
        hashTime.textContent = duration;
        
        // Add copy functionality
        this.addCopyButton(hashOutput, hash);
    }

    groupHash(hash, groupSize) {
        const groups = [];
        for (let i = 0; i < hash.length; i += groupSize) {
            groups.push(hash.slice(i, i + groupSize));
        }
        return groups;
    }

    addCopyButton(container, hash) {
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-hash-btn';
        copyBtn.innerHTML = '📋 Copy';
        copyBtn.title = 'Copy hash to clipboard';
        
        copyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(hash);
                copyBtn.innerHTML = '✅ Copied!';
                copyBtn.classList.add('copied');
                
                setTimeout(() => {
                    copyBtn.innerHTML = '📋 Copy';
                    copyBtn.classList.remove('copied');
                }, 2000);
            } catch (error) {
                console.error('Failed to copy hash:', error);
                copyBtn.innerHTML = '❌ Failed';
                setTimeout(() => {
                    copyBtn.innerHTML = '📋 Copy';
                }, 2000);
            }
        });
        
        container.appendChild(copyBtn);
    }

    clearHashDisplay() {
        const hashOutput = document.getElementById('hash-output');
        const hashLength = document.getElementById('hash-length');
        const hashTime = document.getElementById('hash-time');
        
        hashOutput.innerHTML = '<span class="placeholder">Hash will appear here...</span>';
        hashLength.textContent = '0';
        hashTime.textContent = '0';
    }

    displayError(message) {
        const hashOutput = document.getElementById('hash-output');
        hashOutput.innerHTML = `<span class="error-message">${message}</span>`;
    }

    addToHistory(input, hash, duration) {
        const historyItem = {
            input: input,
            hash: hash,
            duration: duration,
            timestamp: new Date().toISOString()
        };
        
        this.hashHistory.unshift(historyItem);
        
        // Keep only last 10 items
        if (this.hashHistory.length > 10) {
            this.hashHistory.pop();
        }
        
        this.updateHistoryDisplay();
    }

    updateHistoryDisplay() {
        const historyList = document.querySelector('.history-list');
        if (!historyList) return;
        
        historyList.innerHTML = '';
        
        this.hashHistory.forEach((item, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            const inputPreview = item.input.length > 20 ? 
                item.input.substring(0, 20) + '...' : item.input;
            
            const hashPreview = item.hash.substring(0, 16) + '...';
            
            historyItem.innerHTML = `
                <div class="history-input">"${inputPreview}"</div>
                <div class="history-hash">${hashPreview}</div>
                <div class="history-time">${item.duration}ms</div>
                <button class="history-copy" data-hash="${item.hash}">Copy</button>
            `;
            
            // Add copy functionality
            const copyBtn = historyItem.querySelector('.history-copy');
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(item.hash);
                copyBtn.textContent = 'Copied!';
                setTimeout(() => {
                    copyBtn.textContent = 'Copy';
                }, 1000);
            });
            
            historyList.appendChild(historyItem);
        });
    }

    loadBitcoinExamples() {
        // Add some Bitcoin-specific examples
        const examples = [
            {
                text: 'The Times 03/Jan/2009 Chancellor on brink of second bailout for banks',
                description: 'Genesis block message'
            },
            {
                text: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
                description: 'First Bitcoin address'
            },
            {
                text: '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f',
                description: 'Genesis block hash'
            }
        ];
        
        // Add these to the examples section
        const examplesContainer = document.querySelector('.preset-examples');
        if (examplesContainer) {
            examples.forEach(example => {
                const btn = document.createElement('button');
                btn.className = 'example-btn bitcoin-example';
                btn.dataset.text = example.text;
                btn.title = example.description;
                btn.textContent = example.description;
                examplesContainer.appendChild(btn);
            });
        }
    }

    debounce(func, wait) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(func, wait);
    }

    // Public methods for external control
    setInput(text) {
        const input = document.getElementById('sha256-input');
        if (input) {
            input.value = text;
            this.currentInput = text;
            this.generateHash(text);
        }
    }

    clear() {
        this.clearHashDisplay();
        this.hashHistory = [];
        this.updateHistoryDisplay();
    }

    getHashHistory() {
        return [...this.hashHistory];
    }

    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }
        this.isInitialized = false;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SHA256Demo;
} else {
    window.SHA256Demo = SHA256Demo;
} 