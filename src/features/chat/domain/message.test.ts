import { isSendableMessage, MAX_MESSAGE_LENGTH } from './message';

describe('isSendableMessage', () => {
  it('accepts ordinary text', () => {
    expect(isSendableMessage('hello')).toBe(true);
  });

  it('rejects empty and whitespace-only text', () => {
    expect(isSendableMessage('')).toBe(false);
    expect(isSendableMessage('   \n  ')).toBe(false);
  });

  it('accepts text at the length limit and rejects text past it', () => {
    expect(isSendableMessage('a'.repeat(MAX_MESSAGE_LENGTH))).toBe(true);
    expect(isSendableMessage('a'.repeat(MAX_MESSAGE_LENGTH + 1))).toBe(false);
  });

  it('measures the trimmed text, so padding does not push it over', () => {
    expect(isSendableMessage(`  ${'a'.repeat(MAX_MESSAGE_LENGTH)}  `)).toBe(true);
  });
});
