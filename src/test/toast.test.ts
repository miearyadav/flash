import { describe, it, expect, vi, beforeEach } from 'vitest';
import { showToast } from '../components/toast.js';

describe('Toast', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.useFakeTimers();
  });

  it('creates a toast element in the DOM', () => {
    showToast('Test message');
    const toast = document.querySelector('.toast');
    expect(toast).not.toBeNull();
    expect(toast?.textContent).toBe('Test message');
  });

  it('creates a toast container', () => {
    showToast('Hello');
    const container = document.querySelector('.toast-container');
    expect(container).not.toBeNull();
  });

  it('toast has role="status" for accessibility', () => {
    showToast('Accessible toast');
    const toast = document.querySelector('.toast');
    expect(toast?.getAttribute('role')).toBe('status');
  });

  it('removes toast after duration', () => {
    showToast('Temporary', 1000);
    const toast = document.querySelector('.toast');
    expect(toast).not.toBeNull();

    vi.advanceTimersByTime(1000);
    // Toast gets exit class, then removes on animationend
    expect(toast?.classList.contains('toast--exit')).toBe(true);
  });

  it('can show multiple toasts', () => {
    showToast('First');
    showToast('Second');
    const toasts = document.querySelectorAll('.toast');
    expect(toasts.length).toBe(2);
  });
});
