import { Meteor } from 'meteor/meteor';
import Profiler from './main';
import { uploadFileToS3Sync } from './s3';

const PACKAGE_NAME = 'quave:profile';

Meteor.methods({
  'quave:profile#execute': ({ durationMs = 1000, name, folder = '' } = {}) => {
    const now = new Date();
    const profileName =
      name ||
      `profile-${now.getFullYear()}-${
        now.getMonth() + 1
      }-${now.getDate()}-${now.getTime()}`;
    console.log(`profileName`, profileName);

    Profiler.profileDuration(
      profileName,
      `${profileName}.cpuprofile`,
      durationMs,
      Meteor.bindEnvironment((exportPath, result) => {
        const uploaded = uploadFileToS3Sync(
          result,
          `${folder}${folder && !folder.endsWith('/') ? '/' : ''}${exportPath}`
        );
        console.log(`[${PACKAGE_NAME}] URL`, uploaded.url);
      })
    );
  },
});
