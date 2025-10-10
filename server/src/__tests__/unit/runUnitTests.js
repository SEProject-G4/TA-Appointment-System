const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Running Unit Tests for TA Appointment System');
console.log('================================================\n');

const testDirectories = [
  'config',
  'middleware', 
  'models',
  'routes',
  'services'
];

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

async function runTests() {
  for (const dir of testDirectories) {
    console.log(`📁 Testing ${dir.toUpperCase()}...`);
    console.log('─'.repeat(50));
    
    try {
      const testPath = path.join(__dirname, dir);
      const result = execSync(`npx jest ${testPath} --verbose --coverage`, {
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      console.log(result);
      passedTests++;
      
      // Extract test count from output
      const testMatch = result.match(/(\d+) tests?/);
      if (testMatch) {
        totalTests += parseInt(testMatch[1]);
      }
      
    } catch (error) {
      console.error(`❌ Tests failed for ${dir}:`);
      console.error(error.stdout || error.message);
      failedTests++;
    }
    
    console.log('\n');
  }
  
  // Summary
  console.log('📊 TEST SUMMARY');
  console.log('================');
  console.log(`Total test suites: ${testDirectories.length}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log(`Total tests: ${totalTests}`);
  
  if (failedTests > 0) {
    console.log('\n❌ Some tests failed. Please check the output above.');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
  }
}

runTests().catch(console.error);
