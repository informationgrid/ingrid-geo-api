import eslint from '@eslint/js';
import licenseHeader from 'eslint-plugin-license-header';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        plugins: {
            "license-header": licenseHeader,
        },
        rules: {
            "@typescript-eslint/no-explicit-any": ["warn"],
            "@typescript-eslint/no-require-imports": ["warn"],
            "@typescript-eslint/no-unused-vars": ["warn"],
            "license-header/header": ["error", "./license/license-header.js"],
            "prefer-const": ["off"],
        }
    }
);
