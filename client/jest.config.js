// export default {
//   preset: "ts-jest",
//   testEnvironment: "jsdom",
//   transform: {
//     "^.+\\.(t|j)sx?$": "ts-jest",
//   },
//   moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
//   setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],
//   testMatch: ["**/__tests__/**/*.test.(ts|tsx)"],
// };

// module.exports = {
//   preset: "ts-jest",
//   testEnvironment: "jsdom",
//   roots: ["<rootDir>/src"],
//   moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
//   transform: {
//     "^.+\\.(ts|tsx)$": "ts-jest",
//   },
//   moduleNameMapper: {
//     "\\.(css|less|scss|sass)$": "identity-obj-proxy",
//   },
//   // 👇 Force ts-jest to use your app tsconfig
//   globals: {
//     "ts-jest": {
//       tsconfig: "tsconfig.app.json",
//     },
//   },
// };

export default {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  roots: ["<rootDir>/src"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", {
      tsconfig: "tsconfig.app.json",
    }],
  },
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "\\.(jpg|jpeg|png|gif|svg)$": "jest-transform-stub",
  },
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],
  testMatch: ["**/__tests__/**/*.test.(ts|tsx)"],
};

