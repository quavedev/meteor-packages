const crypto = Npm.require('crypto');
const url = Npm.require('url');

Slingshot.CloudflareR2 = {
  accessId: 'AccessKeyId',
  secretKey: 'SecretAccessKey',

  directiveMatch: {
    bucket: String,
    accountId: String,
    endpoint: String,
    cdn: String,
    region: Match.Optional(String),
    AccessKeyId: String,
    SecretAccessKey: String,
    key: Match.OneOf(String, Function),
    expire: Match.Where(function (expire) {
      check(expire, Number);
      return expire > 0;
    }),
  },

  directiveDefault: {
    region: 'auto',
    expire: 5 * 60 * 1000,
  },

  getContentDisposition: async function (method, directive, file, meta) {
    var getContentDisposition = directive.contentDisposition;

    if (!_.isFunction(getContentDisposition)) {
      getContentDisposition = function () {
        var filename = file.name && encodeURIComponent(file.name);

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
    try {
      const policy = new Slingshot.StoragePolicy()
        .expireIn(directive.expire)
        .contentLength(0, Math.min(file.size, directive.maxSize || Infinity));

      let key;
      if (_.isFunction(directive.key)) {
        key = await Promise.resolve(directive.key.call(method, file, meta));
      } else {
        key = directive.key;
      }

      const signedUrl = await this.getSignedUrl(directive, key, file.type);

      const downloadUrl = `${directive.cdn}/${key}`

      return {
        upload: signedUrl,
        download: downloadUrl,
        postData: [],
      };
    } catch (error) {
      console.error('Error in CloudflareR2 upload:', error);
      throw error;
    }
  },

  getSignedUrl: async function (directive, key, contentType) {
    try {
      const date = new Date();
      const dateString = date.toISOString().replace(/[:-]|\.\d{3}/g, '');
      const datestamp = dateString.slice(0, 8);
      const credential = `${directive[this.accessId]}/${datestamp}/${
        directive.region
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

      return `${directive.endpoint}/${
        directive.bucket
      }/${key}?${queryParams.toString()}`;
    } catch (error) {
      console.error('Error in getSignedUrl:', error);
      throw error;
    }
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
