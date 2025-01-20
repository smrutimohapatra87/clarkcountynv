/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node', // Use Node.js environment
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest', // Use Babel for JS/TS files
  },
  moduleFileExtensions: ['js', 'jsx', 'mjs', 'cjs', 'json', 'node'],
};
