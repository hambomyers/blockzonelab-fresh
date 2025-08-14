/**
 * Inflation Calculator - Interactive Demo
 * Demonstrates the effects of inflation on purchasing power
 */

class InflationCalculator {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.initialAmount = 1000;
        this.inflationRate = 2.0;
        this.years = 10;
        this.init();
    }

    init() {
        this.render();
        this.bindEvents();
        this.calculate();
    }

    render() {
        this.container.innerHTML = `
            <div class="inflation-calculator">
                <h3>Inflation Calculator</h3>
                <p>See how inflation erodes purchasing power over time</p>
                
                <div class="calculator-controls">
                    <div class="control-group">
                        <label for="initial-amount">Initial Amount ($):</label>
                        <input type="number" id="initial-amount" value="${this.initialAmount}" min="100" max="100000">
                    </div>
                    
                    <div class="control-group">
                        <label for="inflation-rate">Annual Inflation Rate (%):</label>
                        <input type="number" id="inflation-rate" value="${this.inflationRate}" min="0.1" max="50" step="0.1">
                    </div>
                    
                    <div class="control-group">
                        <label for="years">Time Period (Years):</label>
                        <input type="number" id="years" value="${this.years}" min="1" max="50">
                    </div>
                </div>
                
                <div class="results">
                    <div class="result-card">
                        <h4>Purchasing Power</h4>
                        <div class="amount" id="purchasing-power">$0</div>
                        <p>What your money will be worth</p>
                    </div>
                    
                    <div class="result-card">
                        <h4>Loss of Value</h4>
                        <div class="amount loss" id="value-loss">$0</div>
                        <p>How much value you've lost</p>
                    </div>
                    
                    <div class="result-card">
                        <h4>Inflation Impact</h4>
                        <div class="percentage" id="inflation-impact">0%</div>
                        <p>Percentage of value lost</p>
                    </div>
                </div>
                
                <div class="chart-container">
                    <canvas id="inflation-chart" width="400" height="200"></canvas>
                </div>
                
                <div class="insights">
                    <h4>Key Insights</h4>
                    <ul>
                        <li>Inflation compounds over time, accelerating value erosion</li>
                        <li>Even "low" 2% inflation cuts purchasing power in half over 35 years</li>
                        <li>This is why Bitcoin's fixed supply is revolutionary</li>
                    </ul>
                </div>
            </div>
        `;
    }

    bindEvents() {
        const inputs = this.container.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.updateValues();
                this.calculate();
            });
        });
    }

    updateValues() {
        this.initialAmount = parseFloat(document.getElementById('initial-amount').value);
        this.inflationRate = parseFloat(document.getElementById('inflation-rate').value);
        this.years = parseInt(document.getElementById('years').value);
    }

    calculate() {
        const purchasingPower = this.initialAmount / Math.pow(1 + this.inflationRate / 100, this.years);
        const valueLoss = this.initialAmount - purchasingPower;
        const inflationImpact = (valueLoss / this.initialAmount) * 100;

        document.getElementById('purchasing-power').textContent = `$${purchasingPower.toFixed(2)}`;
        document.getElementById('value-loss').textContent = `$${valueLoss.toFixed(2)}`;
        document.getElementById('inflation-impact').textContent = `${inflationImpact.toFixed(1)}%`;

        this.updateChart();
    }

    updateChart() {
        const canvas = document.getElementById('inflation-chart');
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Chart data
        const data = [];
        for (let year = 0; year <= this.years; year++) {
            const value = this.initialAmount / Math.pow(1 + this.inflationRate / 100, year);
            data.push({
                year: year,
                value: value
            });
        }
        
        // Draw chart
        const padding = 40;
        const chartWidth = canvas.width - 2 * padding;
        const chartHeight = canvas.height - 2 * padding;
        
        // Y-axis (values)
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, canvas.height - padding);
        ctx.stroke();
        
        // X-axis (years)
        ctx.beginPath();
        ctx.moveTo(padding, canvas.height - padding);
        ctx.lineTo(canvas.width - padding, canvas.height - padding);
        ctx.stroke();
        
        // Plot line
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        data.forEach((point, index) => {
            const x = padding + (point.year / this.years) * chartWidth;
            const y = canvas.height - padding - (point.value / this.initialAmount) * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // Add labels
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        
        // X-axis labels
        ctx.fillText('0', padding, canvas.height - 20);
        ctx.fillText(`${this.years} years`, canvas.width - padding, canvas.height - 20);
        
        // Y-axis labels
        ctx.textAlign = 'right';
        ctx.fillText(`$${this.initialAmount}`, padding - 10, padding + 15);
        ctx.fillText('$0', padding - 10, canvas.height - padding + 15);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InflationCalculator;
} 