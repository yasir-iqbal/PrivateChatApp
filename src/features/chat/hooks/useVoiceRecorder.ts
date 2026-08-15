import { RecordingPresets, useAudioRecorder } from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';

import { nativeChatMediaRepository } from '../data/chatMediaRepository';

export type VoiceRecorder = {
  isRecording: boolean;
  elapsedMs: number;
  start: () => Promise<void>;
  // Resolves to the recording, or null if it was cancelled or too short to be
  // anything but a mis-tap.
  stop: () => Promise<{ uri: string; durationMs: number } | null>;
  cancel: () => Promise<void>;
};

// Below this a "recording" is a slip of the finger, not a message.
export const MIN_RECORDING_MS = 700;

export function useVoiceRecorder(): VoiceRecorder {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startedAt = useRef(0);

  // Drives the timer shown while recording; the recorder itself does not
  // report progress.
  useEffect(() => {
    if (!isRecording) return;
    const timer = setInterval(() => setElapsedMs(Date.now() - startedAt.current), 200);
    return () => clearInterval(timer);
  }, [isRecording]);

  const start = useCallback(async () => {
    const granted = await nativeChatMediaRepository.requestMicrophoneAccess();
    if (!granted) {
      throw new Error('Microphone permission was not granted.');
    }
    await recorder.prepareToRecordAsync();
    recorder.record();
    startedAt.current = Date.now();
    setElapsedMs(0);
    setIsRecording(true);
  }, [recorder]);

  const stop = useCallback(async () => {
    if (!isRecording) return null;
    setIsRecording(false);
    const durationMs = Date.now() - startedAt.current;
    await recorder.stop();
    const uri = recorder.uri;
    if (!uri || durationMs < MIN_RECORDING_MS) return null;
    return { uri, durationMs };
  }, [isRecording, recorder]);

  const cancel = useCallback(async () => {
    if (!isRecording) return;
    setIsRecording(false);
    await recorder.stop();
  }, [isRecording, recorder]);

  return { isRecording, elapsedMs, start, stop, cancel };
}
