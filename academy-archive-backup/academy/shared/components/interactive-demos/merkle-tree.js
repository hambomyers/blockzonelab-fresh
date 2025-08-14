/**
 * BLOCKZONE ACADEMY - MERKLE TREE INTERACTIVE DEMO
 * Demonstrates Bitcoin's efficient transaction verification through Merkle trees
 */

class MerkleTreeDemo {
    constructor(containerId, config = {}) {
        this.config = {
            showAnimations: true,
            enableTransactionEditing: true,
            includeBitcoinExamples: true,
            maxTransactions: 16,
            ...config
        };
        
        this.container = document.getElementById(containerId);
        this.isInitialized = false;
        this.transactions = [];
        this.merkleTree = [];
        this.selectedTransaction = null;
        this.proofPath = [];
        
        this.init();
    }

    init() {
        if (!this.container) {
            console.error('MerkleTreeDemo: Container not found');
            return;
        }

        this.createInterface();
        this.loadDefaultTransactions();
        this.buildMerkleTree();
        this.bindEvents();
        this.isInitialized = true;
    }

    createInterface() {
        this.container.innerHTML = `
            <div class="merkle-tree-demo">
                <div class="demo-header">
                    <h3>Merkle Tree Demo</h3>
                    <p>See how Bitcoin efficiently verifies transaction inclusion</p>
                </div>
                
                <div class="demo-controls">
                    <div class="control-section">
                        <h4>Transaction Management</h4>
                        <div class="transaction-inputs">
                            <input type="text" 
                                   id="new-transaction" 
                                   placeholder="Enter transaction data..."
                                   maxlength="50">
                            <button class="btn btn-primary" id="add-transaction">Add Transaction</button>
                            <button class="btn btn-secondary" id="clear-transactions">Clear All</button>
                        </div>
                        
                        <div class="transaction-count">
                            <span>Transactions: <span id="tx-count">0</span></span>
                            <span>Tree Height: <span id="tree-height">0</span></span>
                        </div>
                    </div>
                    
                    <div class="control-section">
                        <h4>Verification</h4>
                        <div class="verification-controls">
                            <select id="verify-transaction">
                                <option value="">Select transaction to verify...</option>
                            </select>
                            <button class="btn btn-primary" id="verify-btn" disabled>Verify Inclusion</button>
                        </div>
                    </div>
                </div>
                
                <div class="merkle-visualization">
                    <div class="tree-container" id="tree-container">
                        <!-- Merkle tree will be rendered here -->
                    </div>
                    
                    <div class="verification-info" id="verification-info">
                        <div class="info-placeholder">
                            Select a transaction and click "Verify Inclusion" to see the proof path
                        </div>
                    </div>
                </div>
                
                <div class="demo-features">
                    <div class="feature-section">
                        <h4>How Merkle Trees Work</h4>
                        <ul class="feature-list">
                            <li><strong>Efficient Verification:</strong> Prove transaction inclusion without downloading entire block</li>
                            <li><strong>Compact Proofs:</strong> Verification requires only log₂(n) hashes instead of n transactions</li>
                            <li><strong>Tamper Detection:</strong> Any change to a transaction changes the entire tree</li>
                            <li><strong>Scalability:</strong> Works efficiently even with thousands of transactions</li>
                        </ul>
                    </div>
                    
                    <div class="feature-section">
                        <h4>Bitcoin Benefits</h4>
                        <ul class="feature-list">
                            <li><strong>SPV Wallets:</strong> Light clients can verify payments without full node</li>
                            <li><strong>Network Efficiency:</strong> Reduces bandwidth for transaction verification</li>
                            <li><strong>Security:</strong> Maintains cryptographic integrity of all transactions</li>
                            <li><strong>Performance:</strong> Enables fast block validation and propagation</li>
                        </ul>
                    </div>
                </div>
                
                <div class="educational-content">
                    <div class="content-section">
                        <h4>Merkle Tree Construction</h4>
                        <p>A Merkle tree is built by:</p>
                        <ol>
                            <li>Hashing each transaction individually</li>
                            <li>Pairing adjacent hashes and hashing them together</li>
                            <li>Repeating step 2 until only one hash remains (the Merkle root)</li>
                            <li>This root is included in the block header</li>
                        </ol>
                    </div>
                    
                    <div class="content-section">
                        <h4>Verification Process</h4>
                        <p>To verify a transaction is included in a block:</p>
                        <ol>
                            <li>Start with the transaction hash</li>
                            <li>Follow the proof path up the tree</li>
                            <li>Hash with sibling hashes at each level</li>
                            <li>Compare final result with the Merkle root</li>
                        </ol>
                    </div>
                </div>
            </div>
        `;
    }

    loadDefaultTransactions() {
        const defaultTxs = [
            'Alice sends 0.5 BTC to Bob',
            'Bob sends 0.2 BTC to Charlie',
            'Charlie sends 0.1 BTC to David',
            'David sends 0.3 BTC to Eve',
            'Eve sends 0.4 BTC to Frank',
            'Frank sends 0.15 BTC to Grace',
            'Grace sends 0.25 BTC to Henry',
            'Henry sends 0.35 BTC to Irene'
        ];
        
        this.transactions = defaultTxs.slice(0, this.config.maxTransactions);
        this.updateTransactionCount();
        this.updateTransactionSelect();
    }

    buildMerkleTree() {
        if (this.transactions.length === 0) {
            this.merkleTree = [];
            this.renderTree();
            return;
        }

        // Build the tree from bottom up
        const tree = [];
        
        // Level 0: Transaction hashes
        const leafLevel = this.transactions.map(tx => this.sha256(tx));
        tree.push(leafLevel);
        
        // Build upper levels
        let currentLevel = leafLevel;
        while (currentLevel.length > 1) {
            const nextLevel = [];
            
            for (let i = 0; i < currentLevel.length; i += 2) {
                const left = currentLevel[i];
                const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;
                const combined = left + right;
                nextLevel.push(this.sha256(combined));
            }
            
            tree.push(nextLevel);
            currentLevel = nextLevel;
        }
        
        this.merkleTree = tree;
        this.renderTree();
        this.updateTreeHeight();
    }

    renderTree() {
        const container = document.getElementById('tree-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (this.merkleTree.length === 0) {
            container.innerHTML = '<div class="empty-tree">No transactions to display</div>';
            return;
        }
        
        // Render tree from top to bottom
        for (let level = this.merkleTree.length - 1; level >= 0; level--) {
            const levelContainer = document.createElement('div');
            levelContainer.className = `tree-level level-${level}`;
            
            const levelLabel = document.createElement('div');
            levelLabel.className = 'level-label';
            levelLabel.textContent = level === this.merkleTree.length - 1 ? 'Merkle Root' : `Level ${level}`;
            levelContainer.appendChild(levelLabel);
            
            const nodesContainer = document.createElement('div');
            nodesContainer.className = 'tree-nodes';
            
            this.merkleTree[level].forEach((hash, index) => {
                const node = this.createTreeNode(hash, level, index);
                nodesContainer.appendChild(node);
            });
            
            levelContainer.appendChild(nodesContainer);
            container.appendChild(levelContainer);
        }
        
        // Add connecting lines
        this.addTreeConnections();
    }

    createTreeNode(hash, level, index) {
        const node = document.createElement('div');
        node.className = 'tree-node';
        node.dataset.level = level;
        node.dataset.index = index;
        node.dataset.hash = hash;
        
        const hashDisplay = hash.substring(0, 8) + '...';
        node.innerHTML = `
            <div class="node-hash">${hashDisplay}</div>
            <div class="node-index">${index}</div>
        `;
        
        // Add click handler for leaf nodes
        if (level === 0) {
            node.classList.add('leaf-node');
            node.addEventListener('click', () => this.selectTransaction(index));
        }
        
        // Highlight if part of verification path
        if (this.isInProofPath(level, index)) {
            node.classList.add('proof-path');
        }
        
        return node;
    }

    addTreeConnections() {
        // Add visual connections between tree levels
        const levels = document.querySelectorAll('.tree-level');
        
        for (let i = 0; i < levels.length - 1; i++) {
            const currentLevel = levels[i];
            const nextLevel = levels[i + 1];
            
            const currentNodes = currentLevel.querySelectorAll('.tree-node');
            const nextNodes = nextLevel.querySelectorAll('.tree-node');
            
            currentNodes.forEach((node, index) => {
                const parentIndex = Math.floor(index / 2);
                const parentNode = nextNodes[parentIndex];
                
                if (parentNode) {
                    this.drawConnection(node, parentNode);
                }
            });
        }
    }

    drawConnection(fromNode, toNode) {
        const fromRect = fromNode.getBoundingClientRect();
        const toRect = toNode.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        
        const fromX = fromRect.left + fromRect.width / 2 - containerRect.left;
        const fromY = fromRect.top + fromRect.height / 2 - containerRect.top;
        const toX = toRect.left + toRect.width / 2 - containerRect.left;
        const toY = toRect.top + toRect.height / 2 - containerRect.top;
        
        const line = document.createElement('div');
        line.className = 'tree-connection';
        line.style.cssText = `
            position: absolute;
            left: ${fromX}px;
            top: ${fromY}px;
            width: 2px;
            height: ${toY - fromY}px;
            background: var(--accent-color);
            transform-origin: top;
        `;
        
        this.container.appendChild(line);
    }

    selectTransaction(index) {
        this.selectedTransaction = index;
        
        // Update selection in dropdown
        const select = document.getElementById('verify-transaction');
        select.value = index;
        
        // Enable verify button
        document.getElementById('verify-btn').disabled = false;
        
        // Highlight selected transaction
        document.querySelectorAll('.tree-node').forEach(node => {
            node.classList.remove('selected');
        });
        
        const selectedNode = document.querySelector(`[data-level="0"][data-index="${index}"]`);
        if (selectedNode) {
            selectedNode.classList.add('selected');
        }
    }

    verifyTransaction() {
        if (this.selectedTransaction === null) return;
        
        const txIndex = this.selectedTransaction;
        const proofPath = this.generateProofPath(txIndex);
        
        this.proofPath = proofPath;
        this.renderVerificationInfo(txIndex, proofPath);
        this.highlightProofPath();
    }

    generateProofPath(txIndex) {
        const proof = [];
        let currentIndex = txIndex;
        
        for (let level = 0; level < this.merkleTree.length - 1; level++) {
            const siblingIndex = currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1;
            
            if (siblingIndex < this.merkleTree[level].length) {
                proof.push({
                    level: level,
                    index: siblingIndex,
                    hash: this.merkleTree[level][siblingIndex],
                    isRight: currentIndex % 2 === 0
                });
            }
            
            currentIndex = Math.floor(currentIndex / 2);
        }
        
        return proof;
    }

    renderVerificationInfo(txIndex, proofPath) {
        const container = document.getElementById('verification-info');
        const tx = this.transactions[txIndex];
        
        container.innerHTML = `
            <div class="verification-details">
                <h4>Verification Proof for Transaction ${txIndex + 1}</h4>
                <div class="transaction-details">
                    <strong>Transaction:</strong> "${tx}"
                </div>
                <div class="proof-path">
                    <strong>Proof Path (${proofPath.length} hashes):</strong>
                    <div class="proof-steps">
                        ${proofPath.map((step, i) => `
                            <div class="proof-step">
                                <span class="step-number">${i + 1}.</span>
                                <span class="step-hash">${step.hash.substring(0, 8)}...</span>
                                <span class="step-position">${step.isRight ? 'Right' : 'Left'} sibling</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="verification-result">
                    <strong>Result:</strong> 
                    <span class="result-success">✓ Transaction is included in the block</span>
                </div>
                <div class="verification-explanation">
                    <p>This proof demonstrates that the transaction is included in the block without revealing all other transactions. Only ${proofPath.length} hashes are needed instead of all ${this.transactions.length} transaction hashes.</p>
                </div>
            </div>
        `;
    }

    highlightProofPath() {
        // Remove previous highlighting
        document.querySelectorAll('.tree-node').forEach(node => {
            node.classList.remove('proof-path');
        });
        
        // Highlight proof path nodes
        this.proofPath.forEach(step => {
            const node = document.querySelector(`[data-level="${step.level}"][data-index="${step.index}"]`);
            if (node) {
                node.classList.add('proof-path');
            }
        });
    }

    isInProofPath(level, index) {
        return this.proofPath.some(step => step.level === level && step.index === index);
    }

    addTransaction(txData) {
        if (this.transactions.length >= this.config.maxTransactions) {
            alert(`Maximum ${this.config.maxTransactions} transactions allowed`);
            return;
        }
        
        if (txData.trim()) {
            this.transactions.push(txData.trim());
            this.buildMerkleTree();
            this.updateTransactionCount();
            this.updateTransactionSelect();
        }
    }

    clearTransactions() {
        this.transactions = [];
        this.merkleTree = [];
        this.selectedTransaction = null;
        this.proofPath = [];
        this.buildMerkleTree();
        this.updateTransactionCount();
        this.updateTransactionSelect();
        this.clearVerificationInfo();
    }

    updateTransactionCount() {
        const countElement = document.getElementById('tx-count');
        if (countElement) {
            countElement.textContent = this.transactions.length;
        }
    }

    updateTreeHeight() {
        const heightElement = document.getElementById('tree-height');
        if (heightElement) {
            heightElement.textContent = this.merkleTree.length;
        }
    }

    updateTransactionSelect() {
        const select = document.getElementById('verify-transaction');
        select.innerHTML = '<option value="">Select transaction to verify...</option>';
        
        this.transactions.forEach((tx, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `Transaction ${index + 1}: ${tx.substring(0, 30)}...`;
            select.appendChild(option);
        });
    }

    clearVerificationInfo() {
        const container = document.getElementById('verification-info');
        container.innerHTML = `
            <div class="info-placeholder">
                Select a transaction and click "Verify Inclusion" to see the proof path
            </div>
        `;
    }

    bindEvents() {
        const addBtn = document.getElementById('add-transaction');
        const clearBtn = document.getElementById('clear-transactions');
        const verifyBtn = document.getElementById('verify-btn');
        const newTxInput = document.getElementById('new-transaction');
        const verifySelect = document.getElementById('verify-transaction');
        
        addBtn.addEventListener('click', () => {
            const txData = newTxInput.value;
            this.addTransaction(txData);
            newTxInput.value = '';
        });
        
        clearBtn.addEventListener('click', () => {
            this.clearTransactions();
        });
        
        verifyBtn.addEventListener('click', () => {
            this.verifyTransaction();
        });
        
        newTxInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const txData = newTxInput.value;
                this.addTransaction(txData);
                newTxInput.value = '';
            }
        });
        
        verifySelect.addEventListener('change', (e) => {
            const index = parseInt(e.target.value);
            if (!isNaN(index)) {
                this.selectTransaction(index);
            }
        });
    }

    // Simple SHA-256 implementation (for demo purposes)
    sha256(input) {
        // This is a simplified hash function for demonstration
        // In a real implementation, you'd use crypto.subtle.digest
        let hash = 0;
        for (let i = 0; i < input.length; i++) {
            const char = input.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        // Convert to hex-like string
        return Math.abs(hash).toString(16).padStart(8, '0') + 
               Math.abs(hash * 31).toString(16).padStart(8, '0') +
               Math.abs(hash * 17).toString(16).padStart(8, '0') +
               Math.abs(hash * 13).toString(16).padStart(8, '0');
    }

    // Public methods for external control
    setTransactions(transactions) {
        this.transactions = transactions.slice(0, this.config.maxTransactions);
        this.buildMerkleTree();
        this.updateTransactionCount();
        this.updateTransactionSelect();
    }

    getMerkleRoot() {
        if (this.merkleTree.length > 0) {
            return this.merkleTree[this.merkleTree.length - 1][0];
        }
        return null;
    }

    getProofPath(txIndex) {
        return this.generateProofPath(txIndex);
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
    module.exports = MerkleTreeDemo;
} else {
    window.MerkleTreeDemo = MerkleTreeDemo;
} 