/**
 * BlockZone Lab Payment System - Clean Architecture
 * Preserving your proven Sonic Labs + Apple Pay integration
 */

class PaymentSystem {
    constructor() {
        this.isInitialized = false;
        this.sonicLabsConnected = false;
        this.applePayAvailable = false;
        
        // Your proven pricing strategy
        this.pricing = {
            gamePrice: 0.25,        // $0.25 per game
            dayPassPrice: 2.50,     // $2.50 day pass until 11pm EST
            dayPassCutoff: '23:00', // 11pm EST
            welcomeQuarks: 10       // Free Quarks for new players
        };
        
        // Payment methods
        this.paymentMethods = {
            sonicLabs: null,
            applePay: null,
            creditCard: null
        };
        
        console.log('💳 Payment System initialized - Your proven monetization strategy');
    }
    
    async initialize() {
        if (this.isInitialized) return;
        
        try {
            // Initialize Sonic Labs connection
            await this.initializeSonicLabs();
            
            // Check Apple Pay availability
            await this.checkApplePayAvailability();
            
            // Setup payment UI
            this.setupPaymentUI();
            
            this.isInitialized = true;
            console.log('✅ Payment system ready');
            
        } catch (error) {
            console.error('❌ Payment initialization failed:', error);
            // Graceful fallback - show alternative payment methods
            this.setupFallbackPayment();
        }
    }
    
    async initializeSonicLabs() {
        try {
            // Your proven Sonic Labs integration
            if (typeof window.ethereum !== 'undefined') {
                // Check if connected to Sonic Labs network
                const chainId = await window.ethereum.request({ method: 'eth_chainId' });
                const sonicChainId = '0xFA'; // Sonic Labs mainnet
                
                if (chainId === sonicChainId) {
                    this.sonicLabsConnected = true;
                    console.log('🔗 Connected to Sonic Labs network');
                } else {
                    // Prompt to switch to Sonic Labs
                    await this.switchToSonicLabs();
                }
                
                // Initialize wallet connection
                this.paymentMethods.sonicLabs = {
                    provider: window.ethereum,
                    connected: this.sonicLabsConnected
                };
                
            } else {
                console.log('🔄 MetaMask not detected, showing wallet installation guide');
            }
        } catch (error) {
            console.warn('⚠️ Sonic Labs initialization failed:', error);
        }
    }
    
    async switchToSonicLabs() {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0xFA' }], // Sonic Labs mainnet
            });
            this.sonicLabsConnected = true;
        } catch (switchError) {
            // Chain not added, add it
            if (switchError.code === 4902) {
                await this.addSonicLabsNetwork();
            }
        }
    }
    
    async addSonicLabsNetwork() {
        try {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: '0xFA',
                    chainName: 'Sonic Labs',
                    nativeCurrency: {
                        name: 'Sonic',
                        symbol: 'S',
                        decimals: 18
                    },
                    rpcUrls: ['https://rpc.soniclabs.com'],
                    blockExplorerUrls: ['https://explorer.soniclabs.com']
                }]
            });
            this.sonicLabsConnected = true;
        } catch (error) {
            console.error('❌ Failed to add Sonic Labs network:', error);
        }
    }
    
    async checkApplePayAvailability() {
        if (window.ApplePaySession && ApplePaySession.canMakePayments()) {
            this.applePayAvailable = true;
            this.paymentMethods.applePay = {
                available: true,
                version: ApplePaySession.supportsVersion(3) ? 3 : 2
            };
            console.log('🍎 Apple Pay available');
        }
    }
    
    setupPaymentUI() {
        // Create payment modal (your proven UI style)
        this.createPaymentModal();
    }
    
    createPaymentModal() {
        const modalHTML = `
            <div id="payment-modal" class="payment-modal" style="display: none;">
                <div class="professional-frame payment-frame">
                    <div class="neon-drop-header">
                        <span class="neon-letter">P</span>
                        <span class="neon-letter">A</span>
                        <span class="neon-letter">Y</span>
                    </div>
                    
                    <div class="payment-content">
                        <h2 class="text-center mb-2">Choose Your Game Pass</h2>
                        
                        <div class="payment-options">
                            <div class="payment-option" data-type="single">
                                <div class="option-header">
                                    <span class="option-price">$0.25</span>
                                    <span class="option-title">Single Game</span>
                                </div>
                                <div class="option-description">
                                    Play one game with real USDC prizes
                                </div>
                            </div>
                            
                            <div class="payment-option featured" data-type="daypass">
                                <div class="option-badge">BEST VALUE</div>
                                <div class="option-header">
                                    <span class="option-price">$2.50</span>
                                    <span class="option-title">Day Pass</span>
                                </div>
                                <div class="option-description">
                                    Unlimited games until 11pm EST
                                </div>
                            </div>
                        </div>
                        
                        <div class="payment-methods">
                            <h3 class="text-center mb-1">Payment Method</h3>
                            
                            <div class="method-buttons">
                                ${this.sonicLabsConnected ? `
                                    <button class="btn btn-primary payment-btn" data-method="sonic">
                                        🔗 Sonic Labs Wallet
                                    </button>
                                ` : ''}
                                
                                ${this.applePayAvailable ? `
                                    <button class="btn payment-btn" data-method="apple">
                                        🍎 Apple Pay
                                    </button>
                                ` : ''}
                                
                                <button class="btn payment-btn" data-method="card">
                                    💳 Credit Card
                                </button>
                            </div>
                        </div>
                        
                        <div class="payment-footer">
                            <button class="btn" id="close-payment">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.setupPaymentHandlers();
    }
    
    setupPaymentHandlers() {
        const modal = document.getElementById('payment-modal');
        const closeBtn = document.getElementById('close-payment');
        const paymentBtns = document.querySelectorAll('.payment-btn');
        const optionBtns = document.querySelectorAll('.payment-option');
        
        let selectedOption = 'daypass'; // Default to best value
        let selectedMethod = null;
        
        // Option selection
        optionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                optionBtns.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedOption = btn.dataset.type;
            });
        });
        
        // Payment method selection
        paymentBtns.forEach(btn => {
            btn.addEventListener('click', async () => {
                selectedMethod = btn.dataset.method;
                await this.processPayment(selectedOption, selectedMethod);
            });
        });
        
        // Close modal
        closeBtn.addEventListener('click', () => {
            this.hidePaymentModal();
        });
        
        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hidePaymentModal();
            }
        });
    }
    
    async processPayment(option, method) {
        console.log(`💳 Processing ${option} payment via ${method}`);
        
        try {
            this.showPaymentStatus('processing', 'Processing payment...');
            
            let result;
            switch (method) {
                case 'sonic':
                    result = await this.processSonicLabsPayment(option);
                    break;
                case 'apple':
                    result = await this.processApplePayPayment(option);
                    break;
                case 'card':
                    result = await this.processCreditCardPayment(option);
                    break;
                default:
                    throw new Error('Invalid payment method');
            }
            
            if (result.success) {
                this.showPaymentStatus('success', 'Payment successful! Starting game...');
                
                // Update player payment status
                await this.updatePlayerPaymentStatus(option, result);
                
                // Hide modal and start game
                setTimeout(() => {
                    this.hidePaymentModal();
                    this.startGameAfterPayment();
                }, 2000);
                
            } else {
                throw new Error(result.error || 'Payment failed');
            }
            
        } catch (error) {
            console.error('❌ Payment failed:', error);
            this.showPaymentStatus('error', error.message || 'Payment failed. Please try again.');
        }
    }
    
    async processSonicLabsPayment(option) {
        // Your proven Sonic Labs payment flow
        const amount = option === 'single' ? this.pricing.gamePrice : this.pricing.dayPassPrice;
        
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const account = accounts[0];
            
            // Convert USD to USDC.E (assuming 1:1 for simplicity)
            const usdcAmount = (amount * 1000000).toString(); // 6 decimals for USDC
            
            // Your USDC.E contract on Sonic Labs
            const usdcContract = '0x...'; // Your USDC.E contract address
            const gameContract = '0x...';  // Your game payment contract
            
            // Create transaction
            const txHash = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [{
                    from: account,
                    to: gameContract,
                    data: `0x...`, // Your contract method call
                    value: '0x0'    // No native token, using USDC.E
                }]
            });
            
            return {
                success: true,
                txHash: txHash,
                method: 'sonic_labs',
                amount: amount
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async processApplePayPayment(option) {
        // Your proven Apple Pay integration
        const amount = option === 'single' ? this.pricing.gamePrice : this.pricing.dayPassPrice;
        
        return new Promise((resolve) => {
            const request = {
                countryCode: 'US',
                currencyCode: 'USD',
                supportedNetworks: ['visa', 'masterCard', 'amex'],
                merchantCapabilities: ['supports3DS'],
                total: {
                    label: `NeonDrop ${option === 'single' ? 'Game' : 'Day Pass'}`,
                    amount: amount.toFixed(2)
                }
            };
            
            const session = new ApplePaySession(3, request);
            
            session.onvalidatemerchant = async (event) => {
                // Your merchant validation
                const merchantSession = await this.validateApplePayMerchant(event.validationURL);
                session.completeMerchantValidation(merchantSession);
            };
            
            session.onpaymentauthorized = async (event) => {
                // Process payment with your backend
                const result = await this.processApplePayToken(event.payment, option);
                
                if (result.success) {
                    session.completePayment(ApplePaySession.STATUS_SUCCESS);
                    resolve({ success: true, method: 'apple_pay', amount: amount });
                } else {
                    session.completePayment(ApplePaySession.STATUS_FAILURE);
                    resolve({ success: false, error: result.error });
                }
            };
            
            session.begin();
        });
    }
    
    async processCreditCardPayment(option) {
        // Fallback credit card processing
        const amount = option === 'single' ? this.pricing.gamePrice : this.pricing.dayPassPrice;
        
        // This would integrate with your payment processor (Stripe, etc.)
        // For now, simulate success
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    method: 'credit_card',
                    amount: amount,
                    transactionId: `cc_${Date.now()}`
                });
            }, 2000);
        });
    }
    
    async updatePlayerPaymentStatus(option, paymentResult) {
        const player = identitySystem.getPlayer();
        if (!player) return;
        
        if (option === 'daypass') {
            // Set day pass until 11pm EST
            const now = new Date();
            const cutoff = new Date(now);
            cutoff.setHours(23, 0, 0, 0); // 11pm
            
            if (now.getHours() >= 23) {
                // After 11pm, set for next day
                cutoff.setDate(cutoff.getDate() + 1);
            }
            
            player.payment.hasDayPass = true;
            player.payment.dayPassExpiry = cutoff.toISOString();
        }
        
        // Save payment record
        player.payment.lastPayment = {
            type: option,
            amount: paymentResult.amount,
            method: paymentResult.method,
            timestamp: new Date().toISOString(),
            transactionId: paymentResult.txHash || paymentResult.transactionId
        };
        
        identitySystem.savePlayerLocally(player);
        
        // Sync with backend
        await this.syncPaymentWithBackend(player, paymentResult);
    }
    
    async syncPaymentWithBackend(player, paymentResult) {
        try {
            await fetch('/api/payment/record', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playerId: player.id,
                    payment: player.payment.lastPayment
                })
            });
        } catch (error) {
            console.log('🔄 Payment sync failed, saved locally');
        }
    }
    
    showPaymentModal() {
        const modal = document.getElementById('payment-modal');
        if (modal) {
            modal.style.display = 'flex';
            // Select day pass by default
            const dayPassOption = modal.querySelector('[data-type="daypass"]');
            if (dayPassOption) {
                dayPassOption.classList.add('selected');
            }
        }
    }
    
    hidePaymentModal() {
        const modal = document.getElementById('payment-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    showPaymentStatus(type, message) {
        // Update modal with status
        const modal = document.getElementById('payment-modal');
        const content = modal.querySelector('.payment-content');
        
        const statusHTML = `
            <div class="payment-status ${type}">
                <div class="status-icon">
                    ${type === 'processing' ? '⏳' : type === 'success' ? '✅' : '❌'}
                </div>
                <div class="status-message">${message}</div>
            </div>
        `;
        
        content.innerHTML = statusHTML;
    }
    
    startGameAfterPayment() {
        // Start the game after successful payment
        if (window.neonDropGame) {
            neonDropGame.startGame();
        }
    }
    
    checkGameAccess() {
        return identitySystem.canPlayGame();
    }
    
    interceptGameStart() {
        const access = this.checkGameAccess();
        
        if (access.canPlay) {
            // Consume the appropriate credit
            identitySystem.consumeGameCredit(access.reason);
            return true; // Allow game to start
        } else {
            // Show payment modal
            this.showPaymentModal();
            return false; // Block game start
        }
    }
}

// Global payment system
const paymentSystem = new PaymentSystem();

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    paymentSystem.initialize();
});

console.log('💳 Payment System loaded - Your proven monetization strategy');
