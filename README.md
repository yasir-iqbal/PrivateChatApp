# PrivateChat

A private 1:1 messenger built with Expo (SDK 57), React Native and Firebase.
Email/password and Google sign-in, contacts by email, text, photo, video, voice
and location messages, delivery and read receipts, presence, blocking, and push
notifications.

## Requirements

| | |
|---|---|
| Node | 20+ (developed on 23) |
| Expo CLI | bundled — use `npx expo` |
| Android | Android Studio + an SDK platform and emulator, or a USB device |
| iOS | macOS with Xcode (simulator builds only need the simulator runtime) |
| Firebase | a project with Auth, Firestore and Storage enabled |

**This app cannot run in Expo Go.** It uses native modules that Expo Go does not
bundle — React Native Firebase, Google Sign-In, `react-native-maps`,
`expo-audio`, `expo-video`. Every run below builds a *development build*, which
is your own app binary with the Expo dev client inside it. You build it once,
then reload JavaScript into it the way Expo Go does.

## Setup

```bash
npm install
```

`google-services.json` (Android) and `GoogleService-Info.plist` (iOS) are already
in the repo, pointing at the existing Firebase project. Replace both if you are
pointing this at your own project.

Optionally, for the nearby-places list in the location picker:

```bash
cp .env.example .env
```

and fill in `EXPO_PUBLIC_PLACES_API_KEY`. Without it the picker still works — it
just shows no nearby list. Read the comments in `.env.example` before using a
real key; it cannot be restricted to the app the way the Firebase keys can.

## Running on Android

Local build, straight onto an emulator or a connected device:

```bash
npx expo run:android
```

This generates `android/` if it is missing, compiles, installs, and starts
Metro. Subsequent runs only need `npx expo start` — the binary is already
installed, and JavaScript reloads into it.

For a device on the same machine over USB, this avoids Metro connection
problems when your laptop's IP changes:

```bash
adb reverse tcp:8081 tcp:8081
```

To hand an APK to someone else, build it in the cloud instead:

```bash
eas build --profile development --platform android
```

### After changing `app.json`

`expo run:android` will **not** regenerate `android/` when the folder already
exists, so native config changes — permissions, plugins, the Maps API key —
silently do not take effect. Force it:

```bash
npx expo prebuild --clean
npx expo run:android
```

`android/` and `ios/` are gitignored on purpose: they are build output, and
`app.json` plus the config plugins are the source of truth.

## Running on iOS

```bash
npx expo run:ios
```

Same story — generates `ios/`, builds, boots the simulator, starts Metro. To
build for the simulator on EAS rather than locally:

```bash
eas build --profile development-simulator --platform ios
```

Then drag the resulting `.app` onto a booted simulator, or install it with
`xcrun simctl install booted <path>`.

Physical iOS devices need a paid Apple Developer account and a provisioning
profile; the `development` profile handles that, but the device has to be
registered with `eas device:create` first.

### Maps on iOS vs Android

`react-native-maps` uses Apple Maps on iOS, which needs no key. Android uses
Google Maps, which needs **Maps SDK for Android enabled and a billing account**
on the Firebase/Google Cloud project — without both, the map renders blank and
logs an authorization failure. The key itself is already in `app.json`.

## Tests

```bash
npm test
```

Unit tests for domain logic, hook tests with `renderHook`, and React Testing
Library tests for screens. There are no end-to-end tests.

## Firebase rules

`firestore.rules` and `storage.rules` in this repo are the source of truth for
access control. **They are not applied automatically** — publishing them is a
separate step, and the app will behave as though the rules do not exist until
you do it.

### With the CLI

```bash
firebase login
firebase use <your-project-id>
firebase deploy --only firestore:rules,storage
```

Deploy them individually if you prefer:

```bash
firebase deploy --only firestore:rules
firebase deploy --only storage
```

Firestore indexes live in `firestore.indexes.json`:

```bash
firebase deploy --only firestore:indexes
```

(The app deliberately avoids composite indexes — filtering and sorting happen in
the domain layer — so this is normally empty.)

### From the console, without the CLI

1. **Firestore** — Firebase console → Firestore Database → Rules. Replace the
   whole editor contents with `firestore.rules` and press **Publish**.
2. **Storage** — Firebase console → Storage → Rules. Replace with
   `storage.rules` and press **Publish**.

Paste the entire file each time. These are whole-document replacements, not
patches, and a partial paste silently drops whatever it leaves out.

### What the rules enforce

Worth knowing before you edit them, because several rules are load-bearing in
non-obvious ways:

- `users/{uid}` and `emailIndex/{email}` grant `get` but **not** `list`. That is
  what stops a signed-in user enumerating every registered email address. Email
  lookup is keyed by address so it can be a document read rather than a query.
- Conversation IDs are the two uids sorted and joined, so membership is read off
  the path. Message rules depend on this — a batched write is evaluated against
  pre-batch state, so reading the parent conversation would fail on the first
  message of a chat.
- Blocking is enforced in the rules, not just the UI, via `exists()` on the
  recipient's private blocked list. `exists()` bypasses read rules, which is what
  lets a block work without the blocked person being able to see it.
- Messages are never hard deleted. Deleting for yourself may only add your own
  uid to `deletedFor`; deleting for everyone is the sender's alone and must
  actually set the tombstone, which is what stops it being used to edit text.
- Storage rules cannot read Firestore, so chat media is stored under the
  conversation ID and membership is read off that path too.

## Cloud Functions (push notifications)

The client half of push notifications ships in the app. The server half lives in
`functions/` and **is not deployed** — until it is, nothing sends notifications.

Deploying requires the **Blaze (pay-as-you-go) plan**. Cloud Functions need it
even for usage inside the free allowance, so a card has to be on file.

```bash
cd functions && npm install
cd .. && firebase deploy --only functions
```

`firebase login` first if the CLI is not authenticated. The predeploy hook in
`firebase.json` compiles TypeScript, so there is no separate build step.

Make sure the Firestore rules are published too — `users/{uid}/pushTokens` must
be owner-only, or anyone could read a device token and send notifications as
this app.

iOS additionally needs an APNs key uploaded in Firebase (Project settings →
Cloud Messaging) and the Push Notifications capability. Android works off
`google-services.json`, which is already in place.

See `functions/README.md` for what the function actually does.

## Architecture

Feature-first, with a strict one-way dependency flow:

```
UI (screens/components) → hooks → domain → data
```

```
src/
  features/<feature>/
    data/       repositories — Firebase and device APIs live here, behind interfaces
    domain/     pure logic, no React, no Firebase imports
    hooks/      React state, calls domain functions
    screens/    and components/
  shared/       theme, shared components, shared hooks
```

Domain functions that need data take a repository as a parameter, typed by an
interface the `data/` layer defines and defaulting to the real implementation.
Tests inject fakes rather than mocking modules. Hooks never import a repository
directly; domain and data never import React.

## Keys in this repository

The Firebase client keys in `google-services.json`, `GoogleService-Info.plist`
and `app.json` are meant to ship inside the app — they identify the project, they
do not authorise anything on their own, and access is controlled entirely by the
rules above. They are restricted by app package and signing certificate.

The Places key is the exception and is read from the environment instead. See
`.env.example`.
