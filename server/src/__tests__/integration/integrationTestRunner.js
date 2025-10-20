/**
 * Integration Test Runner for TA Appointment System
 * 
 * This file provides utilities and configuration for running comprehensive
 * integration tests across all roles and workflows in the system.
 */

const { spawn } = require('child_process');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  // Test suites to run
  testSuites: [
    'authRoutes.test.js',
    'adminRoutes.test.js',
    'lecturerRoutes.test.js',
    'taRoutes.test.js',
    'cseOfficeRoutes.test.js',
    'errorScenarios.test.js',
    'crossRoleWorkflows.test.js'
  ],
  
  // Test environment setup
  environment: {
    NODE_ENV: 'test',
    MONGODB_URI: 'mongodb://localhost:27017/ta-appointment-integration-test',
    SESSION_SECRET: 'test-session-secret',
    PORT: 3001
  },
  
  // Test timeout settings
  timeouts: {
    individual: 30000,    // 30 seconds per test
    suite: 300000,        // 5 minutes per suite
    total: 1800000        // 30 minutes total
  },
  
  // Coverage requirements
  coverage: {
    statements: 80,
    branches: 75,
    functions: 80,
    lines: 80
  }
};

// Test utilities
class IntegrationTestRunner {
  constructor(config = TEST_CONFIG) {
    this.config = config;
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
      startTime: null,
      endTime: null,
      suites: []
    };
  }

  /**
   * Run all integration tests
   */
  async runAllTests() {
    console.log('🚀 Starting Integration Test Suite for TA Appointment System');
    console.log('=' .repeat(60));
    
    this.results.startTime = new Date();
    
    try {
      for (const testSuite of this.config.testSuites) {
        await this.runTestSuite(testSuite);
      }
      
      this.results.endTime = new Date();
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Test runner failed:', error);
      process.exit(1);
    }
  }

  /**
   * Run a single test suite
   */
  async runTestSuite(testSuite) {
    const suitePath = path.join(__dirname, testSuite);
    console.log(`\n📋 Running test suite: ${testSuite}`);
    console.log('-'.repeat(40));
    
    return new Promise((resolve, reject) => {
      const jestProcess = spawn('npx', [
        'jest',
        suitePath,
        '--verbose',
        '--timeout=' + this.config.timeouts.individual,
        '--detectOpenHandles',
        '--forceExit'
      ], {
        env: { ...process.env, ...this.config.environment },
        stdio: 'inherit'
      });

      jestProcess.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ ${testSuite} passed`);
          this.results.suites.push({ name: testSuite, status: 'passed', code });
        } else {
          console.log(`❌ ${testSuite} failed with code ${code}`);
          this.results.suites.push({ name: testSuite, status: 'failed', code });
        }
        resolve(code);
      });

      jestProcess.on('error', (error) => {
        console.error(`❌ Failed to run ${testSuite}:`, error);
        this.results.suites.push({ name: testSuite, status: 'error', error: error.message });
        reject(error);
      });

      // Timeout for individual suite
      setTimeout(() => {
        jestProcess.kill();
        console.log(`⏰ ${testSuite} timed out after ${this.config.timeouts.suite}ms`);
        this.results.suites.push({ name: testSuite, status: 'timeout' });
        resolve(1);
      }, this.config.timeouts.suite);
    });
  }

  /**
   * Run tests with coverage
   */
  async runTestsWithCoverage() {
    console.log('📊 Running tests with coverage analysis');
    
    const jestProcess = spawn('npx', [
      'jest',
      '--coverage',
      '--coverageDirectory=coverage/integration',
      '--coverageReporters=text',
      '--coverageReporters=html',
      '--coverageReporters=json',
      '--collectCoverageFrom=src/**/*.js',
      '--collectCoverageFrom=!src/**/*.test.js',
      '--collectCoverageFrom=!src/__tests__/**',
      '--testPathPattern=integration'
    ], {
      env: { ...process.env, ...this.config.environment },
      stdio: 'inherit'
    });

    return new Promise((resolve, reject) => {
      jestProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Coverage analysis completed');
        } else {
          console.log('❌ Coverage analysis failed');
        }
        resolve(code);
      });

      jestProcess.on('error', reject);
    });
  }

  /**
   * Generate test report
   */
  generateReport() {
    const duration = this.results.endTime - this.results.startTime;
    const passed = this.results.suites.filter(s => s.status === 'passed').length;
    const failed = this.results.suites.filter(s => s.status === 'failed' || s.status === 'error').length;
    const skipped = this.results.suites.filter(s => s.status === 'timeout').length;
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 INTEGRATION TEST REPORT');
    console.log('='.repeat(60));
    console.log(`⏱️  Duration: ${(duration / 1000).toFixed(2)}s`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`📊 Total: ${this.results.suites.length}`);
    
    console.log('\n📋 Test Suite Results:');
    console.log('-'.repeat(40));
    this.results.suites.forEach(suite => {
      const status = suite.status === 'passed' ? '✅' : 
                    suite.status === 'failed' ? '❌' : 
                    suite.status === 'error' ? '💥' : '⏰';
      console.log(`${status} ${suite.name}`);
    });

    if (failed > 0) {
      console.log('\n❌ Some tests failed. Please check the output above for details.');
      process.exit(1);
    } else {
      console.log('\n🎉 All integration tests passed!');
    }
  }

  /**
   * Clean up test environment
   */
  async cleanup() {
    console.log('\n🧹 Cleaning up test environment...');
    
    // Kill any remaining processes
    process.exit(0);
  }
}

// Test data generators for consistent testing
class TestDataGenerator {
  /**
   * Generate mock user data for testing
   */
  static generateUser(role = 'undergraduate', overrides = {}) {
    const baseUser = {
      _id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `Test ${role} User`,
      email: `test_${role}@example.com`,
      role: role,
      profilePicture: 'https://www.gravatar.com/avatar?d=mp',
      createdAt: new Date(),
      ...overrides
    };

    if (role === 'undergraduate' || role === 'postgraduate') {
      baseUser.indexNumber = `E/20/${Math.floor(Math.random() * 999).toString().padStart(3, '0')}`;
    }

    if (role === 'lecturer' || role === 'hod') {
      baseUser.displayName = `Dr. Test ${role}`;
    }

    return baseUser;
  }

  /**
   * Generate mock module data for testing
   */
  static generateModule(overrides = {}) {
    return {
      _id: `module_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      moduleCode: `CS${Math.floor(Math.random() * 999)}`,
      moduleName: 'Test Module',
      semester: 1,
      year: 2025,
      coordinators: ['lecturer123'],
      moduleStatus: 'pending changes',
      requiredTAHours: 8,
      requiredUndergraduateTACount: 2,
      requiredPostgraduateTACount: 1,
      undergraduateCounts: {
        required: 2,
        remaining: 2,
        applied: 0,
        reviewed: 0,
        accepted: 0,
        docSubmitted: 0,
        appointed: 0
      },
      postgraduateCounts: {
        required: 1,
        remaining: 1,
        applied: 0,
        reviewed: 0,
        accepted: 0,
        docSubmitted: 0,
        appointed: 0
      },
      requirements: 'Good programming skills',
      createdAt: new Date(),
      ...overrides
    };
  }

  /**
   * Generate mock TA application data for testing
   */
  static generateTAApplication(overrides = {}) {
    return {
      _id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: 'user123',
      moduleId: 'module123',
      status: 'pending',
      motivation: 'I am passionate about teaching programming',
      relevantExperience: 'I have tutored programming for 2 years',
      availability: 'Monday, Wednesday, Friday afternoons',
      createdAt: new Date(),
      ...overrides
    };
  }

  /**
   * Generate mock document submission data for testing
   */
  static generateDocumentSubmission(overrides = {}) {
    return {
      _id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: 'user123',
      documents: {
        cv: { submitted: true, url: 'cv.pdf', fileName: 'cv.pdf' },
        transcript: { submitted: true, url: 'transcript.pdf', fileName: 'transcript.pdf' },
        id: { submitted: true, url: 'id.pdf', fileName: 'id.pdf' }
      },
      status: 'submitted',
      submittedAt: new Date(),
      ...overrides
    };
  }
}

// Export for use in tests
module.exports = {
  IntegrationTestRunner,
  TestDataGenerator,
  TEST_CONFIG
};

// CLI runner
if (require.main === module) {
  const runner = new IntegrationTestRunner();
  
  // Handle cleanup on process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Test runner interrupted');
    runner.cleanup();
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Test runner terminated');
    runner.cleanup();
  });

  // Run tests
  runner.runAllTests().catch(error => {
    console.error('💥 Test runner crashed:', error);
    process.exit(1);
  });
}
