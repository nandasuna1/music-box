const { getSentryExpoConfig } = require("@sentry/react-native/metro");

const config = getSentryExpoConfig(__dirname, {
  // Auto-wrap Expo Router ErrorBoundary exports at build time
  autoWrapExpoRouterErrorBoundary: true,
});

module.exports = config;
