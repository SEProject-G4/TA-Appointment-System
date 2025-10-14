const fs = require('fs');
const path = require('path');

/**
 * Custom Artillery Report Generator
 * Creates an interactive HTML report with charts from Artillery results
 */

function generateCustomReport(resultsFile, outputFile) {
    try {
        // Read the results JSON file
        const resultsPath = path.resolve(resultsFile);
        const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
        
        // Extract metrics from the results
        const metrics = extractMetrics(results);
        
        // Generate HTML report with charts
        const htmlContent = generateHTMLReport(metrics);
        
        // Write the report
        fs.writeFileSync(outputFile, htmlContent);
        console.log(`📊 Custom report generated: ${outputFile}`);
        
        return metrics;
    } catch (error) {
        console.error('Error generating report:', error.message);
        throw error;
    }
}

function extractMetrics(results) {
    const metrics = {
        summary: {},
        responseTime: {
            timestamps: [],
            values: [],
            p95Values: [],
            p99Values: []
        },
        requestRate: {
            timestamps: [],
            values: []
        },
        statusCodes: {},
        errors: []
    };
    
    // Extract summary metrics
    if (results.aggregate) {
        const agg = results.aggregate;
        metrics.summary = {
            scenariosCompleted: agg.counters?.['vusers.completed'] || 0,
            scenariosCreated: agg.counters?.['vusers.created'] || 0,
            requestsCompleted: agg.counters?.['http.requests'] || 0,
            bytesReceived: agg.counters?.['http.downloaded_bytes'] || 0,
            responseTime: {
                min: agg.histograms?.['http.response_time']?.min || agg.summaries?.['http.response_time']?.min || 0,
                max: agg.histograms?.['http.response_time']?.max || agg.summaries?.['http.response_time']?.max || 0,
                mean: agg.histograms?.['http.response_time']?.mean || agg.summaries?.['http.response_time']?.mean || 0,
                p50: agg.histograms?.['http.response_time']?.p50 || agg.summaries?.['http.response_time']?.p50 || 0,
                p95: agg.histograms?.['http.response_time']?.p95 || agg.summaries?.['http.response_time']?.p95 || 0,
                p99: agg.histograms?.['http.response_time']?.p99 || agg.summaries?.['http.response_time']?.p99 || 0
            }
        };
        
        // Extract status codes
        Object.keys(agg.counters || {}).forEach(key => {
            if (key.startsWith('http.codes.')) {
                const code = key.replace('http.codes.', '');
                metrics.statusCodes[code] = agg.counters[key];
            }
        });
    }
    
    // Extract intermediate metrics for timeline charts
    if (results.intermediate && Array.isArray(results.intermediate)) {
        results.intermediate.forEach((point, index) => {
            // Handle timestamp - could be Unix timestamp or ISO string
            let timestamp;
            if (point.timestamp) {
                timestamp = typeof point.timestamp === 'number' 
                    ? new Date(point.timestamp).toISOString()
                    : new Date(point.timestamp).toISOString();
            } else {
                // Generate timestamp based on index if not available
                const startTime = results.aggregate?.firstMetricAt || Date.now();
                timestamp = new Date(startTime + (index * 10000)).toISOString();
            }
            
            // Response time data
            if (point.histograms?.['http.response_time']) {
                metrics.responseTime.timestamps.push(timestamp);
                metrics.responseTime.values.push(point.histograms['http.response_time'].mean || 0);
                metrics.responseTime.p95Values.push(point.histograms['http.response_time'].p95 || 0);
                metrics.responseTime.p99Values.push(point.histograms['http.response_time'].p99 || 0);
            }
            
            // Request rate data
            if (point.counters?.['http.requests']) {
                metrics.requestRate.timestamps.push(timestamp);
                metrics.requestRate.values.push(point.counters['http.requests'] || 0);
            }
        });
    }
    
    // If no intermediate data, create synthetic timeline from aggregate
    if (metrics.responseTime.timestamps.length === 0 && results.aggregate) {
        const startTime = results.aggregate.firstMetricAt || Date.now();
        const endTime = results.aggregate.lastMetricAt || Date.now();
        const duration = endTime - startTime;
        const intervals = 10; // Create 10 data points
        
        for (let i = 0; i <= intervals; i++) {
            const time = startTime + (duration * i / intervals);
            const timestamp = new Date(time).toISOString();
            
            metrics.responseTime.timestamps.push(timestamp);
            metrics.responseTime.values.push(results.aggregate.summaries?.['http.response_time']?.mean || 0);
            metrics.responseTime.p95Values.push(results.aggregate.summaries?.['http.response_time']?.p95 || 0);
            
            // Distribute requests evenly across timeline
            const totalRequests = results.aggregate.counters?.['http.requests'] || 0;
            metrics.requestRate.timestamps.push(timestamp);
            metrics.requestRate.values.push(Math.round(totalRequests / intervals));
        }
    }
    
    return metrics;
}

function generateHTMLReport(metrics) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Artillery Load Test Report</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f8fafc;
            color: #1a202c;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5rem;
            font-weight: 700;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
            font-size: 1.1rem;
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .metric-card {
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
            border: 1px solid #e2e8f0;
        }
        .metric-card h3 {
            margin: 0 0 15px 0;
            color: #4a5568;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
        }
        .metric-value {
            font-size: 2rem;
            font-weight: 700;
            color: #2d3748;
            margin-bottom: 5px;
        }
        .metric-unit {
            color: #718096;
            font-size: 0.9rem;
        }
        .chart-container {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
            border: 1px solid #e2e8f0;
            margin-bottom: 30px;
        }
        .chart-container h2 {
            margin: 0 0 20px 0;
            color: #2d3748;
            font-size: 1.5rem;
        }
        .chart-wrapper {
            position: relative;
            height: 400px;
        }
        .status-codes {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
        }
        .status-code {
            background: #f7fafc;
            padding: 10px 15px;
            border-radius: 8px;
            border-left: 4px solid #48bb78;
        }
        .status-code.error {
            border-left-color: #f56565;
        }
        .status-code-number {
            font-weight: 700;
            font-size: 1.1rem;
            color: #2d3748;
        }
        .status-code-count {
            color: #718096;
            font-size: 0.9rem;
        }
        .footer {
            text-align: center;
            color: #718096;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Load Test Report</h1>
            <p>Performance Analysis Dashboard</p>
        </div>
        
        <div class="metrics-grid">
            <div class="metric-card">
                <h3>Total Requests</h3>
                <div class="metric-value">${metrics.summary.requestsCompleted || 0}</div>
                <div class="metric-unit">requests</div>
            </div>
            <div class="metric-card">
                <h3>Scenarios Completed</h3>
                <div class="metric-value">${metrics.summary.scenariosCompleted || 0}</div>
                <div class="metric-unit">scenarios</div>
            </div>
            <div class="metric-card">
                <h3>Average Response Time</h3>
                <div class="metric-value">${Math.round(metrics.summary.responseTime?.mean || 0)}</div>
                <div class="metric-unit">ms</div>
            </div>
            <div class="metric-card">
                <h3>95th Percentile</h3>
                <div class="metric-value">${Math.round(metrics.summary.responseTime?.p95 || 0)}</div>
                <div class="metric-unit">ms</div>
            </div>
            <div class="metric-card">
                <h3>Min Response Time</h3>
                <div class="metric-value">${Math.round(metrics.summary.responseTime?.min || 0)}</div>
                <div class="metric-unit">ms</div>
            </div>
            <div class="metric-card">
                <h3>Max Response Time</h3>
                <div class="metric-value">${Math.round(metrics.summary.responseTime?.max || 0)}</div>
                <div class="metric-unit">ms</div>
            </div>
        </div>
        
        <div class="chart-container">
            <h2>📊 Response Time Over Time</h2>
            <div class="chart-wrapper">
                <canvas id="responseTimeChart"></canvas>
            </div>
        </div>
        
        <div class="chart-container">
            <h2>📈 Request Rate</h2>
            <div class="chart-wrapper">
                <canvas id="requestRateChart"></canvas>
            </div>
        </div>
        
        <div class="chart-container">
            <h2>🎯 Status Codes</h2>
            <div class="status-codes">
                ${Object.entries(metrics.statusCodes).map(([code, count]) => `
                    <div class="status-code ${code.startsWith('4') || code.startsWith('5') ? 'error' : ''}">
                        <div class="status-code-number">${code}</div>
                        <div class="status-code-count">${count} requests</div>
                    </div>
                `).join('')}
            </div>
            <div class="chart-wrapper" style="height: 300px;">
                <canvas id="statusCodesChart"></canvas>
            </div>
        </div>
        
        <div class="footer">
            <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
    </div>
    
    <script>
        const metrics = ${JSON.stringify(metrics)};
        
        // Response Time Chart
        const responseTimeCtx = document.getElementById('responseTimeChart').getContext('2d');
        new Chart(responseTimeCtx, {
            type: 'line',
            data: {
                labels: metrics.responseTime.timestamps.map(t => new Date(t).toLocaleTimeString()),
                datasets: [{
                    label: 'Average Response Time',
                    data: metrics.responseTime.values,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    fill: true,
                    tension: 0.4
                }, {
                    label: '95th Percentile',
                    data: metrics.responseTime.p95Values,
                    borderColor: '#f56565',
                    backgroundColor: 'rgba(245, 101, 101, 0.1)',
                    fill: false,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Response Time (ms)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Time'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });
        
        // Request Rate Chart
        const requestRateCtx = document.getElementById('requestRateChart').getContext('2d');
        new Chart(requestRateCtx, {
            type: 'bar',
            data: {
                labels: metrics.requestRate.timestamps.map(t => new Date(t).toLocaleTimeString()),
                datasets: [{
                    label: 'Requests per Second',
                    data: metrics.requestRate.values,
                    backgroundColor: 'rgba(72, 187, 120, 0.8)',
                    borderColor: '#48bb78',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Requests'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Time'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });
        
        // Status Codes Chart
        const statusCodesCtx = document.getElementById('statusCodesChart').getContext('2d');
        const statusCodeColors = {
            '200': '#48bb78',
            '404': '#ed8936',
            '500': '#f56565',
            '502': '#e53e3e',
            '503': '#c53030'
        };
        
        new Chart(statusCodesCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(metrics.statusCodes),
                datasets: [{
                    data: Object.values(metrics.statusCodes),
                    backgroundColor: Object.keys(metrics.statusCodes).map(code => 
                        statusCodeColors[code] || '#a0aec0'
                    ),
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    </script>
</body>
</html>`;
}

// CLI functionality
if (require.main === module) {
    const args = process.argv.slice(2);
    const resultsFile = args[0] || 'results.json';
    const outputFile = args[1] || 'custom-report.html';
    
    try {
        const metrics = generateCustomReport(resultsFile, outputFile);
        console.log('\n📈 Report Summary:');
        console.log(`   Total Requests: ${metrics.summary.requestsCompleted || 0}`);
        console.log(`   Average Response Time: ${Math.round(metrics.summary.responseTime?.mean || 0)}ms`);
        console.log(`   95th Percentile: ${Math.round(metrics.summary.responseTime?.p95 || 0)}ms`);
        console.log(`   Status Codes: ${Object.keys(metrics.statusCodes).join(', ')}`);
    } catch (error) {
        console.error('❌ Failed to generate report:', error.message);
        process.exit(1);
    }
}

module.exports = { generateCustomReport, extractMetrics };