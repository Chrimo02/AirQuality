// stryker.conf.js
export default {
  testRunner: 'jest',
  mutator: 'javascript',
  packageManager: 'npm',
  reporters: ['html', 'progress', 'clear-text'],
  coverageAnalysis: 'off', // bei Jest meist 'off' schneller
  jest: {
    configFile: 'jest.config.cjs'
  },
  mutate: [
    'src/**/*.js',
    'src/**/*.jsx',
    '!src/main.jsx',
    '!src/**/__tests__/**',
    '!src/**/index.js'
  ],
  timeoutMS: 60000
};
