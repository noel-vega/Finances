// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    rules: {
      // eslint-config-expo@57 bundles eslint-plugin-react-hooks v6 (RC), whose
      // set-state-in-effect rule flags legitimate patterns — the SSR-hydration
      // guard in Expo's own use-color-scheme.web.ts template, and clearing
      // order state when the device auth status flips to "unpaired". Downgrade
      // to a warning rather than contort those.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);
