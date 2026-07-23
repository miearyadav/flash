import type { FlashSettings } from './types.js';
import { DEFAULT_SETTINGS, SETTINGS_KEY } from './constants.js';
import { bus } from './eventBus.js';

function isValidSettings(value: unknown): value is Partial<FlashSettings> {
  return typeof value === 'object' && value !== null;
}

export function loadSettings(): FlashSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed: unknown = JSON.parse(raw);
    if (!isValidSettings(parsed)) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: FlashSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Storage unavailable – silently ignore
  }
}

export function clearSettings(): void {
  try {
    localStorage.removeItem(SETTINGS_KEY);
  } catch {
    // Storage unavailable – silently ignore
  }
}

// ─── Reactive Settings Store ─────────────────────────────────────────────────

let _settings: FlashSettings = loadSettings();

export function getSettings(): FlashSettings {
  return { ..._settings };
}

export function updateSettings(patch: Partial<FlashSettings>): void {
  _settings = { ..._settings, ...patch };
  if (_settings.rememberPreferences) {
    saveSettings(_settings);
  }
  bus.emit('settings:change', { ..._settings });
}

export function resetSettings(): void {
  _settings = { ...DEFAULT_SETTINGS };
  clearSettings();
  bus.emit('settings:change', { ..._settings });
}
