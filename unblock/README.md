# `quave:unblock`

Automatically calls `this.unblock()` before every Meteor method and publication
registered after this server-only package loads. This prevents a slow handler from
serializing unrelated DDP work from the same client connection.

## Install

```bash
meteor add quave:unblock
```

No application changes are required. Keep the package after authentication and
other framework packages in `.meteor/packages`; application code always loads
after packages and is therefore covered automatically.

## Important behavior

Unblocking allows methods and subscriptions from one connection to overlap. Each
handler must enforce its own authorization and must not depend on another handler
from that connection finishing first.

A method cannot call `this.setUserId()` after it has unblocked. Authentication
packages should load before `quave:unblock`, and application methods that change
the connection user must not be registered through the patched `Meteor.methods`.
