/** Canonical DNS application icon metadata. Keep in sync with assets/tool-icons/catalog.json. */
export const DNS_TOOL_ICON_CATEGORIES = {
  analytics: { icon: 'chart-no-axes-combined', accent: '#176B78', tint: '#DCEFF1' },
  data: { icon: 'database', accent: '#355F9A', tint: '#E5EDF9' },
  finance: { icon: 'receipt-text', accent: '#99612C', tint: '#F6ECDD' },
  creative: { icon: 'palette', accent: '#94518E', tint: '#F2E6F2' },
  partners: { icon: 'users', accent: '#347A52', tint: '#E3F0E6' },
  polls: { icon: 'clipboard-list', accent: '#625D9E', tint: '#E8E9F6' },
  general: { icon: 'app-window', accent: '#347584', tint: '#E5F1F3' },
} as const;
export type DNSToolIconCategory = keyof typeof DNS_TOOL_ICON_CATEGORIES;
export const DNS_TOOL_ICON_ASSIGNMENTS: Readonly<Record<string, DNSToolIconCategory>> = {
  analytics: 'analytics', 'data-entry': 'data', faktura: 'finance',
  'flyer-studio': 'creative', 'partner-hub': 'partners', polls: 'polls',
  'dns-core': 'data', 'shared-data': 'data', workspace: 'general',
  hub: 'general', fair: 'analytics',
};
export function getDNSToolIcon(toolId: string) {
  const category = DNS_TOOL_ICON_ASSIGNMENTS[toolId] ?? 'general';
  return { category, ...DNS_TOOL_ICON_CATEGORIES[category] };
}
