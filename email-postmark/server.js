/* global Package */

import { Meteor } from 'meteor/meteor';
import { Email } from 'meteor/email';
import postmark from 'postmark';

// eslint-disable-next-line import/no-unresolved
import { getSettings } from 'meteor/quave:settings';

const PACKAGE_NAME = 'quave:email-postmark';
const settings = getSettings({ packageName: PACKAGE_NAME }) || {};

if (!settings.apiToken && !settings.devMode) {
  throw new Meteor.Error(
    'email-postmark: Settings are missing, at least "apiToken" and "from" are required.'
  );
}

function getClient() {
  if (settings.devMode) {
    return {
      sendEmail: async ({ To, Subject, HtmlBody }) => {
        // eslint-disable-next-line no-console
        console.log(PACKAGE_NAME, `${To}:${Subject}`);
        if (!settings.devModeOnlySubject) {
          // eslint-disable-next-line no-console
          console.log(PACKAGE_NAME, HtmlBody);
        }
        await Promise.resolve();
      },
    };
  }
  return new postmark.ServerClient(settings.apiToken);
}

const client = getClient();

export const getPostmarkClient = () => client;
export const createPostmarkClient = ({ apiToken }) =>
  new postmark.ServerClient(apiToken);

export const getPostmarkAccountClient = () =>
  new postmark.AccountClient(settings.accountApiToken);
export const createPostmarkAccountClient = ({ apiToken }) =>
  new postmark.AccountClient(apiToken);

export const sendEmail = async ({
  to,
  subject,
  content,
  from: fromParam,
  postmarkClient: clientParam,
  ...rest
}) => {
  const postmarkClient = clientParam || client;
  const from = fromParam || settings.from;
  if (!from) {
    throw new Meteor.Error(
      'email-postmark: Inform a global "from" in the settings or on each call'
    );
  }
  return postmarkClient.sendEmail({
    From: from,
    To: to,
    Subject: subject,
    HtmlBody: content,
    MessageStream: 'outbound',
    ...rest,
  });
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
        message: `email-postmark: Error sending email to ${to}`,
        error,
      });
    } else {
      console.error(`email-postmark: Error sending email to ${to}`, error);
    }
    throw error;
  }
};
