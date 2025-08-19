import {setup} from 'meteor/orderlion:ddp-apollo';
import {makeExecutableSchema} from '@graphql-tools/schema';
import {getSchema, load} from '@graphql-tools/load';

const defaultLog = e => console.error('GraphQL server error', e);

export const startGraphQLServer = ({typeDefs, resolvers, log}) => {
  load({
    typeDefs,
    resolvers,
  });
  const schema = makeExecutableSchema({
    ...getSchema(),
    logger: { log: log || defaultLog },
  });
  setup({schema});
};
