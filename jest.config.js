/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverage: true,
  coverageDirectory: './coverage',
  coverageReporters: ['json', ['lcov', { projectRoot: process.cwd() }], 'text'],

  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
  ],

  // Устанавливаем корневой каталог
  roots: [process.cwd()],
  rootDir: process.cwd(),
  modulePaths: [process.cwd()],

  // Добавляем для правильной работы с путями
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/__tests__/',
  ],

  transform: {},

  coverageProvider: 'v8',
}
