export const DNS_DATA_UI_VERSION = '1.0.0' as const;

export const DNS_APPLICATION_STATE_IDS = [
  'loading','empty','error','offline','unauthorized','forbidden','not-found',
  'saving','saved','syncing','stale',
] as const;
export type DNSApplicationState = (typeof DNS_APPLICATION_STATE_IDS)[number];

export const DNS_FORM_STATE_IDS = [
  'default','required','valid','error','readonly','disabled','dirty','saving','saved',
] as const;
export type DNSFormState = (typeof DNS_FORM_STATE_IDS)[number];

export const DNS_OVERLAY_IDS = [
  'modal','confirm','drawer','popover','dropdown','menu','tooltip','toast','blocking',
] as const;
export type DNSOverlayType = (typeof DNS_OVERLAY_IDS)[number];

export const DNS_DATA_ACTION_IDS = [
  'search','filter','sort','paginate','columns','select','bulk','export',
] as const;
export type DNSDataAction = (typeof DNS_DATA_ACTION_IDS)[number];

export const DNS_UPLOAD_STATE_IDS = [
  'idle','dragging','uploading','success','error','disabled',
] as const;
export type DNSUploadState = (typeof DNS_UPLOAD_STATE_IDS)[number];

export const DNS_OVERLAY_CONTRACT = {
  modal: { blocking: true, trapFocus: true, escapeCloses: true, restoreFocus: true },
  confirm: { blocking: true, trapFocus: true, escapeCloses: true, restoreFocus: true },
  drawer: { blocking: false, trapFocus: true, escapeCloses: true, restoreFocus: true },
  popover: { blocking: false, trapFocus: false, escapeCloses: true, restoreFocus: true },
  dropdown: { blocking: false, trapFocus: false, escapeCloses: true, restoreFocus: true },
  menu: { blocking: false, trapFocus: false, escapeCloses: true, restoreFocus: true },
  tooltip: { blocking: false, trapFocus: false, escapeCloses: true, restoreFocus: false },
  toast: { blocking: false, trapFocus: false, escapeCloses: false, restoreFocus: false },
  blocking: { blocking: true, trapFocus: true, escapeCloses: false, restoreFocus: true },
} as const;

export const DNS_DATA_UI_RULES = [
  'Application state must be explicit and never inferred from animation alone.',
  'Required, invalid, dirty, saving and saved form states are visually and semantically distinct.',
  'Uploads use the shared drop-zone/state model; storage/business handling remains tool-owned.',
  'Search/filter/sort/pagination/column selection/bulk actions/export share Foundation controls but retain tool-owned query logic.',
  'Bulk actions require explicit current selection and must never rely on hidden selection.',
  'Empty, loading and error states must remain accessible without motion.',
] as const;
