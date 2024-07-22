import { Meteor } from 'meteor/meteor';
import { getSettings } from 'meteor/quave:settings';

import AWS from 'aws-sdk/global';
import S3 from 'aws-sdk/clients/s3';

const PACKAGE_NAME = 'quave:profile';
const settings = getSettings({ packageName: PACKAGE_NAME });

const { s3 } = settings || {};

export const getAwsS3Bucket = () => {
  AWS.config = new AWS.Config();
  AWS.config.accessKeyId = s3.accessKeyId;
  AWS.config.secretAccessKey = s3.secretAccessKey;
  AWS.config.region = s3.region;
  AWS.config.update({
    region: s3.region,
    accessKeyId: s3.accessKeyId,
    secretAccessKey: s3.secretAccessKey,
  });

  return new S3({
    params: {
      Bucket: s3.Bucket,
    },
  });
};

export const getBaseUrl = () => `https://s3.amazonaws.com/${s3.Bucket}`;

const getDataObject = (
  Body,
  Key,
  ContentEncoding = 'UTF-8',
  ContentType = 'application/json'
) => ({
  ACL: 'public-read',
  Key,
  Body,
  ContentEncoding,
  ContentType,
});

export const uploadFileToS3 = (data, pathWithFileName, callback) => {
  const s3Bucket = getAwsS3Bucket();

  return s3Bucket.putObject(
    getDataObject(data, pathWithFileName, null, null),
    callback
  );
};

export const uploadFileToS3Sync = (data, filePath) => {
  const uploadExportToS3SyncFunc = Meteor.wrapAsync(uploadFileToS3);

  uploadExportToS3SyncFunc(data, filePath);
  return { url: `${getBaseUrl()}/${filePath}` };
};
