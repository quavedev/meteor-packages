# quave:react-data

`quave:react-data` is a Meteor package that allows you to subscribe to publications and also call methods.

Features

- Call methods with await
- Subscribe to data with skip logic
- Deps array to resubscribe

## Why

Almost every Meteor application with React is using Subscriptions and Methods, so it's helpful to provide React Hooks ready to use in common cases.

## Installation

```sh
meteor add quave:react-data
```

## Usage

Both methods listed below rely on the idea of providing a single object to `Meteor.call` and also to `Meteor.subscribe` as the second parameter.

It means that you should send the data to the server putting in the arg field.

For example, instead of using `Meteor.call('myMethod', param1, param2);` you should do  `Meteor.call('myMethod', { param1, param2 });`. Of course, using the `method` provided instead of `Meteor.call`. 

The same for `Meteor.subscribe` but also using `useData` and in this case, as we have many ways to use it, you should use a named property called `arg` to send your arguments to the server.

We have decided this way because of our long experience with Meteor projects and as these calls are creating contracts (APIs) between the client and the server clear named objects are better in the long term than positional arguments. This will make your Meteor project more reliable in the long term and easier to maintain.

### `useMethod`

Return a `method` function that is async. You can call it with a method name and an argument.

Example:
```jsx
import { useMethod } from 'meteor/quave:react-data';

export const Snapshot = () => {
  const { method } = useMethod();

  const save = async () => {
    const snapshot = await method('saveSnapshot', {
      snapshot: {
        _id: snapshotId,
        items
      },
    });
    clear();
  };
  
  // continue to render...
}
```

You can also provide options for `useMethod` such as:

- `onExpectedError`: it's called with the `reason` field of the error when 
  provided in an `EXPECTED_ERROR`. Otherwise, you can also set a custom default 
  text with `QuaveReactData.setDefaultExpectedErrorReason` method for all 
  expected errors or it will pass `Unknown error` text.
  - `openAlert` (deprecated): it will work because onExpectedError has the 
    same behavior, so if will provide openAlert option we will consider it 
  the same as onExpectedError, prefer `onExpectedError` to avoid breaking 
    changes in the future.
- `onError`:  it's called with the error even when it's expected, so 
  it will be called for any error. It's useful when you want to log errors 
  for example. The promise will also be rejected with this error right after 
  this is invoked.
- `onSuccess`: it's called with the result of your method when it finishes 
  without errors. The promise will also be resolved with this result right 
  after this is invoked.

### `useData`

Subscribe to a publication and find the data.

Example:
```jsx
import { useData } from 'meteor/quave:react-data';
import { useLoggedUser } from 'meteor/quave:logged-user-react';

export const Home = () => {
  const { loggedUser } = useLoggedUser();
  
  const {
    data: snapshots,
    loading
  } = useData({
    publicationName: 'mySnapshots',
    skip: !loggedUser,
    find: () => SnapshotsCollection.find({}, { sort: { at: -1 } }),
  });

  // continue to render...
}
```

A more complex example:
```jsx
import { useData } from 'meteor/quave:react-data';

export const Snapshot = () => {
  const navigate = useNavigate();
  const snapshotId = useParams()[RouteParams.SNAPSHOT_ID];

  const { data: snapshotItems } = useData({
    publicationName: 'mySnapshots',
    arg: { snapshotId },
    skip: !snapshotId,
    deps: [snapshotId],
    dataReturnWhenLoading: [],
    find: () =>
      SnapshotItemsCollection.find({ snapshotId }, { sort: { at: -1 } }),
  });

  // continue to render...
}
```

`shouldSkip` property is also available, it works like skip, but it is a function instead of a static property.

### Extra Features

#### `EXPECTED_ERROR_SERVER`

When you call a method and the server returns an error, we check if the 
error is an expected error. To throw this error in the server you can use 
this constant `EXPECTED_ERROR`. It is exported from the package.

import { EXPECTED_ERROR } from 'meteor/quave:react-data';

#### `meteorCallPromisified`

To avoid workarounds and non-standard
way to call simple methods when you don't have a React component.

It implements just a `Meteor.call` wrapped in a Promise to get result or error.

#### `setGetAdditionalArgsFunction`

In some cases is nice to inject some argument in all the method calls and subscribes, for example, providing the language from the client or timezone.

We export a method called `setGetAdditionalArgsFunction` so you can provide additional args for all the calls and subscribe in a single place.

Example:

```js
import React from 'react';
import { Meteor } from 'meteor/meteor';
import { createRoot } from 'react-dom/client';
import { App } from '../app/general/App';
import { setGetAdditionalArgsFunction } from 'meteor/quave:react-data';
import { getLanguage } from '../imports/infra/languages';

setGetAdditionalArgsFunction(() => {
  const language = getLanguage();
  return { filter: { language } };
});

Meteor.startup(() => {
  const root = createRoot(document.getElementById('app'));
  root.render(<App />);
});
```

### License

MIT