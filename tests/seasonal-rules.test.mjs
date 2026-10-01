import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, getDocs, collection, query, where, writeBatch, serverTimestamp } from 'firebase/firestore';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const env = await initializeTestEnvironment({ projectId: 'demo-dns-core', firestore: { host: '127.0.0.1', port: 8088, rules: fs.readFileSync('firestore.rules', 'utf8') } });
try {
  await env.withSecurityRulesDisabled(async (context) => {
    const db=context.firestore();
    await setDoc(doc(db,'users','admin'),{active:true,globalRoles:['dns-admin']});
    await setDoc(doc(db,'users','seller'),{active:true,globalRoles:[]});
    await setDoc(doc(db,'users','reader'),{active:true,globalRoles:[]});
    await setDoc(doc(db,'users','verifier'),{active:true,globalRoles:[]});
    await setDoc(doc(db,'seasons','2026-27'),{status:'active'});
    await setDoc(doc(db,'seasons','2024-25'),{status:'historical'});
    await setDoc(doc(db,'reportingAreas','area'),{canonicalName:'Area'});
    await setDoc(doc(db,'organizations','org'),{reportingAreaIds:['area']});
    await setDoc(doc(db,'deliveryLocations','delivery-org'),{id:'delivery-org',organizationId:'org',reportingAreaId:'area',recipientName:'Org',label:'Org delivery',status:'verified'});
    await setDoc(doc(db,'pocketfolderSourceRows','2026-27__source-row-06'),{id:'2026-27__source-row-06',seasonId:'2026-27',sourceRow:6,label:'Antholzertal',comparison2025:3500,requested2026:3000,dnsCopies:100,areaTotal2026:4200,printerTotal2026:4550,backLanguageNote:'Rückseite dt-it-en',rowKind:'area'});
    for(const [uid,permissions] of [['seller',['ticketOrders.read','ticketOrders.write','ticketSales.read','ticketSales.write','kp.read','kp.write']],['reader',['ticketOrders.read','ticketSales.read']]])
      await setDoc(doc(db,'accessGrants',`${uid}__organization__org`),{active:true,permissions});
    await setDoc(doc(db,'accessGrants','reader__reportingArea__area'),{active:true,permissions:['kp.read']});
    await setDoc(doc(db,'accessGrants','verifier__reportingArea__area'),{active:true,permissions:['kp.read','kp.verify','ticketOrders.read','ticketOrders.verify']});
  });
  const admin=env.authenticatedContext('admin').firestore();
  const seller=env.authenticatedContext('seller').firestore();
  const reader=env.authenticatedContext('reader').firestore();
  const verifier=env.authenticatedContext('verifier').firestore();
  await assertSucceeds(getDoc(doc(seller,'deliveryLocations','delivery-org')));
  await assertSucceeds(getDoc(doc(reader,'deliveryLocations','delivery-org')));
  await assertSucceeds(getDoc(doc(reader,'pocketfolderSourceRows','2026-27__source-row-06')));
  await assertFails(setDoc(doc(admin,'pocketfolderSourceRows','manual-row'),{id:'manual-row'}));
  await assertFails(setDoc(doc(admin,'deliveryLocations','manual'),{id:'manual'}));
  const pocketfolderOrder={id:'2026-27__pocketfolder__org',seasonId:'2026-27',organizationId:'org',reportingAreaId:'area',category:'pocketfolder',status:'draft'};
  await assertSucceeds(setDoc(doc(seller,'ticketOrders',pocketfolderOrder.id),pocketfolderOrder));
  await assertSucceeds(getDoc(doc(reader,'ticketOrders',pocketfolderOrder.id)));
  const line={id:'2026-27__pocketfolder__org__item',ticketOrderId:pocketfolderOrder.id,seasonId:'2026-27',organizationId:'org',reportingAreaId:'area',catalogItemId:'item',quantity:10};
  await assertSucceeds(setDoc(doc(seller,'ticketOrderLines',line.id),line));
  await assertSucceeds(setDoc(doc(seller,'ticketOrders',pocketfolderOrder.id),{...pocketfolderOrder,status:'submitted'}));
  await assertFails(setDoc(doc(seller,'ticketOrderLines',line.id),{...line,quantity:11}));
  await assertFails(setDoc(doc(seller,'ticketOrders',pocketfolderOrder.id),{...pocketfolderOrder,status:'draft'}));
  await assertSucceeds(setDoc(doc(verifier,'ticketOrders',pocketfolderOrder.id),{...pocketfolderOrder,status:'draft'}));
  await assertSucceeds(setDoc(doc(verifier,'ticketOrderLines',line.id),{...line,quantity:12}));

  const billingRate={
    id:'2026-27__order__item',
    seasonId:'2026-27',
    sourceType:'order',
    catalogItemId:'item',
    billingUnitPrice:0.17,
    currency:'EUR',
    source:{documentLabel:'Supplier offer test'},
    active:true,
    revision:1,
  };
  await assertSucceeds(setDoc(doc(admin,'billingRateConfigs',billingRate.id),billingRate));
  await assertSucceeds(getDoc(doc(admin,'billingRateConfigs',billingRate.id)));
  await assertFails(getDoc(doc(seller,'billingRateConfigs',billingRate.id)));
  await assertFails(setDoc(doc(seller,'billingRateConfigs','seller-rate'),{...billingRate,id:'seller-rate'}));
  await assertFails(setDoc(doc(admin,'billingRateConfigs','missing-source'),{...billingRate,id:'missing-source',source:{documentLabel:''}}));
  await assertSucceeds(setDoc(doc(admin,'billingRateConfigs',billingRate.id),{...billingRate,billingUnitPrice:0.18,revision:2}));
  await assertFails(setDoc(doc(admin,'billingRateConfigs',billingRate.id),{...billingRate,billingUnitPrice:0.19,revision:4}));

  const billingRun={
    id:'2026-27__org',
    seasonId:'2026-27',
    organizationId:'org',
    reportingAreaId:'area',
    status:'draft',
    revision:1,
    sourceTypes:['order'],
    sourceOrderStatuses:['submitted','confirmed','fulfilled'],
    lineCount:1,
    billedQuantity:12,
    unpricedQuantity:0,
    totalAmount:2.16,
    generatedBy:'admin',
    generatedAt:serverTimestamp(),
    updatedAt:serverTimestamp(),
  };
  const billingLine={
    id:'2026-27__org__r1__order__item',
    runId:billingRun.id,
    runRevision:1,
    seasonId:'2026-27',
    organizationId:'org',
    reportingAreaId:'area',
    source:{type:'order',sourceId:billingRate.id,sourceLabel:'Supplier offer test'},
    catalogItemId:'item',
    description:'Item',
    quantity:12,
    unitAmount:0.18,
    amount:2.16,
    included:true,
    rateId:billingRate.id,
    rateRevision:2,
    sourceDocumentLabel:'Supplier offer test',
    createdBy:'admin',
    createdAt:serverTimestamp(),
  };
  const runBatch1=writeBatch(admin);
  runBatch1.set(doc(admin,'billingRuns',billingRun.id),billingRun);
  runBatch1.set(doc(admin,'billingLines',billingLine.id),billingLine);
  await assertSucceeds(runBatch1.commit());
  await assertSucceeds(getDoc(doc(admin,'billingRuns',billingRun.id)));
  await assertSucceeds(getDoc(doc(admin,'billingLines',billingLine.id)));
  await assertFails(getDoc(doc(seller,'billingRuns',billingRun.id)));
  await assertFails(getDoc(doc(seller,'billingLines',billingLine.id)));
  await assertFails(setDoc(doc(admin,'billingLines',billingLine.id),{...billingLine,amount:999}));
  await assertFails(setDoc(doc(admin,'billingRuns',billingRun.id),{...billingRun,status:'ready',revision:2,unpricedQuantity:1,generatedAt:serverTimestamp(),updatedAt:serverTimestamp()}));

  const billingRun2={...billingRun,revision:2,totalAmount:2.4,generatedAt:serverTimestamp(),updatedAt:serverTimestamp()};
  const billingLine2={...billingLine,id:'2026-27__org__r2__order__item',runRevision:2,unitAmount:0.2,amount:2.4,rateRevision:3,createdAt:serverTimestamp()};
  const runBatch2=writeBatch(admin);
  runBatch2.set(doc(admin,'billingRuns',billingRun.id),billingRun2);
  runBatch2.set(doc(admin,'billingLines',billingLine2.id),billingLine2);
  await assertSucceeds(runBatch2.commit());

  const billingRunReady={...billingRun2,status:'ready',revision:3,totalAmount:2.4,unpricedQuantity:0,generatedAt:serverTimestamp(),updatedAt:serverTimestamp()};
  const billingLine3={...billingLine2,id:'2026-27__org__r3__order__item',runRevision:3,createdAt:serverTimestamp()};
  const runBatch3=writeBatch(admin);
  runBatch3.set(doc(admin,'billingRuns',billingRun.id),billingRunReady);
  runBatch3.set(doc(admin,'billingLines',billingLine3.id),billingLine3);
  await assertSucceeds(runBatch3.commit());
  await assertFails(setDoc(doc(admin,'billingRuns',billingRun.id),{...billingRunReady,status:'draft',revision:4,generatedAt:serverTimestamp(),updatedAt:serverTimestamp()}));
  await assertFails(setDoc(doc(admin,'billingLines','orphan-line'),{...billingLine,id:'orphan-line',runId:'missing-run',createdAt:serverTimestamp()}));

  const milestone={id:'2026-27__m1',seasonId:'2026-27',date:'2026-12-23',label:'Milestone 1',order:1,updatedBy:'admin',updatedAt:serverTimestamp()};
  await assertSucceeds(setDoc(doc(admin,'kpMilestones',milestone.id),milestone));
  await assertFails(setDoc(doc(seller,'kpMilestones','2026-27__m2'),{...milestone,id:'2026-27__m2',order:2,updatedBy:'seller'}));
  const kpEntry={id:'2026-27__org',seasonId:'2026-27',entityType:'organization',entityId:'org',reportingAreaId:'area',referenceKm:{uniqueNetworkKm:20,potentialOperationalKm:25},milestones:[{milestoneId:milestone.id,openedKm:10,naturalSnowKm:6,artificialSnowKm:4}],includeInKp:true,exclusionReason:'',provenance:{sourceSystem:'manual-data-entry',methodVersion:1,dataStatus:'draft'},notes:'',revision:1,updatedBy:'seller',updatedAt:serverTimestamp()};
  await assertSucceeds(setDoc(doc(seller,'kpEntries',kpEntry.id),kpEntry));
  await assertSucceeds(getDoc(doc(reader,'kpEntries',kpEntry.id)));
  await assertFails(setDoc(doc(reader,'kpEntries','2026-27__reader'),{...kpEntry,id:'2026-27__reader',entityId:'reader',updatedBy:'reader'}));
  await assertFails(setDoc(doc(seller,'kpEntries','2026-27__org-wrong'),{...kpEntry,id:'2026-27__org-wrong',reportingAreaId:'unrelated'}));
  const kpPrevious=(await getDoc(doc(seller,'kpEntries',kpEntry.id))).data();
  const kpBatch=writeBatch(seller);kpBatch.set(doc(seller,'kpEntries',kpEntry.id,'revisions','1'),kpPrevious);kpBatch.set(doc(seller,'kpEntries',kpEntry.id),{...kpEntry,revision:2,milestones:[{milestoneId:milestone.id,openedKm:11,naturalSnowKm:7,artificialSnowKm:4}]});await assertSucceeds(kpBatch.commit());
  const fairValidation={id:'2026-27__area__2026-27__m1',seasonId:'2026-27',reportingAreaId:'area',milestoneId:milestone.id,potentialOperationalKm:25,openedKm:11,naturalSnowKm:7,artificialSnowKm:4,revision:1,validatedBy:'verifier',validatedAt:serverTimestamp()};
  await assertFails(setDoc(doc(seller,'kpFairValidations',fairValidation.id),{...fairValidation,validatedBy:'seller'}));
  await assertSucceeds(setDoc(doc(verifier,'kpFairValidations',fairValidation.id),fairValidation));
  await assertSucceeds(getDoc(doc(reader,'kpFairValidations',fairValidation.id)));
  const fairPrevious=(await getDoc(doc(verifier,'kpFairValidations',fairValidation.id))).data();
  const fairBatch=writeBatch(verifier);fairBatch.set(doc(verifier,'kpFairValidations',fairValidation.id,'revisions','1'),fairPrevious);fairBatch.set(doc(verifier,'kpFairValidations',fairValidation.id),{...fairValidation,revision:2,openedKm:12,naturalSnowKm:8});await assertSucceeds(fairBatch.commit());
  await assertFails(setDoc(doc(admin,'kpEntries','2025-26__org'),{...kpEntry,id:'2025-26__org',seasonId:'2025-26',updatedBy:'admin'}));
  const price={id:'price',seasonId:'2026-27',scopeType:'reportingArea',scopeId:'area',productCode:'day',salesChannel:'official',salesPeriod:'regular',unitPrice:10,settlementUnitPrice:10,currency:'EUR',active:true,validFrom:'',validTo:'',notes:'',revision:1,provenance:{sourceSystem:'manual-data-entry',methodVersion:1,dataStatus:'draft'},updatedBy:'admin',updatedAt:serverTimestamp()};
  await assertSucceeds(setDoc(doc(admin,'ticketPricingConfigs','price'),price));
  await assertSucceeds(setDoc(doc(admin,'ticketPricingConfigs','price-weekly'),{...price,id:'price-weekly',productCode:'wk-area'}));
  await assertFails(setDoc(doc(seller,'ticketPricingConfigs','other'),{...price,id:'other',updatedBy:'seller'}));
  const saleId='2026-27__org__area__day__official__regular';
  const sale={id:saleId,draftKey:'draft',seasonId:'2026-27',organizationId:'org',reportingAreaId:'area',productCode:'day',salesChannel:'official',salesPeriod:'regular',quantity:10,amountOverride:null,amountOverrideReason:'',pricing:{pricingConfigId:'price',unitPrice:10,settlementUnitPrice:10,currency:'EUR'},calculatedAmount:100,revision:1,provenance:{sourceSystem:'manual-data-entry',methodVersion:1,dataStatus:'draft'},updatedBy:'seller',updatedAt:serverTimestamp()};
  await assertSucceeds(getDoc(doc(seller,'ticketSales','2026-27__org__area__day__official__regular')));
  await assertFails(getDoc(doc(seller,'ticketSales','2026-27__other__other__day__official__regular')));
  await assertSucceeds(setDoc(doc(seller,'ticketSales',saleId),sale));
  await assertSucceeds(getDocs(query(collection(seller,'ticketSales'),where('seasonId','==','2026-27'),where('organizationId','==','org'),where('reportingAreaId','==','area'))));
  await assertFails(getDocs(collection(seller,'ticketSales')));
  await assertSucceeds(getDoc(doc(reader,'ticketSales',saleId)));
  const newId='2026-27__org__area__wk-area__official__regular';
  const newSale={...sale,id:newId,productCode:'wk-area',pricing:{...sale.pricing,pricingConfigId:'price-weekly'}};
  await assertFails(setDoc(doc(reader,'ticketSales',newId),{...newSale,updatedBy:'reader'}));
  await assertFails(setDoc(doc(seller,'ticketSales','wrong-area'),{...sale,id:'wrong-area',reportingAreaId:'unrelated'}));
  await assertFails(setDoc(doc(seller,'ticketSales',newId),{...newSale,quantity:-1}));
  await assertFails(setDoc(doc(seller,'ticketSales',newId),{...newSale,calculatedAmount:999}));
  await assertFails(setDoc(doc(seller,'ticketSales',newId),{...newSale,amountOverride:90}));
  await assertFails(setDoc(doc(seller,'ticketSales',saleId),{...sale,revision:2,quantity:11,calculatedAmount:110}));
  const previous=(await getDoc(doc(seller,'ticketSales',saleId))).data();
  const batch=writeBatch(seller);batch.set(doc(seller,'ticketSales',saleId,'revisions','1'),previous);batch.set(doc(seller,'ticketSales',saleId),{...sale,revision:2,quantity:11,calculatedAmount:110});
  await assertSucceeds(batch.commit());
  assert.equal((await getDoc(doc(seller,'ticketSales',saleId,'revisions','1'))).data().quantity,10);
  await assertFails(setDoc(doc(seller,'ticketSales',saleId,'revisions','1'),{...previous,quantity:999}));
  const oldPrice=(await getDoc(doc(admin,'ticketPricingConfigs','price'))).data();
  const priceBatch=writeBatch(admin);priceBatch.set(doc(admin,'ticketPricingConfigs','price','revisions','1'),oldPrice);priceBatch.set(doc(admin,'ticketPricingConfigs','price'),{...price,revision:2,unitPrice:12,settlementUnitPrice:12});await assertSucceeds(priceBatch.commit());
  const weeklyPrevious=(await getDoc(doc(admin,'ticketPricingConfigs','price-weekly'))).data();
  const weeklyBatch=writeBatch(admin);weeklyBatch.set(doc(admin,'ticketPricingConfigs','price-weekly','revisions','1'),weeklyPrevious);weeklyBatch.set(doc(admin,'ticketPricingConfigs','price-weekly'),{...price,id:'price-weekly',productCode:'wk-area',revision:2,unitPrice:12,settlementUnitPrice:12});await assertSucceeds(weeklyBatch.commit());
  await assertFails(setDoc(doc(seller,'ticketSales',newId),newSale));
  await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(),'ticketSales',saleId)));
  const historical={seasonId:'2025-26',domain:'sales',organizationId:'org',reportingAreaId:'area',facts:[{quantity:5,amount:50}]};
  await env.withSecurityRulesDisabled(async context=>{
    await setDoc(doc(context.firestore(),'historicalSeasonRecords','history'),historical);
    await setDoc(doc(context.firestore(),'historicalSeasonRecords','history-2024-snow'),{seasonId:'2024-25',domain:'snow',organizationId:'',reportingAreaId:'area',facts:[{openKm:12}]});
    await setDoc(doc(context.firestore(),'historicalSeasonRecords','history-2024-costs'),{seasonId:'2024-25',domain:'costs',organizationId:'',reportingAreaId:'area',facts:[{reportedAmount:1000}]});
    await setDoc(doc(context.firestore(),'historicalSeasonImports','2025-26'),{seasonId:'2025-26'});
    await setDoc(doc(context.firestore(),'seasons','2025-26'),{status:'closed'});
  });
  await assertSucceeds(getDocs(query(collection(seller,'historicalSeasonRecords'),where('seasonId','==','2025-26'),where('domain','==','sales'),where('organizationId','==','org'))));
  await assertSucceeds(getDocs(query(collection(reader,'historicalSeasonRecords'),where('seasonId','==','2024-25'),where('domain','==','snow'),where('reportingAreaId','==','area'))));
  await assertSucceeds(getDocs(query(collection(reader,'historicalSeasonRecords'),where('seasonId','==','2024-25'),where('domain','==','costs'),where('reportingAreaId','==','area'))));
  await assertFails(getDocs(collection(seller,'historicalSeasonRecords')));
  await assertFails(setDoc(doc(admin,'historicalSeasonRecords','history'),historical));
  await assertFails(setDoc(doc(admin,'historicalSeasonImports','2025-26'),{seasonId:'2025-26'}));
  await assertFails(getDoc(doc(seller,'historicalSeasonImports','2025-26')));
  await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(),'historicalSeasonRecords','history')));
  await assertFails(setDoc(doc(admin,'ticketPricingConfigs','historic-price'),{...price,id:'historic-price',seasonId:'2025-26'}));
  await assertFails(setDoc(doc(admin,'ticketOrders','historic-order'),{seasonId:'2025-26',organizationId:'org',category:'ticket',status:'draft'}));
  await assertFails(setDoc(doc(admin,'ticketSales','2024-25__org__area__day__official__regular'),{...sale,id:'2024-25__org__area__day__official__regular',seasonId:'2024-25'}));
  await assertFails(setDoc(doc(admin,'ticketPricingConfigs','historic-price-2024'),{...price,id:'historic-price-2024',seasonId:'2024-25'}));
  await assertFails(setDoc(doc(admin,'ticketOrders','historic-order-2024'),{seasonId:'2024-25',organizationId:'org',category:'ticket',status:'draft'}));
  console.log('Seasonal rules passed: scoped reads/writes, admin-only sourced billing rates, revisioned immutable billing snapshots, read-only users, invalid quantities/amounts, immutable audit history, stale pricing and anonymous access.');
} finally { await env.cleanup(); }
