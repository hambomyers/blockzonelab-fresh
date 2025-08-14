/**
 * Economic Charts - Interactive Demo
 * Visualizes economic data and trends relevant to Bitcoin and Austrian economics
 */

class EconomicCharts {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.charts = {};
        this.init();
    }

    init() {
        this.render();
        this.createCharts();
        this.bindEvents();
    }

    render() {
        this.container.innerHTML = `
            <div class="economic-charts">
                <h3>Economic Data Visualizations</h3>
                <p>Explore key economic indicators and their relationship to Bitcoin</p>
                
                <div class="chart-controls">
                    <button class="chart-btn active" data-chart="money-supply">Money Supply Growth</button>
                    <button class="chart-btn" data-chart="purchasing-power">Purchasing Power Decline</button>
                    <button class="chart-btn" data-chart="bitcoin-adoption">Bitcoin Adoption</button>
                    <button class="chart-btn" data-chart="gold-comparison">Gold vs Bitcoin</button>
                </div>
                
                <div class="chart-container">
                    <canvas id="money-supply-chart" class="chart-canvas active"></canvas>
                    <canvas id="purchasing-power-chart" class="chart-canvas"></canvas>
                    <canvas id="bitcoin-adoption-chart" class="chart-canvas"></canvas>
                    <canvas id="gold-comparison-chart" class="chart-canvas"></canvas>
                </div>
                
                <div class="chart-insights">
                    <div id="money-supply-insights" class="insight-panel active">
                        <h4>Money Supply Insights</h4>
                        <ul>
                            <li>M2 money supply has increased dramatically since 2008</li>
                            <li>This expansion directly correlates with purchasing power decline</li>
                            <li>Bitcoin's fixed supply provides a hedge against this trend</li>
                        </ul>
                    </div>
                    
                    <div id="purchasing-power-insights" class="insight-panel">
                        <h4>Purchasing Power Insights</h4>
                        <ul>
                            <li>Dollar has lost over 90% of its purchasing power since 1913</li>
                            <li>Inflation compounds, accelerating the decline</li>
                            <li>Bitcoin's deflationary nature preserves value over time</li>
                        </ul>
                    </div>
                    
                    <div id="bitcoin-adoption-insights" class="insight-panel">
                        <h4>Bitcoin Adoption Insights</h4>
                        <ul>
                            <li>Network effect drives exponential adoption</li>
                            <li>Metcalfe's Law: value increases with user base</li>
                            <li>Early adoption provides significant advantages</li>
                        </ul>
                    </div>
                    
                    <div id="gold-comparison-insights" class="insight-panel">
                        <h4>Gold vs Bitcoin Insights</h4>
                        <ul>
                            <li>Both serve as stores of value</li>
                            <li>Bitcoin offers superior portability and divisibility</li>
                            <li>Digital scarcity vs physical scarcity</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    bindEvents() {
        const chartButtons = this.container.querySelectorAll('.chart-btn');
        chartButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchChart(btn.dataset.chart);
            });
        });
    }

    switchChart(chartType) {
        // Update button states
        this.container.querySelectorAll('.chart-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        this.container.querySelector(`[data-chart="${chartType}"]`).classList.add('active');
        
        // Update chart visibility
        this.container.querySelectorAll('.chart-canvas').forEach(canvas => {
            canvas.classList.remove('active');
        });
        this.container.querySelector(`#${chartType}-chart`).classList.add('active');
        
        // Update insights
        this.container.querySelectorAll('.insight-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        this.container.querySelector(`#${chartType}-insights`).classList.add('active');
        
        // Redraw active chart
        if (this.charts[chartType]) {
            this.charts[chartType].resize();
        }
    }

    createCharts() {
        this.createMoneySupplyChart();
        this.createPurchasingPowerChart();
        this.createBitcoinAdoptionChart();
        this.createGoldComparisonChart();
    }

    createMoneySupplyChart() {
        const canvas = document.getElementById('money-supply-chart');
        const ctx = canvas.getContext('2d');
        
        // Sample data (M2 money supply in trillions)
        const data = [
            { year: 2000, m2: 4.6, fed: 0.5 },
            { year: 2005, m2: 6.4, fed: 0.8 },
            { year: 2010, m2: 8.5, fed: 2.1 },
            { year: 2015, m2: 12.1, fed: 4.2 },
            { year: 2020, m2: 19.4, fed: 7.2 },
            { year: 2023, m2: 20.8, fed: 8.8 }
        ];
        
        this.drawLineChart(ctx, data, 'M2 Money Supply Growth', 'Year', 'Trillions USD', ['m2', 'fed'], ['#e74c3c', '#3498db']);
    }

    createPurchasingPowerChart() {
        const canvas = document.getElementById('purchasing-power-chart');
        const ctx = canvas.getContext('2d');
        
        // Sample data (purchasing power index, 1913 = 100)
        const data = [
            { year: 1913, power: 100 },
            { year: 1950, power: 47.6 },
            { year: 1975, power: 20.1 },
            { year: 2000, power: 8.3 },
            { year: 2023, power: 3.2 }
        ];
        
        this.drawLineChart(ctx, data, 'Dollar Purchasing Power Decline', 'Year', 'Purchasing Power Index', ['power'], ['#e67e22']);
    }

    createBitcoinAdoptionChart() {
        const canvas = document.getElementById('bitcoin-adoption-chart');
        const ctx = canvas.getContext('2d');
        
        // Sample data (Bitcoin addresses with >0.01 BTC)
        const data = [
            { year: 2010, addresses: 1000 },
            { year: 2013, addresses: 50000 },
            { year: 2016, addresses: 200000 },
            { year: 2019, addresses: 800000 },
            { year: 2023, addresses: 1500000 }
        ];
        
        this.drawLineChart(ctx, data, 'Bitcoin Adoption Growth', 'Year', 'Active Addresses', ['addresses'], ['#f39c12']);
    }

    createGoldComparisonChart() {
        const canvas = document.getElementById('gold-comparison-chart');
        const ctx = canvas.getContext('2d');
        
        // Sample data (price performance, 2015 = 100)
        const data = [
            { year: 2015, gold: 100, bitcoin: 100 },
            { year: 2017, gold: 115, bitcoin: 850 },
            { year: 2019, gold: 125, bitcoin: 1200 },
            { year: 2021, gold: 140, bitcoin: 2800 },
            { year: 2023, gold: 155, bitcoin: 1800 }
        ];
        
        this.drawLineChart(ctx, data, 'Gold vs Bitcoin Performance', 'Year', 'Performance Index (2015 = 100)', ['gold', 'bitcoin'], ['#f1c40f', '#9b59b6']);
    }

    drawLineChart(ctx, data, title, xLabel, yLabel, dataKeys, colors) {
        const canvas = ctx.canvas;
        const width = canvas.width;
        const height = canvas.height;
        const padding = 60;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Find data ranges
        const xMin = Math.min(...data.map(d => d.year));
        const xMax = Math.max(...data.map(d => d.year));
        const yMin = 0;
        const yMax = Math.max(...dataKeys.map(key => Math.max(...data.map(d => d[key]))));
        
        // Draw axes
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        
        // Y-axis
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.stroke();
        
        // X-axis
        ctx.beginPath();
        ctx.moveTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();
        
        // Draw grid lines
        ctx.strokeStyle = '#eee';
        ctx.lineWidth = 1;
        
        // Horizontal grid lines
        for (let i = 0; i <= 5; i++) {
            const y = padding + (i / 5) * (height - 2 * padding);
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }
        
        // Vertical grid lines
        for (let i = 0; i <= 5; i++) {
            const x = padding + (i / 5) * (width - 2 * padding);
            ctx.beginPath();
            ctx.moveTo(x, padding);
            ctx.lineTo(x, height - padding);
            ctx.stroke();
        }
        
        // Draw data lines
        dataKeys.forEach((key, index) => {
            ctx.strokeStyle = colors[index];
            ctx.lineWidth = 3;
            ctx.beginPath();
            
            data.forEach((point, pointIndex) => {
                const x = padding + ((point.year - xMin) / (xMax - xMin)) * (width - 2 * padding);
                const y = height - padding - ((point[key] - yMin) / (yMax - yMin)) * (height - 2 * padding);
                
                if (pointIndex === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
                
                // Draw data points
                ctx.fillStyle = colors[index];
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, 2 * Math.PI);
                ctx.fill();
            });
            
            ctx.stroke();
        });
        
        // Add labels
        ctx.fillStyle = '#333';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(title, width / 2, 25);
        
        // X-axis label
        ctx.font = '14px Arial';
        ctx.fillText(xLabel, width / 2, height - 15);
        
        // Y-axis label
        ctx.save();
        ctx.translate(20, height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(yLabel, 0, 0);
        ctx.restore();
        
        // Y-axis values
        ctx.textAlign = 'right';
        ctx.font = '12px Arial';
        for (let i = 0; i <= 5; i++) {
            const value = yMin + (i / 5) * (yMax - yMin);
            const y = padding + (i / 5) * (height - 2 * padding);
            ctx.fillText(value.toFixed(1), padding - 10, y + 4);
        }
        
        // X-axis values
        ctx.textAlign = 'center';
        for (let i = 0; i <= 5; i++) {
            const value = xMin + (i / 5) * (xMax - xMin);
            const x = padding + (i / 5) * (width - 2 * padding);
            ctx.fillText(Math.round(value), x, height - padding + 20);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EconomicCharts;
} 