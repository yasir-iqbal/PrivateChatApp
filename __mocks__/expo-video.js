// Manual Jest mock: native module, no bridge available under Jest.
const React = require('react');
module.exports = {
  useVideoPlayer: jest.fn(() => ({ play: jest.fn(), pause: jest.fn(), loop: false })),
  VideoView: (props) => React.createElement('VideoView', props),
};
