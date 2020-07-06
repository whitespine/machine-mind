module.exports = {
  parser: 'vue-eslint-parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'prettier',
    'prettier/@typescript-eslint',
    'plugin:vue/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    parser: '@typescript-eslint/parser',
  },
  rules: {
    '@typescript-eslint/indent': ['error', 2],
    camelcase: 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/camelcase': ['error', { properties: 'never' }],
    '@typescript-eslint/interface-name-prefix': 0,
    '@typescript-eslint/explicit-member-accessibility': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/explicit-function-return-type': [
      'warn',
      {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
      },
    ],
  },
}
