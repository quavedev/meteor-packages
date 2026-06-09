# quave:email-resend

`quave:email-resend` is a Meteor package that provides a plug-and-play integration with [Resend](https://resend.com/).

## Why

It is designed to simplify sending emails with Meteor using Resend.

We use the `email` package from Meteor and register `Email.customTransport`, so `Email.send` and `Email.sendAsync` use Resend when this package is the active email transport.

## Installation

```sh
meteor add quave:email-resend
```

## Usage

### Configuration

Configure your Resend API key and default sender in Meteor settings:

```json
{
  "packages": {
    "quave:email-resend": {
      "from": "noreply@yourdomain.com",
      "apiKey": "re_..."
    }
  }
}
```

For local development without sending email, set `devMode`:

```json
{
  "packages": {
    "quave:email-resend": {
      "devMode": true,
      "devModeOnlySubject": true,
      "from": "noreply@yourdomain.com"
    }
  }
}
```

### Code usage

If you want to use our code to send emails directly, call `sendEmail`:

```javascript
import { sendEmail } from 'meteor/quave:email-resend';

Meteor.methods({
  async newEmail({ to, subject, content }) {
    await sendEmail({
      to,
      subject,
      content,
    });
  },
});
```

You can provide `from` as well in the `sendEmail` function.

### License

MIT
