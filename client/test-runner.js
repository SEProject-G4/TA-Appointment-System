// Simple test runner to verify tests work
const { exec } = require('child_process');

console.log('Running frontend tests...');

exec('npm test', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error}`);
    return;
  }
  
  if (stderr) {
    console.error(`Stderr: ${stderr}`);
  }
  
  console.log(`Output: ${stdout}`);
});
