# Cloud Functions — push notifications

Not deployed. This is the server half of push notifications; the client half
ships in the app already and simply has nothing sending to it until this runs.

## What it does

`notifyOnMessage` triggers on every new message document and sends a push to
the recipient's registered devices.

- The recipient is derived from the conversation ID, which is the two uids
  sorted and joined — no parent document read needed.
- **Blocking is re-checked here.** The Firestore rules stop a blocked user
  sending, but rules do not run in a function, and a message can predate a
  block. Without this check a blocked sender could still reach someone through
  a notification.
- Tokens that come back invalid are deleted. A token dies when the app is
  uninstalled or its data cleared, and left in place every future send retries
  it forever.
- The notification carries `senderUid` and `senderName` in its data payload,
  which is what lets the app open the right conversation when it is tapped.

## Deploying, when you want it

1. **Upgrade the project to the Blaze plan.** Cloud Functions require
   pay-as-you-go even for usage inside the free allowance. This app's volume
   would sit well within the free tier, but the card has to be on file.

2. Install and deploy:

   ```bash
   cd functions && npm install
   cd .. && firebase deploy --only functions
   ```

   `firebase login` first if the CLI is not authenticated.

3. Publish the Firestore rules if they are not current — `users/{uid}/pushTokens`
   must be owner-only, or anyone could read a token and send notifications as
   this app.

## iOS

Android works off `google-services.json`, which is already in place. iOS
additionally needs an APNs key uploaded to Firebase (Project settings → Cloud
Messaging) and the Push Notifications capability, neither of which the app can
configure for you.
