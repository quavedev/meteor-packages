const getIdOrDocOrNullAsync = async ({
  collection,
  doc,
  selectorToFindId,
  shouldFetchFullDoc,
}) => {
  if (doc._id) {
    return shouldFetchFullDoc
      ? collection.findOneAsync(doc._id)
      : { _id: doc._id };
  }

  if (!selectorToFindId) {
    return null;
  }

  const options = shouldFetchFullDoc ? {} : { projection: { _id: 1 } };
  return collection.findOneAsync(selectorToFindId, options);
};

/**
 * Creates a persistable composer for a collection.
 *
 * @param {Object} options - The options for the persistable composer.
 * @param {boolean} [options.shouldFetchFullDoc] - If true, fetches the full existing document.
 * @param {Function} [options.beforeInsert=({doc}) => doc] - A function to modify the document before insertion.
 * @param {Function} [options.beforeUpdate=({doc}) => doc] - A function to modify the document before update.
 * @param {Function} [options.afterInsert=({doc}) => doc] - A function to do any additional actions after insertion.
 * @param {Function} [options.afterUpdate=({doc}) => doc] - A function to do any additional actions after update.
 * @returns {Function} A function that enhances a collection with a `save` method.
 */
export const persistable =
  ({
     shouldFetchFullDoc = false,
    beforeInsert = ({ doc }) => doc,
    beforeUpdate = ({ doc }) => doc,
    afterInsert = ({ doc }) => doc,
    afterUpdate = ({ doc }) => doc,
  } = {}) =>
  (collection) =>
    // eslint-disable-next-line prefer-object-spread
    Object.assign({}, collection, {
      /**
       * Saves a document to the collection, either by inserting a new one or updating an existing one.
       *
       * @param {Object} doc - The document to save.
       * @param {Object} options - Options for the save operation.
       * @param {Object} [options.selectorToFindId] - A selector to find an existing document's ID.
       * @param {Object} [options.projection] - The projection to use when returning the saved document.
       * @param {boolean} [options.skipReturn] - If true, doesn't return the saved document.
       * @returns {Promise<Object|null>} The saved document, or null if skipReturn is true.
       */
      async save(
        doc,
        { selectorToFindId, projection, skipReturn } = {}
      ) {
        const self = this;

        const oldDoc = await getIdOrDocOrNullAsync({
          collection: self,
          doc,
          selectorToFindId,
          shouldFetchFullDoc,
        });
        if (oldDoc) {
          const { ...data } = doc;
          const dataToSave = { ...data, updatedAt: new Date() };
          await self.updateAsync(oldDoc._id, {
            $set: await beforeUpdate({
              collection: self,
              doc: dataToSave,
              isUpdate: true,
            }),
          });
          await afterUpdate({
            collection: self,
            oldDoc,
            doc: dataToSave,
            isUpdate: true,
          });

          if (skipReturn) {
            return null;
          }
          return self.findOneAsync(oldDoc._id, {
            ...(projection && { projection }),
          });
        }

        const dataToInsert = {
          ...doc,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        const insertedId = await this.insertAsync(
          await beforeInsert({
            collection: self,
            doc: dataToInsert,
            isInsert: true,
          })
        );
        await afterInsert({
          collection: self,
          doc: dataToInsert,
          isInsert: true,
        });
        if (skipReturn) {
          return null;
        }
        return self.findOneAsync(insertedId, {
          ...(projection && { projection }),
        });
      },
    });
