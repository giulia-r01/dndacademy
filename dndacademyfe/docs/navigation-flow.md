# Navigazione e percorso dell'utente

## Aree e menu

Il login completa il caricamento del profilo prima della navigazione: un Player entra in `/dashboard`, un Master in `/admin`. Il Master può passare da Area Master ad Area Player dal selettore della sidebar. Il profilo mantiene l'area di provenienza quando aperto dal menu o dall'avatar. I permessi continuano a dipendere dal ruolo restituito dal backend.

Il menu Player raggruppa Il tuo percorso, Campagne e Biblioteca lezioni; I tuoi personaggi e Storico combattimenti; Badge. Profilo e uscita si trovano nel menu apribile dall'avatar in alto, utilizzabile anche da tastiera e su mobile. Il menu Master raggruppa gestione campagne, didattica, risorse e utenti. Il menu scorre quando l'altezza dello schermo non basta; il riquadro del livello con la barra resta in fondo alla sidebar.

Le etichette dei livelli di apprendimento sono condivise tra menu, profilo e schermate di riepilogo: Principiante, Intermedio e Avanzato. La barra rappresenta il livello raggiunto su tre livelli, non una percentuale di completamento delle lezioni.

## Player

La dashboard propone di iniziare una campagna, riprendere i capitoli delle campagne in corso o riprendere uno scontro aperto restituito dalla pagina recente dello storico. Le statistiche sono secondarie rispetto alle azioni. Con più campagne in corso vengono mostrate separatamente, senza inventare un ordine di attività recente non fornito dalle API. In caso di errore di caricamento, la schermata offre un recupero esplicito e non interpreta l'errore come assenza di campagne.

L'iscrizione apre direttamente la campagna. Da qui l'utente apre il prossimo capitolo e legge la storia prima di scegliere le attività richieste. I personaggi sono selezionabili soltanto nelle campagne sbloccate a cui l'utente è iscritto; il collegamento dalla campagna preseleziona quella corretta. La preparazione del combattimento permette anche di scegliere il personaggio sul posto.

Nel capitolo il prossimo passo è derivato dai requisiti reali: lettura, quiz, combattimento o completamento. Il pulsante di completamento è disabilitato finché mancano requisiti; dopo il completamento si aggiornano i capitoli dal backend per proporre il successivo sbloccato. Lezioni senza quiz possono essere segnate come lette tramite l'API di completamento già esistente.

Una lezione o un quiz aperti da un capitolo ricevono `campaignId` e `chapterId` nella query. Il frontend verifica tramite l'API che il capitolo sia sbloccato e che l'attività corrisponda alla lezione o al quiz associati. Solo dopo questa verifica mostra il percorso campagna nei breadcrumb e i collegamenti di ritorno. La biblioteca resta consultabile indipendentemente dalle campagne.

## Rotte contestuali

| Funzione | Rotta |
| --- | --- |
| Campagna | `/campaigns/[campaignId]` |
| Capitolo | `/campaigns/[campaignId]/chapters/[chapterId]` |
| Combattimento del capitolo | `/campaigns/[campaignId]/chapters/[chapterId]/combat` |
| Ripresa di un tentativo | Rotta combattimento con `?combatId=...` |
| Lezione nella campagna | `/lessons/[lessonId]?campaignId=...&chapterId=...` |
| Quiz nella campagna | `/lessons/[lessonId]/quiz?campaignId=...&chapterId=...` |
| Incontro Master | `/admin/campaigns/[campaignId]/chapters/[chapterId]/encounter` |
| Storico | `/combat` |

I vecchi URL `/combat?campaignId=...&chapterId=...` e `/admin/encounters?campaignId=...&chapterId=...` reindirizzano alle nuove rotte. Gli ID vengono validati prima di renderizzare le schermate. Le schermate dinamiche usano chiavi basate sugli ID per evitare che stato e richieste di una pagina precedente si mescolino con quelli di un'altra.

La ripresa di un combattimento legge lo stato salvato tramite `getStatus`: non chiama l'API che crea o riavvia un tentativo. La corrispondenza tra combattimento, campagna e capitolo viene verificata prima di mostrare l'arena.

## Master

La panoramica presenta l'ordine di preparazione: campagna e personaggi, contenuti e risorse, capitoli e incontri. Gli incontri non sono una destinazione autonoma del menu; si aprono dal capitolo. La pagina dei capitoli offre collegamenti alle risorse necessarie per prepararli.

## Verifiche

`npm run test:ui` comprende i test dei flussi Player e Master, del login, del combattimento, del profilo e dei badge. Il server deve essere avviato; `UI_BASE_URL` e `UI_BROWSER_PATH` permettono di indicare server e browser. Le API sono simulate nei test browser.

Questa riorganizzazione non modifica backend, schema del database o autorizzazioni e non introduce ancora il tour di primo avvio.
