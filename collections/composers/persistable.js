const getIdOrDocOrNullAsync = async ({
  collection,
  doc,
  selectorToFindId,
  shouldFetchFullDoc = false,
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
 * @param {Function} [options.beforeInsert=({doc}) => doc] - A function to modify the document before insertion.
 * @param {Function} [options.beforeUpdate=({doc}) => doc] - A function to modify the document before update.
 * @param {Function} [options.afterInsert=({doc}) => doc] - A function to do any additional actions after insertion.
 * @param {Function} [options.afterUpdate=({doc}) => doc] - A function to do any additional actions after update.
 * @returns {Function} A function that enhances a collection with a `save` method.
 */
export const persistable =
  ({
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
       * @param {boolean} [options.shouldFetchFullDoc] - If true, fetches the full existing document.
       * @returns {Promise<Object|null>} The saved document, or null if skipReturn is true.
       */
      async save(
        doc,
        { selectorToFindId, projection, skipReturn, shouldFetchFullDoc } = {}
      ) {
        const oldDoc = await getIdOrDocOrNullAsync({
          collection: this,
          doc,
          selectorToFindId,
          shouldFetchFullDoc,
        });
        if (oldDoc) {
          const { ...data } = doc;
          const dataToSave = { ...data, updatedAt: new Date() };
          await this.updateAsync(oldDoc._id, {
            $set: await beforeUpdate({
              collection: this,
              doc: dataToSave,
              isUpdate: true,
            }),
          });
          await afterUpdate({
            collection: this,
            oldDoc,
            doc: dataToSave,
            isUpdate: true,
          });

          if (skipReturn) {
            return null;
          }
          return this.findOneAsync(oldDoc._id, {
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
            collection: this,
            doc: dataToInsert,
            isInsert: true,
          })
        );
        await afterInsert({
          collection: this,
          doc: dataToInsert,
          isInsert: true,
        });
        if (skipReturn) {
          return null;
        }
        return this.findOneAsync(insertedId, {
          ...(projection && { projection }),
        });
      },
    });
