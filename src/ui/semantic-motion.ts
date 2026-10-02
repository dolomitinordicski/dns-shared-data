import {
  DNS_MOTION_SEMANTICS,
  getDNSMotionSemantic,
  type DNSMotionSemanticId,
} from '../motion-semantics.js';
import { DNS_DESIGN_SYSTEM } from '../design-system.js';
import { prefersReducedMotion, type DNSMotionTokens } from './motion.js';

export interface DNSSemanticMotionOptions {
  direction?: 'forward' | 'reverse';
  delayMs?: number;
  fill?: FillMode;
  iterations?: number;
}

export interface DNSSemanticMotionRuntimeOptions {
  root?: Document;
  motion?: DNSMotionTokens;
}

export interface DNSSemanticMotionRuntimeHandle {
  play(
    element: HTMLElement,
    semantic: DNSMotionSemanticId,
    options?: DNSSemanticMotionOptions,
  ): Animation | null;
  finish(element: HTMLElement): void;
  disconnect(): void;
}

const activeAnimations = new WeakMap<HTMLElement, Animation>();

function reducedKeyframe(element: HTMLElement, semantic: DNSMotionSemanticId) {
  const preset = getDNSMotionSemantic(semantic);
  element.style.opacity = String(preset.toOpacity);
  element.style.transform = preset.toTransform;
  element.dataset.dnsMotion = semantic;
  element.dataset.dnsMotionState = 'finished';
}

export function playDNSSemanticMotion(
  element: HTMLElement,
  semantic: DNSMotionSemanticId,
  options: DNSSemanticMotionOptions = {},
  motion: DNSMotionTokens = DNS_DESIGN_SYSTEM.motion,
): Animation | null {
  const preset = getDNSMotionSemantic(semantic);
  const direction = options.direction ?? 'forward';

  activeAnimations.get(element)?.cancel();

  if (prefersReducedMotion(motion) || typeof element.animate !== 'function') {
    reducedKeyframe(element, semantic);
    return null;
  }

  const forward = direction === 'forward';
  const from = {
    opacity: forward ? preset.fromOpacity : preset.toOpacity,
    transform: forward ? preset.fromTransform : preset.toTransform,
  };
  const to = {
    opacity: forward ? preset.toOpacity : preset.fromOpacity,
    transform: forward ? preset.toTransform : preset.fromTransform,
  };

  const keyframes: Keyframe[] = [{}, {}];
  if (preset.animate.includes('opacity')) {
    keyframes[0].opacity = from.opacity;
    keyframes[1].opacity = to.opacity;
  }
  if (preset.animate.includes('transform')) {
    keyframes[0].transform = from.transform;
    keyframes[1].transform = to.transform;
  }

  element.dataset.dnsMotion = semantic;
  element.dataset.dnsMotionState = 'running';

  const animation = element.animate(keyframes, {
    duration: preset.durationMs,
    easing: preset.easing,
    delay: Math.max(0, options.delayMs ?? 0),
    fill: options.fill ?? 'both',
    iterations: Math.max(1, options.iterations ?? 1),
  });

  activeAnimations.set(element, animation);

  animation.addEventListener('finish', () => {
    if (activeAnimations.get(element) !== animation) return;
    element.dataset.dnsMotionState = 'finished';
    activeAnimations.delete(element);
  });

  animation.addEventListener('cancel', () => {
    if (activeAnimations.get(element) === animation) {
      activeAnimations.delete(element);
    }
  });

  return animation;
}

export function finishDNSSemanticMotion(element: HTMLElement) {
  const animation = activeAnimations.get(element);
  if (!animation) return;
  animation.finish();
  activeAnimations.delete(element);
}

export function initDNSSemanticMotionRuntime(
  options: DNSSemanticMotionRuntimeOptions = {},
): DNSSemanticMotionRuntimeHandle {
  const documentRoot =
    options.root ?? (typeof document !== 'undefined' ? document : undefined);
  const motion = options.motion ?? DNS_DESIGN_SYSTEM.motion;

  if (!documentRoot) {
    return {
      play() { return null; },
      finish() {},
      disconnect() {},
    };
  }

  const styleId = 'dns-semantic-motion-runtime';
  let style = documentRoot.getElementById(styleId) as HTMLStyleElement | null;
  if (!style) {
    style = documentRoot.createElement('style');
    style.id = styleId;
    style.textContent =
      '[data-dns-motion-state="running"] { will-change: opacity, transform; }\n' +
      '[data-dns-motion="loading"][data-dns-motion-state="running"] { pointer-events: none; }\n' +
      '@media ' + motion.reducedMotion.mediaQuery + ' {\n' +
      '  [data-dns-motion] { animation: none !important; transition-duration: 0ms !important; transition-delay: 0ms !important; }\n' +
      '}';
    documentRoot.head.appendChild(style);
  }

  const media =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(motion.reducedMotion.mediaQuery)
      : null;

  const finishAll = () => {
    if (!media?.matches) return;
    documentRoot.querySelectorAll<HTMLElement>('[data-dns-motion-state="running"]').forEach((element) => {
      activeAnimations.get(element)?.finish();
      const id = element.dataset.dnsMotion as DNSMotionSemanticId | undefined;
      if (id && id in DNS_MOTION_SEMANTICS) reducedKeyframe(element, id);
      activeAnimations.delete(element);
    });
  };

  media?.addEventListener?.('change', finishAll);

  return {
    play(element, semantic, motionOptions) {
      return playDNSSemanticMotion(element, semantic, motionOptions, motion);
    },
    finish(element) {
      finishDNSSemanticMotion(element);
    },
    disconnect() {
      media?.removeEventListener?.('change', finishAll);
      documentRoot.getElementById(styleId)?.remove();
    },
  };
}
