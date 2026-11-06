# D&D Academy — Frontend

Interfaccia della piattaforma didattica per imparare Dungeons & Dragons attraverso campagne guidate, lezioni, quiz e combattimenti narrativi. Include Area Player, Area Master, profilo e badge. Il progetto è in preparazione al collaudo preproduzione.

[Panoramica del progetto](../README.md) · [Backend e API](../dndacademyBE/README.md) · [Navigazione e flussi](docs/navigation-flow.md) · [Profilo, badge e collaudo](docs/profile-and-badges.md)

## Stack

Next.js 16.4.3 con App Router, React 19.2.4, TypeScript, Tailwind CSS 4 e React Icons. Provider e hook React condividono sessione e area di navigazione; i servizi TypeScript comunicano con le API REST Spring Boot.

Il JWT è conservato in `localStorage` e inviato come Bearer token. Il backend resta l'autorità per permessi, proprietà dei dati e progressione. Le variabili `NEXT_PUBLIC_*` sono pubbliche e non devono contenere credenziali.

## Configurazione e avvio

Servono Node.js 20.9 o superiore, npm e il backend configurato. Da questa cartella creare `.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8080
```

La base non deve includere `/api`: i servizi specificano già i percorsi completi, compresi quelli `/auth`. Nel backend impostare `APP_FRONTEND_BASE_URL=http://localhost:3000` per allineare CORS e collegamenti delle email.

```powershell
npm ci
npm run dev
```

Aprire [l'app locale](http://localhost:3000). Per verificare la build di produzione:

```powershell
npm run build
npm run start
```

`NEXT_PUBLIC_API_URL` deve essere disponibile durante la build. Il server di sviluppo e quello di produzione usano normalmente la porta 3000: avviarne uno alla volta su quella porta. Database, SMTP e Cloudinary sono configurati nel backend.

## Navigazione e ruoli

Il login carica il profilo e aggiorna la sessione condivisa prima di cambiare pagina. Il Player entra in **Il tuo percorso** (`/dashboard`); il Master in **Area Master** (`/admin`). Un errore temporaneo di rete non elimina il token: la pagina permette di riprovare. Una risposta autenticata `401` termina la sessione.

Il Master può passare tra le due aree usando il selettore nella sidebar. Le voci sono raggruppate per attività:

| Area | Gruppi e destinazioni |
| --- | --- |
| Player | Percorso: Il tuo percorso, Campagne, Biblioteca lezioni; La tua avventura: I tuoi personaggi, Storico combattimenti; Traguardi: Badge |
| Master | Gestione: Area Master e Campagne; Didattica: Lezioni e Quiz; Risorse: Personaggi, PNG e Badge; Amministrazione: Utenti |

**Profilo ed Esci sono nel menu dell'avatar in alto**, su desktop e mobile. Il menu supporta tastiera, frecce, Home/End, Tab, Escape e chiusura cliccando fuori. Nel profilo viene mantenuta l'area da cui il Master proviene.

In fondo alla sidebar rimane il riquadro del livello con la barra. Le etichette condivise sono **Principiante, Intermedio, Avanzato**. La barra rappresenta il livello raggiunto su tre livelli; non indica la percentuale di lezioni completate. La navigazione laterale scorre quando lo schermo è basso; titoli e breadcrumb riflettono la pagina corrente.

## Percorso Player

1. La home propone di iniziare un'avventura o continuare le campagne in corso. Uno scontro aperto presente tra i risultati recenti dello storico può essere ripreso direttamente. Le statistiche accompagnano le azioni principali.
2. L'iscrizione apre direttamente la campagna. Prima dei capitoli compaiono riassunto, progressi e scelta del personaggio. Finché il personaggio non è stato scelto, l'azione principale porta alla selezione nella stessa campagna e i capitoli da iniziare sono disabilitati in questa schermata. Al ritorno viene mostrato il personaggio scelto. Il primo capitolo propone **Inizia**, oppure **Continua** se risultano già svolte attività; quelli completati propongono **Rivedi**. Il collegamento al capitolo compare sulla sua scheda, senza un secondo pulsante duplicato nella panoramica.
3. Anche la dashboard verifica il personaggio della specifica campagna: se manca propone **Scegli il tuo personaggio**, altrimenti permette di continuare il capitolo. Un URL diretto a un capitolo non completato verifica lo stesso requisito e, se manca il personaggio, mostra la scelta senza attività o completamento. Un errore nel controllo offre **Riprova** e non viene interpretato come assenza del personaggio. I capitoli già completati restano consultabili. Dopo la scelta, il capitolo presenta storia, prossimo passo e requisiti effettivi: lezione, quiz e combattimento, quando previsti.
4. Lezioni e quiz aperti dal capitolo conservano il collegamento di ritorno. La provenienza viene verificata contro i capitoli restituiti dal backend prima di mostrare i collegamenti contestuali. La biblioteca resta consultabile separatamente.
5. La lettura può essere salvata con **Segna come letta**, anche per lezioni senza quiz. I requisiti già soddisfatti restano consultabili e le attività possono essere ripetute.
6. Il completamento del capitolo è disponibile quando i requisiti risultano soddisfatti. Dopo il salvataggio si ricaricano i capitoli e viene proposto il successivo sbloccato, quando presente.

Con più campagne in corso la home propone scelte distinte: non deduce l'ultima attività da dati che le API non espongono. Cataloghi vuoti ed errori di caricamento sono gestiti separatamente.

## Rotte principali

| Funzione | Percorso |
| --- | --- |
| Accesso e registrazione | `/login`, `/register` |
| Recupero password | `/forgot-password`, `/reset-password` |
| Percorso, profilo e badge | `/dashboard`, `/profile`, `/achievements` |
| Campagne e capitoli | `/campaigns`, `/campaigns/[campaignId]`, `/campaigns/[campaignId]/chapters/[chapterId]` |
| Biblioteca e attività | `/lessons`, `/lessons/[lessonId]`, `/lessons/[lessonId]/quiz` |
| Attività da un capitolo | Rotta lezione o quiz con `?campaignId=...&chapterId=...` |
| Personaggi | `/characters`, con `?campaignId=...` per preselezionare una campagna |
| Storico | `/combat` |
| Combattimento del capitolo | `/campaigns/[campaignId]/chapters/[chapterId]/combat` |
| Ripresa dello scontro | Rotta combattimento con `?combatId=...` |
| Gestione e utenti | `/admin`, `/admin/users` |
| Contenuti e risorse Master | `/admin/lessons`, `/admin/quizzes`, `/admin/badges`, `/admin/characters`, `/admin/npcs` |
| Campagne e capitoli Master | `/admin/campaigns`, `/admin/campaigns/[campaignId]/chapters` |
| Incontro del capitolo | `/admin/campaigns/[campaignId]/chapters/[chapterId]/encounter` |

I vecchi URL `/combat?campaignId=...&chapterId=...` e `/admin/encounters?campaignId=...&chapterId=...` reindirizzano alle rotte contestuali. Gli incontri si aprono dai capitoli e non sono una voce autonoma del menu. Gli ID non validi vengono rifiutati; le schermate dinamiche separano lo stato di risorse con ID diversi.

## Area Master

La panoramica presenta l'ordine di preparazione: creare la campagna e i personaggi, preparare contenuti e risorse, costruire i capitoli e configurare gli incontri. Le pagine dei capitoli offrono collegamenti a lezioni, quiz e PNG.

La sezione Utenti mostra statistiche, ricerca e filtri e permette il cambio Master/Player con conferma. La modifica del proprio ruolo è impedita anche dal backend. La registrazione pubblica crea Player: il primo account Master deve essere predisposto nell'ambiente; i successivi possono essere promossi da un Master esistente.

Il Master prepara personaggi delle campagne e PNG nemici o aiutanti, anche guaritori con dado, bonus e utilizzi limitati per scontro. La gestione incontri presenta contesto del capitolo, partecipanti, quantità e statistiche. Le modali gestiscono focus iniziale, confinamento, Escape e ripristino del focus. Le schede e le API proteggono le modifiche incompatibili con personaggi già usati in combattimento.

Nei personaggi esistenti, scegliere un ritratto valido avvia subito il caricamento, indipendentemente dalle modifiche alla scheda. Spinner, messaggio di stato e comandi temporaneamente disabilitati segnalano l'operazione; al termine compare la conferma. Riaprendo Modifica restano anteprima, nome della risorsa salvata e collegamento all'immagine attuale. Il nome originale del file viene mostrato nella conferma dell'upload, mentre il riferimento persistente proviene dall'URL restituito dalle API. Sono accettati JPG, PNG e WEBP fino a 5 MB. Per un nuovo personaggio, l'immagine selezionata viene mostrata in anteprima e caricata dopo la creazione; se il caricamento fallisce, la scheda resta disponibile per riprovare da Modifica senza duplicarla.

## Personaggi Player

Le schede Player dei personaggi disponibili e posseduti mostrano identità, livello, HP, Classe Armatura, sei caratteristiche con punteggio e modificatore, arma e attacco magico quando configurato. Le icone info aprono spiegazioni nel relativo box con clic, tocco o tastiera; Escape richiude la spiegazione e mantiene il focus sul comando. I testi chiariscono anche la differenza tra tiro per colpire e dado del danno. Le statistiche assenti sono indicate come non disponibili. La scelta conserva il contesto della campagna e permette di confrontarne la descrizione con le capacità, senza assegnare automaticamente un ruolo o una raccomandazione al personaggio.

## Profilo e badge

Il profilo consente di modificare username ed email confermando la password attuale, caricare o rimuovere l'avatar e cambiare password. Ruolo e livello sono in sola lettura.

La scelta di un'immagine valida avvia subito il caricamento: spinner sull'avatar, messaggio di stato e controlli disabilitati segnalano l'operazione. Un errore mantiene l'immagine precedente e consente una nuova selezione dello stesso file. Formati: JPG, PNG e WEBP, fino a 5 MB. I dati salvati aggiornano anche la barra superiore.

Dopo il cambio password si torna al login con una conferma; le sessioni precedenti e i link di recupero sono invalidati dal backend. Il token usa l'ID immutabile dell'utente, quindi il cambio username conserva identità e progressi.

La pagina Badge mostra ottenuti e bloccati, data di sblocco, ricerca, filtri e riepilogo della collezione. I badge automatici sono identificati da codici stabili, inizializzati all'avvio e protetti dall'eliminazione. Contratti API e dettagli di collaudo sono in [Profilo e badge](docs/profile-and-badges.md).

## Tour di primo avvio

Il primo accesso autenticato apre automaticamente un tour distinto per Player e Master. Il prototipo guidato attraversa pagine dimostrative interne all'app: 22 passi per il Player e 19 per il Master. Un box vicino al comando spiega cosa fare, il comando è evidenziato e il resto della pagina è inerte. L'avanzamento segue l'azione richiesta o un salvataggio riuscito; **Ho capito** compare soltanto nei passi informativi. **Esci dal tour** ed Escape permettono di interrompere sempre la prova. Dal menu dell'avatar **Ripeti il tour** riapre il percorso dell'area corrente; un passo dedicato prima della conclusione ricorda questa possibilità. Il Master può aprire anche il tour dell'altra area.

**Indietro** permette di rivedere i passaggi completati senza annullare i progressi; durante la revisione **Avanti** riporta fino al punto raggiunto. I vecchi passaggi sono in sola lettura e le nuove azioni restano obbligatorie. Il box ha testo più grande e comandi sempre visibili; l'oscuramento leggero mantiene leggibile il contesto della pagina.

Le rotte `/tour/[audience]/[screen]` usano la struttura di navigazione dell'app e contenuti di esempio condivisi solo in memoria. Le azioni dimostrative non chiamano API, non caricano immagini e non modificano dati reali. Chiudere o terminare riporta all'URL di partenza, inclusi query e frammento; i moduli non salvati della pagina lasciata seguono il normale ciclo di navigazione e non sono conservati dal tour. Chiudere o ricaricare elimina le prove; su una rotta dimostrativa senza prova attiva viene offerta la ripartenza dall'inizio.

La chiusura o il completamento sono ricordati nel `localStorage` del browser per account, ruolo, percorso e versione del tour. Su un altro browser, dopo la cancellazione dello storage o con un altro account/ruolo, il primo avvio viene riproposto. Non è una preferenza sincronizzata dal backend. Dettagli tecnici e collaudo: [Tour frontend](docs/tour-system.md).

## Combattimento, storico e immagini

La preparazione mostra personaggio e incontro senza avviare una sessione. Il pulsante di avvio crea un nuovo tentativo; **Riprendi combattimento** carica invece quello salvato e verifica la corrispondenza con campagna e capitolo.

Nell'arena il Player sceglie bersaglio e azione con arma o incantesimo. Il pulsante del turno PNG risolve una sola azione; tiri e decisioni sono del backend. I comandi sono protetti durante richieste e presentazione delle azioni; dopo un errore si tenta la rilettura dello stato senza ripetere automaticamente l'attacco. Le azioni PNG inviano `expectedEventCount` per prevenire la ripetizione involontaria di un turno.

Ritratti, comandi, dadi, HP, danni e cure si adattano alla larghezza disponibile. Il ritratto PNG segue turno e azione; gli omonimi sono distinti con un numero. I guaritori mostrano cure rimaste e recuperi, anche da 0 HP; una vittoria di gruppo con il personaggio fuori combattimento è segnalata. Le animazioni rispettano il movimento ridotto e l'iniziativa è consultabile anche da tastiera.

Lo storico è **aperto inizialmente** e paginato. I gruppi per campagna sono richiudibili e contengono sezioni per capitolo. Ogni tentativo mantiene il proprio esito; i vecchi dati incompleti hanno etichette di ripiego. Il dettaglio di partecipanti e registro è di sola lettura; gli scontri aperti con riferimenti disponibili offrono anche la ripresa.

Per mantenere la ripresa al ricaricamento usare l'URL con `combatId`, raggiungibile dalla home o dallo storico. Un avvio nuovo non aggiunge ancora l'ID alla barra degli indirizzi: ricaricare una rotta priva di `combatId` riapre la preparazione, e il tentativo salvato rimane recuperabile dallo storico.

Le immagini di avatar, personaggi e PNG sono caricate dal backend su Cloudinary. Le schede di personaggi e PNG riusano il componente ritratto; i ritratti mancanti hanno un segnaposto. Nel modulo PNG sono disponibili selezione, anteprima e sostituzione. Se l'upload fallisce dopo la creazione, si può riprovare sulla scheda salvata senza ricreare il PNG.

## Struttura del frontend

```text
src/
  app/          Rotte App Router, layout, validazione ID e redirect compatibili
  components/   Schermate riutilizzabili e componenti di interfaccia
  hooks/        Sessione condivisa, area Player/Master, contesto dei capitoli e gestione contenuti
  lib/          Percorsi, breadcrumb, prossime azioni, etichette livelli e regole password
  services/     Client API e servizi per funzionalità
  types/        Tipi delle richieste e delle risposte
tests/ui/       Flussi e regressioni browser con API simulate
docs/           Contratti e approfondimenti di navigazione e collaudo
```

`CurrentUserProvider` condivide il profilo ed evita richieste iniziali duplicate. `NavigationProvider` mantiene l'area di navigazione. `TourProvider` coordina il primo avvio e le richieste dal menu account. `AppShell` compone sidebar, barra superiore, menu account e breadcrumb. `services/api.ts` gestisce URL base, token, JSON/multipart ed errori HTTP. I componenti di schermata sono condivisi dalle rotte senza duplicare la logica delle attività.

## Verifiche automatiche

```powershell
npx tsc --noEmit --incremental false
npm run lint
npm run build
```

Con il frontend avviato in un altro terminale:

```powershell
# Necessario una volta se non si usa un browser già installato
npx playwright install chromium
npm run test:ui
```

Il comando comprende tutti i file della suite:

| File | Copertura |
| --- | --- |
| `tests/ui/admin-users.test.mjs` | Statistiche, filtri, cambio ruolo e accesso riservato |
| `tests/ui/combat-and-npcs.test.mjs` | Arena, PNG, guaritori, incontri, storico, personaggi, layout e modali |
| `tests/ui/profile-and-badges.test.mjs` | Profilo, password, upload automatico e rallentato, errori e badge |
| `tests/ui/character-images.test.mjs` | Ritratto Master su desktop e mobile, risorsa persistente, upload automatico, spinner, validazione, retry e creazione con upload fallito |
| `tests/ui/login-session.test.mjs` | Primo login, accesso dopo cambio password e profilo non disponibile |
| `tests/ui/navigation-flow.test.mjs` | Percorsi Player/Master, contesto, vecchie rotte, ripresa, menu account e livelli |
| `tests/ui/tour.test.mjs` | Percorsi guidati Player/Master, azioni obbligatorie, validazione, nessuna scrittura API, replay, focus, mobile e ritorno all'URL iniziale |

Variabili opzionali: `UI_BASE_URL` (default `http://localhost:3000`), `UI_BROWSER_PATH` (eseguibile Chromium, Chrome o Edge) e `UI_SCREENSHOT_DIR` (cartella per gli screenshot). Le API e i servizi esterni sono simulati: questi test non modificano il database applicativo o Cloudinary. Non sostituiscono il collaudo con backend, PostgreSQL, SMTP e Cloudinary reali.

## Collaudo preproduzione e sviluppi previsti

Per inserire contenuti reali dalle schermate Master e provarli come Player è disponibile [Il faro di Pietraluce](docs/campaigns/il-faro-di-pietraluce.md): cinque capitoli, cinque lezioni su D&D 5e 2014, venti domande sulle lezioni, tre incontri e cinque ricompense. Le [otto schede dei personaggi](docs/campaigns/personaggi-pietraluce.md) conservano nomi, razze, classi e riferimenti visivi forniti dall'utente. Le tabelle sono proposte ridotte per l'arena, non schede ufficiali complete. Le [istruzioni di inserimento e collaudo](docs/campaigns/collaudo-pietraluce.md) sono separate dalla didattica e documentano le differenze tra le regole insegnate e la simulazione attuale. I documenti non importano dati.

Una prima partita è stata confermata dall'utente con esito positivo il 6 novembre 2026. Le spiegazioni sono state poi rese più graduali per principianti, introducendo i termini prima dei calcoli e distinguendo punteggio, modificatore, competenza, tiro per colpire, danno, stabilità e coscienza.

Prima del rilascio verificare con account Player e Master reali il percorso completo, permessi, progressione, ritorno dalle attività, ripresa dello stato salvato, cambio password su più sessioni, immagini ed email. Il database e lo schema `public` devono esistere ed essere accessibili all'utente del backend. Il reset dell'ambiente di test è un'operazione esplicita e separata dalla build del frontend.

Il tour di primo avvio è implementato interamente nel frontend. Restano la gestione versionata delle migrazioni backend, le verifiche dei servizi reali e la preparazione del deploy. Non è presente sincronizzazione multiplayer in tempo reale; gli HP dello scontro sono separati da quelli permanenti del personaggio.

Le revisioni precedenti sono conservate come documenti datati: [revisione pre merge del 30 ottobre 2026](../dndacademyBE/docs/REVISIONE_PRE_MERGE_2026-10-30.md) e [collaudo storico](../dndacademyBE/docs/COLLAUDO.md). Per lo stato corrente dei flussi frontend usare questo README e i documenti in `docs/`.
