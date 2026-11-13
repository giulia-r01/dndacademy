# Email Gmail via HTTPS e coda persistente

## Scelta per il rilascio

Il mittente resta `dnd.academy.team@gmail.com`. Il backend usa Gmail API via HTTPS in produzione, perché Railway Free/Trial/Hobby non permettono SMTP. Non viene introdotto il login Google per Player o Master: soltanto il proprietario del mittente autorizza l'integrazione una volta, e il server rinnova l'access token con il refresh token.

Gmail API è chiamata tramite REST con il client Spring già disponibile: non serve una nuova dipendenza SDK per i due endpoint utilizzati. Il client è dedicato all'invio, con redirect HTTP disabilitati, timeout di connessione 5 secondi e richiesta 10 secondi. Le destinazioni sono fisse: `oauth2.googleapis.com/token` e `gmail.googleapis.com/gmail/v1/users/me/messages/send`. Il MIME è codificato base64url senza padding. Il token è riutilizzato in memoria fino al margine di rinnovo di 60 secondi, con refresh sincronizzato. Dopo un 401 si prova un solo rinnovo e reinvio; gli altri tentativi sono gestiti dalla coda.

Il permesso necessario è **`https://www.googleapis.com/auth/gmail.send`**. Non richiedere lettura, cancellazione, accesso completo alla casella o delega Google Workspace. Il `From` deve corrispondere al mittente autorizzato, oppure a un alias già abilitato in Gmail; per questo progetto usare lo stesso account del consenso. `/users/me` invia dalla casella effettivamente autorizzata dal token.

L'uso standard dell'API non ha costi aggiuntivi secondo la documentazione Google consultata; valgono quote API, limiti della casella e controlli antiabuso. Non si promettono invii illimitati, consegna garantita o gratuità futura. I limiti Gmail non vanno aggirati cambiando protocollo. Nessun servizio a pagamento viene attivato dal codice.

## Variabili per ambiente

| Variabile | Utilizzo |
| --- | --- |
| `MAIL_PROVIDER=gmail-api` | Per attivare l'API in `dev`/`preprod`; il profilo `prod` imposta già `gmail-api` e rifiuta SMTP |
| `MAIL_FROM=dnd.academy.team@gmail.com` | Mittente esplicito; in locale può ripiegare su `MAIL_USERNAME` per compatibilità SMTP |
| `GMAIL_CLIENT_ID` | Client OAuth del proprio progetto Google Cloud |
| `GMAIL_CLIENT_SECRET` | Segreto del client OAuth, solo nel backend |
| `GMAIL_REFRESH_TOKEN` | Autorizzazione offline del mittente, solo nel backend |

`dev`/`preprod` mantengono SMTP come default, con le variabili esistenti `MAIL_HOST`, `MAIL_PORT` (default 587), `MAIL_USERNAME`, `MAIL_PASSWORD`. Non cancellarle durante la configurazione. SMTP usa STARTTLS obbligatorio e timeout limitati; non è selezionabile in `prod`. Per Gmail API non sono necessarie host, porta o password SMTP. Non usare la password Gmail o una password per applicazioni come refresh token.

I valori locali restano in `env.properties` per Maven o in `.env.docker.local` per Docker; entrambi sono esclusi da Git e dall'immagine. Su Railway usare le variabili del servizio. Nessun segreto va in `NEXT_PUBLIC_*`, README, screenshot, chat o build argument. La configurazione viene verificata all'avvio: campi mancanti, provider errato, mittente non valido o SMTP in produzione impediscono l'avvio con un errore che identifica il campo, senza includere il suo valore.

## Configurazione Google a piccoli passi

La procedura va eseguita dal proprietario dell'account mittente. L'utente ha completato manualmente configurazione e consenso per il collaudo locale; le credenziali restano nei soli file locali e non sono riportate nella documentazione. Il progetto OAuth è ancora in Testing: il passaggio alla configurazione finale resta da completare.

1. Accedere a [Google Cloud Console](https://console.cloud.google.com/) con l'account del mittente e creare il progetto **D&D Academy**. Non serve abilitare fatturazione per questa integrazione standard.
2. In **API e servizi → Libreria**, cercare e abilitare **Gmail API** per quel progetto.
3. Configurare **Google Auth Platform** (schermata consenso): nome descrittivo dell'integrazione, email di supporto e contatto del proprietario. Con un account Gmail personale scegliere **External**, non Internal (riservato alle organizzazioni Workspace). Inserire solo il permesso `gmail.send`. In fase di prova aggiungere come test user soltanto il mittente.
4. Creare un **client OAuth di tipo Applicazione web** per ottenere l'autorizzazione iniziale attraverso lo strumento ufficiale Google. Aggiungere come redirect esatto `https://developers.google.com/oauthplayground`. Salvare client ID e client secret nei soli file locali. Il backend non espone un callback OAuth pubblico e i Player non seguono questo flusso.
5. Aprire [OAuth Playground ufficiale](https://developers.google.com/oauthplayground/). Nelle impostazioni selezionare **Use your own OAuth credentials**, inserire il proprio client ID/secret, flusso **Server-side**, accesso **Offline** e consenso esplicito. Non usare le credenziali predefinite del Playground: Google revoca quei refresh token dopo 24 ore. Qui il Playground è solo uno strumento di bootstrap, non una dipendenza del backend in esecuzione.
6. Richiedere soltanto `https://www.googleapis.com/auth/gmail.send`, autorizzando **il mittente corretto**. Scambiare il codice per i token e salvare localmente il **refresh token** come `GMAIL_REFRESH_TOKEN`. Non usare l'access token al suo posto.
7. Prima dell'apertura pubblica controllare la pubblicazione dell'integrazione OAuth e le indicazioni del Verification Center. Un progetto External lasciato in **Testing** emette refresh token che scadono dopo sette giorni per questo scope. Pubblicazione e verifica sono concetti distinti: `gmail.send` è sensibile; se Google richiede una verifica, completarla prima del rilascio. Non dichiarare automaticamente un'esenzione né confondere il mittente Gmail personale con un service account Workspace. L'integrazione è riservata all'autorizzazione del mittente: non aprirla ai Google Account dei Player. Rigenerare il token finale dopo aver completato la configurazione prevista per il rilascio.

Non salvare eventuali JSON scaricati dal pannello Google dentro il repository; non sono richiesti dall'applicazione. Se il consenso manca, è rifiutato o Google richiede passaggi ulteriori, risolverli nel pannello prima di considerare attiva la posta. Nessun token reale è stato generato nei test automatici.

## Perché la coda nel database

Prima l'email veniva inviata durante la richiesta HTTP e, per il reset, dentro la transazione con lock sull'utente. Un guasto SMTP poteva cambiare l'esito visibile del recupero e la consegna non era collegata in modo affidabile al commit.

Ora **V3__email_outbox.sql** aggiunge `email_outbox` senza modificare V1/V2 né cancellare utenti, contenuti o quote. Account e benvenuto sono salvati nella stessa transazione; token reset e richiesta email sono salvati insieme. Se la transazione viene annullata, nessuna email resta da inviare. L'invio parte dal worker dopo il commit, fuori da una transazione DB.

`forgot-password` mantiene HTTP 200 senza corpo sia per indirizzo registrato sia per indirizzo assente. Un guasto del provider nel worker non modifica questa risposta e non viene esposto all'utente. Restano applicate le quote antiabuso con 429, la validazione con 400 ed eventuali errori DB: non è una promessa di risposta a tempo costante o di consegna già avvenuta.

Il worker controlla la coda ogni 15 secondi, con avvio iniziale dopo 10 secondi e batch massimo 20. Ogni riga è presa con lock in una transazione breve e lease di 120 secondi: una seconda istanza non prende il task mentre il lease è valido; dopo un crash il task torna disponibile. Il completamento deve presentare lo stesso lease, così un worker ritardatario non sovrascrive un risultato più recente.

Gli errori temporanei hanno ritenti con attesa crescente da 30 secondi fino a 15 minuti; le quote prevedono almeno 5 minuti. Viene rispettato anche `Retry-After` (secondi o data HTTP), con limite 24 ore, sempre entro la scadenza del task. Massimo 8 tentativi; errori di autorizzazione o messaggio non valido sono definitivi. Le richieste di benvenuto scadono dopo 24 ore; quelle di reset insieme al link, 30 minuti dalla richiesta. Le scadenze sono calcolate in **UTC** anche quando Maven gira su Windows e Docker su Linux; per il collaudo rigenerare i link creati con la versione precedente che usava l'ora locale.

Prima dell'invio si controlla che l'account esista ancora, che l'email non sia cambiata e, per il reset, che il token sia quello corrente, non usato e non scaduto. I task obsoleti vengono annullati. Un messaggio già in volo può comunque arrivare dopo una nuova richiesta: il suo vecchio link rimane invalido. Nella coda si salvano destinatario, ID utente, tipo, scadenze, stato e digest del token; **non** si duplicano MIME, link, token in chiaro o credenziali OAuth. La tabella preesistente dei token di reset conserva il proprio formato attuale.

La consegna è **almeno una volta**, non esattamente una volta: se il provider accetta il messaggio e la risposta si perde, un ritento può duplicarlo. Si riusa un Message-ID stabile, senza promettere deduplicazione da parte di Gmail. I messaggi sono dichiarati `SENT` quando il provider accetta l'invio; questo non garantisce arrivo in inbox o assenza di spam. Formato testo semplice e HTML, UTF-8 e escaping dei valori dinamici sono gestiti dal renderer.

## Guasti e manutenzione

I log del worker includono solo UUID del task e categoria sicura (`TEMPORARY`, `QUOTA`, `AUTHORIZATION`, `INVALID_MESSAGE`), senza destinatari, corpi, reset link, risposte Google o credenziali. I payload OAuth/MIME hanno anche rappresentazioni diagnostiche redatte. Non abilitare log HTTP wire/body o delle credenziali nel servizio di produzione.

Per osservare la coda senza leggere destinatari o token:

```sql
SELECT status, last_failure, COUNT(*)
FROM email_outbox
GROUP BY status, last_failure;
```

`AUTHORIZATION` richiede controllo di client, scope, autorizzazione e refresh token. Dopo revoca, cambio delle condizioni dell'account o scadenza può essere necessario autorizzare nuovamente il mittente. Aggiornare la variabile segreta e riavviare il servizio; richiedere un nuovo reset per ottenere un nuovo task/link. I task già `FAILED` non vengono rimessi in coda automaticamente e non vengono ritentati all'infinito. Monitorare log e stati: il readiness continua a controllare app/DB, non contatta Gmail e non certifica la disponibilità della posta.

Un task orario rimuove le righe scadute da oltre sette giorni (per il benvenuto la permanenza totale può raggiungere otto giorni). La coda e i relativi destinatari sono inclusi nei backup del database: applicare la stessa protezione e politica di conservazione degli account. Un rollback applicativo non rimuove V3 e non deve riportare in uso il vecchio mittente sincrono mentre una nuova istanza sta elaborando la stessa coda.

## Collaudo

I test usano Gmail simulato, credenziali fittizie e database isolati. Coprono MIME/base64url, rinnovo/cache OAuth, 401 con unico reinvio, revoca/malformed token, quote/Retry-After, timeout e redazione, configurazione per profilo, transazioni account/coda, rollback, risposte HTTP uniformi, link obsoleti, lease concorrenti e recupero, ritenti limitati, scadenza e pulizia. Non inviano messaggi reali.

Verifiche eseguite il 13 novembre 2026: **211 test** nella suite completa, tutti superati, anche durante la build Docker Java 17; **11 test della coda ripetuti su PostgreSQL 17 isolato in Docker**, tutti superati, inclusi lease concorrenti, rollback e recupero dei task. PostgreSQL è stato creato con porta e credenziali temporanee e rimosso al termine: nessuna modifica ai database dell'utente e nessun invio reale.

Collaudo reale successivo confermato dall'utente: nuova immagine Docker avviata su PostgreSQL locale con applicazione della sola V3, readiness UP sulla porta 8081, registrazione HTTP 201 e benvenuto ricevuto. Frontend locale collegato alla porta 8081; richiesta recupero, ricezione dell'email, apertura del link, modifica password e login con la nuova password tutti riusciti. Il primo invio verifica anche lo scambio reale refresh-token→access-token, poiché il backend non riceve un access token preimpostato.

Restano da verificare configurazione OAuth definitiva (attualmente Testing), rinnovo dopo la naturale scadenza dell'access token, comportamento con altri destinatari/provider, riavvio con task in attesa e percorso su Railway. La prova sul proprio alias Gmail non garantisce la consegna presso tutti i provider né l'assenza di spam. Non usare test automatici o richieste ripetute per consumare la quota del mittente. Chiedere esplicitamente l'invio di prova o eseguirlo dall'app con account di collaudo controllati.

Per il test Docker, ricostruire l'immagine, aggiungere le cinque variabili API a `.env.docker.local`, mantenere il profilo `preprod` e lo stesso DB separato. Flyway deve applicare la sola V3 e riconoscere versione 3 ai riavvii successivi. Non svuotare il database. In produzione fornire le variabili dal pannello Railway; la password SMTP non è necessaria.

## Revisione successiva e privacy

La revisione dei commenti, delle diagnostiche italiane e delle validazioni ha superato 212 test backend. La precedente build Docker con 211 test resta una verifica storica: la prossima build includerà anche queste modifiche. V3 non è stata modificata, nemmeno nei commenti, perché già applicata al database locale.

La pagina frontend `/privacy` è pubblica e collegata alla homepage e alla registrazione, con titolare e contatto confermati. Prima del rilascio completare le verifiche su fornitori, conservazione e proprietà degli URL; vedere `dndacademyfe/docs/privacy-rilascio.md`. Nessun deploy, commit o merge automatico.

## Riferimenti ufficiali

- [Railway: SMTP e API HTTPS](https://docs.railway.com/networking/outbound-networking).
- [Gmail: costruzione MIME e invio](https://developers.google.com/workspace/gmail/api/guides/sending), [endpoint send](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/send), [scope](https://developers.google.com/workspace/gmail/api/auth/scopes).
- [Google: OAuth server-side e rinnovo](https://developers.google.com/identity/protocols/oauth2/web-server), [scadenza dei refresh token](https://developers.google.com/identity/protocols/oauth2), [scope sensibili e verifica](https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification).
- [OAuth Playground](https://developers.google.com/oauthplayground/): usare le proprie credenziali.
- [Quote e costi Gmail API](https://developers.google.com/workspace/gmail/api/reference/quota), [limiti della casella personale](https://support.google.com/mail/answer/22839?hl=it).
