import js from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig({
    files: ["lib/**/*.ts"],
    extends: [
        js.configs.recommended,
        tseslint.configs.recommended,
        tseslint.configs.stylistic,
        stylistic.configs.customize({ indent: 4, quotes: "double", semi: true, braceStyle: "1tbs", jsx: false }),
    ],
    rules: {
        "curly": "error",
        "eqeqeq": ["error", "always", { null: "ignore" }],
        "guard-for-in": "error",
        "id-denylist": ["error", "any", "Number", "number", "String", "string", "Boolean", "boolean", "Undefined", "undefined"],
        "max-classes-per-file": ["error", 3],
        "no-bitwise": "error",
        "no-caller": "error",
        "no-cond-assign": ["error", "always"],
        "no-console": "error",
        "no-duplicate-imports": "error",
        "no-eval": "error",
        "no-extra-bind": "error",
        "no-inner-declarations": ["error", "both", { blockScopedFunctions: "disallow" }],
        "no-labels": ["error", { allowLoop: true, allowSwitch: true }],
        "no-new-func": "error",
        "no-new-wrappers": "error",
        "no-sequences": "error",
        "no-template-curly-in-string": "error",
        "no-throw-literal": "error",
        "no-undef-init": "error",
        "object-shorthand": "error",
        "one-var": ["error", "never"],
        "prefer-arrow-callback": ["error", { allowNamedFunctions: true }],
        "prefer-object-spread": "error",
        "radix": "error",

        "@typescript-eslint/consistent-type-assertions": [
            "error",
            { assertionStyle: "as", objectLiteralTypeAssertions: "never" },
        ],
        "@typescript-eslint/explicit-member-accessibility": [
            "error",
            { overrides: { accessors: "off", constructors: "off", parameterProperties: "off" } },
        ],
        "@typescript-eslint/naming-convention": [
            "error",
            {
                selector: ["variable", "parameter", "classProperty"],
                format: ["camelCase", "UPPER_CASE", "PascalCase"],
                leadingUnderscore: "allow",
            },
            { selector: "class", format: ["PascalCase"] },
            { selector: "interface", format: ["PascalCase"], custom: { regex: "^I[A-Z]", match: false } },
        ],
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-invalid-this": "error",
        "@typescript-eslint/no-shadow": "error",
        "@typescript-eslint/no-use-before-define": ["error", { functions: false }],
        "@typescript-eslint/unified-signatures": "error",

        "@stylistic/linebreak-style": ["error", "unix"],
        "@stylistic/max-len": ["error", { code: 120 }],
        "@stylistic/quotes": ["error", "double", { avoidEscape: true, allowTemplateLiterals: "always" }],
    },
}, {
    files: ["lib/cli.ts"],
    rules: {
        "no-console": "off",
    },
});
