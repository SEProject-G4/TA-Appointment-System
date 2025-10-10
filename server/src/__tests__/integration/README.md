# Integration Tests for TA Appointment System

This directory contains comprehensive integration tests for the TA Appointment System backend. These tests verify the complete functionality across all user roles and workflows.

## Test Structure

### Test Files

1. **`authRoutes.test.js`** - Authentication and session management tests
   - Google OAuth login/logout flows
   - Session persistence and validation
   - Role-based authentication
   - Error handling for invalid credentials

2. **`adminRoutes.test.js`** - Admin role functionality tests
   - User management (create, read, update, delete users)
   - Recruitment series management
   - Module management
   - User group administration

3. **`lecturerRoutes.test.js`** - Lecturer role functionality tests
   - Module coordination and editing
   - TA application review and processing
   - Application acceptance/rejection workflows
   - Module status management

4. **`taRoutes.test.js`** - TA (undergraduate/postgraduate) functionality tests
   - Available position browsing
   - Application submission
   - Document submission
   - Application status tracking

5. **`cseOfficeRoutes.test.js`** - CSE Office role functionality tests
   - Document verification workflows
   - Bulk document processing
   - Document approval/rejection
   - Statistics and reporting

6. **`errorScenarios.test.js`** - Comprehensive error handling tests
   - Authentication errors
   - Database connection failures
   - Request validation errors
   - Resource not found scenarios
   - Business logic errors
   - Concurrent access handling

7. **`crossRoleWorkflows.test.js`** - Multi-role workflow tests
   - Complete TA recruitment lifecycle
   - Data consistency across roles
   - Concurrent operations
   - Error propagation

### Test Runner

- **`integrationTestRunner.js`** - Centralized test runner with utilities
  - Automated test execution
  - Coverage analysis
  - Test reporting
  - Data generators for consistent testing

## User Roles Tested

### 1. Admin
- **User Management**: Create, read, update, delete users across all roles
- **Recruitment Series**: Create and manage recruitment campaigns
- **Module Management**: Add modules to recruitment series
- **System Administration**: Overview and statistics

### 2. Lecturer
- **Module Coordination**: View and edit assigned modules
- **TA Application Review**: Accept/reject TA applications
- **Module Status Management**: Update module requirements and status
- **TA Assignment Tracking**: Monitor accepted TAs and document status

### 3. Undergraduate/Postgraduate (TA)
- **Position Browsing**: View available TA positions
- **Application Submission**: Apply for TA positions with motivation and experience
- **Document Submission**: Submit required documents (CV, transcript, ID)
- **Status Tracking**: Monitor application and document status

### 4. CSE Office
- **Document Verification**: Review and approve/reject submitted documents
- **Bulk Processing**: Handle multiple document submissions
- **Quality Assurance**: Ensure compliance with requirements
- **Reporting**: Generate statistics and reports

### 5. HOD (Head of Department)
- **Oversight**: High-level monitoring and approval
- **Policy Enforcement**: Ensure compliance with department policies

## Test Scenarios Covered

### Authentication & Authorization
- ✅ Valid login/logout flows
- ✅ Session management and persistence
- ✅ Role-based access control
- ✅ Invalid credential handling
- ✅ Session timeout scenarios

### User Management
- ✅ User creation with validation
- ✅ Role assignment and updates
- ✅ User group management
- ✅ Duplicate prevention
- ✅ Data integrity checks

### Module Management
- ✅ Module creation and configuration
- ✅ Coordinator assignment
- ✅ Status transitions
- ✅ Requirement updates
- ✅ TA count management

### TA Application Workflow
- ✅ Application submission with validation
- ✅ Duplicate application prevention
- ✅ Quota management
- ✅ Application review process
- ✅ Acceptance/rejection workflows

### Document Management
- ✅ Document submission and validation
- ✅ File format verification
- ✅ Document verification workflows
- ✅ Bulk processing capabilities
- ✅ Status tracking

### Error Handling
- ✅ Database connection failures
- ✅ Validation errors
- ✅ Resource not found scenarios
- ✅ Concurrent access handling
- ✅ Business logic violations

### Cross-Role Integration
- ✅ Complete recruitment lifecycle
- ✅ Data consistency maintenance
- ✅ Workflow handoffs between roles
- ✅ Error propagation
- ✅ State synchronization

## Running the Tests

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (running locally or accessible)
- Jest testing framework
- All project dependencies installed

### Basic Test Execution
```bash
# Run all integration tests
npm run test:integration

# Run specific test suite
npx jest authRoutes.test.js

# Run with coverage
npx jest --coverage --testPathPattern=integration

# Run with verbose output
npx jest --verbose --testPathPattern=integration
```

### Using the Test Runner
```bash
# Run all tests with the custom runner
node src/__tests__/integration/integrationTestRunner.js

# Run with coverage analysis
node src/__tests__/integration/integrationTestRunner.js --coverage
```

### Environment Setup
```bash
# Set test environment variables
export NODE_ENV=test
export MONGODB_URI=mongodb://localhost:27017/ta-appointment-test
export SESSION_SECRET=test-session-secret
```

## Test Data

The tests use mock data generated by the `TestDataGenerator` class, which provides:
- Consistent test user data across roles
- Realistic module and application data
- Document submission data
- Edge case scenarios

## Mocking Strategy

### Database Models
- All database models are mocked using Jest
- Mock implementations return realistic data structures
- Error scenarios are simulated through mock rejections

### External Services
- Google OAuth is mocked for authentication tests
- File storage services are mocked for document tests
- Email services are mocked where applicable

### Middleware
- Authentication middleware is mocked to inject test users
- Authorization middleware is mocked for role-based testing

## Coverage Requirements

The integration tests aim for:
- **Statements**: 80% coverage
- **Branches**: 75% coverage
- **Functions**: 80% coverage
- **Lines**: 80% coverage

## Best Practices

### Test Organization
- Each test file focuses on a specific role or functionality
- Tests are organized by user stories and workflows
- Clear test descriptions and assertions

### Data Management
- Tests use consistent mock data generators
- Clean setup and teardown for each test
- Isolated test data to prevent interference

### Error Testing
- Comprehensive error scenario coverage
- Edge case validation
- Boundary condition testing

### Performance
- Tests run within reasonable timeouts
- Efficient mock implementations
- Minimal external dependencies

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Ensure MongoDB is running
   - Check connection string configuration
   - Verify network accessibility

2. **Mock Failures**
   - Check mock implementations
   - Verify mock call expectations
   - Ensure proper mock cleanup

3. **Timeout Issues**
   - Increase timeout values for slow operations
   - Check for hanging promises
   - Verify async/await usage

4. **Coverage Issues**
   - Ensure all code paths are tested
   - Add tests for error scenarios
   - Verify mock coverage

### Debug Mode
```bash
# Run tests with debug output
DEBUG=* npx jest --testPathPattern=integration

# Run single test with debug
npx jest authRoutes.test.js --verbose
```

## Contributing

When adding new integration tests:

1. Follow the existing test structure and naming conventions
2. Use the `TestDataGenerator` for consistent test data
3. Include both positive and negative test cases
4. Add appropriate error handling tests
5. Update this README with new test scenarios
6. Ensure tests pass in isolation and as part of the full suite

## Maintenance

- Regularly update test data to reflect system changes
- Review and update mock implementations as needed
- Monitor test execution times and optimize as necessary
- Keep test coverage requirements up to date
- Document new test scenarios and edge cases
