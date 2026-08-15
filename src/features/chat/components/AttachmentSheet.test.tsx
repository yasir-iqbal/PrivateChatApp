import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AttachmentSheet } from './AttachmentSheet';
import { ThemeProvider } from '../../../shared/theme';

function renderSheet(visible = true) {
  const onClose = jest.fn();
  const onChoose = jest.fn();
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <ThemeProvider>
        <AttachmentSheet visible={visible} onClose={onClose} onChoose={onChoose} />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
  return { onClose, onChoose };
}

describe('AttachmentSheet', () => {
  it('offers every attachment kind', () => {
    renderSheet();

    ['Camera', 'Gallery', 'Record', 'Video', 'Location'].forEach((label) => {
      expect(screen.getByLabelText(label)).toBeTruthy();
    });
  });

  it('reports a photo from the camera', () => {
    const { onChoose } = renderSheet();

    fireEvent.press(screen.getByLabelText('Camera'));

    expect(onChoose).toHaveBeenCalledWith({ kind: 'image', source: 'camera' });
  });

  it('reports a photo from the library', () => {
    const { onChoose } = renderSheet();

    fireEvent.press(screen.getByLabelText('Gallery'));

    expect(onChoose).toHaveBeenCalledWith({ kind: 'image', source: 'library' });
  });

  it('distinguishes recording a video from picking one', () => {
    const { onChoose } = renderSheet();

    fireEvent.press(screen.getByLabelText('Record'));
    expect(onChoose).toHaveBeenCalledWith({ kind: 'video', source: 'camera' });

    fireEvent.press(screen.getByLabelText('Video'));
    expect(onChoose).toHaveBeenCalledWith({ kind: 'video', source: 'library' });
  });

  it('reports location', () => {
    const { onChoose } = renderSheet();

    fireEvent.press(screen.getByLabelText('Location'));

    expect(onChoose).toHaveBeenCalledWith({ kind: 'location' });
  });

  // Otherwise the sheet would still be on screen behind the camera or picker
  // it just opened, and visible again when that closes.
  it('closes before handing off to the picker', () => {
    const calls: string[] = [];
    const onClose = jest.fn(() => calls.push('close'));
    const onChoose = jest.fn(() => calls.push('choose'));
    render(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 0, left: 0, right: 0, bottom: 0 },
        }}
      >
        <ThemeProvider>
          <AttachmentSheet visible onClose={onClose} onChoose={onChoose} />
        </ThemeProvider>
      </SafeAreaProvider>,
    );

    fireEvent.press(screen.getByLabelText('Camera'));

    expect(calls).toEqual(['close', 'choose']);
  });

  // iOS has no back button, so the backdrop is the only way out.
  it('dismisses when the backdrop is tapped', () => {
    const { onClose, onChoose } = renderSheet();

    fireEvent.press(screen.getByLabelText('Close attachments'));

    expect(onClose).toHaveBeenCalled();
    expect(onChoose).not.toHaveBeenCalled();
  });
});
