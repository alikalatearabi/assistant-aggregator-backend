module.exports = {
  displayName: 'Auth Service Tests',
  testMatch: ['<rootDir>/src/services/auth.service.spec.ts'],
  collectCoverageFrom: ['<rootDir>/src/services/auth.service.ts'],
  coverageDirectory: '<rootDir>/coverage/auth-service',
  coverageReporters: ['text', 'lcov', 'html'],
  testEnvironment: 'node',
};