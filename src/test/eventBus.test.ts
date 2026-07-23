import { describe, it, expect, vi, beforeEach } from 'vitest';
import { bus } from '../core/eventBus.js';

describe('EventBus', () => {
  beforeEach(() => {
    bus.clear();
  });

  it('emits events to registered listeners', () => {
    const listener = vi.fn();
    bus.on('view:change', listener);
    bus.emit('view:change', 'flash');
    expect(listener).toHaveBeenCalledWith('flash');
  });

  it('supports multiple listeners for the same event', () => {
    const l1 = vi.fn();
    const l2 = vi.fn();
    bus.on('color:change', l1);
    bus.on('color:change', l2);
    bus.emit('color:change', 'red');
    expect(l1).toHaveBeenCalledWith('red');
    expect(l2).toHaveBeenCalledWith('red');
  });

  it('unsubscribes listener via returned cleanup function', () => {
    const listener = vi.fn();
    const unsub = bus.on('view:change', listener);
    unsub();
    bus.emit('view:change', 'landing');
    expect(listener).not.toHaveBeenCalled();
  });

  it('does not throw when emitting to event with no listeners', () => {
    expect(() => bus.emit('settings:change', {})).not.toThrow();
  });

  it('clears all listeners', () => {
    const listener = vi.fn();
    bus.on('view:change', listener);
    bus.clear();
    bus.emit('view:change', 'flash');
    expect(listener).not.toHaveBeenCalled();
  });

  it('off() removes a specific listener', () => {
    const l1 = vi.fn();
    const l2 = vi.fn();
    bus.on('color:change', l1);
    bus.on('color:change', l2);
    bus.off('color:change', l1);
    bus.emit('color:change', 'blue');
    expect(l1).not.toHaveBeenCalled();
    expect(l2).toHaveBeenCalledWith('blue');
  });
});
