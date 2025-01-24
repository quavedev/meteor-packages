const crypto = Npm.require('crypto');
const url = Npm.require('url');

Slingshot.OracleStorage = {
  accessId: 'AccessKeyId',
  secretKey: 'SecretAccessKey',

  directiveMatch: {
    bucket: String,
    region: String,
    endpoint: String,
    AccessKeyId: String,
    SecretAccessKey: String,
    key: Match.OneOf(String, Function),
    expire: Match.Where(function (expire) {
      check(expire, Number);
      return expire > 0;
    }),
  },

  directiveDefault: {
    expire: 5 * 60 * 1000, // 5 minutes
  },

  getContentDisposition: async function (method, directive, file, meta) {
    let getContentDisposition = directive.contentDisposition;

    if (!_.isFunction(getContentDisposition)) {
      getContentDisposition = function () {
        const filename = file.name && encodeURIComponent(file.name);

        return (
          directive.contentDisposition ||
          (filename &&
            'inline; filename="' +
            filename +
            "\"; filename*=utf-8''" +
            filename)
        );
      };
    }

    return getContentDisposition.call(method, file, meta);
  },

  upload: async function (method, directive, file, meta) {
    const key = _.isFunction(directive.key)
      ? await directive.key.call(method, file, meta)
      : directive.key;

    const signedUrl = await this.getSignedUrl(directive, key, file.type);

    // Using S3 compatibility API URL format
    const downloadUrl = `${directive.endpoint}/${directive.bucket}/${key}`;

    return {
      upload: signedUrl,
      download: downloadUrl,
      postData: [],
      service: "OracleStorage",
    };
  },

  getSignedUrl: async function (directive, key) {
    const date = new Date();
    const dateString = date.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const datestamp = dateString.slice(0, 8);
    const credential = `${directive[this.accessId]}/${datestamp}/${directive.region
      }/s3/aws4_request`;

    const queryParams = new url.URLSearchParams({
      'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
      'X-Amz-Credential': credential,
      'X-Amz-Date': dateString,
      'X-Amz-Expires': directive.expire.toString(),
      'X-Amz-SignedHeaders': 'host',
    });

    const canonicalRequest = this.getCanonicalRequest(
      directive,
      key,
      queryParams
    );
    const stringToSign = this.getStringToSign(
      dateString,
      datestamp,
      directive.region,
      canonicalRequest
    );
    const signature = this.getSignature(
      directive[this.secretKey],
      datestamp,
      directive.region,
      stringToSign
    );

    queryParams.set('X-Amz-Signature', signature);

    // Using S3 compatibility API URL format
    return `${directive.endpoint}/${directive.bucket}/${key}?${queryParams.toString()}`;
  },

  getCanonicalRequest: function (directive, key, queryParams) {
    const canonicalUri = `/${directive.bucket}/${key}`;
    const canonicalQueryString = queryParams.toString();
    const canonicalHeaders = `host:${new url.URL(directive.endpoint).host}\n`;
    const signedHeaders = 'host';
    const payloadHash = 'UNSIGNED-PAYLOAD';

    return [
      'PUT',
      canonicalUri,
      canonicalQueryString,
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join('\n');
  },

  getStringToSign: function (dateString, datestamp, region, canonicalRequest) {
    const hash = crypto
      .createHash('sha256')
      .update(canonicalRequest)
      .digest('hex');
    return [
      'AWS4-HMAC-SHA256',
      dateString,
      `${datestamp}/${region}/s3/aws4_request`,
      hash,
    ].join('\n');
  },

  getSignature: function (secretKey, datestamp, region, stringToSign) {
    const getSignatureKey = (key, dateStamp, regionName) => {
      const kDate = crypto
        .createHmac('sha256', `AWS4${key}`)
        .update(dateStamp)
        .digest();
      const kRegion = crypto
        .createHmac('sha256', kDate)
        .update(regionName)
        .digest();
      const kService = crypto
        .createHmac('sha256', kRegion)
        .update('s3')
        .digest();
      return crypto
        .createHmac('sha256', kService)
        .update('aws4_request')
        .digest();
    };

    const signingKey = getSignatureKey(secretKey, datestamp, region);
    return crypto
      .createHmac('sha256', signingKey)
      .update(stringToSign)
      .digest('hex');
  },
};
