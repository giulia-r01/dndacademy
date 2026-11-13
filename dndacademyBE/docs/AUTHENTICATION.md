# Autenticazione JWT e utente predefinito Spring

La registrazione pubblica crea account PLAYER in PostgreSQL. `POST /auth/login` verifica la password BCrypt dell'account persistito e restituisce il JWT. Le richieste protette inviano `Authorization: Bearer <token>`: `JwtFilter` verifica firma, scadenza e versione del token, ricarica l'utente per ID e applica i ruoli correnti.

## Perché compariva una password generata all'avvio

Un `SecurityFilterChain` personalizzato sostituisce la configurazione web predefinita, ma non impedisce da solo l'autoconfigurazione del servizio utenti. Poiché questa app usa il proprio controller di login e non un `UserDetailsService`, Spring Boot creava anche un `InMemoryUserDetailsManager`, con utente e password casuale di sviluppo. Non era la password di un account dell'app.

È esclusa esplicitamente la sola `UserDetailsServiceAutoConfiguration` dalla classe applicativa, per tutti i profili. Non viene esclusa `SecurityAutoConfiguration`, né disabilitata la protezione degli endpoint. Non viene aggiunto un servizio utenti fittizio o una password predefinita per nascondere l'avviso.

La catena dichiara esplicitamente HTTP Basic e form login disabilitati. Restano il filtro JWT, le sessioni stateless, i controlli sui ruoli e BCrypt; il controller di login mantiene lo stesso contratto. Il primo Master resta da predisporre con la procedura controllata prevista dal piano di rilascio.

## Verifica

`JwtSecurityConfigurationTest` controlla assenza del servizio utenti in memoria e dei filtri Basic/form login, login effettivo di un utente nel database di test, accesso al profilo tramite JWT, rifiuto di password errata, credenziali Basic e Bearer non valido. I test sono isolati su H2 e non creano utenti nel database locale.

Dopo l'aggiornamento, riavviare il backend con lo stesso comando del collaudo:

```powershell
.\mvnw.cmd '-Dspring-boot.run.profiles=preprod' spring-boot:run
```

Nello stesso terminale deve essere ancora presente `PREPROD_DB_URL` del database di collaudo. Flyway deve riconoscere V1 senza riapplicarla; non devono comparire `Using generated security password` e `inMemoryUserDetailsManager`. Questa verifica locale è stata confermata dal log dell'utente alle 14:21 del 10 novembre 2026. Open Session in View è stato affrontato successivamente, controllando le transazioni e le collezioni delle risposte: vedere [Sessioni database e transazioni](PERSISTENCE_BOUNDARIES.md).

È aggiunta una sola eccezione pubblica al filtro JWT: `GET /actuator/health/readiness`, che verifica app e database senza credenziali e restituisce solo lo stato. Gli altri percorsi Actuator sono bloccati anche per account autenticati; le API applicative mantengono la validazione Bearer. Dettagli in [Healthcheck](HEALTHCHECK.md).

La [configurazione CORS per ambiente](CORS.md) gestisce i preflight prima del filtro JWT e limita le origini esatte. Le API protette restano protette anche quando l'origine è consentita; il Bearer esplicito non richiede cookie cross-origin.

Gli errori della catena di sicurezza hanno risposte JSON: 401 per accesso mancante o sessione non valida e 403 per accesso negato. I guasti interni durante la verifica JWT hanno 503/500 generici con dettagli nei soli log. Il login restituisce lo stesso messaggio per username assente e password errata. Vedere [Gestione errori](ERROR_HANDLING.md).

La [limitazione delle richieste pubbliche](AUTH_RATE_LIMITS.md) usa contatori condivisi nel database, con V2, quote per indirizzo e identità e risposta 429 con Retry-After. Readiness, preflight CORS, rotta inesistente e limite al ventunesimo login sono confermati localmente; anche avvio e ricreazione del container precedente sono stati collaudati. La nuova [integrazione Gmail API](GMAIL_API.md) usa V3 per la coda e mantiene uniforme la risposta HTTP del recupero password, con invio dopo il commit. Benvenuto e reset completi sono confermati localmente; consenso Google definitivo e consegna cloud restano da verificare; i test non certificano il deploy.

Riferimento: [Spring Boot 3.5, configurazione della sicurezza](https://docs.spring.io/spring-boot/3.5/reference/web/spring-security.html).

## Inizializzazione del primo Master

La registrazione rimane riservata al ruolo PLAYER. Il primo account amministrativo viene promosso con la [procedura manuale documentata](FIRST_MASTER.md), dopo la verifica dell’identità dell’account e del database da parte dell’operatore. L’aggiornamento atomico controlla assenza di Master e corrispondenza di ID, username ed email, poi incrementa `token_version`: serve un nuovo login. Nessuna credenziale predefinita, endpoint pubblico o migrazione automatica viene aggiunta.

## Eliminazione account

`DELETE /api/users/me` usa esclusivamente l’identità del principal JWT e richiede password attuale e conferma esplicita. Nessun parametro identifica un altro account da cancellare. Il database rimuove l’utente e i suoi dati in una transazione; i token precedenti non trovano più l’account. Eventuali contenuti Master richiedono il trasferimento a un altro Master verificato sotto lock. [Dettagli e test](ACCOUNT_DELETION.md).
