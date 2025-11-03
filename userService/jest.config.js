export default {
    testEnvironment: "node",
    coverageDirectory: "coverage",
    collectCoverageFrom: [
        "src/**/*.js",
        "!src/db/db.js",
    ],
    testMatch: [
        "**/__tests__/**/*.js",
        "**/*.test.js"
    ],
    transform: {},
    moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1"
    }
};