/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  // Тестовые файлы
  testMatch: ['**/__tests__/**/*.test.js'],
  // Генерация покрытия кода
  collectCoverage: true,
  coverageDirectory: 'coverage', // папка для отчётов
  coverageReporters: ['json', 'lcov', 'text', 'clover'],

  // Какие файлы включать в покрытие
  collectCoverageFrom: [
    'src/**/*.js',
  ],
  roots: ['<rootDir>'],
  modulePaths: ['<rootDir>/src'],
  moduleDirectories: ['node_modules', 'src'],

  transform: {},

  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/',
    '/__fixtures__/',
    '/coverage/',
  ],
}
