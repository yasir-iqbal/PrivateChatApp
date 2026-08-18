module.exports = {
  preset: 'jest-expo',
  // The Cloud Functions package is a separate Node project with its own
  // toolchain and is deployed independently; it is not part of the app suite.
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/functions/'],
  passWithNoTests: true,
  clearMocks: true,
  // Full parallelism gets flaky (timeouts) alongside other heavy local
  // processes (emulators, Metro); cap workers for consistent runs.
  maxWorkers: '50%',
  // @tanstack/react-query's focusManager/onlineManager register process-level
  // listeners that outlive per-test QueryClient.unmount() calls, leaving Jest
  // unable to exit on its own even with correct test cleanup.
  forceExit: true,
};
