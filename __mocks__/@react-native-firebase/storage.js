// Manual Jest mock: native module, no bridge available under Jest.
module.exports = {
  getStorage: jest.fn(),
  ref: jest.fn(),
  putFile: jest.fn(),
  getDownloadURL: jest.fn(),
};
