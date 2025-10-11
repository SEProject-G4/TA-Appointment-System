#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Comprehensive Load Test Runner
 * Runs all role-based tests and generates comparison reports
 */

const tests = [
    {
        name: 'TA Routes',
        script: 'load-test-simple',
        config: 'artillery-simple.yml',
        results: 'results.json',
        report: 'ta-report.html'
    },
    {
        name: 'Lecturer Routes',
        script: 'load-test-lecturer',
        config: 'artillery-lecturer.yml',
        results: 'lecturer-results.json',
        report: 'lecturer-report.html'
    },
    {
        name: 'Admin Routes',
        script: 'load-test-admin',
        config: 'artillery-admin.yml',
        results: 'admin-results.json',
        report: 'admin-report.html'
    },
    {
        name: 'CSE Office Routes',
        script: 'load-test-cse-office',
        config: 'artillery-cse-office.yml',
        results: 'cse-office-results.json',
        report: 'cse-office-report.html'
    },
    {
        name: 'Comprehensive Multi-Role',
        script: 'load-test-comprehensive',
        config: 'artillery-comprehensive.yml',
        results: 'comprehensive-results.json',
        report: 'comprehensive-report.html'
    }
];

async function runCommand(command, args = []) {
    return new Promise((resolve, reject) => {
        console.log(`🚀 Running: ${command} ${args.join(' ')}`);
        
        const process = spawn(command, args, {
            stdio: 'pipe',
            shell: true,
            cwd: path.resolve('.')
        });
        
        let output = '';
        let errorOutput = '';
        
        process.stdout.on('data', (data) => {
            const text = data.toString();
            output += text;
            // Show real-time progress for Artillery
            if (text.includes('Summary report') || text.includes('All VUs finished')) {
                console.log('✅ Test completed successfully');
            }
        });
        
        process.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });
        
        process.on('close', (code) => {
            if (code === 0) {
                resolve({ output, errorOutput });
            } else {
                reject(new Error(`Command failed with code ${code}: ${errorOutput}`));
            }
        });
        
        process.on('error', (error) => {
            reject(error);
        });
    });
}

async function runTest(test) {
    console.log(`\n🎯 Starting ${test.name} Load Test...`);
    console.log(`   Config: ${test.config}`);
    console.log(`   Results: ${test.results}`);
    
    try {
        // Run the load test
        await runCommand('npm', ['run', test.script]);
        
        // Generate report if results exist
        if (fs.existsSync(test.results)) {
            console.log(`📊 Generating report: ${test.report}`);
            await runCommand('node', [
                'tests/load/report-generator.js',
                test.results,
                test.report
            ]);
            console.log(`✅ ${test.name} completed successfully`);
            return true;
        } else {
            console.log(`⚠️  Results file not found: ${test.results}`);
            return false;
        }
    } catch (error) {
        console.error(`❌ ${test.name} failed:`, error.message);
        return false;
    }
}

async function generateSummaryReport(results) {
    const summaryData = results.map(result => ({
        name: result.test.name,
        success: result.success,
        resultsFile: result.test.results,
        reportFile: result.test.report
    }));
    
    const summaryHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Load Test Summary - All Roles</title>
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
        .test-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .test-card {
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
            border: 1px solid #e2e8f0;
            position: relative;
        }
        .test-card.success {
            border-left: 5px solid #48bb78;
        }
        .test-card.failed {
            border-left: 5px solid #f56565;
        }
        .test-name {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 10px;
            color: #2d3748;
        }
        .test-status {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.875rem;
            font-weight: 500;
            margin-bottom: 15px;
        }
        .status-success {
            background-color: #c6f6d5;
            color: #22543d;
        }
        .status-failed {
            background-color: #fed7d7;
            color: #742a2a;
        }
        .test-links {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        .test-link {
            padding: 8px 16px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-size: 0.875rem;
            transition: background-color 0.2s;
        }
        .test-link:hover {
            background: #5a67d8;
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
            <h1>🚀 Load Test Summary</h1>
            <p>Comprehensive Performance Testing Results</p>
            <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="test-grid">
            ${summaryData.map(test => `
                <div class="test-card ${test.success ? 'success' : 'failed'}">
                    <div class="test-name">${test.name}</div>
                    <div class="test-status ${test.success ? 'status-success' : 'status-failed'}">
                        ${test.success ? '✅ Completed' : '❌ Failed'}
                    </div>
                    ${test.success ? `
                        <div class="test-links">
                            <a href="${test.reportFile}" class="test-link">📊 View Report</a>
                            <a href="${test.resultsFile}" class="test-link">📄 Raw Results</a>
                        </div>
                    ` : '<p>Test execution failed. Check console logs for details.</p>'}
                </div>
            `).join('')}
        </div>
        
        <div class="footer">
            <p>Total Tests: ${summaryData.length} | 
               Successful: ${summaryData.filter(t => t.success).length} | 
               Failed: ${summaryData.filter(t => !t.success).length}</p>
        </div>
    </div>
</body>
</html>`;
    
    fs.writeFileSync('load-test-summary.html', summaryHtml);
    console.log('\n📋 Summary report generated: load-test-summary.html');
}

async function main() {
    console.log('🎯 Starting Comprehensive Load Test Suite');
    console.log('=' .repeat(50));
    
    const results = [];
    let successCount = 0;
    
    // Run each test
    for (const test of tests) {
        const success = await runTest(test);
        results.push({ test, success });
        if (success) successCount++;
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Generate summary report
    await generateSummaryReport(results);
    
    console.log('\n' + '=' .repeat(50));
    console.log(`🎉 Load Test Suite Complete!`);
    console.log(`   Total Tests: ${tests.length}`);
    console.log(`   Successful: ${successCount}`);
    console.log(`   Failed: ${tests.length - successCount}`);
    console.log(`   Summary: load-test-summary.html`);
    
    // Open summary report
    try {
        await runCommand('node', ['tests/load/open-report.js', 'load-test-summary.html']);
    } catch (error) {
        console.log('💡 Open load-test-summary.html in your browser to view results');
    }
}

// CLI usage
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Test suite failed:', error.message);
        process.exit(1);
    });
}

module.exports = { runTest, generateSummaryReport };