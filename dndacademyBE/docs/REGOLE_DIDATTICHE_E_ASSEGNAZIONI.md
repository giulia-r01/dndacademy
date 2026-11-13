# Quiz, personaggi e combattimenti didattici

Decisioni del 10 novembre 2026 per il percorso individuale, senza interazione tra Player.

## Quiz: requisiti e valutazione sono responsabilità del server

Per leggere il quiz e le domande come Player, la lezione collegata deve risultare sbloccata e completata per quell'account. Il completamento viene salvato con **Segna come letta**. L'invio delle risposte richiede lo stesso requisito anche per un account Master che sta giocando. Il Master può invece consultare quiz e domande durante la preparazione dei contenuti senza doverli svolgere.

Il server rifiuta richieste con domande mancanti o duplicate, risposte di altre domande/quiz e quiz senza domande. Ogni domanda viene valutata una sola volta: il punteggio rimane tra 0 e 100. Una richiesta rifiutata non deve produrre risultati, badge o progressi. L'invio è transazionale, compresi gli aggiornamenti collegati.

## Personaggi: modello riutilizzabile e copia personale

Il Master prepara un modello. Sceglierlo crea un nuovo record personale: identità, immagine, attacchi e caratteristiche vengono copiati, con una nuova riga delle statistiche. Il modello resta disponibile agli altri Player. Rimane il vincolo unico su campagna e Player e la selezione è serializzata per impedire due copie allo stesso account in richieste concorrenti.

I due ruoli sono rappresentati nella tabella `characters`: un modello non ha né Player né `source_template_id`; una copia ha entrambi. Il riferimento al modello è esplicito e protetto da foreign key. La copia conserva lo snapshot scelto: successive modifiche del modello valgono per le nuove scelte e non cambiano personaggi già assegnati o storico. Le copie personali non sono modificabili tramite il catalogo Master. Un modello con copie non può essere eliminato. Le immagini sono riferimenti copiati, senza duplicare il file su Cloudinary.

Gli endpoint di scelta/catalogo mantengono gli URL esistenti; `claim` restituisce l'ID della **nuova copia**, diverso dall'ID richiesto. Il DTO aggiunge `templateId` e `assignedCount`. Il catalogo Master restituisce i modelli; `/me` restituisce le copie personali.

### Database esistente

Solo per un database legacy precedente ai modelli riutilizzabili, eseguire a applicazione ferma e dopo un backup [la migrazione PostgreSQL](migrations/2026-11-10-character-templates.sql). Aggiunge il riferimento e ricrea un modello per ogni vecchia scheda già assegnata, lasciando invariati gli ID personali, le statistiche e i riferimenti dei combattimenti. Le vecchie schede non assegnate restano modelli. Lo script è transazionale e rieseguibile. Non viene applicato automaticamente né azzera il DB.

Un database nuovo usa lo schema Flyway aggiornato, senza eseguire la conversione manuale. I test H2 verificano i vincoli e le transazioni; la migrazione SQL richiede il collaudo PostgreSQL dell'ambiente di rilascio.

## HP: incontri indipendenti per imparare

Ogni nuovo combattimento di questa versione è un'esercitazione indipendente: il partecipante parte dagli HP massimi della copia personale, anche dopo una sconfitta precedente. Danni, cure e utilizzi degli aiutanti rimangono nel singolo tentativo. Riprendere un combattimento esistente recupera esattamente gli HP e gli eventi salvati: non avvia un nuovo esercizio e non cura nessuno.

È una semplificazione didattica dichiarata nella preparazione. Nelle regole D&D 5e 2014 i punti vita dipendono da danni, cure e riposi; non tornano automaticamente al massimo prima di ogni scontro. La gestione persistente delle risorse e dei riposi sarà un obiettivo didattico distinto, da introdurre insieme alle relative azioni, non con una semplice persistenza dei danni che potrebbe bloccare il principiante.

## Collaudo

Le regressioni coprono accesso e invio del quiz, autore Master, risposte duplicate, quiz vuoto, copie concorrenti dello stesso modello, doppia scelta dello stesso Player, indipendenza delle caratteristiche, modifiche del modello e degli HP, protezione delle copie, nuovo tentativo a HP pieni e ripresa senza reset. I test non accedono al database applicativo e non caricano immagini reali.
