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
| Schema PostgreSQL | `application.yaml` usa `ddl-auto: update`; non ci sono Flyway/Liquibase o una migrazione iniziale | Introdurre una baseline versionata per il nuovo database e Hibernate in `validate` in produzione; provare installazione vuota e successivo riavvio senza modifiche ai dati |
| Ambiente | Nessun profilo di produzione; SQL abilitato e import opzionale di `classpath:env.properties` | Separare sviluppo/produzione; usare solo variabili cloud per i segreti, evitare file locali nell'artefatto e disabilitare il log SQL in produzione |
| Railway | Porta fissa 8080; nessun healthcheck pubblico dedicato | Leggere `${PORT:8080}` e aggiungere un endpoint di salute con risposta minima e verifica DB; configurare lo stesso percorso nel deploy |
| CORS | Sono presenti origini localhost fisse oltre al frontend configurato | Consentire esplicitamente l'origine HTTPS di produzione; tenere localhost nel solo ambiente di sviluppo, senza wildcard per tutti i progetti Vercel |
| Email | `EmailServiceImpl` usa soltanto `JavaMailSender` SMTP; nessun mittente esplicito o timeout SMTP configurato | Decidere il servizio: API HTTPS per Railway Free/Trial/Hobby, oppure SMTP su piano compatibile; configurare mittente e timeout e verificare benvenuto e reset |
| Errori | Il gestore di `RuntimeException` restituisce `ex.getMessage()` al client e risponde sempre 400 | Separare errori applicativi attesi da errori imprevisti; risposta generica 500 per questi ultimi e dettagli nei soli log, evitando SQL/configurazione nelle risposte |
| Autenticazione pubblica | Login, registrazione e recupero password non hanno limitazione delle richieste nel codice | Introdurre una protezione contro tentativi ripetuti e abuso di invio email, considerando il proxy Railway e l'eventuale numero di istanze |
| Primo Master | La registrazione crea sempre PLAYER; la promozione richiede già un MASTER | Definire una procedura controllata e una tantum per promuovere il proprio account verificato, senza registrazione pubblica del ruolo MASTER e senza password predefinite |
| Frontend | `NEXT_PUBLIC_API_URL` viene concatenata agli endpoint; la build può riuscire anche se manca | Validare la configurazione di build: origine HTTPS Railway, senza `/api` e senza slash finale; nessun segreto nelle variabili `NEXT_PUBLIC_*` |
| Operatività | Nessuna verifica dell'ambiente Railway/Vercel effettuata | Predisporre backup con prova di ripristino, consultazione log, monitoraggio e procedura di aggiornamento/rollback compatibile con lo schema |

Il file locale backend `env.properties` non è tracciato e non risulta nella cronologia Git consultata per quel percorso. Prima della revisione era escluso soltanto da una regola Git globale: aggiunta l'esclusione al `.gitignore` del backend per renderla riproducibile per altri cloni. Non basta ignorare un file per impedirne l'inclusione nelle risorse Maven di una build locale: anche il packaging deve escluderlo o la configurazione locale deve stare fuori dal classpath.

Non sono stati scelti un provider email o un piano Railway durante la revisione. Il percorso per il primo Master e il healthcheck descritti sopra sono requisiti da implementare, non endpoint già disponibili.

## Database iniziale

Scelta consigliata per questo progetto: PostgreSQL Railway nuovo, separato dallo sviluppo, da popolare dal Master dopo il deploy di collaudo. Non trasferire utenti, token, progressi o combattimenti di prova.

La migrazione manuale [2026-11-10-character-templates.sql](../../dndacademyBE/docs/migrations/2026-11-10-character-templates.sql) serve solo a convertire i personaggi dei database precedenti. Non crea l'intero schema e non serve sul nuovo database. Mantenerla nel repository permette di conservare i dati locali quando necessario; non è applicata automaticamente.

La futura migrazione iniziale avrà uno scopo distinto: creare tutte le tabelle vuote in modo ripetibile. Non deve azzerarle a ogni avvio. I badge di sistema sono già inizializzati dal backend; campagne e modelli dei personaggi saranno inseriti dal Master.

Se si vuole conservare Pietraluce, preparare separatamente un'esportazione dei soli contenuti con le relative dipendenze. Non improvvisare la copia di singole tabelle: capitoli, quiz, risposte, incontri e personaggi hanno riferimenti reciproci. Le immagini Cloudinary devono essere accessibili anche dall'ambiente finale e non vanno eliminate come risorse di test se ancora referenziate.

## Configurazione cloud da predisporre

| Servizio | Impostazione |
| --- | --- |
| Vercel | Root Directory `dndacademyfe`, framework Next.js, installazione dal lockfile e build `npm run build`; nessun export statico |
| Vercel | `NEXT_PUBLIC_API_URL=https://<backend-railway>` impostata prima della build, senza `/api`; una modifica richiede un nuovo deploy |
| Railway backend | Root Directory `dndacademyBE`, Java 17, build Maven e avvio del JAR; percorso di salute dopo la sua implementazione |
| Railway database | PostgreSQL nuovo nello stesso ambiente del backend, collegamento privato; il driver richiede un URL JDBC `jdbc:postgresql://...`, non il solo URI `postgresql://...` |
| Railway variabili attuali | `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET` casuale di almeno 32 byte, `JWT_EXPIRATION` in millisecondi, `APP_FRONTEND_BASE_URL` con origine HTTPS Vercel |
| Immagini backend | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, mai nel frontend |
| Email backend | Le attuali `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD` valgono per SMTP. Le variabili dell'eventuale provider HTTPS andranno definite con l'implementazione; non sono già supportate |

Il profilo `prod` e i comandi/configurazioni di rilascio saranno definiti e collaudati con gli interventi sopra. Non è sufficiente impostare `SPRING_PROFILES_ACTIVE=prod` oggi: il relativo file non esiste ancora. Le preview Vercel non devono scrivere sul database di produzione; usare un backend di collaudo separato o limitarne esplicitamente l'accesso.

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
- Backend: 101 test, nessun errore o fallimento; database H2 isolato.
- `npm audit --omit=dev`: nessuna vulnerabilità nota restituita dal registro al momento del controllo. Non è un audit completo di sicurezza né una verifica delle dipendenze Java.
- Suite UI sulla build locale di produzione, con API simulate: 119/120 superati al primo passaggio. L'unico fallimento era un'attesa del test di scelta del personaggio: controllava le caratteristiche, già visibili nel modello prima della scelta, invece del completamento della selezione. Corretta l'attesa dell'abilitazione del pulsante di avvio e rieseguito quel test: superato. Gli altri 119 test non sono stati ripetuti dopo la correzione del solo test; nessuna modifica al comportamento applicativo.
- Non eseguiti: deploy cloud, test PostgreSQL reale, invio email reale, upload Cloudinary reale, recupero di un backup o scansione completa delle dipendenze Java.

## Riferimenti ufficiali consultati

- [Spring Boot 3.5: inizializzazione del database](https://docs.spring.io/spring-boot/3.5/how-to/data-initialization.html).
- [Railway: monorepo](https://docs.railway.com/deployments/monorepo), [healthcheck e porta](https://docs.railway.com/deployments/healthchecks), [restrizioni SMTP](https://docs.railway.com/networking/outbound-networking).
- [Vercel: monorepo](https://vercel.com/docs/monorepos), [variabili d'ambiente](https://vercel.com/docs/environment-variables).
- Guide della versione Next.js installata: `node_modules/next/dist/docs/01-app/01-getting-started/17-deploying.md` e `01-app/02-guides/environment-variables.md`.
