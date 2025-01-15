/* global Package */

import { Meteor } from 'meteor/meteor';
import { Email } from 'meteor/email';
import sgMail from '@sendgrid/mail';

// eslint-disable-next-line import/no-unresolved
import { getSettings } from 'meteor/quave:settings';

const PACKAGE_NAME = 'quave:email-sendgrid';
const settings = getSettings({ packageName: PACKAGE_NAME }) || {};

if (!settings.apiToken && !settings.devMode) {
  throw new Meteor.Error(
    'email-sendgrid: Settings are missing, "apiToken" is required.'
  );
}

function getClient() {
  if (settings.devMode) {
    return {
      send: async ({ to, subject, html }) => {
        // eslint-disable-next-line no-console
        console.log(PACKAGE_NAME, `${to}:${subject}`);
        if (!settings.devModeOnlySubject) {
          // eslint-disable-next-line no-console
          console.log(PACKAGE_NAME, html);
        }
        await Promise.resolve();
      },
    };
  }
  sgMail.setApiKey(settings.apiToken);
  return sgMail;
}

const client = getClient();

export const getSendGridClient = () => client;
export const createSendGridClient = ({ apiToken }) => {
  const newClient = sgMail;
  newClient.setApiKey(apiToken);
  return newClient;
};

export const sendEmail = async ({
  to,
  subject,
  content,
  from: fromParam,
  sendGridClient: clientParam,
  ...rest
}) => {
  const sendGridClient = clientParam || client;
  const from = fromParam || settings.from;
  if (!from) {
    throw new Meteor.Error(
      'email-sendgrid: Inform a global "from" in the settings or on each call'
    );
  }
  return sendGridClient.send({
    from,
    to,
    subject,
    html: content,
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
        message: `email-sendgrid: Error sending email to ${to}`,
        error,
      });
    } else {
      console.error(`email-sendgrid: Error sending email to ${to}`, error);
    }
    throw error;
  }
};
