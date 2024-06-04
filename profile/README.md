# Meteor CPU Profiler

This package makes it easy to record proper sampling [CPU profiles](https://github.com/node-inspector/v8-profiler) of Meteor on the server. You can open the profile in Chrome for detailed analysis. A CPU profile looks like this in Chrome:

![example flamechart](https://user-images.githubusercontent.com/247408/60747657-a0bae300-9f3b-11e9-8dc3-b615a2611aca.png)

This package supports profiling the Meteor server process and send to S3 or save in the local disk.

> if you want to profile Meteor build, [use this package](https://github.com/qualialabs/profile)).

## Installation

```sh
$ meteor add quave:profile
```

> this package is only compatible with Meteor `1.8.2` or newer.

## Usage

### Send the file to AWS S3

If you don't have access to disk (like running on Galaxy) you can provide AWS S3 credentials in your settings and then the package is going to send to S3:

```json
  "packages": {
    "quave:profile": {
      "s3": {
        "Bucket": "yourbucket",
        "accessKeyId": "XXXXXXXXXXXXXXXXXXXX",
        "secretAccessKey": "XXXXXXXX+Ox/xsajksadSJKDSAJKDJASKDJASKJDSA",
        "region": "us-east-1"
      }
    }
  }
```

You can start a profile calling a meteor Method from the console of your browser when your app is loaded there:

```js
Meteor.call('quave:profile#execute', { durationMs: 3500 });
```

You can pass the `durationMs` to choose for how long do you want to profile.

If you are running on Galaxy you can use the URL for a specific container to profile a problematic container.

Check the logs in the server after the duration to get the URL or check your bucket and the file `.cpuprofile` will be there.

### Write the file to the disk

To profile the Meteor server at runtime, open the Meteor shell and run the following commands:

```sh
import Profiler from "meteor/quave:profile";

let profileName = 'myprofile';
let profilePath = '/path/to/profiles/myprofile.cpuprofile';
let profileMS = 10000;

Profiler.profileDuration(profileName, profilePath, profileMS);
```

This will profile your code for ten seconds and save the profile to `/path/to/profiles/myprofile.cpuprofile`.

You can call `Profiler.profileDuration` from anywhere in your code, but it is often convenient to call it from the Meteor shell.

## Reading Profiles

Chrome's javascript profiler is hidden by default. To enable it first open the DevTools main menu:

![devtools main menu](https://developers.google.com/web/tools/chrome-devtools/images/main-menu.svg)

After that, select **More tools > JavaScript Profiler**. The old profiler opens in a new panel called **JavaScript Profiler**. For more information reference [this article](https://developers.google.com/web/updates/2016/12/devtools-javascript-cpu-profile-migration#old).

Once the javascript profiler is enabled click **Load** to load your `*.cpuprofile` files. You can now navigate between your uploaded CPU profiles by using the sidebar on the left hand side.

For guidance on how to interpret these profiles, [this tutorial](https://developers.google.com/web/tools/chrome-devtools/rendering-tools/js-execution) is a good first step.
