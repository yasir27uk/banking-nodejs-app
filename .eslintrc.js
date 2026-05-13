module.exports = {
    env: { node: true, es2022: true, jest: true },
    extends: ['eslint:recommended', 'plugin:security/recommended'],
    plugins: ['security'],
    parserOptions: { ecmaVersion: 2022 },
    rules: {
        'no-console': 'off',
        'security/detect-object-injection': 'warn',
        'security/detect-non-literal-regexp': 'warn',
        'security/detect-non-literal-fs-filename': 'error',
        'security/detect-eval-with-expression': 'error',
        'security/detect-child-process': 'warn',
    },
};
