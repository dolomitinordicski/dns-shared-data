// Browser runtime mirror of src/ui/motion.ts + src/ui/interaction.ts.
// Source tokens always come from the canonical DNS Design System object.

const STYLE_ID = 'dns-interaction-runtime';

function prefersReducedMotion(motion) {
  return typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia(motion.reducedMotion.mediaQuery).matches;
}

function clearRevealStyles(element) {
  element.style.removeProperty('opacity');
  element.style.removeProperty('transform');
  element.style.removeProperty('transition');
  element.style.removeProperty('will-change');
}

function revealDelay(motion, element) {
  const explicitDelay = Number(element.dataset.dnsRevealDelay);
  if (Number.isFinite(explicitDelay) && explicitDelay >= 0) return explicitDelay;

  const index = Number(element.dataset.dnsRevealIndex);
  if (!Number.isFinite(index) || index < 0) return 0;

  const stagger = element.dataset.dnsRevealStagger === 'compact' ? 'compact' : 'standard';
  return index * (stagger === 'compact' ? motion.stagger.compactMs : motion.stagger.standardMs);
}

function prepareRevealElement(element, motion) {
  if (!motion.reveal.enabled || prefersReducedMotion(motion) || element.dataset.dnsRevealState === 'visible') {
    clearRevealStyles(element);
    element.dataset.dnsRevealState = 'visible';
    return;
  }

  const delay = revealDelay(motion, element);
  element.style.opacity = String(motion.reveal.fromOpacity);
  element.style.transform = `translate3d(0, ${motion.reveal.translateYPx}px, 0)`;
  element.style.transition =
    `opacity ${motion.reveal.durationMs}ms ${motion.reveal.easing} ${delay}ms, transform ${motion.reveal.durationMs}ms ${motion.reveal.easing} ${delay}ms`;
  element.style.willChange = 'opacity, transform';
  element.dataset.dnsRevealState = 'prepared';
}

function revealElement(element, motion) {
  if (!motion.reveal.enabled || prefersReducedMotion(motion)) {
    clearRevealStyles(element);
    element.dataset.dnsRevealState = 'visible';
    return;
  }

  if (element.dataset.dnsRevealState !== 'prepared') prepareRevealElement(element, motion);

  requestAnimationFrame(() => {
    element.style.opacity = String(motion.reveal.toOpacity);
    element.style.transform = 'translate3d(0, 0, 0)';
    element.dataset.dnsRevealState = 'visible';

    window.setTimeout(() => {
      if (element.dataset.dnsRevealState === 'visible') {
        element.style.removeProperty('will-change');
      }
    }, motion.reveal.durationMs + revealDelay(motion, element));
  });
}

export function initDNSRevealRuntime({ root = document, motion, selector = '[data-dns-reveal]', observeMutations = true } = {}) {
  if (!root || !motion) return { refresh() {}, disconnect() {} };

  const observed = new WeakSet();
  let intersectionObserver = null;
  let mutationObserver = null;

  const revealImmediately = (element) => {
    clearRevealStyles(element);
    element.dataset.dnsRevealState = 'visible';
  };

  const register = (element) => {
    if (observed.has(element)) return;
    observed.add(element);

    if (!motion.reveal.enabled || prefersReducedMotion(motion)) {
      revealImmediately(element);
      return;
    }

    prepareRevealElement(element, motion);
    intersectionObserver?.observe(element);
  };

  const refresh = () => root.querySelectorAll(selector).forEach(register);

  if ('IntersectionObserver' in window && motion.reveal.enabled && !prefersReducedMotion(motion)) {
    intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const element = entry.target;
        if (entry.isIntersecting) {
          revealElement(element, motion);
          if (motion.reveal.once) intersectionObserver?.unobserve(element);
        } else if (!motion.reveal.once) {
          prepareRevealElement(element, motion);
        }
      });
    }, { threshold: motion.reveal.threshold });
  }

  refresh();

  if (observeMutations && 'MutationObserver' in window) {
    mutationObserver = new MutationObserver((records) => {
      records.forEach((record) => {
        record.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.matches(selector)) register(node);
          node.querySelectorAll(selector).forEach(register);
        });
      });
    });

    mutationObserver.observe(root instanceof Document ? root.documentElement : root, {
      childList: true,
      subtree: true,
    });
  }

  const media = window.matchMedia?.(motion.reducedMotion.mediaQuery);
  const handlePreferenceChange = () => {
    root.querySelectorAll(selector).forEach(revealImmediately);
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

export function initDNSInteractionRuntime({ root = document, interaction, motion } = {}) {
  if (!root || !interaction || !motion) return { disconnect() {} };

  const docRoot = root;
  const html = docRoot.documentElement;
  html.style.setProperty('--dns-focus-color', interaction.focusVisible.color);
  html.style.setProperty('--dns-focus-width', `${interaction.focusVisible.widthPx}px`);
  html.style.setProperty('--dns-focus-offset', `${interaction.focusVisible.offsetPx}px`);
  html.style.setProperty('--dns-hover-scale', String(interaction.hover.scale));
  html.style.setProperty('--dns-press-scale', String(interaction.press.scale));
  html.style.setProperty('--dns-hover-duration', `${interaction.hover.durationMs}ms`);
  html.style.setProperty('--dns-press-duration', `${interaction.press.durationMs}ms`);
  html.style.setProperty('--dns-control-duration', `${interaction.controls.transitionMs}ms`);
  html.style.setProperty('--dns-disabled-opacity', String(interaction.controls.disabledOpacity));
  html.style.setProperty('--dns-motion-easing', motion.easing);

  let style = docRoot.getElementById(STYLE_ID);
  if (!style) {
    style = docRoot.createElement('style');
    style.id = STYLE_ID;
    docRoot.head.appendChild(style);
  }

  style.textContent = `
:where(button, a[href], input, select, textarea, [tabindex]):focus-visible {
  outline: var(--dns-focus-width) solid var(--dns-focus-color);
  outline-offset: var(--dns-focus-offset);
}
:where(button, input, select, textarea):disabled,
[aria-disabled="true"] { opacity: var(--dns-disabled-opacity); }
[data-dns-hover], [data-dns-press] {
  transition-property: ${interaction.controls.transitionProperties.join(', ')};
  transition-duration: var(--dns-control-duration);
  transition-timing-function: var(--dns-motion-easing);
}
@media ${interaction.hover.pointerMediaQuery} {
  [data-dns-hover]:hover { transform: scale(var(--dns-hover-scale)); }
}
[data-dns-press][data-dns-pressed="true"] {
  transform: scale(var(--dns-press-scale));
  transition-duration: var(--dns-press-duration);
}
@media ${motion.reducedMotion.mediaQuery} {
  [data-dns-hover], [data-dns-press] {
    transition-duration: ${motion.reducedMotion.durationMs}ms !important;
    transform: none !important;
  }
}`;

  let active = null;
  const clearPressed = () => {
    if (!active) return;
    delete active.dataset.dnsPressed;
    active = null;
  };
  const handlePointerDown = (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const element = target.closest('[data-dns-press]');
    if (!element || element.matches(':disabled') || element.getAttribute('aria-disabled') === 'true') return;
    clearPressed();
    active = element;
    element.dataset.dnsPressed = 'true';
  };

  docRoot.addEventListener('pointerdown', handlePointerDown, true);
  docRoot.addEventListener('pointerup', clearPressed, true);
  docRoot.addEventListener('pointercancel', clearPressed, true);
  docRoot.addEventListener('dragstart', clearPressed, true);
  docRoot.addEventListener('focusout', clearPressed, true);

  return {
    disconnect() {
      clearPressed();
      docRoot.removeEventListener('pointerdown', handlePointerDown, true);
      docRoot.removeEventListener('pointerup', clearPressed, true);
      docRoot.removeEventListener('pointercancel', clearPressed, true);
      docRoot.removeEventListener('dragstart', clearPressed, true);
      docRoot.removeEventListener('focusout', clearPressed, true);
    },
  };
}
