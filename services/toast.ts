/**
 * Lightweight toast notification — shows a message briefly, then fades away.
 * No dependencies. Creates its own DOM elements and cleans up after itself.
 */

let toastContainer: HTMLDivElement | null = null;

function getContainer(): HTMLDivElement {
  if (toastContainer && document.body.contains(toastContainer)) return toastContainer;
  toastContainer = document.createElement('div');
  toastContainer.style.cssText = `
    position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
    z-index: 99999; display: flex; flex-direction: column; align-items: center; gap: 8px;
    pointer-events: none;
  `;
  document.body.appendChild(toastContainer);
  return toastContainer;
}

type ToastType = 'success' | 'error' | 'info';

const TOAST_STYLES: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: { bg: 'rgba(16,185,129,0.95)', border: 'rgba(5,150,105,0.6)', icon: '✅' },
  error:   { bg: 'rgba(239,68,68,0.95)',   border: 'rgba(220,38,38,0.6)',  icon: '❌' },
  info:    { bg: 'rgba(59,130,246,0.95)',   border: 'rgba(37,99,235,0.6)',  icon: 'ℹ️' },
};

export function showToast(message: string, type: ToastType = 'success', durationMs = 2500) {
  const container = getContainer();
  const style = TOAST_STYLES[type];

  const toast = document.createElement('div');
  toast.style.cssText = `
    background: ${style.bg}; color: white;
    border: 1px solid ${style.border};
    padding: 12px 24px; border-radius: 14px;
    font-family: 'Inter','Sarabun',-apple-system,sans-serif;
    font-size: 14px; font-weight: 600; line-height: 1.4;
    box-shadow: 0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.12);
    backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
    pointer-events: auto; cursor: default;
    display: flex; align-items: center; gap: 8px;
    opacity: 0; transform: translateY(-12px);
    transition: opacity 0.3s ease, transform 0.3s ease;
    max-width: 90vw; text-align: center;
  `;
  toast.textContent = `${style.icon}  ${message}`;

  container.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  // Animate out + remove
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-12px)';
    setTimeout(() => {
      toast.remove();
      // Clean up container if empty
      if (container.children.length === 0) {
        container.remove();
        toastContainer = null;
      }
    }, 350);
  }, durationMs);
}
