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
            "license-header/header": ["error", "./license/license-header.js"],
        }
    }
);
