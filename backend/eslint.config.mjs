import js from "@eslint/js";
import globals from "globals"; 

export default [
    js.configs.recommended,
    {
        files: ["**/*.js"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "commonjs",
            globals: {
                ...globals.node,
                ...globals.jest
            }
        },
        rules: {
            "no-unused-vars": ["warn", { 
                "argsIgnorePattern": "^_|^next$|^e$|^error$",
                "varsIgnorePattern": "^_"
            }],
            "no-undef": "error"
        }
    },
    {
        files: ["**/*.mjs"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {
                ...globals.node
            }
        }
    }
];