module.exports = {
  preset: 'jest-expo',
  passWithNoTests: true,
  // @tanstack/react-query's focusManager/onlineManager register process-level
  // listeners that outlive per-test QueryClient.unmount() calls, leaving Jest
  // unable to exit on its own even with correct test cleanup.
  forceExit: true,
};
