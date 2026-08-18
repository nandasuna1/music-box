import typescriptEslint from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import eslintPluginImport from "eslint-plugin-import";

export default [
  {
    ignores: ["node_modules/**", ".expo/**", "dist/**", "build/**"],
  },

  // Configuração EXCLUSIVA para arquivos TypeScript
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      import: eslintPluginImport,
      "@typescript-eslint": typescriptEslint,
    },
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.json",
      },
    },
    settings: {
      "import/parsers": {
        "@typescript-eslint/parser": [".ts", ".tsx"],
      },
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: "./tsconfig.json",
        },
        node: true,
      },
    },
    rules: {
      "import/no-unresolved": "error",
    },
  },

  // Configuração para arquivos JavaScript comuns (babel.config.js, jest.config.js, etc)
  {
    files: ["**/*.js", "**/*.jsx", "**/*.mjs", "**/*.cjs"],
    plugins: {
      import: eslintPluginImport,
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
  },
];
