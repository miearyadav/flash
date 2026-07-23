import type { UtilityModeId } from './types.js';
import {
  SOS_PATTERN,
  STROBE_INTERVAL,
  BEACON_ON,
  BEACON_OFF,
  PULSE_DURATION,
} from './constants.js';
import { bus } from './eventBus.js';

type FlashCallback = (on: boolean, opacity?: number) => void;

interface UtilityController {
  stop: () => void;
}

let activeController: UtilityController | null = null;
let _activeUtility: UtilityModeId | null = null;

export function getActiveUtility(): UtilityModeId | null {
  return _activeUtility;
}

export function stopUtility(): void {
  if (activeController) {
    activeController.stop();
    activeController = null;
  }
  _activeUtility = null;
  bus.emit('utility:stop', null);
}

export function startUtility(id: UtilityModeId, callback: FlashCallback): void {
  stopUtility();
  _activeUtility = id;

  switch (id) {
    case 'sos':
      activeController = createSOS(callback);
      break;
    case 'strobe':
      activeController = createStrobe(callback);
      break;
    case 'beacon':
      activeController = createBeacon(callback);
      break;
    case 'pulse':
      activeController = createPulse(callback);
      break;
  }

  bus.emit('utility:start', id);
}

// ─── SOS ─────────────────────────────────────────────────────────────────────

function createSOS(cb: FlashCallback): UtilityController {
  let stopped = false;
  let timeoutId: ReturnType<typeof setTimeout>;

  function runPattern(index: number): void {
    if (stopped) return;
    const step = SOS_PATTERN[index];
    if (!step) return;
    const [on, off] = step;

    cb(true);
    timeoutId = setTimeout(() => {
      if (stopped) return;
      cb(false);
      timeoutId = setTimeout(() => {
        if (stopped) return;
        runPattern((index + 1) % SOS_PATTERN.length);
      }, off);
    }, on);
  }

  runPattern(0);

  return {
    stop: () => {
      stopped = true;
      clearTimeout(timeoutId);
      cb(true);
    },
  };
}

// ─── Strobe ──────────────────────────────────────────────────────────────────

function createStrobe(cb: FlashCallback): UtilityController {
  let on = true;
  const id = setInterval(() => {
    on = !on;
    cb(on);
  }, STROBE_INTERVAL);

  return {
    stop: () => {
      clearInterval(id);
      cb(true);
    },
  };
}

// ─── Beacon ──────────────────────────────────────────────────────────────────

function createBeacon(cb: FlashCallback): UtilityController {
  let stopped = false;
  let timeoutId: ReturnType<typeof setTimeout>;

  function cycle(): void {
    if (stopped) return;
    cb(true);
    timeoutId = setTimeout(() => {
      if (stopped) return;
      cb(false);
      timeoutId = setTimeout(cycle, BEACON_OFF);
    }, BEACON_ON);
  }

  cycle();

  return {
    stop: () => {
      stopped = true;
      clearTimeout(timeoutId);
      cb(true);
    },
  };
}

// ─── Pulse ───────────────────────────────────────────────────────────────────

function createPulse(cb: FlashCallback): UtilityController {
  let rafId: number;
  let startTime: number | null = null;
  let stopped = false;

  function animate(timestamp: number): void {
    if (stopped) return;
    if (startTime === null) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = (elapsed % PULSE_DURATION) / PULSE_DURATION;
    // Smooth sine wave: 0.15 → 1.0
    const opacity = 0.15 + 0.85 * (0.5 + 0.5 * Math.sin(progress * Math.PI * 2 - Math.PI / 2));
    cb(true, opacity);
    if (!stopped) {
      rafId = requestAnimationFrame(animate);
    }
  }

  rafId = requestAnimationFrame(animate);

  return {
    stop: () => {
      stopped = true;
      cancelAnimationFrame(rafId);
      cb(true, 1);
    },
  };
}
