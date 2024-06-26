# Picker - Server Side Router for Meteor

Picker is an easy to use server side router for Meteor. This router respect others. So, you can use Iron Router and other routers and middlewares along side with this.

## Migrated from communitypackages:picker

Quave version is compatible with Meteor 3.0 and forward.

To migrate you can simply run

``` sh
$ meteor remove communitypackages:picker && meteor add quave:picker
```

## Installation

``` sh
meteor add quave:picker
```

## Getting Started

```js
Picker.route('/post/:_id', function (params, req, res, next) {
  const post = Posts.findOne(params._id);
  res.end(post.content);
});
```

- You can use Meteor APIs inside this callback (runs inside a Fiber)
- Route definitions are very similar to Iron Router and Express
- `req` is an instance of NodeJS [http.IncomingMessage](http://nodejs.org/api/http.html#http_class_http_incomingmessage)
- `res` is an instance of NodeJS [http.ServerResponse](http://nodejs.org/api/http.html#http_class_http_serverresponse)
- `next` is optional and call it, if you don't need to handle the current request

## Filtering and Sub Routes

This is a unique functionality of this router. See following example:

Let's say we need to handle only `POST` requests. This is how you can do it with `Picker`.

```js
const postRoutes = Picker.filter(function (req, res) {
  // you can write any logic you want.
  // but this callback does not run inside a fiber
  // at the end, you must return either true or false
  return req.method === 'POST';
});

postRoutes.route('/post/:id', function (params, req, res, next) {
  // ...
});
```

You can create any amount of sub routes with this `filter` API. Same time, you can create nested sub routes as well.

## Middlewares

You can use existing `connect` and `express` middlewares without any issues.

```js
import bodyParser from 'body-parser';

// Add two middleware calls. The first attempting to parse the request body as
// JSON data and the second as URL encoded data.
Picker.middleware(bodyParser.json());
Picker.middleware(bodyParser.urlencoded({ extended: false }));
```

You can use middlewares on sub routes as well.
