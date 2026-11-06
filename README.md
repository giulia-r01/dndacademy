# D&D Academy

Piattaforma didattica per imparare le basi di Dungeons & Dragons attraverso lezioni, quiz e campagne tutorial a capitoli, con personaggi e combattimenti guidati. Progetto personale di Giulia, sviluppato per apprendimento e portfolio.

## Stato del progetto

Backend Spring Boot e frontend Next.js sono integrati. Sono disponibili Area Player, Area Master, gestione utenti, profilo, badge, combattimenti narrativi e storico. Il progetto è in preparazione al collaudo preproduzione; è disponibile un prototipo di tour frontend guidato e restano da completare le verifiche dei servizi reali e la preparazione del deploy. Le meccaniche di D&D sono semplificate.

| Componente | Contenuto | Stack |
| --- | --- | --- |
| [dndacademyBE](dndacademyBE/README.md) | API, sicurezza, regole e persistenza | Java 17, Spring Boot 3.5.11, JPA, PostgreSQL, Maven |
| [dndacademyfe](dndacademyfe/README.md) | Interfaccia Player e Master | Next.js 16.4.3, React 19.2.4, TypeScript, Tailwind CSS 4 |

JWT e BCrypt gestiscono l'autenticazione. Cloudinary ospita avatar e immagini di personaggi e PNG; SMTP supporta le email di benvenuto e recupero password.

## Percorso Player

Il login apre **Il tuo percorso**: la home propone di iniziare un'avventura o riprendere le campagne in corso, con statistiche e traguardi come riepilogo.

**Campagna → capitolo → attività richieste → completamento e ricompensa → capitolo successivo.**

L'iscrizione apre direttamente la campagna. I capitoli guidano tra storia, lezioni, quiz e combattimenti opzionali. Le attività aperte dalla campagna mantengono il collegamento di ritorno al capitolo. La biblioteca resta consultabile per studio e ripasso; le lezioni possono essere segnate come lette, anche senza un quiz.

Il personaggio è scelto tra quelli preparati dal Master per la campagna, anche nella preparazione dello scontro quando necessario. È consentita una scelta per campagna. I requisiti acquisiti e le ricompense restano salvati e consultabili; le campagne si riaprono quando vengono aggiunti capitoli da completare, conservando i progressi precedenti.

Nel combattimento il Player sceglie bersaglio e azione con arma o incantesimo. Il pulsante **Mostra l'azione di…** fa avanzare un singolo turno PNG; tiri, bersagli PNG, danni e cure vengono decisi dal backend. Gli aiutanti guaritori possono soccorrere gli alleati a 0 HP e curare i feriti con utilizzi limitati. Dopo la vittoria si torna al capitolo per completarlo.

Lo storico personale è paginato, inizialmente aperto e raggruppato per campagna e capitolo. Ogni tentativo mantiene esito e registro; il dettaglio è di sola lettura. Gli scontri aperti si possono riprendere dalla home, quando presenti nei risultati recenti, o dallo storico senza creare un nuovo tentativo.

## Area Master e account

Il Master entra in **Area Master** e può passare all'Area Player dal selettore del menu. La gestione segue le dipendenze dei contenuti: campagna e personaggi, lezioni e quiz, PNG e badge, capitoli e incontri. Gli incontri si configurano direttamente dal capitolo.

La sezione Utenti offre statistiche, ricerca e filtri e consente di assegnare o revocare il ruolo Master con conferma. Il proprio ruolo non è modificabile. La registrazione pubblica crea Player: il primo Master deve essere predisposto nell'ambiente, mentre i successivi possono essere promossi da un Master esistente.

**Profilo ed Esci sono nel menu apribile dall'avatar in alto.** La sidebar presenta gruppi distinti per ruolo e il riquadro del livello con la barra. Le etichette dei livelli sono Principiante, Intermedio e Avanzato in tutta l'interfaccia; la barra rappresenta il livello raggiunto su tre livelli.

Il profilo permette di aggiornare username ed email confermando la password attuale, caricare o rimuovere l'avatar e cambiare password. Il caricamento parte alla scelta di un'immagine valida e mostra uno stato di avanzamento; un errore conserva l'immagine precedente. I dati aggiornano subito anche la barra superiore.

I token identificano l'utente tramite l'ID immutabile: il cambio username conserva identità e progressi. Il cambio password invalida le sessioni precedenti e i link di recupero, e richiede un nuovo login. I badge automatici usano codici stabili, sono inizializzati all'avvio e non possono essere eliminati.

## Tour di primo avvio

Il prototipo guidato accompagna Player e Master tra pagine dimostrative interne all'app. Un box vicino al comando evidenziato indica l'azione richiesta; il resto della pagina è inerte. Il percorso avanza solo dopo l'azione o un salvataggio riuscito. Esci dal tour è sempre disponibile. I contenuti sono temporanei e non modificano dati reali. L'avvio è automatico al primo accesso e il menu dell'avatar permette di ricominciare; il Master può esplorare anche il percorso Player. La chiusura è ricordata per browser, account e ruolo. Dettagli: [Tour frontend](dndacademyfe/docs/tour-system.md).

## Navigazione e rotte

I percorsi principali restano `/dashboard`, `/campaigns`, `/lessons`, `/characters`, `/combat`, `/achievements`, `/profile` e `/admin`. `/combat` è lo storico; l'arena e la gestione incontri appartengono al capitolo:

- Player: `/campaigns/[campaignId]/chapters/[chapterId]/combat`.
- Master: `/admin/campaigns/[campaignId]/chapters/[chapterId]/encounter`.
- Ripresa: rotta dell'arena con `?combatId=...`.

I vecchi collegamenti con `campaignId` e `chapterId` nella query reindirizzano alle nuove rotte contestuali. Lezioni e quiz possono conservare quei parametri come contesto verificato di provenienza. Dettagli e comportamento mobile sono descritti in [Navigazione e percorso dell'utente](dndacademyfe/docs/navigation-flow.md).

## Avvio locale

Servono JDK 17 o compatibile, PostgreSQL, Node.js 20.9 o superiore e npm. Configurare database, JWT, SMTP e Cloudinary seguendo il [README backend](dndacademyBE/README.md#configurazione-e-avvio). Impostare `APP_FRONTEND_BASE_URL=http://localhost:3000` per CORS e collegamenti delle email.

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

Il backend crea o aggiorna le tabelle tramite Hibernate, ma database e schema devono già esistere e l'utente configurato deve avere i permessi necessari. Se in sviluppo si elimina anche `public`, ricreare lo schema prima dell'avvio. Una build non svuota né ricrea automaticamente il database. Dopo un reset con riutilizzo degli ID cambiare anche `JWT_SECRET` per invalidare i token dei vecchi account.

Su database vuoto vengono inizializzati i badge di sistema; account, campagne, lezioni, personaggi e incontri devono essere predisposti per il collaudo. La configurazione attuale usa `ddl-auto: update`: le migrazioni versionate restano un requisito della preparazione al rilascio.

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

- Le migrazioni versionate, la configurazione di rilascio e il collaudo dei servizi reali restano da completare prima della produzione.
- La ripresa al ricaricamento funziona con un URL contenente `combatId`. L'avvio di un nuovo tentativo non aggiunge ancora l'ID all'URL: ricaricare una rotta priva di ID riapre la preparazione; il tentativo salvato resta recuperabile dallo storico.
- I combattimenti sono individuali contro PNG: il party della campagna non implica sincronizzazione multiplayer in tempo reale.
- Gli HP dello scontro sono separati da quelli permanenti del personaggio; la strategia PNG rimane semplificata.

Il progetto ha finalità educative e di portfolio.
