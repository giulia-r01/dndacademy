# Primo Master sul database nuovo

La registrazione pubblica crea sempre un PLAYER. Il primo MASTER viene promosso manualmente dall'operatore che controlla il database, dopo aver creato e verificato il proprio account. Non esistono credenziali predefinite, endpoint pubblici di promozione o promozioni automatiche basate sull'email.

## Procedura

1. Avviare l'app sul database di collaudo nuovo e completare le migrazioni Flyway. Registrare il proprio account dalla schermata pubblica, verificare di poter accedere e ricevere le comunicazioni all'indirizzo indicato. L'app non dispone di un flusso di verifica email: questo controllo è responsabilità dell'operatore.
2. Aprire una connessione amministrativa **al database corretto**, controllando nome e ambiente. Prima della promozione annotare privatamente i dati ottenuti da queste query:

```sql
SELECT current_database() AS database_corrente, current_user AS operatore;
SELECT id, username, email, role
FROM public.users
ORDER BY id;
SELECT count(*) AS master_presenti
FROM public.users
WHERE role = 'MASTER';
```

3. Copiare [bootstrap-first-master.sql](operations/bootstrap-first-master.sql) nel Query Tool o in un file locale non tracciato. Nella copia compilare `target_id`, `target_username` e `target_email` usando i tre valori dello stesso account verificato. Per un apostrofo in un valore SQL usare due apostrofi. Non inserire password e non salvare dati reali nel file versionato.
4. Eseguire l'intero blocco `DO`, da solo, con autocommit attivo. Il messaggio di successo viene emesso solo dopo l'aggiornamento di un unico Player. Se il client usa una transazione manuale, rendere permanente il successo con `COMMIT`; dopo un errore usare `ROLLBACK` prima di riprovare.
5. Verificare nuovamente ID, username, email e ruolo con la query di sola lettura. Uscire dall'app e accedere di nuovo: le vecchie sessioni vengono invalidate dall'incremento di `token_version`. Verificare l'accesso all'Area Master, la creazione di un contenuto e che un normale Player non abbia i relativi permessi.

Le promozioni successive si eseguono dall'Area Master. Non riutilizzare questo script per recuperare un account perso o cambiare ruolo a utenti quando esiste già un Master: serve una procedura di recupero separata e controllata. Non cancellare account per aggirare il blocco.

## Garanzie e limiti

Il blocco è atomico: parametri mancanti, identità non corrispondente, ruolo diverso da PLAYER o presenza di un Master interrompono l'operazione. Il confronto username è esatto; quello email ignora soltanto maiuscole/minuscole. Non vengono create credenziali o modificati password, contenuti e progressi. Il lock sulla tabella serializza due esecuzioni concorrenti e blocca altre scritture sugli utenti fino al termine: eseguire l'operazione durante il collaudo, prima dell'apertura pubblica.

Lo script è esterno a `src/main/resources/db/migration`, non è una migrazione Flyway e non entra nell'immagine Docker. I parametri versionati sono intenzionalmente vuoti. L'app continua ad applicare JWT e autorizzazioni esistenti; il controllo dell'operatore e della connessione al database resta necessario. L'incremento di `token_version` forza l'emissione di un nuovo token al login.

## Verifica del 13 novembre 2026

Script eseguito su PostgreSQL 17 temporaneo in Docker, senza porte pubblicate, con schema reale V1 e due account fittizi. Verificati rifiuto dei parametri vuoti, email errata, username errato e ID inesistente senza modifiche; promozione corretta anche con maiuscole nell'email; incremento della versione del token da 7 a 8; secondo account invariato; rifiuto della ripetizione e della promozione di un altro account dopo il primo Master. Il container è stato rimosso al termine. Nessuna connessione ai database dell'utente e nessun invio email. Il comportamento concorrente è protetto dal lock, ma non è stato oggetto di una prova concorrente separata. Il collaudo dei permessi dall'app dopo il deploy resta necessario.
