import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";

export default tseslint.config(
  // 1. Base JavaScript Recommended
  js.configs.recommended,

  // 2. TypeScript Strict + Stylistic (The "Max Strict" Presets)
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // 3. Configuration & Custom Strict Rules
  {
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    rules: {
      // --- SAFETY: STRICT BOOLEANS & NULLS ---
      // Forces explicit checks (e.g., `if (arr.length > 0)` instead of `if (arr)`)
      // This catches the most common "truthy" bugs in JS.
      "@typescript-eslint/strict-boolean-expressions": [
        "error",
        {
          allowString: false,
          allowNumber: false,
          allowNullableObject: false,
        },
      ],
      // Prevents using non-null assertions (!) which defeat strict null checks
      "@typescript-eslint/no-non-null-assertion": "error",

      // --- SAFETY: ASYNC/PROMISE HANDLING ---
      // Ensures you never forget to await a promise (preventing race conditions)
      "@typescript-eslint/no-floating-promises": "error",
      // Prevents passing async functions to places expecting void (like Array.forEach)
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: true },
      ],

      // --- SAFETY: CONTROL FLOW ---
      // Ensures switch statements cover ALL cases of a union type
      "@typescript-eslint/switch-exhaustiveness-check": "error",

      // --- CODE QUALITY: EXPLICITNESS ---
      // Require explicit return types (prevents accidental type widening)
      "@typescript-eslint/explicit-function-return-type": [
        "error",
        {
          allowExpressions: true, // Allow arrow functions in callbacks to infer
          allowTypedFunctionExpressions: true,
        },
      ],
      // Force explicit 'public'/'private' (enhances readability)
      "@typescript-eslint/explicit-member-accessibility": [
        "error",
        {
          accessibility: "explicit",
          overrides: { constructors: "no-public" },
        },
      ],

      // --- MODERN SYNTAX: CLEANUP ---
      // Enforce `import type` effectively.
      // "inline-type-imports" is the modern TS 5.x standard.
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "inline-type-imports",
        },
      ],
      // Enforce `type` over `interface` (consistent with modern mapped types)
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],

      // --- GENERAL ---
      // Allow warn/error, ban log (keep production clean)
      // "no-console": ["error", { allow: ["warn", "error"] }],
      // Use the TS version of unused vars (smarter than JS version)
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },

  // 4. Prettier (Must be last to override stylistic conflicts)
  prettierConfig,
);
