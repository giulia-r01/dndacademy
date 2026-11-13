# Readiness per Railway

Il controllo di disponibilità usa Spring Boot Actuator, sulla stessa porta HTTP del backend (`PORT`, default locale 8080):

```text
GET /actuator/health/readiness
```

## Contratto

| Condizione | HTTP | Risposta |
| --- | --- | --- |
| App pronta e connessione database funzionante | 200 | `{"status":"UP"}` |
| Database non disponibile | 503 | `{"status":"DOWN"}` |
| App non pronta ad accettare traffico | 503 | `{"status":"OUT_OF_SERVICE"}` |

Il gruppo `readiness` include esplicitamente `readinessState` e `db`. Non basta che il processo Java risponda: deve essere pronto ad accettare richieste e riuscire a usare la connessione al database. Il controllo non crea dati applicativi.

SMTP e Cloudinary non fanno parte di questo gruppo: un problema con i servizi di comunicazione non deve falsare la verifica di avvio app/database. Vanno collaudati e monitorati separatamente. Un healthcheck positivo non certifica che tutte le funzionalità dell'app siano state provate.

La configurazione è in `src/main/resources/management.yaml`, importata sia dall'applicazione sia dal profilo di test isolato. I test verificano quindi la stessa configurazione Actuator, senza importare le credenziali o le connessioni di sviluppo.

## Esposizione minima

- È pubblico soltanto il metodo GET sul percorso esatto `/actuator/health/readiness`.
- La risposta mostra solo `status`, senza componenti, credenziali, URL JDBC, dettagli SQL o eccezioni, anche per un Master.
- HTTP/JMX non espongono altri endpoint di gestione: l'accesso Actuator predefinito è disabilitato, viene abilitata la sola lettura di `health`, l'esposizione web include solo `health`, i link di discovery sono disabilitati e l'esposizione JMX è esclusa.
- La catena di sicurezza blocca inoltre `/actuator` e tutti gli altri percorsi sottostanti, compresi health generale, liveness e dettagli dei singoli componenti. Non basta essere autenticati per aprirli.
- Il filtro JWT salta il solo GET pubblico di readiness, così una credenziale Bearer non valida non altera una sonda pubblica. Tutte le normali API mantengono la validazione JWT precedente.

## Verifica locale a piccoli passi

1. Fermare il backend e riavviarlo nello stesso terminale con `PREPROD_DB_URL` ancora impostata:

   ```powershell
   .\mvnw.cmd '-Dspring-boot.run.profiles=preprod' spring-boot:run
   ```

   Il riavvio completo è necessario per caricare anche la nuova dipendenza Actuator.
2. Aprire nel browser `http://localhost:8080/actuator/health/readiness`. È atteso `{"status":"UP"}`, senza dover accedere all'app.
3. In alternativa, da un secondo terminale:

   ```powershell
   $healthResponse = Invoke-WebRequest -Uri 'http://localhost:8080/actuator/health/readiness'
   $healthResponse.StatusCode
   $healthResponse.Content
   ```

   Sono attesi `200` e il JSON con `UP`. Non fermare PostgreSQL per provare il caso negativo: è già simulato dai test isolati; un'eventuale prova reale di indisponibilità va organizzata separatamente nell'ambiente di collaudo.

Questa modifica non cambia lo schema e non richiede nuove migrazioni o reset. Il controllo su PostgreSQL locale deve essere confermato dall'utente; la preparazione del codice non esegue sonde sul suo database.

## Impostazione futura su Railway

Quando verrà creato il servizio backend, nelle impostazioni del deploy impostare **Healthcheck Path** a:

```text
/actuator/health/readiness
```

Usare la stessa porta esposta dal backend tramite `PORT`. Railway attende una risposta 2xx prima di attivare il nuovo deploy; gli stati non pronti restituiscono 503. Non usare `/`, `/auth/login` o il health generale, che non sono il controllo pubblico predisposto per questo scopo.

Il healthcheck Railway opera durante il deploy: non è un monitoraggio continuo dopo l'attivazione. Per rilevare indisponibilità successive, predisporre monitoraggio e avvisi separati. Nessuna impostazione Railway è stata modificata durante questo intervento.

## Test

`ReadinessHealthcheckTest` usa H2 isolato e verifica sei comportamenti: risposta anonima minima con DB disponibile; indipendenza dal Bearer della sonda e protezione delle normali API; contributo DB non disponibile con 503 senza dettagli e successivo ripristino; app che rifiuta traffico; blocco degli altri percorsi Actuator anche al Master; protezione per metodi diversi da GET e per richieste anonime all'app.

Lo stato negativo del database è simulato sostituendo temporaneamente il contributore di salute DB nel solo contesto di test, ripristinandolo al termine. Non viene fermato alcun server e non vengono usati gli URL PostgreSQL locali.

Riferimenti: [healthcheck Railway](https://docs.railway.com/deployments/healthchecks), [endpoint Actuator Spring Boot 3.5](https://docs.spring.io/spring-boot/3.5/reference/actuator/endpoints.html).
