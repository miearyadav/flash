function getContainer(): HTMLElement {
  let container = document.querySelector<HTMLElement>('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'false');
    document.body.appendChild(container);
  }
  return container;
}

export function showToast(message: string, duration = 3000): void {
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.textContent = message;

  const c = getContainer();
  c.appendChild(el);

  const remove = () => {
    el.classList.add('toast--exit');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  };

  const timer = setTimeout(remove, duration);

  el.addEventListener('click', () => {
    clearTimeout(timer);
    remove();
  });
}
