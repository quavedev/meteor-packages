# Changelog

## 2.1.0 (2024-10-07)

- This is actually 2.0.9 but as Meteor 3.0.3 is failing to publish only metadata I bumped the version to 2.1.0.

## 2.0.9 (2024-10-07)

- Adds `onSuccess` function, it's called after the job is finished successfully and persisted. It receives the following props inside an object: 
  - `intendedAt`: The Date object representing the intended execution time of the job.
  - `name`: A string containing the name of the job.
  - `output`: The result returned by the job function.

- Adds `onError` function, it's called when the job function throws an error and after it is persisted. It receives the following props inside an object:
  - `error`: The error object.
  - `name`: A string containing the name of the job.
  - `intendedAt`: The Date object representing the intended execution time of the job.


## 2.0.8 (2024-8-30)

- Compatible with Meteor 3.0.2

## 2.0.7 (2024-05-31)

- Correctly wait for jobs to run and make `SyncedCron.run` correctly finish before returning.

## 2.0.6 (2024-05-31)

- Remove `SyncedCron.setCollectionOptions`

## 2.0.5 (2024-05-31)

- Add `SyncedCron.setCollectionOptions` to pass options to the collection that is created

## 2.0.4 (2024-05-25)

- Fix version with new Meteor@3.0-rc.2
- Add `SyncedCron.run` to run the job "now"

## 2.0.3 (2024-03-28)

- Fixes detection for expected: Failed validation E11000 duplicate key error collection. The new Node.js MongoDB driver doesn't provide the error code anymore as an integer. Now it's informed in the error message.

## 2.0.2 (2023-11-8)

- Meteor 3 release issues, I had to run `chmod +rw .npm/package` for it to work.

## 2.0.1 (2023-11-8)

This release failed but the content is present in the next.

## 2.0.0 (2023-11-8)

This release failed but the content is present in the next.

- Migrates `later` to `@breejs/later@4.1.0`
- Moves away from `underscore`
- Moves away from `var` usage
- Upgrades code to Meteor 3
- Upgrades tests to Meteor 3 (async tests)

## 1.5.1 - littledata:synced-cron

- Initial [version](https://github.com/percolatestudio/meteor-synced-cron).
