import { firebasePushRepository, type PushRepository } from '../data/pushRepository';

export type RegistrationResult =
  | { status: 'registered'; token: string }
  | { status: 'denied' }
  | { status: 'unavailable' };

// Registers this device to receive pushes for the signed-in user. Returns why
// it did not, rather than throwing, because none of the failures should stop
// the app working — they only mean no notifications.
export async function registerForPush(
  uid: string,
  repo: PushRepository = firebasePushRepository,
): Promise<RegistrationResult> {
  const granted = await repo.requestPermission();
  if (!granted) return { status: 'denied' };

  const token = await repo.getToken();
  if (!token) return { status: 'unavailable' };

  await repo.saveToken(uid, token);
  return { status: 'registered', token };
}

// Called on sign out. Without this the device keeps receiving notifications
// for an account that is no longer signed in on it — which on a shared phone
// leaks the previous user's messages.
export async function unregisterFromPush(
  uid: string,
  token: string,
  repo: PushRepository = firebasePushRepository,
): Promise<void> {
  await repo.removeToken(uid, token);
}
