import { afterEach, vi } from 'vitest';

// ─── Mock Web APIs not available in jsdom ────────────────────────────────────

// Wake Lock API
const mockWakeLockSentinel = {
  released: false,
  type: 'screen' as WakeLockType,
  release: vi.fn().mockResolvedValue(undefined),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  onrelease: null,
};

Object.defineProperty(navigator, 'wakeLock', {
  value: {
    request: vi.fn().mockResolvedValue(mockWakeLockSentinel),
  },
  writable: true,
  configurable: true,
});

// Fullscreen API
Object.defineProperty(document, 'fullscreenEnabled', {
  value: true,
  writable: true,
  configurable: true,
});

Object.defineProperty(document, 'fullscreenElement', {
  value: null,
  writable: true,
  configurable: true,
});

Element.prototype.requestFullscreen = vi.fn().mockResolvedValue(undefined);
document.exitFullscreen = vi.fn().mockResolvedValue(undefined);

// matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

// requestAnimationFrame – call once synchronously (non-recursive)
let _rafId = 0;
const _rafCallbacks = new Map<number, FrameRequestCallback>();

(globalThis as unknown as Record<string, unknown>)['requestAnimationFrame'] = vi.fn((cb: FrameRequestCallback) => {
  const id = ++_rafId;
  _rafCallbacks.set(id, cb);
  // Execute asynchronously to avoid infinite recursion in tests
  Promise.resolve().then(() => {
    const fn = _rafCallbacks.get(id);
    if (fn) {
      _rafCallbacks.delete(id);
      fn(performance.now());
    }
  }).catch(() => undefined);
  return id;
});

(globalThis as unknown as Record<string, unknown>)['cancelAnimationFrame'] = vi.fn((id: number) => {
  _rafCallbacks.delete(id);
});

// ─── Cleanup ─────────────────────────────────────────────────────────────────

afterEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  document.body.innerHTML = '';
});
