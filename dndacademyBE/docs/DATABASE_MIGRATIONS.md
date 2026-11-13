# Flyway: nuovo schema e collaudo locale

La creazione dello schema di preproduzione e produzione è affidata a Flyway. Hibernate usa `validate`: controlla le tabelle ma non le modifica. Le migrazioni sono parte del codice e devono essere committate insieme alle modifiche applicative.

## Cosa crea V1

`src/main/resources/db/migration/V1__initial_schema.sql` crea le 24 tabelle applicative, colonne, chiavi esterne, indici e vincoli del modello corrente, incluse le copie personali dei personaggi. Lo schema è stato derivato dalle entità con il dialect PostgreSQL, senza collegarsi a un database, e revisionato prima del collaudo. Non contiene account, campagne o dati dimostrativi.

Flyway aggiunge `public.flyway_schema_history`, che registra versione, checksum ed esito. Al primo avvio su un database vuoto esegue V1; agli avvii successivi controlla la cronologia ed esegue soltanto nuove migrazioni. Il normale inizializzatore applicativo crea i tre badge di sistema dopo la migrazione e la validazione Hibernate.

Non eseguire V1 manualmente in pgAdmin. Non modificarla dopo che è stata applicata: aggiungere nuove migrazioni numerate. È ora presente **V2__auth_rate_limits.sql**, che aggiunge soltanto i contatori per la [protezione dell'autenticazione](AUTH_RATE_LIMITS.md). Su un database già a V1 non serve alcun reset: Flyway applica V2 al riavvio. Le modifiche successive partiranno da V3. La stessa sequenza deve essere provata in collaudo prima della produzione. Non inserire dati di test in queste migrazioni.

## Profili

| Profilo | Configurazione locale | Gestione schema | Destinazione |
| --- | --- | --- | --- |
| `dev` (default) | Import opzionale del file esterno `./src/main/resources/env.properties`, relativo alla directory di avvio | Hibernate `update`, Flyway disabilitato | Solo database di sviluppo preesistente |
| `preprod` | Stesso import esterno per riusare credenziali e servizi locali; URL obbligatorio distinto `PREPROD_DB_URL` | Flyway e Hibernate `validate` | Database locale nuovo per provare la prima installazione |
| `prod` | Nessun import di file locali; tutte le proprietà tramite ambiente | Flyway e Hibernate `validate` | Nuovo PostgreSQL Railway |

Usare un solo profilo alla volta. Su Railway impostare esplicitamente `SPRING_PROFILES_ACTIVE=prod`: il default `dev` è mantenuto esclusivamente per non applicare migrazioni ai vecchi dati locali. Una build del JAR non attiva automaticamente il profilo di produzione.

I profili `preprod` e `prod` condividono V1/V2 e lo stesso ciclo di vita dello schema; il primo riusa soltanto la configurazione dei servizi locali. Il file con le credenziali rimane escluso da Git ed è escluso dalle risorse Maven. Il backend usa `${PORT:8080}` e non stampa le query SQL per default. Open Session in View è disabilitato, il [readiness endpoint](HEALTHCHECK.md) verifica app e database e [CORS](CORS.md) distingue origini locali e di produzione. La prova locale dei limiti di accesso, Docker, email e collaudo cloud richiedono ancora i passaggi della verifica di preproduzione.

## Collaudo a piccoli passi su PostgreSQL 17

Prerequisiti: database locale nuovo `dndacademy_preprod`, schema `public` presente, utente con permessi di creazione tabelle e file locale già usato per lo sviluppo. Non cambiare il vecchio `DB_URL` e non svuotare il database con Pietraluce.

1. Fermare l'istanza locale del backend, se usa già la porta 8080.
2. Aprire PowerShell nella cartella **dndacademyBE**, dove si trova `mvnw.cmd`.
3. Impostare soltanto per quel terminale l'URL del database appena creato (adattare host/porta se PostgreSQL non usa localhost:5432):

   ```powershell
   $env:PREPROD_DB_URL = 'jdbc:postgresql://localhost:5432/dndacademy_preprod'
   .\mvnw.cmd '-Dspring-boot.run.profiles=preprod' spring-boot:run
   ```

   Username e password restano quelli del file locale o delle variabili `DB_USERNAME` e `DB_PASSWORD`; il proprietario deve poter creare lo schema applicativo. Non inviare le credenziali in chat. Se manca `PREPROD_DB_URL`, l'avvio fallisce invece di ripiegare sul vecchio `DB_URL`.

4. Nei log verificare che il database indicato sia `dndacademy_preprod`, V1 e V2 siano state applicate e l'applicazione sia partita. In pgAdmin aggiornare **quel database**, poi eseguire:

   ```sql
   SELECT version, description, success
   FROM public.flyway_schema_history
   ORDER BY installed_rank;
   ```

   Devono esserci V1 e V2 con `success = true`, oltre alle 25 tabelle applicative (24 di V1 e i contatori di V2). Sono attesi i badge di sistema, non campagne o utenti di prova.

5. Fermare e riavviare con lo stesso comando. Flyway deve indicare che lo schema è aggiornato, senza riapplicare V1/V2 e senza perdere dati. Il collaudo dei contenuti inseriti dal Master sarà un passo successivo.
6. Per tornare al vecchio ambiente, fermare il backend e avviarlo senza il profilo `preprod` dalla cartella backend. L'URL originale non è stato modificato. Per pulire la variabile del terminale: `Remove-Item Env:PREPROD_DB_URL`.

Questi comandi sono istruzioni per una prova esplicita: la preparazione del codice e i test automatici non si collegano al PostgreSQL locale.

## Protezioni e database esistenti

`baseline-on-migrate` è `false`: Flyway rifiuta uno schema popolato che non ha la propria cronologia. Non aggirare l'errore abilitando il baseline automatico o cancellando tabelle. `clean-disabled` è `true`: il percorso normale non offre un reset tramite Flyway. I nomi delle migrazioni sono validati e la posizione degli script deve esistere.

V1 è destinata a una nuova installazione. Per adottare Flyway su un database preesistente occorrono backup, confronto dello schema e baseline esplicita dopo la verifica: non è parte di questa procedura. Il profilo `dev` conserva temporaneamente il comportamento precedente solo per lo sviluppo locale.

Lo script manuale [2026-11-10-character-templates.sql](migrations/2026-11-10-character-templates.sql) converte solo i personaggi dei vecchi database: non sostituisce V1, non viene importato da Flyway e non serve al nuovo database Railway.

## Verifiche automatiche e limiti

- `InitialSchemaMigrationTest`: V1 e V2 eseguite su H2 isolato, incluso aggiornamento di un database V1 con dati in modalità PostgreSQL; validazione di tutte le entità, seconda esecuzione senza modifiche ai dati, vincoli dei personaggi, rifiuto del database non gestito, clean disabilitato e rilevamento di una migrazione modificata.
- `InitialSchemaApplicationTest`: avvio Spring Boot con Flyway attivo e Hibernate in `validate`, con inizializzazione successiva dei badge di sistema.
- La suite applicativa esistente conserva H2 e `create-drop`, con Flyway disabilitato esplicitamente per l'isolamento delle sue fixture. I test delle migrazioni sono separati: non sono una copia SQL dello schema H2, usano gli stessi script V1 e V2 destinati a PostgreSQL.
- Il packaging deve includere V1/V2 e i profili ed escludere `env.properties`, anche nelle build locali. Eseguire una build pulita per eliminare eventuali vecchie copie rimaste in `target`.
- H2 non sostituisce PostgreSQL 17: il via libera a questa fase richiede la prova locale sopra. Deploy Railway, servizi email/immagini e ripristino backup restano da verificare.

Riferimenti: [Spring Boot 3.5 e Flyway](https://docs.spring.io/spring-boot/3.5/how-to/data-initialization.html), [rischi del baseline automatico](https://documentation.red-gate.com/fd/flyway-baseline-on-migrate-setting-277578974.html).
