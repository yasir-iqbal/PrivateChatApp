import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useProfileSetupStatus } from './useProfileSetupStatus';
import { getHasSkippedProfileSetup } from '../domain/getHasSkippedProfileSetup';
import { skipProfileSetup } from '../domain/skipProfileSetup';

jest.mock('../domain/getHasSkippedProfileSetup');
jest.mock('../domain/skipProfileSetup');

const mockGetHasSkipped = getHasSkippedProfileSetup as jest.MockedFunction<typeof getHasSkippedProfileSetup>;
const mockSkip = skipProfileSetup as jest.MockedFunction<typeof skipProfileSetup>;

describe('useProfileSetupStatus', () => {
  it('starts loading and resolves to the stored skip status', async () => {
    mockGetHasSkipped.mockResolvedValue(true);

    const { result } = renderHook(() => useProfileSetupStatus('uid-1'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hasSkipped).toBe(true);
    expect(mockGetHasSkipped).toHaveBeenCalledWith('uid-1');
  });

  it('does not load when uid is undefined', () => {
    const { result } = renderHook(() => useProfileSetupStatus(undefined));

    expect(result.current.loading).toBe(false);
    expect(mockGetHasSkipped).not.toHaveBeenCalled();
  });

  it('markSkipped persists the skip and updates state', async () => {
    mockGetHasSkipped.mockResolvedValue(false);
    mockSkip.mockResolvedValue(undefined);
    const { result } = renderHook(() => useProfileSetupStatus('uid-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hasSkipped).toBe(false);

    await act(async () => {
      await result.current.markSkipped();
    });

    expect(mockSkip).toHaveBeenCalledWith('uid-1');
    expect(result.current.hasSkipped).toBe(true);
  });
});
