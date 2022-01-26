module.exports = {
  env: {
    es6: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: '2018',
  },
  plugins: ['jest'],
  extends: ['eslint:recommended', 'prettier', 'plugin:jest/recommended'],
  rules: {
    quotes: ['error', 'single'],
    'comma-dangle': ['error', 'always-multiline'],
    'no-console': 'error',
  },
};
