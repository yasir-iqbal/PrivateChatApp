// Manual Jest mock: native module, no bridge available under Jest.
// Domain code only reaches these through data/ repositories, which tests
// replace with fakes, so bare jest.fn()s are enough here.
module.exports = {
  getFirestore: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  deleteDoc: jest.fn(),
  writeBatch: jest.fn(() => ({ set: jest.fn(), delete: jest.fn(), commit: jest.fn() })),
  query: jest.fn(),
  where: jest.fn(),
  limit: jest.fn(),
  orderBy: jest.fn(),
  serverTimestamp: jest.fn(() => 'server-timestamp'),
};
