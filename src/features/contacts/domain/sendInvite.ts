import { nativeShareRepository, type ShareRepository } from '../data/shareRepository';

// Plain text rather than a deep link: there is no install/referral link to
// point at yet, and a broken link reads worse than none.
export function buildInviteMessage(inviterName: string): string {
  return `${inviterName} invited you to chat on PrivateChat. Install the app and sign up with this email address to connect.`;
}

export async function sendInvite(
  inviterName: string,
  repo: ShareRepository = nativeShareRepository,
): Promise<void> {
  await repo.share(buildInviteMessage(inviterName));
}
