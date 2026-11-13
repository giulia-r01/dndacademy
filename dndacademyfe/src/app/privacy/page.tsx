import type { Metadata } from "next"
import Link from "next/link"
import PublicFooter from "@/components/common/PublicFooter"

export const metadata: Metadata = {
  title: "Informativa privacy | D&D Academy",
  description: "Informazioni su dati personali, account, email di servizio e diritti degli utenti di D&D Academy.",
}

const contact = "dnd.academy.team@gmail.com"

export default function PrivacyPage() {
  return (
    <main className="min-h-screen px-4 py-8 text-[var(--text-main)] sm:px-6 sm:py-12">
      <article className="mx-auto max-w-4xl rounded-2xl border border-[var(--border-gold)]/30 bg-[var(--surface)] p-5 text-base leading-7 sm:p-8">
        <Link href="/" className="text-sm font-bold text-[var(--accent-soft)] hover:underline">Torna alla home</Link>
        <header className="mt-6 mb-8">
          <p className="text-sm font-bold uppercase tracking-widest text-[var(--accent)]">D&D Academy</p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Informativa privacy</h1>
          <p className="mt-3 text-[var(--text-muted)]">Ultimo aggiornamento: 13 novembre 2026</p>
          <p className="mt-4">Questa informativa descrive come vengono trattati i dati personali durante l&apos;uso di D&D Academy, piattaforma didattica con lezioni, quiz e avventure guidate.</p>
        </header>

        <div className="space-y-8 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_p+p]:mt-3 [&_li]:mt-2 [&_a]:text-[var(--accent-soft)] [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5">
          <section aria-labelledby="titolare">
            <h2 id="titolare">1. Titolare e contatti</h2>
            <p>Il titolare del trattamento è <strong>Giulia Rizzo, Italia</strong>. Per informazioni o richieste sui tuoi dati puoi scrivere a <a className="break-all" href={`mailto:${contact}`}>{contact}</a>.</p>
          </section>

          <section aria-labelledby="dati">
            <h2 id="dati">2. Dati trattati</h2>
            <ul>
              <li>Account: username, email, password conservata come hash, ruolo e livello didattico.</li>
              <li>Attività: campagne, personaggi, risposte inviate ai quiz, risultati, progressi, badge e storico dei combattimenti; contenuti creati nell&apos;Area Master.</li>
              <li>Profilo: immagine facoltativa e modifiche richieste ai dati dell&apos;account.</li>
              <li>Sicurezza: token di sessione e recupero, contatori antiabuso e dati tecnici delle richieste, come indirizzo IP, browser, orari ed errori, trattati dall&apos;app e dai servizi di hosting.</li>
              <li>Email di servizio: destinatario, contenuto del benvenuto o del recupero password, stato e tentativi di invio.</li>
            </ul>
          </section>

          <section aria-labelledby="finalita">
            <h2 id="finalita">3. Finalità e basi giuridiche</h2>
            <p>Account, percorso didattico, profilo ed email di servizio sono trattati per fornire le funzionalità richieste, ai sensi dell&apos;art. 6, par. 1, lett. b del GDPR. Le misure di sicurezza e prevenzione degli abusi si basano sul legittimo interesse a proteggere il servizio e gli account, ai sensi della lett. f. Eventuali adempimenti imposti dalla legge si basano sulla lett. c.</p>
            <p>Username, email e password sono necessari per creare un account. Il caricamento dell&apos;immagine del profilo è facoltativo. Le email di benvenuto e recupero sono comunicazioni funzionali al servizio.</p>
          </section>

          <section aria-labelledby="fornitori">
            <h2 id="fornitori">4. Fornitori e trasferimenti</h2>
            <p>Per l&apos;erogazione online sono utilizzati Vercel per il frontend, Render per il backend, Neon per il database PostgreSQL, Cloudinary per le immagini e Google per le email Gmail. I fornitori ricevono i dati necessari alle rispettive funzioni; il Master può accedere ai dati previsti dalle funzioni di gestione delle campagne e degli utenti.</p>
            <p>I servizi possono operare anche fuori dallo Spazio economico europeo. I trasferimenti sono soggetti alle garanzie previste dal GDPR, comprese decisioni di adeguatezza e clausole contrattuali standard applicabili ai fornitori. Per informazioni o copia delle garanzie relative al servizio puoi contattare il titolare.</p>
            <p>Ulteriori informazioni: <a href="https://vercel.com/legal/dpa">Vercel</a>, <a href="https://render.com/dpa">Render</a>, <a href="https://neon.com/security">Neon</a>, <a href="https://cloudinary.com/privacy">Cloudinary</a> e <a href="https://policies.google.com/privacy?hl=it">Google</a>.</p>
          </section>

          <section aria-labelledby="gmail">
            <h2 id="gmail">5. Uso di Gmail API</h2>
            <p>Il servizio usa l&apos;autorizzazione del proprio mittente Gmail per inviare benvenuto e recupero password. Gli utenti ricevono queste email all&apos;indirizzo indicato nell&apos;account; per usare D&D Academy non devono autorizzare l&apos;accesso alla propria casella Google.</p>
            <p>Gmail riceve destinatario e messaggio; le credenziali OAuth del mittente restano sul backend. L&apos;uso e l&apos;eventuale trasferimento delle informazioni ricevute dalle API Google sono limitati alle funzionalità descritte e rispettano la <a href="https://developers.google.com/terms/api-services-user-data-policy">Google API Services User Data Policy</a>, inclusi i requisiti di Limited Use.</p>
          </section>

          <section aria-labelledby="conservazione">
            <h2 id="conservazione">6. Conservazione</h2>
            <p>I dati dell&apos;account e dell&apos;attività sono conservati durante l&apos;utilizzo del servizio. Puoi eliminare il tuo account dal profilo, confermando con la password attuale, oppure contattare il titolare. La cancellazione rimuove account, dati personali di gioco, token e richieste email; l&apos;avatar viene rimosso tramite una coda con ritenti, conservando il solo identificatore tecnico fino al completamento. I contenuti didattici creati come Master vengono trasferiti a un altro Master scelto nella conferma: in assenza di un successore occorre prima promuoverne uno o contattare il titolare. Per eventuali dati personali scritti nei contenuti puoi chiedere assistenza al titolare.</p>
            <p>Eventuali conservazioni ulteriori sono limitate a obblighi di legge o tutela di diritti. Le copie di sicurezza seguono il ciclo di conservazione del servizio di backup. Contatori di sicurezza, messaggi già inviati e log dei fornitori seguono i tempi indicati qui sotto; una comunicazione già in invio non può essere ritirata.</p>
            <p>I link di recupero sono monouso e validi per 30 minuti; il record tecnico può restare dopo la scadenza fino alla sostituzione o cancellazione. Le richieste nella coda email vengono rimosse dal controllo orario dopo sette giorni dalla loro scadenza. I contatori antiabuso vengono rimossi dal controllo periodico dopo 24 ore dalla scadenza.</p>
            <p>Le copie dei messaggi nella casella del mittente e i log tecnici dei fornitori seguono le relative impostazioni di conservazione. Per chiarimenti o richieste di cancellazione puoi usare il contatto indicato sopra.</p>
          </section>

          <section aria-labelledby="browser">
            <h2 id="browser">7. Memorizzazione nel browser</h2>
            <p>L&apos;app usa la memoria locale del browser per la sessione di accesso e per ricordare lo stato del tour guidato. Il token viene rimosso all&apos;uscita o quando l&apos;app rileva una sessione non valida; le preferenze del tour restano fino alla cancellazione dei dati del sito. Puoi eliminare questi dati dalle impostazioni del browser: sarà necessario accedere nuovamente e il tour potrebbe ripartire.</p>
            <p>La configurazione applicativa attuale non include strumenti pubblicitari o analisi del comportamento per finalità di marketing. Eventuali modifiche agli strumenti utilizzati saranno accompagnate dall&apos;aggiornamento dell&apos;informativa e dalle scelte richieste dalla normativa.</p>
          </section>

          <section aria-labelledby="diritti">
            <h2 id="diritti">8. I tuoi diritti</h2>
            <p>Nei casi previsti dal GDPR puoi chiedere accesso, rettifica, cancellazione, limitazione e portabilità dei dati, oppure opporti ai trattamenti basati sul legittimo interesse. Scrivi al titolare: potrà essere necessario verificare l&apos;identità per proteggere l&apos;account. Puoi inoltre proporre reclamo al <a href="https://www.garanteprivacy.it/">Garante per la protezione dei dati personali</a>.</p>
            <p>Livelli, risultati e badge derivano dalle attività didattiche e non producono decisioni automatizzate con effetti giuridici o analogamente significativi sulla persona.</p>
          </section>
        </div>
      </article>
      <PublicFooter />
    </main>
  )
}
