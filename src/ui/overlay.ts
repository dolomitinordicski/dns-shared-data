import type { DNSOverlayType } from '../data-ui.js';
import { DNS_OVERLAY_CONTRACT } from '../data-ui.js';

export interface DNSOverlayOptions {
  type: DNSOverlayType;
  element: HTMLElement;
  initialFocus?: HTMLElement | null;
  returnFocus?: HTMLElement | null;
  onClose?: (reason: 'escape' | 'backdrop' | 'programmatic') => void;
  closeOnBackdrop?: boolean;
}

export interface DNSOverlayHandle {
  close(reason?: 'escape' | 'backdrop' | 'programmatic'): void;
  disconnect(): void;
}

const FOCUSABLE = [
  'a[href]','button:not([disabled])','input:not([disabled])','select:not([disabled])',
  'textarea:not([disabled])','[tabindex]:not([tabindex="-1"])',
].join(',');

function focusables(root: HTMLElement) {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE))
    .filter((el) => !el.hasAttribute('hidden') && el.getAttribute('aria-hidden') !== 'true');
}

export function openDNSOverlay(options: DNSOverlayOptions): DNSOverlayHandle {
  if (typeof document === 'undefined') {
    return { close() {}, disconnect() {} };
  }

  const contract = DNS_OVERLAY_CONTRACT[options.type];
  const element = options.element;
  const previous = options.returnFocus ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);

  element.dataset.dnsOverlay = options.type;
  element.dataset.dnsOpen = 'true';

  if (contract.blocking) {
    element.setAttribute('aria-modal', 'true');
    if (!element.hasAttribute('role')) element.setAttribute('role', 'dialog');
  }

  const setInitialFocus = () => {
    const target = options.initialFocus ?? focusables(element)[0] ?? element;
    if (!target.hasAttribute('tabindex') && target === element) target.tabIndex = -1;
    target.focus();
  };

  const close = (reason: 'escape' | 'backdrop' | 'programmatic' = 'programmatic') => {
    element.dataset.dnsOpen = 'false';
    options.onClose?.(reason);
    if (contract.restoreFocus) previous?.focus();
    disconnect();
  };

  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && contract.escapeCloses) {
      event.preventDefault();
      close('escape');
      return;
    }

    if (event.key !== 'Tab' || !contract.trapFocus) return;

    const items = focusables(element);
    if (!items.length) {
      event.preventDefault();
      element.focus();
      return;
    }

    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const onPointer = (event: PointerEvent) => {
    if (!options.closeOnBackdrop) return;
    if (event.target === element && contract.escapeCloses) close('backdrop');
  };

  const disconnect = () => {
    document.removeEventListener('keydown', onKey, true);
    element.removeEventListener('pointerdown', onPointer);
  };

  document.addEventListener('keydown', onKey, true);
  element.addEventListener('pointerdown', onPointer);
  queueMicrotask(setInitialFocus);

  return { close, disconnect };
}
