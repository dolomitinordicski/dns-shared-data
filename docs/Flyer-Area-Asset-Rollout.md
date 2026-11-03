# Flyer Studio — libreria immagini condivisa per area

Data di preparazione: 3 novembre 2026  
Stato: candidato su branch, non distribuire prima delle decisioni aperte

## 1. Verifiche preliminari

### Reporting area di Alpe di Siusi e Val Gardena

Alpe di Siusi (`seiser-alm-marketing`) e Val Gardena (`val-gardena`) hanno lo stesso `reportingAreaId`: `seiser-alm-dolomites-val-gardena`.

Fonti:

- `src/order-setup-2026-27.ts`, righe 225-226;
- `src/pocketfolder-setup-2026-27.ts`, righe 177-178.

La suite usa due account distinti con permesso sulla stessa area e verifica che entrambi possano leggere gli stessi file e che entrambi i writer possano caricare.

### Validazione Firestore di `storagePath`

Nel baseline della PR #232, `validFlyerAsset` verificava soltanto che `storagePath` fosse una stringa non vuota. Il match `/flyerAssets/{document}` richiedeva il validatore su creazione e aggiornamento, ma non legava il percorso allo `scopeId` del documento.

Fonte: `firestore.rules`, funzione `validFlyerAsset` e match `/flyerAssets/{document}`.

Il candidato aggiunge limite di lunghezza e vincolo `flyerAssets/{scopeId}/{fileName}.jpg`, impedendo a un documento di area A di indicare un file dell’area B o un percorso legacy con UID.

### Percorso costruito dal client Flyer Studio

Il client attuale costruisce `flyerAssets/{uid}/{areaId}` e carica il JPEG nel percorso risultante.

Fonte nel repository `dolomitinordicski/DNS-Flyer-Studio`: `src/data/flyerImageLibrary.ts`, riga 21 e righe 46-51. Il client non viene modificato in questo PR.

### Audit produttivo eseguito in sola lettura

`scripts/audit-flyer-assets-rollout.mjs` è esclusivamente di lettura. L’audit autorizzato ha restituito:

- oggetti sotto `flyerAssets/`: **0**;
- scope con grant `flyer.read` o `flyer.write`: **nessuno**;
- Firestore: Native/Standard, `europe-west8`.

Esecuzione prevista dall’amministratore:

```text
node scripts/audit-flyer-assets-rollout.mjs --project dns-core --bucket dns-core.firebasestorage.app
```

Lo script non contiene token o segreti. Poiché il conteggio è zero, il percorso legacy è stato rimosso completamente dal candidato e non serve alcuna migrazione.

## 2. Modifiche fatte, file per file

- `storage.rules`
  - nuovo percorso condiviso `flyerAssets/{areaId}/{fileName}`;
  - lettura per DNS Admin, `flyer.read` o `flyer.write` di area/rete;
  - scrittura/cancellazione per DNS Admin o `flyer.write` di area/rete;
  - grant solo `organization` deliberatamente ignorato e negato;
  - date allineate alla semantica `timestamp.value` di Firestore, inclusi offset RFC3339;
  - percorso legacy rimosso e negato dal default-deny, anche per Admin.
- `firestore.rules`
  - `validFlyerAsset` lega `storagePath` allo `scopeId` e accetta solo il nuovo percorso JPEG.
- `tests/flyer-storage-rules.test.mjs`
  - nuova suite completa per condivisione per area, rete, date, isolamento, rimozione legacy e validazione upload.
- `scripts/audit-flyer-assets-rollout.mjs`
  - audit produttivo di sola lettura da eseguire manualmente.
- `.github/workflows/*`
  - nessuna modifica.

## 3. Test ed esito

Scenari definiti nella suite emulator:

1. writer area A: carica, elenca, legge e cancella;
2. reader area A: legge il file del writer, ma non crea, sovrascrive o cancella;
3. secondo writer area A: carica e legge il file del primo writer;
4. nuovo UID sostitutivo: legge e cancella il file caricato dal vecchio UID;
5. account area B: accesso ad area A negato;
6. grant solo organization: negato;
7. grant di rete read/write: comportamento coerente con il permesso;
8. profilo inattivo, grant disattivato/scaduto/futuro/malformato/assente: negati;
9. data RFC3339 con offset: stesso esito positivo in Storage e Firestore;
10. Admin: accesso completo;
11. anonimo e percorsi non previsti: negati;
12. PNG, estensione errata, file vuoto, oltre 12 MB e nome troppo lungo: negati;
13. percorso legacy: rimosso e negato sia agli account di area sia ad Admin;
14. metadati Firestore: percorso della stessa area accettato, area diversa e percorso legacy negati.

Esito CI sul commit candidato: **14/14 PASS** nella suite Storage/Firestore Emulator. Anche le regressioni Firestore generali e gli altri cinque workflow attivati dal PR sono PASS. Il job di deploy è stato correttamente saltato perché l’evento è una pull request. Le date malformate generano un errore di parsing interno nell’emulatore e vengono negate, coerentemente con il comportamento fail-closed di Firestore.

## 4. NON TESTATO

- Client Flyer Studio con il nuovo percorso: non modificato né distribuito in questo PR.
- Rollout produttivo e compatibilità con oggetti reali: non eseguiti.
- Accesso reale di account Area: non testato perché non esistono ancora grant Flyer in produzione.

## 5. Assunzioni

- Gli ID di reporting area sono slug amministrati e non contengono `/`.
- `flyer.write` implica anche la possibilità di leggere e usare la libreria dell’area.
- Il grant di rete usa `scopeType=network` e `scopeId=dolomiti-nordicski`.
- Il bucket vuoto consente di rimuovere il percorso legacy senza migrazione dati.

## 6. Decisioni aperte dell’amministratore

1. Scegliere il rollout senza interruzione. Il candidato finale rimuove il vecchio percorso:
   - regole finali prima del client: il client attuale non riesce più a caricare;
   - client nuovo prima delle regole: il nuovo percorso viene negato dalle regole oggi in produzione;
   - sequenza sicura: regole transitorie che accettano entrambi i percorsi, aggiornamento client, poi regole finali che rimuovono il vecchio percorso. Non serve migrazione perché il bucket è vuoto.

## 7. Azioni eseguite in produzione

**Nessuna modifica.** È stato eseguito soltanto l’audit autorizzato di sola lettura; nessun dato, grant, oggetto, regola o configurazione è stato modificato.

## Fuori scope verificato

- `organizationToolAccess` non viene consultato da Storage; i privilegi Storage derivano esclusivamente da profilo attivo, ruolo Admin e `accessGrants`. La differenza è intenzionale e documentata nelle regole.
- Data Entry dispone già di protezione contro modifiche concorrenti per i quattro formulari principali: `src/services/seasonalPersistence.ts` usa transazioni e `expectedRevision` per Prezzi/Vendite; `src/features/track-quality/trackQualityPersistence.ts` applica lo stesso controllo alla Qualitätskontrolle; `src/services/kp.ts` lo applica ai KP. Non è stata apportata alcuna modifica.
