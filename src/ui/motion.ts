import { DNS_DESIGN_SYSTEM } from '../design-system.js';

type WidenToken<T> =
  T extends string ? string :
  T extends number ? number :
  T extends boolean ? boolean :
  T extends readonly (infer U)[] ? WidenToken<U>[] :
  T extends object ? { [K in keyof T]: WidenToken<T[K]> } :
  T;

export type DNSMotionTokens = WidenToken<typeof DNS_DESIGN_SYSTEM.motion>;
export type DNSRevealStagger = 'compact' | 'standard';

export interface DNSRevealOptions {
  delayMs?: number;
  stagger?: DNSRevealStagger;
}

export interface DNSRevealRuntimeOptions {
  root?: ParentNode;
  motion?: DNSMotionTokens;
  selector?: string;
  observeMutations?: boolean;
}

export interface DNSRevealRuntimeHandle {
  refresh(): void;
  disconnect(): void;
}

const DEFAULT_SELECTOR = '[data-dns-reveal]';

function resolveMotion(motion?: DNSMotionTokens): DNSMotionTokens {
  return motion ?? DNS_DESIGN_SYSTEM.motion;
}

function getReducedMotionMedia(motion: DNSMotionTokens) {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null;
  return window.matchMedia(motion.reducedMotion.mediaQuery);
}

export function prefersReducedMotion(motion?: DNSMotionTokens): boolean {
  const resolved = resolveMotion(motion);
  return getReducedMotionMedia(resolved)?.matches ?? false;
}

function clearRevealStyles(element: HTMLElement) {
  element.style.removeProperty('opacity');
  element.style.removeProperty('transform');
  element.style.removeProperty('transition');
  element.style.removeProperty('will-change');
}

function revealDelay(
  motion: DNSMotionTokens,
  element: HTMLElement,
  options: DNSRevealOptions = {},
): number {
  if (typeof options.delayMs === 'number') return Math.max(0, options.delayMs);

  const explicitDelay = Number(element.dataset.dnsRevealDelay);
  if (Number.isFinite(explicitDelay) && explicitDelay >= 0) return explicitDelay;

  const index = Number(element.dataset.dnsRevealIndex);
  if (!Number.isFinite(index) || index < 0) return 0;

  const stagger =
    options.stagger ??
    (element.dataset.dnsRevealStagger === 'compact' ? 'compact' : 'standard');

  const step =
    stagger === 'compact'
      ? motion.stagger.compactMs
      : motion.stagger.standardMs;

  return index * step;
}

export function prepareRevealElement(
  element: HTMLElement,
  motion?: DNSMotionTokens,
  options: DNSRevealOptions = {},
) {
  const resolved = resolveMotion(motion);

  if (
    !resolved.reveal.enabled ||
    prefersReducedMotion(resolved) ||
    element.dataset.dnsRevealState === 'visible'
  ) {
    clearRevealStyles(element);
    element.dataset.dnsRevealState = 'visible';
    return;
  }

  const delayMs = revealDelay(resolved, element, options);

  element.style.opacity = String(resolved.reveal.fromOpacity);
  element.style.transform = `translate3d(0, ${resolved.reveal.translateYPx}px, 0)`;
  element.style.transition =
    `opacity ${resolved.reveal.durationMs}ms ${resolved.reveal.easing} ${delayMs}ms, ` +
    `transform ${resolved.reveal.durationMs}ms ${resolved.reveal.easing} ${delayMs}ms`;
  element.style.willChange = 'opacity, transform';
  element.dataset.dnsRevealState = 'prepared';
}

export function revealElement(
  element: HTMLElement,
  motion?: DNSMotionTokens,
  options: DNSRevealOptions = {},
) {
  const resolved = resolveMotion(motion);

  if (!resolved.reveal.enabled || prefersReducedMotion(resolved)) {
    clearRevealStyles(element);
    element.dataset.dnsRevealState = 'visible';
    return;
  }

  if (element.dataset.dnsRevealState !== 'prepared') {
    prepareRevealElement(element, resolved, options);
  }

  requestAnimationFrame(() => {
    element.style.opacity = String(resolved.reveal.toOpacity);
    element.style.transform = 'translate3d(0, 0, 0)';
    element.dataset.dnsRevealState = 'visible';

    window.setTimeout(() => {
      if (element.dataset.dnsRevealState === 'visible') {
        element.style.removeProperty('will-change');
      }
    }, resolved.reveal.durationMs + revealDelay(resolved, element, options));
  });
}

export function revealGroup(
  elements: Iterable<HTMLElement>,
  motion?: DNSMotionTokens,
  stagger: DNSRevealStagger = 'standard',
) {
  const resolved = resolveMotion(motion);
  const step =
    stagger === 'compact'
      ? resolved.stagger.compactMs
      : resolved.stagger.standardMs;

  Array.from(elements).forEach((element, index) => {
    const delayMs = index * step;
    prepareRevealElement(element, resolved, { delayMs });
    revealElement(element, resolved, { delayMs });
  });
}

export function initDNSRevealRuntime(
  options: DNSRevealRuntimeOptions = {},
): DNSRevealRuntimeHandle {
  const root = options.root ?? (typeof document !== 'undefined' ? document : undefined);
  const motion = resolveMotion(options.motion);
  const selector = options.selector ?? DEFAULT_SELECTOR;
  const observeMutations = options.observeMutations ?? true;

  if (!root || typeof document === 'undefined') {
    return { refresh() {}, disconnect() {} };
  }

  const observed = new WeakSet<HTMLElement>();
  let intersectionObserver: IntersectionObserver | null = null;
  let mutationObserver: MutationObserver | null = null;

  const revealImmediately = (element: HTMLElement) => {
    clearRevealStyles(element);
    element.dataset.dnsRevealState = 'visible';
  };

  const register = (element: HTMLElement) => {
    if (observed.has(element)) return;
    observed.add(element);

    if (!motion.reveal.enabled || prefersReducedMotion(motion)) {
      revealImmediately(element);
      return;
    }

    prepareRevealElement(element, motion);
    intersectionObserver?.observe(element);
  };

  const refresh = () => {
    root.querySelectorAll<HTMLElement>(selector).forEach(register);
  };

  if (
    typeof IntersectionObserver === 'function' &&
    motion.reveal.enabled &&
    !prefersReducedMotion(motion)
  ) {
    intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const element = entry.target as HTMLElement;

          if (entry.isIntersecting) {
            revealElement(element, motion);
            if (motion.reveal.once) intersectionObserver?.unobserve(element);
          } else if (!motion.reveal.once) {
            prepareRevealElement(element, motion);
          }
        });
      },
      { threshold: motion.reveal.threshold },
    );
  }

  refresh();

  if (observeMutations && typeof MutationObserver === 'function') {
    mutationObserver = new MutationObserver((records) => {
      records.forEach((record) => {
        record.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.matches(selector)) register(node);
          node.querySelectorAll<HTMLElement>(selector).forEach(register);
        });
      });
    });

    const mutationTarget =
      root instanceof Document ? root.documentElement : (root as Node);

    mutationObserver.observe(mutationTarget, { childList: true, subtree: true });
  }

  const media = getReducedMotionMedia(motion);
  const handlePreferenceChange = () => {
    root.querySelectorAll<HTMLElement>(selector).forEach(revealImmediately);
    intersectionObserver?.disconnect();
  };
  media?.addEventListener?.('change', handlePreferenceChange);

  return {
    refresh,
    disconnect() {
      intersectionObserver?.disconnect();
      mutationObserver?.disconnect();
      media?.removeEventListener?.('change', handlePreferenceChange);
    },
  };
}
