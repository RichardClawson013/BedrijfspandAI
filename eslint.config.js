import js from "@eslint/js";

export default [
  { ignores: ["site/assets/bundle.js"] },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
      },
    },
  },
  {
    files: ["src/web/**/*.js"],
    languageOptions: {
      globals: {
        document: "readonly",
        window: "readonly",
        Blob: "readonly",
        URL: "readonly",
        fetch: "readonly",
      },
    },
  },
  {
    files: ["relay/**/*.js"],
    languageOptions: {
      globals: {
        fetch: "readonly",
        URL: "readonly",
      },
    },
  },
];
