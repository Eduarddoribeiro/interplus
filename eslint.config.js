// Lint mínimo: pega o que o build do Vite não pega (nome indefinido,
// componente sem import, hook fora de ordem). Erros quebram a CI;
// avisos só aparecem.
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default [
  { ignores: ["dist/**", "node_modules/**"] },
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: { react, "react-hooks": reactHooks },
    rules: {
      "no-undef": "error",
      "react/jsx-no-undef": "error",
      "react/jsx-uses-vars": "error",
      "react/jsx-uses-react": "error",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "off",
      "no-unused-vars": ["warn", { varsIgnorePattern: "^_", args: "none" }],
    },
  },
];
