const getIdForDocOrNullAsync = async ({
  collection,
  doc,
  selectorToFindId,
}) => {
  if (doc._id) {
    return doc._id;
  }
  if (!selectorToFindId) {
    return null;
  }

  const docDb = await collection.findOneAsync(selectorToFindId, {
    projection: { _id: 1 },
  });
  return docDb?._id;
};

/**
 * Creates a persistable composer for a collection.
 *
 * @param {Object} options - The options for the persistable composer.
 * @param {Function} [options.beforeInsert=({doc}) => doc] - A function to modify the document before insertion.
 * @param {Function} [options.beforeUpdate=({doc}) => doc] - A function to modify the document before update.
 * @returns {Function} A function that enhances a collection with a `save` method.
 */
export const persistable =
  ({ beforeInsert = ({ doc }) => doc, beforeUpdate = ({ doc }) => doc } = {}) =>
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
      async save(doc, { selectorToFindId, projection, skipReturn } = {}) {
        const _id = await getIdForDocOrNullAsync({
          collection,
          doc,
          selectorToFindId,
        });
        if (_id) {
          const { ...data } = doc;
          const dataToSave = { ...data, updatedAt: new Date() };
          await this.updateAsync(_id, {
            $set: await beforeUpdate({
              collection: this,
              doc: dataToSave,
              isUpdate: true,
            }),
          });

          if (skipReturn) {
            return null;
          }
          return this.findOneAsync(_id, { ...(projection && { projection }) });
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
        if (skipReturn) {
          return null;
        }
        return this.findOneAsync(insertedId, {
          ...(projection && { projection }),
        });
      },
    });
