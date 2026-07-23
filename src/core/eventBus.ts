import type { FlashEventType } from './types.js';

type Listener<T = unknown> = (payload: T) => void;

class EventBus {
  private readonly listeners = new Map<FlashEventType, Set<Listener>>();

  on<T>(event: FlashEventType, listener: Listener<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const set = this.listeners.get(event)!;
    set.add(listener as Listener);

    return () => {
      set.delete(listener as Listener);
    };
  }

  emit<T>(event: FlashEventType, payload: T): void {
    const set = this.listeners.get(event);
    if (!set) return;
    set.forEach((listener) => listener(payload));
  }

  off(event: FlashEventType, listener: Listener): void {
    this.listeners.get(event)?.delete(listener);
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const bus = new EventBus();
