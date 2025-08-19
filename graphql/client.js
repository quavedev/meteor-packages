import {InMemoryCache} from '@apollo/client';
import ApolloClient from '@apollo/client';
import {onError} from '@apollo/client/link/error';
import {DDPLink} from '@swydo/apollo-link-ddp';

const link = onError(({graphQLErrors, networkError}) => {
  if (graphQLErrors) {
    graphQLErrors.map(({message, locations, path, ...rest}) =>
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
        rest
      )
    );
  }

  if (networkError) console.error('[Network error]: ', networkError);
});

export const startGraphQLClient = ({connectToDevTools = false} = {}) => new ApolloClient({
  link: link.concat(new DDPLink()),
  cache: new InMemoryCache(),
  connectToDevTools,
});
