# 🚀 Load Testing Setup

This directory contains comprehensive load testing configuration for the TA Appointment System using Artillery.

## 📋 Overview

Artillery is a modern load testing framework that helps you test the performance and reliability of your APIs under various load conditions.

## 🏗️ Files Structure

```
tests/load/
├── artillery-basic.yml           # Basic connectivity test (10s, 1 req/s)
├── artillery-simple.yml          # Simple API test (60s, 5 req/s)
├── artillery-load-test.yml       # Comprehensive load test (multi-phase)
├── report-generator.js           # Custom interactive report generator
├── open-report.js               # Report viewer utility
└── README.md                    # This file
```

## 🎯 Test Scenarios

### 1. Basic Test (`artillery-basic.yml`)
- **Duration**: 10 seconds
- **Rate**: 1 request per second
- **Purpose**: Verify server connectivity and basic functionality
- **Usage**: `npm run load-test-basic`

### 2. Simple Test (`artillery-simple.yml`)
- **Duration**: 60 seconds
- **Rate**: 5 requests per second
- **Endpoint**: `/api/ta/requests`
- **Purpose**: Standard API load testing
- **Usage**: `npm run load-test-simple`

### 3. Comprehensive Test (`artillery-load-test.yml`)
- **Phases**: 
  - Warm-up: 30s ramp-up to 5 req/s
  - Load: 120s sustained at 10 req/s
  - Spike: 30s spike to 20 req/s
- **Scenarios**: Multiple weighted scenarios testing different endpoints
- **Purpose**: Production-ready load testing
- **Usage**: `npm run load-test`

### 4. Lecturer Routes Test (`artillery-lecturer.yml`)
- **Duration**: 120 seconds total (30s warm-up, 60s load, 30s spike)
- **Rate**: 2-10 requests per second
- **Endpoints**: Lecturer dashboard, TA applications, module management
- **Purpose**: Test lecturer-specific functionality
- **Usage**: `npm run load-test-lecturer`

### 5. Admin Routes Test (`artillery-admin.yml`)
- **Duration**: 150 seconds total (30s warm-up, 90s steady, 30s peak)
- **Rate**: 2-8 requests per second
- **Endpoints**: Module management, recruitment series, user groups
- **Purpose**: Test admin functionality and management operations
- **Usage**: `npm run load-test-admin`

### 6. CSE Office Routes Test (`artillery-cse-office.yml`)
- **Duration**: 100 seconds total (20s warm-up, 60s load, 20s peak)
- **Rate**: 1-6 requests per second
- **Endpoints**: Document management and viewing
- **Purpose**: Test CSE office specific operations
- **Usage**: `npm run load-test-cse-office`

### 7. Multi-Role Comprehensive Test (`artillery-comprehensive.yml`)
- **Duration**: 210 seconds total (45s warm-up, 120s load, 45s stress)
- **Rate**: 3-15 requests per second
- **Scenarios**: All roles with realistic traffic distribution
  - TA Routes: 30% of traffic
  - Lecturer Routes: 35% of traffic
  - Admin Routes: 30% of traffic
  - CSE Office Routes: 5% of traffic
- **Purpose**: Production-like multi-user testing
- **Usage**: `npm run load-test-comprehensive`

## 📊 Reports and Visualization

### Built-in Artillery Report
```bash
# Basic HTML report (deprecated but functional)
npx artillery report results.json
```

### Custom Interactive Report
```bash
# Generate custom report with charts
npm run generate-report

# View report in browser
npm run view-report

# Complete workflow: test + report + view
npm run test-and-report
```

### Report Features
- 📈 **Interactive Charts**: Response time trends, request rates
- 📊 **Key Metrics**: Average, 95th percentile, min/max response times
- 🎯 **Status Code Analysis**: Visual breakdown of HTTP responses
- 📱 **Responsive Design**: Works on desktop and mobile
- 🎨 **Modern UI**: Clean, professional dashboard

## 🚦 Getting Started

### Prerequisites
```bash
# Install Artillery (already in devDependencies)
npm install
```

### Quick Start
```bash
# 1. Start your server
npm start

# 2. Run a simple load test
npm run load-test-simple

# 3. Generate and view report
npm run generate-report
npm run view-report
```

### Role-Specific Testing
```bash
# Test specific user roles
npm run load-test-lecturer
npm run load-test-admin
npm run load-test-cse-office

# Generate role-specific reports
npm run generate-lecturer-report
npm run generate-admin-report
```

### Comprehensive Testing
```bash
# Run all tests at once with summary report
npm run load-test-suite

# Or run comprehensive multi-role test
npm run test-all-roles
```

### Full Workflow
```bash
# Run test, generate report, and open in browser (all in one)
npm run test-and-report
```

## 📈 Understanding Results

### Key Metrics
- **Virtual Users (VU)**: Simulated concurrent users
- **Response Time**: Time taken for server to respond
  - **Mean**: Average response time
  - **P95**: 95% of requests completed within this time
  - **P99**: 99% of requests completed within this time
- **Request Rate**: Requests processed per second
- **Status Codes**: HTTP response status distribution

### Performance Benchmarks
- **Good**: Average response time < 200ms, P95 < 500ms
- **Acceptable**: Average < 500ms, P95 < 1000ms
- **Poor**: Average > 1000ms, P95 > 2000ms

### Common Issues
- **500 Status Codes**: Usually authentication/database issues
- **High Response Times**: Server overload or database bottlenecks
- **Failed Requests**: Network issues or server crashes

## 🔧 Customization

### Adding New Test Scenarios
Edit the YAML files to add new scenarios:

```yaml
scenarios:
  - name: "Custom Test"
    weight: 10
    flow:
      - get:
          url: "/api/custom/endpoint"
          headers:
            Authorization: "Bearer {{ token }}"
```

### Modifying Load Patterns
Adjust phases in the configuration:

```yaml
phases:
  - duration: 60    # seconds
    arrivalRate: 5  # requests per second
    name: "Custom Phase"
```

### Environment Variables
Use Artillery's built-in variables:

```yaml
config:
  target: "{{ $processEnvironment.SERVER_URL }}"
  variables:
    apiKey: "{{ $processEnvironment.API_KEY }}"
```

## 🐛 Troubleshooting

### Server Not Responding
```bash
# Check if server is running
curl http://localhost:5000/

# Start server if needed
npm start
```

### High Error Rates
1. Check server logs for errors
2. Verify database connectivity
3. Ensure sufficient server resources
4. Check rate limiting settings

### Report Generation Issues
```bash
# Check if results.json exists
ls -la results.json

# Manually run report generator with debug
node tests/load/report-generator.js results.json debug-report.html
```

## 📚 Resources

- [Artillery Documentation](https://www.artillery.io/docs)
- [Artillery Cloud Platform](https://app.artillery.io)
- [Performance Testing Best Practices](https://www.artillery.io/docs/guides/guides/performance-testing-best-practices)
- [API Load Testing Guide](https://www.artillery.io/docs/guides/guides/api-load-testing)

## 🤝 Contributing

When adding new load tests:
1. Create descriptive test names
2. Use appropriate load levels
3. Document expected outcomes
4. Include error handling scenarios
5. Update this README

## 📝 Notes

- Artillery 2.0+ requires `flow:` syntax instead of legacy format
- Built-in report command is deprecated (still works but shows warning)
- Custom report generator provides modern visualizations
- All tests output to `results.json` for consistency
- Consider using Artillery Cloud for advanced features

---

**Happy Load Testing! 🎯**