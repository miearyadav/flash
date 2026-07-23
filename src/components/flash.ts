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
  private readonly sheet: HTMLElement;
  private readonly cleanups: Array<() => void> = [];

  private cursorTimer: ReturnType<typeof setTimeout> | null = null;
  private sheetVisible = false;
  private isVisible = false;

  // Sheet drag state
  private dragStartY = 0;
  private dragCurrentY = 0;
  private isDragging = false;

  constructor(container: HTMLElement) {
    this.el = this.buildFlashScreen();
    this.sheet = this.el.querySelector('.flash-sheet')!;
    container.appendChild(this.el);
    this.bindEvents();
  }

  private buildFlashScreen(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'flash-view flash-view--hidden';
    el.id = 'flash-view';
    el.setAttribute('role', 'main');
    el.setAttribute('aria-label', 'Flash active');

    const swatches = COLOR_MODES.map((mode) => `
      <button
        class="color-swatch${mode.id === 'pure-white' ? ' color-swatch--active' : ''}"
        style="background:${mode.color}"
        data-color="${mode.id}"
        aria-label="${mode.label}"
        aria-pressed="${mode.id === 'pure-white'}"
      ></button>
    `).join('');

    const utilityBtns = UTILITY_MODES.map((u) => `
      <button
        class="utility-btn"
        data-utility="${u.id}"
        aria-label="${u.label}"
        aria-pressed="false"
      >
        <span class="utility-btn__icon" aria-hidden="true">${u.icon}</span>
        <span class="utility-btn__label">${u.label}</span>
      </button>
    `).join('');

    el.innerHTML = `
<<<<<<< HEAD
      <!-- Full-screen background (brightness filter applied here) -->
      <div class="flash-bg" aria-hidden="true"></div>
=======
      <!-- Background layer (brightness filter applied here only) -->
      <div class="flash-bg" aria-hidden="true"></div>

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
>>>>>>> 94c973a7034290d01fcdc8a8a0fa1d16af785faf

      <!-- Bottom sheet — slides up on tap -->
      <div
        class="flash-sheet"
        role="region"
        aria-label="Flash controls"
        aria-hidden="true"
      >
        <!-- Drag handle -->
        <div class="flash-sheet__handle-area" id="sheet-handle-area" aria-hidden="true">
          <div class="flash-sheet__handle"></div>
        </div>

        <!-- Sheet content -->
        <div class="flash-sheet__content">

          <!-- Row 1: Brightness -->
          <div class="sheet-section">
            <div class="brightness-row">
              <svg class="brightness-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true" width="16" height="16">
                <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.8"/>
                <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
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
              <svg class="brightness-icon brightness-icon--bright" viewBox="0 0 24 24" fill="none" aria-hidden="true" width="20" height="20">
                <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.8"/>
                <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
            </div>
          </div>

          <!-- Row 2: Color swatches -->
          <div class="sheet-section">
            <div class="color-picker" role="group" aria-label="Color">
              ${swatches}
            </div>
          </div>

          <!-- Row 3: Utilities -->
          <div class="sheet-section">
            <div class="utility-bar" role="group" aria-label="Modes">
              ${utilityBtns}
            </div>
          </div>

          <!-- Row 4: Actions -->
          <div class="sheet-section sheet-actions">
            <button class="sheet-action-btn" id="flash-settings-btn" aria-label="Settings">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" width="18" height="18">
                <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" stroke-width="1.8"/>
              </svg>
              Settings
            </button>

            <button class="sheet-power-btn" id="flash-exit-btn" aria-label="Turn off Flash">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" width="20" height="20">
                <path d="M12 3v9" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
                <path d="M6.34 6.34A9 9 0 1 0 17.66 6.34" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
              </svg>
            </button>

            <button class="sheet-action-btn" id="flash-fullscreen-btn" aria-label="Toggle fullscreen">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" width="18" height="18">
                <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Fullscreen
            </button>
          </div>

        </div>
      </div>
    `;

    return el;
  }

  private bindEvents(): void {
    // Tap on the bright background → toggle sheet
    this.el.querySelector('.flash-bg')?.addEventListener('click', () => {
      this.toggleSheet();
    });

    // Exit (power off)
    this.el.querySelector('#flash-exit-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      bus.emit('view:change', 'landing');
    });

    // Settings
    this.el.querySelector('#flash-settings-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      bus.emit('view:change', 'landing');
      setTimeout(() => {
        document.querySelector<HTMLButtonElement>('#settings-btn')?.click();
      }, 120);
    });

    // Fullscreen toggle
    this.el.querySelector('#flash-fullscreen-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      void (isFullscreen() ? exitFullscreen() : enterFullscreen());
    });

    // Color swatches
    this.el.querySelectorAll<HTMLButtonElement>('.color-swatch').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const colorId = btn.dataset['color'] as ColorModeId;
        if (colorId) this.setColor(colorId);
      });
    });

    // Utility buttons
    this.el.querySelectorAll<HTMLButtonElement>('.utility-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const utilityId = btn.dataset['utility'] as UtilityModeId;
        if (!utilityId) return;
        const current = getActiveUtility();
        if (current === utilityId) {
          stopUtility();
          this.updateUtilityUI(null);
        } else {
          startUtility(utilityId, (on, opacity) => {
<<<<<<< HEAD
=======
            // Apply flash effect to background layer only, keeping controls visible
>>>>>>> 94c973a7034290d01fcdc8a8a0fa1d16af785faf
            this.bg.style.opacity = on ? String(opacity ?? 1) : '0';
          });
          this.updateUtilityUI(utilityId);
        }
      });
    });

    // Brightness slider
    const slider = this.el.querySelector<HTMLInputElement>('#brightness-slider');
    slider?.addEventListener('input', (e) => {
      e.stopPropagation();
      const val = Number(slider.value);
      this.applyBrightness(val);
      updateSettings({ brightness: val });
    });

    // Sheet drag-to-dismiss (touch)
    const handleArea = this.el.querySelector<HTMLElement>('#sheet-handle-area');
    handleArea?.addEventListener('touchstart', (e) => {
      this.isDragging = true;
      this.dragStartY = e.touches[0]?.clientY ?? 0;
      this.dragCurrentY = this.dragStartY;
      this.sheet.style.transition = 'none';
    }, { passive: true });

    handleArea?.addEventListener('touchmove', (e) => {
      if (!this.isDragging) return;
      this.dragCurrentY = e.touches[0]?.clientY ?? 0;
      const delta = Math.max(0, this.dragCurrentY - this.dragStartY);
      this.sheet.style.transform = `translateY(${delta}px)`;
    }, { passive: true });

    handleArea?.addEventListener('touchend', () => {
      if (!this.isDragging) return;
      this.isDragging = false;
      this.sheet.style.transition = '';
      const delta = this.dragCurrentY - this.dragStartY;
      if (delta > 80) {
        this.hideSheet();
      } else {
        this.sheet.style.transform = '';
      }
    });

    // Keyboard
    const onKeyDown = (e: KeyboardEvent) => {
      if (!this.isVisible) return;
      switch (e.key) {
        case 'Escape':
          if (this.sheetVisible) this.hideSheet();
          else bus.emit('view:change', 'landing');
          break;
        case ' ':
          e.preventDefault();
          this.toggleSheet();
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

    // Cursor hide
    const onActivity = () => this.resetCursorTimer();
    this.el.addEventListener('mousemove', onActivity);
    this.cleanups.push(() => this.el.removeEventListener('mousemove', onActivity));

    // Wake lock
    const unsub = bus.on<boolean>('wakelock:change', (_active) => { /* status tracked internally */ });
    this.cleanups.push(unsub);

    // Fullscreen change
    const unsubFs = bus.on<boolean>('fullscreen:change', (_active) => { /* no-op */ });
    this.cleanups.push(unsubFs);
  }

  private get bg(): HTMLElement {
    return this.el.querySelector<HTMLElement>('.flash-bg') ?? this.el;
  }

<<<<<<< HEAD
  private toggleSheet(): void {
    if (this.sheetVisible) this.hideSheet();
    else this.showSheet();
  }

  private showSheet(): void {
    this.sheetVisible = true;
    this.sheet.classList.add('flash-sheet--visible');
    this.sheet.setAttribute('aria-hidden', 'false');
    // Focus first interactive element
    const first = this.sheet.querySelector<HTMLElement>('input, button');
    first?.focus();
  }

  private hideSheet(): void {
    this.sheetVisible = false;
    this.sheet.style.transform = '';
    this.sheet.classList.remove('flash-sheet--visible');
    this.sheet.setAttribute('aria-hidden', 'true');
  }

  private setColor(colorId: ColorModeId): void {
    const mode = COLOR_MODES.find((m) => m.id === colorId);
    if (!mode) return;
=======
  private setColor(colorId: ColorModeId): void {
    const mode = COLOR_MODES.find((m) => m.id === colorId);
    if (!mode) return;

>>>>>>> 94c973a7034290d01fcdc8a8a0fa1d16af785faf
    this.bg.style.backgroundColor = mode.color;
    updateSettings({ selectedColor: colorId });
    this.el.querySelectorAll<HTMLButtonElement>('.color-swatch').forEach((btn) => {
      const isActive = btn.dataset['color'] === colorId;
      btn.classList.toggle('color-swatch--active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });
    if (getActiveUtility()) {
      stopUtility();
      this.updateUtilityUI(null);
    }
<<<<<<< HEAD
=======

    // Reset background opacity
>>>>>>> 94c973a7034290d01fcdc8a8a0fa1d16af785faf
    this.bg.style.opacity = '1';
  }

  private updateUtilityUI(activeId: UtilityModeId | null): void {
    this.el.querySelectorAll<HTMLButtonElement>('.utility-btn').forEach((btn) => {
      const isActive = btn.dataset['utility'] === activeId;
      btn.classList.toggle('utility-btn--active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });
  }

  private applyBrightness(value: number): void {
<<<<<<< HEAD
    const normalized = value / 100;
    const bg = this.el.querySelector<HTMLElement>('.flash-bg');
    if (bg) bg.style.filter = `brightness(${normalized})`;
=======
    // Apply brightness only to the background layer, not the controls overlay.
    // We use a CSS custom property that drives the background pseudo-element opacity.
    const normalized = value / 100;
    this.el.style.setProperty('--flash-brightness', String(normalized));
    // The background div (first child) gets the filter; controls are siblings above it.
    const bg = this.el.querySelector<HTMLElement>('.flash-bg');
    if (bg) {
      bg.style.filter = `brightness(${normalized})`;
    } else {
      // Fallback: apply to whole element (controls will dim too, acceptable degradation)
      this.el.style.filter = `brightness(${normalized})`;
    }
>>>>>>> 94c973a7034290d01fcdc8a8a0fa1d16af785faf
  }

  private resetCursorTimer(): void {
    const settings = getSettings();
    if (settings.cursorVisible) return;
    this.el.style.cursor = 'default';
    if (this.cursorTimer) clearTimeout(this.cursorTimer);
    this.cursorTimer = setTimeout(() => {
      if (!this.sheetVisible) this.el.style.cursor = 'none';
    }, CURSOR_HIDE_DELAY);
  }

  async show(): Promise<void> {
    const settings = getSettings();

    // Apply saved color
    const savedColor = COLOR_MODES.find((m) => m.id === settings.selectedColor) ?? COLOR_MODES[0]!;
    this.bg.style.backgroundColor = savedColor.color;
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

    this.bg.style.opacity = '1';
    this.el.classList.remove('flash-view--hidden');
    this.isVisible = true;

<<<<<<< HEAD
=======
    // Reset background opacity
    this.bg.style.opacity = '1';

>>>>>>> 94c973a7034290d01fcdc8a8a0fa1d16af785faf
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

    this.resetCursorTimer();
    this.el.setAttribute('aria-label', `Flash active – ${savedColor.label}`);
  }

  async hide(): Promise<void> {
    this.isVisible = false;
    this.hideSheet();
    stopUtility();
    this.updateUtilityUI(null);
    if (this.cursorTimer) clearTimeout(this.cursorTimer);
    await releaseWakeLock();
    await exitFullscreen();
    this.el.classList.add('flash-view--hidden');
    this.el.style.cursor = '';
  }

  destroy(): void {
    this.cleanups.forEach((fn) => fn());
    void this.hide();
    this.el.remove();
  }
}
