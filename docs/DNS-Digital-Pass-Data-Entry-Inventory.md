# Digital Pass — Data Entry è l'inventario ufficiale

## Fonte e collegamento
Le numerazioni ufficiali sono quelle calcolate da Data Entry a partire dagli ordini salvati in DNS Core. Non occorre costruire un secondo inventario o approvare nuovamente le assegnazioni.

Con DNS_PASS_INVENTORY_SOURCE=data-entry, digitalPassApi legge direttamente:
- orderFormConfigs/2026-27-ticket: elenco completo e ordine delle organizzazioni e degli articoli;
- orderCatalogItems: codice prodotto e displayOrder;
- ticketOrders e ticketOrderLines: quantità salvate per ciascuna organizzazione/articolo;
- organizations: esistenza degli identificativi canonici, senza tradurre nomi o assegnare un'area ad un'associazione per somiglianza di etichetta.

Una transazione di sola lettura ricostruisce la stessa sequenza di Data Entry: articoli per displayOrder, poi organizzazioni nell'ordine del modulo. Tutti i prodotti partecipano al conteggio, anche quelli non attivabili nel pilot. Solo sk-dns, stagione 2026-27, può essere attivato.

Non legge quantità di vendita da ticketSales, bozze del browser, file review del repository o JSON inviati dal cliente. Ordini e numerazioni non attestano una vendita.

## Protezione delle tessere già stampate
Il numero iniziale deve essere quello effettivamente usato per la stampa e mostrato in Data Entry. Oggi è stato locale al componente e, quando pubblicata, è conservato anche nella condivisione Data Entry: non inventare un nuovo inizio e non presumere automaticamente 1.

Il backend calcola una revisione deterministica dai numeri, prodotti e assegnazioni. La configurazione del servizio deve indicare questa stessa revisione. Una modifica alle quantità/ordine/inizio che cambia le numerazioni blocca nuove attivazioni invece di riassegnare tessere stampate. Variazioni a nomi, prezzi o timestamp non cambiano la revisione.

Questo controllo è un vincolo tecnico sulla versione stampata, non un nuovo inventario né un secondo iter di approvazione. Dopo cambiamenti reali bisogna riconciliare la stampa prima di cambiare la revisione configurata. Non aggiornare automaticamente la revisione durante un ordine o una richiesta cliente.

## Configurazione da predisporre prima del rilascio
- DNS_PASS_INVENTORY_SOURCE=data-entry
- DNS_PASS_DATA_ENTRY_START_NUMBER: inizio ufficiale della numerazione stampata
- DNS_PASS_INVENTORY_REVISION: revisione restituita dal controllo di sola lettura
- mantenere il limite pilot su singola tessera/organizzazione/operatore e scadenza, oltre agli interruttori separati di conferma vendita e registrazione.

Il controllo di sola lettura, con credenziali amministrative già autorizzate e dipendenze server installate, è:

```sh
node scripts/preview-digital-pass-data-entry.mjs --project dns-core --start-number NUMERO_INIZIALE
```

Stampa solo revisione e conteggi, senza righe, nominativi, email, codici o dettagli della singola tessera. Non importa, non approva e non scrive nulla. Non è stato eseguito sul cloud durante questa modifica.

Il parametro inventorySource predefinito rimane snapshot per compatibilità con i deployment precedenti e gli emulatori. Il deployment reale deve selezionare esplicitamente data-entry. Non vi è fallback automatico tra le fonti: errori o revisioni diverse bloccano la richiesta. In modalità data-entry non serve passInventorySnapshots e il suo mancato popolamento non è un blocco.

## Compatibilità e limiti
L'esportazione JSON esistente di Data Entry resta diagnostica/legacy, con approved:false; non è richiesta dal nuovo collegamento. Il campo approved:true della proiezione interna è soltanto compatibilità con il resolver dopo lettura dei dati persistiti; non viene scritto in Firestore e non deriva da un'autorizzazione del browser.

Staging C3.1 conserva dati sintetici e invocazione privata: non usa questa modalità per leggere inventario reale. Nessuna modifica a rules, IAM, inventario o impostazioni cloud è inclusa.

La lettura comprende la matrice globale, anche per un operatore autorizzato su una sola organizzazione: filtrarla prima del conteggio cambierebbe i numeri. L'autorizzazione server viene poi applicata all'organizzazione assegnataria della specifica tessera. Un'associazione mantiene il proprio organizationId; il reportingAreaId non sostituisce automaticamente quell'identità.

Non si riassegnano numeri se mancano catalogo/organizzazioni, una riga è incoerente, un ordine è cancellato, le quantità sono invalide o non esiste la configurazione stagionale. Mancanze/zeri senza numerazione restano come in Data Entry. Il resolver rifiuta numeri inesistenti e prodotti esclusi.

## Verifica prevista
Test locali: ordinamento e offset fra prodotti, organizzazioni non alfabetiche, revisioni stabili, dati incoerenti, autorizzazioni, vendita e registrazione, cambiamento quantità dopo prepare, assenza di copie/snapshot.
CI: nuova fase HTTP completa data-entry attraverso Auth, Functions e Firestore Emulator, senza creare passInventorySnapshots; le tre ripetizioni già previste restano attive. Staging mantiene il percorso sintetico precedente.

Riferimento Data Entry verificato: commit ee946d158f06dca746e6c3e154d99a9b4d2f428d, src/services/orders.ts e src/services/ticketNumbering.ts. Prima del collaudo resta necessaria la verifica che i valori persistiti e l'inizio scelto corrispondano alle tessere fisiche stampate.
