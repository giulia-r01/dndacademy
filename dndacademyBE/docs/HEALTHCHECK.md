# Sonde di salute

Sono pubblici soltanto i GET /actuator/health/liveness e /actuator/health/readiness. Entrambi restituiscono solo lo stato, senza dettagli e senza validare un eventuale Bearer. Altri endpoint Actuator e metodi diversi da GET restano protetti.

## Render

Impostare Health Check Path su /actuator/health/liveness. La sonda verifica livenessState e readinessState dell’app, senza interrogare il database. Un avvio non completato o un’app che rifiuta traffico non viene presentata come disponibile. Render esegue controlli continui: usare un controllo DB a ogni sonda manterrebbe attivo Neon.

Readiness include il database e rimane disponibile per la diagnosi e il collaudo esplicito. Verifica almeno una volta la connessione prima dell’apertura e dopo gli aggiornamenti; non usarlo come polling continuo del browser. Le richieste applicative rilevano e gestiscono eventuali guasti DB senza confonderli con credenziali errate.

## Verifiche

ReadinessHealthcheckTest copre stato minimo, errore DB, token ignorato sulle sonde, blocco degli altri endpoint e dei metodi non previsti. I nuovi casi verificano che liveness non chiami il contributore DB neppure quando è indisponibile, e che rifiuti traffico se l’app non è pronta.

[Deploy e variabili](../../dndacademyfe/docs/deploy-render-neon.md). [Sonde Render](https://render.com/docs/health-checks).
