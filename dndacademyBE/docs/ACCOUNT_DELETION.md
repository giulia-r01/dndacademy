# Eliminazione del proprio account

L'utente può eliminare il proprio profilo dalla pagina Profilo. La finestra riepiloga le conseguenze, richiede password attuale e conferma esplicita, e permette di annullare prima dell'invio. Durante l'operazione i controlli sono disabilitati e viene mostrato lo stato di avanzamento. Non sono introdotte disabilitazione o eliminazione di altri utenti nell'Area Master.

## API e autorizzazione

- `GET /api/users/me/deletion-plan`: restituisce il numero di campagne e PNG posseduti e, solo quando serve un trasferimento, ID e username degli altri Master disponibili. Non espone email o credenziali.
- `DELETE /api/users/me`: JSON con `currentPassword`, `confirmed: true` e, se necessario, `successorMasterId`. Risposta 204 dopo il commit della cancellazione.

L'identità è ricavata esclusivamente dal principal JWT. Un ID inserito nel corpo non seleziona altri utenti. Password errata o conferma assente danno 400; il trasferimento mancante/non valido dà 409; una sessione assente o già cancellata dà 401. Non esiste `DELETE /api/users/{id}`. Non vengono conservati account disattivati o indirizzi email fittizi al posto dell'eliminazione.

## Dati e contenuti

In un'unica transazione vengono rimossi iscrizioni alle campagne, progressi di capitoli/campagne/lezioni, risultati quiz, badge assegnati, combattimenti personali con eventi e partecipanti, copie personali dei personaggi con statistiche, token di recupero, richieste email e account. I modelli dei personaggi, le campagne, lezioni, quiz e gli altri Player restano disponibili. Le immagini delle copie personali rimandano ai modelli condivisi: cancellare quelle risorse comprometterebbe altri utenti e non viene fatto.

Come concordato, campagne e PNG creati dall'account vengono trasferiti al Master selezionato nella stessa transazione. Il destinatario deve essere diverso dall'account eliminato e avere ancora il ruolo MASTER al momento dell'esecuzione. I due account vengono bloccati in ordine di ID. Se non esiste un altro Master disponibile e ci sono contenuti da trasferire, occorre prima promuoverne uno o contattare il titolare. Un account senza contenuti può essere eliminato senza successore, anche se è l'ultimo Master: la successiva gestione amministrativa richiederà la procedura controllata del primo Master.

Qualunque errore del database annulla cancellazione, trasferimento e accodamento della pulizia dell'avatar. La rimozione dell'utente rende inutilizzabili tutti i suoi JWT già emessi; login e reset non possono ripristinare l'account. Le preferenze del tour di quell'ID vengono eliminate dal browser corrente; nelle altre installazioni restano solo preferenze locali, mentre i vecchi accessi vengono rifiutati dal server.

I contatori antiabuso HMAC restano fino alla loro scadenza e pulizia prevista: non contengono email o username in chiaro e non sono eliminati per aggirare le quote tramite nuova registrazione. Un'email già consegnata o già in invio non può essere ritirata. Log dei fornitori, copie nella casella del mittente e backup seguono le politiche di conservazione da completare prima dell'apertura pubblica. Il trasferimento conserva i contenuti didattici, non l'account dell'autore; per dati personali eventualmente scritti nei contenuti resta disponibile il contatto privacy.

## Avatar e migrazione V4

La migrazione aggiuntiva `V4__avatar_cleanup.sql` crea una coda separata, senza FK verso l'account eliminato. V1/V2/V3 rimangono immutate. La coda contiene solo UUID del lavoro, ID numerico necessario a ricavare il public ID Cloudinary, tentativi, scadenza e lease; non contiene URL, email o password. Il lavoro viene salvato nella transazione della cancellazione anche quando l'avatar corrente è vuoto, per rimuovere eventuali residui di precedenti caricamenti.

Il worker acquisisce un lease di 120 secondi, esegue la cancellazione Cloudinary fuori dalla transazione e rimuove il lavoro dopo il successo. La rimozione Cloudinary è idempotente (`ok` o `not found`). Errori o riavvii conservano il lavoro e permettono ritenti: attesa crescente da 30 secondi fino a un'ora, senza abbandono automatico. Il controllo parte ogni 15 secondi e gestisce al massimo cinque lavori per ciclo. Un completamento con lease superato non può chiudere un lavoro riacquisito. I log riportano solo l'UUID del lavoro e una diagnostica generica. La CDN può richiedere tempo per propagare l'invalidazione.

`app.avatar-cleanup.enabled` è attivo per default e disattivato nei test. Non disattivarlo nell'ambiente pubblico. Controllare i warning di pulizia e i lavori rimasti con tentativi ripetuti, correggendo configurazione o disponibilità Cloudinary. Non riutilizzare ID o resettare le sequenze utenti: gli asset hanno un identificatore stabile per ID e devono appartenere allo stesso ambiente Cloudinary del backend.

Per provare la funzionalità usare frontend e backend aggiornati insieme. Sul Docker locale ricostruire l'immagine e ricreare il container mantenendo il database e le variabili esistenti: Flyway deve applicare la sola V4 se lo schema è già a V3. Non svuotare il database né modificare le migrazioni già applicate. Nei profili `dev` con Hibernate update e Flyway spento viene creata l'entità della coda, mentre `preprod`/`prod` usano V4.

## Verifiche

Test HTTP su schema reale Flyway: richiesta anonima, impossibilità di scegliere un altro account, password/conferma obbligatorie, rimozione di dati collegati, modelli e altri utenti preservati, JWT e login precedenti rifiutati, trasferimento a un altro Master, rifiuto dei destinatari non validi e rollback per errore di FK. Test della coda: ripresa del lease, completamento obsoleto ignorato, fallimento del servizio e ritento riuscito. Nessuna email o chiamata Cloudinary reale nei test.

Test browser con API simulate: annullamento, password errata senza logout, conferma obbligatoria, stato durante l'invio, logout dopo 204, scelta del successore, unico Master con contenuti bloccato e errore del piano recuperabile. Il test del flusso esistente è distinto dalla verifica reale dei fornitori, da completare nel collaudo cloud.

Esito del 13 novembre 2026: suite completa backend e packaging superati (218 test); i sei test HTTP e coda della cancellazione sono stati ripetuti con successo su PostgreSQL 17 temporaneo con le quattro migrazioni reali e validazione Hibernate. Database temporaneo rimosso al termine; nessuna connessione ai database dell'utente. Lint, TypeScript e build frontend superati. Suite browser: i 122 test preesistenti superati; i quattro nuovi test inizialmente erano interrotti dal tour automatico per un ID fittizio non coerente con la fixture. Corretto l'ID del solo test, i quattro nuovi test sono stati rieseguiti e superati. Le chiamate Cloudinary restano simulate; il collaudo del worker con il fornitore reale è da fare nell'ambiente di collaudo.

## Worker e inattività

Il ciclo mantiene il limite di cinque lavori e il passo di 15 secondi quando ci sono scadenze attese. Le code senza lavori attesi non interrogano il database a ogni ciclo: notifica dopo commit, prossima scadenza e recupero periodico coordinano le interrogazioni. Lease e pulizia idempotente restano invariati. [Configurazione corrente](../../dndacademyfe/docs/deploy-render-neon.md).
