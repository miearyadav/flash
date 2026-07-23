import { bus } from './core/eventBus.js';
import { LandingView } from './components/landing.js';
import { FlashView } from './components/flash.js';
import { InstallBanner } from './components/installBanner.js';
import { getSettings } from './core/settings.js';
import type { AppView, FlashSettings } from './core/types.js';

const ANIMATION_SPEED_MAP: Record<FlashSettings['animationSpeed'], string> = {
  slow: '2',
  normal: '1',
  fast: '0.5',
};

export class App {
  private readonly container: HTMLElement;
  private readonly landing: LandingView;
  private readonly flash: FlashView;
  private readonly installBanner: InstallBanner;
  private currentView: AppView = 'landing';
  private readonly cleanups: Array<() => void> = [];

  constructor(container: HTMLElement) {
    this.container = container;
    this.landing = new LandingView(this.container);
    this.flash = new FlashView(this.container);
    this.installBanner = new InstallBanner();

    this.applyAnimationSpeed(getSettings().animationSpeed);
    this.bindEvents();
    this.navigateTo('landing');
  }

  private applyAnimationSpeed(speed: FlashSettings['animationSpeed']): void {
    const multiplier = ANIMATION_SPEED_MAP[speed];
    document.documentElement.style.setProperty('--animation-speed-multiplier', multiplier);
    // Recompute duration tokens based on multiplier
    const base = { fast: 120, normal: 220, slow: 380, enter: 500 };
    const m = parseFloat(multiplier);
    document.documentElement.style.setProperty('--duration-fast', `${Math.round(base.fast * m)}ms`);
    document.documentElement.style.setProperty('--duration-normal', `${Math.round(base.normal * m)}ms`);
    document.documentElement.style.setProperty('--duration-slow', `${Math.round(base.slow * m)}ms`);
    document.documentElement.style.setProperty('--duration-enter', `${Math.round(base.enter * m)}ms`);
  }

  private bindEvents(): void {
    const unsub = bus.on<AppView>('view:change', (view) => {
      void this.navigateTo(view);
    });
    this.cleanups.push(unsub);

    const unsubSettings = bus.on<FlashSettings>('settings:change', (s) => {
      this.applyAnimationSpeed(s.animationSpeed);
    });
    this.cleanups.push(unsubSettings);
  }

  private async navigateTo(view: AppView): Promise<void> {
    if (view === this.currentView) return;
    this.currentView = view;

    if (view === 'flash') {
      this.landing.hide();
      await this.flash.show();
    } else {
      await this.flash.hide();
      this.landing.show();
    }
  }

  destroy(): void {
    this.cleanups.forEach((fn) => fn());
    this.landing.destroy();
    this.flash.destroy();
    this.installBanner.destroy();
  }
}
