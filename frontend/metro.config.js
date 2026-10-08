const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Audios Ogg/Opus del Desmitificador (grabaciones en Mískitu): Metro no los incluye por defecto
config.resolver.assetExts.push("ogg", "opus");

module.exports = withNativeWind(config, { input: "./global.css" });
