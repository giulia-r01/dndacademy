# Collaudo funzionale — 29 ottobre 2026

Il collaudo reale è guidato tramite screenshot dell’utente. L’automazione della finestra Chrome non è disponibile perché lo strumento non riesce a verificare l’URL corrente. I test browser automatizzati usano un contesto separato e API simulate: non certificano i dati del database reale.

## Dashboard PLAYER

Screenshot ricevuto per `giur92!`:

- 3 lezioni completate, 3 quiz superati, 5 badge e livello INTERMEDIATE visualizzati.
- Progresso lezioni: 3/3, 100%; messaggio di lezioni disponibili completate.
- Anteprima di tre badge: coerente con il limite `badges.slice(0, 3)` della dashboard.
- Nessun errore visibile nello screenshot; correttezza rispetto al database non ancora verificata.

### Difetto D01 — collegamento Backoffice visibile al Player

Confermato nel componente Sidebar: il collegamento era incluso senza filtro per ruolo. La pagina `/admin` possiede già il controllo del ruolo e mostra «Accesso riservato» ai PLAYER.

Correzione: rendere il collegamento visibile solo ai MASTER. Aggiunte due regressioni browser con API simulate per presenza del collegamento MASTER e assenza/negazione dell’accesso diretto PLAYER. Conferma nella sessione reale: nello screenshot successivo della pagina Campagne il collegamento Backoffice ? scomparso.

## Campagne e capitoli PLAYER

Lo screenshot dell'elenco campagne mostra «Le Miniere di Pietragrigia» completata il 15/10/2026. Il dettaglio mostra capitoli 1 e 2 completati e capitolo 3 «Il Sentiero degli Agguati» disponibile, non completato.

### Difetto D02 ? campagna completata con capitolo ancora da completare

Causa confermata nel servizio: il flag completato non veniva riallineato alla struttura corrente della campagna. Inoltre il completamento valutava solo le righe di progresso esistenti, senza includere eventuali nuovi capitoli privi di progresso.

Correzione: al caricamento delle campagne completate, confronto tra capitoli attuali e completamenti del Player. Se manca un capitolo, riapertura e rimozione della vecchia data, senza alterare completamenti dei capitoli, badge e sblocchi ottenuti. Lo stesso confronto governa il completamento finale.

Passati otto nuovi test di progressione e i nove test backend già presenti, per un totale di 17. Nessun test ha modificato il database reale. Verifica reale confermata dallo screenshot successivo al riavvio: la campagna compare tra le Disponibili con etichetta Disponibile e pulsante Continua; la vecchia data di completamento non ? pi? mostrata. Il livello INTERMEDIATE ? ancora visualizzato. La conservazione dei singoli capitoli completati sar? ricontrollata nel percorso.

## Prossime verifiche guidate

1. Aprire il capitolo 3 e controllare i requisiti da completare.
2. Ricontrollare la conservazione dei capitoli 1 e 2 completati.
3. Verificare lezioni, risultati quiz, badge e personaggio della campagna.
4. Provare un combattimento completo, vittoria/sconfitta e completamento del capitolo.
5. Ripetere con il MASTER per gestione contenuti, personaggi, NPC, incontri e immagini reali.

Ricaricamento e ripresa del combattimento sono una limitazione già nota, non una funzionalità completata.

Verifiche della correzione D01: TypeScript, ESLint sui file interessati e i due test browser PLAYER/MASTER superati. Nessuna sessione reale dell'utente modificata dai test automatici.

## Capitolo 3 — controllo dei requisiti

Screenshot della stessa pagina in due parti: presenti narrazione, lezione «Le basi del combattimento», quiz «Sei pronto a combattere?» e collegamento al combattimento.

Il tentativo guidato di «Completa capitolo» è stato respinto con il messaggio «Devi completare il combattimento prima di completare il capitolo», visibile nella sezione di completamento accanto al pulsante. Il codice richiede una vittoria PLAYER_VICTORY per lo stesso utente e capitolo: nessun aggiramento del requisito osservato. La risposta raggiunge il controllo del combattimento dopo quelli di lezione e quiz, coerentemente con la loro presenza già completata nella dashboard; la verifica individuale delle rispettive pagine rimane da effettuare.

Prossimo passo: aprire «Avvia combattimento» e controllare il personaggio assegnato prima di iniziare lo scontro.


### Difetto D03 - attività già completate presentate come ancora da svolgere

La pagina mostrava sempre «Vai alla lezione» e «Vai al quiz», senza etichette di completamento. Aggiunti nell'API Player gli stati individuali lessonCompleted, quizPassed e combatWon, calcolati sui dati persistiti dell'utente. La UI mostra stati espliciti e usa ?Rivedi lezione?, ?Ripeti quiz? e ?Ripeti combattimento? per attività acquisite. Le ripetizioni non azzerano i requisiti già soddisfatti. Aggiunto quizLessonId per collegare il quiz anche quando il capitolo non collega una propria lezione.

Cinque nuovi test backend coprono requisiti completati prima della fine del capitolo, requisiti pendenti, progressi misti, requisiti assenti e quiz senza lezione del capitolo. Quattro nuovi scenari browser verificano etichette e link con API simulate e persistenza al ricaricamento. Conferma nell'app reale pendente dopo riavvio del backend e ricaricamento della pagina capitolo.


### Difetto D04 - preparazione dello scontro poco informativa

Lo screenshot reale mostrava il ritratto ridotto a 64 px, soltanto nome e HP del personaggio e una frase tecnica sulla configurazione del Master.

La preparazione ora riusa CharacterCard con ritratto grande, razza, classe, livello, HP, CA, arma e incantesimo, oltre alle caratteristiche. Un nuovo endpoint GET /api/combat/chapter/{chapterId}/preview espone l’incontro effettivo e i gruppi di nemici/aiutanti con immagini, quantità, descrizioni e statistiche. Anteprima e avvio condividono autorizzazioni e validazione; la lettura non crea sessioni o turni. Rimossa la frase tecnica dal flusso Player.

Passati 28 test backend (6 nuovi per anteprima e accessi), 21 test browser con API simulate (6 nuovi per preparazione), TypeScript ed ESLint. Controllati visivamente gli screenshot desktop e mobile di prova. Conferma con dati reali pendente dopo riavvio del backend e ricaricamento della pagina.

## Combattimento reale — avvio

Screenshot ricevuto dopo l’avvio del combattimento del capitolo 3:

- Seraphina Brightshield: 12/12 HP, CA 18, iniziativa 8.
- Due Goblin delle Miniere: ciascuno con 10/10 HP; il goblin in vista ha CA 13.
- Ordine visualizzato: Goblin 1 (iniziativa 22), Seraphina (8), Goblin 2 (7).
- Goblin 1 indicato come turno corrente e ritratto corrispondente evidenziato.
- Registro a zero azioni: nessun turno NPC risolto prima della richiesta.
- Presente «Mostra l’azione di Goblin delle Miniere 1»; i comandi di attacco del Player non sono visualizzati durante il turno NPC.

Nessuna anomalia funzionale visibile in questo stato iniziale. Prossima verifica: eseguire una sola azione del Goblin 1 e controllare esito, HP e passaggio al turno del personaggio.

## Combattimento reale — prima azione NPC

Screenshot dopo una singola azione del Goblin 1:

- Tiro d20 6, totale attacco 10 contro CA 18: mancato coerente.
- Messaggio «Hai evitato l’attacco!» e «Nessun danno · HP 12 → 12».
- Seraphina conserva 12/12 HP; entrambi i goblin restano a 10/10 HP.
- Registro con una sola voce, coerente con il risultato mostrato al centro.
- Turno passato a Seraphina; arma disponibile e pulsante Attacca disabilitato finché non viene scelto un bersaglio.

Nota di testo D05 (minore, da correggere): il riepilogo del registro usa «1 azioni» invece di «1 azione».

Prossima verifica: singolo attacco del Player contro Goblin 1, controllo esito/HP e passaggio a Goblin 2 senza eseguire automaticamente la sua azione.

## Combattimento reale — primo attacco Player

Screenshot dopo un solo attacco di Seraphina contro Goblin 1:

- d20 10, totale 12 contro CA 13: attacco mancato coerente.
- Goblin 1 resta a 10/10 HP; Seraphina resta a 12/12 HP.
- Registro con esattamente due azioni e corretti attaccante/bersaglio.
- Turno e ritratto passati automaticamente a Goblin 2; il pulsante richiede ancora esplicitamente la sua azione, quindi nessun attacco NPC nascosto.

Prossima verifica: singola azione di Goblin 2. Con ordine 22/8/7, il turno successivo sarà Goblin 1 all’inizio del nuovo giro, poi Seraphina: due turni NPC consecutivi tra giri sono coerenti con l’iniziativa.

## Combattimento reale — colpo Player riuscito e vittoria

Ricevuti due screenshot con ordine di iniziativa Seraphina 17, Goblin 1 a 5 e Goblin 2 a 4, differente dall’avvio precedente: le osservazioni si riferiscono a questo scontro e non provano un recupero HP all’interno della sessione precedente.

Colpo riuscito contro Goblin 2: d20 14, totale 16 contro CA 13; dado danno d8 a 1 e danno totale 3; HP da 10 a 7. Registro a 4 azioni e turno passato a Goblin 1. Seraphina visualizzata a 9/12 HP.

Screenshot finale: ultimo attacco a Goblin 1 con d20 18, totale 20, dado danno 5 e danno totale 7. HP del bersaglio da 6 a 0, sconfitto. Entrambi i goblin sono indicati come sconfitti; Seraphina è a 9/12 HP. Messaggio «Vittoria!», registro a 15 azioni e assenza dei comandi per nuovi attacchi. La UI invita a tornare al capitolo per completarlo.

Verifica del combattimento vittorioso confermata visivamente. Prossimo passo: tornare al capitolo, controllare lo stato «Combattimento vinto», completare il capitolo e verificare il riallineamento della campagna.

## Capitolo 3 — completamento dopo vittoria

Conferma reale tramite screenshot: Lezione completata con «Rivedi lezione», Quiz superato con «Ripeti quiz», Combattimento vinto con «Ripeti combattimento». Tutti i requisiti acquisiti sono distinguibili dalle attività pendenti; D03 confermato risolto nell’app reale.

Il pulsante finale mostra «Capitolo completato» ed è disabilitato. Non sono visibili errori. Il requisito della vittoria è stato prima bloccante e poi soddisfatto nello stesso percorso di collaudo.

Rimane da controllare l’elenco Campagne: completamento complessivo e nuova data, dopo il completamento del terzo capitolo. La verifica del backoffice MASTER e dei flussi di creazione con dati reali è ancora pendente.


## Conferma campagna e nuovo storico

L’utente conferma che, dopo il completamento del capitolo 3, la campagna risulta correttamente completata nell’elenco. Percorso Player da requisiti a vittoria e completamento complessivo confermato.

Richiesta aggiuntiva: sostituire la pagina Combat senza capitolo, prima quasi vuota, con uno storico personale. Implementati API paginata e schede con campagna, capitolo, incontro, personaggio e ritratto, HP salvati, esito e data di conclusione disponibile. Vittorie, sconfitte e sessioni non concluse sono distinte; il dettaglio e il registro sono di sola lettura.

Passati 35 test backend e 28 test browser con API simulate, TypeScript ed ESLint. Screenshot desktop, mobile e dettaglio verificati. D05 corretto: singolare «1 azione» nella UI e nel registro storico. Conferma dello storico sui dati reali pendente dopo riavvio backend. La ripresa delle sessioni attive resta da implementare.


## Revisione dello storico: tentativi e accordion

Su richiesta dell’utente, lo storico viene caricato solo aprendo un accordion inizialmente chiuso. Il collegamento alle campagne resta disponibile; gli incontri aperti dal capitolo conservano preparazione e arena con ritratti e comandi centrali.

L’etichetta “In corso” diventa “Non concluso” sia nelle schede sia nel dettaglio: significa assenza di un esito finale salvato per quel tentativo. Una vittoria successiva non conclude retroattivamente i tentativi precedenti. Nessun risultato viene alterato o ricostruito. Il caso specifico dei vecchi tentativi dell’utente non è stato verificato sui dati reali.

Regressioni aggiornate per apertura manuale, tastiera, chiusura, paginazione senza richiudere lo storico e distinzione degli esiti.

Verifica finale: superati tutti i 29 test browser con API simulate, TypeScript ed ESLint. Coperti accordion, esiti e regressioni dell'arena desktop/mobile. Backend invariato rispetto ai 35 test precedentemente superati.


## Scelta personaggio per campagna

Segnalazione reale: dopo aver scelto Seraphina, le altre schede mostravano ancora pulsanti attivi, con errore dal server al clic. Corretto il frontend: avviso con il nome del personaggio scelto, schede in sola consultazione e pulsanti disabilitati per quella campagna; le altre campagne restano selezionabili. La prima scelta riuscita aggiorna immediatamente il blocco. Durante la richiesta sono disabilitate le altre scelte e il cambio campagna. La protezione backend esistente resta attiva. Aggiunti tre scenari browser con API simulate.

Verifica: TypeScript ed ESLint superati; tutti i 32 test browser con API simulate passano, inclusi i tre nuovi casi della pagina Personaggi. Conferma visuale sui dati reali dopo ricaricamento della pagina pendente.


## Collaudo Master: campagne, capitoli e incontri

Confermati dall’utente creazione e persistenza della campagna di collaudo dopo ricaricamento, modifica di nome/descrizione/difficoltà, creazione del primo capitolo narrativo e modifica persistente. Lo screenshot del secondo capitolo conferma ordine 1/2 e accesso a Configura incontro solo per il capitolo con combattimento. Il nome della campagna compare correttamente nell’intestazione dopo la creazione dei capitoli.

Segnalazione: gestione incontro troppo spoglia. Riorganizzata con contesto campagna/capitolo, invito alla creazione, passaggi di configurazione e pannello libreria NPC. Gli incontri configurati mostrano ritratti, quantità e statistiche; eliminazione in sezione richiudibile. Nessuna modifica alle API o alle regole di combattimento. Quattro nuove regressioni browser con dati simulati.

Verifica finale: TypeScript ed ESLint superati; 36 test browser con API simulate superati, inclusi i quattro nuovi scenari incontri. Screenshot desktop/mobile controllati. Conferma sulla campagna reale dopo ricaricamento pendente.


## NPC: creazione alleato e scelta immagine

L’utente conferma la creazione riuscita di Aria, esploratrice della torre come aiutante; lo screenshot mostra l’anteprima del ritratto selezionato. Persistenza dell’immagine dopo ricaricamento ancora da confermare esplicitamente. Segnalata scarsa visibilità del controllo file e dicitura nativa Nessun file selezionato anche dopo l’anteprima: il selettore viene azzerato intenzionalmente per consentire la riselezione. Sostituito con pulsante Carica/Cambia immagine e nome file mantenuto visibile nello stato del modulo. Aggiornati i test esistenti per tastiera, selezione e sostituzione.

Verificati pulsante e nome file nello screenshot del modulo di prova; TypeScript ed ESLint superati. Le regressioni NPC coprono apertura da tastiera, selezione e sostituzione prima del salvataggio.


## Personaggi Master: HP attuali dopo modifica del massimo

Confermata creazione di Thorin Stonebeard nella campagna di collaudo con ritratto, HP 14/14, CA 16 e ascia d10 su Forza. Dopo aumento del massimo a 15, lo screenshot mostrava 14/15: la logica aggiornata conservava sempre gli HP attuali. Corretto il salvataggio dei personaggi non assegnati per riallineare HP attuali e massimi; per quelli assegnati restano conservati gli HP attuali entro il nuovo massimo, senza cure o rianimazioni implicite.

Aggiunti sette casi CharacterHpUpdateTest: aumento, riduzione, massimo invariato e riparazione di una scheda non assegnata, aumento/riduzione per un personaggio assegnato e conservazione di HP zero. Superati tutti i 42 test backend mirati. Conferma reale dopo riavvio backend e nuovo salvataggio di Thorin pendente.


## Campagna intermedia creata dopo il completamento della principiante

L’utente conferma la correzione HP di Thorin. Durante il passaggio al Player giur92!, lo screenshot mostra la campagna principiante completata e quella intermedia di collaudo bloccata. Causa: lo sblocco al completamento aggiornava soltanto le campagne esistenti in quel momento; le campagne successive venivano inizializzate bloccate.

Corretto getMyCampaignProgress: prima riconcilia tutti i completamenti con i capitoli correnti, poi sblocca le campagne eleggibili in base ai completamenti personali della difficoltà precedente. Recupera anche i record già bloccati. Conserva date di completamento valide e sblocchi acquisiti; nessuna iscrizione automatica. Sei nuovi test coprono creazione successiva, riparazione idempotente, assenza prerequisiti, divieto di salto livello, passaggio intermedio/avanzato e completamenti obsoleti a prescindere dall’ordine di lettura. Superati tutti i 48 test backend mirati. Verifica reale dopo riavvio backend pendente.


## Aiutanti guaritori e risultato del gruppo

Il registro reale inviato dall’utente contiene 21 azioni: Thorin arriva a 0 HP all’azione 14 e Aria termina il combattimento all’azione 21, con vittoria alleata. Confermato funzionamento degli attacchi aiutante e bersagli nemici/alleati, ma mancavano cure e chiarezza della vittoria di gruppo.

Implementati guaritori configurabili solo tra gli aiutanti, cure con dado/bonus e riserva per singolo partecipante e scontro. Priorità a bersagli a 0 HP, poi percentuale HP più bassa; possono curarsi da soli, non superano il massimo e attaccano quando non curano. Eventi HEAL e utilizzi sono persistiti; i dati precedenti restano compatibili. Nuova presentazione verde, contatori, descrizione in anteprima e storico; vittoria di gruppo esplicita quando il Player resta fuori combattimento.

Superati 65 test backend mirati, TypeScript, ESLint e 41 test browser con API simulate. Screenshot cura desktop/mobile controllati. La prima implementazione prevedeva aggiornamento locale e uno script di transizione, successivamente rimossi nella pulizia descritta in fondo al documento. Verifica reale dello schema e di un nuovo NPC guaritore pendente. Aria già usata resta combattente: creare una guaritrice distinta per la prossima prova.


## Stile dello scorrimento iniziativa

Lo screenshot del terzo capitolo mostra tutti i cinque partecipanti (Aria, due goblin, Mira e Thorin), ma una scrollbar orizzontale nativa bianca poco coerente con il tema. Applicati pista scura, cursore primario sottile, bordi arrotondati e compatibilità con contrasto forzato. Lista raggiungibile da tastiera con focus visibile; contenuto e ordine dei turni invariati.

Verifica: TypeScript, ESLint e le due regressioni dell'arena desktop/mobile superati. Screenshot mobile controllato.


## Conferma reale dei guaritori: combattimento di 27 azioni

L’utente ha creato un nuovo capitolo e un nuovo incontro dopo il rifiuto della modifica di un incontro già utilizzato. La precedente indicazione di aggiungere Mira all’incontro usato era errata: la protezione backend è corretta e resta attiva; Ripeti combattimento usa la configurazione originale.

Registro reale del nuovo scontro con Aria, due goblin, Mira e Thorin: Mira cura Thorin all’azione 4 (d6=4 +2, HP 9→15), 14 (d6=4 +2, HP 7→13) e 19 (d6=3 +2, HP 9→14). Totale 17 HP recuperati, tre utilizzi esauriti. All’azione 9, con tutti gli alleati sani, Mira attacca senza consumare una cura. Dopo l’esaurimento attacca alle azioni 23 e 27; l’ultimo attacco infligge 6 danni al goblin con 5 HP, limitando il risultato a zero e chiudendo in vittoria.

Thorin subisce 23 danni complessivi e termina a 9/15 HP (15 +17 -23), coerente con screenshot e registro. Confermati con backend reale: caricamento del nuovo schema, configurazione/lettura del guaritore, eventi di cura distinti dagli attacchi, contatore fino a zero, ritorno agli attacchi e vittoria. Screenshot conferma anche il nuovo stile della scrollbar. Restano da confermare sui dati reali il recupero da 0 HP, il completamento del nuovo capitolo e la rilettura di queste cure dallo storico dopo ricaricamento.


## Storico: conferma reale e raggruppamento per campagna/capitolo

L’utente conferma completamento del capitolo e rilettura dello scontro con cure nello storico dopo ricaricamento. Lo screenshot mostra la vittoria con Thorin a 9/15 e il precedente esito di gruppo con personaggio a 0/15. Richiesta di ridurre l’ingombro dello storico: aggiunti accordion per campagna, chiusi inizialmente, con sezioni interne per capitolo. Rimossi i metadati ripetuti nelle singole schede. Raggruppamento per ID, gestione dei collegamenti mancanti e conservazione dei gruppi aperti tra pagine. I conteggi e una nota chiariscono che il raggruppamento riguarda la pagina corrente dello storico paginato.

Verifica: TypeScript, ESLint e tutti i 43 test browser con API simulate superati. Confermati gruppi chiusi inizialmente, apertura da tastiera, identità distinte per ID, dati storici incompleti, paginazione con gruppi aperti e mobile. Screenshot desktop controllato.


## Pulizia dello schema prima della produzione

Su richiesta dell’utente, rimossi i default Hibernate introdotti per conservare i dati di prova e lo script SQL manuale delle cure. I nuovi campi booleani e numerici di NPC, partecipanti ed eventi sono mappati NOT NULL; i primitivi sono inizializzati da Java e normalizzati dal servizio. actionType è obbligatorio con valore iniziale ATTACK nell’entità e HEAL per le cure.

Allineati README backend, frontend e generale alla creazione dello schema su database vuoto. La pulizia riguarda codice e documentazione: nessun collegamento amministrativo, reset del database o cancellazione di dati. I default e i dati già presenti nel database restano fino alla sua ricreazione separata.

Verifica della pulizia: compilazione e tutti i 65 test backend mirati superati. Nessuna annotazione ColumnDefault o riferimento operativo allo script rimosso rimasto nei sorgenti e nei README. Nessun reset o test su un database reale eseguito in questa fase.
