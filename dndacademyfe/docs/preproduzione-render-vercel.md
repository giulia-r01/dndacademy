# Preparazione Render, Neon e Vercel

Il percorso di rilascio prevede backend Docker su Render, PostgreSQL su Neon e frontend Next.js su Vercel. Questa guida sostituisce il precedente piano di hosting. Lo sviluppo locale e il database di preproduzione esistente restano separati dai servizi remoti.

## Stato corrente

| Area | Preparato nel progetto | Collaudo remoto necessario |
| --- | --- | --- |
| Backend | Profilo `render` che include `prod`, porta da `PORT`, JVM documentata e connessioni limitate | Avvio, memoria e tempi di risposta effettivi su Render |
| Database | Flyway V1–V4, validazione Hibernate, URL runtime e migrazioni distinti, pool che rilascia le connessioni inattive | Neon con TLS, runtime tramite pooler e Flyway tramite endpoint diretto |
| Sonde | Liveness senza query DB, readiness diagnostico con query DB; risposte pubbliche contenenti solo stato | Impostare `/actuator/health/liveness` come Health Check Path |
| Sicurezza | JWT, ruoli, revoca sessioni, quote persistenti; modalità proxy Render con `CF-Connecting-IP` | Verificare IP distinti e resistenza agli header contraffatti attraverso il proxy reale |
| Code | Notifica dopo commit, scadenze persistenti, recupero al riavvio e scansione periodica delle code senza lavori attesi | Verificare sospensione/riattivazione con email e avatar reali |
| Frontend | Validazione URL API, avviso sulle risposte lente, timeout e gestione del proxy senza reinvio automatico | URL HTTPS Render, CORS con origine Vercel e prova del risveglio |
| Account | Primo Master manuale e cancellazione autonoma con trasferimento dei contenuti | Eseguire le procedure solo sui propri account di collaudo verificati |
| Privacy | Pagina pubblica con Giulia Rizzo, Italia, contatto dnd.academy.team@gmail.com e fornitori aggiornati | Confermare regioni, conservazione, accordi e procedure effettive |

La procedura completa e tutte le variabili si trovano in [Deploy Render/Neon](deploy-render-neon.md). Le verifiche della nuova configurazione sono riportate nello stesso documento. Il [resoconto della pulizia precedente](revisione-finale-premerge.md) resta storico e non sostituisce le impostazioni correnti di deploy.

## Sequenza

1. Completare controlli locali, commit e merge a cura dell'utente.
2. Creare un database Neon dedicato e predisporre Render/Vercel, raccogliendo URL e variabili effettivi senza pubblicare credenziali nel repository.
3. Usare il profilo `render`, applicare le migrazioni, verificare liveness, readiness e CORS. Il database nuovo contiene solo i badge di sistema inizializzati dal backend, senza account o campagne di prova.
4. Registrare e verificare il proprio account; eseguire la [procedura del primo Master](../../dndacademyBE/docs/FIRST_MASTER.md) con i dati reali solo nella copia locale dello script o nell'editor SQL amministrativo.
5. Rendere raggiungibili homepage e privacy, completare Branding e consenso OAuth Google e provare benvenuto e recupero password dal cloud.
6. Inserire e svolgere una campagna con due Player: stesso modello disponibile, storia, lezione, quiz, vittoria/sconfitta, ripresa, completamento e badge. Provare anche profilo, cambio password, immagini, cancellazione account, tour e mobile.
7. Verificare inattività, riattivazione, conservazione dopo redeploy e ripristino di un backup su un database separato. Finalizzare la [guida privacy](privacy-rilascio.md).
8. Aprire l'app al pubblico solo dopo il collaudo. Il rollback del codice non annulla le migrazioni: verificarne la compatibilità prima degli aggiornamenti.

## Dati e file locali

Non trasferire sul database pubblico utenti, token o progressi dei test. Per conservare la campagna Pietraluce usare i [contenuti documentati](campaigns/il-faro-di-pietraluce.md) oppure un'esportazione separata dei soli contenuti con tutte le dipendenze. Le immagini ancora referenziate non vanno cancellate come risorse di prova.

`env.properties`, `.env.local` e `.env.docker.local` restano ignorati da Git e fuori dal pacchetto di produzione. Il profilo locale `dev` non è il profilo di rilascio. I vecchi script di conversione dei personaggi servono solo ai database legacy e non si eseguono sul nuovo database Neon.
