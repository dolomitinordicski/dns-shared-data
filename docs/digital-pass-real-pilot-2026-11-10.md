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

### Verifica cloud non completata
Le console Firebase e Google Cloud bloccano l'account info@dolomitinordicski.com richiedendo l'autenticazione a due fattori. Non sono stati verificati progetti effettivi, funzione distribuita, endpoint, regione reale, IAM, accesso al segreto, parametri effettivi, Auth, inventario Firestore, rules, backup o audit. Le impostazioni nel codice e i vecchi report staging non costituiscono evidenza dello stato cloud attuale. Lo sblocco dell'account resta un'azione personale del titolare.

## Correzioni proposte
1. Separare DNS_PASS_SALE_CLAIM_ENABLED da DNS_PASS_REGISTRATION_ENABLED. Il primo permette la conferma vendita con email verificata anche quando non si emette alcun Digital Pass. Il valore vuoto conserva la compatibilità con il vecchio interruttore.
2. Aggiungere un limite server, opzionale, a una sola organizzazione, tessera e identità operatore, con scadenza massima di quattro ore. Vale anche per gli amministratori sulle operazioni di attivazione. Blocca prepare, claim, status, validate, complete e reissue alla scadenza; non impedisce letture del titolare e controlli ordinari. La revoca amministrativa resta disponibile per la tessera selezionata anche dopo la scadenza.
3. Aggiungere test locali e il percorso QR automatico completo agli scenari HTTP degli emulatori. Questi test sono sintetici e non sostituiscono il collaudo smartphone.

Il limite server è disattivato per impostazione predefinita, così come le nuove registrazioni. Questa PR da sola non configura una sessione di collaudo.

## Ambiente da scegliere
Lo staging C3.1 attuale è privato e accetta esclusivamente progetti, inventari e organizzazioni sintetici. Non allentare questi vincoli per collegarlo a una tessera reale o all'Auth reale di Workspace.
La candidata per un collaudo reale è una finestra strettamente controllata in DNS Core, soltanto dopo averne verificato lo stato e ottenuto l'autorizzazione specifica.

## Dati da definire e verifiche obbligatorie
Dopo lo sblocco delle console, in sola lettura:
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
Prima apertura PR: 28 test locali superati (attivazione, gate registrazione, pilot, staging e nuova finestra controllata), con database in memoria. La CI esegue anche Auth/Functions/Firestore Emulator e i nuovi scenari claim/status; il suo risultato va verificato sul commit finale. Nessuna prova cloud o smartphone reale eseguita.
