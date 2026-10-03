import {
  DNS_DESIGN_SYSTEM_VERSION,
} from './design-system.js';
import {
  DNS_FOUNDATION_RELEASE_REF,
} from './release.js';
import {
  DNS_FOUNDATION_RELEASE_VERSION,
} from './version.js';

export const DNS_TOOL_REGISTRY_VERSION = '1.0.0' as const;

export type DNSToolLifecycle =
  | 'production'
  | 'beta'
  | 'development'
  | 'planned'
  | 'maintenance'
  | 'legacy';

export type DNSToolBackendKind =
  | 'dns-core'
  | 'fair-modell'
  | 'polls-private'
  | 'app-specific'
  | 'none';

export type DNSToolRegistryEntry = {
  id: string;
  label: string;
  shortLabel: string;
  description: { de: string; it: string };
  url: string | null;
  repo: string | null;
  lifecycle: DNSToolLifecycle;
  group: 'platform' | 'operations' | 'communication' | 'portal' | 'legacy';
  backend: {
    kind: DNSToolBackendKind;
    label: string;
  };
  dependencies: string[];
  order: number;
  visible: boolean;
};

export const DNS_TOOL_REGISTRY_CANONICAL = {
  foundation: {
    version: DNS_FOUNDATION_RELEASE_VERSION,
    ref: DNS_FOUNDATION_RELEASE_REF,
  },
  designSystem: {
    version: DNS_DESIGN_SYSTEM_VERSION,
  },
  sharedData: {
    version: DNS_FOUNDATION_RELEASE_VERSION,
  },
} as const;

export const DNS_TOOL_REGISTRY: readonly DNSToolRegistryEntry[] = [
  {
    id: 'dns-core',
    label: 'DNS Core',
    shortLabel: 'DNS Core',
    description: {
      de: 'Zentrale Firebase- und Datenplattform der DNS Anwendungen.',
      it: 'Piattaforma Firebase e dati centrale delle applicazioni DNS.',
    },
    url: null,
    repo: 'dolomitinordicski/dns-shared-data',
    lifecycle: 'production',
    group: 'platform',
    backend: { kind: 'dns-core', label: 'Firebase · dns-core' },
    dependencies: [],
    order: 0,
    visible: true,
  },
  {
    id: 'shared-data',
    label: 'DNS Shared Data',
    shortLabel: 'Shared Data',
    description: {
      de: 'Canonical Source für Foundation, Design System, Datenverträge, Assets und Governance.',
      it: 'Fonte canonica per Foundation, Design System, contratti dati, asset e governance.',
    },
    url: 'https://dolomitinordicski.github.io/dns-shared-data/',
    repo: 'dolomitinordicski/dns-shared-data',
    lifecycle: 'production',
    group: 'platform',
    backend: { kind: 'dns-core', label: 'DNS Core' },
    dependencies: ['dns-core'],
    order: 1,
    visible: true,
  },
  {
    id: 'hub',
    label: 'DNS Hub',
    shortLabel: 'Hub',
    description: {
      de: 'Operative Übersicht, Systemstatus und zentraler Einstieg in alle DNS Tools.',
      it: 'Panoramica operativa, stato del sistema e accesso centrale a tutti i tool DNS.',
    },
    url: 'https://dolomitinordicski.github.io/hub/',
    repo: 'dolomitinordicski/hub',
    lifecycle: 'beta',
    group: 'platform',
    backend: { kind: 'dns-core', label: 'DNS Core · Public Registry' },
    dependencies: ['dns-core', 'shared-data'],
    order: 2,
    visible: true,
  },
  {
    id: 'workspace',
    label: 'DNS Workspace',
    shortLabel: 'Workspace',
    description: {
      de: 'Neue zentrale Anwendungsshell und radiale Navigation für alle DNS Tools.',
      it: 'Nuova shell applicativa centrale e navigazione radiale per tutti i tool DNS.',
    },
    url: 'https://dolomitinordicski.github.io/dns-workspace/',
    repo: 'dolomitinordicski/dns-workspace',
    lifecycle: 'development',
    group: 'platform',
    backend: { kind: 'none', label: 'Foundation registry · W0' },
    dependencies: ['shared-data'],
    order: 3,
    visible: true,
  },
  {
    id: 'data-entry',
    label: 'DNS Data Entry',
    shortLabel: 'Data Entry',
    description: {
      de: 'Zentrale saisonale Dateneingabe und operative Orders.',
      it: 'Inserimento dati stagionali centrale e ordini operativi.',
    },
    url: 'https://dolomitinordicski.github.io/DNS-Data-Entry/',
    repo: 'dolomitinordicski/DNS-Data-Entry',
    lifecycle: 'production',
    group: 'operations',
    backend: { kind: 'dns-core', label: 'Firebase · dns-core' },
    dependencies: ['dns-core', 'shared-data'],
    order: 10,
    visible: true,
  },
  {
    id: 'analytics',
    label: 'DNS Analytics',
    shortLabel: 'Analytics',
    description: {
      de: 'KPI, historische Entwicklung und operative Analyse des DNS Netzwerks.',
      it: 'KPI, andamento storico e analisi operativa della rete DNS.',
    },
    url: 'https://dolomitinordicski.github.io/analytics/',
    repo: 'dolomitinordicski/analytics',
    lifecycle: 'production',
    group: 'operations',
    backend: { kind: 'dns-core', label: 'DNS Core · Analytics sources' },
    dependencies: ['dns-core', 'shared-data', 'data-entry'],
    order: 11,
    visible: true,
  },
  {
    id: 'fair',
    label: 'DNS FAIR',
    shortLabel: 'FAIR',
    description: {
      de: 'Beitragsmodell und FAIR Berechnungslogik mit eigenständiger Persistence.',
      it: 'Modello contributivo e logica FAIR con persistenza dedicata.',
    },
    url: 'https://dolomitinordicski.github.io/fairmodel/',
    repo: 'dolomitinordicski/fairmodel',
    lifecycle: 'production',
    group: 'operations',
    backend: { kind: 'fair-modell', label: 'Firebase · fair-modell' },
    dependencies: ['shared-data'],
    order: 12,
    visible: true,
  },
  {
    id: 'faktura',
    label: 'DNS Faktura',
    shortLabel: 'Faktura',
    description: {
      de: 'Order-to-Billing Workspace für Confirmation, Billing, Payment und Delivery.',
      it: 'Workspace Order-to-Billing per conferme, billing, pagamenti e consegne.',
    },
    url: 'https://dolomitinordicski.github.io/DNS-Faktura/',
    repo: 'dolomitinordicski/DNS-Faktura',
    lifecycle: 'production',
    group: 'operations',
    backend: { kind: 'dns-core', label: 'DNS Core + FAIR read' },
    dependencies: ['dns-core', 'shared-data', 'data-entry', 'fair'],
    order: 13,
    visible: true,
  },
  {
    id: 'polls',
    label: 'DNS Polls',
    shortLabel: 'Polls',
    description: {
      de: 'Terminfindung und Abschluss von DNS Meetings mit eigenständigem PII Datenbereich.',
      it: 'Pianificazione e chiusura meeting DNS con dominio PII separato.',
    },
    url: 'https://dolomitinordicski.github.io/DNS-Polls-tool/',
    repo: 'dolomitinordicski/DNS-Polls-tool',
    lifecycle: 'production',
    group: 'operations',
    backend: { kind: 'polls-private', label: 'Firebase · Polls PII domain' },
    dependencies: ['shared-data'],
    order: 14,
    visible: true,
  },
  {
    id: 'flyer-studio',
    label: 'DNS Flyer Studio',
    shortLabel: 'Flyer Studio',
    description: {
      de: 'Workspace für DNS Kommunikationsmaterialien, Assets und Templates.',
      it: 'Workspace per materiali di comunicazione DNS, asset e template.',
    },
    url: 'https://dolomitinordicski.github.io/DNS-Flyer-Studio/',
    repo: 'dolomitinordicski/DNS-Flyer-Studio',
    lifecycle: 'development',
    group: 'communication',
    backend: { kind: 'dns-core', label: 'Firebase · dns-core' },
    dependencies: ['dns-core', 'shared-data'],
    order: 20,
    visible: true,
  },
  {
    id: 'qr',
    label: 'DNS QR Code Generator',
    shortLabel: 'QR Generator',
    description: {
      de: 'DNS Utility zur Erzeugung von QR Codes.',
      it: 'Utility DNS per la generazione di QR code.',
    },
    url: 'https://dolomitinordicski.github.io/qrcodegen/',
    repo: 'dolomitinordicski/qrcodegen',
    lifecycle: 'maintenance',
    group: 'communication',
    backend: { kind: 'none', label: 'No Firebase' },
    dependencies: [],
    order: 21,
    visible: true,
  },
  {
    id: 'strategy',
    label: 'DNS Strategy',
    shortLabel: 'Strategy',
    description: {
      de: 'Strategischer Arbeits- und Referenzbereich für die DNS Entwicklung.',
      it: 'Area strategica di lavoro e riferimento per lo sviluppo DNS.',
    },
    url: 'https://dolomitinordicski.github.io/strategy/',
    repo: 'dolomitinordicski/strategy',
    lifecycle: 'development',
    group: 'communication',
    backend: { kind: 'none', label: 'No Firebase' },
    dependencies: [],
    order: 22,
    visible: true,
  },
  {
    id: 'ar360',
    label: 'DNS 360 AR Tool',
    shortLabel: '360 AR',
    description: {
      de: 'Bestehendes Werkzeug für 360°- und AR-Inhalte.',
      it: 'Strumento esistente per contenuti 360° e AR.',
    },
    url: 'https://dolomitinordicski.github.io/360ARtool/',
    repo: 'dolomitinordicski/360ARtool',
    lifecycle: 'maintenance',
    group: 'communication',
    backend: { kind: 'none', label: 'No Firebase' },
    dependencies: [],
    order: 23,
    visible: true,
  },
  {
    id: 'portal-v2',
    label: 'DNS Partner Portal Hub v2',
    shortLabel: 'Partner Portal v2',
    description: {
      de: 'Neuer zentraler Zugang für DNS Partner; derzeit in Entwicklung.',
      it: 'Nuovo accesso centrale per i partner DNS; attualmente in sviluppo.',
    },
    url: 'https://dolomitinordicski.github.io/DNS-Partner-Portal-Hub-v2/',
    repo: 'dolomitinordicski/DNS-Partner-Portal-Hub-v2',
    lifecycle: 'development',
    group: 'portal',
    backend: { kind: 'dns-core', label: 'DNS Core target' },
    dependencies: ['dns-core', 'shared-data'],
    order: 30,
    visible: true,
  },
  {
    id: 'smartslopes',
    label: 'Smart Slopes',
    shortLabel: 'Smart Slopes',
    description: {
      de: 'Bestehender DNS Projekt- und Demonstratorbereich.',
      it: 'Area di progetto e dimostratore DNS esistente.',
    },
    url: 'https://dolomitinordicski.github.io/smartslopes/',
    repo: 'dolomitinordicski/smartslopes',
    lifecycle: 'maintenance',
    group: 'legacy',
    backend: { kind: 'none', label: 'No Firebase' },
    dependencies: [],
    order: 40,
    visible: true,
  },
  {
    id: 'partnerportal',
    label: 'Partner Portal',
    shortLabel: 'Partner Portal legacy',
    description: {
      de: 'Frühere Version des DNS Partner Portals.',
      it: 'Versione precedente del Partner Portal DNS.',
    },
    url: 'https://dolomitinordicski.github.io/partnerportal/',
    repo: 'dolomitinordicski/partnerportal',
    lifecycle: 'legacy',
    group: 'legacy',
    backend: { kind: 'none', label: 'Legacy' },
    dependencies: [],
    order: 41,
    visible: true,
  },
] as const;
