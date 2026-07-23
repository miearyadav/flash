interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export class InstallBanner {
  private readonly el: HTMLElement;
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private dismissed = false;

  constructor() {
    this.el = this.build();
    document.body.appendChild(this.el);
    this.bindEvents();
  }

  private build(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'install-banner';
    el.setAttribute('role', 'complementary');
    el.setAttribute('aria-label', 'Install Flash app');
    el.id = 'install-banner';

    el.innerHTML = `
      <span class="install-banner__icon" aria-hidden="true">⚡</span>
      <div class="install-banner__text">
        <p class="install-banner__title">Install Flash</p>
        <p class="install-banner__desc">Add to home screen for instant access</p>
      </div>
      <div class="install-banner__actions">
        <button class="install-btn install-btn--secondary" id="install-dismiss" aria-label="Dismiss install prompt">
          Not now
        </button>
        <button class="install-btn install-btn--primary" id="install-confirm" aria-label="Install Flash app">
          Install
        </button>
      </div>
    `;

    return el;
  }

  private bindEvents(): void {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      if (!this.dismissed) {
        setTimeout(() => this.show(), 3000);
      }
    });

    window.addEventListener('appinstalled', () => {
      this.hide();
      this.deferredPrompt = null;
    });

    this.el.querySelector('#install-confirm')?.addEventListener('click', () => {
      void this.install();
    });

    this.el.querySelector('#install-dismiss')?.addEventListener('click', () => {
      this.dismissed = true;
      this.hide();
    });
  }

  private async install(): Promise<void> {
    if (!this.deferredPrompt) return;
    await this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      this.hide();
    }
    this.deferredPrompt = null;
  }

  private show(): void {
    this.el.classList.add('install-banner--visible');
  }

  private hide(): void {
    this.el.classList.remove('install-banner--visible');
  }

  destroy(): void {
    this.el.remove();
  }
}
