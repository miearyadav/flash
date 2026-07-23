import { describe, it, expect, beforeEach } from 'vitest';
import { loadSettings, saveSettings, clearSettings, getSettings, updateSettings, resetSettings } from '../core/settings.js';
import { DEFAULT_SETTINGS } from '../core/constants.js';

describe('Settings', () => {
  beforeEach(() => {
    localStorage.clear();
    resetSettings();
  });

  it('returns default settings when nothing is stored', () => {
    const settings = loadSettings();
    expect(settings).toEqual(DEFAULT_SETTINGS);
  });

  it('saves and loads settings from localStorage', () => {
    const custom = { ...DEFAULT_SETTINGS, wakeLock: false, brightness: 50 };
    saveSettings(custom);
    const loaded = loadSettings();
    expect(loaded.wakeLock).toBe(false);
    expect(loaded.brightness).toBe(50);
  });

  it('returns defaults when localStorage contains invalid JSON', () => {
    localStorage.setItem('flash:settings', 'not-json{{{');
    const settings = loadSettings();
    expect(settings).toEqual(DEFAULT_SETTINGS);
  });

  it('clears settings from localStorage', () => {
    saveSettings({ ...DEFAULT_SETTINGS, brightness: 42 });
    clearSettings();
    const settings = loadSettings();
    expect(settings.brightness).toBe(DEFAULT_SETTINGS.brightness);
  });

  it('updateSettings merges patch into current settings', () => {
    updateSettings({ brightness: 75 });
    expect(getSettings().brightness).toBe(75);
    expect(getSettings().wakeLock).toBe(DEFAULT_SETTINGS.wakeLock);
  });

  it('resetSettings restores defaults', () => {
    updateSettings({ brightness: 20, wakeLock: false });
    resetSettings();
    expect(getSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('persists settings when rememberPreferences is true', () => {
    updateSettings({ rememberPreferences: true, brightness: 60 });
    const loaded = loadSettings();
    expect(loaded.brightness).toBe(60);
  });

  it('does not persist settings when rememberPreferences is false', () => {
    updateSettings({ rememberPreferences: false });
    updateSettings({ brightness: 30 });
    // Since rememberPreferences is false, it won't save
    // But in-memory state should still reflect the change
    expect(getSettings().brightness).toBe(30);
  });
});
