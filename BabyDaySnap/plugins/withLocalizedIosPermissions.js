const fs = require("fs");
const path = require("path");

const { withInfoPlist, withXcodeProject } = require("@expo/config-plugins");
const {
  addResourceFileToGroup,
  ensureGroupRecursively,
  getProjectName,
} = require("@expo/config-plugins/build/ios/utils/Xcodeproj");

const METADATA_DIR = path.join("locales", "metadata");
const STRINGS_FILE_NAME = "InfoPlist.strings";
const REQUIRED_KEYS = [
  "NSCameraUsageDescription",
  "NSPhotoLibraryUsageDescription",
  "NSPhotoLibraryAddUsageDescription",
];

function escapeStringsValue(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/"/g, '\\"');
}

function readMetadataFile(filePath) {
  const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const iosValues = raw?.ios && typeof raw.ios === "object" ? raw.ios : raw;

  return REQUIRED_KEYS.reduce((result, key) => {
    if (typeof iosValues?.[key] === "string" && iosValues[key].trim().length > 0) {
      result[key] = iosValues[key];
    }
    return result;
  }, {});
}

function getPermissionMetadata(projectRoot) {
  const metadataRoot = path.join(projectRoot, METADATA_DIR);
  if (!fs.existsSync(metadataRoot)) {
    return [];
  }

  return fs
    .readdirSync(metadataRoot)
    .filter((name) => name.endsWith(".json"))
    .map((name) => {
      const locale = path.basename(name, ".json");
      const values = readMetadataFile(path.join(metadataRoot, name));
      return [locale, values];
    })
    .filter(([, values]) => Object.keys(values).length > 0);
}

function withLocalizedIosPermissions(config) {
  config = withInfoPlist(config, (configWithInfoPlist) => {
    configWithInfoPlist.modResults.CFBundleAllowMixedLocalizations = true;
    return configWithInfoPlist;
  });

  return withXcodeProject(config, (configWithXcodeProject) => {
    const projectRoot = configWithXcodeProject.modRequest.projectRoot;
    const projectName = getProjectName(projectRoot);
    const supportingDirectory = path.join(projectRoot, "ios", projectName, "Supporting");
    const localizations = getPermissionMetadata(projectRoot);

    let project = configWithXcodeProject.modResults;

    for (const [locale, values] of localizations) {
      const localeDirectory = path.join(supportingDirectory, `${locale}.lproj`);
      const stringsPath = path.join(localeDirectory, STRINGS_FILE_NAME);
      const stringsContents = REQUIRED_KEYS.filter((key) => values[key]).map(
        (key) => `${key} = "${escapeStringsValue(values[key])}";`
      );

      fs.mkdirSync(localeDirectory, { recursive: true });
      fs.writeFileSync(stringsPath, stringsContents.join("\n"));

      const groupName = `${projectName}/Supporting/${locale}.lproj`;
      const group = ensureGroupRecursively(project, groupName);

      if (!group?.children.some(({ comment }) => comment === STRINGS_FILE_NAME)) {
        project = addResourceFileToGroup({
          filepath: path.relative(supportingDirectory, stringsPath).replace(/\\/g, "/"),
          groupName,
          project,
          isBuildFile: true,
          verbose: true,
        });
      }
    }

    configWithXcodeProject.modResults = project;
    return configWithXcodeProject;
  });
}

module.exports = withLocalizedIosPermissions;
