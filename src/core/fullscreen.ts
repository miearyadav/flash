import { bus } from './eventBus.js';

export function isFullscreenSupported(): boolean {
  return !!(
    document.fullscreenEnabled ||
    (document as unknown as { webkitFullscreenEnabled?: boolean }).webkitFullscreenEnabled
  );
}

export function isFullscreen(): boolean {
  return !!(
    document.fullscreenElement ||
    (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement
  );
}

export async function enterFullscreen(element: Element = document.documentElement): Promise<boolean> {
  if (!isFullscreenSupported()) return false;
  if (isFullscreen()) return true;

  try {
    if (element.requestFullscreen) {
      await element.requestFullscreen({ navigationUI: 'hide' });
    } else {
      const el = element as unknown as { webkitRequestFullscreen?: () => Promise<void> };
      if (el.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen();
      }
    }
    return true;
  } catch {
    return false;
  }
}

export async function exitFullscreen(): Promise<void> {
  if (!isFullscreen()) return;
  try {
    if (document.exitFullscreen) {
      await document.exitFullscreen();
    } else {
      const doc = document as unknown as { webkitExitFullscreen?: () => void };
      if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      }
    }
  } catch {
    // Already exited
  }
}

// Listen for native fullscreen changes (ESC key, browser UI)
function onFullscreenChange() {
  bus.emit('fullscreen:change', isFullscreen());
}

document.addEventListener('fullscreenchange', onFullscreenChange);
document.addEventListener('webkitfullscreenchange', onFullscreenChange);
