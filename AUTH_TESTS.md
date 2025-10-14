# Auth Service Unit Tests

This document describes the comprehensive unit tests for the AuthService class in the Assistant Aggregator Backend application.

## Test Overview

The auth service tests cover all public methods with comprehensive scenarios including success cases, error conditions, and edge cases.

## Test Structure

### Test Files
- `src/services/auth.service.spec.ts` - Main test file for AuthService

### Test Coverage

The tests cover the following methods:

#### 1. `register(registerDto: RegisterDto): Promise<AuthResponseDto>`
- ✅ Successfully registers a new user with valid data
- ✅ Throws ConflictException when email already exists
- ✅ Throws ConflictException when national code already exists  
- ✅ Throws ConflictException when personal code already exists
- ✅ Uses default USER role when role is not provided

#### 2. `login(loginDto: LoginDto): Promise<AuthResponseDto>`
- ✅ Successfully logs in with valid credentials
- ✅ Throws UnauthorizedException when user does not exist
- ✅ Throws UnauthorizedException when user account is deactivated
- ✅ Throws UnauthorizedException when password is invalid

#### 3. `validateUser(email: string, password: string): Promise<any>`
- ✅ Returns user without password when validation succeeds
- ✅ Returns null when user does not exist
- ✅ Returns null when password is invalid

#### 4. `findById(id: string): Promise<User | null>`
- ✅ Returns user when found by ID
- ✅ Returns null when user not found by ID

## Test Features

### Mocking Strategy
- **bcryptjs**: Mocked for password hashing and comparison
- **JwtService**: Mocked for token generation
- **User Model**: Mocked with comprehensive MongoDB query simulation
- **Mongoose Document**: Mocked constructor with save functionality

### Test Data
The tests use realistic test data including:
- Valid user registration information
- Proper enum values for UserRole and OrganizationLevel
- Realistic email addresses and codes
- Proper password handling

### Assertions
Tests verify:
- Correct method calls with expected parameters
- Proper error throwing with specific error types and messages
- Accurate return value structure matching DTOs
- Password security (hashed storage, bcrypt usage)
- JWT token generation with correct payload

## Running Tests

### Run Auth Service Tests Only
```bash
npm test -- --testPathPatterns=auth.service.spec.ts
```

### Run with Coverage
```bash
npx jest --testPathPatterns=auth.service.spec.ts --coverage --collectCoverageFrom="src/services/auth.service.ts" --coverageReporters=text
```

### Run All Tests
```bash
npm test
```

### Watch Mode
```bash
npm run test:watch -- --testPathPatterns=auth.service.spec.ts
```

## Test Results

All 15 test cases pass successfully:

```
✓ AuthService should be defined
✓ register should successfully register a new user
✓ register should throw ConflictException when email already exists
✓ register should throw ConflictException when national code already exists  
✓ register should throw ConflictException when personal code already exists
✓ register should use default USER role when role is not provided
✓ login should successfully login with valid credentials
✓ login should throw UnauthorizedException when user does not exist
✓ login should throw UnauthorizedException when user is inactive
✓ login should throw UnauthorizedException when password is invalid
✓ validateUser should return user without password when validation succeeds
✓ validateUser should return null when user does not exist
✓ validateUser should return null when password is invalid
✓ findById should return user when found
✓ findById should return null when user not found
```

## Dependencies

The tests require the following packages:
- `@nestjs/testing` - NestJS testing utilities
- `jest` - Testing framework
- `ts-jest` - TypeScript support for Jest

All dependencies are already included in the project's `devDependencies`.

## Security Testing

The tests specifically verify security aspects:
- Password hashing with bcrypt (salt rounds = 12)
- Password exclusion from user objects in responses
- Proper JWT token payload structure
- Account activation status checking
- Input validation through DTO structure

## Future Enhancements

Potential areas for test expansion:
- Integration tests with real database
- Performance testing for password hashing
- Rate limiting test scenarios
- JWT token expiration testing
- More comprehensive edge cases