const { withXcodeProject } = require("@expo/config-plugins");

function getVersion(config) {
  return config.ios?.version || config.version || "1.0.0";
}

function withIosMarketingVersion(config) {
  return withXcodeProject(config, (modConfig) => {
    const version = getVersion(modConfig);
    const project = modConfig.modResults;
    const section = project.pbxXCBuildConfigurationSection();

    for (const [key, value] of Object.entries(section)) {
      if (key.endsWith("_comment") || !value?.buildSettings) {
        continue;
      }

      value.buildSettings.MARKETING_VERSION = version;
    }

    return modConfig;
  });
}

module.exports = withIosMarketingVersion;
