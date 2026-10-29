# D&D Academy — Backend

API REST per account, didattica, campagne a capitoli, personaggi, NPC e combattimenti narrativi. Integrato con il frontend Next.js; progetto in sviluppo attivo.

[Panoramica](../README.md) · [Frontend](../dndacademyfe/README.md)

## Stack

Java 17 come versione target, Spring Boot 3.5.11, Spring Security, JWT, BCrypt, Spring Data JPA / Hibernate, PostgreSQL, Jakarta Validation e Maven Wrapper. Cloudinary per le immagini, Spring Mail per le email, JUnit 5 e Mockito per i test.

## Funzionalità presenti

| Area | Funzionalità |
| --- | --- |
| Account | Registrazione PLAYER, login JWT, recupero e reset password |
| Didattica | Lezioni, quiz, domande e risposte, progressi, badge e livelli di apprendimento |
| Campagne | Gestione Master, iscrizione Player e party |
| Capitoli | Narrazione, lezione e quiz associati, combattimento opzionale e ricompensa |
| Progressione | Requisiti di completamento, sblocco successivo e sincronizzazione dei capitoli aggiunti |
| Personaggi | Preparazione Master, scelta Player, statistiche, arma, incantesimo e immagine |
| NPC e incontri | Nemici e aiutanti riutilizzabili, immagini e quantità per incontro |
| Combattimento | Iniziativa, azioni singole, HP, critici, sconfitta e registro persistente |

Gli endpoint richiedono autenticazione salvo `/auth/**`. Il backend verifica ruoli, appartenenza e proprietà nelle operazioni previste. La registrazione pubblica crea PLAYER; il backoffice richiede un account MASTER già predisposto.

## Configurazione e avvio

Servono JDK 17 o compatibile, PostgreSQL e un database creato per il progetto. Le immagini richiedono Cloudinary; le email richiedono SMTP.

`src/main/resources/application.yaml` legge queste proprietà dalle variabili d'ambiente o dal file locale `src/main/resources/env.properties`, importato opzionalmente. Mantenere le credenziali fuori dai commit.

| Proprietà | Utilizzo |
| --- | --- |
| `DB_URL` | URL JDBC, ad esempio `jdbc:postgresql://localhost:5432/dndacademy` |
| `DB_USERNAME`, `DB_PASSWORD` | Credenziali PostgreSQL |
| `JWT_SECRET` | Segreto di firma HMAC, almeno 32 byte |
| `JWT_EXPIRATION` | Durata token in millisecondi |
| `APP_FRONTEND_BASE_URL` | Origine frontend, in locale `http://localhost:3000`; usata per CORS e reset password |
| `MAIL_HOST`, `MAIL_PORT` | Server SMTP |
| `MAIL_USERNAME`, `MAIL_PASSWORD` | Credenziali SMTP |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Configurazione Cloudinary |

Da questa cartella, su Windows:

```powershell
.\mvnw.cmd spring-boot:run
```

Su macOS/Linux usare `./mvnw spring-boot:run`. L'API locale ascolta sulla porta **8080**. Il frontend usa `NEXT_PUBLIC_API_URL=http://localhost:8080`.

Lo schema usa `spring.jpa.hibernate.ddl-auto: update`: riavviare il backend dopo gli aggiornamenti alle entità, inclusi immagine NPC e registro `combat_events`. Le migrazioni versionate sono ancora da introdurre.

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

Gli HP dello scontro appartengono ai partecipanti: i danni non vengono copiati sugli HP permanenti del personaggio. La UI non ripristina ancora una sessione al ricaricamento della pagina, anche se lo stato è persistito.

## Storico dei combattimenti

`GET /api/combat/history` restituisce `items`, `page`, `size`, `totalPages` e `totalElements`. La dimensione predefinita è 12 e quella massima 50; pagina negativa o dimensione non valida restituiscono 400. L’elenco include soltanto gli scontri associati all’utente autenticato, ordinati per ID decrescente. Campagna, capitolo e incontro sono caricati insieme alla pagina; i personaggi della pagina sono letti in una richiesta separata senza caricare tutti i registri.

Ogni elemento espone campagna, capitolo, incontro, personaggio, immagine, HP salvati del partecipante, stato, esito e data di conclusione quando presente. Gli scontri non completati conservano completed=false e sono mostrati come "Non concluso": ogni tentativo ha un proprio esito, indipendente da eventuali vittorie successive; non viene inventata una data di avvio per le sessioni precedenti. I metadati mancanti nei dati storici hanno valori di ripiego. Lo storico non richiede migrazioni e non crea nuove sessioni. Il dettaglio usa l’API di stato già protetta per proprietario: il frontend lo mostra in sola lettura, senza attacchi o riavvii.

## Immagini ed errori

Gli endpoint immagini accettano `multipart/form-data`, campo `file`: JPG, PNG o WEBP, fino al limite applicativo di 5 MB. Cloudinary usa le cartelle `dndacademy/characters` e `dndacademy/npcs`.

Il proprietario può cambiare l'immagine di un NPC già usato in combattimento; la modifica delle statistiche resta bloccata. Gli NPC usati in incontri o combattimenti non possono essere eliminati.

Le `ResponseStatusException` conservano il codice HTTP e un messaggio JSON. Le altre `RuntimeException` sono restituite come 400 con messaggio di ripiego se assente. La classificazione completa degli errori resta da uniformare.

## Verifiche

```powershell
# Compilazione
.\mvnw.cmd -DskipTests compile

# Test mirati senza avviare Spring o collegarsi al database
.\mvnw.cmd "-Dtest=CombatHistoryTest,CombatPreviewTest,CampaignChapterRequirementsTest,CampaignProgressServiceImplTest,CombatServiceImplTest,NpcImageTest,GlobalExceptionHandlerTest" test
```

I trentacinque test coprono turni separati, danni, mancati, critici, sconfitta, aiutanti, richieste ripetute, autorizzazioni, immagini NPC, gestione degli errori e coerenza della progressione delle campagne e stato individuale dei requisiti del capitolo. `DndacademyApplicationTests` carica invece il contesto Spring e richiede la configurazione e i servizi necessari all'avvio.

Il frontend include anche trentadue test browser Playwright con API simulate per il layout e le interazioni di combattimento e creazione NPC (vedere il relativo README). Non sostituiscono i test di integrazione: restano da eseguire la prova completa con backend reale e l’upload reale su Cloudinary.

## Struttura e prossimi sviluppi

Il codice si trova in `src/main/java/com/giulia/dndacademy/`, suddiviso in `controllers`, `service`, `repository`, `model`, `dto`, `security`, `exceptions` e `config`. Configurazione in `src/main/resources/`, test in `src/test/java/`.

Prossimi sviluppi: migrazioni e profili per ambiente, ripresa degli scontri dalla UI, strategie NPC più articolate, magie e condizioni avanzate, test di integrazione e preparazione al deploy.

Progetto personale di Giulia, sviluppato per apprendimento e portfolio.
