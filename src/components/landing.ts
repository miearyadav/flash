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
      <div class="logo animate-scale-in">
        <div class="logo__icon" aria-hidden="true">⚡</div>
        <h1 class="logo__wordmark">Flash</h1>
      </div>

      <div class="hero animate-fade-in animate-delay-1">
        <p class="hero__tagline">Your screen, at full brightness.</p>
        <p class="hero__description">
          Transform any display into a powerful flashlight.
          Perfect for emergencies, reading, photography, and more.
        </p>
      </div>

      <button
        class="cta-button animate-fade-in animate-delay-2"
        id="launch-btn"
        aria-label="Activate Flash – open full-screen white light"
      >
        <span class="cta-button__icon" aria-hidden="true">⚡</span>
        Activate Flash
      </button>

      <div class="features animate-fade-in animate-delay-3" aria-label="Features">
        <span class="feature-pill">7 Colors</span>
        <span class="feature-pill">SOS Mode</span>
        <span class="feature-pill">Strobe</span>
        <span class="feature-pill">Wake Lock</span>
        <span class="feature-pill">Fullscreen</span>
        <span class="feature-pill">PWA</span>
      </div>

      <button
        class="feature-pill animate-fade-in animate-delay-4"
        id="settings-btn"
        aria-label="Open settings"
        style="cursor:pointer; margin-top: var(--space-2);"
      >
        ⚙ Settings
      </button>
    `;

    return el;
  }

  private bindEvents(): void {
    const launchBtn = this.el.querySelector<HTMLButtonElement>('#launch-btn');
    launchBtn?.addEventListener('click', () => {
      bus.emit('view:change', 'flash');
    });

    const settingsBtn = this.el.querySelector<HTMLButtonElement>('#settings-btn');
    settingsBtn?.addEventListener('click', () => {
      this.settingsPanel.open();
    });

    // Keyboard shortcut: Space or Enter on focused button handled natively
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        bus.emit('view:change', 'flash');
      }
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
