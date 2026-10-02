export const DNS_WORKSPACE_VERSION = '1.0.0' as const;

export const DNS_WORKSPACE_REGION_IDS = [
  'toolbar',
  'canvas',
  'inspector',
  'mobile-panel',
] as const;
export type DNSWorkspaceRegionId = (typeof DNS_WORKSPACE_REGION_IDS)[number];

export const DNS_WORKSPACE_PANEL_STATE_IDS = [
  'open',
  'collapsed',
  'hidden',
] as const;
export type DNSWorkspacePanelState = (typeof DNS_WORKSPACE_PANEL_STATE_IDS)[number];

export const DNS_WORKSPACE_RULES = [
  'Foundation governs the authoring environment, not the authored artifact.',
  'The toolbar, inspector, dialogs, forms, account context, accessibility and language are Foundation-owned.',
  'Canvas rendering, creative composition and exported creative output remain tool-owned.',
  'Desktop workspace supports toolbar + canvas + optional inspector.',
  'Tablet/mobile may collapse inspector actions into a mobile panel or bottom sheet.',
  'Workspace controls must preserve keyboard accessibility and explicit focus order.',
  'Workspace must consume canonical assets instead of maintaining a second asset registry.',
] as const;

export interface DNSWorkspaceContract {
  toolbarRequired: true;
  canvasRequired: true;
  inspectorRequired: false;
  mobilePanelRequired: false;
  desktopInspectorMinPx: number;
  desktopInspectorMaxPx: number;
  mobileBreakpointPx: number;
}

export const DNS_WORKSPACE_CONTRACT: DNSWorkspaceContract = {
  toolbarRequired: true,
  canvasRequired: true,
  inspectorRequired: false,
  mobilePanelRequired: false,
  desktopInspectorMinPx: 280,
  desktopInspectorMaxPx: 380,
  mobileBreakpointPx: 1023,
};
