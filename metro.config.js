const { getDefaultConfig } = require('expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

// Firebase v12 requires package exports support
defaultConfig.resolver.unstable_enablePackageExports = true;

defaultConfig.resolver.blockList = [
  /.*\/node_modules\/@react-native-firebase\/.*/,
];

module.exports = defaultConfig; 