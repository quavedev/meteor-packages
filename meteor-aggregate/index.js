Mongo.Collection.prototype.aggregateAsync = async function (
  pipelines,
  options
) {
  const rawCollection = this.rawCollection();
  if (!rawCollection) {
    throw new Meteor.Error(
      'aggregate-error',
      `Raw collection not found for ${this._name}`
    );
  }

  return rawCollection.aggregate(pipelines, options).toArray();
};

Mongo.Collection.prototype.aggregate = function (pipeline, options) {
  return Meteor.wrapFn(Mongo.Collection.prototype.aggregateAsync.bind(this))(
    pipeline,
    options
  );
};
