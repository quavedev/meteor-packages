Tinytest.add('method signature', function(test) {
  const coll = new Mongo.Collection(Random.id());
  test.equal(typeof coll.aggregate, 'function');
});

Tinytest.add("let's aggregate", function(test) {
  const coll = new Mongo.Collection(Random.id());
  coll.insert({resTime: 20});
  coll.insert({resTime: 40});

  const result = coll.aggregate([
    {$group: {_id: null, resTime: {$sum: "$resTime"}}}
  ]);

  test.equal(result, [{_id: null, resTime: 60}]);
});

Tinytest.add("aggregate on Meteor.users", function(test) {
  const coll = Meteor.users;
  coll.remove({});
  coll.insert({resTime: 20});
  coll.insert({resTime: 40});

  const result = coll.aggregate([
    {$group: {_id: null, resTime: {$sum: "$resTime"}}}
  ]);

  test.equal(result, [{_id: null, resTime: 60}]);
});

Tinytest.add("using some options", function(test) {
  const coll = new Mongo.Collection(Random.id());
  coll.insert({resTime: 20});
  coll.insert({resTime: 40});

  const options = {explain: true};
  const result = coll.aggregate([
    {$group: {_id: null, resTime: {$sum: "$resTime"}}}
  ], options);
  test.equal(typeof result[0], 'object');
});