// Manual Jest mock: the real package pulls in a `firebase` (web SDK) ESM
// fallback chain that isn't worth transforming for unit tests, and the
// native module has no bridge to talk to under Jest anyway. Domain code
// only ever calls these through data/authRepository.ts, which this replaces.
module.exports = {
  getAuth: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signInWithCredential: jest.fn(),
  signOut: jest.fn(),
  sendEmailVerification: jest.fn(),
  updateProfile: jest.fn(),
  reload: jest.fn(),
  onAuthStateChanged: jest.fn(),
  GoogleAuthProvider: {
    credential: jest.fn((idToken) => ({ idToken })),
  },
};
