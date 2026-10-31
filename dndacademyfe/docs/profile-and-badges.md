# Profilo e badge: verifica prima del rilascio

## Contratto API

Tutte le API richiedono autenticazione e operano sull'utente della sessione.

| Endpoint | Dati | Risultato |
| --- | --- | --- |
| `GET /api/users/me` | — | Profilo con `avatarUrl`, ruolo e livello |
| `PATCH /api/users/me` | `username`, `email`, `currentPassword` | Profilo aggiornato |
| `PUT /api/users/me/password` | `currentPassword`, `newPassword` | 204; tutte le sessioni precedenti invalidate |
| `PUT /api/users/me/avatar` | Multipart, campo `file` | Profilo con nuovo avatar |
| `DELETE /api/users/me/avatar` | — | Profilo senza avatar |
| `GET /api/badges/catalog` | — | Catalogo con `unlocked` e `unlockedAt` personali |

Username: 3–40 caratteri tra lettere ASCII, numeri, punti, trattini e underscore. Email normalizzate in minuscolo; username univoci e sensibili alle maiuscole. Il cambio di username mantiene l'ID e tutti i progressi. Ruolo e livello non sono modificabili dal profilo.

Registrazione, recupero e cambio password condividono la stessa validazione: almeno 8 caratteri, una maiuscola ASCII, un numero o uno dei simboli indicati nel validatore, massimo 72 byte UTF-8 per BCrypt. Cambiare password invalida tutte le sessioni e i link di recupero; cambiare email invalida i link precedenti e richiede la password attuale.

Le immagini ammesse sono JPG, PNG e WEBP fino a 5 MB. Cloudinary valida il formato effettivo. L'asset ha un identificatore stabile per utente: la sostituzione sovrascrive l'immagine precedente e invalida la cache; la rimozione elimina anche l'asset remoto.

## Database ricreato e ambiente di test

Le modifiche aggiungono `users.avatar_url`, `users.token_version`, `badges.system_code` e il vincolo unico su `(user_id, badge_id)` in `user_badges`. Non è stata eseguita alcuna pulizia del database applicativo.

I token usano ora l'ID utente e la versione delle credenziali: le sessioni emesse con il formato precedente richiedono un nuovo login. Dopo un reset del database con riutilizzo degli ID, cambiare anche `JWT_SECRET` per impedire il riutilizzo di token dei vecchi account. Avviare insieme frontend e backend aggiornati.

All'avvio vengono creati i tre badge di sistema mancanti: Primo Quiz, Studente di D&D e Avventuriero Esperto. Il codice stabile mantiene le assegnazioni automatiche anche se il Master modifica il titolo. I badge di sistema non si possono eliminare. Il badge Esperto richiede il livello avanzato (5 lezioni e 5 quiz distinti).

La configurazione di produzione deve gestire lo schema tramite una procedura di rilascio controllata; il reset locale non costituisce una migrazione di produzione. Questa modifica non cambia le impostazioni di creazione/aggiornamento schema esistenti.

## Verifiche

- Frontend: `npm run lint`, `npm run build`, `npm run test:ui` con il server già avviato. Usare `UI_BROWSER_PATH` per un browser installato, oppure installare Chromium di Playwright. `UI_BASE_URL` cambia l'indirizzo del server.
- Backend: `mvnw.cmd test`. La configurazione test usa H2 isolato con schema ricreato, senza usare il database dell'applicazione (salvo override esplicito delle variabili `TEST_DATABASE_*`).
- Per il collaudo finale usare due sessioni reali: verificare che il cambio password in una invalidi l'altra e che la nuova password permetta di accedere.
- Con le credenziali Cloudinary dell'ambiente finale verificare caricamento, sostituzione e rimozione di una vera immagine, anche dopo ricaricamento della pagina. I test automatici simulano il servizio remoto.
- Dopo il reset, creare gli account di test e i contenuti didattici: controllare i badge automatici al primo quiz, a due quiz e al livello avanzato. L'inizializzazione dei badge non crea utenti Master, lezioni o quiz.
