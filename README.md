# D&D Academy

Piattaforma didattica per imparare le basi di Dungeons & Dragons attraverso lezioni, quiz e campagne tutorial a capitoli, con personaggi e combattimenti guidati. Progetto personale di Giulia, sviluppato per apprendimento e portfolio.

## Stato del progetto

Backend Spring Boot e frontend Next.js sono integrati. Sono presenti il percorso Player, il backoffice Master e il combattimento narrativo contro NPC. Il progetto è in sviluppo attivo: le meccaniche di D&D sono semplificate e la preparazione al rilascio in produzione resta da completare.

Gli ultimi aggiornamenti comprendono:

- Gestione di NPC e incontri, con quantità di nemici e aiutanti per capitolo.
- Sincronizzazione dei progressi anche quando vengono aggiunti nuovi capitoli.
- Verifica e scelta del personaggio nella pagina prima di avviare lo scontro.
- Turni NPC visibili e risolti una singola azione alla volta.
- Avvisi dei danni subiti, HP prima/dopo e registro persistente degli attacchi.
- Immagini caricabili per nemici e aiutanti e mostrate insieme ai personaggi.
- Errori HTTP espliciti preservati e messaggi di ripiego al posto dei messaggi nulli.

## Ruoli e flusso di gioco

Il **PLAYER** si registra, segue lezioni, supera quiz, consulta progressi e badge, si iscrive alle campagne e sceglie un personaggio preparato dal Master. Completa i capitoli in ordine rispettando i requisiti configurati: lezione, quiz e vittoria in combattimento, quando previsti.

Il **MASTER** gestisce campagne, capitoli narrativi, personaggi, lezioni, quiz, domande, risposte e badge. Prepara NPC nemici o aiutanti e li inserisce negli incontri dei capitoli. La registrazione pubblica crea account PLAYER; per il backoffice occorre un account MASTER già predisposto.

Nel combattimento il Player sceglie bersaglio e azione con arma o incantesimo. Quando tocca a un NPC, la pagina mostra il suo turno: il pulsante **“Mostra l'azione di…”** fa proseguire lo scontro. Tiri, bersaglio NPC e danni sono decisi dal backend. Dopo la vittoria si torna al capitolo per completarlo e ottenere l'eventuale ricompensa.

## Struttura e tecnologie

| Cartella | Contenuto | Stack |
| --- | --- | --- |
| [dndacademyBE](dndacademyBE/README.md) | API, sicurezza, regole e persistenza | Java 17, Spring Boot 3.5.11, JPA, PostgreSQL, Maven |
| [dndacademyfe](dndacademyfe/README.md) | Interfaccia Player e Master | Next.js 16.2.7, React 19.2.4, TypeScript, Tailwind CSS 4 |

JWT e BCrypt gestiscono l'autenticazione. Cloudinary ospita le immagini di personaggi e NPC; SMTP supporta le email di benvenuto e recupero password. Il frontend usa stato React e servizi TypeScript per comunicare con le API.

## Avvio locale

Servono JDK 17 o compatibile, PostgreSQL, Node.js **20.9 o superiore** e npm. Configurare database, JWT, SMTP e Cloudinary seguendo il [README backend](dndacademyBE/README.md#configurazione-e-avvio). Impostare `APP_FRONTEND_BASE_URL=http://localhost:3000` per allineare CORS e link delle email.

In un terminale, dalla radice del progetto:

```powershell
cd dndacademyBE
.\mvnw.cmd spring-boot:run
```

Nel file locale `dndacademyfe/.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8080
```

In un secondo terminale, dalla radice:

```powershell
cd dndacademyfe
npm ci
npm run dev
```

Aprire [l'app locale](http://localhost:3000). L'API ascolta sulla porta 8080. Su macOS/Linux il comando backend è `./mvnw spring-boot:run`. Le credenziali di database e servizi esterni vanno mantenute nella configurazione locale.

Per provare lo scontro, il Master prepara campagna, capitolo con combattimento, personaggi e incontro con almeno un nemico. Il Player si iscrive, sblocca il capitolo e sceglie il personaggio. Il combattimento usa attualmente il primo incontro del capitolo in ordine di ID.

## Verifiche e limiti attuali

Le modifiche recenti hanno superato compilazione backend, nove test unitari mirati, controllo TypeScript ed ESLint sui file frontend interessati. I comandi sono descritti nei README dei due componenti. Restano da verificare nell'app lo scontro completo e il caricamento reale su Cloudinary; non è ancora disponibile una suite end-to-end.

- I combattimenti sono individuali contro NPC; il party della campagna non implica uno scontro multiplayer in tempo reale.
- La UI non ripristina ancora il combattimento al ricaricamento della pagina, anche se stato e registro sono persistiti.
- Gli HP dello scontro sono separati da quelli permanenti del personaggio.
- La strategia NPC è semplice e deterministica nella scelta del bersaglio.
- Il database usa `ddl-auto: update`; le migrazioni versionate sono ancora da introdurre.

## Prossimi sviluppi

- Validazione completa dei flussi Player e Master nell'app.
- Ripresa delle sessioni di combattimento e miglioramenti alla presentazione delle azioni.
- Strategie NPC, magie e condizioni più articolate.
- Test di integrazione ed end-to-end, migrazioni e configurazioni per ambiente.
- Preparazione e verifica del deploy.

Il progetto ha finalità educative e di portfolio.
