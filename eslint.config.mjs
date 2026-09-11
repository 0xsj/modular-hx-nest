import ts from "typescript-eslint";
import solid from "eslint-plugin-solid/configs/typescript";
export default ts.config(
  {
    ignores: [
      "node_modules/**",
      ".output/**",
      ".vinxi/**",
      "dist/**",
      "artifacts/**",
      "custody/**",
      "docs/verification/scaffold-contracts/**",
    ],
  },
  ...ts.configs.recommended,
  {
    ...solid,
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      ...solid.rules,
      // Tracked JSX IIFEs retain discriminated-union narrowing. The return-once
      // rule counts their nested returns as component returns; reactivity stays on.
      "solid/components-return-once": "off",
      "solid/reactivity": [
        "warn",
        {
          customReactiveFunctions: [
            "bindFormReset",
            "observeSource",
            "clientData",
          ],
        },
      ],
      "solid/prefer-show": "off",
      "solid/prefer-switch": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  {
    files: ["src/**/*.spec.test.ts"],
    rules: { "@typescript-eslint/no-explicit-any": "off" },
  }, // Contract probes deliberately pass values beyond the typed boundary.
);
