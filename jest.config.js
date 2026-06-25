module.exports = {
  preset: "jest-expo",

  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],

  transformIgnorePatterns: [
    "node_modules/(?!(jest-)?react-native|@react-native|expo(nent)?|@expo|expo-modules-core|react-navigation|@react-navigation|firebase|@firebase)",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
};
