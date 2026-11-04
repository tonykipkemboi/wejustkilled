import js from "@eslint/js";
import globals from "globals";
import security from "eslint-plugin-security";
import noUnsanitized from "eslint-plugin-no-unsanitized";

export default [
  {
    ignores: ["node_modules/**", "site/data.js", "site/kills.json", "data/**", "docs/**", "**/*.min.js"],
  },
  js.configs.recommended,
  security.configs.recommended,
  {
    files: ["site/**/*.js"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "script",
      globals: { ...globals.browser },
    },
    plugins: { "no-unsanitized": noUnsanitized },
    rules: {
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-script-url": "error",
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", caughtErrors: "none" }],
      // Flag every HTML sink. Each remaining innerHTML/insertAdjacentHTML call builds its
      // markup with esc()/safeURL()/encodeURIComponent; see docs/security-review.md.
      "no-unsanitized/method": "warn",
      "no-unsanitized/property": "warn",
      // Lookups use Object.create(null) maps plus has(); this rule is all false positives here.
      "security/detect-object-injection": "off",
    },
  },
  {
    files: ["scripts/**/*.mjs", "eslint.config.js"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      "security/detect-non-literal-fs-filename": "off",
      "security/detect-object-injection": "off",
    },
  },
];
