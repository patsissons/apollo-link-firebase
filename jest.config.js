/* eslint-env node */

const {readdirSync, existsSync} = require('fs');
const path = require('path');

const moduleNameMapper = getPackageNames().reduce((accumulator, name) => {
  const scopedName = `patsissons/${name}`;
  accumulator[scopedName] = `<rootDir>/packages/${name}/src/index.ts`;
  return accumulator;
}, {});

module.exports = {
  setupFiles: ['<rootDir>/test/setup.ts'],
  setupFilesAfterEnv: ['<rootDir>/test/each-test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    '\\.(gql|graphql)$': 'jest-transform-graphql',
  },
  testRegex: '.*\\.test\\.tsx?$',
  testEnvironmentOptions: {
    url: 'http://localhost:3000/',
  },
  coverageDirectory: './coverage/',
  collectCoverage: false,
  moduleNameMapper,
  globals: {
    'ts-jest': {diagnostics: false},
  },
  preset: 'ts-jest',
};

function getPackageNames() {
  const packagesPath = path.join(__dirname, 'packages');

  if (!existsSync(packagesPath)) {
    return [];
  }

  return readdirSync(packagesPath).filter(packageName => {
    const packageJSONPath = path.join(
      packagesPath,
      packageName,
      'package.json',
    );
    return existsSync(packageJSONPath);
  });
}
