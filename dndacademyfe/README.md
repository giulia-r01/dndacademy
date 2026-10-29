# D&D Academy — Frontend

Interfaccia web della piattaforma didattica: percorso Player, campagne a capitoli, combattimenti narrativi e backoffice Master. Integrata con le API Spring Boot; progetto in sviluppo attivo.

[Panoramica](../README.md) · [Backend e API](../dndacademyBE/README.md)

## Stack

Next.js 16.2.7 con App Router, React 19.2.4, TypeScript, Tailwind CSS 4 e React Icons. Stato React, hook e servizi TypeScript per le chiamate REST. JWT inviato come Bearer token; il client conserva il token in `localStorage`.

## Configurazione e avvio

Servono Node.js **20.9 o superiore**, npm e il backend configurato e avviato. Da questa cartella, creare `.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8080
```

La variabile indica la base delle API, senza aggiungere `/api`: i servizi specificano già il percorso completo. È una variabile pubblica del frontend. Nel backend impostare `APP_FRONTEND_BASE_URL=http://localhost:3000` per CORS e link di recupero password.

```powershell
npm ci
npm run dev
```

Aprire [l'app locale](http://localhost:3000).

Per creare e avviare una build:

```powershell
npm run build
npm run start
```

`NEXT_PUBLIC_API_URL` deve essere configurata anche nell'ambiente di build. Il backend e i servizi esterni restano necessari per i relativi flussi.

## Pagine e funzionalità

| Area | Percorsi principali | Funzionalità |
| --- | --- | --- |
| Account | `/login`, `/register`, `/forgot-password`, `/reset-password` | Accesso e recupero password |
| Player | `/dashboard`, `/profile`, `/achievements` | Dashboard, profilo e badge |
| Didattica | `/lessons`, `/lessons/[lessonId]`, `/lessons/[lessonId]/quiz` | Lezioni e quiz |
| Campagne | `/campaigns`, `/campaigns/[campaignId]` | Iscrizione, capitoli e progressi |
| Capitolo | `/campaigns/[campaignId]/chapters/[chapterId]` | Narrazione, requisiti e completamento |
| Personaggi | `/characters` | Personaggi assegnati e scelta tra quelli disponibili |
| Storico | `/combat` | Combattimenti personali, esiti, campagna, personaggio e registro di sola lettura |
| Combattimento | `/combat?chapterId=...&campaignId=...` | Preparazione, iniziativa, azioni e registro |
| Backoffice | `/admin` | Accesso alle sezioni Master |
| Contenuti | `/admin/lessons`, `/admin/quizzes`, `/admin/badges` | Didattica e ricompense |
| Campagne Master | `/admin/campaigns`, `/admin/campaigns/[campaignId]/chapters` | Campagne, capitoli e accesso agli incontri |
| Personaggi Master | `/admin/characters` | Preparazione e immagini personaggi |
| NPC | `/admin/npcs` | Nemici, aiutanti, statistiche e immagini |
| Incontri | `/admin/encounters?chapterId=...` | NPC e quantità nel capitolo |

Il backoffice richiede un account MASTER già predisposto. La registrazione pubblica crea PLAYER. I controlli nell'interfaccia accompagnano quelli effettuati dalle API.

## Requisiti del capitolo

Le schede mostrano i progressi reali separatamente dal completamento del capitolo: **Lezione completata**, **Quiz superato** e **Combattimento vinto** per i requisiti acquisiti; **Da completare**, **Da superare** e **Da vincere** per quelli ancora mancanti. I pulsanti diventano **Rivedi lezione**, **Ripeti quiz** e **Ripeti combattimento** quando il requisito ? già soddisfatto. La revisione ? facoltativa e non azzera il progresso già salvato. Gli stati vengono letti dall'API dei capitoli del Player e sono verificati anche dopo il ricaricamento della pagina.

## I tuoi combattimenti

La voce Combat senza un capitolo mostra un collegamento alle campagne e lo storico personale paginato in un accordion chiuso inizialmente, apribile anche da tastiera. Gli incontri aperti dal capitolo mantengono la preparazione e l’arena con personaggio, nemico e comandi centrali. Le schede mostrano campagna, capitolo, incontro, personaggio e ritratto, HP salvati, esito e data di conclusione quando disponibile. Gli esiti sono Vittoria, Sconfitta e Non concluso; ogni tentativo conserva il proprio risultato: Non concluso indica l’assenza di un esito salvato, anche per tentativi precedenti a una vittoria successiva. I dati più vecchi completati ma privi di un esito preciso sono indicati come Concluso.

Il pulsante **Vedi dettagli e registro** apre una finestra di sola lettura con partecipanti e cronologia delle azioni. I registri assenti vengono segnalati senza inventare eventi; la lettura non avvia sessioni e non consente nuove azioni. Precedenti/Successivi permettono di consultare anche gli scontri più vecchi. In assenza di scontri viene proposto l’accesso alle campagne. La ripresa dei combattimenti attivi resta uno sviluppo distinto dallo storico.

## Flusso del combattimento

1. Il Player apre lo scontro dal capitolo della campagna.
2. La preparazione mostra il personaggio con ritratto grande, razza, classe, livello, HP, CA, arma, incantesimo e caratteristiche. Se manca, permette di sceglierlo tra quelli disponibili senza lasciare il capitolo. L’anteprima dello stesso incontro mostra immagini, quantità, statistiche e descrizioni dei nemici e degli eventuali aiutanti. Non viene avviata alcuna sessione finché non si preme il pulsante dedicato.
3. L'avvio carica i partecipanti in ordine di iniziativa, con schieramento, immagini, CA e HP. Il combattente in turno è evidenziato.
4. Nel proprio turno il Player sceglie un nemico e usa l'arma o, quando configurato, l'incantesimo.
5. Per nemici e aiutanti viene mostrato il turno e il pulsante **“Mostra l'azione di…”**. Ogni richiesta risolve una sola azione; bersaglio e tiri NPC sono decisi dal backend.
6. Il risultato mostra colpi riusciti o mancati, critici, danni e HP prima/dopo. I danni al proprio personaggio hanno un avviso dedicato; il registro mostra prima gli eventi più recenti.
7. Dopo una vittoria il Player torna al capitolo per completarlo e ottenere l'eventuale ricompensa.

La schermata ha una larghezza massima di 1440 px. Su desktop risultato, dadi e comandi stanno al centro, tra il personaggio e l’NPC. Le colonne laterali mantengono spazio per ritratti ampi senza allargare eccessivamente il pannello centrale. Le container query adattano la disposizione alla larghezza effettiva del contenuto, inclusa la sidebar: su tablet e telefono i comandi passano sotto i ritratti. Le informazioni HP e CA sono sovrapposte alla parte bassa delle immagini; le altezze si adattano allo schermo. Iniziativa e turno condividono la fascia superiore quando c’è spazio. L’iniziativa è una fascia compatta e il registro è espandibile. Il ritratto NPC segue automaticamente il combattimento: dopo ogni azione mostra per 1,6 secondi il bersaglio NPC o l’autore NPC del colpo, quindi passa al prossimo NPC in turno. Durante questa presentazione i comandi attendono, per evitare di saltare il feedback. A scontro concluso resta visibile l’NPC coinvolto nell’ultima azione. Non c’è un selettore manuale del ritratto; la scelta del bersaglio di attacco resta disponibile nel turno del Player. Il danno anima il ritratto colpito e la barra HP; le animazioni rispettano la preferenza di movimento ridotto.

Gli NPC con lo stesso nome sono distinti con un numero. Le richieste di azione sono protette durante il caricamento; dopo un errore il client tenta di rileggere lo stato senza ripetere automaticamente l'attacco.

Le azioni NPC inviano `expectedEventCount` per evitare che una richiesta ripetuta risolva un altro turno. Il contratto delle API è descritto nel README backend.

## Immagini

Le schede di `/admin/npcs` riusano lo stesso componente ritratto delle schede personaggio, con HP, CA, attacco e iniziativa. Il modulo di creazione/modifica è organizzato in identità, difesa e statistiche, con anteprima del ritratto e selezione del file. Il Master può caricare l’immagine durante la creazione oppure aggiungerla o sostituirla dalla scheda, anche per NPC già usati. Se il caricamento fallisce dopo il salvataggio, la scheda resta disponibile e il messaggio invita a riprovare senza ricreare l’NPC. Sono accettati JPG, PNG e WEBP fino al limite applicativo di 5 MB; il file viene inviato al backend e caricato su Cloudinary.

Le immagini di personaggi, nemici e aiutanti sono mostrate nel combattimento. Se manca un’immagine, il riquadro del ritratto mostra un’icona segnaposto. La configurazione Next.js consente le immagini remote da `res.cloudinary.com`.

## Struttura

```text
src/
  app/          Pagine e layout App Router
  components/   Componenti comuni, didattici, di combattimento e backoffice
  hooks/        Hook condivisi
  services/     Client API e servizi per funzionalità
  types/        Tipi delle richieste e risposte
```

`services/api.ts` gestisce URL base, token, corpo JSON o multipart e messaggi di errore. I servizi delle singole funzionalità definiscono gli endpoint.

## Verifiche

```powershell
# Controllo TypeScript senza generare file
npx tsc --noEmit --incremental false

# ESLint dell'intero frontend
npm run lint
```

Sono presenti trentasei test browser Playwright in `tests/ui/combat-and-npcs.test.mjs`. Verificano layout da 390 a 1920 px, adattamento alla sidebar, assenza di overflow, corretto NPC mostrato dopo la sconfitta, dimensioni dei ritratti, turni NPC, danni, scelta del bersaglio, passaggio automatico dal goblin colpito al prossimo NPC in turno, assenza del selettore del ritratto, dadi, registro e creazione con immagine, compreso il fallimento dell’upload senza duplicati. Le API sono simulate: i test non modificano il database o Cloudinary.

Con il frontend avviato in un altro terminale:

```powershell
# Installazione del browser di prova, una volta
npx playwright install chromium

npm run test:ui
```

Variabili opzionali: `UI_BASE_URL` per un indirizzo diverso da `http://localhost:3000`, `UI_BROWSER_PATH` per un eseguibile Chromium/Chrome/Edge già installato e `UI_SCREENSHOT_DIR` per salvare screenshot. Usare una cartella esterna ai sorgenti, ad esempio `../dndacademyBE/target/ui-screenshots`.

I nove test UI di combattimento e NPC sono stati verificati nella sessione precedente. Il collaudo aggiunge due regressioni per la navigazione PLAYER/MASTER, quattro scenari per i requisiti del capitolo e sei per la preparazione: scheda completa, immagini e quantità, aiutanti, scelta del personaggio, errori di accesso e resa mobile. Lo storico aggiunge otto scenari per accordion inizialmente chiuso e tastiera, esiti, dettaglio, elenco vuoto, paginazione, errori, accessi e mobile; tutti i 36 test browser passano con API simulate. Queste verifiche non sostituiscono i test con backend e servizi reali o la build di produzione. Restano da completare la prova dell’intero scontro e l’upload reale su Cloudinary.

## Limiti attuali e prossimi sviluppi

- Il ricaricamento della pagina non ripristina ancora lo scontro in corso dalla UI.
- Gli incontri sono individuali contro NPC; non c'è sincronizzazione multiplayer in tempo reale.
- Gli HP del combattimento sono separati dagli HP permanenti del personaggio.
- Le azioni di nemici e aiutanti proseguono con il pulsante dedicato, una alla volta.
- Restano da ampliare presentazione delle azioni, ripresa delle sessioni e verifiche automatiche dei flussi.

Per regole, requisiti, configurazione dei servizi e persistenza consultare il README backend.


La pagina Personaggi consente una sola scelta per campagna: le altre schede restano consultabili con pulsanti disabilitati e spiegazione visibile. Il blocco si applica subito dopo una scelta riuscita, senza impedire la scelta in altre campagne. Durante la richiesta sono disabilitate anche le altre scelte e il cambio campagna. Tre regressioni browser verificano scelta esistente, prima assegnazione e campagne distinte.


La gestione incontri mostra campagna e titolo del capitolo, uno stato iniziale con i passaggi di configurazione e una libreria NPC con conteggi di nemici e alleati. Se manca un nemico, propone la creazione nella libreria. Gli incontri configurati mostrano ritratti, ruoli, quantità, HP, CA e danni dei partecipanti. L’eliminazione resta in una sezione richiudibile con conferma. Quattro regressioni browser verificano creazione e riapertura del modulo, libreria vuota, riepilogo con statistiche e resa mobile.


Il modulo NPC usa un pulsante Carica immagine / Cambia immagine accessibile da tastiera, con nome del file selezionato visibile e anteprima. Il selettore nativo viene azzerato per consentire di riselezionare lo stesso file, mentre il nome resta nello stato del modulo. I test di creazione e recupero da errore upload verificano apertura da tastiera, selezione e sostituzione del file.
