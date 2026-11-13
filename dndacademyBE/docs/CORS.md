# Origine frontend e CORS per ambiente

`APP_FRONTEND_BASE_URL` indica l'origine principale del frontend: schema, host ed eventuale porta, senza percorsi applicativi. È usata da `FrontendOrigin` sia per la lista CORS sia per costruire il link di recupero password. Non serve una seconda variabile con lo stesso URL.

Esempi: `http://localhost:3000` per il collaudo locale, `https://nome-progetto.vercel.app` per il futuro frontend di produzione. L'URL effettivo Vercel verrà impostato su Railway dopo la creazione del progetto; non inserirne uno inventato nei file del repository.

## Regole per profilo

| Profilo | Origini consentite |
| --- | --- |
| `dev` | Origine configurata, `http://localhost:3000`, `http://127.0.0.1:3000` |
| `preprod` | Stesse origini locali, sul database separato di collaudo |
| `prod` | Solo l'origine HTTPS configurata in `APP_FRONTEND_BASE_URL` |

Le eccezioni locali sono abilitate da `app.cors.allow-local-origins` soltanto nei profili locali. In produzione l'avvio fallisce se viene attivata questa opzione, se l'origine è HTTP o se indica localhost/loopback/indirizzi non specificati. Le preview di altri progetti o branch Vercel non sono autorizzate automaticamente.

Le wildcard, le origini multiple nello stesso valore, le credenziali nell'URL, i percorsi diversi da `/`, query, frammenti e porte non valide sono rifiutati all'avvio. Host e schema vengono normalizzati; lo slash finale e le porte predefinite 80/443 vengono rimossi. Questo allinea l'origine al formato inviato dai browser ed evita slash doppi nei link delle email. Un valore non valido produce un messaggio di configurazione che non riporta eventuali credenziali incollate per errore.

Non sono più incluse automaticamente le vecchie porte 5173 e 8080: il frontend Next.js usa 3000. Un'origine diversa può essere quella principale esplicitamente configurata nel solo ambiente interessato, rispettando i requisiti HTTPS di produzione.

## Richieste browser

`SecurityConfig` usa origini esatte tramite `setAllowedOrigins`, non pattern. Consente GET, POST, PUT, PATCH, DELETE e OPTIONS, con header `Authorization` e `Content-Type`. Le risposte preflight possono essere conservate dal browser per 600 secondi.

CORS viene gestito dalla catena Spring Security prima della validazione JWT. Le richieste preliminari OPTIONS corrette passano senza token: il browser può poi inviare JSON o multipart con il Bearer. Non sono stati resi pubblici tutti i metodi OPTIONS né le API applicative.

Il frontend autentica con `Authorization: Bearer ...`, senza cookie cross-origin. `allowCredentials` è disabilitato e la risposta non include `Access-Control-Allow-Credentials`. Non è necessaria una modifica al client attuale. Le risposte di errore JWT includono l'origine consentita, così il browser può leggerle e gestire la sessione.

CORS controlla le richieste dei browser, non sostituisce autenticazione e ruoli. Le API protette richiedono sempre un JWT valido, anche dall'origine consentita. Le richieste senza header Origin, come la sonda Railway, continuano a funzionare con le regole di autenticazione previste per ciascun endpoint.

## Prova locale a piccoli passi

1. Fermare il backend e riavviarlo nello stesso terminale con `PREPROD_DB_URL` ancora impostata:

   ```powershell
   .\mvnw.cmd '-Dspring-boot.run.profiles=preprod' spring-boot:run
   ```

2. In un secondo terminale PowerShell, simulare il preflight del login:

   ```powershell
   $corsResponse = Invoke-WebRequest -UseBasicParsing -Method Options -Uri 'http://localhost:8080/auth/login' -Headers @{
       Origin = 'http://localhost:3000'
       'Access-Control-Request-Method' = 'POST'
       'Access-Control-Request-Headers' = 'Content-Type'
   }
   $corsResponse.StatusCode
   $corsResponse.Headers['Access-Control-Allow-Origin']
   ```

   Sono attesi `200` e `http://localhost:3000`. Non viene effettuato un login e non vengono creati utenti.

3. Il collaudo completo con frontend reale, upload e URL Railway/Vercel sarà effettuato dopo la configurazione dei servizi. La simulazione di un preflight non sostituisce questa verifica.

Non occorre modificare il vecchio `DB_URL`, svuotare i database o cambiare V1. Le impostazioni Cloudinary e SMTP non sono modificate da questo intervento.

## Test e produzione

`FrontendOriginTest` verifica normalizzazione, elenco esatto delle origini, rifiuto di configurazioni non valide e avvio della configurazione Spring con profilo `prod`. `CorsIntegrationTest` verifica preflight locali, origini rifiutate, metodi/header non consentiti, risposte di errore leggibili, login reale e richiesta JWT, upload multipart avatar con storage simulato e sonda senza Origin. I test usano H2; non interrogano PostgreSQL o servizi cloud.

Al deploy impostare su Railway `SPRING_PROFILES_ACTIVE=prod` e `APP_FRONTEND_BASE_URL` con l'origine HTTPS stabile di produzione Vercel. Su Vercel impostare `NEXT_PUBLIC_API_URL` con l'origine HTTPS del backend Railway, senza `/api`. Le preview devono usare un ambiente di collaudo dedicato; non abilitare `*.vercel.app` sul backend di produzione.

Riferimenti: [Spring Framework 6.2: CORS](https://docs.spring.io/spring-framework/reference/6.2/web/webmvc-cors.html), [Spring Security 6.5: CORS prima dell'autenticazione](https://docs.spring.io/spring-security/reference/6.5/servlet/integrations/cors.html).
