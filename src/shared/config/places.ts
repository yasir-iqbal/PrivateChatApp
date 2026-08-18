// Google Places key for the nearby-places list in the location picker.
//
// Deliberately NOT in app.json alongside googleWebClientId, and deliberately
// not the Firebase Android key. Places is a *web service*, and Google does not
// support Android app restrictions on web service keys — only IP restrictions
// or OAuth. So this key cannot be locked to the app the way the Firebase and
// Maps keys are, and committing it to a public repository would hand anyone a
// key they could spend against.
//
// Read from the environment instead, so it reaches a build without ever
// entering git. Set it in .env locally, or as an EAS secret:
//
//   eas secret:create --name EXPO_PUBLIC_PLACES_API_KEY --value <key>
//
// Even then it is embedded in the app bundle and extractable by anyone who
// unpacks the APK. The only way to keep it genuinely private is a server-side
// proxy — a Cloud Function holding the key, with the app calling that instead.
// See functions/README.md.
export const PLACES_API_KEY: string = process.env.EXPO_PUBLIC_PLACES_API_KEY ?? '';

export function hasPlacesKey(): boolean {
  return PLACES_API_KEY.length > 0;
}
