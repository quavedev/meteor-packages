# quave:logged-user-react

`quave:logged-user-react` is a Meteor package that provides a plug-and-play React hook to get the logged user.

## Why

It is designed to simplify the process of getting the logged user using React hooks.

We believe we are not reinventing the wheel in this package but what we are doing is like putting together the wheels in the vehicle :).

## Installation

```sh
meteor add quave:logged-user-react
```

## Usage

### Code usage

If you want to obtain the logged user in your React component the React hook `useLoggedUser` is provided, see the example below:

```javascript
import React from 'react';
import { useHistory } from 'react-router-dom';
import { useLoggedUser } from 'meteor/quave:logged-user-react';
import { RoutePaths } from '../general/RoutePaths';

export const Home = () => {
  const history = useHistory();
  const { loggedUser, isLoadingLoggedUser } = useLoggedUser();

  return (
    <>
      <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">
        <span className="block">Ready to use Meteor?</span>
        <span className="block text-indigo-600">Template by quave</span>

        <div>
          <a
            onClick={() =>
              loggedUser ? Meteor.logout() : history.push(RoutePaths.ACCESS)
            }
            className={`text-base font-medium text-indigo-700 hover:text-indigo-600 cursor-pointer ${
              isLoadingLoggedUser ? 'invisible' : ''
            }`}
          >
            {loggedUser ? 'Log out' : 'Access'}
            <span aria-hidden="true"> &rarr;</span>
          </a>
        </div>
      </h2>

      <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
        <div className="inline-flex rounded-md shadow">
          <a
            target="_blank"
            href="https://www.quave.dev"
            className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Visit quave.dev
          </a>
        </div>
      </div>
    </>
  );
};
```

In the example besides getting the logged user we are also getting `isLoadingLoggedUser`, it is helpful to avoid flashing elements while your page is loading. If you remove the class added when `isLoadingLoggedUser` is true you are going to see the `Visite quave.dev` button changing its position during the load of user data.

## Limitations

N/A

### License

MIT

