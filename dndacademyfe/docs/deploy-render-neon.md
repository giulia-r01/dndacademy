# Deploy su Render, Neon e Vercel

Il backend usa Docker su Render, PostgreSQL è su Neon e il frontend Next.js su Vercel. Immagini e posta restano su Cloudinary e Gmail API. La configurazione locale con `.env.local` su `http://localhost:8081` rimane valida. Nessun servizio remoto viene creato o aggiornato dagli script del repository.

## Profilo e risorse backend

Su Render impostare `SPRING_PROFILES_ACTIVE=render`: il gruppo include automaticamente `prod`, mantenendo Flyway, Hibernate validate, origine frontend HTTPS e Gmail API. Il profilo riduce il pool Hikari a quattro connessioni, senza connessioni minime inattive o keepalive. Le connessioni non usate vengono ritirate dopo 60 secondi, più il controllo periodico del pool; quelle attive non vengono interrotte dal timeout di inattività.

Tomcat usa al massimo 32 thread, due thread minimi, 128 connessioni e una coda di attesa di 32 richieste. Il pool attende fino a 15 secondi per una connessione; il driver ha timeout di connessione di 10 secondi e socket di 30 secondi. Sono limiti operativi da verificare con il traffico reale.

Per il contenitore da 512 MB la configurazione JVM verificata è:

```text
JAVA_TOOL_OPTIONS=-XX:MaxRAMPercentage=50.0 -XX:InitialRAMPercentage=10.0 -XX:+UseSerialGC -XX:ReservedCodeCacheSize=64m -Xss512k -XX:+ExitOnOutOfMemoryError
```

Va impostata tra le variabili runtime di Render. Non impostare un heap fisso superiore alla memoria del contenitore. Il Dockerfile rimane riutilizzabile: non contiene segreti e conserva il proprio default generale, sovrascritto dalla variabile del servizio.

## Connessioni Neon

Creare un progetto e un database dedicati, scegliendo una regione vicina al backend. Usare due URL JDBC dello stesso database, senza username o password nell'URL:

```text
DB_URL=jdbc:postgresql://<endpoint-pooler>.neon.tech/<database>?sslmode=require&connectTimeout=10&socketTimeout=30
DB_MIGRATION_URL=jdbc:postgresql://<endpoint-diretto>.neon.tech/<database>?sslmode=require&connectTimeout=10&socketTimeout=30
DB_USERNAME=<ruolo-database>
DB_PASSWORD=<password-database>
```

Il primo URL usa il pooler per le richieste applicative. Flyway usa obbligatoriamente `DB_MIGRATION_URL`, senza il suffisso `-pooler`: le migrazioni richiedono operazioni di sessione che non vanno affidate al pooler in modalità transazione. I segnaposto vanno sostituiti con i valori reali dal pannello Neon. Conservare le credenziali soltanto nelle variabili del servizio.

La nuova installazione applica V1–V4. Questa branch non modifica lo schema né i checksum. Gli avvii successivi conservano i dati ed eseguono solo migrazioni mancanti. Non trasferire utenti o token di prova e non eseguire sul database nuovo lo script di conversione dei personaggi legacy.

## IP del chiamante

Impostare `APP_CLIENT_IP_SOURCE=render`. Per il servizio web pubblico Render, il resolver legge un unico `CF-Connecting-IP`, scritto e sovrascritto dal proxy Cloudflare secondo la documentazione Render. Non usa la prima voce di `X-Forwarded-For`, che può contenere dati inseriti dal chiamante. Header assente, ripetuto o non numerico produce 400: non c'è un ripiego silenzioso su una catena meno affidabile.

Questa modalità è valida solo per l'ingresso pubblico gestito da Render. Non esporre un accesso diretto alternativo al contenitore e non usarla per un servizio privato senza il medesimo proxy. In locale resta `remote`, che ignora gli header inoltrati; la modalità precedente `railway` è mantenuta per compatibilità. Prima dell'apertura verificare che il proprio indirizzo non sia sostituibile inviando header contraffatti.

## Sonde di salute

Su Render impostare **Health Check Path `/actuator/health/liveness`**. Questo GET pubblico restituisce solo lo stato del processo e la disponibilità ad accettare traffico: non apre connessioni JDBC e ignora un eventuale Bearer. Durante avvio/arresto o indisponibilità applicativa restituisce lo stato non disponibile.

`GET /actuator/health/readiness` rimane una verifica esplicita di app e database, da usare nel collaudo o nella diagnosi. Non collegarlo a una sonda continua su Render: le interrogazioni ripetute manterrebbero attivo Neon. Le API reali restano autenticate e una perdita del database viene gestita nelle richieste; non viene nascosta da una sonda che prova a riavviare continuamente il processo. Gli altri endpoint Actuator e i metodi diversi da GET restano protetti.

## Code e inattività

Email e rimozione avatar rimangono lavori persistenti nel database. Dopo il commit di un nuovo lavoro, un evento locale riattiva la relativa coda al prossimo ciclo del worker, normalmente entro 15 secondi. Un rollback non invia la notifica. Al termine del ciclo il worker legge la prossima scadenza persistita: i ritenti conosciuti mantengono il loro termine e una coda vuota non viene interrogata ogni 15 secondi.

La scansione di recupero di una coda senza lavori attesi avviene ogni 15 minuti (`app.background.idle-rescan`); un riavvio riparte subito dalla verifica del database. Il recupero copre notifiche perse e lavori creati da altre istanze. Una notifica arrivata durante una scansione non può essere sovrascritta dal risultato di coda vuota. Un guasto del database viene riprovato dopo 30 secondi, senza loop serrati. La pulizia dei record scaduti resta oraria.

La memoria locale delle scadenze è un'ottimizzazione, non la fonte dei dati: lease, ritenti e record restano nel database. Se il contenitore viene sospeso, i worker non eseguono lavori; alla riattivazione riprendono dai dati salvati. Non si garantisce esecuzione a un orario preciso durante la sospensione. Non configurare richieste artificiali per mantenere attivo il servizio.

## Frontend e attesa delle risposte

Vercel richiede `NEXT_PUBLIC_API_URL=https://<backend>.onrender.com` prima della build, senza `/api` o slash finale. Nessun segreto va nelle variabili pubbliche. Un cambio dell'URL richiede una nuova build.

Una richiesta API ancora in corso dopo tre secondi mostra un avviso accessibile, anche su mobile. L'avviso scompare quando finiscono tutte le richieste lente. La scadenza è di 120 secondi e rispetta anche l'annullamento richiesto dal chiamante. Errori di connessione e pagine HTML del proxy producono un messaggio italiano; non vengono mostrati come password errata. Solo un 401 autenticato relativo alla sessione corrente la termina.

Non sono introdotti reinvii automatici di POST, PATCH, PUT, DELETE o altre azioni: dopo un'interruzione resta necessario controllare l'esito prima di ripetere un'operazione. Non sono introdotte sonde periodiche dal browser quando non ci sono richieste.

## Impostazioni del deploy

| Servizio | Configurazione |
| --- | --- |
| Render | Web Service dal repository GitHub; Root Directory `dndacademyBE`; Dockerfile del backend; branch `main` dopo il merge dell'utente |
| Render | Nessun override dell'ENTRYPOINT; ascolto sulla variabile `PORT`; sonde sul percorso liveness |
| Backend | `SPRING_PROFILES_ACTIVE=render`, `APP_CLIENT_IP_SOURCE=render`, variabili JDBC, JWT, Cloudinary, Gmail e JVM sopra descritte |
| CORS e email | `APP_FRONTEND_BASE_URL` con l'origine HTTPS Vercel effettiva; niente wildcard |
| Neon | Database dedicato, TLS negli URL, connessioni runtime e migrazioni distinte |
| Vercel | Root Directory `dndacademyfe`, build Next.js, URL API impostato prima della compilazione |

Configurare i valori effettivi dei servizi prima del primo avvio applicativo e raccogliere i rispettivi URL dai pannelli. Poi verificare migrazioni, sonde, CORS e [primo Master](../../dndacademyBE/docs/FIRST_MASTER.md). Completare il consenso Google con homepage e privacy pubbliche, quindi provare il percorso completo con account distinti, email e immagini reali, inattività/risveglio, cancellazione account, backup e ripristino.

## Verifiche della branch

Controlli del 13 novembre 2026:

| Controllo | Esito |
| --- | --- |
| Backend e packaging nella build Docker Java 17 | 232 test superati |
| Configurazione URL frontend | 31 test superati |
| Suite browser completa con API simulate | 129 test superati |
| Lint, TypeScript e build Next.js | Superati |
| Runtime Docker con 512 MB, swap limitato a 512 MB e una CPU | Avvio e riavvio riusciti con render e prod |
| Memoria nei campioni del collaudo | Circa 338–344 MiB su 512 MiB |
| PostgreSQL temporaneo | Quattro migrazioni applicate e dati conservati dopo riavvio |
| Pool durante inattività con sole sonde liveness | Nessuna connessione JDBC rimasta aperta dopo il periodo di ritiro |
| IP nel collaudo locale del profilo render | Header mancante rifiutato, header previsto accettato, catena contraffatta ignorata |

La prova runtime usa credenziali fittizie, database dedicato e contenitori temporanei rimossi al termine; non modifica il database dell'utente né sostituisce il suo container locale. L'immagine di verifica ha tag `dndacademy-backend:render-check`. I domini dei provider email/immagini sono bloccati nella prova e nessun messaggio viene inviato.

I test delle code coprono notifiche dopo commit, rollback senza notifica, inattività senza query ripetute, scadenze dei ritenti, errore DB e notifica concorrente alla scansione. Il frontend copre attesa, errore HTML del proxy e timeout simulato senza reinvio. È stato reso preciso anche un test preesistente del selettore immagini PNG: Invio è indirizzato al pulsante con `locator.press`, mantenendo la verifica da tastiera.

I campioni di memoria non sono una prova di capacità sotto picco. Restano da verificare sulle piattaforme reali connessione TLS Neon e pooler, proxy Render, tempi di risveglio, consegna email, immagini e ripristino backup. Nessun commit, merge o deploy è stato eseguito durante questo intervento.

## Riferimenti

- [Render: servizio web e porta](https://render.com/docs/web-services), [Docker](https://render.com/docs/docker), [sonde](https://render.com/docs/health-checks).
- [Render: header del chiamante e proxy pubblico](https://render.com/articles/host-pocketbase-on-render#making-pocketbase-see-the-real-client-ip).
- [Neon: Flyway con connessione diretta](https://neon.com/docs/guides/flyway), [pooling](https://neon.com/docs/connect/connection-pooling), [applicazioni persistenti e sospensione](https://neon.com/blog/using-neons-auto-suspend-with-long-running-applications).
