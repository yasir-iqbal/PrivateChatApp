// Manual Jest mock: native module, no bridge available under Jest.
// The subscribe functions return an unsubscribe callback like the real API
// does — returning undefined would blow up in effect cleanup.
module.exports = {
  getMessaging: jest.fn(),
  requestPermission: jest.fn(),
  getToken: jest.fn(),
  onTokenRefresh: jest.fn(() => jest.fn()),
  onNotificationOpenedApp: jest.fn(() => jest.fn()),
  getInitialNotification: jest.fn(async () => null),
  AuthorizationStatus: { NOT_DETERMINED: -1, DENIED: 0, AUTHORIZED: 1, PROVISIONAL: 2 },
};
