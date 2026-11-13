# Preparazione Railway e Vercel

Stato aggiornato al 13 novembre 2026. Il codice è preparato per il deploy di collaudo; l'apertura pubblica richiede ancora la configurazione e le prove sui servizi reali. Commit, merge, push e deploy restano a cura dell'utente.

## Stato corrente

| Area | Implementato e verificato localmente | Da completare nel collaudo |
| --- | --- | --- |
| Database | Flyway V1–V4, Hibernate validate in preprod/prod; installazione e aggiornamenti verificati su database isolati | PostgreSQL Railway nuovo; verifica dei dati conservati dopo riavvio e redeploy |
| Docker | Build Java 17 con Maven verify, JRE finale e utente 10001:10001; segreti esclusi dal contesto e dal JAR | Avvio con configurazione prod e servizi cloud |
| Readiness | GET pubblico `/actuator/health/readiness`, solo stato app/DB; risposta UP confermata anche nel Docker locale | Impostare Healthcheck Path su Railway; la sonda non verifica Gmail o Cloudinary |
| Sicurezza | JWT, versionamento sessioni, BCrypt, ruoli, limiti autenticazione persistenti e JSON di errore in italiano | Verificare IP del proxy Railway, quote dopo riavvio e permessi tra account reali |
| CORS | Origini esatte; localhost solo nei profili locali; frontend senza cookie cross-origin | Impostare l'origine Vercel e verificare preflight/richieste dal browser |
| Frontend | Build e avvio richiedono `NEXT_PUBLIC_API_URL`; su Vercel HTTPS non locale obbligatorio, senza `/api` o slash finale | Impostare la variabile prima della build; preview separate dal database pubblico |
| Email | Gmail API HTTPS, OAuth, coda V3, ritenti e timeout; benvenuto e reset completo confermati localmente dall'utente | Branding e consenso Google definitivi, nuovo refresh token, rinnovo dopo scadenza e consegna cloud |
| Primo Master | Script manuale con ID, username/email e assenza di Master, verificato su PostgreSQL temporaneo | Registrare e verificare il proprio account nel cloud, poi eseguire la procedura |
| Eliminazione account | Password/conferma, rimozione dei dati, trasferimento contenuti e pulizia persistente dell'avatar V4; verificati anche su PostgreSQL | Applicare V4 al Docker locale aggiornato; provare la pulizia con Cloudinary reale |
| Privacy | `/privacy` pubblica, titolare Giulia Rizzo, Italia, contatto dnd.academy.team@gmail.com; link da home, registrazione e area autenticata | Confermare regioni, accordi fornitori, conservazione di log/backup e gestione delle richieste |
| Operatività | Procedure documentate e nessun seed di account o campagne nelle migrazioni | Backup con ripristino su DB separato, monitoraggio e procedura di aggiornamento/rollback |

L'utente ha confermato avvio PostgreSQL locale fino a V3, readiness, limiti login e percorso email reale. Queste prove non equivalgono a un deploy cloud. V4 richiede il backend aggiornato: ricostruire e ricreare il container conservando lo stesso database, senza reset.

## Configurazione prevista

| Servizio | Impostazione |
| --- | --- |
| Vercel | Root Directory `dndacademyfe`, framework Next.js, installazione da lockfile, `npm run build`; nessun export statico |
| Vercel | `NEXT_PUBLIC_API_URL=https://<backend-railway>` prima della build; una modifica richiede una nuova compilazione |
| Railway backend | Root Directory `/dndacademyBE`, Dockerfile, avvio del JAR senza override Maven; `SPRING_PROFILES_ACTIVE=prod` |
| Railway database | PostgreSQL nuovo nello stesso ambiente; collegamento privato e `DB_URL` in formato `jdbc:postgresql://...` |
| Backend | `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET` casuale di almeno 32 byte, `JWT_EXPIRATION` in millisecondi, `APP_FRONTEND_BASE_URL` con origine HTTPS Vercel, `APP_CLIENT_IP_SOURCE=railway` |
| Immagini | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` nel solo backend; risorse separate dai test quando necessario |
| Email | `MAIL_FROM`, `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`; prod impone Gmail API. SMTP resta un'opzione locale |

`env.properties`, `.env.local` e `.env.docker.local` sono file locali ignorati, non artefatti da pubblicare. Le variabili `NEXT_PUBLIC_*` sono visibili nel browser e non devono contenere segreti. Il profilo dev conserva il comportamento del vecchio database locale e non va usato per il rilascio.

## Database iniziale

Scelta concordata: database Railway vuoto, popolato dall'Area Master dopo il deploy di collaudo. Flyway crea le tabelle e conserva i dati agli avvii successivi; il backend inizializza solo i badge di sistema. Non trasferire utenti, token o progressi di prova.

Lo script manuale dei [personaggi legacy](../../dndacademyBE/docs/migrations/2026-11-10-character-templates.sql) serve solo ai database precedenti e non si esegue sul nuovo database. Per conservare Pietraluce preparare separatamente un'esportazione dei contenuti con tutte le dipendenze, senza copiare singole tabelle o cancellare immagini ancora referenziate. La [campagna documentata](campaigns/il-faro-di-pietraluce.md) permette anche l'inserimento manuale.

## Sequenza di rilascio

1. Controllare le modifiche e completare commit, push e merge a cura dell'utente.
2. Scegliere il piano Railway e creare backend e PostgreSQL di collaudo con le variabili necessarie. Nessuna gratuità illimitata o copertura continua dei costi è garantita da questa guida.
3. Verificare migrazioni V1–V4, readiness e riavvio; predisporre il frontend Vercel con l'URL backend corretto e allineare CORS.
4. Registrare il proprio account ed eseguire la [procedura del primo Master](../../dndacademyBE/docs/FIRST_MASTER.md).
5. Pubblicare homepage e privacy realmente raggiungibili; completare Branding e requisiti Google, inclusa la proprietà degli URL. Non assumere che il sottodominio condiviso Vercel sia automaticamente sufficiente. Finalizzare OAuth e provare le email cloud.
6. Inserire una campagna e provarla con due Player: stesso modello disponibile, storia, lezione, quiz, sconfitta/vittoria, ripresa, completamento e badge. Provare anche login, cambio password, immagini, tour, cancellazione account con trasferimento e mobile.
7. Verificare conservazione dei dati dopo redeploy e ripristino di un backup su un database separato. Completare conservazione e accordi descritti nella [guida privacy](privacy-rilascio.md).
8. Aprire il servizio al pubblico solo dopo il collaudo. Un rollback del codice non annulla una migrazione: verificarne prima la compatibilità.

## Documenti operativi

[Docker](../../dndacademyBE/docs/DOCKER.md) · [Migrazioni](../../dndacademyBE/docs/DATABASE_MIGRATIONS.md) · [Readiness](../../dndacademyBE/docs/HEALTHCHECK.md) · [CORS](../../dndacademyBE/docs/CORS.md) · [JWT](../../dndacademyBE/docs/AUTHENTICATION.md) · [Quote](../../dndacademyBE/docs/AUTH_RATE_LIMITS.md) · [Gmail](../../dndacademyBE/docs/GMAIL_API.md) · [Eliminazione account](../../dndacademyBE/docs/ACCOUNT_DELETION.md) · [Pulizia e verifica finale](revisione-finale-premerge.md).

I resoconti di ottobre nel backend sono storici; non sono istruzioni correnti per il rilascio. La verifica finale raccoglie gli esiti aggiornati senza confonderli con i precedenti collaudi.

## Riferimenti ufficiali

- [Railway: monorepo](https://docs.railway.com/deployments/monorepo), [healthcheck](https://docs.railway.com/deployments/healthchecks), [restrizioni SMTP](https://docs.railway.com/networking/outbound-networking).
- [Vercel: monorepo](https://vercel.com/docs/monorepos), [variabili d'ambiente](https://vercel.com/docs/environment-variables).
- [Google: Branding OAuth](https://support.google.com/cloud/answer/15549049?hl=it), [verifica degli URL](https://support.google.com/cloud/answer/13464321?hl=it).
- Guide della versione Next.js installata in `node_modules/next/dist/docs/` per configurazione, ambiente e distribuzione.
