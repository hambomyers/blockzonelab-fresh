/**
 * Lesson 2: Bitcoin & Austrian Economics - Custom Demos
 * Bitcoin-specific interactive demonstrations and functionality
 */

class BitcoinLessonDemos {
    constructor() {
        this.currentSection = 0;
        this.sections = [
            'bitcoin-fundamentals',
            'austrian-economics',
            'monetary-theory',
            'historical-context',
            'bitcoin-connection'
        ];
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupInteractiveElements();
        this.setupProgressTracking();
        this.setupBitcoinPriceTicker();
        this.setupHalvingCountdown();
    }

    setupNavigation() {
        const navButtons = document.querySelectorAll('.section-nav-btn');
        navButtons.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                this.navigateToSection(index);
            });
        });
    }

    navigateToSection(sectionIndex) {
        // Hide all sections
        this.sections.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) {
                section.style.display = 'none';
            }
        });

        // Show selected section
        const targetSection = document.getElementById(this.sections[sectionIndex]);
        if (targetSection) {
            targetSection.style.display = 'block';
            targetSection.classList.add('fade-in');
        }

        // Update navigation state
        this.currentSection = sectionIndex;
        this.updateNavigationState();
        this.updateProgress();
    }

    updateNavigationState() {
        const navButtons = document.querySelectorAll('.section-nav-btn');
        navButtons.forEach((btn, index) => {
            btn.classList.remove('active');
            if (index === this.currentSection) {
                btn.classList.add('active');
            }
        });
    }

    setupInteractiveElements() {
        this.setupBitcoinCalculator();
        this.setupNetworkEffectDemo();
        this.setupInflationComparison();
        this.setupHistoricalTimeline();
    }

    setupBitcoinCalculator() {
        const calculator = document.getElementById('bitcoin-calculator');
        if (!calculator) return;

        const form = calculator.querySelector('form');
        const result = calculator.querySelector('.result');

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const amount = parseFloat(formData.get('amount'));
            const years = parseInt(formData.get('years'));
            const bitcoinPrice = parseFloat(formData.get('bitcoin-price'));

            if (amount && years && bitcoinPrice) {
                const futureValue = this.calculateBitcoinValue(amount, years, bitcoinPrice);
                result.innerHTML = `
                    <h4>Investment Projection</h4>
                    <div class="result-grid">
                        <div class="result-item">
                            <span class="label">Initial Investment:</span>
                            <span class="value">$${amount.toLocaleString()}</span>
                        </div>
                        <div class="result-item">
                            <span class="label">Bitcoin Purchased:</span>
                            <span class="value">${(amount / bitcoinPrice).toFixed(8)} BTC</span>
                        </div>
                        <div class="result-item">
                            <span class="label">Projected Value (${years} years):</span>
                            <span class="value">$${futureValue.toLocaleString()}</span>
                        </div>
                        <div class="result-item">
                            <span class="label">Potential Return:</span>
                            <span class="value">${((futureValue - amount) / amount * 100).toFixed(1)}%</span>
                        </div>
                    </div>
                `;
                result.style.display = 'block';
            }
        });
    }

    calculateBitcoinValue(initialAmount, years, currentPrice) {
        // Simplified projection model (not financial advice)
        const bitcoinPurchased = initialAmount / currentPrice;
        const projectedPrice = currentPrice * Math.pow(1.5, years); // Conservative 50% annual growth
        return bitcoinPurchased * projectedPrice;
    }

    setupNetworkEffectDemo() {
        const networkDemo = document.getElementById('network-effect-demo');
        if (!networkDemo) return;

        const slider = networkDemo.querySelector('input[type="range"]');
        const valueDisplay = networkDemo.querySelector('.network-value');
        const chart = networkDemo.querySelector('.network-chart');

        slider.addEventListener('input', (e) => {
            const users = parseInt(e.target.value);
            const value = this.calculateNetworkValue(users);
            
            valueDisplay.textContent = `$${value.toLocaleString()}`;
            this.updateNetworkChart(chart, users, value);
        });
    }

    calculateNetworkValue(users) {
        // Metcalfe's Law: Value = n² (simplified)
        return users * users * 100; // Base value of $100 per user²
    }

    updateNetworkChart(chart, users, value) {
        // Simple chart update (in real implementation, use Chart.js)
        chart.style.height = `${Math.min(value / 1000, 200)}px`;
        chart.style.backgroundColor = `hsl(${Math.min(value / 100, 360)}, 70%, 50%)`;
    }

    setupInflationComparison() {
        const inflationDemo = document.getElementById('inflation-comparison');
        if (!inflationDemo) return;

        const form = inflationDemo.querySelector('form');
        const result = inflationDemo.querySelector('.comparison-result');

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const initialAmount = parseFloat(formData.get('initial-amount'));
            const years = parseInt(formData.get('years'));

            if (initialAmount && years) {
                const fiatValue = this.calculateFiatValue(initialAmount, years);
                const bitcoinValue = this.calculateBitcoinValue(initialAmount, years, 50000); // Assume $50k BTC

                result.innerHTML = `
                    <div class="comparison-grid">
                        <div class="comparison-item fiat">
                            <h4>Fiat Currency</h4>
                            <div class="value">$${fiatValue.toLocaleString()}</div>
                            <div class="change">-${((initialAmount - fiatValue) / initialAmount * 100).toFixed(1)}%</div>
                        </div>
                        <div class="comparison-item bitcoin">
                            <h4>Bitcoin</h4>
                            <div class="value">$${bitcoinValue.toLocaleString()}</div>
                            <div class="change">+${((bitcoinValue - initialAmount) / initialAmount * 100).toFixed(1)}%</div>
                        </div>
                    </div>
                `;
                result.style.display = 'block';
            }
        });
    }

    calculateFiatValue(initialAmount, years) {
        // Assume 2% annual inflation
        return initialAmount / Math.pow(1.02, years);
    }

    setupHistoricalTimeline() {
        const timeline = document.getElementById('historical-timeline');
        if (!timeline) return;

        const events = [
            { year: 1913, event: 'Federal Reserve Created', description: 'Central banking system established' },
            { year: 1944, event: 'Bretton Woods Agreement', description: 'Dollar pegged to gold at $35/oz' },
            { year: 1971, event: 'Nixon Shock', description: 'Gold standard abandoned' },
            { year: 2008, event: 'Financial Crisis', description: 'Quantitative easing begins' },
            { year: 2009, event: 'Bitcoin Genesis', description: 'Satoshi mines first block' },
            { year: 2020, event: 'COVID-19 Response', description: 'Massive money printing' }
        ];

        this.renderTimeline(timeline, events);
    }

    renderTimeline(container, events) {
        const timelineHTML = events.map(event => `
            <div class="timeline-event">
                <div class="timeline-year">${event.year}</div>
                <div class="timeline-content">
                    <h4>${event.event}</h4>
                    <p>${event.description}</p>
                </div>
            </div>
        `).join('');

        container.innerHTML = timelineHTML;
    }

    setupProgressTracking() {
        const progressBar = document.querySelector('.progress-bar');
        if (!progressBar) return;

        this.updateProgress();
    }

    updateProgress() {
        const progressBar = document.querySelector('.progress-bar');
        if (!progressBar) return;

        const progress = ((this.currentSection + 1) / this.sections.length) * 100;
        progressBar.style.width = `${progress}%`;
    }

    setupBitcoinPriceTicker() {
        const ticker = document.getElementById('bitcoin-price-ticker');
        if (!ticker) return;

        // Simulate real-time price updates
        this.updateBitcoinPrice(ticker);
        setInterval(() => this.updateBitcoinPrice(ticker), 5000);
    }

    updateBitcoinPrice(ticker) {
        // Simulate price movement (in real implementation, use actual API)
        const basePrice = 50000;
        const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
        const currentPrice = basePrice * (1 + variation);
        
        const priceElement = ticker.querySelector('.price');
        const changeElement = ticker.querySelector('.change');
        
        if (priceElement) priceElement.textContent = `$${currentPrice.toLocaleString()}`;
        if (changeElement) {
            const changePercent = (variation * 100).toFixed(2);
            changeElement.textContent = `${changePercent > 0 ? '+' : ''}${changePercent}%`;
            changeElement.className = `change ${changePercent > 0 ? 'positive' : 'negative'}`;
        }
    }

    setupHalvingCountdown() {
        const countdown = document.getElementById('halving-countdown');
        if (!countdown) return;

        // Calculate next halving (approximately every 4 years)
        const lastHalving = new Date('2024-04-20'); // Last halving date
        const nextHalving = new Date(lastHalving.getTime() + (4 * 365 * 24 * 60 * 60 * 1000));
        
        this.updateHalvingCountdown(countdown, nextHalving);
        setInterval(() => this.updateHalvingCountdown(countdown, nextHalving), 1000);
    }

    updateHalvingCountdown(container, nextHalving) {
        const now = new Date();
        const timeLeft = nextHalving - now;

        if (timeLeft > 0) {
            const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

            container.innerHTML = `
                <div class="countdown-grid">
                    <div class="countdown-item">
                        <span class="number">${days}</span>
                        <span class="label">Days</span>
                    </div>
                    <div class="countdown-item">
                        <span class="number">${hours}</span>
                        <span class="label">Hours</span>
                    </div>
                    <div class="countdown-item">
                        <span class="number">${minutes}</span>
                        <span class="label">Minutes</span>
                    </div>
                    <div class="countdown-item">
                        <span class="number">${seconds}</span>
                        <span class="label">Seconds</span>
                    </div>
                </div>
                <p>Until Next Bitcoin Halving</p>
            `;
        } else {
            container.innerHTML = '<p>Halving event has occurred!</p>';
        }
    }

    // Public methods for external use
    getCurrentSection() {
        return this.currentSection;
    }

    getTotalSections() {
        return this.sections.length;
    }

    goToNextSection() {
        if (this.currentSection < this.sections.length - 1) {
            this.navigateToSection(this.currentSection + 1);
        }
    }

    goToPreviousSection() {
        if (this.currentSection > 0) {
            this.navigateToSection(this.currentSection - 1);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.bitcoinLessonDemos = new BitcoinLessonDemos();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BitcoinLessonDemos;
} 