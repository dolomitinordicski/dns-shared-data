import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFile } from 'node:fs/promises';
import {
  ANALYTICS_PUBLIC_SCHEMA_VERSION,
  type AnalyticsPublicSnapshot,
} from '../src/analytics-public.js';

const TARGET_PROJECT_ID = 'dns-core';
const SEASON_ID = '2025-26' as const;
const APPLY = process.argv.includes('--apply');

const REGION_IDS = [
  'antholzertal',
  'gsiesertal-welsberg-taisten',
  'drei-zinnen',
  'osttirol',
  'ahrntal',
  'seiser-alm-dolomites-val-gardena',
  'val-comelico',
  'cortina-d-ampezzo',
] as const;

const FAIR_NAME_TO_AREA: Record<string,(typeof REGION_IDS)[number]> = {
  'Antholzertal':'antholzertal',
  'Gsiesertal / Welsberg / Taisten':'gsiesertal-welsberg-taisten',
  '3 Zinnen Dolomites':'drei-zinnen',
  'Osttirol':'osttirol',
  'Ahrntal / Sand in Taufers':'ahrntal',
  'Seiser Alm / Val Gardena':'seiser-alm-dolomites-val-gardena',
  'Comelico':'val-comelico',
  "Cortina d'Ampezzo":'cortina-d-ampezzo',
};

const KP_NAME_TO_AREA: Record<string,(typeof REGION_IDS)[number]> = {
  'Antholzertal':'antholzertal',
  'Gsiesertal':'gsiesertal-welsberg-taisten',
  '3 Zinnen':'drei-zinnen',
  'Osttirol':'osttirol',
  'Ahrntal+Sand':'ahrntal',
  'Seiser Alm/Gard':'seiser-alm-dolomites-val-gardena',
  'Comelico':'val-comelico',
  'Cortina':'cortina-d-ampezzo',
};

const PRODUCTS = ['day','wk-area','wk-dns','sk-area','sk-dns'] as const;
const REGIONAL_QTY_KEYS = ['dayQ','wkaQ','wkdQ','skaQ','skdQ'] as const;
const REGIONAL_REVENUE_KEYS = ['dayR','wkaR','wkdR','skaR','skdR'] as const;
const ANNUAL_QTY_KEYS = ['day','wka','wkd','ska','skd'] as const;
const MILESTONES = [
  {id:'2025-26__2025-12-23',date:'2025-12-23',order:1},
  {id:'2025-26__2026-01-06',date:'2026-01-06',order:2},
  {id:'2025-26__2026-01-20',date:'2026-01-20',order:3},
] as const;

type AuditSnapshot = {
  source:{sha256:string};
  seasonOverview:{
    totalTickets:number;
    totalRevenue:number;
    avgPrice:number;
    regionQty:number[];
    regionRevenue:number[];
    ticketQty:number[];
    ticketRevenue:number[];
    channels:{labels:string[];values:number[]};
  };
  annual:{
    qty:Record<string,number[]>;
    totalTickets:number[];
    totalRevenue:number[];
    avgPrice:number[];
    revenueByType:Record<string,number[]>;
  };
  regional:Record<string,number[]>;
  kpRegions:Array<{
    r:string;pot:number;
    tot1:number;ks1:number;tot2:number;ks2:number;tot3:number;ks3:number;
  }>;
};

function assertFinite(label:string,value:unknown) {
  if (!Number.isFinite(Number(value))) throw new Error(`Invalid numeric value: ${label}`);
}

function canonicalJson(value:unknown):string {
  if (Array.isArray(value)) return '['+value.map(canonicalJson).join(',')+']';
  if (value && typeof value==='object') {
    const record=value as Record<string,unknown>;
    return '{'+Object.keys(record).sort().map(key=>JSON.stringify(key)+':'+canonicalJson(record[key])).join(',')+'}';
  }
  return JSON.stringify(value);
}

async function buildSnapshot():Promise<AnalyticsPublicSnapshot> {
  const audit=JSON.parse(
    await readFile(new URL('./analytics-audit-snapshot.json',import.meta.url),'utf8'),
  ) as AuditSnapshot;

  const overview=audit.seasonOverview;
  if (overview.regionQty.length!==8 || overview.ticketQty.length!==5) {
    throw new Error('Unexpected Analytics golden-master dimensions.');
  }

  const byProduct:Record<string,{quantity:number;revenue:number}>={};
  PRODUCTS.forEach((code,index)=>{
    byProduct[code]={quantity:overview.ticketQty[index],revenue:overview.ticketRevenue[index]};
  });

  const byReportingArea:Record<string,{quantity:number;revenue:number}>={};
  REGION_IDS.forEach((areaId,index)=>{
    byReportingArea[areaId]={quantity:overview.regionQty[index],revenue:overview.regionRevenue[index]};
  });

  const byReportingAreaProduct:Record<string,Record<string,{quantity:number;revenue:number}>>={};
  REGION_IDS.forEach((areaId,areaIndex)=>{
    byReportingAreaProduct[areaId]={};
    PRODUCTS.forEach((code,productIndex)=>{
      byReportingAreaProduct[areaId][code]={
        quantity:Number(audit.regional[REGIONAL_QTY_KEYS[productIndex]][areaIndex]),
        revenue:Number(audit.regional[REGIONAL_REVENUE_KEYS[productIndex]][areaIndex]),
      };
    });
  });

  const byChannel={
    official:{quantity:Number(overview.channels.values[0] ?? 0)},
    online:{quantity:Number(overview.channels.values[1] ?? 0)},
    track:{quantity:Number(overview.channels.values[2] ?? 0)},
  };

  const seasons=['2022-23','2023-24','2024-25','2025-26'] as const;
  const annualPoints=seasons.map((seasonId,index)=>({
    seasonId,
    totalTickets:Number(audit.annual.totalTickets[index]),
    totalRevenue:Number(audit.annual.totalRevenue[index]),
    avgPrice:Number(audit.annual.avgPrice[index]),
    qty:Object.fromEntries(ANNUAL_QTY_KEYS.map(key=>[key,Number(audit.annual.qty[key][index])])) as {
      day:number;wka:number;wkd:number;ska:number;skd:number;
    },
    revenue:Object.fromEntries(ANNUAL_QTY_KEYS.map(key=>[key,Number(audit.annual.revenueByType[key][index])])) as {
      day:number;wka:number;wkd:number;ska:number;skd:number;
    },
  }));

  const kpByArea:Record<string,Record<string,{
    potentialOperationalKm:number;openedKm:number;artificialSnowKm:number;naturalSnowKm:number;
  }>>={};
  for (const row of audit.kpRegions) {
    const areaId=KP_NAME_TO_AREA[row.r];
    if (!areaId) throw new Error(`Unknown KP reporting area: ${row.r}`);
    const opened=[row.tot1,row.tot2,row.tot3];
    const artificial=[row.ks1,row.ks2,row.ks3];
    kpByArea[areaId]={};
    MILESTONES.forEach((milestone,index)=>{
      kpByArea[areaId][milestone.id]={
        potentialOperationalKm:Number(row.pot),
        openedKm:Number(opened[index]),
        artificialSnowKm:Number(artificial[index]),
        naturalSnowKm:Number(opened[index])-Number(artificial[index]),
      };
    });
  }

  const db=getFirestore();
  const fairDoc=await db.collection('fairModel').doc('ws-2026-27').get();
  if (!fairDoc.exists) throw new Error('FAIR reference fairModel/ws-2026-27 not found.');
  const fairData=fairDoc.data() ?? {};
  const fairRegions=Array.isArray(fairData.regions) ? fairData.regions : [];
  if (fairRegions.length!==8) throw new Error('FAIR reference must contain exactly 8 regions.');
  const fair=fairRegions.map((raw:Record<string,unknown>)=>{
    const label=String(raw.name ?? '');
    const reportingAreaId=FAIR_NAME_TO_AREA[label];
    if (!reportingAreaId) throw new Error(`Unknown FAIR reporting area: ${label}`);
    for (const key of ['PN','SW','KP','SA']) assertFinite(`FAIR ${label} ${key}`,raw[key]);
    return {
      reportingAreaId,
      label,
      PN:Number(raw.PN),
      SW:Number(raw.SW),
      KP:Number(raw.KP),
      SA:Number(raw.SA),
    };
  });

  return {
    id:SEASON_ID,
    seasonId:SEASON_ID,
    schemaVersion:ANALYTICS_PUBLIC_SCHEMA_VERSION,
    revision:1,
    publicationStatus:'published',
    generatedAt:new Date().toISOString(),
    publishedAt:new Date().toISOString(),
    sourceRevision:`legacy-dashboard-v1:${audit.source.sha256.slice(0,12)}|fair:${String(fairData.clientUpdatedAt ?? 'unknown')}`,
    sourceSummary:'Validated DNS Analytics 2025-26 aggregate snapshot + DNS FAIR canonical reference; no raw operational rows.',
    sales:{
      totalTickets:Number(overview.totalTickets),
      totalRevenue:Number(overview.totalRevenue),
      averageTicketPrice:Number(overview.avgPrice),
      byProduct,
      byReportingArea,
      byReportingAreaProduct,
      byChannel,
    },
    annual:{points:annualPoints},
    kp:{milestones:MILESTONES,byAreaMilestone:kpByArea},
    fair:{regions:fair},
  };
}

async function main() {
  initializeApp({credential:applicationDefault(),projectId:TARGET_PROJECT_ID});
  const snapshot=await buildSnapshot();

  if (!APPLY) {
    console.log(`Validated analyticsPublicSnapshots/${snapshot.id} (dry run).`);
    return;
  }

  const db=getFirestore();
  const ref=db.collection('analyticsPublicSnapshots').doc(snapshot.id);
  const current=await ref.get();
  const currentRevision=current.exists ? Number(current.data()?.revision ?? 0) : 0;
  const publication={...snapshot,revision:currentRevision+1};

  await ref.set(publication,{merge:false});
  const persisted=await ref.get();
  if (!persisted.exists) throw new Error('Public Analytics snapshot read-back failed.');

  const actual=persisted.data();
  if (canonicalJson(actual)!==canonicalJson(publication)) {
    throw new Error('Public Analytics snapshot read-back differs from publication payload.');
  }

  console.log(`✓ analyticsPublicSnapshots/${publication.id} · revision ${publication.revision} · published and exact read-back verified`);
}

main().catch(error=>{
  console.error(error);
  process.exitCode=1;
});
