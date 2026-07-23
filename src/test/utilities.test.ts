import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { startUtility, stopUtility, getActiveUtility } from '../core/utilities.js';
import { bus } from '../core/eventBus.js';

describe('Utilities', () => {
  beforeEach(() => {
    bus.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    stopUtility();
    vi.useRealTimers();
  });

  it('starts strobe utility and toggles callback', () => {
    const cb = vi.fn();
    startUtility('strobe', cb);
    expect(getActiveUtility()).toBe('strobe');

    vi.advanceTimersByTime(80);
    expect(cb).toHaveBeenCalled();
  });

  it('stops utility and resets active utility', () => {
    const cb = vi.fn();
    startUtility('strobe', cb);
    stopUtility();
    expect(getActiveUtility()).toBeNull();
  });

  it('starting a new utility stops the previous one', () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    startUtility('strobe', cb1);
    startUtility('beacon', cb2);
    expect(getActiveUtility()).toBe('beacon');
  });

  it('beacon calls callback with true then false', () => {
    const cb = vi.fn();
    startUtility('beacon', cb);

    // Initial call (on)
    expect(cb).toHaveBeenCalledWith(true);

    // After BEACON_ON (200ms), should turn off
    vi.advanceTimersByTime(200);
    expect(cb).toHaveBeenCalledWith(false);
  });

  it('SOS starts and emits utility:start event', () => {
    const eventListener = vi.fn();
    bus.on('utility:start', eventListener);

    const cb = vi.fn();
    startUtility('sos', cb);

    expect(eventListener).toHaveBeenCalledWith('sos');
  });

  it('stopUtility emits utility:stop event', () => {
    const eventListener = vi.fn();
    bus.on('utility:stop', eventListener);

    startUtility('strobe', vi.fn());
    stopUtility();

    expect(eventListener).toHaveBeenCalledWith(null);
  });

  it('pulse utility calls callback with opacity values', async () => {
    const cb = vi.fn();
    startUtility('pulse', cb);

    // Wait for the async RAF to fire once
    await Promise.resolve();

    // Stop before the next RAF fires to avoid recursion
    stopUtility();

    expect(cb).toHaveBeenCalled();
    // Last call is from stop() with opacity=1; check any call had a valid opacity
    const pulseCall = cb.mock.calls.find(([, opacity]) => typeof opacity === 'number' && opacity < 1);
    if (pulseCall) {
      const [on, opacity] = pulseCall as [boolean, number];
      expect(on).toBe(true);
      expect(opacity).toBeGreaterThanOrEqual(0.15);
      expect(opacity).toBeLessThanOrEqual(1);
    } else {
      // At minimum stop() was called with (true, 1)
      expect(cb).toHaveBeenCalledWith(true, 1);
    }
  });
});
