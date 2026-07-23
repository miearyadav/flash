import { bus } from '../core/eventBus.js';
import { getSettings, updateSettings } from '../core/settings.js';
import { COLOR_MODES, UTILITY_MODES, CURSOR_HIDE_DELAY } from '../core/constants.js';
import { enterFullscreen, exitFullscreen, isFullscreen } from '../core/fullscreen.js';
import { requestWakeLock, releaseWakeLock, isWakeLockSupported } from '../core/wakeLock.js';
import { startUtility, stopUtility, getActiveUtility } from '../core/utilities.js';
import { showToast } from './toast.js';
import type { ColorModeId, UtilityModeId } from '../core/types.js';

export class FlashView {
  private readonly el: HTMLElement;
  private readonly topbar: HTMLElement;
  private readonly controls: HTMLElement;
  private readonly cleanups: Array<() => void> = [];

  private cursorTimer: ReturnType<typeof setTimeout> | null = null;
  private controlsTimer: ReturnType<typeof setTimeout> | null = null;
  private isVisible = false;

  constructor(container: HTMLElement) {
    this.el = this.buildFlashScreen();
    this.topbar = this.el.querySelector('.flash-topbar')!;
    this.controls = this.el.querySelector('.flash-controls')!;
    container.appendChild(this.el);
    this.bindEvents();
  }

  private buildFlashScreen(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'flash-view flash-view--hidden';
    el.id = 'flash-view';
    el.setAttribute('role', 'main');
    el.setAttribute('aria-label', 'Flash active – screen flashlight');
    el.setAttribute('aria-live', 'polite');

    // Build color swatches
    const swatches = COLOR_MODES.map(
      (mode) => `
      <button
        class="color-swatch${mode.id === 'pure-white' ? ' color-swatch--active' : ''}"
        style="background:${mode.color}"
        data-color="${mode.id}"
        aria-label="${mode.label}"
        title="${mode.description}"
        aria-pressed="${mode.id === 'pure-white'}"
      ></button>
    `
    ).join('');

    // Build utility buttons
    const utilityBtns = UTILITY_MODES.map(
      (u) => `
      <button
        class="utility-btn"
        data-utility="${u.id}"
        aria-label="${u.label}: ${u.description}"
        aria-pressed="false"
      >
        <span aria-hidden="true">${u.icon}</span>
        ${u.label}
      </button>
    `
    ).join('');

    el.innerHTML = `
      <!-- Top Bar -->
      <div class="flash-topbar" role="toolbar" aria-label="Flash controls">
        <button class="flash-exit-btn" id="flash-exit-btn" aria-label="Exit Flash mode">
          ← Exit
        </button>
        <div class="flash-status" aria-live="polite" aria-label="Status">
          <span class="status-dot" id="wakelock-dot" aria-hidden="true"></span>
          <span id="status-label">Flash</span>
        </div>
        <button class="flash-exit-btn" id="settings-flash-btn" aria-label="Open settings">
          ⚙
        </button>
      </div>

      <!-- Bottom Controls -->
      <div class="flash-controls" role="group" aria-label="Color and utility controls">
        <!-- Brightness -->
        <div class="brightness-control">
          <span class="brightness-icon" aria-hidden="true">☀</span>
          <input
            type="range"
            class="brightness-slider"
            id="brightness-slider"
            min="10"
            max="100"
            value="100"
            step="1"
            aria-label="Brightness"
          />
          <span class="brightness-icon" aria-hidden="true" style="opacity:1">☀</span>
        </div>

        <!-- Color Picker -->
        <div class="color-picker" role="group" aria-label="Color modes">
          ${swatches}
        </div>

        <!-- Utility Bar -->
        <div class="utility-bar" role="group" aria-label="Utility modes">
          ${utilityBtns}
        </div>
      </div>
    `;

    return el;
  }

  private bindEvents(): void {
    // Exit button
    this.el.querySelector('#flash-exit-btn')?.addEventListener('click', () => {
      bus.emit('view:change', 'landing');
    });

    // Settings button
    this.el.querySelector('#settings-flash-btn')?.addEventListener('click', () => {
      bus.emit('view:change', 'landing');
      // Small delay to let landing view show first
      setTimeout(() => {
        const settingsBtn = document.querySelector<HTMLButtonElement>('#settings-btn');
        settingsBtn?.click();
      }, 100);
    });

    // Color swatches
    this.el.querySelectorAll<HTMLButtonElement>('.color-swatch').forEach((btn) => {
      btn.addEventListener('click', () => {
        const colorId = btn.dataset['color'] as ColorModeId;
        if (colorId) this.setColor(colorId);
      });
    });

    // Utility buttons
    this.el.querySelectorAll<HTMLButtonElement>('.utility-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const utilityId = btn.dataset['utility'] as UtilityModeId;
        if (!utilityId) return;

        const current = getActiveUtility();
        if (current === utilityId) {
          stopUtility();
          this.updateUtilityUI(null);
        } else {
          startUtility(utilityId, (on, opacity) => {
            this.el.style.opacity = on ? String(opacity ?? 1) : '0';
          });
          this.updateUtilityUI(utilityId);
        }
      });
    });

    // Brightness slider
    const slider = this.el.querySelector<HTMLInputElement>('#brightness-slider');
    slider?.addEventListener('input', () => {
      const val = Number(slider.value);
      this.applyBrightness(val);
      updateSettings({ brightness: val });
    });

    // Cursor / controls hide on inactivity
    const onActivity = () => this.resetInactivityTimers();
    this.el.addEventListener('mousemove', onActivity);
    this.el.addEventListener('touchstart', onActivity, { passive: true });
    this.el.addEventListener('click', onActivity);
    this.cleanups.push(() => {
      this.el.removeEventListener('mousemove', onActivity);
      this.el.removeEventListener('touchstart', onActivity);
      this.el.removeEventListener('click', onActivity);
    });

    // Keyboard shortcuts
    const onKeyDown = (e: KeyboardEvent) => {
      if (!this.isVisible) return;
      switch (e.key) {
        case 'Escape':
          bus.emit('view:change', 'landing');
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (slider) {
            slider.value = String(Math.min(100, Number(slider.value) + 5));
            slider.dispatchEvent(new Event('input'));
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (slider) {
            slider.value = String(Math.max(10, Number(slider.value) - 5));
            slider.dispatchEvent(new Event('input'));
          }
          break;
        case 'f':
        case 'F':
          void (isFullscreen() ? exitFullscreen() : enterFullscreen());
          break;
      }
    };
    document.addEventListener('keydown', onKeyDown);
    this.cleanups.push(() => document.removeEventListener('keydown', onKeyDown));

    // Touch swipe down to exit
    let touchStartY = 0;
    this.el.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0]?.clientY ?? 0;
    }, { passive: true });
    this.el.addEventListener('touchend', (e) => {
      const endY = e.changedTouches[0]?.clientY ?? 0;
      if (endY - touchStartY > 80) {
        bus.emit('view:change', 'landing');
      }
    }, { passive: true });

    // Wake lock status
    const unsub = bus.on<boolean>('wakelock:change', (active) => {
      this.updateWakeLockUI(active);
    });
    this.cleanups.push(unsub);

    // Fullscreen change
    const unsubFs = bus.on<boolean>('fullscreen:change', (active) => {
      if (!active && this.isVisible) {
        // User pressed ESC in fullscreen – stay in flash mode
        showToast('Press ESC again or swipe down to exit Flash');
      }
    });
    this.cleanups.push(unsubFs);
  }

  private setColor(colorId: ColorModeId): void {
    const mode = COLOR_MODES.find((m) => m.id === colorId);
    if (!mode) return;

    this.el.style.backgroundColor = mode.color;
    updateSettings({ selectedColor: colorId });

    // Update swatch active state
    this.el.querySelectorAll<HTMLButtonElement>('.color-swatch').forEach((btn) => {
      const isActive = btn.dataset['color'] === colorId;
      btn.classList.toggle('color-swatch--active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });

    // Stop any active utility when changing color
    if (getActiveUtility()) {
      stopUtility();
      this.updateUtilityUI(null);
    }

    // Reset opacity
    this.el.style.opacity = '1';
  }

  private updateUtilityUI(activeId: UtilityModeId | null): void {
    this.el.querySelectorAll<HTMLButtonElement>('.utility-btn').forEach((btn) => {
      const isActive = btn.dataset['utility'] === activeId;
      btn.classList.toggle('utility-btn--active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });
  }

  private updateWakeLockUI(active: boolean): void {
    const dot = this.el.querySelector('#wakelock-dot');
    const label = this.el.querySelector('#status-label');
    dot?.classList.toggle('status-dot--active', active);
    if (label) label.textContent = active ? 'Wake Lock On' : 'Flash';
  }

  private applyBrightness(value: number): void {
    // Brightness via CSS filter on a wrapper or direct opacity on a dark overlay
    const normalized = value / 100;
    // We use a CSS custom property to drive a brightness filter
    this.el.style.setProperty('--flash-brightness', String(normalized));
    // Apply via filter for true brightness control
    this.el.style.filter = `brightness(${normalized})`;
  }

  private resetInactivityTimers(): void {
    const settings = getSettings();

    // Show controls
    this.topbar.classList.remove('flash-topbar--hidden');
    this.controls.classList.remove('flash-controls--hidden');

    // Show cursor
    if (!settings.cursorVisible) {
      this.el.classList.remove('flash-view--cursor-visible');
    }

    // Reset cursor hide timer
    if (this.cursorTimer) clearTimeout(this.cursorTimer);
    if (!settings.cursorVisible) {
      this.cursorTimer = setTimeout(() => {
        this.el.classList.add('flash-view--cursor-visible');
        this.el.style.cursor = 'none';
      }, CURSOR_HIDE_DELAY);
    }

    // Reset controls hide timer
    if (this.controlsTimer) clearTimeout(this.controlsTimer);
    this.controlsTimer = setTimeout(() => {
      this.topbar.classList.add('flash-topbar--hidden');
      this.controls.classList.add('flash-controls--hidden');
    }, CURSOR_HIDE_DELAY + 500);
  }

  async show(): Promise<void> {
    const settings = getSettings();

    // Apply saved color
    const savedColor = COLOR_MODES.find((m) => m.id === settings.selectedColor) ?? COLOR_MODES[0]!;
    this.el.style.backgroundColor = savedColor.color;
    this.el.querySelectorAll<HTMLButtonElement>('.color-swatch').forEach((btn) => {
      const isActive = btn.dataset['color'] === settings.selectedColor;
      btn.classList.toggle('color-swatch--active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });

    // Apply saved brightness
    const slider = this.el.querySelector<HTMLInputElement>('#brightness-slider');
    if (slider) {
      slider.value = String(settings.brightness);
      this.applyBrightness(settings.brightness);
    }

    // Show
    this.el.classList.remove('flash-view--hidden');
    this.isVisible = true;

    // Reset opacity
    this.el.style.opacity = '1';

    // Fullscreen
    if (settings.autoFullscreen) {
      const ok = await enterFullscreen();
      if (!ok) showToast('Fullscreen unavailable in this browser');
    }

    // Wake Lock
    if (settings.wakeLock) {
      if (isWakeLockSupported()) {
        const ok = await requestWakeLock();
        if (!ok) showToast('Wake Lock unavailable – screen may dim');
      } else {
        showToast('Wake Lock not supported in this browser');
      }
    }

    // Start inactivity timers
    this.resetInactivityTimers();

    // Announce to screen readers
    this.el.setAttribute('aria-label', `Flash active – ${savedColor.label} mode`);
  }

  async hide(): Promise<void> {
    this.isVisible = false;

    // Stop utilities
    stopUtility();
    this.updateUtilityUI(null);

    // Clear timers
    if (this.cursorTimer) clearTimeout(this.cursorTimer);
    if (this.controlsTimer) clearTimeout(this.controlsTimer);

    // Release wake lock
    await releaseWakeLock();

    // Exit fullscreen
    await exitFullscreen();

    // Hide
    this.el.classList.add('flash-view--hidden');

    // Reset cursor
    this.el.classList.remove('flash-view--cursor-visible');
  }

  destroy(): void {
    this.cleanups.forEach((fn) => fn());
    void this.hide();
    this.el.remove();
  }
}
