/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['json', 'lcov', 'text', 'clover'],

  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
  ],

  // Устанавливаем корневой каталог
  roots: ['.'],
  rootDir: '.',
  modulePaths: ['.'],
  moduleDirectories: ['node_modules', '.'],

  // Добавляем для правильной работы с путями
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
  ],

  transform: {},
}
