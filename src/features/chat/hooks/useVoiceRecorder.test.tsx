import { renderHook } from '@testing-library/react-native';
import { useAudioRecorder } from 'expo-audio';

import { MIN_RECORDING_MS, useVoiceRecorder } from './useVoiceRecorder';
import { nativeChatMediaRepository } from '../data/chatMediaRepository';

jest.mock('../data/chatMediaRepository', () => ({
  nativeChatMediaRepository: { requestMicrophoneAccess: jest.fn() },
}));

const mockUseAudioRecorder = useAudioRecorder as jest.MockedFunction<typeof useAudioRecorder>;
const mockRequestMic = nativeChatMediaRepository.requestMicrophoneAccess as jest.MockedFunction<
  typeof nativeChatMediaRepository.requestMicrophoneAccess
>;

type FakeRecorder = {
  prepareToRecordAsync: jest.Mock;
  record: jest.Mock;
  stop: jest.Mock;
  uri: string | null;
};

function fakeRecorder(uri: string | null = 'file:///note.m4a'): FakeRecorder {
  return {
    prepareToRecordAsync: jest.fn().mockResolvedValue(undefined),
    record: jest.fn(),
    stop: jest.fn().mockResolvedValue(undefined),
    uri,
  };
}

function setup(recorder: FakeRecorder = fakeRecorder()) {
  mockUseAudioRecorder.mockReturnValue(recorder as never);
  const { result } = renderHook(() => useVoiceRecorder());
  return { result, recorder };
}

describe('useVoiceRecorder', () => {
  beforeEach(() => {
    mockRequestMic.mockResolvedValue(true);
  });

  it('prepares before recording, since a recorder is invalid after each stop', async () => {
    const { result, recorder } = setup();

    await result.current.start();

    expect(recorder.prepareToRecordAsync).toHaveBeenCalled();
    expect(recorder.record).toHaveBeenCalled();
  });

  // The bug this guards: start() is async and the press ends before it
  // resolves — on a first press the permission dialog makes that take
  // seconds. Reading state instead of awaiting the start left the recorder
  // running with nothing to stop it, and sent nothing.
  it('waits for an in-flight start before stopping', async () => {
    const recorder = fakeRecorder();
    let releasePrepare: (() => void) | undefined;
    recorder.prepareToRecordAsync.mockReturnValue(
      new Promise<void>((resolve) => {
        releasePrepare = () => resolve();
      }),
    );
    const { result } = setup(recorder);

    // Press and release before preparation finishes.
    const starting = result.current.start();
    const stopping = result.current.stop();
    releasePrepare?.();
    await starting;
    const outcome = await stopping;

    expect(recorder.record).toHaveBeenCalled();
    expect(recorder.stop).toHaveBeenCalled();
    expect(outcome.status).not.toBe('idle');
  });

  it('returns the recording when held long enough', async () => {
    const { result, recorder } = setup();
    await result.current.start();
    // Held past the threshold.
    jest.spyOn(Date, 'now').mockReturnValue(Date.now() + MIN_RECORDING_MS + 500);

    const outcome = await result.current.stop();

    expect(outcome).toEqual({
      status: 'recorded',
      uri: 'file:///note.m4a',
      durationMs: expect.any(Number),
    });
    expect(recorder.stop).toHaveBeenCalled();
    jest.restoreAllMocks();
  });

  // Reported rather than swallowed, so a quick tap does not look like a dead
  // button.
  it('reports a too-short press instead of returning nothing', async () => {
    const { result } = setup();
    await result.current.start();

    const outcome = await result.current.stop();

    expect(outcome).toEqual({ status: 'too-short' });
  });

  it('is idle when stopping without having started', async () => {
    const { result, recorder } = setup();

    const outcome = await result.current.stop();

    expect(outcome).toEqual({ status: 'idle' });
    expect(recorder.stop).not.toHaveBeenCalled();
  });

  it('rejects the start when the microphone is refused', async () => {
    mockRequestMic.mockResolvedValue(false);
    const { result, recorder } = setup();

    await expect(result.current.start()).rejects.toThrow('Microphone permission was not granted.');
    expect(recorder.record).not.toHaveBeenCalled();
  });

  // A refused permission must not leave the hook believing a recording is in
  // progress, or the next press would be ignored.
  it('recovers after a refused permission', async () => {
    mockRequestMic.mockResolvedValue(false);
    const { result } = setup();
    await expect(result.current.start()).rejects.toThrow();

    const outcome = await result.current.stop();

    expect(outcome).toEqual({ status: 'idle' });
  });

  it('is idle when the recorder produced no file', async () => {
    const { result } = setup(fakeRecorder(null));
    await result.current.start();

    const outcome = await result.current.stop();

    expect(outcome).toEqual({ status: 'idle' });
  });
});
