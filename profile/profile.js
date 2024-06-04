import fs from 'fs';

const PACKAGE_NAME = 'quave:profile';

const defaultConsumer = (exportPath, result) =>
  fs.writeFileSync(exportPath, result);

export const getProfiler = (v8Profiler) => {
  const currentProfiles = {};

  const startProfile = (profileName, options) => {
    if (currentProfiles[profileName]) {
      return;
    }
    currentProfiles[profileName] = options;

    console.log(`[${PACKAGE_NAME}] Profiling "${profileName}"`);
    v8Profiler.startProfiling(profileName);
  };

  const stopProfile = (profileName, profileConsumer = defaultConsumer) => {
    if (
      !currentProfiles[profileName] ||
      currentProfiles[profileName].complete
    ) {
      return;
    }
    currentProfiles[profileName].complete = true;

    const profile = v8Profiler.stopProfiling(profileName);
    const exportPath = currentProfiles[profileName].exportPath;

    profile.export((error, result) => {
      if (error) {
        console.error('Error exporting profile', error);
        return;
      }
      profileConsumer(exportPath, result);
      console.log(
        `[${PACKAGE_NAME}] Profile "${profileName}" has been written to ${exportPath}`
      );

      profile.delete();
      delete currentProfiles[profileName];
    });
  };

  return {
    startProfile,
    stopProfile,
  };
};
