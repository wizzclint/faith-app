module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    env: {
      production: {
        plugins: ['react-native-paper/babel'],
      },
    },
    // react-native-reanimated/plugin must always be listed last.
    plugins: ['react-native-reanimated/plugin'],
  };
};
