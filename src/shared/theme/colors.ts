const PRIMARY = '#FFCA28';
const PRIMARY_DARK = '#E6B324';

export type ThemeColors = {
  primary: string;
  primaryPressed: string;
  onPrimary: string;
  background: string;
  surface: string;
  surfaceVariant: string;
  textPrimary: string;
  textSecondary: string;
  textOnPrimary: string;
  border: string;
  divider: string;
  icon: string;
  bubbleOutgoing: string;
  bubbleOutgoingText: string;
  bubbleIncoming: string;
  bubbleIncomingText: string;
  success: string;
  error: string;
  statusBarStyle: 'light' | 'dark';
};

export const lightColors: ThemeColors = {
  primary: PRIMARY,
  primaryPressed: PRIMARY_DARK,
  onPrimary: '#1A1A1A',

  background: '#FFFFFF',
  surface: '#F7F8FA',
  surfaceVariant: '#EDEFF1',

  textPrimary: '#111B21',
  textSecondary: '#667781',
  textOnPrimary: '#1A1A1A',

  border: '#E9EDEF',
  divider: '#E9EDEF',
  icon: '#54656F',

  bubbleOutgoing: '#FFF3D6',
  bubbleOutgoingText: '#1A1A1A',
  bubbleIncoming: '#FFFFFF',
  bubbleIncomingText: '#111B21',

  success: '#25D366',
  error: '#D32F2F',

  statusBarStyle: 'dark',
};

export const darkColors: ThemeColors = {
  primary: PRIMARY,
  primaryPressed: PRIMARY_DARK,
  onPrimary: '#1A1A1A',

  background: '#0B141A',
  surface: '#202C33',
  surfaceVariant: '#2A3942',

  textPrimary: '#E9EDEF',
  textSecondary: '#8696A0',
  textOnPrimary: '#1A1A1A',

  border: '#2A3942',
  divider: '#2A3942',
  icon: '#AEBAC1',

  bubbleOutgoing: '#4A3B14',
  bubbleOutgoingText: '#F5E9C8',
  bubbleIncoming: '#202C33',
  bubbleIncomingText: '#E9EDEF',

  success: '#25D366',
  error: '#F2726F',

  statusBarStyle: 'light',
};
