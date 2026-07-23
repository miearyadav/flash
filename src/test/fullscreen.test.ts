import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isFullscreenSupported, isFullscreen, enterFullscreen, exitFullscreen } from '../core/fullscreen.js';

describe('Fullscreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(document, 'fullscreenElement', {
      value: null,
      writable: true,
      configurable: true,
    });
  });

  it('detects fullscreen support', () => {
    expect(isFullscreenSupported()).toBe(true);
  });

  it('reports not in fullscreen initially', () => {
    expect(isFullscreen()).toBe(false);
  });

  it('enters fullscreen successfully', async () => {
    const result = await enterFullscreen();
    expect(result).toBe(true);
    expect(Element.prototype.requestFullscreen).toHaveBeenCalled();
  });

  it('handles fullscreen request failure gracefully', async () => {
    (Element.prototype.requestFullscreen as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Fullscreen denied')
    );
    const result = await enterFullscreen();
    expect(result).toBe(false);
  });

  it('exits fullscreen', async () => {
    // Simulate being in fullscreen
    Object.defineProperty(document, 'fullscreenElement', {
      value: document.documentElement,
      writable: true,
      configurable: true,
    });

    await exitFullscreen();
    expect(document.exitFullscreen).toHaveBeenCalled();
  });

  it('does not call exitFullscreen when not in fullscreen', async () => {
    await exitFullscreen();
    expect(document.exitFullscreen).not.toHaveBeenCalled();
  });
});
