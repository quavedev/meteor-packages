import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Tinytest } from 'meteor/tinytest';
import {
  createCollection,
  persistable,
  softRemoval,
} from 'meteor/quave:collections';
import SimpleSchema from 'simpl-schema';

Tinytest.add('createCollection - basic creation', function (test) {
  const TestCollection = createCollection({
    name: 'testCollection',
    options: {
      _suppressSameNameError: true,
    }
  });

  test.instanceOf(
    TestCollection,
    Mongo.Collection,
    'Should return a Mongo.Collection instance'
  );
  test.equal(
    TestCollection._name,
    'testCollection',
    'Collection name should be set correctly'
  );
});

Tinytest.add('createCollection - with schema', function (test) {
  const TestSchema = new SimpleSchema({
    name: String,
    age: SimpleSchema.Integer,
  });

  const TestCollection = createCollection({
    name: 'testSchemaCollection',
    schema: TestSchema,
    options: {
      _suppressSameNameError: true,
    }
  });

  test.isTrue(
    TestCollection.simpleSchema() instanceof SimpleSchema,
    'Should have a SimpleSchema attached'
  );
});


if (Meteor.isServer) {

Tinytest.addAsync('createCollection - with helpers', async function (test) {
  const TestCollection = createCollection({
    name: 'testHelpersCollection',
    helpers: {
      fullName() {
        return `${this.firstName} ${this.lastName}`;
      },
    },
    options: {
      _suppressSameNameError: true,
    }
  });

  const docId = await TestCollection.insertAsync({
    firstName: 'John',
    lastName: 'Doe',
  });
  const doc = await TestCollection.findOneAsync(docId);

  test.equal(doc.fullName(), 'John Doe', 'Helper method should work correctly');
});

Tinytest.addAsync(
  'createCollection - with persistable composer',
  async function (test) {
    const TestCollection = createCollection({
      name: 'testPersistableCollection',
      composers: [persistable()],
      options: {
        _suppressSameNameError: true,
      }
    });

    const doc = await TestCollection.save({ name: 'Test Document' });

    test.isNotUndefined(doc._id, 'Document should be inserted and have an _id');
    test.isNotUndefined(
      doc.createdAt,
      'Document should have a createdAt timestamp'
    );
    test.isNotUndefined(
      doc.updatedAt,
      'Document should have an updatedAt timestamp'
    );

    const updatedDoc = await TestCollection.save({
      _id: doc._id,
      name: 'Updated Document',
    });

    test.equal(
      updatedDoc._id,
      doc._id,
      'Updated document should have the same _id'
    );
    test.equal(
      updatedDoc.name,
      'Updated Document',
      'Document should be updated'
    );
    test.isTrue(
      updatedDoc.updatedAt > doc.updatedAt,
      'updatedAt should be more recent'
    );
  }
);


  Tinytest.addAsync(
    'createCollection - with softRemoval composer',
    async function (test) {
      const TestCollection = createCollection({
        name: 'testSoftRemovalCollection',
        composers: [softRemoval],
        options: {
          _suppressSameNameError: true,
        }
      });
  
  
      const docId = await TestCollection.insertAsync({ name: 'Test Document' });
  
      await TestCollection.removeAsync(docId);
  
      const removedDoc = await TestCollection.findOneAsync(docId);
      test.isUndefined(
        removedDoc,
        'Document should not be found in normal query'
      );
  
      const softRemovedDoc = await TestCollection.findOneAsync(docId, {
        includeSoftRemoved: true,
      });
      test.isNotNull(
        softRemovedDoc,
        'Document should be found when including soft removed'
      );
      test.isTrue(
        softRemovedDoc.isRemoved,
        'Document should be marked as removed'
      );
    }
  );
  Tinytest.add('createCollection - server-only collection', function (test) {
    const ServerCollection = createCollection({
      name: 'serverOnlyCollection',
      isServerOnly: true,
      options: {
        _suppressSameNameError: true,
      }
    });

    test.instanceOf(
      ServerCollection,
      Mongo.Collection,
      'Should return a Mongo.Collection instance on server'
    );
  });
}

if (Meteor.isClient) {
  Tinytest.add(
    'createCollection - server-only collection on client',
    function (test) {
      try {
        createCollection({
          name: 'serverOnlyCollection',
          isServerOnly: true
        });
        test.fail('Should have thrown an error');
      } catch (error) {
        console.log(error.reason);
        test.isTrue(
          error.error.includes('collection is not allowed in the client'),
          'Should throw an error when creating a server-only collection on the client'
        );
      }
    }
  );
}
