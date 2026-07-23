import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isWakeLockSupported, isWakeLockActive, requestWakeLock, releaseWakeLock } from '../core/wakeLock.js';

describe('Wake Lock', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('detects wake lock support', () => {
    expect(isWakeLockSupported()).toBe(true);
  });

  it('requests wake lock successfully', async () => {
    const result = await requestWakeLock();
    expect(result).toBe(true);
    expect(isWakeLockActive()).toBe(true);
  });

  it('releases wake lock', async () => {
    await requestWakeLock();
    await releaseWakeLock();
    expect(isWakeLockActive()).toBe(false);
  });

  it('handles wake lock request failure gracefully', async () => {
    const mockWakeLock = navigator.wakeLock as { request: ReturnType<typeof vi.fn> };
    mockWakeLock.request.mockRejectedValueOnce(new Error('Permission denied'));

    const result = await requestWakeLock();
    expect(result).toBe(false);
  });

  it('returns false when wake lock is not supported', async () => {
    const original = navigator.wakeLock;
    Object.defineProperty(navigator, 'wakeLock', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const result = await requestWakeLock();
    expect(result).toBe(false);

    Object.defineProperty(navigator, 'wakeLock', {
      value: original,
      writable: true,
      configurable: true,
    });
  });
});
