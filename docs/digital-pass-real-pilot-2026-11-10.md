# Collaudo reale controllato — 10 novembre 2026

## Esito prima dell'autorizzazione
**NO-GO per una tessera reale finché non sono completate le verifiche cloud e autorizzati i cambiamenti.** Questa PR prepara il software; non distribuisce funzioni, non importa inventario e non abilita il servizio.

### Evidenze verificate in GitHub
- Workspace #61 e #62 e Shared Data #273 risultano integrate.
- Workspace #63 è aperta; i controlli sul commit 6962b439e75aa86c4d333d6945085e074889f15b erano verdi durante l'audit.
- Baseline Shared Data: 516d3572274e7c4367fc04cdff7fa1c661bc61eb; baseline Workspace: 63c3af39b6e7ab9a5f3c5b12b47761096bb81f66.
- Workspace riusa identityAuth.currentUser per prepare/status. Non serve un secondo login operatore.
- Backend richiede users.active, membership attiva e grant organizzativo attivo con passActivation.issue + passSale.attest, salvo amministratore DNS. Il semplice accesso a Workspace non basta.
- Il percorso QR usa prepare -> claim con email verificata -> status SOLD_ATTESTED. complete è successivo e facoltativo.
- La configurazione Pages attuale su main non inietta le variabili Digital Pass. Una pubblicazione riuscita non dimostra un collegamento operativo al backend.
- L'inventario canonico in repository è approved:false e reviewOnly:true. Non è un inventario approvato da importare automaticamente.

### Verifica cloud effettiva, completata dopo lo sblocco
Audit in sola lettura il 10 novembre 2026:
- DNS Core esiste, progetto dns-core, numero 387653285986, piano Blaze. L'account iniziale non aveva accesso al progetto; l'altro account DNS già collegato ha consentito la verifica. Non sono state accettate nuove condizioni né cambiate autorizzazioni.
- Firebase Functions elenca una sola funzione, dnsWorkspaceAccess, in europe-west8. Cloud Run conferma il solo servizio dnsworkspaceaccess. **digitalPassApi non è distribuita su DNS Core**: non esistono parametri runtime o endpoint Digital Pass distribuiti da verificare.
- Tra i progetti visibili al medesimo account non compare un progetto dns-pass-staging-*. Questo non prova l'assenza di ambienti non accessibili all'account.
- Firestore (default) è Standard, modalità nativa, europe-west8. Nell'elenco delle collezioni non compaiono passInventorySnapshots né le collezioni operative Digital Pass: manca uno snapshot ufficiale disponibile al backend in questa banca dati.
- Le regole attive sono datate 6 novembre 2026, 11:56 nell'interfaccia. Il testo pubblicato non contiene sezioni Digital Pass e termina con match /{document=**} e allow read, write: if false. Non è stato eseguito un audit generale completo delle rules; non sono state modificate.
- Firebase Auth: provider email/password e Google attivi; email-link senza password già abilitato. dolomitinordicski.github.io è già un dominio autorizzato, insieme ai domini Firebase e localhost. Nessuna email reale inviata.
- Il service account dns-digital-pass-runtime@dns-core.iam.gserviceaccount.com esiste, è attivo e non ha chiavi utente. Nella policy IAM visibile ha Cloud Datastore User con condizione DNSDigitalPassDefaultDB. Non compare un ruolo di lettura Firebase Auth per quel principale: il permesso firebaseauth.users.get richiesto dal controllo token revocati resta da concedere/validare prima del deploy. Il test effettivo sotto questa identità non è stato eseguito.
- Secret Manager: DNS_PASS_HMAC_KEY esiste; versione 1 attiva. Il runtime dedicato ha Secret Manager Secret Accessor direttamente sul segreto. Il valore e la lunghezza non sono stati letti; non si può certificare la qualità della chiave dal solo metadato.
- Backup pianificati attivi: conservazione giornaliera sette giorni, nessuna conservazione settimanale indicata; PITR disattivato. Non è stato eseguito un ripristino né verificato il contenuto di un backup.
- Audit GCP: configurazione predefinita Data Access disattivata; anche per Firestore/Datastore API risultano deselezionati Admin Read, Data Read e Data Write. Questo riguarda Data Access, non equivale all'assenza di ogni log amministrativo. Nessun evento applicativo Digital Pass reale verificabile in assenza del backend.
- Nella collezione accessGrants il campione aperto ha scope reportingArea e permessi degli altri tool, non i grant organization richiesti dal pass. Non attribuire implicitamente permessi Digital Pass agli operatori; l'operatore concreto del collaudo non è ancora selezionato.
- La pagina pubblicata pass.html è raggiungibile e mostra “L'attivazione del Digital Pass sarà disponibile prossimamente”. Non è stato verificato un collegamento frontend–backend funzionante.

Riferimenti per il controllo Auth: [SDK e revoca sessioni](https://firebase.google.com/docs/auth/admin/manage-sessions), [permessi Firebase Auth](https://docs.cloud.google.com/iam/docs/roles-permissions/firebaseauth). Dalla policy letta e dall'uso di verifyIdToken(token,true) si deduce il blocco di autorizzazione da risolvere; non disabilitare il controllo di revoca per aggirarlo.

## Correzioni proposte
1. Separare DNS_PASS_SALE_CLAIM_ENABLED da DNS_PASS_REGISTRATION_ENABLED. Il primo permette la conferma vendita con email verificata anche quando non si emette alcun Digital Pass. Il valore vuoto conserva la compatibilità con il vecchio interruttore.
2. Aggiungere un limite server, opzionale, a una sola organizzazione, tessera e identità operatore, con scadenza massima di quattro ore. Vale anche per gli amministratori sulle operazioni di attivazione. Blocca prepare, claim, status, validate, complete e reissue alla scadenza; non impedisce letture del titolare e controlli ordinari. La revoca amministrativa resta disponibile per la tessera selezionata anche dopo la scadenza.
3. Aggiungere test locali e il percorso QR automatico completo agli scenari HTTP degli emulatori. Questi test sono sintetici e non sostituiscono il collaudo smartphone.

Il limite server è disattivato per impostazione predefinita, così come le nuove registrazioni. Questa PR da sola non configura una sessione di collaudo.

## Ambiente da scegliere
Lo staging C3.1 attuale è privato e accetta esclusivamente progetti, inventari e organizzazioni sintetici. Non allentare questi vincoli per collegarlo a una tessera reale o all'Auth reale di Workspace.
La candidata per un collaudo reale è una finestra strettamente controllata in DNS Core, soltanto dopo averne verificato lo stato e ottenuto l'autorizzazione specifica.

## Dati da definire e verifiche obbligatorie
Prima del rilascio, completare/ricontrollare in sola lettura le condizioni seguenti, utilizzando le evidenze sopra senza duplicare configurazioni già presenti:
- verificare progetto DNS Core, Auth con email-link, domini autorizzati e ritorno da smartphone;
- verificare che digitalPassApi sia Functions v2, regione effettiva, URL e impostazioni del runtime; il codice propone europe-west8 e dns-digital-pass-runtime@dns-core.iam.gserviceaccount.com;
- verificare che il service account dedicato possa eseguire le sole operazioni necessarie, incluso il controllo dei token revocati, e leggere la specifica versione del segreto HMAC; non leggere o pubblicare il valore del segreto;
- verificare CORS per l'origine effettiva di Workspace, privacy pubblicata e versione dell'informativa;
- leggere rules Firestore, backup disponibili e audit; il client non deve scrivere direttamente nelle collezioni del pass;
- verificare lo snapshot ufficiale approvato, revision, stagione 2026-27, prodotto sk-dns, assenza di numerazioni ambigue e assegnazione della singola tessera all'organizzazione;
- verificare uid dell'operatore esistente, profilo, membership, date di validità e grant della sua organizzazione.

Non pubblicare numeri reali, email del cliente, uid operatore, QR, codici o segreti in questa PR o negli artefatti CI. Non importare il file review come inventario ufficiale.

## Configurazione proposta, da autorizzare
Definire una sola tessera e organizzazione, un operatore e una scadenza esplicita con fuso orario, non oltre quattro ore dall'attivazione:
- DNS_PASS_PILOT_ENABLED=true
- DNS_PASS_PILOT_ORGANIZATION_ID: organizzazione verificata
- DNS_PASS_PILOT_PASS_NUMBER: singola numerazione verificata
- DNS_PASS_PILOT_OPERATOR_UID: utente Workspace verificato
- DNS_PASS_PILOT_UNTIL: scadenza della sessione con fuso orario
- DNS_PASS_SALE_CLAIM_ENABLED=true
- DNS_PASS_REGISTRATION_ENABLED=false per la sola conferma vendita; true solo se si autorizza anche la registrazione facoltativa durante quella finestra.

Servono inoltre i parametri ordinari verificati: HMAC, origins, inventory revision, privacy notice version e validità stagionale. Gli URL del frontend sono VITE_DNS_DIGITAL_PASS_API_BASE, VITE_DNS_PASS_ACTIVATION_ENABLED e VITE_DNS_DIGITAL_PASS_PRIVACY_URL; Workspace #63 li controlla tramite le variabili DNS_PASS_API_BASE, DNS_PASS_PILOT_APPROVED e DNS_PASS_PRIVACY_URL con avvio manuale digital_pass_pilot=true. Il gate frontend non sostituisce il limite backend.

**Data di validità:** il codice usa 15 novembre 2026 come inizio stagione. Il 10 novembre la conferma vendita può essere collaudata, ma una credenziale con queste date risulterà EXPIRED prima dell'inizio stagione. Non modificare in silenzio le date ufficiali. Un esito VALID oggi richiede una decisione esplicita sulla validità del collaudo oppure un test sintetico separato.

## Sequenza di rilascio proposta, non eseguita
1. Completare audit cloud, scegliere i valori del collaudo e verificare CI delle PR.
2. Ottenere la formula AUTORIZZO DEPLOY PR #... riferita alle PR e al perimetro concreto. IAM, segreti, rules o inventario richiedono approvazione esplicita del cambiamento specifico.
3. Solo dopo autorizzazione: integrare la PR backend e Workspace #63 e distribuire esclusivamente functions:digitalPassApi. L'entrypoint esporta anche Polls: non distribuire l'intero codebase indiscriminatamente.
4. Configurare la finestra limitata, verificare il backend e pubblicare Pages manualmente con il gate pilot.
5. Eseguire una singola prova assistita e registrare solo risultati senza dati personali.

## Collaudo con operatore e smartphone
- Operatore già autenticato: numero selezionato -> QR, nessun secondo login.
- Cliente: scansione -> email-link -> verifica email; anche apertura link su altro dispositivo con reinserimento email.
- Workspace mostra conferma solo quando il server risponde SOLD_ATTESTED.
- Prima di complete, nessuna credenziale digitale e nessun consenso marketing.
- Se autorizzato: cliente sceglie la registrazione facoltativa; un solo pass, retry idempotente e replay da altro titolare respinto.
- Marketing resta separato, facoltativo e non preselezionato; Brevo e Wallet non sono prerequisiti.
- Provare numero estraneo, altro operatore, codice errato/scaduto, ritorno dal link, privacy, cessazione della finestra e assenza di dati personali nei log.
- Non attestare automaticamente VALID prima dell'inizio stagionale.

## Arresto e rollback
Prima di rimuovere il limite pilot, disabilitare **sia** saleClaim **sia** registration. Lasciare attivo il limite scaduto mantiene chiuse le operazioni di attivazione. Impostare solo PILOT_ENABLED=false mentre i due flag sono true ripristinerebbe il comportamento generale: non è un arresto sicuro.
Disabilitare il gate Pages e ripubblicare solo previa autorizzazione. Conservare vendita, audit e credenziali già emesse; non cancellare dati reali. Eventuale revoca della singola credenziale è un'operazione autorizzata distinta.

## Validazione
28 test locali superati con database in memoria. Sul commit di codice 30a1290c4502f002d697a53368c6d92386a97986, tutti gli otto check Shared Data sono verdi: domain, emulator Firestore, qr-renderer, HTTP E2E ripetuto tre volte, staging-emulator e autorizzazioni Polls. Domain: 89 pass, 5 skip riservati agli emulatori, zero failure. Le tre esecuzioni HTTP e lo staging includono ora claim/status con verifica email e registrazione successiva facoltativa.
Workspace #63 sul commit 494aae45ef3aa61f133160e69217e063eb5eacdc: tutti i cinque controlli eseguiti verdi, deploy/update saltati.
Questo aggiornamento successivo modifica solo la documentazione. Nessuna prova smartphone reale o invocazione con tessera reale; nessun merge/deploy eseguito.
