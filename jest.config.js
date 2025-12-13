/** @type {import('jest').Config} */
export default {
  coverageDirectory: 'coverage',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  
  collectCoverageFrom: [
    'src/**/*.js',
  ],
  
  // Ключевые настройки для правильных путей:
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1'
  },
  
  // Устанавливаем корневой каталог
  rootDir: process.cwd(),
  
  // Используем process.cwd() вместо __dirname
  modulePaths: ['<rootDir>/src', '<rootDir>/node_modules'],
  
  // Добавляем для правильной работы с путями
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/coverage/'
  ],
  
  transform: {},
}