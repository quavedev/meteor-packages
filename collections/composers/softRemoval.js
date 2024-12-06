const toSelector = (filter) => {
  if (typeof filter === 'string') {
    return { _id: filter };
  }
  return filter;
};

const filterOptions = (options = {}) => {
  if (options.includeSoftRemoved) {
    return {};
  }
  return { isRemoved: { $ne: true } };
};

/**
 * Creates a soft removal composer for a collection.
 *
 * @param {Mongo.Collection} collection - The collection to enhance with soft removal functionality.
 * @returns {Object} An enhanced collection with soft removal methods.
 */
export const softRemoval =
  ({ afterRemove = ({ doc }) => doc } = {}) =>
  (collection) => {
    const originalFind = collection.find.bind(collection);
    const originalFindOneAsync = collection.findOneAsync.bind(collection);
    const originalUpdateAsync = collection.updateAsync.bind(collection);
    const originalRemoveAsync = collection.removeAsync.bind(collection);
    // eslint-disable-next-line prefer-object-spread
    return Object.assign({}, collection, {
      find(selector, options) {
        return originalFind(
          {
            ...toSelector(selector),
            ...filterOptions(options),
          },
          options
        );
      },
      async findOneAsync(selector, options) {
        return originalFindOneAsync(
          {
            ...toSelector(selector),
            ...filterOptions(options),
          },
          options
        );
      },
      async removeAsync(
        selector,
        { shouldFetchFullDoc, hardRemove, ...options } = {}
      ) {
        const docsToRemove =
          shouldFetchFullDoc &&
          (await originalFind(toSelector(selector)).fetchAsync());

        if (hardRemove) {
          await originalRemoveAsync(selector);
          return afterRemove({ doc: docsToRemove, collection, isRemove: true });
        }

        await originalUpdateAsync(
          {
            ...toSelector(selector),
          },
          {
            $set: {
              ...(options.$set || {}),
              isRemoved: true,
              removedAt: new Date(),
            },
          },
          { multi: true }
        );

        return afterRemove({ doc: docsToRemove, collection, isRemove: true });
      },
    });
  };
