// Babel config for the Expo starter. `babel-preset-expo` includes the Expo Router
// transform (SDK 50+), so no extra router plugin is required here.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
