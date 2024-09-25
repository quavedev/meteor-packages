# quave:email-postmark

`quave:email-postmark` is a Meteor package that provides a plug-and-play integration with [Postmark](https://postmarkapp.com/).

## Why

It is designed to simplify the process of sending emails with Meteor.

We are using the `email` package from Meteor.

We believe we are not reinventing the wheel in this package but what we are doing is like putting together the wheels in the vehicle :).

## Installation

```sh
meteor add quave:email-postmark
```

## Usage

### Configuration

You just need to configure your authentication data in the settings if you just want to use Postmark as provider for Meteor emails. 

```json
{
  "packages": {
    "quave:email-postmark": {
      "from": "noreply@yourdomain.com",
      "apiToken": "tttttttt-1111-2222-3333-tttttttttttt"
    }
  }
}
```

Or you need to set the `from` here in the settings or you need to always call the email manually and inform the from in the props.

### Code usage

If you want to use our code to send emails directly you can also call like below:

```javascript
import { sendEmail } from 'meteor/quave:email-postmark';

Meteor.methods({
  newEmail({ to, subject, content }) {
    sendEmail({
      to,
      subject,
      content,
    })
      .then(() => {
        console.log(`Email sent to ${to}`);
      })
      .catch(error => {
        console.error(`Error sending email to ${to}`, error);
      });
  }
});
```

You can provide the `from` as well in the `sendEmail` function.

## Limitations

Meteor `email` package needs to be in the version 2.2 or above. This corresponds to Meteor version 2.4.

### License

MIT

