import type { ColorMode, UtilityMode, FlashSettings } from './types.js';

// ─── Color Modes ────────────────────────────────────────────────────────────

export const COLOR_MODES: ColorMode[] = [
  {
    id: 'pure-white',
    label: 'Pure White',
    color: '#FFFFFF',
    description: 'Maximum brightness, pure white light',
  },
  {
    id: 'warm-white',
    label: 'Warm White',
    color: '#FFF5E0',
    description: 'Soft warm light, easy on the eyes',
  },
  {
    id: 'cool-white',
    label: 'Cool White',
    color: '#E8F4FF',
    description: 'Crisp cool daylight tone',
  },
  {
    id: 'amber',
    label: 'Amber',
    color: '#FFBF00',
    description: 'Warm amber, preserves night vision',
  },
  {
    id: 'red',
    label: 'Red',
    color: '#FF2D2D',
    description: 'Red light, ideal for astronomy',
  },
  {
    id: 'green',
    label: 'Green',
    color: '#00E676',
    description: 'Green light, high visibility',
  },
  {
    id: 'blue',
    label: 'Blue',
    color: '#2979FF',
    description: 'Blue light, calm and focused',
  },
];

// ─── Utility Modes ──────────────────────────────────────────────────────────

export const UTILITY_MODES: UtilityMode[] = [
  {
    id: 'sos',
    label: 'SOS',
    description: 'International distress signal',
    icon: '🆘',
  },
  {
    id: 'strobe',
    label: 'Strobe',
    description: 'Rapid flash for visibility',
    icon: '⚡',
  },
  {
    id: 'beacon',
    label: 'Beacon',
    description: 'Slow steady pulse',
    icon: '🔦',
  },
  {
    id: 'pulse',
    label: 'Pulse',
    description: 'Smooth breathing effect',
    icon: '💫',
  },
];

// ─── Default Settings ────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS: FlashSettings = {
  wakeLock: true,
  autoFullscreen: true,
  animationSpeed: 'normal',
  cursorVisible: false,
  rememberPreferences: true,
  selectedColor: 'pure-white',
  brightness: 100,
};

// ─── Timing Constants ────────────────────────────────────────────────────────

export const CURSOR_HIDE_DELAY = 3000; // ms
export const SETTINGS_KEY = 'flash:settings';

// ─── SOS Pattern (Morse: ... --- ...) ────────────────────────────────────────
// Each element: [on_ms, off_ms]
export const SOS_PATTERN: [number, number][] = [
  [200, 200], // S .
  [200, 200], // S .
  [200, 600], // S .
  [600, 200], // O -
  [600, 200], // O -
  [600, 600], // O -
  [200, 200], // S .
  [200, 200], // S .
  [200, 1400], // S . (long pause before repeat)
];

export const STROBE_INTERVAL = 80; // ms
export const BEACON_ON = 200;
export const BEACON_OFF = 2800;
export const PULSE_DURATION = 2000; // ms for one full breath cycle
