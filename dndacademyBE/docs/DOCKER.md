# Docker del backend: build e collaudo

Il backend Spring Boot viene distribuito con `dndacademyBE/Dockerfile`. Il frontend continua a essere compilato da Vercel come progetto Next.js; non richiede un container per il deploy previsto. PostgreSQL rimane un servizio separato: il database di produzione sarà su Railway, senza dati persistenti nel filesystem del backend.

## Scelte

- Build in due fasi con Eclipse Temurin **Java 17**, coerente con `java.version` nel POM. Il Java 21 installato sul PC non viene usato nella build Docker.
- Maven arriva dal Wrapper già versionato (`.mvn/wrapper/maven-wrapper.properties`), senza una seconda versione indipendente. Il Wrapper viene normalizzato a LF per i checkout Windows.
- La build esegue **verify**, inclusi i test: non usa `skipTests`. Surefire carica la configurazione di test isolata con H2, senza importare credenziali o contattare PostgreSQL, SMTP o Cloudinary dell'app. Nessun segreto è richiesto come build argument.
- Cache BuildKit per Maven, condivisa con lock. Il primo download può richiedere diversi minuti; le build successive riusano dipendenze e layer. La compilazione non dipende da un JAR già presente sul PC.
- Immagine finale con JRE e solo JAR applicativo; sorgenti, Maven, classi di test e cache restano nella fase di build. I test sono necessari nel contesto di build, ma non vengono copiati nell'immagine finale.
- Utente **10001:10001**, senza privilegi di root; JAR di sola lettura. L'app può usare `/tmp` per i caricamenti temporanei, ma immagini e dati permanenti restano nei servizi esterni.
- `SPRING_PROFILES_ACTIVE=prod` come default del container: evitare di avviare per errore Hibernate `update`. Un test locale può sovrascriverlo esplicitamente con `preprod`.
- `JAVA_TOOL_OPTIONS` imposta heap massimo al 60% della memoria disponibile al container e uscita del processo in caso di OutOfMemoryError. Il resto serve a metaspace, thread, librerie e memoria nativa: il limite non garantisce da solo memoria sufficiente. Dimensionare il servizio dopo aver misurato consumo e carico; la variabile può essere sovrascritta a runtime mantenendo le opzioni desiderate.
- ENTRYPOINT in forma exec: Java riceve direttamente il segnale di arresto. `EXPOSE 8080` è metadato; Spring ascolta sulla variabile **PORT** fornita a runtime, con default 8080.
- `.dockerignore` usa una lista di inclusione: invia soltanto Wrapper, POM e sorgenti necessari. Esclude anche `env.properties`, `.env*`, chiavi e output eventualmente presenti nei sorgenti. L'esclusione Maven del file locale resta una seconda protezione.

Le immagini base hanno tag Java/OS espliciti, non `latest`. Il tag `17-*-jammy` può ricevere aggiornamenti: usare `--pull` nella build di rilascio e conservare il digest dell'immagine risultante. Per ricreare esattamente un rilascio conservare anche l'immagine nel registro e i digest delle basi usate; il solo tag non identifica una build immutabile. Non pubblicare l'immagine su Docker Hub per questa prova: Railway potrà compilarla dal repository.

## Verifica eseguita il 13 novembre 2026

Build locale `docker build --pull --progress=plain -t dndacademy-backend:preprod .` riuscita: **187 test, zero fallimenti/errori**, Maven verify e packaging completati nel container con Java 17. L'immagine risultante è `linux/amd64`, utente `10001:10001`, ENTRYPOINT Java diretto. Esecuzione di `java -version` senza rete conferma Temurin **17.0.21+9**. Il JAR estratto da un container temporaneo creato soltanto per l'ispezione contiene V1/V2 e non contiene `env.properties`, `.env*`, classi di test, H2 o DevTools. Il container di ispezione è stato rimosso; l'app non è stata avviata e nessun database applicativo è stato contattato.

Il digest della manifest list locale è `sha256:9740e4dd7c245a69d43982bb3a4b80deedbb1dd8099ad68267c13eb1d963fe78`. La sola build e la prova Java non verificano avvio Spring Boot o servizi esterni; le successive prove locali sono registrate sotto. Non è stato eseguito alcun push dell'immagine o deploy.

Successivamente l'utente ha avviato il container con profilo `preprod`, variabili da `.env.docker.local` e collegamento al PostgreSQL Windows tramite `host.docker.internal:5432/dndacademy_preprod`. Il log del 13 novembre alle 10:13 UTC conferma Java 17.0.21, esecuzione come utente `app`, V1/V2 valide, versione schema 2 senza migrazioni da applicare e avvio di Tomcat. Il readiness sulla porta pubblicata `8081` restituisce `UP`.

L'utente ha poi arrestato e ricreato il container con lo stesso comando. Il secondo log, alle 10:18 UTC, conferma lo stesso database e schema 2 aggiornato senza nuove migrazioni; il readiness torna `UP`. Avvio, connessione, ricreazione del container e raggiungibilità HTTP sono verificati localmente. Restano la prova di conservazione di contenuti/account/quote specifici, i percorsi autenticati, email, upload e collaudo Railway/Vercel. Non è stato ancora collaudato il container con profilo `prod` sui servizi cloud.

## Collaudo storico Gmail API e V3

La successiva build con Gmail API e coda email è riuscita con **211 test Java 17, zero fallimenti/errori**. La nuova manifest list locale è `sha256:aa81bb0128180fa1c67ad14db32a710bb2df22d1b8caa288877beb1f29187e98`; il tag `dndacademy-backend:preprod` indicava questa immagine al momento di quella prova. Una build non sostituisce un container già in esecuzione: serve una ricreazione per usare la nuova immagine.

La nuova immagine contiene V3 per la coda. Per attivare Gmail API nel collaudo aggiungere `MAIL_PROVIDER=gmail-api`, `MAIL_FROM`, `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN` al file locale, dopo aver completato il consenso del mittente. In `prod` Gmail API è imposta e SMTP non è accettato. La password SMTP non è necessaria al trasporto API. In `preprod`, senza la selezione esplicita, resta disponibile SMTP per il collaudo locale esistente. Variabili, procedura Google e limiti in [Gmail API](GMAIL_API.md).

Gli avvii PostgreSQL descritti nella prima sezione riguardano la versione V2 precedente. Successivamente l'utente ha ricreato il container con Gmail API: V3 applicata sul database locale, avvio e readiness UP sulla porta 8081 confermati. Sono riusciti registrazione con benvenuto ricevuto e percorso completo di recupero password dal frontend collegato alla porta 8081, fino al login con nuova password. La build non ha inviato email: queste prove reali sono state eseguite dall'utente. Restano configurazione OAuth finale (attualmente Testing) e collaudo Railway/Vercel. Nessun reset del database è stato necessario.

## Versione corrente: V4 e cancellazione account

Il codice corrente comprende V1–V4 e 218 test backend. Il Docker locale collaudato dall’utente fino a V3 va ricostruito e ricreato per includere la cancellazione account e la coda di pulizia avatar. Flyway applica solo V4 su quel database, senza reset. Le prove con 187/211 test riportate sopra sono storiche; per i risultati dell’ultima revisione usare la [verifica finale](../../dndacademyfe/docs/revisione-finale-premerge.md).

## Primo passo: costruzione locale

Docker Desktop deve essere avviato con motore Linux. L'utente ha confermato Client/Server funzionanti e `docker run --rm hello-world` riuscito. In PowerShell entrare nella cartella backend:

```powershell
Set-Location 'C:\Users\Utente\Desktop\progetti-personali\dndacademy\dndacademyBE'
docker build --pull --progress=plain -t dndacademy-backend:preprod .
```

Il punto finale è il contesto **dndacademyBE**, non la radice del monorepo. La build non avvia il backend e non modifica il database di collaudo. Non passare `env.properties` o credenziali come build argument. Attendere il completamento con esportazione/tag dell'immagine e verificare i test: un avviso o una stack trace di un caso negativo non equivale da solo a un test fallito; conta l'esito Maven e del comando Docker.

Controlli successivi, dopo una build riuscita:

```powershell
docker image inspect dndacademy-backend:preprod --format '{{.Config.User}}'
docker run --rm --entrypoint java dndacademy-backend:preprod -version
```

Il primo deve mostrare `10001:10001`, il secondo Java 17. Non viene avviata l'applicazione e non sono richiesti segreti.

## Passo successivo: avvio locale separato

Questa parte richiede la configurazione dei servizi: eseguirla dopo aver controllato la build, non durante il primo passo. Creare un file locale **`.env.docker.local`**, già ignorato da Git e dal contesto Docker, con una coppia `NOME=valore` per riga. È un formato diverso dal comando `$env:...` di PowerShell; non usare espressioni o segnaposto non sostituiti. Non condividere il contenuto del file.

Variabili comuni: `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `JWT_EXPIRATION`, `APP_FRONTEND_BASE_URL`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`. Per il collaudo Gmail API aggiungere `MAIL_PROVIDER=gmail-api`, `MAIL_FROM`, `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`. `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME` e `MAIL_PASSWORD` servono soltanto se si sceglie SMTP locale, non per Gmail API. Il segreto JWT deve essere casuale e adeguato, non la chiave fittizia dei test. Per il frontend locale usare `APP_FRONTEND_BASE_URL=http://localhost:3000`.

Il file `env.properties` resta fuori dal container. I valori necessari vanno forniti a runtime: non copiarlo nell'immagine né nel Dockerfile. Per il nuovo trasporto Gmail API usare le variabili aggiuntive descritte sopra; SMTP resta un trasporto locale.

Per collegarsi allo **stesso database di preproduzione locale** su PostgreSQL Windows, utilizzare `host.docker.internal`, non `localhost` (che dentro il container indica il container stesso). Pubblicare il backend su 8081, così non collide con quello eventualmente aperto in Maven su 8080:

```powershell
docker run --rm --name dndacademy-backend-local `
    -p 127.0.0.1:8081:8080 `
    --env-file .env.docker.local `
    -e SPRING_PROFILES_ACTIVE=preprod `
    -e APP_CLIENT_IP_SOURCE=remote `
    -e PREPROD_DB_URL=jdbc:postgresql://host.docker.internal:5432/dndacademy_preprod `
    dndacademy-backend:preprod
```

Il riuso di questo database è esplicito: Flyway applica soltanto eventuali migrazioni mancanti e non lo azzera. Se la connessione è rifiutata, controllare ascolto PostgreSQL, firewall e `pg_hba.conf` per l'indirizzo proveniente da Docker; non aprire l'accesso indiscriminatamente. La modalità `remote` è per il test locale: più richieste inoltrate da Docker possono condividere l'indirizzo visto dall'app, senza simulare gli IP del proxy Railway.

In un secondo terminale:

```powershell
Invoke-RestMethod 'http://localhost:8081/actuator/health/readiness'
```

Deve risultare `UP`. Con l’immagine corrente verificare Flyway a versione 4, nessuna migrazione riapplicata, arresto/riavvio senza perdita di dati e login. Il browser frontend deve essere compilato/avviato con l'URL backend appropriato prima del collaudo da interfaccia. Il solo readiness non prova email, upload o l'intero percorso didattico.

## Railway

Nel servizio backend impostare **Root Directory `/dndacademyBE`**: Railway troverà il Dockerfile nella radice del servizio. Lasciare il comando di avvio del Dockerfile, senza override Maven o `spring-boot:run`. Configurare **Healthcheck Path `/actuator/health/readiness`**, usando la porta `PORT` gestita dal servizio. La sonda viene effettuata da Railway: non viene aggiunto un secondo healthcheck Docker con dipendenze curl nella JRE.

Tutte le variabili dei servizi vanno nel pannello Railway a runtime, mai nel Dockerfile o nella build. Impostare esplicitamente `SPRING_PROFILES_ACTIVE=prod`, `APP_CLIENT_IP_SOURCE=railway`, origine frontend HTTPS e connessione JDBC privata al PostgreSQL Railway tramite `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`. In produzione **non** usare `PREPROD_DB_URL` né `host.docker.internal`. Verificare anche i requisiti in [CORS](CORS.md), [limiti autenticazione](AUTH_RATE_LIMITS.md), [schema](DATABASE_MIGRATIONS.md) e [healthcheck](HEALTHCHECK.md).

Il container non conclude la preparazione al rilascio: email, primo Master, variabili frontend, backup e percorso applicativo sui servizi reali restano da collaudare. Nessun deploy è eseguito da questa procedura.

Riferimenti: [Docker: build in più fasi](https://docs.docker.com/build/building/multi-stage/), [contesto e dockerignore](https://docs.docker.com/build/concepts/context/), [Railway: Dockerfile](https://docs.railway.com/builds/dockerfiles), [monorepo](https://docs.railway.com/deployments/monorepo).
