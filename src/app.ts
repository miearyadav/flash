import { bus } from './core/eventBus.js';
import { LandingView } from './components/landing.js';
import { FlashView } from './components/flash.js';
import { InstallBanner } from './components/installBanner.js';
import type { AppView } from './core/types.js';

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

    this.bindEvents();
    this.navigateTo('landing');
  }

  private bindEvents(): void {
    const unsub = bus.on<AppView>('view:change', (view) => {
      void this.navigateTo(view);
    });
    this.cleanups.push(unsub);
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
