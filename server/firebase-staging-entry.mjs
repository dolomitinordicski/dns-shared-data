/** Isolated staging export; never re-exports firebase-entry or pollsBridgeApi. */
import {initializeApp,getApps} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {getFirestore} from 'firebase-admin/firestore';
import {onRequest} from 'firebase-functions/v2/https';
import {defineSecret,defineString} from 'firebase-functions/params';
import {createStagingPassHandler} from './digital-pass-staging.mjs';
const key=defineSecret('DNS_PASS_HMAC_KEY');
const runtime=defineString('DNS_PASS_STAGING_RUNTIME_SERVICE_ACCOUNT');
export const digitalPassApi=onRequest({region:'europe-west8',serviceAccount:runtime,secrets:[key],invoker:'private',minInstances:0,maxInstances:1,memory:'256MiB',cpu:1,timeoutSeconds:60},createStagingPassHandler({env:process.env,createDependencies:settings=>{
 const app=getApps().find(a=>a.name==='dns-digital-pass-staging')??initializeApp({projectId:settings.projectId},'dns-digital-pass-staging');
 if(app.options.projectId!==settings.projectId)throw Error('STAGING_PROJECT_MISMATCH');
 return {db:getFirestore(app),auth:getAuth(app),hmacSecret:key.value()};
}}));
