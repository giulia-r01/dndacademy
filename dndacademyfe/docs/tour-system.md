# Tour frontend: mobile, desktop e tablet

Su desktop e tablet il tour rimane basato sulle azioni: il Player segue 22 passaggi e il Master 19. Ogni passaggio evidenzia un comando o un gruppo di campi e mostra un box vicino al punto di interazione. La pagina circostante è oscurata e inerte, anche da tastiera. Prima della conclusione un passo spiega come riaprire Ripeti il tour dal menu del profilo. Su mobile si usa invece la modale semplificata descritta sotto.

## Modale mobile

Il Player segue 9 passaggi e il Master 8, in una sola modale sopra la pagina corrente. Ogni passo contiene una spiegazione breve, la posizione della funzione nell'app, un esempio e l'azione da svolgere sulle pagine reali. Indietro e Avanti permettono di rileggere liberamente; Termina tour conclude l'ultimo passo. Non sono richiesti moduli, credenziali, upload o clic su elementi esterni. Il contenuto scorre dentro la modale; uscita e navigazione restano visibili anche su schermi bassi.

- Player: campagna, eroe, storia e lezione, quiz, combattimento, completamento e badge, storico, profilo e riapertura.
- Master: campagna, personaggi, lezioni e quiz, PNG e badge, capitoli e incontri, utenti, controllo Player e account.

La modalità viene scelta all'apertura: larghezza fino a 767 px, oppure puntatore principale touch con larghezza fino a 959 px e altezza fino a 500 px per includere i telefoni orizzontali. Il tour già aperto mantiene la modalità durante rotazione o ridimensionamento senza perdere il passo. I tablet da 768 px in verticale e quelli orizzontali da 960 px mantengono la guida con focus. Non si usa lo user-agent.

La modale non cambia URL e lascia la pagina montata, conservando query, frammento e bozze non salvate. Isola lo sfondo con inert, blocca lo scorrimento della pagina, contiene il focus e supporta Escape. Alla chiusura ripristina gli stati precedenti. Gli esempi non chiamano API e non sono dati reali. Le regole di avanzamento obbligatorio descritte nelle sezioni successive riguardano soltanto desktop e tablet.

## Percorsi e avanzamento

Su desktop e tablet le pagine dimostrative sono raggiungibili nelle rotte `/tour/[audience]/[screen]`. Usano AppShell, sidebar, barra superiore, menu account e breadcrumb dell'app; i contenuti vengono creati all'inizio di ogni prova. Non si tratta delle pagine reali collegate alle API: i moduli e lo scontro sono intenzionalmente abbreviati per insegnare il percorso senza scrivere dati reali.

- Player: home, campagne, iscrizione, capitolo, lettura, quiz, personaggio, preparazione e bersaglio dello scontro, vittoria, completamento del capitolo, badge, storico e account.
- Master: gestione campagne, nuova campagna, personaggio, lezione, quiz, PNG, badge, capitolo, incontro, richiesta e conferma di cambio ruolo, account.
- Account: apertura dell'avatar e del profilo, avatar dimostrativo, salvataggio dei dati, simulazione della password e conclusione.

Indietro permette di rivedere il passo precedente senza annullare azioni e progressi. Ogni passaggio completato conserva una rappresentazione dei dati prima dell'azione, così il comando originale rimane visibile anche quando lo stato corrente è cambiato. La revisione è in sola lettura; Avanti torna fino al passo effettivamente raggiunto, poi scompare per impedire di saltare azioni nuove. Si ricostruiscono anche il menu account, la conferma di ruolo e il registro aperto quando necessari.

I clic di navigazione avanzano solo verso la destinazione prevista; i passi operativi avanzano quando viene completata la condizione richiesta. Un quiz errato o un modulo non valido non avanzano. Il bersaglio è obbligatorio prima dell'attacco. Per questo esempio il capitolo Master deve mantenere lezione, quiz, combattimento e badge: la guida segnala se vengono rimossi.

Ho capito è disponibile nei passi informativi; Termina tour solo dopo tutte le azioni. Esci dal tour ed Escape sono sempre disponibili. Il tasto Indietro del browser chiude la prova. L'apertura di un'altra rotta dimostrativa durante una prova riporta al passaggio effettivo, senza completare le azioni saltate.

## Architettura

- `src/lib/tour.ts`: sequenze guidate, selettori espliciti `data-tour-action`, condizioni di completamento, titoli, voce attiva del menu e versione della preferenza.
- `src/lib/mobile-tour.ts`: sequenze brevi Player/Master e scelta della modalità all'apertura.
- `MobileTour`: modale mobile, esempi, avanzamento di lettura, isolamento dello sfondo e ripristino della pagina.
- `src/hooks/useTour.tsx`: stato della prova condiviso tra le pagine, aggiornamento atomico di dati e passaggio, eventi ammessi, URL di ritorno e preferenza locale. Il cambio di account o ruolo elimina lo stato della prova.
- `src/app/tour/[audience]/[screen]/page.tsx`: convalida ruolo del percorso e schermata richiesta; i nomi non riconosciuti restituiscono la pagina non trovata.
- `GuidedTourPage`: interfaccia condivisa dell'app, indicatore di modalità dimostrativa e stato di ripartenza quando non esiste una prova attiva. Un Player non può avviare il percorso Master.
- `TourSpotlight`: box contestuale, maschera intorno all'elemento, isolamento con inert, controllo dei clic esterni e del focus. Osserva comparsa del comando, scorrimento e ridimensionamento; ripristina inert e attributi alla chiusura. Gli errori operativi sono annunciati nel box, così rimangono leggibili.
- `PlayerDemo`, `MasterDemo`, `TourDemoScreen`: presentazione e azioni dei contenuti dimostrativi. Non importano servizi API.
- `src/lib/tour-demo.ts`: dati nuovi e coerenti per ogni apertura, senza persistenza delle attività.

Su desktop e tablet il box si aggancia a destra o a sinistra del comando o contenitore, adattando la larghezza fino a 440 px. Se nessun lato ha almeno 260 px liberi, si posiziona in alto e riserva spazio nella pagina dimostrativa: i comandi rimangono sotto la guida. Non viene più disposto sopra i contenuti in basso. Una freccia indica il collegamento con l'elemento. Il box rimane nell'area visibile; la descrizione ha uno scorrimento interno quando necessario, mentre uscita e navigazione restano disponibili. L'oscuramento rimane al 42% e si mantiene la scrollbar personalizzata.

Il posizionamento guidato usa `visualViewport` e reagisce a ridimensionamento, scorrimento, variazioni dei contenitori e focus dei campi. Nei moduli lunghi lo scorrimento rimane disponibile; il campo attivo viene portato nell'area libera. Gli spazi riservati alla guida vengono rimossi alla chiusura. Non vengono introdotti ritardi fissi per attendere il layout.

## Isolamento e ritorno

I contenuti di esempio restano in memoria e non producono modifiche al database, ruoli reali, upload o cambi password. Il normale controllo della sessione può leggere il profilo reale durante le navigazioni.

Su desktop e tablet la chiusura ritorna all'URL iniziale con query e frammento; il percorso cambia pagina e non conserva le bozze non salvate della pagina di partenza. Su mobile la modale lascia la pagina montata e conserva le bozze. Le prove vengono eliminate a chiusura o ricaricamento. Ricaricando una rotta dimostrativa si può ricominciare; non vengono ricostruiti progressi da parametri dell'URL o contenuti persistenti.

## Primo avvio

Il tour si avvia automaticamente dopo l'accesso su una rotta reale dell'app; non compare nelle pagine pubbliche. Il menu avatar offre Ripeti il tour e, per il Master, anche il percorso dell'altra area.

La chiave di memorizzazione è `dndacademy:tour:v2:<userId>:<ruoloEffettivo>:<player|master>`. Si salva solo `{ "version": 2, "status": "dismissed" | "completed" }`. Il precedente passaggio alla versione 2 aveva riproposto la guida a chi aveva chiuso il primo pannello.

La preferenza è per browser, origine, account e ruolo; non è sincronizzata dal backend. Senza storage persistente l'app rimane utilizzabile e la chiusura vale per la sessione montata. Un reset del database non cancella lo storage del browser.

Le due modalità condividono la preferenza v2: questo aggiornamento non forza di nuovo il tour a chi lo ha già chiuso. Per provare la nuova guida sullo stesso browser usare Ripeti il tour. La scadenza della sessione e il cambio di account/ruolo chiudono entrambe le modalità.

## Verifiche e limiti della prova

`tests/ui/tour.test.mjs` attraversa i due percorsi guidati completi su desktop e tablet: blocco delle azioni esterne, mancato avanzamento per errori, salvataggi obbligatori, bersaglio, cambio ruolo, account, nessuna scrittura API, chiusura, replay, URL, ricaricamento, navigazione del browser, primo login e scadenza della sessione.

Le verifiche misurano i comandi prima del clic per evitare che lo scorrimento automatico del test nasconda sovrapposizioni. `tests/ui/mobile-tour.test.mjs` verifica le due sequenze nella modale, Indietro/Avanti, focus confinato, URL e bozze conservati, uscita e replay, rotazione, schermo piccolo, preferenza locale e scadenza della sessione. Verifica anche che un tablet touch da 768 px mantenga il percorso guidato. L'emulazione browser non sostituisce il collaudo sui dispositivi reali.

Il precedente collaudo del 17 novembre 2026 aveva superato 56 test pertinenti con il focus anche su mobile. È uno storico: la nuova modalità mobile ha una suite dedicata. Le API sono simulate e non modificano dati reali.

Verifica integrata del 17 novembre 2026, dopo il merge dell'aggiornamento di sicurezza nella branch del tour e `npm ci`: build di produzione e TypeScript completati con Next.js 16.4.6, lint superato, 31 test di configurazione e tutti i 140 test browser superati. La build non presenta più il blocco di sicurezza della versione 16.4.3 e l'installazione riporta zero vulnerabilità. Il collaudo su dispositivi reali resta necessario prima del rilascio.

Le altre suite usano `tests/ui/helpers/tour.mjs` per rappresentare account che hanno già chiuso la guida.

Il tour orienta tra le funzioni dell'app; non certifica la comprensione delle regole di gioco. I moduli dimostrativi condividono i componenti di base ma non tutti i campi e le modali delle schermate operative; lo scontro richiede un solo attacco. Il collaudo con account e servizi reali resta necessario. La cancellazione dell’account è disponibile solo nel profilo reale con password e conferma; non viene proposta come azione da provare nel tour. Il tour non richiede modifiche al backend.

