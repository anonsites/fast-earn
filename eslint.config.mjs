import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Disable a couple of Tailwind-specific rules that enforce linear-variant naming.
  // If you later want stricter rules, re-enable them or configure individually.
  {
    plugins: ['tailwindcss'],
    rules: {
      // turn off class ordering and custom classname enforcement from the tailwind plugin
      'tailwindcss/classnames-order': 'off',
      'tailwindcss/no-custom-classname': 'off',
      // allow both gradient naming variants
      'tailwindcss/enforces-shorthand': 'off',
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
