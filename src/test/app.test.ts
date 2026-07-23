import { describe, it, expect, beforeEach, vi } from 'vitest';
import { App } from '../app.js';
import { bus } from '../core/eventBus.js';

describe('App', () => {
  let container: HTMLDivElement;
  let app: App;

  beforeEach(() => {
    bus.clear();
    container = document.createElement('div');
    container.id = 'app';
    document.body.appendChild(container);
    app = new App(container);
  });

  it('renders landing view on init', () => {
    const landing = container.querySelector('#landing-view');
    expect(landing).not.toBeNull();
  });

  it('renders flash view element on init', () => {
    const flash = container.querySelector('#flash-view');
    expect(flash).not.toBeNull();
  });

  it('landing view is visible initially', () => {
    const landing = container.querySelector('#landing-view');
    expect(landing?.classList.contains('view--hidden')).toBe(false);
  });

  it('flash view is hidden initially', () => {
    const flash = container.querySelector('#flash-view');
    expect(flash?.classList.contains('flash-view--hidden')).toBe(true);
  });

  it('navigates to flash view on view:change event', async () => {
    bus.emit('view:change', 'flash');
    // Allow async operations to settle
    await vi.waitFor(() => {
      const flash = container.querySelector('#flash-view');
      return !flash?.classList.contains('flash-view--hidden');
    });
    const flash = container.querySelector('#flash-view');
    expect(flash?.classList.contains('flash-view--hidden')).toBe(false);
  });

  it('navigates back to landing on view:change landing', async () => {
    // Go to flash first
    bus.emit('view:change', 'flash');
    await vi.waitFor(
      () => {
        const flash = container.querySelector('#flash-view');
        if (flash?.classList.contains('flash-view--hidden')) throw new Error('not yet');
      },
      { timeout: 2000 }
    );

    // Go back to landing
    bus.emit('view:change', 'landing');
    await vi.waitFor(
      () => {
        const landing = container.querySelector('#landing-view');
        if (landing?.classList.contains('view--hidden')) throw new Error('not yet');
      },
      { timeout: 2000 }
    );

    const landing = container.querySelector('#landing-view');
    expect(landing?.classList.contains('view--hidden')).toBe(false);
  });

  it('CTA button triggers flash view', async () => {
    const btn = container.querySelector<HTMLButtonElement>('#launch-btn');
    btn?.click();

    await vi.waitFor(() => {
      const flash = container.querySelector('#flash-view');
      return !flash?.classList.contains('flash-view--hidden');
    });

    const flash = container.querySelector('#flash-view');
    expect(flash?.classList.contains('flash-view--hidden')).toBe(false);
  });

  it('destroy cleans up without errors', () => {
    expect(() => app.destroy()).not.toThrow();
  });
});
