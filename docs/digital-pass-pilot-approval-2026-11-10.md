# DNS Digital Pass — interventi da autorizzare per il primo pilot

Preparazione, non autorizzazione di rilascio. Nessun comando in questa pagina è stato eseguito.
Dipendenza: Shared Data #276 (Data Entry ufficiale) deve essere integrata prima di questa PR.
Workspace #63–66 e Shared Data #274–275 sono già integrate.

## 1. IAM del solo runtime
SA: dns-digital-pass-runtime@dns-core.iam.gserviceaccount.com.
Conservare l'attuale Cloud Datastore User condizionato a projects/dns-core/databases/(default) e Secret Accessor sul solo DNS_PASS_HMAC_KEY.
Aggiungere esclusivamente il ruolo custom qui definito, con un solo permesso firebaseauth.users.get:

```sh
gcloud iam roles create DNSDigitalPassAuthReader --project=dns-core --file=docs/proposals/digital-pass-auth-reader.yaml
gcloud projects add-iam-policy-binding dns-core --member=serviceAccount:dns-digital-pass-runtime@dns-core.iam.gserviceaccount.com --role=projects/dns-core/roles/DNSDigitalPassAuthReader --condition=None
```

Se il ruolo esiste già, leggerlo e confrontarlo; non sovrascriverlo né ampliare automaticamente altri ruoli.
Non aggiungere Editor, Owner, Firebase Auth Admin, chiavi o Token Creator al runtime.
Il deployer userà la credenziale DNS Core già esistente: nessun ampliamento IAM del deployer è incluso. Eventuali permessi mancanti vanno mostrati separatamente prima di modificarli.

Il browser deve raggiungere l'endpoint HTTPS: il deploy della funzione prevede invocazione infrastrutturale pubblica del solo servizio digitalpassapi. Le operazioni restano protette da Firebase Auth, organizzazione, numero, operatore e scadenza. Non autorizzare allUsers a livello di progetto o su altri servizi.

## 2. Nessuna modifica dell'inventario
Usare la modalità data-entry della #276, con lettura diretta di orderFormConfigs, orderCatalogItems, ticketOrders, ticketOrderLines e organizations in DNS Core.
Nessuna importazione o copia in passInventorySnapshots, nessuna modifica alle quantità o ai numeri reali.

Prima del rilascio eseguire il preview di sola lettura con l'inizio effettivo della stampa; fissare la revisione risultante. Non assumere 1. La revisione deve corrispondere alla tessera fisica scelta. Una variazione che rinumera la matrice blocca le nuove attivazioni.

## 3. Segreto HMAC
Riutilizzare DNS_PASS_HMAC_KEY esistente. Non creare, ruotare o stampare la chiave.
La versione attiva e l'accesso effettivo restano da ricontrollare immediatamente prima del deploy. Un eventuale valore troppo corto/non valido richiede una proposta distinta: questo pacchetto non autorizza la sua sostituzione.

## 4. Environment di rilascio
Creare/configurare l'environment GitHub dns-digital-pass-pilot con revisore DNS e limitazione al ramo main.
Usare FIREBASE_SERVICE_ACCOUNT_DNS_CORE già disponibile al repository, senza copiare chiavi nel codice o nel bundle pubblico.

Secret di configurazione del solo environment:
- DNS_PASS_PILOT_ORGANIZATION_ID
- DNS_PASS_PILOT_PASS_NUMBER
- DNS_PASS_PILOT_OPERATOR_UID

Variabili del solo environment:
- DNS_PASS_DEPLOY_APPROVED=true, solo dopo l'approvazione esplicita
- DNS_PASS_PRIVACY_REVIEWED=true, solo con informativa Digital Pass approvata
- DNS_PASS_PILOT_UNTIL, scadenza esplicita con fuso orario, massimo quattro ore
- DNS_PASS_DATA_ENTRY_START_NUMBER, inizio della stampa effettiva
- DNS_PASS_INVENTORY_REVISION, risultato del preview Data Entry
- DNS_PASS_PRIVACY_NOTICE_VERSION, versione approvata nel formato dns-digital-pass-2026-27-...
- DNS_PASS_PRIVACY_URL, URL HTTPS dell'informativa approvata senza credenziali/query/fragment

Non pubblicare numero, uid o dati cliente in PR o artefatti. I valori per la sessione vanno inseriti solo dopo scelta della tessera e dell'operatore.

## 5. Merge e deploy esatti
Dopo CI verde e formula AUTORIZZO DEPLOY PR #... riferita alle PR:
1. Integrare #276 e questa PR operativa.
2. Eseguire manualmente il workflow DNS Digital Pass limited pilot, confirm_target=dns-core/digitalPassApi, phase=verify.
3. Il workflow prepara un pacchetto temporaneo che esporta soltanto digitalPassApi, con dipendenze bloccate. Regione europe-west8; runtime dedicato; massimo una istanza. Nessun export Polls.
4. Il solo comando di deploy è:
```sh
node tools/digital-pass-e2e/node_modules/firebase-tools/lib/bin/firebase.js deploy --config .digital-pass-real-pilot/firebase.json --only functions:digital-pass:digitalPassApi --project dns-core --non-interactive
```
5. phase=verify lascia sia SALE_CLAIM sia REGISTRATION false e mantiene il perimetro server. Verificare identità runtime, CORS, origine estranea 403 e claim/complete anonimi 503.
6. Solo con readiness completata: avviare lo stesso workflow con phase=activate, entro la finestra approvata. Abilita entrambi i flag esclusivamente per la tessera, organizzazione e operatore scelti. Le richieste anonime devono risultare 401.
7. Non eseguire deploy delle rules, Storage, dell'intero codebase o di altri tool.

Il workflow non modifica IAM né inventario e si arresta se il controllo IAM fallisce. Richiede i controlli sintetici verdi sullo stesso commit prima di usare le credenziali di deploy.

## 6. Workspace
Integrare la PR che corregge il link privacy prima della raccolta email. Configurare solo:
- DNS_PASS_PILOT_APPROVED=true
- DNS_PASS_API_BASE=https://europe-west8-dns-core.cloudfunctions.net/digitalPassApi, dopo verifica dell'endpoint effettivamente distribuito
- DNS_PASS_PRIVACY_URL, stessa informativa approvata

Pubblicare manualmente Pages con digital_pass_pilot=true. Nessun HMAC o dato dell'operatore nel frontend.
I deploy ordinari disabilitano il pilot. La pagina pass.html resta separata dal Workspace e riusa l'Auth cliente; l'operatore usa identityAuth.currentUser senza secondo login.

## 7. Privacy, audit e backup
Il link attuale /de/privacy è stato letto: parla di consenso/firma grafica per comunicazioni, non descrive questo servizio. Non certificarlo come informativa Digital Pass. Serve un testo/versione approvato dal titolare prima di impostare PRIVACY_REVIEWED.

Data Access audit Firestore era disattivato nell'ultimo controllo. Proposta distinta da autorizzare: abilitare DATA_READ e DATA_WRITE per il solo servizio datastore.googleapis.com, senza esenzioni per il runtime; non modificare le configurazioni degli altri servizi. Questo può generare costi di logging e copre il database, non soltanto le collezioni del pass.
Confermare anche gli eventi applicativi passAuditEvents durante il test.
Backup giornalieri risultavano attivi con sette giorni di conservazione: verificare un backup recente READY; non attivare/disattivare PITR né eseguire restore in questo pacchetto.

## 8. Test smartphone ed esito stagionale
Prima: test sintetici CI per Data Entry, QR, email-link, claim/status/registrazione, scope, replay, concorrenza e scadenza.
Poi, nella finestra autorizzata: singola tessera autentica, operatore selezionato, smartphone con email reale del cliente; conferma Workspace SOLD_ATTESTED; registrazione facoltativa; credenziale unica; prova retry e rigetto di altro numero/operatore.
Invio email e operazioni sulla tessera reale avvengono solo dopo questa approvazione e attivazione.

Brevo e Wallet restano disabilitati. Nessun consenso marketing implicito.
Date ufficiali: 2026-11-15T00:00:00+01:00 → 2027-05-01T00:00:00+02:00.
Il 10 novembre si può collaudare emissione e conferma, ma il controllo del pass deve restituire non valido prima stagione (nel codice attuale EXPIRED). Non alterare le date per ottenere VALID.

## 9. Arresto
A scadenza il server blocca automaticamente le attivazioni per il limite di quattro ore.
phase=stop disabilita entrambi i flag, mantenendo PILOT_ENABLED=true. Non togliere il limite per arrestare il servizio.
Disabilitare il flag frontend e ripubblicare Pages dopo autorizzazione. Non cancellare vendite, credenziali o audit. Revoca di una credenziale è un'azione distinta da approvare.

## Stato ancora necessario
Tessera fisica, operatore e ora d'inizio sono da scegliere con il titolare; da questi si recuperano e verificano organizzazione/uid/revisione. Cloud Shell chiede una nuova autorizzazione dell'account prima delle letture complete: non è stata concessa dall'agente.
Finché questi controlli e l'informativa non sono completati, non autorizzare un'attivazione generica.
