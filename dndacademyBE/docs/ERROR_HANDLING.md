# Errori API: messaggi pubblici e dettagli interni

Gli errori applicativi e di autenticazione mantengono il contratto letto dal frontend:

```json
{"message":"Messaggio per l'utente"}
```

Le risposte sono JSON anche se un browser richiede HTML. Il campo `message` non contiene stack trace, SQL, nomi di tabelle/vincoli, configurazioni o messaggi dei provider. Il readiness Actuator conserva invece il proprio contratto minimale `status`; i rifiuti del protocollo CORS restano gestiti dal filtro Spring.

## Errori previsti

Le condizioni applicative previste usano `ApiException`, con factory esplicite per stato e testo sicuro, oppure le `ResponseStatusException` già presenti con messaggi controllati. Sono stati sostituiti i `RuntimeException` generici usati per validazione, risorse mancanti, proprietà, prerequisiti e conflitti.

Lo stato non viene dedotto dal testo dell'eccezione durante la richiesta: è scelto nel punto in cui si conosce la regola. I nuovi messaggi devono essere scritti per l'utente; non passarvi `ex.getMessage()`, SQL o input sensibili. Gli errori di stato che indicano un problema interno, come un badge di sistema mancante o una progressione che avrebbe dovuto essere inizializzata, restano errori server.

| Stato | Significato nell'app |
| --- | --- |
| 400 | Richiesta o dati non validi, JSON malformato, parametri mancanti o di tipo errato |
| 401 | Login non valido, accesso senza autenticazione, sessione non valida/scaduta |
| 403 | Ruolo/proprietà insufficienti o contenuto non ancora sbloccato |
| 404 | Risorsa inesistente, compresa una rotta pubblica non definita |
| 405 | Metodo HTTP non supportato; viene mantenuto l'header `Allow` |
| 409 | Duplicati, dati già utilizzati, prerequisiti di stato non soddisfatti o aggiornamento concorrente |
| 413 | Immagine/richiesta oltre il limite configurato |
| 415 | Tipo di contenuto HTTP non supportato |
| 500 | Errore imprevisto o errore di preparazione della risposta |
| 502 | Problema del servizio esterno di immagini |
| 503 | Database/connessione temporaneamente indisponibile o timeout; gli invii email avvengono ora nel worker dopo il commit |

I 4xx applicativi mantengono il messaggio utile. I 5xx ricevono sempre un testo generico anche se una `ResponseStatusException` contiene un motivo tecnico. Conflitti SQL e di concorrenza hanno messaggi generici: non mostrano i nomi dei vincoli. Il fallimento del login ha la stessa risposta per username assente e password errata.

## Gestione centralizzata

`GlobalExceptionHandler` estende `ResponseEntityExceptionHandler`: conserva gli stati e gli header degli errori Spring MVC, sostituendo i dettagli tecnici con `ErrorResponse`. La validazione dei DTO mantiene il primo messaggio di validazione scritto nelle annotazioni. Richieste non leggibili, parametri, formati e percorsi non validi non restituiscono valori della richiesta o descrizioni dei tipi Java.

Gli errori imprevisti, le indisponibilità e i conflitti database sono registrati nei log del server con la causa. Il codice non aggiunge header Authorization, password o interi payload ai messaggi di log. L'accesso ai log deve restare riservato agli operatori; il client non riceve le cause.

`ApiSecurityErrorHandler` risponde in JSON per gli errori che avvengono prima dei controller: 401 per accesso mancante/sessione non valida, 403 per accesso negato, 503 per indisponibilità del database durante la verifica JWT e 500 per altri errori interni del filtro. Non si presenta un guasto DB come password errata e non si elimina automaticamente la sessione del client per un 503. La verifica JWT e CORS rimangono attive.

`server.error.include-message`, `include-binding-errors` e `include-stacktrace` sono `never`; `include-exception` è `false`. Sono una protezione aggiuntiva per l'eventuale risposta di fallback del container, oltre alla gestione delle API.

## Servizi esterni

Gli errori di upload immagini conservano la causa per i log e sono convertiti in risposte di servizio generiche. Le email sono ora gestite dalla [coda persistente con Gmail API](GMAIL_API.md): account/benvenuto e token reset/task vengono salvati atomicamente, e il provider viene contattato dopo il commit. Un errore Gmail viene classificato con una categoria sicura, senza riportare corpi HTTP o segreti nei log; non cambia la risposta già fornita alla richiesta utente. La registrazione può invece fallire se non è possibile salvare account e richiesta email nel database.

Il recupero mantiene HTTP 200 senza corpo sia per account presente sia per account assente; un guasto del provider nel worker non ne modifica l'esito. Restano validazione, quote e possibili guasti del database. Timeout, rinnovo OAuth, ritenti e risposte uniformi sono coperti dai test isolati; consenso Google definitivo e consegna cloud restano da collaudare; benvenuto e recupero completi sono stati confermati localmente. La risposta 200 conferma la gestione della richiesta, non l'arrivo del messaggio.

## Verifiche

- `GlobalExceptionHandlerTest`: messaggi applicativi, fallback, errori imprevisti anche checked, 5xx espliciti, vincoli SQL e limite multipart.
- `ApiErrorsIntegrationTest`: simulazioni di errori server/database/serializzazione, cause nei soli log, validazione, JSON malformato, parametri, 404/405/415, registrazione duplicata, login non valido e sicurezza 401/403. Anche con `Accept: text/html` il client riceve il solo messaggio JSON.
- `JwtFilterFailureTest`: guasti prima del controller con JSON sicuro, status 503/500, contesto di sicurezza pulito e catena non proseguita.
- Suite completa e packaging: 173 test superati su H2 isolato; nessuna connessione ai database PostgreSQL o ai provider reali durante i test.

Non esiste un endpoint dimostrativo per provocare un 500: i guasti sono simulati solo nelle classi di test e non vengono inclusi nel JAR applicativo.

## Prova locale

Fermare il backend e riavviare nello stesso terminale con `PREPROD_DB_URL` ancora impostata:

```powershell
.\mvnw.cmd '-Dspring-boot.run.profiles=preprod' spring-boot:run
```

Aprire `http://localhost:8080/auth/not-a-real-route`. Sono attesi HTTP 404 e `{"message":"Risorsa non trovata."}`, senza login, stack trace o pagina di errore tecnica. Questa prova non crea dati. Non serve modificare V1 né svuotare il database. La risposta JSON è stata confermata localmente dall'utente; non è una verifica della consegna email.

Riferimento: [Spring Framework 6.2, ResponseEntityExceptionHandler](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/servlet/mvc/method/annotation/ResponseEntityExceptionHandler.html).

## Lingua delle validazioni

La risorsa `ValidationMessages.properties` definisce in italiano i messaggi standard dei vincoli senza testo esplicito. I messaggi italiani già specificati sui DTO restano validi. La regressione HTTP in `ApiErrorsIntegrationTest` verifica campo obbligatorio e lunghezza anche con `Accept-Language: en-US`. Tradotte inoltre le diagnostiche applicative della nuova integrazione mail; nomi di proprietà e codici tecnici restano invariati. Revisione completa: 212 test backend superati.
