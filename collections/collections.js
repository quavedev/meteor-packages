import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

import { getSettings } from 'meteor/quave:settings';

// to load helpers
import './helpers';
// to load attachSchema
import './schema';

const PACKAGE_NAME = 'quave:collections';
const settings = getSettings({ packageName: PACKAGE_NAME });

const { isServerOnly, isVerbose } = settings;

/**
 * Copied from recompose https://github.com/acdlite/recompose/blob/master/src/packages/recompose/compose.js#L1
 * @param funcs
 * @returns {*|(function(*): *)}
 */
const compose = (...funcs) =>
  funcs.reduce(
    (a, b) =>
      (...args) =>
        a(b(...args)),
    (arg) => arg
  );

const getDbCollection = ({ name, helpers, instance, options }) => {
  let dbCollection = instance;
  if (!dbCollection) {
    dbCollection = new Mongo.Collection(name, options);
  }
  if (helpers) {
    dbCollection.helpers(helpers);
  }
  return dbCollection;
};

/**
 * Creates a new Meteor collection with enhanced functionality.
 * 
 * @param {Object} options - The options for creating the collection.
 * @param {string} [options.name] - The name of the collection. Required unless `instance` is provided.
 * @param {Object} [options.schema] - The SimpleSchema object for the collection.
 * @param {Object} [options.collection={}] - Additional properties to be added to the collection.
 * @param {Object} [options.helpers={}] - Helper functions to be attached to the collection's documents.
 * @param {Function} [options.apply=null] - A function to be applied to the collection after creation.
 * @param {Array<Function>} [options.composers=[]] - An array of composer functions to be applied to the collection.
 * @param {Mongo.Collection} [options.instance=null] - An existing Mongo.Collection instance to use instead of creating a new one.
 * @param {Object} [options.options={}] - Additional options to be passed to the Mongo.Collection constructor.
 * @returns {Mongo.Collection} The created or enhanced Mongo.Collection instance.
 * @throws {Error} If the collection name is missing when required or if collections are not allowed on the client.
 */
export const createCollection = ({
  name,
  schema,
  collection = {},
  helpers = {},
  apply = null,
  composers = [],
  instance: instanceParam = null,
  options = {},
}) => {
  try {
    if (isVerbose) {
      console.log(`${PACKAGE_NAME} ${name} settings`, settings);
    }

    const instance = instanceParam || (name === 'users' ? Meteor.users : null);

    if (!name && !instance) {
      throw new Error(
        "The option 'name' is required, unless you are using the option 'instance' that is not your case :)."
      );
    }
    if (Meteor.isClient && isServerOnly) {
      throw new Error(
        'Collections are not allowed in the client, you can disable this changing the setting `isServerOnly`'
      );
    }
    const dbCollection = getDbCollection({
      name,
      helpers,
      instance,
      options,
    });

    if (apply) {
      apply(dbCollection);
    }

    Object.assign(dbCollection, collection);
    Object.assign(dbCollection, compose(...composers)(dbCollection));
    if (schema) {
      dbCollection.attachSchema(schema);
    }
    return dbCollection;
  } catch (e) {
    console.error(
      `An error has happened when your collection${
        name ? ` "${name}"` : ''
      } was being created.`,
      e
    );
    throw e;
  }
};

export { persistable } from './composers/persistable';
export { softRemoval } from './composers/softRemoval';
