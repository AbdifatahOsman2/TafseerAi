const { getDefaultConfig } = require('expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

defaultConfig.resolver.blockList = [
  /.*\/node_modules\/@react-native-firebase\/.*/,
];

module.exports = defaultConfig; 