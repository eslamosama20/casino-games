const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Optimize source maps and worker concurrency to prevent memory crashes
config.transformer = {
  ...config.transformer,
  minifierPath: require.resolve('metro-minify-terser'),
};

config.maxWorkers = 2;

module.exports = config;
