/* global Meteor */

const originalMethods = Meteor.methods;
const originalPublish = Meteor.publish;

function wrapHandler({ handler }) {
  if (typeof handler !== 'function') return handler;

  return function unblockHandler(...args) {
    this.unblock();
    return handler.apply(this, args);
  };
}

Meteor.methods = function methodsWithUnblock(methodMap) {
  const wrappedMethodMap = Object.fromEntries(
    Object.entries(methodMap).map(([name, handler]) => [
      name,
      wrapHandler({ handler }),
    ])
  );
  return originalMethods.call(this, wrappedMethodMap);
};

Meteor.publish = function publishWithUnblock(name, handler, ...args) {
  return originalPublish.call(this, name, wrapHandler({ handler }), ...args);
};
