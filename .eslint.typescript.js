const merge = require('merge');

// eslint-plugin-shopify/lib/config/rules/typescript
const rules = {
  // Enforce one space after the colon and zero spaces before the colon of a type annotation.
  '@typescript-eslint/type-annotation-spacing': ['error'],

  // Require explicit return types on functions and class methods
  '@typescript-eslint/explicit-function-return-type': 'off',

  // Enforce accessibility modifiers on class properties and methods. (member-access from TSLint)
  '@typescript-eslint/explicit-member-accessibility': 'off',

  // Enforce interface names are prefixed. (interface-name from TSLint)
  '@typescript-eslint/interface-name-prefix': 'off',

  // Enforce naming conventions for class members by visibility.
  '@typescript-eslint/member-naming': 'off',

  // Enforce /// <reference /> is not used. (no-reference from TSLint)
  '@typescript-eslint/no-triple-slash-reference': 'error',

  // Disallow generic Array constructors
  '@typescript-eslint/no-array-constructor': 'error',

  // Enforce the use of as Type assertions instead of <Type> assertions. (no-angle-bracket-type-assertion from TSLint)
  '@typescript-eslint/no-angle-bracket-type-assertion': 'error',

  // Enforce the any type is not used. (no-any from TSLint)
  '@typescript-eslint/no-explicit-any': 'off',

  // Disallows explicit type declarations for variables or parameters initialized to a number, string, or boolean. (no-inferrable-types from TSLint)
  '@typescript-eslint/no-inferrable-types': ['error'],

  // Disallow the use of custom TypeScript modules and namespaces
  '@typescript-eslint/no-namespace': 'off',

  // Disallow non-null assertions using the ! postfix operator
  '@typescript-eslint/no-non-null-assertion': 'off',

  // Disallow the use of variables before they are defined.
  '@typescript-eslint/no-use-before-define': 'off',

  // Disallows the use of require statements except in import statements (no-var-requires from TSLint)
  '@typescript-eslint/no-var-requires': 'error',

  // Enforce the use of the keyword namespace over module to declare custom TypeScript modules. (no-internal-module from TSLint)
  '@typescript-eslint/prefer-namespace-keyword': 'off',

  // Disallow the use of type aliases. (interface-over-type-literal from TSLint)
  // breaks `export type Message = string | ((colorizer: any) => string);`
  '@typescript-eslint/no-type-alias': 'off',

  // Enforce a standard member declaration order. (member-ordering from TSLint)
  '@typescript-eslint/member-ordering': [
    'error',
    {
      default: [
        'public-static-field',
        'protected-static-field',
        'private-static-field',
        'public-static-method',
        'protected-static-method',
        'private-static-method',
        'public-instance-field',
        'protected-instance-field',
        'private-instance-field',
        'constructor',
        'public-instance-method',
        'protected-instance-method',
        'private-instance-method',
      ],
    },
  ],

  // Prevent TypeScript-specific constructs from being erroneously flagged as unused
  '@typescript-eslint/no-unused-vars': 'off',

  // Enforce member overloads to be consecutive.
  '@typescript-eslint/adjacent-overload-signatures': 'error',

  // Disallow parameter properties in class constructors. (no-parameter-properties from TSLint)
  '@typescript-eslint/no-parameter-properties': 'off',

  // Enforce PascalCased class and interface names. (class-name from TSLint)
  '@typescript-eslint/class-name-casing': 'error',

  // Enforce a member delimiter style in interfaces and type literals.
  '@typescript-eslint/member-delimiter-style': ['error'],

  // Disallow the declaration of empty interfaces. (no-empty-interface from TSLint)
  '@typescript-eslint/no-empty-interface': 'off',

  // Already supported by TS
  'no-undef': 'off',
  'no-unused-expressions': 'off',
  'no-unused-vars': 'off',
  'no-useless-constructor': 'off',
  'no-shadow': 'off',
  'no-use-before-define': 'off',
  'sort-class-members/sort-class-members': 'off',

  // Does not support TS equivalent
  'import/no-unresolved': 'off',
  'import/no-extraneous-dependencies': 'off',
  'no-empty-function': 'off',

  // We use TS for prop types
  'react/prop-types': 'off',

  // Flag overloaded methods in TS
  'no-dupe-class-members': 'off',

  // Flag typedef files with multiple modules with export default
  'import/export': 'off',

  // Breaks typescript-eslint-parser
  strict: 'off',
  'shopify/prefer-early-return': 'off',
  'array-callback-return': 'off',
  'getter-return': 'off',

  // Prefer TypeScript enums be defined using Pascal case
  'shopify/typescript/prefer-pascal-case-enums': 'error',
  // Prefer TypeScript enums be defined using singular names
  'shopify/typescript/prefer-singular-enums': 'error',
};

module.exports = {
  extends: 'plugin:shopify/esnext',

  plugins: ['@typescript-eslint'],

  overrides: [
    {
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: '.',
      },
      files: ['*.ts', '*.tsx'],
      // rules,
      // rules: merge({
      //   'no-unused-vars': 'off',
      //   'babel/no-invalid-this': 'off',
      // }),
      rules: merge(rules, {
        // TypeScript provides a better mechanism (explicit `this` type)
        // for ensuring proper `this` usage in functions not assigned to
        // object properties.
        'babel/no-invalid-this': 'off',
      }),
    },
  ],
};
