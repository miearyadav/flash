// ─── Color Modes ────────────────────────────────────────────────────────────

export type ColorModeId =
  | 'pure-white'
  | 'warm-white'
  | 'cool-white'
  | 'amber'
  | 'red'
  | 'green'
  | 'blue';

export interface ColorMode {
  id: ColorModeId;
  label: string;
  color: string;
  description: string;
}

// ─── Utility Modes ──────────────────────────────────────────────────────────

export type UtilityModeId = 'sos' | 'strobe' | 'beacon' | 'pulse';

export interface UtilityMode {
  id: UtilityModeId;
  label: string;
  description: string;
  icon: string;
}

// ─── Settings ───────────────────────────────────────────────────────────────

export interface FlashSettings {
  wakeLock: boolean;
  autoFullscreen: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
  cursorVisible: boolean;
  rememberPreferences: boolean;
  selectedColor: ColorModeId;
  brightness: number;
}

// ─── App State ───────────────────────────────────────────────────────────────

export type AppView = 'landing' | 'flash';

export interface AppState {
  view: AppView;
  activeColor: ColorModeId;
  activeUtility: UtilityModeId | null;
  isFullscreen: boolean;
  wakeLockActive: boolean;
  settings: FlashSettings;
}

// ─── Events ─────────────────────────────────────────────────────────────────

export type FlashEventType =
  | 'view:change'
  | 'color:change'
  | 'utility:start'
  | 'utility:stop'
  | 'fullscreen:change'
  | 'wakelock:change'
  | 'settings:change'
  | 'brightness:change';

export interface FlashEvent<T = unknown> {
  type: FlashEventType;
  payload: T;
}
