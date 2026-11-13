# Verifica del main e percorso Railway/Vercel

Revisione del 10 novembre 2026. Frontend Next.js su Vercel, backend Spring Boot e PostgreSQL su Railway. Nessun servizio cloud è stato creato o collegato durante questa verifica. Nessun database applicativo è stato modificato.

## Esito

Il main può essere usato per preparare la preproduzione. Non è ancora pronto per l'apertura pubblica: servono configurazione di produzione, migrazioni e collaudo dei servizi reali. Il superamento dei test isolati non certifica il deploy.

## Pulizia eseguita

- Rimossi `public/file.svg`, `globe.svg`, `next.svg`, `vercel.svg` e `window.svg`: nessun riferimento nei sorgenti, residui del template.
- Esclusi `.tmp/` e `_frontend_analysis_export/` da Git, TypeScript ed ESLint. Gli archivi locali non sono stati cancellati.
- Aggiunto `.env.example` senza credenziali per documentare l'unica variabile pubblica del frontend.
- Conservati test, lockfile, Maven wrapper, documentazione e script dei vecchi database. Servono a riproducibilità e manutenzione; i test non entrano nel bundle browser e hanno dipendenze di sviluppo o scope Maven `test`.
- Conservati componenti e dati del tour: fanno parte della funzionalità di onboarding in produzione e non sono seed del database.

## Interventi necessari prima dell'apertura pubblica

| Area | Riscontro sul main | Intervento richiesto |
| --- | --- | --- |
| Schema PostgreSQL | Introdotti Flyway e V1; prima installazione e secondo avvio verificati dall'utente su PostgreSQL 17.5 locale, profilo `preprod` | Resta la verifica di dati applicativi inseriti e conservati al riavvio, poi il collaudo Railway; [procedura](../../dndacademyBE/docs/DATABASE_MIGRATIONS.md) |
| Ambiente | Introdotti `dev`/`preprod`/`prod`, log SQL disabilitato, file locale esterno escluso dalle risorse Maven | Su Railway attivare esplicitamente `prod` e configurare le variabili; completare e collaudare la restante configurazione di rilascio |
| Railway | Porta `${PORT:8080}` e readiness pubblico `GET /actuator/health/readiness`, con stato app e verifica DB; altri endpoint Actuator bloccati | Prova locale confermata dall'utente con `{"status":"UP"}`; impostare il percorso nel servizio Railway quando verrà creato; [procedura](../../dndacademyBE/docs/HEALTHCHECK.md) |
| CORS | Origine unica validata, localhost:3000 e 127.0.0.1:3000 nei soli profili locali, HTTPS esatta in `prod`; preflight prima di JWT e niente cookie cross-origin | Preflight locale confermato dall'utente: OPTIONS login con HTTP 200 e origine localhost:3000 consentita; restano configurazione Vercel e collaudo browser/cloud; [regole e test](../../dndacademyBE/docs/CORS.md) |
| Email | EmailServiceImpl usa soltanto JavaMailSender SMTP; mittente e timeout restano da configurare | Scegliere il servizio compatibile con Railway, verificare consegna e risposta uniforme del recupero password anche con guasti del provider |
| Errori | Errori previsti con stati espliciti e messaggi controllati; Spring MVC e sicurezza rispondono in JSON; 5xx generici e dettagli nei soli log | Test superati e prova locale confermata dall'utente: la rotta pubblica inesistente restituisce `{"message":"Risorsa non trovata."}`; [contratto](../../dndacademyBE/docs/ERROR_HANDLING.md) |
| Autenticazione pubblica | Quote per indirizzo e identità con contatori DB condivisi, V2, scadenza e 429/Retry-After; indirizzo locale distinto dall'ingress Railway | Test automatici superati; aggiornamento PostgreSQL locale V1→V2 e avvio confermati. Prova HTTP locale confermata dall'utente: 20 login non validi con 401 e ventunesimo con 429. Restano conservazione delle quote al riavvio e verifica del proxy su Railway; [scelte e procedura](../../dndacademyBE/docs/AUTH_RATE_LIMITS.md) |
| Docker | Aggiunti Dockerfile backend con build multistage Java 17 e Maven Wrapper, test durante verify, JRE finale con utente 10001:10001 e .dockerignore con credenziali escluse | Build e 187 test Java 17 superati; verificati utente e JAR senza credenziali/test/H2/DevTools. Primo avvio e ricreazione del container preprod con PostgreSQL e V1/V2 valide confermati dall'utente; readiness HTTP sulla porta 8081 UP anche dopo la ricreazione. Restano conservazione dei dati applicativi e collaudo completo; [procedura](../../dndacademyBE/docs/DOCKER.md). Frontend destinato alla build Next.js gestita da Vercel |
| Utente Spring predefinito | Esclusa la sola `UserDetailsServiceAutoConfiguration`; HTTP Basic e form login disabilitati, JWT e ruoli mantenuti | Riavvio locale confermato alle 14:21 del 10 novembre: nessun messaggio di password generata o servizio utenti in memoria; [motivazione e test](../../dndacademyBE/docs/AUTHENTICATION.md) |
| Sessioni database | Open Session in View disabilitato; transazioni mancanti aggiunte ai servizi e collezioni del combattimento copiate prima della risposta | Test senza transazione esterna e riavvio PostgreSQL locale superati; resta il collaudo applicativo completo; [dettagli](../../dndacademyBE/docs/PERSISTENCE_BOUNDARIES.md) |
| Primo Master | La registrazione crea sempre PLAYER; la promozione richiede già un MASTER | Definire una procedura controllata e una tantum per promuovere il proprio account verificato, senza registrazione pubblica del ruolo MASTER e senza password predefinite |
| Frontend | `NEXT_PUBLIC_API_URL` viene concatenata agli endpoint; la build può riuscire anche se manca | Validare la configurazione di build: origine HTTPS Railway, senza `/api` e senza slash finale; nessun segreto nelle variabili `NEXT_PUBLIC_*` |
| Operatività | Nessuna verifica dell'ambiente Railway/Vercel effettuata | Predisporre backup con prova di ripristino, consultazione log, monitoraggio e procedura di aggiornamento/rollback compatibile con lo schema |

Il file locale backend `env.properties` non è tracciato e non risulta nella cronologia Git consultata per quel percorso. Prima della revisione era escluso soltanto da una regola Git globale: aggiunta l'esclusione al `.gitignore` del backend per renderla riproducibile per altri cloni. Ora è escluso anche dalle risorse Maven: `dev` e `preprod` lo importano come file esterno, mentre `prod` non lo importa. Verificare il packaging con una build pulita per rimuovere copie eventualmente rimaste nei vecchi artefatti.

Non sono stati scelti un provider email o un piano Railway durante la revisione. La procedura per il primo Master è ancora da predisporre. Il readiness endpoint è implementato, testato su H2 e confermato localmente dall'utente con risposta `{"status":"UP"}`. L'impostazione del percorso e il collaudo su Railway restano da effettuare. La sonda Railway controlla l'attivazione del deploy, non offre monitoraggio continuo dopo l'avvio.

## Database iniziale

Scelta consigliata per questo progetto: PostgreSQL Railway nuovo, separato dallo sviluppo, da popolare dal Master dopo il deploy di collaudo. Non trasferire utenti, token, progressi o combattimenti di prova.

La migrazione manuale [2026-11-10-character-templates.sql](../../dndacademyBE/docs/migrations/2026-11-10-character-templates.sql) serve solo a convertire i personaggi dei database precedenti. Non crea l'intero schema e non serve sul nuovo database. Mantenerla nel repository permette di conservare i dati locali quando necessario; non è applicata automaticamente.

La migrazione Flyway `V1__initial_schema.sql` ha uno scopo distinto: crea tutte le tabelle vuote in modo ripetibile e non le azzera agli avvii successivi. Oltre ai test H2, l'utente ha verificato prima installazione e secondo avvio su PostgreSQL 17.5 locale: V1 risulta riuscita e al riavvio Flyway non esegue nuove migrazioni. Restano la prova con dati applicativi e il collaudo Railway. I badge di sistema sono inizializzati dal backend; campagne e modelli dei personaggi saranno inseriti dal Master.

Se si vuole conservare Pietraluce, preparare separatamente un'esportazione dei soli contenuti con le relative dipendenze. Non improvvisare la copia di singole tabelle: capitoli, quiz, risposte, incontri e personaggi hanno riferimenti reciproci. Le immagini Cloudinary devono essere accessibili anche dall'ambiente finale e non vanno eliminate come risorse di test se ancora referenziate.

## Configurazione cloud da predisporre

| Servizio | Impostazione |
| --- | --- |
| Vercel | Root Directory `dndacademyfe`, framework Next.js, installazione dal lockfile e build `npm run build`; nessun export statico |
| Vercel | `NEXT_PUBLIC_API_URL=https://<backend-railway>` impostata prima della build, senza `/api`; una modifica richiede un nuovo deploy |
| Railway backend | Root Directory `/dndacademyBE`, Dockerfile con build Maven/Java 17 e avvio JAR; nessun override del comando di avvio; Healthcheck Path `/actuator/health/readiness` sulla porta `PORT` |
| Railway database | PostgreSQL nuovo nello stesso ambiente del backend, collegamento privato; il driver richiede un URL JDBC `jdbc:postgresql://...`, non il solo URI `postgresql://...` |
| Railway variabili attuali | `APP_CLIENT_IP_SOURCE=railway`, `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET` casuale di almeno 32 byte, `JWT_EXPIRATION` in millisecondi, `APP_FRONTEND_BASE_URL` con origine HTTPS Vercel |
| Immagini backend | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, mai nel frontend |
| Email backend | Le attuali `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD` valgono per SMTP. Le variabili dell'eventuale provider HTTPS andranno definite con l'implementazione; non sono già supportate |

Il profilo `prod` è ora presente e va attivato su Railway con `SPRING_PROFILES_ACTIVE=prod`; Flyway gestisce lo schema, Hibernate lo valida e i segreti arrivano dall'ambiente. Il default `dev` conserva il comportamento del vecchio database locale e non va usato per un rilascio. La presenza del profilo non conclude gli interventi sopra né il collaudo cloud. Le preview Vercel non devono scrivere sul database di produzione; usare un backend di collaudo separato o limitarne esplicitamente l'accesso.

## Sequenza di rilascio

1. Completare e testare gli interventi necessari, inclusa la creazione dello schema su PostgreSQL reale.
2. Scegliere piano Railway, provider email e URL frontend definitivo; registrare le variabili nei pannelli, senza committare segreti.
3. Creare un ambiente di collaudo con database nuovo, predisporre i due progetti dal monorepo e verificare i rispettivi URL e CORS.
4. Avviare il backend, verificare migrazioni e salute e predisporre il primo Master. Eseguire la build Vercel con l'URL backend corretto.
5. Inserire una campagna da Master e provarla con due Player: scelta dello stesso modello, storia, lezione, quiz, sconfitta/vittoria, ripresa e nuovo tentativo, completamento e badge.
6. Verificare login al primo tentativo, cambio password con revoca delle altre sessioni, reset ricevuto per email, immagini, tour e uso da mobile.
7. Provare riavvio/redeploy senza perdita dei dati e ripristino di un backup in un database separato.
8. Dare il via libera all'apertura pubblica soltanto dopo questi controlli. Un rollback del solo codice non annulla una migrazione: verificare la compatibilità prima di applicare aggiornamenti futuri.

## Verifiche della revisione

- Lint, TypeScript e build Next.js sul main: superati.
- Backend dopo Flyway, JWT, OSIV, healthcheck, CORS, gestione errori e limiti autenticazione: 187 test, nessun errore o fallimento; database H2 isolato. Ricontrollato il precedente passaggio sugli errori. Coperti inoltre contatori condivisi, prima creazione/incrementi concorrenti, scadenza senza estensione sui rifiuti, rollback, pulizia, header IP, 429/Retry-After/CORS e 503 su guasto; migrazione V1→V2 con dati preesistenti conservati. Suite completa e packaging superati; nessuna impostazione cloud effettuata. La prova PostgreSQL/ingress Railway dei nuovi contatori resta da fare.
- `npm audit --omit=dev`: nessuna vulnerabilità nota restituita dal registro al momento del controllo. Non è un audit completo di sicurezza né una verifica delle dipendenze Java.
- Suite UI sulla build locale di produzione, con API simulate: 119/120 superati al primo passaggio. L'unico fallimento era un'attesa del test di scelta del personaggio: controllava le caratteristiche, già visibili nel modello prima della scelta, invece del completamento della selezione. Corretta l'attesa dell'abilitazione del pulsante di avvio e rieseguito quel test: superato. Gli altri 119 test non sono stati ripetuti dopo la correzione del solo test; nessuna modifica al comportamento applicativo.
- Collaudo locale confermato dall'utente il 10 novembre 2026: prima installazione su `dndacademy_preprod` con V1 riuscita; secondo avvio alle 14:12 con profilo `preprod`, PostgreSQL 17.5, migrazione validata, versione corrente 1 e nessuna migrazione necessaria. L'applicazione avvia correttamente. Quel log era precedente alle correzioni JWT e OSIV; i risultati successivi sono indicati sotto.
- Non eseguiti: deploy cloud, percorso applicativo completo su PostgreSQL e prova dei dati conservati al riavvio, invio email reale, upload Cloudinary reale, recupero di un backup o scansione completa delle dipendenze Java.

Verifica successiva confermata dal log dell'utente alle 14:21 del 10 novembre 2026: profilo `preprod`, PostgreSQL 17.5 su `dndacademy_preprod`, V1 validata e schema aggiornato, applicazione avviata sulla porta 8080. Non compaiono più i messaggi sulla password generata o su `inMemoryUserDetailsManager`. Quel log mostrava ancora l'avviso `open-in-view`, poi disabilitato dopo la revisione dei servizi e la correzione delle liste del combattimento. Non è stata modificata V1 né lo schema del database.

Riavvio dopo la correzione OSIV confermato dal log dell'utente alle 14:35 del 10 novembre 2026: profilo `preprod`, PostgreSQL 17.5, V1 validata senza nuove migrazioni, Tomcat sulla porta 8080 e avvio riuscito. Non compaiono l'avviso `open-in-view`, la password generata o il servizio utenti in memoria. Questa verifica conferma l'avvio locale, non il percorso applicativo completo o la disponibilità dei servizi cloud.

Verifica successiva del 13 novembre 2026 alle 10:25: profilo `preprod`, database `dndacademy_preprod` su PostgreSQL 17.5, due migrazioni validate e applicazione della sola V2 (`auth rate limits`) da versione 1 a versione 2. Hibernate inizializzato e backend avviato sulla porta 8080. Il log conferma migrazione e avvio; non verifica ancora risposte 429, conservazione delle quote al riavvio o comportamento dell'ingress Railway.

Prova HTTP locale successiva confermata dall'utente: 21 richieste di login con lo stesso username inesistente; prime 20 risposte HTTP 401, ventunesima HTTP 429. Verificato il limite per identità su PostgreSQL reale. Il risultato riportato non include header Retry-After o corpo della risposta e non verifica ancora scadenza, persistenza al riavvio, concorrenza PostgreSQL o indirizzi dell'ingress Railway.

Avvio Docker confermato dal log dell'utente del 13 novembre 2026 alle 10:13 UTC (11:13 Europe/Rome): JAR eseguito come utente `app`, Java 17.0.21, profilo `preprod`, PostgreSQL 17.5 su `host.docker.internal:5432/dndacademy_preprod`. Flyway valida due migrazioni e riconosce versione 2 già aggiornata, senza applicarne altre; Hibernate inizializzato e Tomcat avviato sulla porta interna 8080, pubblicata localmente su 8081. Questa prova conferma avvio e connessione, non ancora readiness HTTP, conservazione dei dati dopo un riavvio del container o funzionalità complete.

Successiva verifica HTTP Docker confermata dall'utente: `Invoke-RestMethod http://localhost:8081/actuator/health/readiness` restituisce `status: UP`. Verificati inoltro porta 8081→8080 e readiness con connessione al database; non è una prova dei percorsi autenticati o dei servizi email/immagini.

Ricreazione Docker confermata dal log dell'utente del 13 novembre 2026 alle 10:18 UTC (11:18 Europe/Rome), seguito da readiness UP sulla porta 8081: Java 17.0.21, profilo preprod, stesso database PostgreSQL, entrambe le migrazioni valide, versione corrente 2 e nessuna migrazione necessaria. Il nuovo container si avvia correttamente. Non è ancora verificata con questa prova la conservazione di account, contenuti o quote specifiche tra container.

## Riferimenti ufficiali consultati


- [Spring Boot 3.5: inizializzazione del database](https://docs.spring.io/spring-boot/3.5/how-to/data-initialization.html).
- [Railway: monorepo](https://docs.railway.com/deployments/monorepo), [healthcheck e porta](https://docs.railway.com/deployments/healthchecks), [restrizioni SMTP](https://docs.railway.com/networking/outbound-networking).
- [Vercel: monorepo](https://vercel.com/docs/monorepos), [variabili d'ambiente](https://vercel.com/docs/environment-variables).
- Guide della versione Next.js installata: `node_modules/next/dist/docs/01-app/01-getting-started/17-deploying.md` e `01-app/02-guides/environment-variables.md`.
