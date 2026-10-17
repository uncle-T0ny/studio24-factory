import js from "@eslint/js"
import { defineConfig, globalIgnores } from "eslint/config"
import { createNodeResolver, importX } from "eslint-plugin-import-x"
import globals from "globals"
import tseslint from "typescript-eslint"

// The app's rules (app/eslint.config.ts) without the React and UI-kit ones: this package is a
// Node worker.

const CYRILLIC = "/[\\u0400-\\u04FF]/"
const ENGLISH_ONLY = [
  { selector: `Literal[value=${CYRILLIC}]`, message: "English only: no Cyrillic in code." },
  {
    selector: `TemplateElement[value.raw=${CYRILLIC}]`,
    message: "English only: no Cyrillic in code.",
  },
]

export default defineConfig([
  globalIgnores(["node_modules", "dist"]),
  {
    files: ["**/*.ts"],
    extends: [js.configs.recommended, tseslint.configs.strictTypeChecked],
    plugins: {
      "import-x": importX,
    },
    settings: {
      "import-x/resolver-next": [createNodeResolver({ extensions: [".ts", ".js", ".json"] })],
    },
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.node,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      curly: ["error", "all"],
      eqeqeq: ["error", "always"],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
      "@typescript-eslint/no-confusing-void-expression": ["error", { ignoreArrowShorthand: true }],
      "@typescript-eslint/switch-exhaustiveness-check": [
        "error",
        { considerDefaultExhaustiveForUnions: true },
      ],
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
      "import-x/no-cycle": "error",
      "import-x/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", ["parent", "sibling", "index"]],
          "newlines-between": "never",
          alphabetize: { order: "asc" },
        },
      ],
      "max-lines": ["error", { max: 400, skipBlankLines: true, skipComments: true }],
      "max-lines-per-function": ["error", { max: 120, skipBlankLines: true, skipComments: true }],
      complexity: ["error", 15],
      // The worker logs through the agents logger (log() from @livekit/agents), as JSON.
      "no-console": "error",
      "no-restricted-syntax": ["error", ...ENGLISH_ONLY],
    },
  },
  {
    files: ["**/*.test.ts"],
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
      "max-lines-per-function": "off",
      "max-lines": "off",
      "@typescript-eslint/require-await": "off",
    },
  },
])
