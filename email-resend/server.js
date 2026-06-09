/* global Package */

import { Meteor } from 'meteor/meteor';
import { Email } from 'meteor/email';
import { Resend } from 'resend';

// eslint-disable-next-line import/no-unresolved
import { getSettings } from 'meteor/quave:settings';

const PACKAGE_NAME = 'quave:email-resend';
const settings = getSettings({ packageName: PACKAGE_NAME }) || {};

function createDevModeClient() {
  return {
    emails: {
      send: async ({ to, subject, html }) => {
        // eslint-disable-next-line no-console
        console.log(PACKAGE_NAME, `${to}:${subject}`);
        if (!settings.devModeOnlySubject) {
          // eslint-disable-next-line no-console
          console.log(PACKAGE_NAME, html);
        }
        await Promise.resolve();
      },
    },
  };
}

function getClient() {
  if (settings.devMode) {
    return createDevModeClient();
  }
  if (!settings.apiKey) {
    throw new Meteor.Error(
      'email-resend: Settings are missing, "apiKey" is required.'
    );
  }
  return new Resend(settings.apiKey);
}

let client;

export const getResendClient = () => {
  if (!client) {
    client = getClient();
  }
  return client;
};

export const createResendClient = ({ apiKey }) => new Resend(apiKey);

const getResendTags = ({ tag }) => {
  if (!tag) {
    return undefined;
  }
  return [{ name: 'category', value: tag }];
};

const throwResendErrorIfNeeded = ({ result }) => {
  if (!result?.error) {
    return result;
  }

  throw new Meteor.Error(
    'email-resend: Error sending email',
    result.error.message
  );
};

export const sendEmail = async ({
  to,
  subject,
  content,
  from: fromParam,
  resendClient: clientParam,
  Cc,
  Bcc,
  ReplyTo,
  Tag,
  ...rest
}) => {
  const resendClient = clientParam || getResendClient();
  const from = fromParam || settings.from;
  if (!from) {
    throw new Meteor.Error(
      'email-resend: Inform a global "from" in the settings or on each call'
    );
  }

  const { MessageStream: _messageStream, ...resendRest } = rest;

  const result = await resendClient.emails.send({
    from,
    to,
    subject,
    html: content,
    ...(Cc && { cc: Cc }),
    ...(Bcc && { bcc: Bcc }),
    ...(ReplyTo && { replyTo: ReplyTo }),
    ...(Tag && { tags: getResendTags({ tag: Tag }) }),
    ...resendRest,
  });
  return throwResendErrorIfNeeded({ result });
};

Email.customTransport = async (options) => {
  const { to, subject, html } = options;
  const overrideOptions = Email.overrideOptionsBeforeSend
    ? Email.overrideOptionsBeforeSend(options)
    : {};
  try {
    await sendEmail({
      to,
      subject,
      content: html,
      ...overrideOptions,
    });
    if (settings.isVerbose) {
      // eslint-disable-next-line no-console
      console.log(`Email sent to ${to}`);
    }
  } catch (error) {
    if (Package['quave:logs']) {
      Package['quave:logs'].logger.error({
        message: `email-resend: Error sending email to ${to}`,
        error,
      });
    } else {
      console.error(`email-resend: Error sending email to ${to}`, error);
    }
    throw error;
  }
};
