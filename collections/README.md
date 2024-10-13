# quave:collections

`quave:collections` is a Meteor package that allows you to create your collections in a standard way.

Features

- Schemas
- Helpers
- Composers

> Compatible with Meteor 3.0.3+

## Why

Every application that connects to databases usually need the following features:

- A way to access object instances when they come from the database: helpers
- Provide new methods to collections: collection
- Valid the data before persisting: schemas
- Centralize behaviors: composers

Meteor has packages for almost all these use cases but it's not easy to find the best in each case and also how to use them together, that is why we have created this package.

We offer here a standard way for you to create your collections by configuring all these features in a function call `createCollection` using a bunch of options in a declarative way and without using Javascript classes.

We also allow you to extend your `Meteor.users` collection in the same way as any other collection.

We believe we are not reinventing the wheel in this package but what we are doing is like putting together the wheels in the vehicle :).

## Installation

```sh
meteor add quave:collections
meteor npm install simpl-schema@3.4.6
```

## Usage

### Methods

Example applying `collection` property:

```js
import { createCollection } from 'meteor/quave:collections';

export const AddressesCollection = createCollection({
  name: 'addresses',
  collection: {
    save(addressParam) {
      const address = { ...addressParam };

      if (address._id) {
        this.update(address._id, { $set: { ...address } });
        return address._id;
      }
      delete address._id;
      return this.insert({ ...address });
    },
  },
});
```

### Schema

Example applying `SimpleSchema`:

```js
import { createCollection } from 'meteor/quave:collections';

import SimpleSchema from 'simpl-schema';

const PlayerSchema = new SimpleSchema({
  name: {
    type: String,
  },
  age: {
    type: SimpleSchema.Integer,
  },
});

export const PlayersCollection = createCollection({
  name: 'players',
  schema: PlayerSchema,
});
```

### Composers

#### Built-in composers

##### persistable

The `persistable` composer adds a `save` method to your collection, which handles both inserting new documents and updating existing ones. It also automatically manages `createdAt` and `updatedAt` fields.

To use the `persistable` composer:

```js
import { createCollection, persistable } from 'meteor/quave:collections';

export const UsersCollection = createCollection({
  name: 'users',
  composers: [persistable()],
});
```

The `save` method can be used as follows:

```js
// Insert a new document
const newUser = await UsersCollection.save({
  name: 'John Doe',
  email: 'john@example.com',
});

// Update an existing document
const updatedUser = await UsersCollection.save({
  _id: newUser._id,
  name: 'John Updated',
});

// Save with custom selector to find existing document
const user = await UsersCollection.save(
  { email: 'john@example.com', name: 'John Doe' },
  { selectorToFindId: { email: 'john@example.com' } }
);

// Save without returning the document
await UsersCollection.save({ name: 'Alice' }, { skipReturn: true });

// Save and return only specific fields
const savedUser = await UsersCollection.save(
  { name: 'Bob' },
  { projection: { name: 1 } }
);
```

You can also customize the `persistable` composer by providing `beforeInsert` and `beforeUpdate` functions:

```js
const customPersistable = persistable({
  beforeInsert: ({ doc }) => {
    // Modify the document before insertion
    return { ...doc, customField: 'value' };
  },
  beforeUpdate: ({ doc }) => {
    // Modify the document before update
    return { ...doc, lastModified: new Date() };
  },
});

export const CustomUsersCollection = createCollection({
  name: 'customUsers',
  composers: [customPersistable],
});
```

The `persistable` composer provides a convenient way to handle document persistence with automatic timestamp management and customizable pre-save hooks.

##### softRemoval

The `softRemoval` composer adds soft deletion functionality to your collection. Instead of permanently deleting documents, it marks them as removed and filters them out of normal queries.

To use the `softRemoval` composer:

```js
import { createCollection, softRemoval } from 'meteor/quave:collections';

export const UsersCollection = createCollection({
  name: 'users',
  composers: [softRemoval],
});

// Example of soft removal
const user = await UsersCollection.insertAsync({ name: 'John Doe' });
await UsersCollection.removeAsync(user._id);

// The user is not actually removed, but marked as removed (using option includeSoftRemoved)
const removedUser = await UsersCollection.findOneAsync(
  { _id: user._id },
  { includeSoftRemoved: true }
);
console.log(removedUser); // { _id: ..., name: 'John Doe', isRemoved: true }

// The user seems to be removed
const removedUser2 = await UsersCollection.findOneAsync({ _id: user._id });
console.log(removedUser2); // null
```

#### Create your own composer

Example creating a way to paginate the fetch of data using `composers`

```js
import { createCollection } from 'meteor/quave:collections';

const LIMIT = 7;
export const paginable = (collection) =>
  Object.assign({}, collection, {
    getPaginated({ selector, options = {}, paginationAction }) {
      const { skip, limit } = paginationAction || { skip: 0, limit: LIMIT };
      const items = this.find(selector, {
        ...options,
        skip,
        limit,
      }).fetch();
      const total = this.find(selector).count();
      const nextSkip = skip + limit;
      const previousSkip = skip - limit;

      return {
        items,
        pagination: {
          total,
          totalPages: parseInt(total / limit, 10) + (total % limit > 0 ? 1 : 0),
          currentPage:
            parseInt(skip / limit, 10) + (skip % limit > 0 ? 1 : 0) + 1,
          ...(nextSkip < total ? { next: { skip: nextSkip, limit } } : {}),
          ...(previousSkip >= 0
            ? { previous: { skip: previousSkip, limit } }
            : {}),
        },
      };
    },
  });

export const StoresCollection = createCollection({
  name: 'stores',
  composers: [paginable],
});

// This probably will come from the client, using Methods, REST, or GraphQL
// const paginationAction = {skip: XXX, limit: YYY};

const { items, pagination } = StoresCollection.getPaginated({
  selector: {
    ...(search ? { name: { $regex: search, $options: 'i' } } : {}),
  },
  options: { sort: { updatedAt: -1 } },
  paginationAction,
});
```

### Options

Second argument for the default [collections constructor](https://docs.meteor.com/api/collections.html#Mongo-Collection).
Example defining a transform function.

```js
const transform = (doc) => ({
  ...doc,
  get user() {
    return Meteor.users.findOne(this.userId);
  },
});

export const PlayersCollection = createCollection({
  name: 'players',
  schema,
  options: {
    transform,
  },
});
```

### Meteor.users

Extending Meteor.users, also using `collection`, `helpers`, `composers`, `apply`.

You can use all these options also with `name` instead of `instance`.

```js
import { createCollection } from 'meteor/quave:collections';

export const UsersCollection = createCollection({
  instance: Meteor.users,
  schema: UserTypeDef,
  collection: {
    isAdmin(userId) {
      const user = userId && this.findOne(userId, { fields: { profiles: 1 } });
      return (
        user && user.profiles && user.profiles.includes(UserProfile.ADMIN.name)
      );
    },
  },
  helpers: {
    toPaymentGatewayJson() {
      return {
        country: 'us',
        external_id: this._id,
        name: this.name,
        type: 'individual',
        email: this.email,
      };
    },
  },
  composers: [paginable],
  apply(coll) {
    coll.after.insert(userAfterInsert(coll), { fetchPrevious: false });
    coll.after.update(userAfterUpdate);
  },
});
```

### Publishing

Bump the version following semver in `package.js` and run `meteor test-packages ./` to make sure all the tests are passing.

Then publish the package:

```sh
meteor publish
```

### License

MIT
