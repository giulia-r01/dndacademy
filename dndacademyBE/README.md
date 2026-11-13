# D&D Academy — Backend

API REST per account, didattica, campagne a capitoli, personaggi, NPC e combattimenti narrativi. Integrato con il frontend Next.js; progetto in preparazione al collaudo preproduzione.

[Panoramica](../README.md) · [Frontend](../dndacademyfe/README.md)

## Stack

Le scelte correnti su accesso ai quiz, modelli riutilizzabili, copie personali e HP didattici sono descritte in [Regole didattiche e assegnazioni](docs/REGOLE_DIDATTICHE_E_ASSEGNAZIONI.md). Per un database legacy precedente ai modelli riutilizzabili è richiesta la conversione manuale indicata nel documento; un database nuovo usa Flyway e non esegue quello script; nessuno script svuota automaticamente il database.

Java 17 come versione target, Spring Boot 3.5.11, Spring Security, JWT, BCrypt, Spring Data JPA / Hibernate, PostgreSQL, Jakarta Validation e Maven Wrapper. Cloudinary per le immagini, Gmail API HTTPS e coda persistente per le email, Spring Mail per MIME e SMTP locale, JUnit 5 e Mockito per i test.

## Funzionalità presenti

| Area | Funzionalità |
| --- | --- |
| Account | Registrazione PLAYER, login JWT, profilo, immagini, cambio/reset password ed eliminazione del proprio account |
| Didattica | Lezioni, quiz, domande e risposte, progressi, badge e livelli di apprendimento |
| Campagne | Gestione Master, iscrizione Player e party |
| Capitoli | Narrazione, lezione e quiz associati, combattimento opzionale e ricompensa |
| Progressione | Requisiti di completamento, sblocco successivo e sincronizzazione dei capitoli aggiunti |
| Personaggi | Preparazione Master, scelta Player, statistiche, arma, incantesimo e immagine |
| NPC e incontri | Nemici e aiutanti riutilizzabili, immagini e quantità per incontro |
| Combattimento | Iniziativa, azioni singole, HP, critici, sconfitta e registro persistente |

Gli endpoint richiedono autenticazione salvo `/auth/**` e i GET pubblici `/actuator/health/readiness` e `/actuator/health/liveness`. Il backend verifica ruoli, appartenenza e proprietà nelle operazioni previste. La registrazione pubblica crea PLAYER; il backoffice richiede un account MASTER già predisposto.

Le richieste pubbliche di autenticazione hanno quote per indirizzo e identità con contatori condivisi nel database e migrazione V2. Il rifiuto temporaneo restituisce 429 con `Retry-After`. Configurazione Render, motivazioni e prova locale: [Limiti autenticazione](docs/AUTH_RATE_LIMITS.md).

Il login usa gli account persistiti e BCrypt; le richieste protette usano JWT Bearer. È esclusa la sola autoconfigurazione dell'utente predefinito in memoria e sono disabilitati esplicitamente HTTP Basic e form login. La protezione degli endpoint resta attiva. Motivazione e verifica in [Autenticazione JWT](docs/AUTHENTICATION.md).

Open Session in View è disabilitato: i servizi caricano le relazioni e costruiscono i DTO all'interno di transazioni esplicite. Registro eventi e ordine dei turni del combattimento sono copiati in liste normali prima della risposta JSON. Scelte e prove senza una transazione di test esterna in [Sessioni database e transazioni](docs/PERSISTENCE_BOUNDARIES.md).

Il readiness endpoint Actuator verifica disponibilità dell'app e del database: restituisce solo `status`, con HTTP 200 se pronto e 503 negli stati non pronti. È disponibile anche liveness, usato da Render senza interrogare il database. Gli altri percorsi di gestione sono bloccati. Configurazione condivisa con i test in `src/main/resources/management.yaml`; liveness senza query DB e percorso da impostare su Render in [Healthcheck](docs/HEALTHCHECK.md).

CORS consente origini esatte: in `dev`/`preprod` anche localhost e 127.0.0.1 sulla porta 3000, in `prod` solo l'origine HTTPS configurata. Configurazioni errate o eccezioni locali in produzione impediscono l'avvio. La stessa origine normalizzata è usata per le email di recupero password. Regole, prova preflight e test in [CORS per ambiente](docs/CORS.md).

Gli errori API mantengono il JSON `message`: quelli previsti hanno stati espliciti e testi utili; gli imprevisti restituiscono 500 generico, con la causa nei soli log. Il formato copre anche Spring MVC e gli errori della catena di sicurezza; indisponibilità del database non vengono confuse con credenziali errate. Contratto, stati e collaudo in [Gestione errori](docs/ERROR_HANDLING.md).

## Configurazione e avvio

Servono JDK 17 o compatibile, PostgreSQL e un database creato per il progetto. Le immagini richiedono Cloudinary; le email usano [Gmail API HTTPS con OAuth e coda persistente](docs/GMAIL_API.md) in produzione. SMTP resta disponibile nei profili locali.

`src/main/resources/application.yaml` legge le proprietà dalle variabili d'ambiente. Il profilo locale `dev` (default) importa opzionalmente `./src/main/resources/env.properties` come file esterno, relativo alla cartella di avvio: il file non viene più incluso nelle risorse Maven o nel JAR. `prod` usa esclusivamente l'ambiente. Mantenere le credenziali fuori dai commit.

| Proprietà | Utilizzo |
| --- | --- |
| `DB_URL` | URL JDBC, ad esempio `jdbc:postgresql://localhost:5432/dndacademy` |
| `DB_USERNAME`, `DB_PASSWORD` | Credenziali PostgreSQL |
| `JWT_SECRET` | Segreto di firma HMAC, almeno 32 byte |
| `JWT_EXPIRATION` | Durata token in millisecondi |
| `APP_FRONTEND_BASE_URL` | Singola origine frontend, in locale `http://localhost:3000`; in `prod` HTTPS non loopback, senza percorsi/query/wildcard; usata per CORS e reset password |
| `MAIL_PROVIDER` | `smtp` per default in locale; impostare `gmail-api` per il collaudo API. `prod` impone Gmail API |
| `MAIL_FROM` | Indirizzo del mittente autorizzato; in locale può usare `MAIL_USERNAME` come fallback |
| `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN` | OAuth del mittente per Gmail API; nessun accesso Google richiesto ai Player |
| `MAIL_HOST`, `MAIL_PORT` | Server SMTP, soltanto per il trasporto SMTP locale |
| `MAIL_USERNAME`, `MAIL_PASSWORD` | Credenziali SMTP locali; non usate da Gmail API |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Configurazione Cloudinary |

Da questa cartella, su Windows:

```powershell
.\mvnw.cmd spring-boot:run
```

Su macOS/Linux usare `./mvnw spring-boot:run`. L'API locale ascolta sulla porta **8080**. Il frontend usa `NEXT_PUBLIC_API_URL=http://localhost:8080`.

Il solo profilo `dev` conserva Hibernate `update` e Flyway disabilitato per il vecchio database locale. Per nuove installazioni di collaudo e produzione, Flyway applica le migrazioni V1–V4 in `src/main/resources/db/migration/` e Hibernate usa `validate`: non modifica le tabelle. `preprod` richiede un URL separato `PREPROD_DB_URL`; `prod` richiede `SPRING_PROFILES_ACTIVE=prod` e tutte le variabili cloud. Nessun baseline automatico o reset dei vecchi dati. La porta legge `PORT` con default locale 8080. Procedura a piccoli passi e differenze tra profili in [Flyway e collaudo del database](docs/DATABASE_MIGRATIONS.md).

## API principali

Selezione degli endpoint implementati. Le chiamate protette richiedono `Authorization: Bearer <token>`.

| Metodo | Percorso | Funzione |
| --- | --- | --- |
| POST | `/auth/register`, `/auth/login` | Registrazione e login |
| POST | `/auth/forgot-password`, `/auth/reset-password` | Recupero password |
| GET | `/api/users/me` | Utente corrente |
| GET / POST | `/api/campaigns` | Elenco e creazione campagne |
| POST | `/api/campaigns/{id}/join` | Iscrizione |
| GET | `/api/campaigns/{campaignId}/chapters/player` | Capitoli con progressi Player |
| GET / POST | `/api/campaigns/{campaignId}/chapters` | Gestione capitoli |
| PATCH | `/api/campaigns/chapters/{chapterId}/complete` | Verifica requisiti e completa capitolo |
| GET | `/api/characters/me` | Personaggi del Player |
| GET | `/api/characters/campaign/{campaignId}/available` | Personaggi disponibili |
| PATCH | `/api/characters/{id}/claim` | Scelta del personaggio |
| PATCH | `/api/characters/{id}/image` | Immagine personaggio |
| GET / POST | `/api/npcs` | Elenco NPC del Master e creazione |
| GET / PUT / DELETE | `/api/npcs/{npcId}` | Gestione NPC |
| PATCH | `/api/npcs/{npcId}/image` | Immagine nemico o aiutante |
| POST | `/api/encounters` | Creazione incontro |
| GET | `/api/encounters/chapter/{chapterId}` | Incontri del capitolo |
| GET / PUT / DELETE | `/api/encounters/{encounterId}` | Gestione incontro |
| GET | `/api/lessons`, `/api/quizzes/lesson/{lessonId}` | Contenuti didattici |
| PATCH | `/api/lessons/{lessonId}/complete` | Completa lezione |
| POST | `/api/quizzes/submit` | Invio risposte |
| GET | `/api/badges/me` | Badge ottenuti |

Sono presenti anche le API di gestione di lezioni, quiz, domande, risposte e badge.

## Progressione con capitoli aggiunti

L'elenco delle campagne verifica le campagne già segnate come completate rispetto al numero attuale dei capitoli e ai relativi completamenti del Player. Se un capitolo manca, anche quando non ha ancora una riga di progresso, la campagna viene riaperta e la vecchia data di completamento viene rimossa. Il completamento dei singoli capitoli, i badge e gli sblocchi già ottenuti restano conservati. Il completamento finale richiede tutti i capitoli attuali; una campagna senza capitoli non pu? essere completata. Non servono modifiche manuali al database: le vecchie segnalazioni vengono riallineate quando si consulta l'elenco campagne.

Il [registro del collaudo](docs/COLLAUDO.md) distingue verifiche sul codice, test e conferme nell'app reale.

## Stato dei requisiti del capitolo

`GET /api/campaigns/{campaignId}/chapters/player` include `lessonCompleted`, `quizPassed`, `combatWon` e `quizLessonId`. I tre stati sono calcolati dai progressi e dai risultati salvati dell'utente autenticato, indipendentemente dal completamento del capitolo. Un precedente superamento del quiz mantiene valido il requisito anche se il quiz viene ripetuto con esito negativo. `quizLessonId` permette di aprire il quiz anche se il capitolo non collega una lezione propria. Nessuna migrazione del database ? necessaria per questi campi della risposta.

## Combattimento narrativo

Ogni scontro è associato a un Player, un capitolo e un incontro. Servono iscrizione alla campagna, capitolo sbloccato con combattimento abilitato, personaggio valido assegnato e incontro con almeno un nemico. Attualmente si usa il primo incontro del capitolo in ordine di ID.

| Metodo | Percorso | Funzione |
| --- | --- | --- |
| GET | `/api/combat/chapter/{chapterId}/preview` | Anteprima autorizzata di incontro, NPC e quantità, senza avviare lo scontro |
| POST | `/api/combat/chapter/{chapterId}/start` | Crea partecipanti e iniziativa |
| GET | `/api/combat/{combatId}/current` | ID partecipante in turno |
| GET | `/api/combat/history?page=0&size=12` | Storico paginato del solo utente autenticato |
| GET | `/api/combat/{combatId}/status` | Stato completo e registro |
| POST | `/api/combat/{combatId}/attack` | Azione del personaggio Player |
| POST | `/api/combat/{combatId}/npc-turn?expectedEventCount=N` | Singola azione NPC |

L’anteprima verifica iscrizione, capitolo sbloccato e incontro valido con gli stessi controlli dell’avvio. Restituisce titolo e descrizione dell’incontro e i gruppi NPC con immagine, quantità, schieramento, HP, CA e modificatori. Usa il medesimo primo incontro per ID che verrà avviato. Non crea combattimenti o partecipanti e non richiede di avere già scelto il personaggio.

L'attacco contiene `combatId`, `attackerId`, `targetId` e `actionType` (`WEAPON` o `SPELL`). Attaccante e bersaglio usano ID di **CombatParticipant**, non direttamente quelli di personaggi o NPC.

L'iniziativa è `d20 + modificatore Destrezza`. Ogni azione passa al prossimo partecipante vivo senza eseguire in blocco i turni NPC. Gli attacchi rispettano CA, critico con 20 naturale e fallimento con 1 naturale. Arma e incantesimo usano la caratteristica configurata; gli NPC usano i propri modificatori.

Il client richiede le azioni di nemici e aiutanti una alla volta. Il backend decide bersaglio e tiri; la strategia NPC sceglie il primo avversario vivo in ordine di ID. `expectedEventCount` deve coincidere con il numero corrente di eventi: una richiesta obsoleta restituisce **409**. Dopo un errore di rete il client rilegge lo stato prima di consentire di proseguire.

Lo stato include `fighters`, con HP, iniziativa, schieramento e immagini, ed `events`, registro cronologico persistito in `combat_events`. Gli eventi mostrano attaccante, bersaglio, tiro, totale, CA, esito, danni e HP prima/dopo. Gli esiti sono `PLAYER_VICTORY` ed `ENEMY_VICTORY`. La vittoria soddisfa il requisito di combattimento; il Player completa poi il capitolo tramite la relativa API.

Gli HP dello scontro appartengono ai partecipanti. Ogni nuovo tentativo è un esercizio indipendente e parte dagli HP massimi della copia personale; danni e cure restano in quel tentativo. La UI spiega la semplificazione rispetto alle regole di cure e riposi di D&D. La ripresa tramite `combatId` recupera HP ed eventi salvati e non avvia un nuovo tentativo.

## Storico dei combattimenti

`GET /api/combat/history` restituisce `items`, `page`, `size`, `totalPages` e `totalElements`. La dimensione predefinita è 12 e quella massima 50; pagina negativa o dimensione non valida restituiscono 400. L’elenco include soltanto gli scontri associati all’utente autenticato, ordinati per ID decrescente. Campagna, capitolo e incontro sono caricati insieme alla pagina; i personaggi della pagina sono letti in una richiesta separata senza caricare tutti i registri.

Ogni elemento espone campagna, capitolo, incontro, personaggio, immagine, HP salvati del partecipante, stato, esito e data di conclusione quando presente. Gli scontri non completati conservano completed=false e sono mostrati come "Non concluso": ogni tentativo ha un proprio esito, indipendente da eventuali vittorie successive; non viene inventata una data di avvio per le sessioni precedenti. I metadati mancanti nei dati storici hanno valori di ripiego. Lo storico non richiede migrazioni e non crea nuove sessioni. Il dettaglio usa l’API di stato già protetta per proprietario: il frontend lo mostra in sola lettura, senza attacchi o riavvii.

## Immagini ed errori

Gli endpoint immagini accettano `multipart/form-data`, campo `file`: JPG, PNG o WEBP, fino al limite applicativo di 5 MB. Cloudinary usa le cartelle `dndacademy/characters` e `dndacademy/npcs`.

Il proprietario può cambiare l'immagine di un NPC già usato in combattimento; la modifica delle statistiche resta bloccata. Gli NPC usati in incontri o combattimenti non possono essere eliminati.

Gli errori applicativi previsti usano stati espliciti e messaggi controllati; i motivi 5xx non vengono mai restituiti. Spring MVC mantiene stati come 400/404/405/413/415, con il solo messaggio sicuro. La sicurezza restituisce JSON 401 per accesso mancante o sessione non valida e 403 per divieti; conflitti di integrità/concorrenza hanno 409 generico. Gli imprevisti hanno 500, i guasti di servizio 502/503, con dettagli nei soli log. Il fallback del server non include messaggi tecnici, eccezioni o stack trace. Contratto completo in [Gestione errori](docs/ERROR_HANDLING.md).

## Verifiche

```powershell
# Compilazione
.\mvnw.cmd -DskipTests compile

# Test mirati senza avviare Spring o collegarsi al database
.\mvnw.cmd "-Dtest=NpcHealerTest,CampaignUnlockSyncTest,CharacterHpUpdateTest,CombatHistoryTest,CombatPreviewTest,CampaignChapterRequirementsTest,CampaignProgressServiceImplTest,CombatServiceImplTest,NpcImageTest,GlobalExceptionHandlerTest" test
```

La suite completa comprende 232 test: unitari e integrazione di sicurezza, repository, transazioni, concorrenza e vincoli. `QuizPrerequisiteIntegrationTest` copre lettura obbligatoria, autore Master, isolamento dei progressi, risposte duplicate e quiz vuoti; `PreMergeIntegrationTest` verifica anche copie personali concorrenti dello stesso modello, protezione degli snapshot, HP pieni nei nuovi tentativi e ripresa senza reset. InitialSchemaMigrationTest e InitialSchemaApplicationTest verificano V1–V4, la validazione delle entita, il riavvio senza perdita di dati e le protezioni Flyway. Il profilo di test usa H2 in memoria; migrazioni e cancellazione sono verificate anche su PostgreSQL 17 temporaneo; resta il collaudo dei servizi cloud reali.

Il frontend include test browser Playwright con API simulate per i flussi Player/Master, combattimenti, immagini, profilo, navigazione, tour ed editor (vedere il relativo README). Non sostituiscono i test di integrazione o la prova completa con i servizi reali.

## Struttura e prossimi sviluppi

Il codice si trova in `src/main/java/com/giulia/dndacademy/`, suddiviso in `controllers`, `service`, `repository`, `model`, `dto`, `security`, `exceptions` e `config`. Configurazione in `src/main/resources/`, test in `src/test/java/`.

Flyway, V1–V4 e i profili `dev`/`preprod`/`prod` sono introdotti; restano configurazione cloud e collaudo applicativo completo sul database di rilascio. Prossimi sviluppi: completare la configurazione di rilascio, strategie NPC più articolate, risorse persistenti con cure e riposi come modulo didattico distinto, magie e condizioni avanzate.

Progetto personale di Giulia, sviluppato per apprendimento e portfolio.


### Modifica HP dei personaggi

Il catalogo Master modifica i modelli e riallinea i loro HP al massimo configurato. Le copie personali già assegnate sono snapshot indipendenti e non vengono riscritte da queste modifiche. Gli endpoint Master di danno/cura restano protetti per proprietario della campagna; gli HP di un combattimento sono però dati del partecipante e ogni nuovo esercizio parte al massimo. Vedere le regole e la migrazione collegate all'inizio del documento.


### Sincronizzazione degli sblocchi delle campagne

La lettura della progressione personale crea gli eventuali record mancanti, verifica i completamenti rispetto ai capitoli attuali e sblocca le campagne del livello successivo quando l’utente ha già completato almeno una campagna della difficoltà precedente. Vale anche per campagne create dopo il completamento e per record già presenti ma rimasti bloccati. Non assegna iscrizioni, completamenti, date o badge, non salta livelli e non revoca gli sblocchi già ottenuti. Il livello didattico dell’utente resta distinto da questi requisiti.


### Aiutanti guaritori e vittoria del gruppo

Gli NPC aiutanti possono avere healer=true, healingDie (4/6/8/10/12), healingModifier (0-30) e healingUses (1-20). I nemici non possono essere guaritori. Per i combattenti healer=false e i valori cura sono normalizzati a zero dall’applicazione. Le statistiche di NPC già usati restano protette: per cambiare la configurazione creare un nuovo NPC da aggiungere a un nuovo incontro.

Ogni turno cura un solo alleato ferito, incluso se stesso: priorità a 0 HP e poi alla percentuale di HP più bassa, con ID come spareggio. La cura vale un tiro del dado più bonus, limitato al massimo del bersaglio; recuperare HP da zero riabilita il partecipante ai turni. Consuma un utilizzo per quel partecipante e combattimento, persistito in healingUsed. Se tutti sono sani o gli utilizzi sono esauriti, il guaritore attacca. Non può agire da sconfitto; se tutti gli alleati sono a zero lo scontro termina. La protezione sulle richieste ripetute e il lock del combattimento valgono anche per le cure.

Gli eventi HEAL registrano healing effettivo, healingRoll, healingDie e HP prima/dopo; gli attacchi usano ATTACK. actionType è obbligatorio nel database e viene inizializzato a ATTACK nell’entità Java; le cure lo impostano a HEAL. Lo stato fighters espone healer e healingUsesRemaining; l’anteprima espone la configurazione delle cure. Non vengono modificati gli HP permanenti del personaggio o gli scontri precedenti. PLAYER_VICTORY resta la vittoria dello schieramento alleato: il frontend chiarisce quando il personaggio del Player è fuori combattimento.

I campi di configurazione delle cure, il contatore degli utilizzi e i valori numerici degli eventi sono colonne NOT NULL. I valori iniziali sono gestiti in Java (false e zero per i primitivi) e dal servizio NPC, senza default SQL o script di transizione. La rimozione delle annotazioni non elimina i default già presenti in un database esistente: per ottenere lo schema pulito serve ricrearlo separatamente. Non viene eseguito alcun reset o modifica diretta dei dati.

## Correzioni della revisione pre merge

Gli endpoint danni/cure verificano il Master proprietario, accettano soltanto importi positivi e limitano gli HP tra zero e il massimo anche con importi estremi. Lo sblocco delle campagne viene verificato nel backend per iscrizione, accesso ai capitoli, scelta del personaggio e preparazione/avvio dello scontro; non dipende dall'apertura preventiva della pagina progressi.

La scelta dei personaggi usa transazioni e lock, con unicita database della coppia campagna/player; gli incontri hanno un solo record per capitolo, protetto da lock e vincolo univoco. Le scelte in conflitto restituiscono 409. I personaggi gia usati in combattimento non possono cambiare scheda, cosi i riferimenti dello storico rimangono coerenti; il ritratto conserva il proprio endpoint separato. Il DTO espone usedInCombat e il frontend disabilita la modifica. I capitoli con progressi o incontri non sono eliminabili.

### Suite completa isolata

```powershell
.\mvnw.cmd test
.\mvnw.cmd package
```

Surefire carica src/test/resources/application-test.properties, con H2 in modalita PostgreSQL e credenziali fittizie. Non importa env.properties e non usa il database dell'app. Per verificare anche PostgreSQL, indicare esclusivamente un database dedicato e sacrificabile: lo schema di test usa create-drop.

```powershell
.\mvnw.cmd "-DTEST_DATABASE_URL=jdbc:postgresql://127.0.0.1:55432/dndacademy_review" "-DTEST_DATABASE_USER=review" test
```

TEST_DATABASE_PASSWORD puo essere passato allo stesso modo quando necessario. I vincoli nuovi sono stati verificati su schema pulito H2 e PostgreSQL; su database preesistenti controllare eventuali duplicati prima di aggiornare lo schema, senza cancellare automaticamente dati storici. Nessun reset del database dell'utente e incluso in queste modifiche. Dettagli e limiti: [revisione pre merge](docs/REVISIONE_PRE_MERGE_2026-10-30.md).

## Preparazione Render, Neon e Vercel

Il backend dispone di un [Dockerfile con build e test Java 17](docs/DOCKER.md), immagine finale JRE con utente senza privilegi e credenziali escluse dal contesto. Il codice corrente include V4 e la cancellazione account; le precedenti prove Docker e Gmail locali non certificano la versione cloud. Ricostruire l’immagine locale per applicare V4 senza svuotare il database. Vedere la guida Docker per variabili e avvio aggiornati.

[Verifica del main per Render, Neon e Vercel](../dndacademyfe/docs/preproduzione-render-vercel.md): esito del controllo, pulizia del repository, interventi necessari e sequenza di rilascio. Il documento distingue i test locali dal collaudo dei servizi reali; la pubblicazione non e ancora approvata.

Informativa pubblica `/privacy` predisposta con dati del titolare confermati. Prima dell’apertura completare le verifiche operative descritte nella [guida privacy frontend](../dndacademyfe/docs/privacy-rilascio.md); nessun commit, merge o deploy è stato eseguito.

## Primo Master

La [procedura del primo Master](docs/FIRST_MASTER.md) promuove manualmente un account Player verificato sul database nuovo. Lo script richiede ID, username ed email, rifiuta l’operazione se esiste già un Master e invalida le vecchie sessioni. Non viene eseguito da Flyway o all’avvio; le promozioni successive restano nell’Area Master.

## Cancellazione del proprio account

Dal profilo è possibile eliminare il proprio account con password e conferma esplicita. La [procedura applicativa](docs/ACCOUNT_DELETION.md) documenta rimozione dei dati personali, trasferimento dei contenuti Master, revoca degli accessi e pulizia persistente dell’avatar con V4. Non sono introdotte funzioni amministrative di eliminazione o disabilitazione di altri utenti.

## Profilo Render e Neon

`SPRING_PROFILES_ACTIVE=render` include il profilo prod. Il runtime usa `DB_URL`, Flyway richiede `DB_MIGRATION_URL` diretto, e il pool rilascia le connessioni inattive. Sonde Render su liveness, senza query al database. I worker riattivano le code dopo il commit e rispettano le scadenze persistenti, con recupero periodico. [Variabili e collaudo](../dndacademyfe/docs/deploy-render-neon.md).
