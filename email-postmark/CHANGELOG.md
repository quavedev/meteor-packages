# Changelog

## 1.3.0 (2024-09-25)

- Email.customTransport attached function is now async and rethrows errors
- Updates postmark dependency to 4.0.5

## 1.2.3 (2023-11-8)

- Adds email@3.0.0-alpha300.17 to versions of email, so it's compatible with Meteor 3.0 as well

## 1.2.2 (2023-11-8)

- Excludes email@1.0.0 from compatibility list

## 1.2.1 (2023-11-8)

- Adds email@3.0.0 to versions of email, so it's compatible with Meteor 3.0 as well
- Upgrades postmark dependency to latest (3.1.2)

## 1.2.0 (2023-09-02)

skipped

## 1.1.2 (2023-07-28)

- Adds a new setting `devModeOnlySubject` to log only the subject in dev mode

## 1.1.1 (2023-04-02)

- Adds a new setting `devMode` to disable sending emails in development mode
  - This mode also doesn't throw errors when the keys are missing

## 1.1.0 (2023-02-24)

- Exposes `createPostmarkClientAccount` to call `new postmark.AccountClient`
- `accountApiToken` prop to configure account client
- Exposes postmark account client (`getPostmarkClientAccount`)
- Updates from `postmark` npm package from 2.7.7 to 3.0.15

## 1.0.4 (2023-02-24)

- Exposes `createPostmarkClient` to call `new postmark.ServerClient`
- Option to create postmark client (`postmarkClient` prop) to `sendEmail`

## 1.0.3 (2023-02-24)

- Resting all params to `sendEmail` call

## 1.0.2 (2023-02-24)

- Exposes postmark client (`getPostmarkClient`)

## 1.0.0 (2021-09-30)

- Initial version.
