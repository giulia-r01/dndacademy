import type { UserProfile } from "@/types/user"
import type { TourDemo } from "@/lib/tour-demo"

export type TourAudience = "player" | "master"
export type TourScreen = "home" | "campaigns" | "chapters" | "lesson" | "quiz" | "characters" | "combat" | "reward" | "history" | "badges" | "profile" | "master-home" | "campaign-form" | "character-form" | "lesson-form" | "quiz-form" | "npc-form" | "badge-form" | "chapter-form" | "encounter-form" | "users" | "finish"
export type GuidedStep = { id: string; screen: TourScreen; title: string; text: string; target: string; navigate?: TourScreen; event?: string; complete?: (demo: TourDemo) => boolean; info?: boolean }
export const TOUR_VERSION = 2
export const tourHref = (audience: TourAudience, screen: TourScreen) => `/tour/${audience}/${screen}`
const target = (action: string) => `[data-tour-action="${action}"]`
const form = (screen: TourScreen) => `[data-tour-screen="${screen}"] form`

const accountSteps: GuidedStep[] = [
  { id: "account", screen: "profile", title: "Il tuo menu account", text: "Apri l’avatar in alto: qui trovi profilo, tour e uscita. Durante la prova usiamo solo l’account di esempio.", target: target("account-menu"), event: "open-account" },
  { id: "open-profile", screen: "profile", title: "Apri il profilo", text: "Scegli Profilo per gestire i dati personali, la foto e la password.", target: target("profile-link"), navigate: "profile" },
  { id: "avatar", screen: "profile", title: "Cambia la foto", text: "Prova l’avatar di esempio. Nel tuo profilo potrai scegliere una foto JPG, PNG o WEBP fino a 5 MB: il caricamento partirà subito.", target: target("avatar"), complete: demo => demo.profile.avatar },
  { id: "profile-save", screen: "profile", title: "Aggiorna i dati personali", text: "Controlla o modifica username ed email e salva l’esempio. Nel profilo reale confermerai con la password attuale; qui non servono credenziali.", target: form("profile"), complete: demo => demo.profile.saved },
  { id: "password", screen: "profile", title: "Prova il cambio password", text: "Premi Simula cambio password. Nel profilo reale inserirai password attuale, nuova password e conferma, poi accederai di nuovo. Non inserire password in questa prova.", target: target("password"), complete: demo => demo.profile.passwordChanged },
  { id: "replay-reminder", screen: "profile", title: "Puoi ripetere il tour quando vuoi", text: "Per ricominciare la guida da qualsiasi pagina, apri il menu del profilo cliccando sull’avatar in alto e seleziona Ripeti il tour. Potrai rivedere tutti i passaggi dall’inizio, anche dopo aver chiuso questa guida.", target: target("account-menu"), info: true },
  { id: "finish", screen: "finish", title: "Hai completato il percorso", text: "Hai eseguito tutte le azioni richieste. Termina per tornare alla pagina iniziale: le prove verranno eliminate. Potrai ricominciare dal menu dell’avatar.", target: target("finish"), info: true },
]
const playerSteps: GuidedStep[] = [
  { id: "start", screen: "home", title: "Scegli la tua prima avventura", text: "Ti guideremo un’azione alla volta con contenuti di esempio. Inizia aprendo le campagne. Puoi uscire dal tour in qualsiasi momento.", target: target("choose-campaign"), navigate: "campaigns" },
  { id: "join", screen: "campaigns", title: "Unisciti alla campagna", text: "Leggi la descrizione e premi Unisciti. Le campagne bloccate richiedono altri progressi nel percorso.", target: target("join"), complete: demo => demo.campaign.joined },
  { id: "open-campaign", screen: "campaigns", title: "Apri la tua campagna", text: "Ora sei iscritto. Apri la campagna per leggere la storia e trovare i capitoli disponibili.", target: target("open-campaign"), navigate: "chapters" },
  { id: "open-lesson", screen: "chapters", title: "Comincia dalla lezione", text: "Questo capitolo richiede lezione, quiz e combattimento. Leggi la storia, poi apri la lezione indicata.", target: target("open-lesson"), navigate: "lesson" },
  { id: "read", screen: "lesson", title: "Completa la lettura", text: "Leggi come funziona il tiro per colpire e premi Segna come letta. La Biblioteca lezioni permette anche di ripassare le lezioni disponibili.", target: target("lesson-reading"), complete: demo => demo.lesson.read },
  { id: "open-quiz", screen: "lesson", title: "Metti alla prova ciò che hai letto", text: "La lettura è completata. Apri il quiz associato alla lezione.", target: target("open-quiz"), navigate: "quiz" },
  { id: "quiz", screen: "quiz", title: "Rispondi e invia il quiz", text: "Scegli una risposta e invia la prova. Serve raggiungere il punteggio minimo: se sbagli, cambia risposta e riprova prima di proseguire.", target: form("quiz"), complete: demo => demo.quiz.passed },
  { id: "character", screen: "characters", title: "Scegli il tuo personaggio", text: "Consulta la scheda e scegli Lyria. HP sono i punti vita, CA è la Classe Armatura, cioè la difesa. Puoi avere un personaggio per campagna tra quelli preparati dal Master.", target: target("character"), complete: demo => demo.chosenCharacter },
  { id: "start-combat", screen: "combat", title: "Prepara lo scontro", text: "Controlla personaggio e nemico, poi inizia il combattimento. L’iniziativa stabilisce l’ordine dei turni.", target: target("start-combat"), complete: demo => demo.combat.started },
  { id: "attack", screen: "combat", title: "Scegli il bersaglio e attacca", text: "È il tuo turno: seleziona il goblin e premi Attacca. L’app tira i dadi e mostra il risultato nel registro. Questa prova termina con un solo attacco.", target: target("attack-controls"), complete: demo => demo.combat.won },
  { id: "return", screen: "combat", title: "Torna al capitolo", text: "Hai vinto. Nel gioco seguirai anche i turni dei PNG con Mostra l’azione di…; gli aiutanti guaritori possono curare. Dopo una sconfitta puoi riprovare. Ora torna al capitolo.", target: target("return-chapter"), navigate: "reward" },
  { id: "complete-chapter", screen: "reward", title: "Concludi il capitolo", text: "Lettura, quiz e scontro sono completati. Premi Completa capitolo per ricevere la ricompensa e sbloccare il successivo.", target: target("complete-chapter"), complete: demo => demo.chapter.completed },
  { id: "badges", screen: "badges", title: "Ritrova i tuoi premi", text: "Hai ottenuto Primo Quiz e il badge del capitolo. Puoi cercare i badge e filtrare quelli ottenuti o ancora da sbloccare. Questi premi appartengono solo alla prova.", target: target("badges"), info: true },
  { id: "history", screen: "history", title: "Consulta uno scontro concluso", text: "Apri i dettagli della vittoria. Lo storico conserva esiti e registro; soltanto i tentativi interrotti prima della fine possono essere ripresi.", target: target("history-details"), event: "read-history" },
  { id: "history-result", screen: "history", title: "Leggi il risultato", text: "Questo scontro è concluso: puoi leggere il registro senza riaprirlo. I tentativi non conclusi hanno invece il comando per riprenderli. Quando hai letto, prosegui con il menu account.", target: target("history-record"), info: true },
  ...accountSteps.map((step, index) => index < 2 ? { ...step, screen: "history" as const } : step),
]
const masterSteps: GuidedStep[] = [
  { id: "start", screen: "master-home", title: "Prepara un’avventura", text: "Cominciamo dalla campagna. Premi Gestisci campagne: userai contenuti di esempio e nessuna modifica riguarderà i dati reali.", target: target("manage-campaigns"), navigate: "campaigns" },
  { id: "new-campaign", screen: "campaigns", title: "Crea una campagna", text: "La campagna raccoglie capitoli e personaggi. Premi Nuova campagna per prepararne una di esempio.", target: target("new-campaign"), navigate: "campaign-form" },
  { id: "campaign", screen: "campaign-form", title: "Definisci l’avventura", text: "Controlla o modifica nome, descrizione e difficoltà, poi salva l’esempio. Il nome scelto ti accompagnerà nei prossimi passaggi.", target: form("campaign-form"), complete: demo => demo.campaign.saved },
  { id: "character", screen: "character-form", title: "Prepara un personaggio", text: "Controlla nome, razza, classe, livello, punti vita e difesa, poi salva. Nell’app potrai configurare anche caratteristiche, arma, incantesimi e ritratto. Il personaggio appartiene alla campagna appena creata.", target: form("character-form"), complete: demo => demo.characterSaved },
  { id: "lesson", screen: "lesson-form", title: "Scrivi una lezione", text: "Controlla titolo, contenuto e ordine, poi salva. Nell’app Sbloccata di default rende la lezione disponibile subito ai giocatori.", target: form("lesson-form"), complete: demo => demo.lesson.saved },
  { id: "quiz", screen: "quiz-form", title: "Prepara domanda e risposte", text: "La lezione è già associata. Controlla soglia, domanda e risposta corretta, poi salva. Nell’app creerai prima il quiz e aggiungerai le domande con almeno due risposte e una corretta.", target: form("quiz-form"), complete: demo => demo.quiz.saved },
  { id: "npc", screen: "npc-form", title: "Prepara nemici e aiutanti", text: "Un PNG è un personaggio non giocante. Scegli nome, schieramento e statistiche, poi salva. Un aiutante può essere guaritore con un numero limitato di cure per scontro.", target: form("npc-form"), complete: demo => demo.npc.saved },
  { id: "badge", screen: "badge-form", title: "Prepara la ricompensa", text: "Controlla nome e descrizione del badge e salva. Lo assegnerai al completamento del capitolo; i premi automatici dell’app hanno invece traguardi prestabiliti.", target: form("badge-form"), complete: demo => demo.badge.saved },
  { id: "chapter", screen: "chapter-form", title: "Collega storia e attività", text: "Controlla titolo, ordine e storia. Collega lezione, quiz, combattimento e badge, poi salva. Il quiz deve corrispondere alla lezione scelta.", target: form("chapter-form"), complete: demo => demo.chapter.saved },
  { id: "encounter", screen: "encounter-form", title: "Configura l’incontro", text: "Questo incontro appartiene al capitolo appena preparato. Imposta titolo e quantità dei partecipanti, poi salva: occorre almeno un nemico, gli aiutanti sono facoltativi.", target: form("encounter-form"), complete: demo => demo.encounter.saved },
  { id: "request-role", screen: "users", title: "Prova a promuovere un Player", text: "Nella sezione Utenti puoi cercare gli iscritti e filtrare ruolo e livello. Per questa prova premi Rendi Master su arianna_demo. Non puoi cambiare il tuo ruolo.", target: target("promote-user"), event: "request-role" },
  { id: "confirm-role", screen: "users", title: "Conferma l’utente e il nuovo ruolo", text: "Controlla il nome nella conferma e completa il cambio di ruolo dimostrativo. Nessun account reale verrà modificato.", target: target("confirm-role"), complete: demo => demo.users.some(user => user.username === "arianna_demo" && user.role === "MASTER") },
  ...accountSteps.map((step, index) => index < 2 ? { ...step, screen: "users" as const } : step),
]
export function tourSteps(audience: TourAudience) { return audience === "master" ? masterSteps : playerSteps }
export function tourPageTitle(screen: string) {
  const titles: Partial<Record<TourScreen, string>> = { home: "Il tuo percorso", "master-home": "Area Master", campaigns: "Campagne", "campaign-form": "Nuova campagna", chapters: "Capitolo della campagna", lesson: "Lezione", "lesson-form": "Lezioni", quiz: "Quiz della lezione", "quiz-form": "Quiz", characters: "I tuoi personaggi", "character-form": "Personaggi della campagna", combat: "Combattimento", reward: "Completamento capitolo", history: "Storico combattimenti", badges: "Badge", "badge-form": "Gestione badge", "npc-form": "Personaggi non giocanti", "chapter-form": "Capitoli della campagna", "encounter-form": "Gestione incontro", users: "Utenti", profile: "Profilo", finish: "Fine del tour" }
  return titles[screen as TourScreen] ?? "Tour dimostrativo"
}
export function tourActiveHref(audience: TourAudience, screen: TourScreen) {
  if (screen === "profile" || screen === "finish") return undefined
  if (audience === "master") return ({ "master-home": "/admin", "campaign-form": "/admin/campaigns", "character-form": "/admin/characters", "lesson-form": "/admin/lessons", "quiz-form": "/admin/quizzes", "npc-form": "/admin/npcs", "badge-form": "/admin/badges", "chapter-form": "/admin/campaigns", "encounter-form": "/admin/campaigns", users: "/admin/users", campaigns: "/admin/campaigns" } as Partial<Record<TourScreen, string>>)[screen]
  return ({ home: "/dashboard", campaigns: "/campaigns", chapters: "/campaigns", lesson: "/campaigns", quiz: "/campaigns", characters: "/characters", combat: "/campaigns", reward: "/campaigns", badges: "/achievements", history: "/combat" } as Partial<Record<TourScreen, string>>)[screen]
}
export function hasSeenTour(storage: Pick<Storage, "getItem">, key: string) {
  try { const value = JSON.parse(storage.getItem(key) ?? "null"); return value?.version === TOUR_VERSION && ["dismissed", "completed"].includes(value.status) } catch { return false }
}
export function saveTourResult(storage: Pick<Storage, "setItem">, key: string, status: "dismissed" | "completed") {
  try { storage.setItem(key, JSON.stringify({ version: TOUR_VERSION, status })) } catch { /* Tour remains usable without storage. */ }
}
export function tourStorageKey(user: Pick<UserProfile, "id" | "role">, audience: TourAudience) { return `dndacademy:tour:v${TOUR_VERSION}:${user.id}:${user.role}:${audience}` }
export function isAppPath(pathname: string) { return ["/dashboard", "/campaigns", "/lessons", "/characters", "/combat", "/achievements", "/profile", "/admin", "/tour"].some(path => pathname === path || pathname.startsWith(`${path}/`)) }

