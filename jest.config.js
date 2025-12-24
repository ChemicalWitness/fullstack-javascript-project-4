/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverage: true,
  coverageDirectory: './coverage',
  coverageReporters: ['json', ['lcov', { projectRoot: process.cwd() }], 'text', 'clover'],
  transform: {},
}
