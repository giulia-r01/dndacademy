# Limiti delle richieste di autenticazione

Login, registrazione e recupero password sono pubblici, ma hanno quote temporanee condivise tra tutte le istanze del backend. Non dipendono dalla memoria del processo e non si azzerano con un riavvio.

## Quote iniziali

| Operazione POST | Per indirizzo | Per identità |
| --- | --- | --- |
| `/auth/login` | 60 ogni 15 minuti | 20 ogni 15 minuti per username |
| `/auth/register` | 10 ogni ora | 5 ogni ora per email |
| `/auth/forgot-password` | 10 ogni 15 minuti | 3 ogni 15 minuti per email |
| `/auth/reset-password` | 20 ogni 15 minuti | Nessuna quota sul token: non viene memorizzato né usato come chiave |

Sono contate tutte le richieste, anche riuscite: evita che login validi o account inesistenti consentano abuso illimitato. Il contatore per indirizzo viene aggiornato prima della lettura del JSON; quello per identità dopo la validazione dei campi, prima della ricerca dell'account e dell'invio email. Un payload non valido consuma la quota per indirizzo. OPTIONS e readiness non consumano quote. Le finestre iniziano dalla prima richiesta e non sono estese dai rifiuti; al termine si può riprovare. Questi valori sono una prima configurazione da valutare con il traffico reale, specialmente su reti condivise.

Il rifiuto è HTTP **429**, con JSON `message` in italiano, secondi di attesa e header `Retry-After`, esposto anche tramite CORS. Le schermate esistenti mostrano il messaggio dell'API; non è richiesto un nuovo formato frontend. Non esistono blocchi permanenti dell'account. Le quote per identità si applicano indipendentemente dalla sua esistenza e sono separate per operazione; normalizzazione con trim e minuscolo. Un tentativo verso un'identità può consumarne la quota temporanea: non sostituisce una futura verifica anti-bot o MFA. Il rate limiting applicativo non è una protezione DDoS.

## Persistenza e concorrenza

Flyway **V2__auth_rate_limits.sql** aggiunge `auth_rate_limit_buckets` e l'indice di scadenza. V1 resta invariata. Sul database locale `preprod` già inizializzato basta riavviare: Flyway applica soltanto V2, senza cancellare account o contenuti. Il nuovo database Railway riceverà V1 e V2 in sequenza.

Ogni quota è aggiornata in una transazione autonoma breve con lock sulla riga: il fallimento o rollback del login non annulla il tentativo. La creazione usa INSERT, non merge su chiave assegnata; una collisione viene riprovata in una nuova transazione. Questo evita che due istanze sovrascrivano il contatore iniziale. Le richieste bloccate non incrementano ulteriormente il numero né spostano la scadenza. Non serve Redis per questo volume iniziale; il database già condiviso garantisce coerenza tra istanze. In caso di indisponibilità dei contatori il filtro risponde 503, senza consentire accessi illimitati.

Le chiavi sono HMAC-SHA256 con separazione per operazione, usando il segreto JWT del backend. Non vengono salvati IP, username o email in chiaro nella tabella; i digest restano identificatori pseudonimi. Ruotare il segreto invalida i JWT e rende irraggiungibili le quote precedenti. Un task orario elimina le righe scadute da oltre 24 ore, anche senza traffico. Il volume di nuove righe resta proporzionale alle identità e agli indirizzi distinti accettati dal filtro; monitorare dimensione, connessioni e carico insieme al traffico reale.

## Origine dell'indirizzo e Railway

- `dev`, `preprod` e test usano `app.client-ip-source=remote` per default: solo l'indirizzo della connessione. `X-Real-IP`, `X-Forwarded-For` e `Forwarded` inviati dal client vengono ignorati.
- In `prod`, **APP_CLIENT_IP_SOURCE è obbligatoria**. Nel deploy previsto impostare `APP_CLIENT_IP_SOURCE=railway`: viene accettato un solo `X-Real-IP`, contenente un indirizzo numerico valido, senza liste, hostname o zone IPv6. Un header mancante/ambiguo/non valido produce 400. Gli IPv6 vengono raggruppati per /64 per evitare l'aggiramento tramite rotazione della parte host.
- Questa modalità è valida esclusivamente quando il backend pubblico è raggiunto attraverso l'HTTP ingress Railway, che costituisce il confine di fiducia. Non esporre il backend anche con TCP proxy o accesso pubblico diretto, né aggiungere proxy personalizzati senza riesaminare la catena di fiducia. I servizi privati autorizzati nell'ambiente Railway sono parte di tale confine: l'header da solo non prova l'identità del proxy.
- `server.forward-headers-strategy=none` evita riscritture implicite dell'indirizzo da header generici. Il limiter non usa il primo elemento di `X-Forwarded-For` e non considera la presenza di un header Railway una prova autonoma di autenticità.

Prima dell'apertura pubblica, verificare sull'URL Railway che richieste con header contraffatti continuino a consumare la stessa quota del client e che due client distinti abbiano quote distinte. L'esito locale non verifica il confine del proxy cloud.

## Prova locale a piccoli passi

1. Fermare e riavviare il backend con profilo `preprod`, mantenendo `PREPROD_DB_URL` del database di collaudo. Non cambiare il vecchio DB_URL e non svuotare database.
2. Verificare V2 riuscita in `flyway_schema_history` e readiness `UP`.
3. Solo sul backend locale, inviare 21 login con un username inesistente: i primi 20 restituiscono 401 e il successivo 429 con `Retry-After`. Il test non crea account o email e la quota scade automaticamente.
4. Al prossimo riavvio V1/V2 devono risultare valide e nessuna migrazione deve essere riapplicata. Il limite attivo deve restare tale fino alla scadenza.

I test automatici verificano scadenza con orologio controllato, persistenza tra istanze, rollback, race di prima creazione, incrementi concorrenti, pulizia, normalizzazione indirizzi, header contraffatti locali, quote per indirizzo e identità, JSON/Retry-After/CORS e indipendenza di OPTIONS/readiness. H2 non sostituisce la verifica PostgreSQL e Railway.

Riferimenti: [Railway: header dell'ingress HTTP](https://docs.railway.com/networking/public-networking/specs-and-limits), [Spring Boot: forwarded headers e proxy fidati](https://docs.spring.io/spring-boot/3.5/how-to/webserver.html).
