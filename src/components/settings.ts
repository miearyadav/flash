import { getSettings, updateSettings, resetSettings } from '../core/settings.js';
import { bus } from '../core/eventBus.js';
import { showToast } from './toast.js';
import type { FlashSettings } from '../core/types.js';

export class SettingsPanel {
  private readonly overlay: HTMLElement;
  private readonly panel: HTMLElement;
  private isOpen = false;
  private readonly cleanups: Array<() => void> = [];

  constructor() {
    this.overlay = this.buildOverlay();
    this.panel = this.overlay.querySelector('.settings-panel') as HTMLElement;
    document.body.appendChild(this.overlay);
    this.bindEvents();
  }

  private buildOverlay(): HTMLElement {
    const overlay = document.createElement('div');
    overlay.className = 'settings-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Settings');
    overlay.id = 'settings-overlay';

    overlay.innerHTML = `
      <div class="settings-panel" role="document">
        <div class="settings-header">
          <h2 class="settings-title">Settings</h2>
          <button class="settings-close" aria-label="Close settings" data-action="close">✕</button>
        </div>

        <div class="settings-section">
          <p class="settings-section-title">Display</p>

          <div class="settings-row">
            <div class="settings-row-info">
              <span class="settings-row-label">Wake Lock</span>
              <span class="settings-row-desc">Keep screen on while Flash is active</span>
            </div>
            <label class="toggle" aria-label="Wake Lock">
              <input type="checkbox" class="toggle__input" data-setting="wakeLock" />
              <span class="toggle__track" tabindex="0" role="switch" aria-checked="false"></span>
              <span class="toggle__thumb"></span>
            </label>
          </div>

          <div class="settings-row">
            <div class="settings-row-info">
              <span class="settings-row-label">Auto Fullscreen</span>
              <span class="settings-row-desc">Enter fullscreen when Flash activates</span>
            </div>
            <label class="toggle" aria-label="Auto Fullscreen">
              <input type="checkbox" class="toggle__input" data-setting="autoFullscreen" />
              <span class="toggle__track" tabindex="0" role="switch" aria-checked="false"></span>
              <span class="toggle__thumb"></span>
            </label>
          </div>

          <div class="settings-row">
            <div class="settings-row-info">
              <span class="settings-row-label">Show Cursor</span>
              <span class="settings-row-desc">Keep cursor visible in Flash mode</span>
            </div>
            <label class="toggle" aria-label="Show Cursor">
              <input type="checkbox" class="toggle__input" data-setting="cursorVisible" />
              <span class="toggle__track" tabindex="0" role="switch" aria-checked="false"></span>
              <span class="toggle__thumb"></span>
            </label>
          </div>
        </div>

        <div class="settings-section">
          <p class="settings-section-title">Preferences</p>

          <div class="settings-row">
            <div class="settings-row-info">
              <span class="settings-row-label">Animation Speed</span>
              <span class="settings-row-desc">Transition speed for effects</span>
            </div>
            <select class="settings-select" data-setting="animationSpeed" aria-label="Animation Speed">
              <option value="slow">Slow</option>
              <option value="normal">Normal</option>
              <option value="fast">Fast</option>
            </select>
          </div>

          <div class="settings-row">
            <div class="settings-row-info">
              <span class="settings-row-label">Remember Preferences</span>
              <span class="settings-row-desc">Save settings between sessions</span>
            </div>
            <label class="toggle" aria-label="Remember Preferences">
              <input type="checkbox" class="toggle__input" data-setting="rememberPreferences" />
              <span class="toggle__track" tabindex="0" role="switch" aria-checked="false"></span>
              <span class="toggle__thumb"></span>
            </label>
          </div>
        </div>

        <div class="settings-section">
          <p class="settings-section-title">Reset</p>
          <div class="settings-row">
            <div class="settings-row-info">
              <span class="settings-row-label">Reset All Settings</span>
              <span class="settings-row-desc">Restore defaults and clear saved data</span>
            </div>
            <button class="install-btn install-btn--secondary" data-action="reset" style="white-space:nowrap">
              Reset
            </button>
          </div>
        </div>
      </div>
    `;

    return overlay;
  }

  private bindEvents(): void {
    // Close on overlay click
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });

    // Close button
    this.overlay.querySelector('[data-action="close"]')?.addEventListener('click', () => this.close());

    // Reset button
    this.overlay.querySelector('[data-action="reset"]')?.addEventListener('click', () => {
      resetSettings();
      this.syncUI();
      showToast('Settings reset to defaults');
    });

    // Toggle inputs
    this.overlay.querySelectorAll<HTMLInputElement>('.toggle__input').forEach((input) => {
      input.addEventListener('change', () => {
        const key = input.dataset['setting'] as keyof FlashSettings;
        if (!key) return;
        const patch: Partial<FlashSettings> = {};
        (patch as Record<string, unknown>)[key] = input.checked;
        updateSettings(patch);
        const track = input.nextElementSibling;
        if (track) track.setAttribute('aria-checked', String(input.checked));
      });
    });

    // Select inputs
    this.overlay.querySelectorAll<HTMLSelectElement>('.settings-select').forEach((select) => {
      select.addEventListener('change', () => {
        const key = select.dataset['setting'] as keyof FlashSettings;
        if (!key) return;
        const patch: Partial<FlashSettings> = {};
        (patch as Record<string, unknown>)[key] = select.value;
        updateSettings(patch);
      });
    });

    // Keyboard: ESC closes
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    };
    document.addEventListener('keydown', onKeyDown);
    this.cleanups.push(() => document.removeEventListener('keydown', onKeyDown));

    // Sync when settings change externally
    const unsub = bus.on('settings:change', () => this.syncUI());
    this.cleanups.push(unsub);
  }

  private syncUI(): void {
    const s = getSettings();

    const checkboxes = this.overlay.querySelectorAll<HTMLInputElement>('.toggle__input');
    checkboxes.forEach((input) => {
      const key = input.dataset['setting'] as keyof FlashSettings;
      if (!key) return;
      const val = s[key];
      if (typeof val === 'boolean') {
        input.checked = val;
        const track = input.nextElementSibling;
        if (track) track.setAttribute('aria-checked', String(val));
      }
    });

    const selects = this.overlay.querySelectorAll<HTMLSelectElement>('.settings-select');
    selects.forEach((select) => {
      const key = select.dataset['setting'] as keyof FlashSettings;
      if (!key) return;
      const val = s[key];
      if (typeof val === 'string') select.value = val;
    });
  }

  open(): void {
    this.syncUI();
    this.overlay.classList.add('settings-overlay--open');
    this.isOpen = true;

    // Focus management
    const firstFocusable = this.panel.querySelector<HTMLElement>(
      'button, input, select, [tabindex="0"]'
    );
    firstFocusable?.focus();
  }

  close(): void {
    this.overlay.classList.remove('settings-overlay--open');
    this.isOpen = false;
  }

  toggle(): void {
    if (this.isOpen) this.close();
    else this.open();
  }

  destroy(): void {
    this.cleanups.forEach((fn) => fn());
    this.overlay.remove();
  }
}
