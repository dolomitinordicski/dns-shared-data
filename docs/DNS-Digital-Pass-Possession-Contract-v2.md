# Digital Pass: associazione della tessera fisica esistente

Questo contratto sostituisce, per il percorso Digital Pass, la terminologia di vendita del contratto v1. Nessuna vendita, incasso o aggiornamento delle statistiche commerciali viene eseguito dal Digital Pass. Le date ufficiali della stagione rimangono invariate.

## Percorso

1. L'operatore usa la sessione Workspace esistente, verifica fisicamente la tessera stagionale originale presentata dal titolare e inserisce il numero. Non basta conoscere un numero dell'inventario.
2. Il backend risolve il numero esclusivamente nell'inventario ufficiale Data Entry con revisione fissata, verifica organizzazione, membership e permessi `passActivation.issue` e `passPossession.attest`. Genera il codice monouso e conserva soltanto il verificatore HMAC. La preparazione scade dopo dieci minuti.
3. Il titolare scansiona il QR operatore e verifica la propria email mediante Firebase email-link. L'email prova il controllo della casella, non un'identità anagrafica certificata. Codice e tessera fisica verificata dall'operatore costituiscono la prova di possesso.
4. Il claim autenticato controlla codice, scadenza, revisione inventario e organizzazione; registra `POSSESSION_CONFIRMED` e vincola il claim all'UID. L'associazione successiva è transazionale e impedisce altri titolari o duplicati. Il codice non deve essere condiviso o mostrato prima della verifica fisica.
5. La Web App richiede `/v1/me/digital-pass/presentation` autenticato. Ottiene un token casuale opaco di 90 secondi, privo di dati personali. Lo aggiorna ogni 45 secondi e nasconde il QR scaduto/offline. `/p/<token>` verifica scadenza della presentazione, stato credenziale/registrazione e validità stagionale. Le copie statiche non sono presentazioni dinamiche valide. I percorsi v1 restano soltanto per compatibilità tecnica, non per la nuova Web App.
6. Revoca e riemissione restano autorizzate e tracciate. La riemissione non può riassociare una tessera già registrata.

## Perimetro e dati

Il pilot applica una tessera autentica, un'organizzazione, un operatore e massimo quattro ore. Nessun dato sintetico in produzione. `passQrPresentations` contiene solo hash del token come ID, riferimento interno alla credenziale e orari; accesso client negato dalle Rules esistenti. Non cambiare Rules in questa PR. Predisporre retention/cleanup delle presentazioni scadute prima dell'estensione oltre il pilot; il TTL non è stato configurato nel cloud da questa PR.

La verifica pubblica mostra soltanto stato. URL/token non vanno registrati in analytics, log applicativi o referrer. Un QR temporaneo può essere copiato durante i suoi 90 secondi: riduce il riuso di screenshot, non prova da solo l'identità visiva del titolare.

## Configurazione e migrazione

La nuova configurazione è `DNS_PASS_POSSESSION_CLAIM_ENABLED`. Il vecchio flag di vendita non abilita il nuovo claim. Preparare e approvare esplicitamente il grant `passPossession.attest` per l'unico operatore pilota; nessuna modifica ai grant reali è effettuata da questa PR. Nessun fallback al vecchio permesso di vendita.

Non reinterpretare automaticamente eventuali record storici `saleAttestedAt` come verifiche del possesso. Prima di ACTIVATE verificare in sola lettura l'eventuale presenza di record storici e predisporre una migrazione separata se necessaria. VERIFY e STOP non leggono questi dati.

Brevo, consensi, outbox e segreti marketing sono mantenuti. Nessuna richiesta marketing deriva dall'associazione della tessera. Apple/Google Wallet restano facoltativi e disabilitati nel pilot.

## Collaudo necessario

Prima del pilot: CI completa, VERIFY cloud autorizzato e superato, revisione della corrispondenza con la stampa Data Entry, informativa, grant reali e finestra. Dopo autorizzazione ACTIVATE: una tessera fisica reale, operatore verificante, email-link su smartphone, claim e associazione univoca, QR aggiornato, rifiuto QR scaduto e secondo titolare, verifica periodo ufficiale e chiusura. Nessuna dichiarazione di funzionamento reale prima di questo percorso completo.
