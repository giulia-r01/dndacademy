# Revisione finale prima del merge

Controllo del 13 novembre 2026 sulla branch `chore/preparazione-preproduzione`. La revisione riguarda l'intero monorepo; non esegue commit, merge, push, deploy o modifiche ai database dell'utente.

## Pulizia

Rimossi sei file frontend senza collegamenti dalle rotte, confermati anche tramite ricerca dei riferimenti:

- `src/components/campaigns/CampaignCard.tsx`.
- `src/components/combat/AttackResultCard.tsx` e `DiceRollResult.tsx`.
- `src/components/dashboard/AchievementCard.tsx` e `ProgressCourseCard.tsx`.
- `src/types/question.ts`, duplicato non importato rispetto ai tipi usati dai servizi attuali.

Non restano file TypeScript del frontend fuori dal grafo degli import delle pagine. Il controllo TypeScript con `noUnusedLocals` e `noUnusedParameters` è passato. Nel backend le classi sono referenziate dai servizi, dai test o dai meccanismi di Spring/JPA: non sono state eliminate classi solo perché caricate indirettamente.

Rimossi i commenti esplicativi dai sorgenti applicativi, dai test e dalle configurazioni riviste, e i metadati vuoti del template Maven. La pulizia JavaScript/TypeScript è stata verificata confrontando il codice compilato prima e dopo, senza variazioni di comportamento. Conservati il JSDoc necessario ai tipi della configurazione JavaScript, la direttiva Docker `# syntax`, i file guida degli agenti, licenze e istruzioni dei wrapper generati. I commenti italiani di `.env.example` restano come istruzioni di configurazione.

Gli script SQL non sono stati modificati, inclusi i commenti: Flyway verifica i checksum delle migrazioni già applicate. Conservati anche conversione dei personaggi legacy e script del primo Master, perché hanno scopi operativi distinti e non entrano nell'immagine Docker.

La nuova esclusione nella radice copre `/.idea/` e `/target/` senza dipendere dalle impostazioni Git globali. Rimosse le cartelle vuote `src/main/resources/static` e `templates` del backend: il frontend è un servizio Next.js separato. `node_modules`, `.next`, `.tmp`, esportazioni di analisi e output Maven sono locali o generati, esclusi dai sorgenti da pubblicare: non sono stati cancellati archivi personali o dipendenze necessarie al lavoro locale. Git non conserva cartelle vuote. La pulizia non introduce dipendenze né elimina dipendenze richieste da peer o caricamenti indiretti.

## Documentazione

Aggiornati i README generale, backend e frontend, le guide a migrazioni, Docker, autenticazione, email, errori, navigazione, profilo, privacy e tour. I documenti che descrivevano un prototipo o una configurazione precedente indicano ora il comportamento corrente. La guida Railway/Vercel riporta stato attuale e passaggi residui, senza ripetere tutta la cronologia dei terminali.

I resoconti del 29 e 30 ottobre restano consultabili, contrassegnati come storici con rimando alle istruzioni correnti. La documentazione della campagna Pietraluce resta materiale didattico utile all'inserimento e ai test, non un seed o codice morto. Verificati i collegamenti relativi nei documenti del repository.

## Verifiche dopo la pulizia

| Controllo | Esito |
| --- | --- |
| TypeScript, inclusi locali/parametri inutilizzati | Superato |
| Lint frontend | Superato |
| Configurazione API e rifiuto delle build errate | 31 test superati |
| Build Next.js di produzione con `.env.local` esistente | Superata |
| Suite browser completa con API simulate | 126 test superati |
| Docker multistage, Java 17, Maven verify e packaging | 218 test superati, nessun fallimento o errore |
| Immagine finale | Utente 10001:10001; JAR con quattro migrazioni |
| Ispezione JAR | Assenti `env.properties`, `.env*`, classi di test, H2 e DevTools |
| File con credenziali locali | Ignorati e non tracciati; non presenti tra i file del commit |
| Controllo dei pattern di segreti nei sorgenti | Solo valori fittizi dei test; nessuna credenziale reale rilevata |
| Script SQL e checksum | Nessuna modifica rispetto al commit iniziale della revisione |

Un test browser del selettore immagini aveva un'attesa fragile tra focus e Invio generico sulla pagina. L'azione da tastiera ora viene indirizzata direttamente al pulsante con `locator.press("Enter")`, mantenendo il controllo del selettore file. La suite completa è stata rieseguita: 126/126, senza modifiche al codice del caricamento.

La build di verifica usa il tag locale separato `dndacademy-backend:premerge-check`, digest manifest list `sha256:0260708711646a43946a4e5d9fbb956ac29a9a0014dc28e4684ce310f1c88818`. Non ha sostituito il container dell'utente. Il container temporaneo usato solo per estrarre il JAR non è stato avviato ed è stato rimosso dopo l'ispezione. I test non contattano Gmail o Cloudinary reali.

Le prove PostgreSQL 17 temporanee della cancellazione account e della coda email, svolte nelle revisioni precedenti, restano documentate nelle rispettive guide. Questa pulizia non cambia SQL, mapping o regole: la verifica backend corrente è stata ripetuta integralmente dentro Docker con H2 isolato.

## Dopo il commit e il merge dell'utente

Il codice è pronto per avviare il [deploy di collaudo Railway/Vercel](preproduzione-railway-vercel.md). Prima dell'apertura pubblica restano configurazione dei servizi reali, applicazione V4 al Docker locale se si vuole provarlo lì, primo Master, OAuth definitivo, collaudo applicativo cloud e backup con ripristino. Il superamento dei test locali non conclude questi passaggi.
