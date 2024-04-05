# Changelog

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
