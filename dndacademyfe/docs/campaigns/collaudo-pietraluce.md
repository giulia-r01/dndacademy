# Inserimento e collaudo di Pietraluce

Questo documento riguarda esclusivamente la configurazione e la verifica del software. Non copiare questi testi nei capitoli, nelle lezioni o nei quiz destinati ai giocatori.

Contenuti didattici e storia: [Il faro di Pietraluce](il-faro-di-pietraluce.md). Schede adattate all’arena: [Gli otto eroi](personaggi-pietraluce.md).

## Esito della prima esecuzione

Il **6 novembre 2026** l’utente ha confermato di aver giocato la campagna con esito positivo. Il lavoro successivo riguarda la chiarezza delle spiegazioni per un principiante: definizioni prima delle formule, esempi di calcolo e distinzione tra termini simili. La conferma non è una rilevazione comparativa di tutti gli otto personaggi; la tabella in fondo rimane disponibile per annotare le prove successive. Le differenze tra regole di D&D e simulazione elencate sotto rimangono documentate separatamente dall’esito della partita.

## Differenze da tenere esplicite

Le lezioni insegnano D&D 5e, regole base 2014. L’arena attuale ne rappresenta solo una parte. I quiz verificano il testo della lezione e non il comportamento dell’implementazione.

| Tema | Regola didattica | Situazione da collaudare nell’app |
| --- | --- | --- |
| Tiro per colpire | Include la competenza quando applicabile | Il calcolo attuale del personaggio usa il solo modificatore della caratteristica. Non usare il suo totale come esempio della formula completa di D&D. |
| Turno | Movimento e azione; azioni bonus e reazioni quando previste | L’interfaccia espone un sottoinsieme delle azioni e fa avanzare i PNG tramite un comando. Questo comando non è una regola di D&D. |
| Cure | Possono provenire da personaggi, PNG, incantesimi e altre risorse | Il comando di cura Player non è disponibile; il comportamento automatico dei PNG guaritori è una scelta dell’app. Mira non perde la capacità narrativa di essere una Chierico per questo limite. |
| Zero punti vita | Si applicano incoscienza, stabilizzazione e tiri salvezza contro morte, salvo eccezioni | Il flag fuori combattimento dell’arena non simula l’intera procedura. Non insegnare che zero HP equivalgano automaticamente a morte o sconfitta della squadra. |
| Magia | Ogni incantesimo specifica tempo, bersagli, eventuali attacchi o tiri salvezza ed effetti | L’arena modella attacchi magici semplificati, non slot, concentrazione, intere liste di incantesimi o tutte le cure. Aggiunge inoltre il modificatore al danno del proprio attacco magico: non è una regola generale degli incantesimi. |
| Esplorazione | Il DM può richiedere prove e risolvere approcci diversi | Le scelte narrative e le prove descritte nella quinta lezione non hanno un modulo interattivo dedicato. Il quiz ne verifica la comprensione. |
| Schede e incontri | Un gruppo al tavolo può avere più personaggi ed equipaggiamento completo | Le otto schede sono alternative per account Player distinti. Le tabelle di inserimento restano una configurazione ridotta, non schede ufficiali complete o incontri con un grado di sfida certificato. |
| Avanzamento | Il livello del personaggio segue le regole della campagna al tavolo | Livello di apprendimento, quiz, badge, sblocco campagne e pulsante Completa capitolo sono funzionalità didattiche dell’app. |

Queste differenze sono limiti da valutare per il prodotto, non correzioni alle regole insegnate. Questa revisione modifica contenuti e documentazione, non il motore di combattimento. Prima di usare un risultato dell’arena come dimostrazione numerica di una regola completa, occorre allinearne il calcolo o indicare chiaramente la semplificazione nella relativa attività.

## Ordine di creazione come Master

1. Accedi all’Area Master ed esci dall’eventuale tour: lavora sulle pagine reali della gestione contenuti.
2. Crea la campagna con nome, descrizione e difficoltà indicati nel documento della campagna e controlla che rimanga presente dopo un ricaricamento.
3. Selezionala nella sezione Personaggi e crea le otto schede del documento collegato. Carica i ritratti originali corrispondenti, se disponibili.
4. Crea le cinque lezioni del documento della campagna. Su un catalogo vuoto usa ordine 1, 2, 3, 4, 5. Se ci sono già lezioni, scegli un blocco di cinque ordini consecutivi liberi: l’ordine delle lezioni vale per l’intero catalogo, non solo per questa campagna.
5. Imposta **Sbloccata di default = Sì soltanto per PL01**, No per PL02–PL05. Completare la lettura o superare il quiz sblocca la lezione con ordine immediatamente successivo.
6. Crea un quiz per ciascuna lezione, con i titoli e la soglia indicati. Apri le domande e inserisci le tre risposte di ogni domanda, segnando quella corretta secondo la chiave riservata al Master.
7. Crea i cinque badge personalizzati e i cinque PNG descritti nel documento della campagna.
8. Crea tutti e cinque i capitoli nella campagna, con ordine 1–5. Associa a ognuno la sua lezione, il quiz della stessa lezione e il suo badge. Abilita il combattimento solo per i capitoli 2, 3 e 5.
9. Dai capitoli 2, 3 e 5 apri la gestione dell’incontro e inserisci i partecipanti con le quantità indicate. Per gli altri PNG lascia quantità zero.
10. Prima di iniziare come Player ricontrolla collegamenti, quantità e ritratti. Le schede e gli incontri già usati in combattimento sono protetti dalle modifiche: la configurazione va completata prima della partita.


## Esecuzione come Player e risultati da osservare

Usa un **account Player nuovo** per verificare la progressione da zero. Se usi un account con attività già completate, livelli e badge automatici potrebbero essere già acquisiti. Uscire dal Master e accedere come Player permette anche di verificare menu e permessi dei due ruoli.

| Momento | Azione da provare | Risultato atteso |
| --- | --- | --- |
| Inizio | Apri la campagna Principiante e iscriviti | Campagna accessibile; primo capitolo disponibile, successivi bloccati |
| Primo capitolo | Prova a completarlo senza attività | Completamento non disponibile finché mancano i requisiti |
| PL01 | Leggi, poi invia il quiz con almeno due errori | Quiz non superato; il requisito del quiz rimane da soddisfare |
| PL01, nuovo tentativo | Rispondi correttamente ad almeno tre domande | Quiz superato, Primo Quiz ottenuto, lezione PL02 sbloccata |
| Chiusura capitolo 1 | Torna e completa il capitolo | Badge Chiamata di Pietraluce; capitolo 2 disponibile |
| Prima del primo scontro | Scegli uno degli otto eroi | Una sola scelta per campagna; altre schede non assegnabili allo stesso Player |
| Capitolo 2 | Completa PL02 e il suo quiz | Su account nuovo: livello Intermedio e badge Studente di D&D |
| Scontro al ponte | Apri la preparazione senza avviare | Puoi controllare i partecipanti prima del nuovo tentativo |
| Primo avvio | Avvia e segui i turni | Un eroe e un goblin; bersaglio richiesto nel turno del Player |
| Tentativo aperto | Lascia la pagina e usa lo storico per riprendere | Stesso tentativo e stesso registro, senza nuovo avvio |
| Dopo una vittoria | Apri i dettagli nello storico | Consultazione dell’esito; la vittoria non viene riaperta come tentativo attivo |
| Capitolo 3 | Avvia l’incontro | Due goblin distinti e Aveline, oltre al Player |
| Turni di Aveline | Controlla ferite, registro e cure rimaste | Cura quando necessaria e disponibile, senza superare gli HP massimi; nessun obbligo di curare ogni turno |
| Personaggio a zero, se accade | Prosegui con gli alleati ancora attivi | Il combattimento può continuare; soccorso o vittoria di gruppo quando le condizioni lo permettono |
| Capitolo 4 | Completa lezione e quiz | Capitolo completabile senza alcun combattimento |
| Personaggio incantatore | Prova arma e incantesimo durante i tuoi turni | Azione, caratteristica e dado coerenti con la scheda scelta |
| PL05 | Completa la quinta lezione e supera il quinto quiz distinto | Su account nuovo: livello Avanzato e badge Avventuriero Esperto |
| Scontro finale | Avvia l’incontro | Due nemici e due aiutanti, oltre al Player: cinque partecipanti |
| Conclusione | Vinci e completa il capitolo 5 | Campagna completata e cinque badge personalizzati ottenuti |
| Dopo la conclusione | Ricarica campagna, badge, profilo e storico | Progressi, livello e risultati persistenti |
| Ripasso | Sbaglia un quiz già superato | Il nuovo esito è consultabile ma il requisito già acquisito non viene annullato |

Il livello di apprendimento Avanzato **non** sblocca da solo campagne di difficoltà Avanzata. Per provare anche la progressione tra difficoltà, dopo questa campagna crea una campagna Intermedia separata e verifica che sia accessibile al Player che ha completato Pietraluce. Il controllo delle campagne Avanzate richiede poi il completamento di una Intermedia.

## Scheda essenziale per annotare la prova

Per ogni account annota: personaggio scelto, capitoli completati, tentativi necessari per i tre incontri, eventuale uso di arma e incantesimo, cure osservate e problemi di interfaccia. Segna il nome del capitolo e l’azione precisa in caso di errore.

| Player | Personaggio | Ponte: tentativi | Santuario: tentativi | Faro: tentativi | Cure osservate | Campagna completata | Note |
| --- | --- | --- | --- | --- | --- | --- | --- |
| | Nyx Ashwalker | | | | | | |
| | Valen Moonsong | | | | | | |
| | Thorin Stonebeard | | | | | | |
| | Lyra Nightleaf | | | | | | |
| | Elion Ravenspark | | | | | | |
| | Mira Dawnlight | | | | | | |
| | Seraphina Brightshield | | | | | | |
| | Kael Greenarrow | | | | | | |

La prima prova consigliata è con Thorin per verificare il percorso e il combattimento con arma; una seconda con Elion mette alla prova incantesimi e difesa più bassa. Poi confronta gli altri senza riutilizzare lo stesso account per cambiare personaggio a metà campagna.
