const fs = require('fs');
const path = require('path');

/**
 * Simple script to open the generated report in the default browser
 */

function openReport(reportFile = 'custom-report.html') {
    const reportPath = path.resolve(reportFile);
    
    if (!fs.existsSync(reportPath)) {
        console.error(`❌ Report file not found: ${reportPath}`);
        console.log('💡 Run: npm run generate-report first');
        process.exit(1);
    }
    
    const { exec } = require('child_process');
    const platform = process.platform;
    
    let command;
    switch (platform) {
        case 'win32':
            command = `start "${reportPath}"`;
            break;
        case 'darwin':
            command = `open "${reportPath}"`;
            break;
        case 'linux':
            command = `xdg-open "${reportPath}"`;
            break;
        default:
            console.log(`📁 Report generated at: ${reportPath}`);
            console.log('💡 Open this file in your browser to view the report');
            return;
    }
    
    exec(command, (error) => {
        if (error) {
            console.error(`❌ Failed to open report: ${error.message}`);
            console.log(`📁 Report location: ${reportPath}`);
        } else {
            console.log('🚀 Opening report in your default browser...');
        }
    });
}

// CLI functionality
if (require.main === module) {
    const reportFile = process.argv[2] || 'custom-report.html';
    openReport(reportFile);
}

module.exports = { openReport };