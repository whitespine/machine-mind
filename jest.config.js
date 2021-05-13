module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    globals: {
        "ts-jest": {
            compiler: "ttypescript",
        },
    },
    moduleNameMapper: {
      "^@src/(.*)$": "<rootDir>/src/$1",
    },
    testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$",
    testPathIgnorePatterns: ["/lib/", "/node_modules/", "/babyjail/", "/dist/"],
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
    collectCoverage: false,
    setupFilesAfterEnv: ['./jest.setup.js']
};
