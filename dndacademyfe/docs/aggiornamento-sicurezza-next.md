# Aggiornamento di sicurezza Next.js

Verifica del 17 novembre 2026, preparata nella branch `fix/sicurezza-nextjs` a partire da `main`. L'aggiornamento è separato dal lavoro sul nuovo tour mobile; nessun commit, merge o deploy viene eseguito automaticamente.

## Motivo

Il comando di build con Next.js 16.4.3 completa compilazione, TypeScript e generazione delle pagine, ma termina con `SecurityFatalError` per una vulnerabilità nota della dipendenza. L'audit npm del lockfile iniziale segnala otto voci moderate: Next.js e dipendenze indirette degli strumenti di lint.

Tra gli avvisi ufficiali, [GHSA-rhh4-g77r-r9qj](https://github.com/vercel/next.js/security/advisories/GHSA-rhh4-g77r-r9qj) riguarda alcune configurazioni App Router con `use cache` e argomenti binari; indica versioni vulnerabili fino a 16.4.4 e correzione in 16.4.5. L'app viene portata alla patch successiva disponibile nello stesso ramo, 16.4.6, verificata nel registro npm. La presenza di una dipendenza vulnerabile non dimostra che l'app sia stata attaccata; questa verifica non è un penetration test.

## Modifiche

- `next`: 16.4.3 → 16.4.6.
- `eslint-config-next`: 16.4.3 → 16.4.6, allineato al framework.
- Lockfile aggiornato; applicate le correzioni compatibili delle dipendenze indirette segnalate dall'audit, inclusi gli strumenti TypeScript ESLint e minimatch.
- Nessun `--force`, override o salto di major del framework; React e i pacchetti applicativi diretti restano invariati.

Non cambiano API, autenticazione, rotte, dati, migrazioni, configurazioni di Render/Neon, email o immagini. Il checkout separato non contiene copie di file env personali. Per la build locale si usa esplicitamente `NEXT_PUBLIC_API_URL=http://localhost:8080`; in Vercel continua a valere l'URL configurato nel progetto.

## Verifiche

- `npm audit`: zero vulnerabilità segnalate dopo l'aggiornamento; è l'esito del registro alla data del controllo, non una garanzia permanente.
- Build di produzione e TypeScript completati con exit code 0, senza il blocco di sicurezza.
- Lint e 31 test di configurazione superati.
- 133 test browser superati nella suite completa della base `main`, con API simulate: nessun invio di messaggi o modifica ai dati reali.

Il checkout è basato su `main`: i cambiamenti non committati del nuovo tour non vengono copiati in questa branch. Dopo aver integrato entrambe le branch occorre ripetere build e suite browser sull'insieme finale. La branch del tour ha una suite da 140 casi; il controllo separato di sicurezza usa i test presenti nella sua base.

## Integrazione manuale

Prima integrare l'aggiornamento di sicurezza, poi aggiornare la branch del tour dal nuovo `main` e verificare l'insieme. Le modifiche a `package.json` riguardano dipendenze in questa branch e la lista degli script di test nell'altra: conservare entrambe se Git richiede una risoluzione. Usare il lockfile aggiornato ed eseguire `npm ci` dopo l'integrazione.

Commit, push, merge e deploy restano operazioni dell'utente. Non eliminare il checkout separato prima di aver salvato le sue modifiche.
