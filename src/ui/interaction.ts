import { DNS_DESIGN_SYSTEM } from '../design-system.js';
import type { DNSMotionTokens } from './motion.js';

type WidenToken<T> =
  T extends string ? string :
  T extends number ? number :
  T extends boolean ? boolean :
  T extends readonly (infer U)[] ? WidenToken<U>[] :
  T extends object ? { [K in keyof T]: WidenToken<T[K]> } :
  T;

export type DNSInteractionTokens = WidenToken<typeof DNS_DESIGN_SYSTEM.interaction>;

export interface DNSInteractionRuntimeOptions {
  root?: Document;
  interaction?: DNSInteractionTokens;
  motion?: DNSMotionTokens;
}

export interface DNSInteractionRuntimeHandle {
  disconnect(): void;
}

const STYLE_ID = 'dns-interaction-runtime';

function setRuntimeVariables(
  documentRoot: Document,
  interaction: DNSInteractionTokens,
  motion: DNSMotionTokens,
) {
  const root = documentRoot.documentElement;

  root.style.setProperty('--dns-focus-color', interaction.focusVisible.color);
  root.style.setProperty('--dns-focus-width', `${interaction.focusVisible.widthPx}px`);
  root.style.setProperty('--dns-focus-offset', `${interaction.focusVisible.offsetPx}px`);
  root.style.setProperty('--dns-hover-scale', String(interaction.hover.scale));
  root.style.setProperty('--dns-press-scale', String(interaction.press.scale));
  root.style.setProperty('--dns-hover-duration', `${interaction.hover.durationMs}ms`);
  root.style.setProperty('--dns-press-duration', `${interaction.press.durationMs}ms`);
  root.style.setProperty('--dns-control-duration', `${interaction.controls.transitionMs}ms`);
  root.style.setProperty('--dns-disabled-opacity', String(interaction.controls.disabledOpacity));
  root.style.setProperty('--dns-motion-easing', motion.easing);
}

function ensureInteractionStyles(
  documentRoot: Document,
  interaction: DNSInteractionTokens,
  motion: DNSMotionTokens,
) {
  let style = documentRoot.getElementById(STYLE_ID) as HTMLStyleElement | null;

  if (!style) {
    style = documentRoot.createElement('style');
    style.id = STYLE_ID;
    documentRoot.head.appendChild(style);
  }

  const transitionProperties = interaction.controls.transitionProperties.join(', ');

  style.textContent = `
:where(button, a[href], input, select, textarea, [tabindex]):focus-visible {
  outline: var(--dns-focus-width) solid var(--dns-focus-color);
  outline-offset: var(--dns-focus-offset);
}

:where(button, input, select, textarea):disabled,
[aria-disabled="true"] {
  opacity: var(--dns-disabled-opacity);
}

[data-dns-hover],
[data-dns-press] {
  transition-property: ${transitionProperties};
  transition-duration: var(--dns-control-duration);
  transition-timing-function: var(--dns-motion-easing);
}

@media ${interaction.hover.pointerMediaQuery} {
  [data-dns-hover]:hover {
    transform: scale(var(--dns-hover-scale));
  }
}

[data-dns-press][data-dns-pressed="true"] {
  transform: scale(var(--dns-press-scale));
  transition-duration: var(--dns-press-duration);
}

a[data-dns-link] {
  text-decoration-thickness: from-font;
  text-underline-offset: .16em;
}

a[data-dns-link]:hover,
a[data-dns-link]:focus-visible {
  text-decoration-line: underline;
}

@media ${motion.reducedMotion.mediaQuery} {
  [data-dns-hover],
  [data-dns-press] {
    transition-duration: ${motion.reducedMotion.durationMs}ms !important;
    transform: none !important;
  }
}
`;
}

function isDisabled(element: HTMLElement) {
  return element.matches(':disabled') || element.getAttribute('aria-disabled') === 'true';
}

export function initDNSInteractionRuntime(
  options: DNSInteractionRuntimeOptions = {},
): DNSInteractionRuntimeHandle {
  const documentRoot =
    options.root ?? (typeof document !== 'undefined' ? document : undefined);

  if (!documentRoot) return { disconnect() {} };

  const interaction = options.interaction ?? DNS_DESIGN_SYSTEM.interaction;
  const motion = options.motion ?? DNS_DESIGN_SYSTEM.motion;

  setRuntimeVariables(documentRoot, interaction, motion);
  ensureInteractionStyles(documentRoot, interaction, motion);

  let active: HTMLElement | null = null;

  const clearPressed = () => {
    if (!active) return;
    delete active.dataset.dnsPressed;
    active = null;
  };

  const handlePointerDown = (event: PointerEvent) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const element = target.closest<HTMLElement>('[data-dns-press]');
    if (!element || isDisabled(element)) return;

    clearPressed();
    active = element;
    element.dataset.dnsPressed = 'true';
  };

  documentRoot.addEventListener('pointerdown', handlePointerDown, true);
  documentRoot.addEventListener('pointerup', clearPressed, true);
  documentRoot.addEventListener('pointercancel', clearPressed, true);
  documentRoot.addEventListener('dragstart', clearPressed, true);
  documentRoot.addEventListener('focusout', clearPressed, true);

  return {
    disconnect() {
      clearPressed();
      documentRoot.removeEventListener('pointerdown', handlePointerDown, true);
      documentRoot.removeEventListener('pointerup', clearPressed, true);
      documentRoot.removeEventListener('pointercancel', clearPressed, true);
      documentRoot.removeEventListener('dragstart', clearPressed, true);
      documentRoot.removeEventListener('focusout', clearPressed, true);
    },
  };
}
