# D&D Academy

Piattaforma didattica per imparare le basi di Dungeons & Dragons attraverso lezioni, quiz e campagne tutorial a capitoli, con personaggi e combattimenti guidati. Progetto personale di Giulia, sviluppato per apprendimento e portfolio.

## Stato del progetto

Backend Spring Boot e frontend Next.js sono integrati. Sono disponibili Area Player, Area Master, gestione utenti, profilo, badge, combattimenti narrativi e storico. Il progetto è in preparazione al collaudo preproduzione; è disponibile il tour frontend guidato e restano da completare le verifiche dei servizi reali e la preparazione del deploy. Le meccaniche di D&D sono semplificate.

| Componente | Contenuto | Stack |
| --- | --- | --- |
| [dndacademyBE](dndacademyBE/README.md) | API, sicurezza, regole e persistenza | Java 17, Spring Boot 3.5.11, JPA, PostgreSQL, Maven |
| [dndacademyfe](dndacademyfe/README.md) | Interfaccia Player e Master | Next.js 16.4.3, React 19.2.4, TypeScript, Tailwind CSS 4 |

JWT e BCrypt gestiscono l'autenticazione. Cloudinary ospita avatar e immagini di personaggi e PNG; Gmail API via HTTPS e una coda persistente gestiscono benvenuto e recupero password in produzione; SMTP resta disponibile in locale.

## Percorso Player

Il login apre **Il tuo percorso**: la home propone di iniziare un'avventura o riprendere le campagne in corso, con statistiche e traguardi come riepilogo.

**Campagna → capitolo → attività richieste → completamento e ricompensa → capitolo successivo.**

L'iscrizione apre direttamente la campagna. I capitoli guidano tra storia, lezioni, quiz e combattimenti opzionali. Le attività aperte dalla campagna mantengono il collegamento di ritorno al capitolo. La biblioteca resta consultabile per studio e ripasso; le lezioni possono essere segnate come lette, anche senza un quiz.

Il Master prepara modelli riutilizzabili; ogni Player sceglie un eroe e riceve una copia personale con statistiche e stato indipendenti. Più Player possono scegliere lo stesso modello; rimane una sola scelta per account e campagna. Le modifiche successive del modello valgono solo per le nuove scelte. I requisiti acquisiti e le ricompense restano salvati e consultabili.

I quiz richiedono il completamento della lettura anche sul backend: il controllo protegge consultazione e invio; una risposta duplicata per la stessa domanda viene rifiutata. Il Master può consultare i contenuti durante la preparazione, ma per inviare il quiz deve completare la lettura come gli altri utenti.

Ogni nuovo combattimento è un esercizio indipendente e parte a HP pieni; riprendere uno scontro aperto conserva invece esattamente HP e azioni salvati. Questa scelta viene dichiarata nella preparazione e nel tour: non è la regola generale del recupero in D&D, che dipende da cure e riposi. Motivazioni, contratto API e aggiornamento del database sono documentati in [Regole didattiche e assegnazioni](dndacademyBE/docs/REGOLE_DIDATTICHE_E_ASSEGNAZIONI.md).

Nel combattimento il Player sceglie bersaglio e azione con arma o incantesimo. Il pulsante **Mostra l'azione di…** fa avanzare un singolo turno PNG; tiri, bersagli PNG, danni e cure vengono decisi dal backend. Gli aiutanti guaritori possono soccorrere gli alleati a 0 HP e curare i feriti con utilizzi limitati. Dopo la vittoria si torna al capitolo per completarlo.

Lo storico personale è paginato, inizialmente aperto e raggruppato per campagna e capitolo. Ogni tentativo mantiene esito e registro; il dettaglio è di sola lettura. Gli scontri aperti si possono riprendere dalla home, quando presenti nei risultati recenti, o dallo storico senza creare un nuovo tentativo.

## Area Master e account

Il Master entra in **Area Master** e può passare all'Area Player dal selettore del menu. La gestione segue le dipendenze dei contenuti: campagna e personaggi, lezioni e quiz, PNG e badge, capitoli e incontri. Gli incontri si configurano direttamente dal capitolo.

La sezione Utenti offre statistiche, ricerca e filtri e consente di assegnare o revocare il ruolo Master con conferma. Il proprio ruolo non è modificabile. La registrazione pubblica crea Player: il primo Master deve essere predisposto nell'ambiente, mentre i successivi possono essere promossi da un Master esistente.

**Profilo ed Esci sono nel menu apribile dall'avatar in alto.** La sidebar presenta gruppi distinti per ruolo e il riquadro del livello con la barra. Le etichette dei livelli sono Principiante, Intermedio e Avanzato in tutta l'interfaccia; la barra rappresenta il livello raggiunto su tre livelli.

Il profilo permette di aggiornare username ed email confermando la password attuale, caricare o rimuovere l'avatar, cambiare password ed eliminare il proprio account con conferma. La cancellazione trasferisce eventuali campagne e PNG a un altro Master e rimuove i dati personali di gioco senza eliminare i modelli condivisi. Il caricamento parte alla scelta di un'immagine valida e mostra uno stato di avanzamento; un errore conserva l'immagine precedente. I dati aggiornano subito anche la barra superiore.

I token identificano l'utente tramite l'ID immutabile: il cambio username conserva identità e progressi. Il cambio password invalida le sessioni precedenti e i link di recupero, e richiede un nuovo login. I badge automatici usano codici stabili, sono inizializzati all'avvio e non possono essere eliminati.

L'autenticazione usa gli account dell'app e JWT; non viene creato l'utente in memoria predefinito di Spring Boot. HTTP Basic e form login sono disabilitati esplicitamente, mantenendo la catena di sicurezza e i controlli dei ruoli. Dettagli in [Autenticazione JWT](dndacademyBE/docs/AUTHENTICATION.md).

Le risposte API sono preparate dai servizi entro transazioni esplicite, con Open Session in View disabilitato. Il registro del combattimento e l'ordine dei turni non dipendono da collezioni Hibernate da caricare durante la risposta. Dettagli in [Sessioni database e transazioni](dndacademyBE/docs/PERSISTENCE_BOUNDARIES.md).

Il GET pubblico `/actuator/health/readiness` verifica app e database per il futuro deploy Railway e restituisce solo lo stato. Gli altri endpoint di gestione sono bloccati. La [procedura healthcheck](dndacademyBE/docs/HEALTHCHECK.md) distingue la prova locale dall'impostazione cloud ancora da effettuare.

L'origine del frontend è validata e condivisa da CORS e link di recupero password. In produzione è consentita solo l'origine HTTPS configurata; localhost è previsto nei profili locali, senza wildcard per i progetti Vercel. Le richieste usano JWT Bearer, senza cookie cross-origin. Procedura e verifiche in [CORS per ambiente](dndacademyBE/docs/CORS.md).

Gli errori applicativi usano stati HTTP espliciti e messaggi leggibili. Errori server, SQL e provider non espongono dettagli interni: il client riceve il JSON `message` e le cause restano nei log del backend. Dettagli e prova locale in [Gestione errori API](dndacademyBE/docs/ERROR_HANDLING.md).

## Tour di primo avvio

Il tour guidato accompagna Player e Master tra pagine dimostrative interne all'app. Un box vicino al comando evidenziato indica l'azione richiesta; il resto della pagina è inerte. Il percorso avanza solo dopo l'azione o un salvataggio riuscito. Esci dal tour è sempre disponibile. I contenuti sono temporanei e non modificano dati reali. L'avvio è automatico al primo accesso e il menu dell'avatar permette di ricominciare; il Master può esplorare anche il percorso Player. La chiusura è ricordata per browser, account e ruolo. Dettagli: [Tour frontend](dndacademyfe/docs/tour-system.md).

## Navigazione e rotte

I percorsi principali restano `/dashboard`, `/campaigns`, `/lessons`, `/characters`, `/combat`, `/achievements`, `/profile` e `/admin`. `/combat` è lo storico; l'arena e la gestione incontri appartengono al capitolo:

- Player: `/campaigns/[campaignId]/chapters/[chapterId]/combat`.
- Master: `/admin/campaigns/[campaignId]/chapters/[chapterId]/encounter`.
- Ripresa: rotta dell'arena con `?combatId=...`.

I vecchi collegamenti con `campaignId` e `chapterId` nella query reindirizzano alle nuove rotte contestuali. Lezioni e quiz possono conservare quei parametri come contesto verificato di provenienza. Dettagli e comportamento mobile sono descritti in [Navigazione e percorso dell'utente](dndacademyfe/docs/navigation-flow.md).

## Avvio locale

Servono JDK 17 o compatibile, PostgreSQL, Node.js 20.9 o superiore e npm. Configurare database, JWT, servizio email e Cloudinary seguendo il [README backend](dndacademyBE/README.md#configurazione-e-avvio). Impostare `APP_FRONTEND_BASE_URL=http://localhost:3000` per CORS e collegamenti delle email.

In un terminale, dalla radice:

```powershell
cd dndacademyBE
.\mvnw.cmd spring-boot:run
```

Creare `dndacademyfe/.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8080
```

In un secondo terminale, dalla radice:

```powershell
cd dndacademyfe
npm ci
npm run dev
```

Aprire [l'app locale](http://localhost:3000). L'API ascolta normalmente sulla porta 8080. Su macOS/Linux usare `./mvnw spring-boot:run`. Le credenziali dei servizi restano nella configurazione locale e non vanno committate; le variabili `NEXT_PUBLIC_*` sono invece pubbliche.

Nel solo profilo `dev` il backend crea o aggiorna le tabelle tramite Hibernate; database e schema devono già esistere e l'utente configurato deve avere i permessi necessari. Se in sviluppo si elimina anche `public`, ricreare lo schema prima dell'avvio. Nei profili `preprod` e `prod` Flyway applica le migrazioni e Hibernate valida lo schema. Una build non svuota né ricrea automaticamente il database. Dopo un reset con riutilizzo degli ID cambiare anche `JWT_SECRET` per invalidare i token dei vecchi account.

Su database vuoto vengono inizializzati i badge di sistema; account, campagne, lezioni, personaggi e incontri devono essere predisposti per il collaudo. Le migrazioni V1/V2 sono applicate al database locale di preproduzione; V3 aggiunge la coda email ed è verificata nei test isolati; il rilascio Railway richiede ancora il collaudo cloud descritto nella documentazione.

## Verifiche

Nel frontend:

```powershell
npx tsc --noEmit --incremental false
npm run lint
npm run build
# Con il server frontend già avviato e un browser Playwright disponibile
npm run test:ui
```

Nel backend:

```powershell
.\mvnw.cmd test
```

I test browser coprono navigazione Player/Master, login, profilo, password, menu account, tour di primo avvio, livelli, utenti, badge, personaggi, combattimenti, PNG e incontri su desktop e mobile. Le API sono simulate: la suite non modifica database applicativo, SMTP o Cloudinary. Il backend dispone di una configurazione test isolata con H2 come default; eventuali override `TEST_DATABASE_*` cambiano il database di test.

Il collaudo con PostgreSQL e servizi reali resta separato: verificare l'intero percorso, permessi, progressione, immagini, email, revoca delle sessioni e ripresa degli scontri. I comandi e i dettagli sono nei README dei componenti e in [Profilo e badge: verifica prima del rilascio](dndacademyfe/docs/profile-and-badges.md). I risultati delle verifiche precedenti sono conservati come documenti datati in [Revisione pre merge del 30 ottobre 2026](dndacademyBE/docs/REVISIONE_PRE_MERGE_2026-10-30.md) e [Collaudo storico](dndacademyBE/docs/COLLAUDO.md).

## Limiti e prossimi interventi

- Flyway, V1–V4 e i profili backend sono introdotti. Il [collaudo del nuovo database](dndacademyBE/docs/DATABASE_MIGRATIONS.md) su PostgreSQL 17, il completamento della configurazione di rilascio e la verifica dei servizi reali restano necessari prima della produzione.
- La ripresa al ricaricamento funziona con un URL contenente `combatId`. L'avvio di un nuovo tentativo non aggiunge ancora l'ID all'URL: ricaricare una rotta priva di ID riapre la preparazione; il tentativo salvato resta recuperabile dallo storico.
- I combattimenti sono individuali contro PNG: il party della campagna non implica sincronizzazione multiplayer in tempo reale.
- Gli HP dello scontro sono separati da quelli permanenti del personaggio; la strategia PNG rimane semplificata.

Il progetto ha finalità educative e di portfolio.

## Preparazione Railway e Vercel

Il backend dispone di un [Dockerfile con build e test Java 17](dndacademyBE/docs/DOCKER.md), immagine finale JRE con utente senza privilegi e credenziali escluse dal contesto. Il codice corrente include le quattro migrazioni e la cancellazione account. Le precedenti prove Docker/Gmail sono descritte nella guida; l’immagine locale dell’utente va ricostruita per includere V4. Il frontend viene compilato da Vercel. Il collaudo cloud e OAuth definitivo sono ancora da completare.

[Verifica del main per Railway e Vercel](dndacademyfe/docs/preproduzione-railway-vercel.md): esito del controllo, pulizia del repository, interventi necessari e sequenza di rilascio. Il documento distingue i test locali dal collaudo dei servizi reali; la pubblicazione non e ancora approvata.

Informativa pubblica `/privacy` predisposta con dati del titolare confermati. Prima dell’apertura completare le verifiche operative descritte nella guida frontend `docs/privacy-rilascio.md`; nessun commit, merge o deploy è stato eseguito.

## Documentazione corrente

- [Preparazione Railway/Vercel](dndacademyfe/docs/preproduzione-railway-vercel.md): stato dei servizi e ordine di rilascio.
- [Revisione finale](dndacademyfe/docs/revisione-finale-premerge.md): pulizia, verifiche e limiti del controllo.
- [Primo Master](dndacademyBE/docs/FIRST_MASTER.md) e [cancellazione account](dndacademyBE/docs/ACCOUNT_DELETION.md).
- [Privacy e rilascio](dndacademyfe/docs/privacy-rilascio.md): pagina pubblica e verifiche operative ancora necessarie.

I resoconti di ottobre sono conservati come storico e non sostituiscono queste istruzioni. La suite corrente comprende 218 test backend, 31 test di configurazione frontend e 126 test browser con API simulate; gli esiti della revisione finale sono registrati nel relativo documento.
