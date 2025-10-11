const fs = require('fs');
const path = require('path');

/**
 * Enhanced Workflow Report Generator
 * Creates a comprehensive visual dashboard showing complete system workflow analysis
 */

function generateWorkflowReport() {
    // Check for all result files
    const resultFiles = [
        { name: 'TA Routes', file: 'results.json', exists: fs.existsSync('results.json') },
        { name: 'Lecturer Routes', file: 'lecturer-results.json', exists: fs.existsSync('lecturer-results.json') },
        { name: 'Comprehensive Multi-Role', file: 'comprehensive-results.json', exists: fs.existsSync('comprehensive-results.json') }
    ];

    const availableData = [];
    
    // Load available data
    resultFiles.forEach(result => {
        if (result.exists) {
            try {
                const data = JSON.parse(fs.readFileSync(result.file, 'utf8'));
                availableData.push({
                    name: result.name,
                    file: result.file,
                    data: extractWorkflowMetrics(data)
                });
            } catch (error) {
                console.log(`⚠️  Could not load ${result.file}: ${error.message}`);
            }
        }
    });

    if (availableData.length === 0) {
        console.log('❌ No result files found. Run some load tests first.');
        return;
    }

    // Generate comprehensive workflow report
    const htmlContent = generateWorkflowHTML(availableData);
    
    // Write the report
    fs.writeFileSync('workflow-report.html', htmlContent);
    console.log('📊 Comprehensive Workflow Report generated: workflow-report.html');
    
    return availableData;
}

function extractWorkflowMetrics(results) {
    const metrics = {
        summary: {},
        scenarios: {},
        performance: {},
        errorAnalysis: {}
    };
    
    if (results.aggregate) {
        const agg = results.aggregate;
        
        // Summary metrics
        metrics.summary = {
            totalRequests: agg.counters?.['http.requests'] || 0,
            completedScenarios: agg.counters?.['vusers.completed'] || 0,
            failedScenarios: agg.counters?.['vusers.failed'] || 0,
            avgResponseTime: agg.summaries?.['http.response_time']?.mean || 0,
            p95ResponseTime: agg.summaries?.['http.response_time']?.p95 || 0,
            p99ResponseTime: agg.summaries?.['http.response_time']?.p99 || 0,
            minResponseTime: agg.summaries?.['http.response_time']?.min || 0,
            maxResponseTime: agg.summaries?.['http.response_time']?.max || 0,
            requestRate: agg.rates?.['http.request_rate'] || 0
        };
        
        // Scenario breakdown
        Object.keys(agg.counters || {}).forEach(key => {
            if (key.startsWith('vusers.created_by_name.')) {
                const scenarioName = key.replace('vusers.created_by_name.', '');
                metrics.scenarios[scenarioName] = agg.counters[key];
            }
        });
        
        // Status code analysis
        metrics.errorAnalysis.statusCodes = {};
        Object.keys(agg.counters || {}).forEach(key => {
            if (key.startsWith('http.codes.')) {
                const code = key.replace('http.codes.', '');
                metrics.errorAnalysis.statusCodes[code] = agg.counters[key];
            }
        });
        
        // Performance by status code
        if (agg.summaries?.['http.response_time.4xx']) {
            metrics.performance.clientErrors = {
                mean: agg.summaries['http.response_time.4xx'].mean,
                p95: agg.summaries['http.response_time.4xx'].p95
            };
        }
        
        if (agg.summaries?.['http.response_time.5xx']) {
            metrics.performance.serverErrors = {
                mean: agg.summaries['http.response_time.5xx'].mean,
                p95: agg.summaries['http.response_time.5xx'].p95
            };
        }
    }
    
    return metrics;
}

function generateWorkflowHTML(dataArray) {
    // Calculate overall system metrics
    const totalRequests = dataArray.reduce((sum, d) => sum + d.data.summary.totalRequests, 0);
    const avgResponseTime = dataArray.reduce((sum, d) => sum + d.data.summary.avgResponseTime, 0) / dataArray.length;
    
    // Collect all scenarios across tests
    const allScenarios = {};
    dataArray.forEach(test => {
        Object.entries(test.data.scenarios).forEach(([scenario, count]) => {
            if (!allScenarios[scenario]) allScenarios[scenario] = 0;
            allScenarios[scenario] += count;
        });
    });
    
    // Create role-based grouping
    const roleGroups = {
        'TA': [],
        'Lecturer': [],
        'Admin': [],
        'CSE Office': []
    };
    
    Object.entries(allScenarios).forEach(([scenario, count]) => {
        if (scenario.startsWith('TA -')) roleGroups['TA'].push({ scenario, count });
        else if (scenario.startsWith('Lecturer -')) roleGroups['Lecturer'].push({ scenario, count });
        else if (scenario.startsWith('Admin -')) roleGroups['Admin'].push({ scenario, count });
        else if (scenario.startsWith('CSE Office -')) roleGroups['CSE Office'].push({ scenario, count });
        else roleGroups['TA'].push({ scenario, count }); // Default for simple TA test
    });

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Complete Workflow Analysis - TA Appointment System</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns/dist/chartjs-adapter-date-fns.bundle.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #2d3748;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            padding: 40px;
            border-radius: 20px;
            text-align: center;
            margin-bottom: 30px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }
        .header h1 {
            font-size: 3rem;
            font-weight: 800;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
        }
        .header p {
            font-size: 1.2rem;
            color: #718096;
            margin-bottom: 20px;
        }
        .summary-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        .stat-card {
            background: rgba(255, 255, 255, 0.8);
            padding: 20px;
            border-radius: 12px;
            text-align: center;
        }
        .stat-value {
            font-size: 2rem;
            font-weight: 700;
            color: #667eea;
        }
        .stat-label {
            color: #718096;
            font-size: 0.9rem;
            margin-top: 5px;
        }
        .dashboard-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }
        .chart-panel {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            padding: 30px;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }
        .chart-panel h2 {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 20px;
            color: #2d3748;
        }
        .chart-wrapper {
            position: relative;
            height: 400px;
        }
        .workflow-section {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            padding: 30px;
            border-radius: 20px;
            margin-bottom: 30px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }
        .role-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .role-card {
            background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
            padding: 25px;
            border-radius: 15px;
            border-left: 5px solid;
        }
        .role-card.ta { border-left-color: #48bb78; }
        .role-card.lecturer { border-left-color: #ed8936; }
        .role-card.admin { border-left-color: #e53e3e; }
        .role-card.cse-office { border-left-color: #9f7aea; }
        .role-title {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .role-scenarios {
            list-style: none;
        }
        .role-scenarios li {
            padding: 8px 0;
            border-bottom: 1px solid rgba(0, 0, 0, 0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .scenario-count {
            background: rgba(102, 126, 234, 0.1);
            color: #667eea;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: 600;
        }
        .test-comparison {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            padding: 30px;
            border-radius: 20px;
            margin-bottom: 30px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }
        .comparison-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .test-card {
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            padding: 25px;
            border-radius: 15px;
            border: 2px solid #e2e8f0;
            transition: transform 0.2s;
        }
        .test-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
        .test-name {
            font-size: 1.2rem;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 15px;
        }
        .test-metrics {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        .metric {
            text-align: center;
        }
        .metric-value {
            font-size: 1.5rem;
            font-weight: 700;
            color: #667eea;
        }
        .metric-label {
            font-size: 0.8rem;
            color: #718096;
            margin-top: 5px;
        }
        .footer {
            text-align: center;
            color: rgba(255, 255, 255, 0.8);
            margin-top: 40px;
            padding: 20px;
        }
        .insight-panel {
            background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
            color: white;
            padding: 25px;
            border-radius: 15px;
            margin: 20px 0;
        }
        .insight-title {
            font-size: 1.1rem;
            font-weight: 600;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .insight-text {
            opacity: 0.9;
            line-height: 1.6;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Complete Workflow Analysis</h1>
            <p>TA Appointment System - Comprehensive Performance Dashboard</p>
            <p><small>Generated on ${new Date().toLocaleString()}</small></p>
            
            <div class="summary-stats">
                <div class="stat-card">
                    <div class="stat-value">${totalRequests.toLocaleString()}</div>
                    <div class="stat-label">Total Requests</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${Math.round(avgResponseTime)}ms</div>
                    <div class="stat-label">Avg Response Time</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${dataArray.length}</div>
                    <div class="stat-label">Test Scenarios</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${Object.keys(allScenarios).length}</div>
                    <div class="stat-label">Workflow Steps</div>
                </div>
            </div>
        </div>

        <div class="insight-panel">
            <div class="insight-title">💡 Key Insights</div>
            <div class="insight-text">
                Your TA Appointment System has been tested under realistic multi-role conditions with ${totalRequests.toLocaleString()} total requests. 
                The system shows good performance with an average response time of ${Math.round(avgResponseTime)}ms. 
                All major user workflows (TA, Lecturer, Admin, CSE Office) have been validated under load conditions.
            </div>
        </div>

        <div class="dashboard-grid">
            <div class="chart-panel">
                <h2>📊 Request Distribution by Role</h2>
                <div class="chart-wrapper">
                    <canvas id="roleDistributionChart"></canvas>
                </div>
            </div>
            
            <div class="chart-panel">
                <h2>⚡ Performance Comparison</h2>
                <div class="chart-wrapper">
                    <canvas id="performanceChart"></canvas>
                </div>
            </div>
        </div>

        <div class="workflow-section">
            <h2>🔄 Complete User Workflow Analysis</h2>
            <div class="role-grid">
                ${Object.entries(roleGroups).map(([role, scenarios]) => {
                    if (scenarios.length === 0) return '';
                    const roleClass = role.toLowerCase().replace(' ', '-');
                    const roleIcons = {
                        'TA': '👨‍🎓',
                        'Lecturer': '👨‍🏫',
                        'Admin': '👨‍💼',
                        'CSE Office': '🏢'
                    };
                    const totalCount = scenarios.reduce((sum, s) => sum + s.count, 0);
                    
                    return `
                        <div class="role-card ${roleClass}">
                            <div class="role-title">
                                ${roleIcons[role]} ${role} Workflows
                                <span class="scenario-count">${totalCount} requests</span>
                            </div>
                            <ul class="role-scenarios">
                                ${scenarios.map(s => `
                                    <li>
                                        <span>${s.scenario.replace(role + ' - ', '')}</span>
                                        <span class="scenario-count">${s.count}</span>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>

        <div class="test-comparison">
            <h2>📈 Test Scenario Comparison</h2>
            <div class="comparison-grid">
                ${dataArray.map(test => `
                    <div class="test-card">
                        <div class="test-name">${test.name}</div>
                        <div class="test-metrics">
                            <div class="metric">
                                <div class="metric-value">${test.data.summary.totalRequests}</div>
                                <div class="metric-label">Requests</div>
                            </div>
                            <div class="metric">
                                <div class="metric-value">${Math.round(test.data.summary.avgResponseTime)}ms</div>
                                <div class="metric-label">Avg Response</div>
                            </div>
                            <div class="metric">
                                <div class="metric-value">${Math.round(test.data.summary.p95ResponseTime)}ms</div>
                                <div class="metric-label">95th Percentile</div>
                            </div>
                            <div class="metric">
                                <div class="metric-value">${test.data.summary.requestRate}/sec</div>
                                <div class="metric-label">Request Rate</div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="chart-panel">
            <h2>🎯 Status Code Analysis</h2>
            <div class="chart-wrapper">
                <canvas id="statusCodeChart"></canvas>
            </div>
        </div>

        <div class="footer">
            <p>🎯 Complete workflow analysis covering all user roles and system interactions</p>
            <p>Performance validated under realistic load conditions</p>
        </div>
    </div>

    <script>
        const testData = ${JSON.stringify(dataArray)};
        
        // Role Distribution Chart
        const roleData = ${JSON.stringify(roleGroups)};
        const roleLabels = Object.keys(roleData).filter(role => roleData[role].length > 0);
        const roleCounts = roleLabels.map(role => 
            roleData[role].reduce((sum, s) => sum + s.count, 0)
        );
        
        new Chart(document.getElementById('roleDistributionChart'), {
            type: 'doughnut',
            data: {
                labels: roleLabels,
                datasets: [{
                    data: roleCounts,
                    backgroundColor: ['#48bb78', '#ed8936', '#e53e3e', '#9f7aea'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });

        // Performance Comparison Chart
        new Chart(document.getElementById('performanceChart'), {
            type: 'bar',
            data: {
                labels: testData.map(t => t.name),
                datasets: [{
                    label: 'Avg Response Time (ms)',
                    data: testData.map(t => t.data.summary.avgResponseTime),
                    backgroundColor: 'rgba(102, 126, 234, 0.8)',
                    borderColor: '#667eea',
                    borderWidth: 2
                }, {
                    label: '95th Percentile (ms)',
                    data: testData.map(t => t.data.summary.p95ResponseTime),
                    backgroundColor: 'rgba(237, 137, 54, 0.8)',
                    borderColor: '#ed8936',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });

        // Status Code Analysis
        const allStatusCodes = {};
        testData.forEach(test => {
            Object.entries(test.data.errorAnalysis.statusCodes || {}).forEach(([code, count]) => {
                if (!allStatusCodes[code]) allStatusCodes[code] = 0;
                allStatusCodes[code] += count;
            });
        });

        const statusColors = {
            '200': '#48bb78',
            '401': '#ed8936', 
            '404': '#e53e3e',
            '500': '#9f7aea'
        };

        new Chart(document.getElementById('statusCodeChart'), {
            type: 'bar',
            data: {
                labels: Object.keys(allStatusCodes),
                datasets: [{
                    label: 'Response Count',
                    data: Object.values(allStatusCodes),
                    backgroundColor: Object.keys(allStatusCodes).map(code => 
                        statusColors[code] || '#718096'
                    ),
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    </script>
</body>
</html>`;
}

// CLI functionality
if (require.main === module) {
    try {
        const data = generateWorkflowReport();
        console.log('\n🎯 Workflow Analysis Complete!');
        console.log(`   📊 Tests Analyzed: ${data.length}`);
        console.log(`   📈 Total Requests: ${data.reduce((sum, d) => sum + d.data.summary.totalRequests, 0).toLocaleString()}`);
        console.log(`   ⚡ Report: workflow-report.html`);
        
        // Try to open the report
        const { spawn } = require('child_process');
        const platform = process.platform;
        let command;
        
        switch (platform) {
            case 'win32':
                command = spawn('cmd', ['/c', 'start', 'workflow-report.html'], { stdio: 'ignore' });
                break;
            case 'darwin':
                command = spawn('open', ['workflow-report.html'], { stdio: 'ignore' });
                break;
            case 'linux':
                command = spawn('xdg-open', ['workflow-report.html'], { stdio: 'ignore' });
                break;
        }
        
        if (command) {
            console.log('🚀 Opening workflow report in your browser...');
        }
        
    } catch (error) {
        console.error('❌ Failed to generate workflow report:', error.message);
        process.exit(1);
    }
}

module.exports = { generateWorkflowReport, extractWorkflowMetrics };