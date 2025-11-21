# Unit Tests Documentation

## Overview

This project includes comprehensive unit and integration tests covering all major components of the authentication system. The tests are written using Jest and Supertest.

## Test Structure

```
tests/
├── setup.js                          # Test configuration and setup
├── unit/                            # Unit tests
│   ├── controllers/
│   │   ├── authController.test.js   # Auth controller tests
│   │   └── userController.test.js   # User controller tests
│   ├── middleware/
│   │   ├── auth.test.js             # Auth middleware tests
│   │   └── validator.test.js        # Validator middleware tests
│   ├── models/
│   │   └── User.test.js             # User model tests
│   └── utils/
│       └── jwt.test.js              # JWT utility tests
└── integration/                      # Integration tests
    └── routes/
        ├── authRoutes.test.js       # Auth routes integration tests
        └── userRoutes.test.js       # User routes integration tests
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests with Coverage
```bash
npm test -- --coverage
```

### Run Specific Test File
```bash
npm test -- tests/unit/utils/jwt.test.js
```

### Run Tests in Watch Mode
```bash
npm test -- --watch
```

### Run Tests with Verbose Output
```bash
npm test -- --verbose
```

## Test Coverage

The test suite covers the following components:

### 1. JWT Utilities (`tests/unit/utils/jwt.test.js`)

**Coverage:**
- ✅ Token generation (access and refresh)
- ✅ Token verification
- ✅ Token expiration handling
- ✅ Invalid token handling
- ✅ Token pair generation

**Test Cases:** 15

### 2. Auth Middleware (`tests/unit/middleware/auth.test.js`)

**Coverage:**
- ✅ Token authentication
- ✅ Missing token handling
- ✅ Invalid token format handling
- ✅ Role-based access control (client, freelancer)
- ✅ Multiple role authorization

**Test Cases:** 14

### 3. Validator Middleware (`tests/unit/middleware/validator.test.js`)

**Coverage:**
- ✅ Signup validation rules
- ✅ Login validation rules
- ✅ Password reset validation
- ✅ Profile update validation
- ✅ Validation error handling

**Test Cases:** 8

### 4. User Model (`tests/unit/models/User.test.js`)

**Coverage:**
- ✅ Password hashing
- ✅ Password validation
- ✅ Public profile generation
- ✅ Sensitive data exclusion

**Test Cases:** 8

### 5. Auth Controller (`tests/unit/controllers/authController.test.js`)

**Coverage:**
- ✅ User signup (success and error cases)
- ✅ User login (success and error cases)
- ✅ Token refresh (success and error cases)
- ✅ User logout
- ✅ Email verification handling
- ✅ Deactivated account handling

**Test Cases:** 17

### 6. User Controller (`tests/unit/controllers/userController.test.js`)

**Coverage:**
- ✅ Get user profile
- ✅ Update user profile
- ✅ Deactivate account
- ✅ User not found scenarios
- ✅ Partial updates

**Test Cases:** 12

### 7. Auth Routes Integration (`tests/integration/routes/authRoutes.test.js`)

**Coverage:**
- ✅ POST /api/auth/signup
- ✅ POST /api/auth/login
- ✅ POST /api/auth/refresh
- ✅ POST /api/auth/logout
- ✅ Input validation
- ✅ Error responses

**Test Cases:** 11

### 8. User Routes Integration (`tests/integration/routes/userRoutes.test.js`)

**Coverage:**
- ✅ GET /api/users/me
- ✅ PUT /api/users/profile
- ✅ DELETE /api/users/account
- ✅ Authentication requirements
- ✅ Authorization checks

**Test Cases:** 11

## Total Test Count

**96 Test Cases** across all components

## Test Configuration

### Environment Variables (`.env.test`)

Tests use a separate test environment configuration:
- Separate test database
- Test JWT secrets
- Mock email service
- Test OAuth credentials

### Mock Strategy

Tests use Jest mocks for:
- Database operations (Sequelize models)
- Email service (Nodemailer)
- External APIs (Google OAuth)
- Cryptographic operations

### Coverage Goals

- **Statements:** > 80%
- **Branches:** > 75%
- **Functions:** > 80%
- **Lines:** > 80%

## Writing New Tests

### Unit Test Template

```javascript
const MyModule = require('../../../src/path/to/module');

// Mock dependencies
jest.mock('../../../src/dependencies');

describe('MyModule', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, user: null };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('myFunction', () => {
    it('should handle success case', async () => {
      // Arrange
      req.body = { data: 'test' };
      
      // Act
      await MyModule.myFunction(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });

    it('should handle error case', async () => {
      // Test implementation
    });
  });
});
```

### Integration Test Template

```javascript
const request = require('supertest');
const app = require('../../../src/app');
const Model = require('../../../src/models/Model');

jest.mock('../../../src/models/Model');

describe('API Endpoint Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/endpoint', () => {
    it('should return success response', async () => {
      Model.findAll.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/endpoint')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test -- --coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

## Common Testing Patterns

### 1. Testing Async Functions

```javascript
it('should handle async operation', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});
```

### 2. Testing Error Handling

```javascript
it('should throw error for invalid input', async () => {
  await expect(functionThatThrows()).rejects.toThrow('Error message');
});
```

### 3. Testing Middleware

```javascript
it('should call next on success', () => {
  middleware(req, res, next);
  expect(next).toHaveBeenCalled();
});
```

### 4. Testing HTTP Responses

```javascript
const response = await request(app)
  .post('/api/endpoint')
  .send(data)
  .expect(201);

expect(response.body).toHaveProperty('success', true);
```

## Troubleshooting

### Common Issues

1. **Tests failing due to environment variables**
   - Ensure `.env.test` is properly configured
   - Check that `tests/setup.js` is loading correctly

2. **Database connection errors**
   - Tests should mock database operations
   - Verify Sequelize mocks are properly configured

3. **Timeout errors**
   - Increase Jest timeout: `jest.setTimeout(10000)`
   - Check for unresolved promises

4. **Module import errors**
   - Verify Babel configuration in `.babelrc`
   - Check that all dependencies are installed

## Best Practices

1. **Isolation**: Each test should be independent
2. **Mocking**: Mock external dependencies
3. **Cleanup**: Reset mocks in `beforeEach`
4. **Descriptive**: Use clear test names
5. **AAA Pattern**: Arrange, Act, Assert
6. **Coverage**: Aim for high code coverage
7. **Fast**: Keep tests fast and focused
8. **Maintainable**: Keep tests simple and readable

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://testingjavascript.com/)

