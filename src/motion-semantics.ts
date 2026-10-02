export const DNS_MOTION_SEMANTICS_VERSION = '1.0.0' as const;

export const DNS_MOTION_SEMANTIC_IDS = [
  'enter',
  'exit',
  'expand',
  'collapse',
  'modal',
  'drawer',
  'toast',
  'tab',
  'contextChange',
  'loading',
] as const;

export type DNSMotionSemanticId = (typeof DNS_MOTION_SEMANTIC_IDS)[number];

export interface DNSMotionSemanticPreset {
  id: DNSMotionSemanticId;
  purpose: string;
  durationMs: number;
  easing: string;
  fromOpacity: number;
  toOpacity: number;
  fromTransform: string;
  toTransform: string;
  animate: readonly ('opacity' | 'transform')[];
  reversible: boolean;
  rules: readonly string[];
}

export const DNS_MOTION_SEMANTICS: Readonly<Record<DNSMotionSemanticId, DNSMotionSemanticPreset>> = {
  enter: {
    id: 'enter',
    purpose: 'Introduce newly available content without drawing attention away from the task.',
    durationMs: 220,
    easing: 'cubic-bezier(.2,.8,.2,1)',
    fromOpacity: 0,
    toOpacity: 1,
    fromTransform: 'translate3d(0, 6px, 0)',
    toTransform: 'translate3d(0, 0, 0)',
    animate: ['opacity', 'transform'],
    reversible: false,
    rules: ['Use for content becoming available, not decorative page choreography.'],
  },
  exit: {
    id: 'exit',
    purpose: 'Remove transient content while preserving spatial continuity.',
    durationMs: 160,
    easing: 'cubic-bezier(.4,0,1,1)',
    fromOpacity: 1,
    toOpacity: 0,
    fromTransform: 'translate3d(0, 0, 0)',
    toTransform: 'translate3d(0, 4px, 0)',
    animate: ['opacity', 'transform'],
    reversible: false,
    rules: ['Keep exits faster than entrances.', 'Do not delay destructive state completion for animation.'],
  },
  expand: {
    id: 'expand',
    purpose: 'Reveal additional content in the same context.',
    durationMs: 220,
    easing: 'cubic-bezier(.2,.8,.2,1)',
    fromOpacity: 0,
    toOpacity: 1,
    fromTransform: 'translate3d(0, -4px, 0)',
    toTransform: 'translate3d(0, 0, 0)',
    animate: ['opacity', 'transform'],
    reversible: true,
    rules: ['Use for accordions, detail panels and progressive disclosure.'],
  },
  collapse: {
    id: 'collapse',
    purpose: 'Hide previously expanded content while retaining context.',
    durationMs: 180,
    easing: 'cubic-bezier(.4,0,1,1)',
    fromOpacity: 1,
    toOpacity: 0,
    fromTransform: 'translate3d(0, 0, 0)',
    toTransform: 'translate3d(0, -4px, 0)',
    animate: ['opacity', 'transform'],
    reversible: true,
    rules: ['Pair with expand.', 'State change remains authoritative over animation.'],
  },
  modal: {
    id: 'modal',
    purpose: 'Bring a blocking dialog into focus.',
    durationMs: 200,
    easing: 'cubic-bezier(.2,.8,.2,1)',
    fromOpacity: 0,
    toOpacity: 1,
    fromTransform: 'translate3d(0, 8px, 0) scale(.99)',
    toTransform: 'translate3d(0, 0, 0) scale(1)',
    animate: ['opacity', 'transform'],
    reversible: true,
    rules: ['Focus management is mandatory and separate from animation.', 'Never use bounce or spring effects.'],
  },
  drawer: {
    id: 'drawer',
    purpose: 'Preserve spatial origin when a side/mobile panel enters.',
    durationMs: 240,
    easing: 'cubic-bezier(.2,.8,.2,1)',
    fromOpacity: 1,
    toOpacity: 1,
    fromTransform: 'translate3d(16px, 0, 0)',
    toTransform: 'translate3d(0, 0, 0)',
    animate: ['transform'],
    reversible: true,
    rules: ['Direction may be inverted by the consumer for left-origin drawers.', 'Use only for actual drawers/panels.'],
  },
  toast: {
    id: 'toast',
    purpose: 'Surface transient feedback without interrupting the current task.',
    durationMs: 180,
    easing: 'cubic-bezier(.2,.8,.2,1)',
    fromOpacity: 0,
    toOpacity: 1,
    fromTransform: 'translate3d(0, 6px, 0)',
    toTransform: 'translate3d(0, 0, 0)',
    animate: ['opacity', 'transform'],
    reversible: false,
    rules: ['Toast duration on screen is content/accessibility logic, not motion timing.'],
  },
  tab: {
    id: 'tab',
    purpose: 'Indicate a view change within the same information architecture level.',
    durationMs: 160,
    easing: 'ease',
    fromOpacity: 0.84,
    toOpacity: 1,
    fromTransform: 'translate3d(0, 0, 0)',
    toTransform: 'translate3d(0, 0, 0)',
    animate: ['opacity'],
    reversible: false,
    rules: ['Avoid sliding entire pages between tabs.', 'Navigation indicator motion remains restrained.'],
  },
  contextChange: {
    id: 'contextChange',
    purpose: 'Confirm a region/season/organization context change without implying navigation.',
    durationMs: 200,
    easing: 'ease',
    fromOpacity: 0.72,
    toOpacity: 1,
    fromTransform: 'translate3d(0, 0, 0)',
    toTransform: 'translate3d(0, 0, 0)',
    animate: ['opacity'],
    reversible: false,
    rules: ['Use for active operational context changes.', 'Do not animate large data tables unnecessarily.'],
  },
  loading: {
    id: 'loading',
    purpose: 'Indicate ongoing activity with minimum visual distraction.',
    durationMs: 800,
    easing: 'ease-in-out',
    fromOpacity: 0.55,
    toOpacity: 1,
    fromTransform: 'translate3d(0, 0, 0)',
    toTransform: 'translate3d(0, 0, 0)',
    animate: ['opacity'],
    reversible: true,
    rules: ['Prefer subtle opacity/pulse over indefinite movement.', 'Reduced motion disables animation entirely.'],
  },
} as const;

export const DNS_INTERACTION_SEMANTIC_IDS = [
  'action',
  'selection',
  'toggle',
  'navigation',
  'destructive',
] as const;

export type DNSInteractionSemanticId = (typeof DNS_INTERACTION_SEMANTIC_IDS)[number];

export const DNS_INTERACTION_SEMANTICS = {
  action: {
    hover: true,
    press: true,
    selectedState: false,
    description: 'Primary/secondary actions and ordinary buttons.',
  },
  selection: {
    hover: true,
    press: true,
    selectedState: true,
    description: 'Context selectors, selectable cards, rows or options.',
  },
  toggle: {
    hover: true,
    press: true,
    selectedState: true,
    description: 'Controls that represent an on/off or expanded/collapsed state.',
  },
  navigation: {
    hover: true,
    press: true,
    selectedState: true,
    description: 'Tabs, navigation items and route/service selectors.',
  },
  destructive: {
    hover: true,
    press: true,
    selectedState: false,
    description: 'Delete/revoke/cancel actions; color semantics come from the action variant, not motion.',
  },
} as const;

export function getDNSMotionSemantic(id: DNSMotionSemanticId): DNSMotionSemanticPreset {
  return DNS_MOTION_SEMANTICS[id];
}

export function isDNSMotionSemanticId(value: unknown): value is DNSMotionSemanticId {
  return typeof value === 'string' && (DNS_MOTION_SEMANTIC_IDS as readonly string[]).includes(value);
}

export function isDNSInteractionSemanticId(value: unknown): value is DNSInteractionSemanticId {
  return typeof value === 'string' && (DNS_INTERACTION_SEMANTIC_IDS as readonly string[]).includes(value);
}
