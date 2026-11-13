# Privacy e pubblicazione

Aggiornamento del 13 novembre 2026. Titolare confermato: Giulia Rizzo, Italia; contatto pubblico: dnd.academy.team@gmail.com.

## Implementazione

L'informativa è disponibile senza login su `/privacy`, con collegamenti da homepage, schermate di accesso e registrazione e area autenticata. La registrazione invita a leggerla senza introdurre un consenso obbligatorio: l'erogazione del servizio si basa sulla richiesta dell'utente, mentre le misure antiabuso hanno una finalità di sicurezza. Non sono introdotti strumenti pubblicitari.

Il testo descrive account, attività didattica, immagini, email, conservazione, memoria locale, diritti e fornitori previsti per il rilascio. Gmail API usa il consenso del mittente dell'app: i destinatari non autorizzano l'accesso alle proprie caselle Google.

La pagina è statica e non richiede API, account o database. Verificati accesso pubblico, link dalla registrazione e assenza di scorrimento orizzontale a 390 e 1440 pixel. Lint, build e suite browser completa: 122 test superati con API simulate.

## Prima dell'apertura pubblica

Completare la scelta di regioni di hosting, conservazione di backup e log e accordi applicabili ai fornitori, verificando anche l'idoneità contrattuale dell'account Gmail personale per i dati del servizio. L'informativa va allineata alle impostazioni effettive: la presenza della pagina non conclude queste verifiche. Predisporre una procedura concreta per rispondere alle richieste di accesso e cancellazione.

L'ordine concordato è: completamento della preparazione e dei test, commit e merge eseguiti dall'utente, deploy di collaudo Railway/Vercel, configurazione Google con homepage e privacy realmente raggiungibili, autorizzazione OAuth definitiva e collaudo email cloud. Restano inoltre i prerequisiti elencati nella [verifica di preproduzione](preproduzione-railway-vercel.md), compresi esecuzione della procedura del primo Master, configurazione frontend e ripristino dei backup. Nessun commit, merge o deploy è eseguito automaticamente.

Per il Branding Google usare l'URL reale della homepage e quello di `/privacy`. La proprietà del dominio o sottodominio deve rispettare i requisiti Google: non assumere che un URL condiviso Vercel sia automaticamente sufficiente. Il consenso attualmente in Testing e il relativo refresh token non rappresentano la configurazione definitiva.

## Riferimenti

- [GDPR, in particolare articoli 6, 13 e 15–22](https://eur-lex.europa.eu/eli/reg/2016/679/oj/?locale=it).
- [Garante: cookie e altri strumenti di tracciamento](https://www.garanteprivacy.it/faq/cookie).
- [Google: Branding](https://support.google.com/cloud/answer/15549049?hl=it), [verifica e proprietà](https://support.google.com/cloud/answer/13464321?hl=it), [durata delle autorizzazioni OAuth](https://developers.google.com/identity/protocols/oauth2).
- [Vercel DPA](https://vercel.com/legal/dpa), [Railway DPA](https://railway.com/legal/dpa), [Cloudinary](https://cloudinary.com/msa), [Google API User Data Policy](https://developers.google.com/terms/api-services-user-data-policy).
