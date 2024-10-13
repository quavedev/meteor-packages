## CHANGELOG

### 3.0.3 (2024-10-13)

- Adds `isServerOnly` on `createCollection` function as an option.
- Adds tests.

### 3.0.2 (2024-10-10)

- Adds `persistable` composer
- Adds `softRemoval` composer

### 3.0.1 (2024-10-10)

- Adds types to the package

### 3.0.0 (2024-10-07)

- Incorporates collection2 code, removing eventemitter dependency
- Incorporates `collection-helpers` code
- Tested only for Meteor 3.0.3+
- Update installation to include `meteor npm i simpl-schema`
- Accepts `createCollection({name: 'users'})` to create Meteor default users collection
- Removes collection-hooks from readme but you still can use inside apply, make sure you test it with Meteor 3

### 2.0.1 (2023-03-22)

- Fixes `Exception running scheduled job TypeError: context.invalidKeys is not a function`
- Removes `import { checkNpmVersions } from 'meteor/tmeasday:check-npm-versions';` due to old typescript dependency

### 2.0.0 (2023-11-15)

- Compatible with Meteor 3.0 (hooks and helpers are still not supported tho)
- Removes `definition` option (and types) 

### 1.1.0 (2023-03-13)

- Composer now receives the collection object from Meteor already assigned to the `collection` property. Before it was getting only the collection property.
