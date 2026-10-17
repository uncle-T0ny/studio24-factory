import js from "@eslint/js"
import { defineConfig, globalIgnores } from "eslint/config"
import { createNodeResolver, importX } from "eslint-plugin-import-x"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import globals from "globals"
import tseslint from "typescript-eslint"

const CYRILLIC = "/[\\u0400-\\u04FF]/"
const KIT_CONTROLS = "JSXOpeningElement[name.name=/^(button|input|select|textarea)$/]"
const NO_V_ANY = {
  selector: "CallExpression[callee.object.name='v'][callee.property.name='any']",
  message: "v.any() is not allowed: give the field a typed validator.",
}
const ENGLISH_ONLY = [
  { selector: `Literal[value=${CYRILLIC}]`, message: "English only: no Cyrillic in code." },
  {
    selector: `TemplateElement[value.raw=${CYRILLIC}]`,
    message: "English only: no Cyrillic in code.",
  },
  { selector: `JSXText[value=${CYRILLIC}]`, message: "English only: no Cyrillic in code." },
]

export default defineConfig([
  globalIgnores(["dist", "convex/_generated", "node_modules", ".wrangler"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: {
      "import-x": importX,
    },
    settings: {
      "import-x/resolver-next": [
        createNodeResolver({ extensions: [".ts", ".tsx", ".js", ".json"] }),
      ],
    },
    languageOptions: {
      ecmaVersion: 2023,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
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
      "no-console": ["error", { allow: ["error"] }],
      "no-restricted-syntax": ["error", NO_V_ANY, ...ENGLISH_ONLY],
      "react-refresh/only-export-components": "off",
    },
  },
  // Kit enforcement: raw controls and deep kit imports only inside src/ui.
  // A later block replaces no-restricted-syntax's whole list, so it repeats the entries it keeps.
  {
    files: ["src/**/*.tsx"],
    ignores: ["src/ui/**"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: KIT_CONTROLS,
          message: "Use the kit (src/ui): Button, IconButton, TextField, Select...",
        },
        ...ENGLISH_ONLY,
      ],
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/ui/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { regex: "/ui/(?!index$)[^/]+$", message: "Import the kit from src/ui (its index)." },
          ],
        },
      ],
    },
  },
  // The kit and lib import no feature code.
  {
    files: ["src/ui/**", "src/lib/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^\\.\\./(?!ui|lib)",
              message: "The kit and src/lib import no feature code.",
            },
          ],
        },
      ],
    },
  },
  // The kit page's sections sit one folder deeper, in src/ui/kit-page.
  {
    files: ["src/ui/kit-page/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^\\.\\./\\.\\./(?!ui|lib)",
              message: "The kit and src/lib import no feature code.",
            },
          ],
        },
      ],
    },
  },
  // Convex function files declare their public functions with the access wrappers.
  {
    files: ["convex/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "./_generated/server",
              importNames: ["query", "mutation"],
              message: "Declare public functions with the wrappers in ./lib/functions.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["**/*.test.ts", "e2e/**"],
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
      "no-restricted-syntax": "off",
      "max-lines-per-function": "off",
      // A suite is a list of cases, and its fakes implement async interfaces without awaiting.
      "max-lines": "off",
      "@typescript-eslint/require-await": "off",
    },
  },
  {
    files: ["scripts/**", "e2e/**"],
    rules: {
      "no-console": "off",
    },
  },
])
