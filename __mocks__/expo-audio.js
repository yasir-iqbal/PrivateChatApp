// Manual Jest mock: native module, no bridge available under Jest.
module.exports = {
  RecordingPresets: { HIGH_QUALITY: {} },
  AudioModule: { requestRecordingPermissionsAsync: jest.fn() },
  useAudioRecorder: jest.fn(() => ({
    prepareToRecordAsync: jest.fn(),
    record: jest.fn(),
    stop: jest.fn(),
    uri: null,
  })),
  useAudioPlayer: jest.fn(() => ({ play: jest.fn(), pause: jest.fn(), seekTo: jest.fn() })),
  useAudioPlayerStatus: jest.fn(() => ({
    playing: false,
    currentTime: 0,
    duration: 0,
    didJustFinish: false,
  })),
};
