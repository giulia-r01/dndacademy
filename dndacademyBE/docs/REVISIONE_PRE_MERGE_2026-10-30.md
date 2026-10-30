# Revisione prima del merge - 30 ottobre 2026

**Esito aggiornato: i rilievi R1-R10 sono corretti e le regressioni passano. La branch e pronta per il merge tecnico nel perimetro verificato.** Questo non equivale al completamento delle pagine mancanti o alla certificazione per la produzione.

La prima revisione aveva esito negativo nonostante le build riuscite. Le correzioni sono rimaste su feature/master-encounters: nessun merge, commit o nuova branch effettuati. Il database dell'utente non e stato modificato o svuotato.

## Stato Git

- Branch: feature/master-encounters; commit di partenza 1eabd21.
- Main e origin/main verificati a 6b264ed; la feature aveva sei commit in piu e nessuna divergenza.
- Le modifiche di questa sessione sono ancora da committare, inclusi test e documentazione.

## Chiusura dei rilievi

| ID | Problema riprodotto nella prima revisione | Correzione e verifica |
| --- | --- | --- |
| R1 | Master estraneo poteva modificare gli HP; amount=-100 produceva 114/15 HP | Il servizio riceve il chiamante, controlla la proprieta, rifiuta importi <= 0 e usa aritmetica long con limiti 0..maxHp. Aggiornamento transazionale con lock; alive e coerente con gli HP. Test HTTP con proprietario/estraneo, danni/cure, zero, negativi e Integer.MAX_VALUE/MIN_VALUE. |
| R2 | Iscrizione e accesso diretto aggiravano campagne bloccate | requireUnlocked e applicato a iscrizione, accesso ai capitoli, scelta/consultazione personaggi e anteprima/avvio combattimento. Un'eventuale appartenenza preesistente non aggira il controllo. Il requisito puo essere ricavato dalle campagne completate anche prima di aprire la pagina progressi, senza scritture nelle richieste di sola lettura. Test negativo ADVANCED e positivo INTERMEDIATE appena aggiunta. |
| R3 | Due scelte concorrenti riuscivano entrambe | La scelta blocca la riga campagna prima di caricare/bloccare il personaggio, dentro una transazione. Vincolo DB univoco campagna/player; i template con player nullo restano multipli. Conflitti 409. Test concorrenti stesso Player/due personaggi e due Player/stesso personaggio; test diretto del vincolo senza passare dal servizio. |
| R4 | Sei richieste concorrenti creavano sei incontri nello stesso capitolo | Lock sulla riga del capitolo durante la gestione dell'incontro e unicita di encounters.chapter_id nel database. Sei creazioni concorrenti producono una riuscita e cinque conflitti, con un solo record. Test diretto del vincolo DB. Le API GET restano in sola lettura, senza lock di scrittura; regressione dedicata su dettaglio, elenco e proprieta. |
| R5 | Cambiare nome/CA del personaggio riscriveva la visualizzazione dello storico | Scheda non modificabile dopo il primo uso in combattimento, anche se ancora in corso; update e avvio dello scontro condividono il lock sul personaggio. usedInCombat e esposto nel DTO e disabilita Modifica lato Master con spiegazione. Test PUT dopo avvio: 409, nome conservato. Il ritratto mantiene l'endpoint separato. |
| R6 | Audit npm: 10 pacchetti interessati, uno classificato critical | Next ed eslint-config-next aggiornati da 16.2.7 a 16.4.3, dipendenze compatibili e lockfile aggiornati. Audit finale: zero vulnerabilita segnalate. Lint, build di produzione e browser test passano. |
| R7 | Spring Security rispondeva 400 ai divieti per ruolo | Handler specifico AccessDeniedException: 403 con messaggio pubblico. Test GET /api/npcs come PLAYER attraverso Spring Security, senza mock del servizio. |
| R8 | Una campagna con nome di soli spazi veniva salvata vuota | @Valid nei controller create/update, @NotBlank e limite 255 sul nome, limite 2000 sulla descrizione; controllo aggiuntivo nel servizio di creazione. Test HTTP del nome composto da spazi: 400. |
| R9 | Eliminare capitoli usati esponeva SQL e vincoli PostgreSQL | Il servizio impedisce la cancellazione di capitoli con progressi o incontri, con 409 e messaggio di dominio. Nessuna cancellazione a cascata dello storico. Anche DataIntegrityViolationException e mappata a 409 con messaggio generico senza SQL. Test HTTP della cancellazione con progresso e permanenza del capitolo. |
| R10 | Focus iniziale esterno e Tab fuori dalle modali | Focus iniziale su controllo visibile, prima del disegno; Tab/Shift+Tab confinati, contenimento di focus programmatico, Escape e ripristino del focus e dello scroll precedente. ID aria univoci. Esclusi gli input file nascosti. Test browser: apertura, 35 Tab, 35 Shift+Tab, Escape e ritorno al pulsante iniziale. |

R1, R2, R3, R7, R8, R9 e il componente comune di R10 erano gia presenti su main. R4 era introdotto nella feature; R5 deriva dai riferimenti dinamici del combattimento precedente, ora esposti anche nello storico. Sono stati risolti insieme per rendere coerente il risultato del merge.

## Verifiche finali

| Verifica | Risultato |
| --- | --- |
| Maven package, suite completa sul database H2 isolato | 78 test, zero errori/fallimenti; JAR generato, uscita 0 |
| Stessa suite su PostgreSQL 17 temporaneo, schema pulito dedicato | 78 test, zero errori/fallimenti; uscita 0 |
| Test di integrazione Spring Security/JPA/servizi senza repository mock | 12 scenari, inclusi concorrenza e vincoli DB, nei 78 totali |
| Frontend npm run lint | Superato |
| Frontend npm run build, Next.js 16.4.3 | Superato, TypeScript e generazione delle route comprese |
| Browser sulla build di produzione, API simulate | 44/44 superati, desktop/mobile e regressione modali |
| npm audit, al termine degli aggiornamenti | 0 info, low, moderate, high, critical |
| Controllo whitespace Git | Superato |

La suite standard ora usa application-test.properties tramite Surefire, con database H2 in modalita PostgreSQL e valori fittizi: non importa env.properties. TEST_DATABASE_URL, TEST_DATABASE_USER e TEST_DATABASE_PASSWORD consentono di usare un PostgreSQL dedicato. Lo schema di test usa create-drop: non impostare mai queste variabili su un database con dati da conservare. Comandi nel README backend.

Gli script e risultati grezzi della prima revisione restano sotto target/review-20261030. Quelli delle correzioni sono sotto target/fixes, ignorati da Git. Il backend reale era stato esercitato nella prima revisione anche con JWT fittizi e un flusso completo di combattimento; oggi le regressioni passano attraverso il contesto Spring, MockMvc/Spring Security e database reali, senza simulare repository o servizi. I 44 test frontend usano invece API simulate: non vanno presentati come collaudo browser end-to-end con tutti i servizi esterni.

## Schema e dati preesistenti

I vincoli sono parte del modello JPA, senza default Hibernate o script di riparazione dei dati. Su schema pulito vengono creati e verificati sia da H2 sia da PostgreSQL. Su un database preesistente eventuali duplicati devono essere valutati prima dell'aggiornamento dello schema: non vengono scelti o cancellati automaticamente personaggi, incontri o combattimenti.

Controlli di sola lettura per un database preesistente:

```sql
SELECT campaign_id, player_id, COUNT(*)
FROM characters
WHERE player_id IS NOT NULL
GROUP BY campaign_id, player_id HAVING COUNT(*) > 1;

SELECT chapter_id, COUNT(*)
FROM encounters
GROUP BY chapter_id HAVING COUNT(*) > 1;
```

Entrambi devono restituire zero righe prima di applicare i vincoli. Verificare inoltre che all'avvio Hibernate non segnali un fallimento nella creazione dei vincoli. Il database dell'app dell'utente non e stato usato durante le verifiche. Le modifiche non ricostruiscono attributi storici eventualmente gia alterati prima della correzione R5.

## Limiti distinti dal merge

- Profilo e Badge Player restano pagine placeholder da completare nelle prossime branch.
- Ripresa del combattimento dopo refresh/navigazione ancora non implementata; lo storico resta consultabile.
- Nessun invio email o upload reale su Cloudinary in questa sessione; nessuna nuova certificazione dei flussi SMTP, login/registrazione o recupero password.
- Nessuno scanner CVE dedicato alle dipendenze Maven eseguito; l'audit npm riguarda il frontend e vale alla data della verifica.
- La preparazione alla produzione richiede ancora migrazioni, configurazioni per ambiente e collaudo di distribuzione/CORS. La suite di test isolata non sostituisce questi lavori.

## Passo successivo

Committare le correzioni, i test e la documentazione su feature/master-encounters. Dopo la revisione del diff e l'eventuale controllo dei dati locali sopra indicato, si puo procedere al merge in main e creare la nuova branch per le aggiunte al Master. Nessuna di queste operazioni Git e stata eseguita automaticamente.
