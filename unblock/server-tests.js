/* global Meteor Tinytest */

const METHOD_NAME = 'quave:unblock/test.method';
const PUBLICATION_NAME = 'quave:unblock/test.publication';

Tinytest.add('quave:unblock - methods unblock before running', (test) => {
  let unblocked = false;
  Meteor.methods({
    [METHOD_NAME](value) {
      test.isTrue(unblocked);
      return value;
    },
  });

  const result = Meteor.server.method_handlers[METHOD_NAME].call(
    {
      unblock() {
        unblocked = true;
      },
    },
    'method result'
  );

  test.equal(result, 'method result');
  test.isTrue(unblocked);
  delete Meteor.server.method_handlers[METHOD_NAME];
});

Tinytest.add('quave:unblock - publications unblock before running', (test) => {
  let unblocked = false;
  Meteor.publish(PUBLICATION_NAME, (value) => {
    test.isTrue(unblocked);
    return value;
  });

  const result = Meteor.server.publish_handlers[PUBLICATION_NAME].call(
    {
      unblock() {
        unblocked = true;
      },
    },
    'publication result'
  );

  test.equal(result, 'publication result');
  test.isTrue(unblocked);
  delete Meteor.server.publish_handlers[PUBLICATION_NAME];
});
