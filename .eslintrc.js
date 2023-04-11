module.exports = {
  env: {
    es6: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: '2020',
  },
  extends: ['eslint:recommended', 'prettier'],
  rules: {
    quotes: ['error', 'single'],
    'comma-dangle': ['error', 'always-multiline'],
    'no-console': 'error',
  },
};
