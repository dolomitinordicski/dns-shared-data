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

### Audit produttivo preparato, non eseguito

`scripts/audit-flyer-assets-rollout.mjs` è esclusivamente di lettura e produce:

- il numero di oggetti sotto `flyerAssets/`;
- gli `scopeType`/`scopeId` che hanno grant con `flyer.read` o `flyer.write`, aggregati senza esportare UID.

Esecuzione prevista dall’amministratore:

```text
node scripts/audit-flyer-assets-rollout.mjs --project dns-core --bucket dns-core.firebasestorage.app
```

Lo script usa Application Default Credentials dell’operatore e non contiene token o segreti.

## 2. Modifiche fatte, file per file

- `storage.rules`
  - nuovo percorso condiviso `flyerAssets/{areaId}/{fileName}`;
  - lettura per DNS Admin, `flyer.read` o `flyer.write` di area/rete;
  - scrittura/cancellazione per DNS Admin o `flyer.write` di area/rete;
  - grant solo `organization` deliberatamente ignorato e negato;
  - date allineate alla semantica `timestamp.value` di Firestore, inclusi offset RFC3339;
  - percorso legacy mantenuto come variante prudenziale: lettura al proprietario con permesso valido o Admin; scrittura solo Admin.
- `firestore.rules`
  - `validFlyerAsset` lega `storagePath` allo `scopeId` e accetta solo il nuovo percorso JPEG.
- `tests/flyer-storage-rules.test.mjs`
  - nuova suite completa per condivisione per area, rete, date, isolamento, legacy e validazione upload.
- `scripts/audit-flyer-assets-rollout.mjs`
  - audit produttivo di sola lettura da eseguire manualmente.
- `scripts/migrate-flyer-assets-to-area.mjs`
  - migrazione copy-only; modalità predefinita dry-run, copia solo con `--apply`, non cancella sorgenti e blocca le collisioni.
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
13. percorso legacy: proprietario in sola lettura, altri account di area negati, scrittura riservata ad Admin;
14. metadati Firestore: percorso della stessa area accettato, area diversa e percorso legacy negati.

Esito locale: in attesa dell’esecuzione CI, perché l’installazione emulator locale è stata bloccata da un errore filesystem Windows durante l’installazione delle dipendenze. Il PR deve restare draft finché il workflow GitHub non conferma l’esito.

## 4. NON TESTATO

- Conteggio reale degli oggetti in `dns-core.firebasestorage.app`: lo script è preparato ma non è stato eseguito, per rispettare il divieto di interrogare la produzione.
- Scope reali dei grant Flyer: non interrogati; devono essere ottenuti dall’amministratore con lo script di sola lettura.
- Migrazione reale: non eseguita; lo script resta dry-run e richiede `--apply` esplicito.
- Client Flyer Studio con il nuovo percorso: non modificato né distribuito in questo PR.
- Rollout produttivo e compatibilità con oggetti reali: non eseguiti.
- Collisioni reali di nomi fra vecchie cartelle UID: non note finché non viene eseguito il dry-run della migrazione.

## 5. Assunzioni

- Gli ID di reporting area sono slug amministrati e non contengono `/`.
- `flyer.write` implica anche la possibilità di leggere e usare la libreria dell’area.
- Il grant di rete usa `scopeType=network` e `scopeId=dolomiti-nordicski`.
- Il percorso legacy resta temporaneamente disponibile per lettura/migrazione finché l’audit non dimostra che è vuoto.
- La migrazione copia senza eliminare; l’eliminazione dei sorgenti richiederà una decisione successiva.

## 6. Decisioni aperte dell’amministratore

1. Eseguire lo script di audit e comunicare `flyerAssetObjectCount` e `flyerPermissionScopes`.
2. Se il conteggio è zero, rimuovere completamente il match legacy; se è maggiore di zero, mantenerlo durante la migrazione.
3. Scegliere il rollout senza interruzione. Il candidato finale rende il vecchio percorso non scrivibile dagli account di area:
   - regole finali prima del client: il client attuale non riesce più a caricare;
   - client nuovo prima delle regole: il nuovo percorso viene negato dalle regole oggi in produzione;
   - sequenza sicura: regole transitorie che accettano entrambi i percorsi, aggiornamento client, migrazione, poi regole finali che bloccano/rimuovono il vecchio percorso.
4. Decidere se la scrittura Admin sul percorso legacy deve restare durante la migrazione o essere negata a tutti.

## 7. Azioni eseguite in produzione

**Nessuna.**

## Fuori scope verificato

- `organizationToolAccess` non viene consultato da Storage; i privilegi Storage derivano esclusivamente da profilo attivo, ruolo Admin e `accessGrants`. La differenza è intenzionale e documentata nelle regole.
- Data Entry dispone già di protezione contro modifiche concorrenti per i quattro formulari principali: `src/services/seasonalPersistence.ts` usa transazioni e `expectedRevision` per Prezzi/Vendite; `src/features/track-quality/trackQualityPersistence.ts` applica lo stesso controllo alla Qualitätskontrolle; `src/services/kp.ts` lo applica ai KP. Non è stata apportata alcuna modifica.
