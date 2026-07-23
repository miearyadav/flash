import { bus } from '../core/eventBus.js';
import { SettingsPanel } from './settings.js';

export class LandingView {
  private readonly el: HTMLElement;
  private readonly settingsPanel: SettingsPanel;
  private readonly cleanups: Array<() => void> = [];

  constructor(container: HTMLElement) {
    this.settingsPanel = new SettingsPanel();
    this.el = this.build();
    container.appendChild(this.el);
    this.bindEvents();
  }

  private build(): HTMLElement {
    const el = document.createElement('section');
    el.className = 'view landing';
    el.id = 'landing-view';
    el.setAttribute('aria-label', 'Flash – Screen Flashlight');

    el.innerHTML = `
      <div class="landing-wordmark animate-fade-in">Flash</div>

      <button
        class="power-btn animate-scale-in"
        id="launch-btn"
        aria-label="Turn on Flash"
      >
        <span class="power-btn__ring" aria-hidden="true"></span>
        <span class="power-btn__ring power-btn__ring--2" aria-hidden="true"></span>
        <svg class="power-btn__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 3v9" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
          <path d="M6.34 6.34A9 9 0 1 0 17.66 6.34" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
        </svg>
      </button>

      <p class="landing-hint animate-fade-in animate-delay-2">Tap to turn on</p>

      <button
        class="landing-settings-btn animate-fade-in animate-delay-3"
        id="settings-btn"
        aria-label="Open settings"
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" width="18" height="18">
          <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" stroke-width="1.8"/>
        </svg>
        Settings
      </button>
    `;

    return el;
  }

  private bindEvents(): void {
    this.el.querySelector<HTMLButtonElement>('#launch-btn')?.addEventListener('click', () => {
      bus.emit('view:change', 'flash');
    });

    this.el.querySelector<HTMLButtonElement>('#settings-btn')?.addEventListener('click', () => {
      this.settingsPanel.open();
    });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') bus.emit('view:change', 'flash');
    };
    document.addEventListener('keydown', onKeyDown);
    this.cleanups.push(() => document.removeEventListener('keydown', onKeyDown));
  }

  show(): void {
    this.el.classList.remove('view--hidden');
    this.el.removeAttribute('aria-hidden');
  }

  hide(): void {
    this.el.classList.add('view--hidden');
    this.el.setAttribute('aria-hidden', 'true');
  }

  destroy(): void {
    this.cleanups.forEach((fn) => fn());
    this.settingsPanel.destroy();
    this.el.remove();
  }
}
