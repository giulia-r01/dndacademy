# Tour guidato: prototipo frontend

Il tour precedente a pannello è sostituito da una prova basata sulle azioni. Il Player segue 22 passaggi e il Master 19. Ogni passaggio evidenzia un comando o un gruppo di campi e mostra un box breve vicino al punto di interazione. La pagina circostante è oscurata e inerte, anche da tastiera. Prima della conclusione un passo informativo evidenzia l'avatar e spiega come riaprire il menu del profilo e scegliere Ripeti il tour da qualsiasi pagina.

## Percorsi e avanzamento

Le pagine dimostrative sono raggiungibili nelle rotte `/tour/[audience]/[screen]`. Usano AppShell, sidebar, barra superiore, menu account e breadcrumb dell'app; i contenuti vengono creati all'inizio di ogni prova. Non si tratta delle pagine reali collegate alle API: per valutare questa metodologia, i moduli e lo scontro sono intenzionalmente abbreviati.

- Player: home, campagne, iscrizione, capitolo, lettura, quiz, personaggio, preparazione e bersaglio dello scontro, vittoria, completamento del capitolo, badge, storico e account.
- Master: gestione campagne, nuova campagna, personaggio, lezione, quiz, PNG, badge, capitolo, incontro, richiesta e conferma di cambio ruolo, account.
- Account: apertura dell'avatar e del profilo, avatar dimostrativo, salvataggio dei dati, simulazione della password e conclusione.

Indietro permette di rivedere il passo precedente senza annullare azioni e progressi. Ogni passaggio completato conserva una rappresentazione dei dati prima dell'azione, così il comando originale rimane visibile anche quando lo stato corrente è cambiato. La revisione è in sola lettura; Avanti torna fino al passo effettivamente raggiunto, poi scompare per impedire di saltare azioni nuove. Si ricostruiscono anche il menu account, la conferma di ruolo e il registro aperto quando necessari.

I clic di navigazione avanzano solo verso la destinazione prevista; i passi operativi avanzano quando viene completata la condizione richiesta. Un quiz errato o un modulo non valido non avanzano. Il bersaglio è obbligatorio prima dell'attacco. Per questo esempio il capitolo Master deve mantenere lezione, quiz, combattimento e badge: la guida segnala se vengono rimossi.

Ho capito è disponibile solo per leggere badge e registro; Termina tour solo dopo tutte le azioni. Esci dal tour ed Escape sono sempre disponibili. Il tasto Indietro del browser chiude la prova. L'apertura di un'altra rotta dimostrativa durante una prova riporta al passaggio effettivo, senza completare le azioni saltate.

## Architettura

- `src/lib/tour.ts`: sequenze guidate, selettori espliciti `data-tour-action`, condizioni di completamento, titoli, voce attiva del menu e versione della preferenza.
- `src/hooks/useTour.tsx`: stato della prova condiviso tra le pagine, aggiornamento atomico di dati e passaggio, eventi ammessi, URL di ritorno e preferenza locale. Il cambio di account o ruolo elimina lo stato della prova.
- `src/app/tour/[audience]/[screen]/page.tsx`: convalida ruolo del percorso e schermata richiesta; i nomi non riconosciuti restituiscono la pagina non trovata.
- `GuidedTourPage`: interfaccia condivisa dell'app, indicatore di modalità dimostrativa e stato di ripartenza quando non esiste una prova attiva. Un Player non può avviare il percorso Master.
- `TourSpotlight`: box contestuale, maschera intorno all'elemento, isolamento con inert, controllo dei clic esterni e del focus. Osserva comparsa del comando, scorrimento e ridimensionamento; ripristina inert e attributi alla chiusura. Gli errori operativi sono annunciati nel box, così rimangono leggibili.
- `PlayerDemo`, `MasterDemo`, `TourDemoScreen`: presentazione e azioni dei contenuti dimostrativi. Non importano servizi API.
- `src/lib/tour-demo.ts`: dati nuovi e coerenti per ogni apertura, senza persistenza delle attività.

Su desktop il box si posiziona accanto al comando e arriva a 440 px di larghezza, con descrizione a 16 px e titolo a 22 px. Su mobile rimane in basso e si adatta alla larghezza disponibile; il contenuto scorre separatamente, mantenendo visibili uscita e pulsanti di navigazione. Lo spazio finale della pagina permette di scorrere i moduli fino al salvataggio senza nasconderlo sotto la guida. L'oscuramento è al 42% per conservare il contesto nell'interfaccia scura. La scrollbar personalizzata già presente è mantenuta.

## Isolamento e ritorno

I contenuti di esempio restano in memoria e non producono modifiche al database, ruoli reali, upload o cambi password. Il normale controllo della sessione può leggere il profilo reale durante le navigazioni.

La chiusura ritorna all'URL iniziale con query e frammento. La prova ora cambia pagina: non conserva le bozze non salvate della pagina di partenza. Le prove vengono eliminate a chiusura o ricaricamento. Ricaricando una rotta dimostrativa si può ricominciare; non vengono ricostruiti progressi da parametri dell'URL o contenuti persistenti.

## Primo avvio

Il tour si avvia automaticamente dopo l'accesso su una rotta reale dell'app; non compare nelle pagine pubbliche. Il menu avatar offre Ripeti il tour e, per il Master, anche il percorso dell'altra area.

La chiave di memorizzazione è `dndacademy:tour:v2:<userId>:<ruoloEffettivo>:<player|master>`. Si salva solo `{ "version": 2, "status": "dismissed" | "completed" }`. Il cambio di metodologia incrementa la versione, riproponendo la guida anche a chi aveva chiuso il pannello precedente.

La preferenza è per browser, origine, account e ruolo; non è sincronizzata dal backend. Senza storage persistente l'app rimane utilizzabile e la chiusura vale per la sessione montata. Un reset del database non cancella lo storage del browser.

## Verifiche e limiti della prova

I test attraversano i due percorsi completi su desktop e mobile, verificano blocco delle azioni esterne, mancato avanzamento per errori, salvataggi obbligatori, bersaglio, cambio ruolo con conferma, apertura del menu account, nessuna scrittura API, chiusura, replay pulito, URL originale, ricaricamento, navigazione del browser, primo login e scadenza della sessione.

Le altre suite usano `tests/ui/helpers/tour.mjs` per rappresentare account che hanno già chiuso la guida.

Questo prototipo serve a valutare interazione e comprensione. I moduli dimostrativi condividono i componenti di base ma non tutti i campi e le modali delle schermate operative; lo scontro richiede un solo attacco. Prima di considerarlo finale occorre confermare la metodologia e completare la corrispondenza dei passaggi con i moduli reali, oltre al collaudo con account e servizi reali. Non sono richieste modifiche al backend.

