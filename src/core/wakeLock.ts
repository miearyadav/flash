import { bus } from './eventBus.js';

let wakeLockSentinel: WakeLockSentinel | null = null;
let _isActive = false;

export function isWakeLockSupported(): boolean {
  return 'wakeLock' in navigator;
}

export function isWakeLockActive(): boolean {
  return _isActive;
}

export async function requestWakeLock(): Promise<boolean> {
  if (!isWakeLockSupported()) return false;

  try {
    wakeLockSentinel = await navigator.wakeLock.request('screen');
    _isActive = true;

    wakeLockSentinel.addEventListener('release', () => {
      _isActive = false;
      wakeLockSentinel = null;
      bus.emit('wakelock:change', false);
    });

    bus.emit('wakelock:change', true);
    return true;
  } catch {
    _isActive = false;
    bus.emit('wakelock:change', false);
    return false;
  }
}

export async function releaseWakeLock(): Promise<void> {
  if (!wakeLockSentinel) return;
  try {
    await wakeLockSentinel.release();
  } catch {
    // Already released
  }
  wakeLockSentinel = null;
  _isActive = false;
  bus.emit('wakelock:change', false);
}

// Re-acquire wake lock when page becomes visible again
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && _isActive) {
    void requestWakeLock();
  }
});
