import { RecordingPresets, useAudioRecorder } from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';

import { nativeChatMediaRepository } from '../data/chatMediaRepository';

export type RecordingResult =
  | { status: 'recorded'; uri: string; durationMs: number }
  // Held too briefly to be anything but a mis-tap. Reported rather than
  // swallowed, so the button does not just silently do nothing.
  | { status: 'too-short' }
  | { status: 'idle' };

export type VoiceRecorder = {
  isRecording: boolean;
  elapsedMs: number;
  start: () => Promise<void>;
  stop: () => Promise<RecordingResult>;
};

// Below this a "recording" is a slip of the finger, not a message.
export const MIN_RECORDING_MS = 700;

export function useVoiceRecorder(): VoiceRecorder {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  // Refs, not state: the press can end in the same tick it began, before any
  // re-render has happened, so stop() cannot rely on reading state.
  const startPromise = useRef<Promise<void> | null>(null);
  const startedAt = useRef(0);

  // Drives the timer shown while recording; the recorder does not report
  // progress itself.
  useEffect(() => {
    if (!isRecording) return;
    const timer = setInterval(() => setElapsedMs(Date.now() - startedAt.current), 200);
    return () => clearInterval(timer);
  }, [isRecording]);

  const start = useCallback(() => {
    if (startPromise.current) return startPromise.current;

    const promise = (async () => {
      const granted = await nativeChatMediaRepository.requestMicrophoneAccess();
      if (!granted) {
        throw new Error('Microphone permission was not granted.');
      }
      // Required before every recording — a recorder is invalid after stop().
      await recorder.prepareToRecordAsync();
      recorder.record();
      startedAt.current = Date.now();
      setElapsedMs(0);
      setIsRecording(true);
    })();

    startPromise.current = promise;
    return promise;
  }, [recorder]);

  const stop = useCallback(async (): Promise<RecordingResult> => {
    const pending = startPromise.current;
    if (!pending) return { status: 'idle' };

    // The first press opens the permission dialog, so releasing the button
    // almost always happens before start() has resolved. Waiting for it is
    // what stops the recorder being left running with nothing to end it.
    try {
      await pending;
    } catch {
      // start() already surfaced this to the caller.
      startPromise.current = null;
      setIsRecording(false);
      return { status: 'idle' };
    }

    startPromise.current = null;
    const durationMs = Date.now() - startedAt.current;
    setIsRecording(false);
    await recorder.stop();

    const uri = recorder.uri;
    if (!uri) return { status: 'idle' };
    if (durationMs < MIN_RECORDING_MS) return { status: 'too-short' };
    return { status: 'recorded', uri, durationMs };
  }, [recorder]);

  return { isRecording, elapsedMs, start, stop };
}
