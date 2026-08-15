// Manual Jest mock: native module, no bridge available under Jest.
module.exports = {
  Accuracy: { Balanced: 3 },
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
};
