# quave:graphql

`quave:graphql` is a Meteor package that allows you to create your GraphQL server and client in a standard way.
  
## Why
Every application that wants to use GraphQL needs to connect some packages and some npm modules. Also need:
- Declare types and resolvers in separate files
- Log for errors
- Connect to Devtools

We believe we are not reinventing the wheel in this package but what we are doing is like putting together the wheels in the vehicle :).
  
## Installation

Meteor package
```sh
meteor add quave:graphql
```
Server NPM packages
```sh
meteor npm install @graphql-tools/schema graphql-load graphql
```
Client NPM packages
```sh
meteor npm install @apollo/client apollo-link-ddp
```

### Usage

#### Server
In the server you should call `startGraphQLServer` providing your types and your resolvers. This function needs to be called during the server start so you should place it in the files imported by your main server file.

Here you can check one example of [type](https://github.com/quavedev/graphql/blob/master/DateTimeTypeDef.js) and [resolver](https://github.com/quavedev/graphql/blob/master/DateTimeResolver.js).

See below how to use it:
```javascript
import { startGraphQLServer } from "meteor/quave:graphql/server";

import { logger } from 'meteor/quave:logs/logger';


import { DateTimeTypeDef } from "meteor/quave:graphql/DateTimeTypeDef";
import { DateTimeResolver } from "meteor/quave:graphql/DateTimeResolver";

const log = error => logger.error({ message: 'GraphQL server error', error })

startGraphQLServer({ typeDefs: [DateTimeTypeDef], resolvers: [DateTimeResolver], log });
```
`typeDefs` expects an array of types definitions (schemas) and `resolvers` expects an array of resolvers. You can use a single type definition and a single resolver but usually is better to split them in multiple files. 

You don't need to use `DateTimeTypeDef` and `DateTimeResolver` they are just examples.

You also don't need to provide a log function, by default it will log to console.error.

#### Client
In the client you should call `startGraphQLClient`, this is going to return an Apollo client already configured to you.
```javascript
import { startGraphQLClient } from "meteor/quave:graphql/client";

const apolloClient = startGraphQLClient({ connectToDevTools: true });
```
Then you can use the `apolloClient` as you want, see below two examples.
 
### Optional installations

#### React
To use GraphQL with React you probably want to have a provider around your app main component so you need to install `@apollo/react-hooks` 

```sh
meteor npm install @apollo/react-hooks
```

then you can use `ApolloProvider`

```javascript
import { startGraphQLClient } from "meteor/quave:graphql/client";

import { ApolloProvider } from '@apollo/react-hooks';

const apolloClient = startGraphQLClient({ connectToDevTools: true });

Meteor.startup(() => {
  render(
    <ApolloProvider client={apolloClient}>
      <App/>
    </ApolloProvider>, 
    document.getElementById('react-target')
  );
});
```

To write queries and mutations you are going to use `gql` and so install `graphql-tag`.

```sh
meteor npm install graphql-tag
```

And here is how to use with hooks, in this example we are using `useQuery` hook.

```javascript
import React from 'react';
import gql from 'graphql-tag';
import { useQuery } from '@apollo/react-hooks';

const nowQuery = gql`
  query Now {
    now {
      dateTime
    }
  }
`;

export const App = () => {
  const { loading, error, data } = useQuery(nowQuery);

  console.log('loading', loading);
  console.log('error', error);
  console.log('data', data);

  const today = data && data.now && new Date(data.now.dateTime);
  const dayOfMonth = today && today.getDate();
  const monthOfYear = today && today.getMonth() + 1;

  const welcome = loading ? <h1>loading</h1> :
    <h1>Welcome to quave:graphql ({dayOfMonth}/{monthOfYear})!</h1>;

  return (
    <div>
      {welcome}
    </div>
  );
};
```

#### No React
You can use this package in any app to setup GraphQL for you and then you can write queries and mutations using Apollo client or other wrappers, you will probably use `gql` then you should install `graphql-tag`

```sh
meteor npm install graphql-tag
```
and then use like this

```javascript
import { Meteor } from 'meteor/meteor';
import { startGraphQLClient } from "meteor/quave:graphql/client";

import gql from 'graphql-tag';

const apolloClient = startGraphQLClient({ connectToDevTools: true });

Meteor.startup(() => {
  apolloClient.query({
    query: gql`
      query Now {
        now {
          dateTime
        }
      }
    `
  }).then(({ data: { now }}) => console.log(now));
});
```

## Limitations
- It's not ready yet for auto-complete queries with IDEs, at least on WebStorm it's not working out-of-box.

### License

MIT
