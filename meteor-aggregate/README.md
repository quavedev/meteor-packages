[![](https://api.travis-ci.org/meteorhacks/meteor-aggregate.svg)](https://travis-ci.org/meteorhacks/meteor-aggregate)

### Migrated from sakulstra:aggregate
Quave version is compatible with Meteor 3.0 and forward.

To migrate you can simply run

```shell
meteor remove sakulstra:aggregate && meteor add quave:aggregate
```

> this only works on server side and there is no oberserving support or reactivity built in

## Usage

Simply use `.aggregate` function like below.

```js
const metrics = new Mongo.Collection('metrics');
const pipeline = [{ $group: { _id: null, resTime: { $sum: '$resTime' } } }];
const result = await metrics.aggregate(pipeline);
```

### Using Options

```js
const metrics = new Mongo.Collection('metrics');
const pipeline = [{ $group: { _id: null, resTime: { $sum: '$resTime' } } }];
const result = await metrics.aggregate(pipeline, { explain: true });
console.log('Explain Report:', JSON.stringify(result[0]), null, 2);
```

## Why?

There are few other aggregation packages out there. All of them written with some complex hacks and there are some easy way to do things.
They also don't work with custom Mongo drivers as well.

And this package is short and simple. (~20 LOC)

## What the fork?!

meteorhacks/meteor-aggregate seems pretty unmaintained, so let's maintain a fork!
Meteor 1.7 and it's upgrade to mongodriver v3 introduced some breaking changes which will break meteorhacks:meteor-aggregate.

## Breaking changes

- `meteorhacks:collection-utils@1.2.0` is no longer a dependency. If you're using meteor <= 1.0.4 you have to add it manually.
