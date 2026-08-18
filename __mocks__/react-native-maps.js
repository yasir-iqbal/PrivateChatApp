// Manual Jest mock: native module, no bridge available under Jest.
const React = require('react');
const MapView = (props) => React.createElement('MapView', props, props.children);
module.exports = {
  __esModule: true,
  default: MapView,
  MapView,
  Marker: (props) => React.createElement('Marker', props),
  PROVIDER_GOOGLE: 'google',
};
