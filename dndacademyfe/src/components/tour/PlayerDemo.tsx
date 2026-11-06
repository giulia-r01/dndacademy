"use client"

import { useState } from "react"
import { FiAward, FiBookOpen, FiCheckCircle, FiLock, FiShield, FiUsers } from "react-icons/fi"
import AppCard from "@/components/common/AppCard"
import AppButton from "@/components/common/AppButton"
import FormInput from "@/components/common/FormInput"
import UserAvatar from "@/components/common/UserAvatar"
import CharacterCard from "@/components/characters/CharacterCard"
import StatCard from "@/components/dashboard/StatCard"
import { learningLevelLabels } from "@/lib/learning-level"
import type { DemoScreenProps } from "./types"

export default function PlayerDemo({ screen, stepId, demo, setDemo, notify, navigate, act }: DemoScreenProps) {
  const [badgeFilter, setBadgeFilter] = useState("all")
  const [badgeSearch, setBadgeSearch] = useState("")
  const [targetSelected, setTargetSelected] = useState(false)
  if (screen === "home") return <div className="space-y-5">
    <h3 className="text-2xl font-black">Il tuo percorso</h3>
    <AppCard className="space-y-4 border-[var(--border-gold)]"><h4 className="text-xl font-black">{demo.campaign.joined ? "Continua la tua avventura" : "Inizia la tua prima avventura"}</h4><p className="text-[var(--text-soft)]">{demo.campaign.name}</p><AppButton data-tour-action="choose-campaign" onClick={() => navigate(demo.campaign.joined ? "chapters" : "campaigns")}>{demo.campaign.joined ? "Continua capitolo" : "Scegli la tua avventura"}</AppButton></AppCard>
    <div className="grid gap-3 sm:grid-cols-3"><StatCard title="Lezioni" value={demo.lesson.read ? "1" : "0"} icon={<FiBookOpen aria-hidden="true" />} /><StatCard title="Quiz" value={demo.quiz.passed ? "1" : "0"} icon={<FiCheckCircle aria-hidden="true" />} /><StatCard title="Livello" value="Principiante" icon={<FiAward aria-hidden="true" />} /></div>
  </div>

  if (screen === "campaigns") return <div className="space-y-4"><h3 className="text-2xl font-black">Campagne</h3><AppCard className="space-y-4 border-[var(--border-gold)]"><div className="flex flex-wrap gap-2"><span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-bold">{learningLevelLabels[demo.campaign.difficulty]}</span><span className="text-sm text-[var(--accent-soft)]">{demo.campaign.joined ? "Iscritto (esempio)" : "Disponibile"}</span></div><h4 className="text-xl font-black">{demo.campaign.name}</h4><p className="text-sm text-[var(--text-soft)]">{demo.campaign.description}</p>{demo.campaign.joined ? <AppButton data-tour-action="open-campaign" onClick={() => navigate("chapters")}>Apri la campagna dimostrativa</AppButton> : <AppButton data-tour-action="join" onClick={() => { setDemo(current => ({ ...current, campaign: { ...current.campaign, joined: true } })); notify("Iscrizione dimostrativa riuscita. Nessuna iscrizione reale è stata creata.") }}>Unisciti</AppButton>}</AppCard><AppCard><p className="flex items-center gap-2 font-bold text-[var(--text-muted)]"><FiLock aria-hidden="true" />La fortezza delle ombre · Bloccata</p><p className="mt-2 text-sm text-[var(--text-muted)]">Completa il percorso precedente per sbloccare nuove avventure.</p></AppCard></div>

  if (screen === "chapters") return <div className="space-y-4"><h3 className="text-2xl font-black">{demo.campaign.name}</h3><AppCard className="space-y-4"><p className="text-sm font-bold text-[var(--accent-soft)]">Capitolo 1 · {demo.chapter.completed ? "Completato" : "Disponibile"}</p><h4 className="text-xl font-black">{demo.chapter.title}</h4><p className="leading-7 text-[var(--text-soft)]">{demo.chapter.story}</p><div className="flex flex-wrap gap-3"><AppButton data-tour-action="open-lesson" onClick={() => navigate("lesson")}>Vai alla lezione</AppButton><AppButton variant="secondary" onClick={() => navigate("quiz")}>Vai al quiz</AppButton><AppButton variant="secondary" onClick={() => navigate("combat")}>Prepara il combattimento</AppButton></div></AppCard><AppCard><p className="flex items-center gap-2 text-[var(--text-muted)]">{demo.chapter.completed ? <FiCheckCircle aria-hidden="true" /> : <FiLock aria-hidden="true" />}Capitolo 2 · La sala della luce</p><p className="mt-2 text-sm">{demo.chapter.completed ? "Disponibile: hai completato il primo capitolo. Il tour si ferma qui; nell’app puoi continuare con il prossimo capitolo." : "Si sblocca completando il primo capitolo."}</p></AppCard></div>

  if (screen === "lesson") return <div className="space-y-4"><h3 className="text-2xl font-black">{demo.lesson.title}</h3><AppCard data-tour-action="lesson-reading" className="space-y-4"><p className="whitespace-pre-line leading-8 text-[var(--text-soft)]">{demo.lesson.content}</p><AppButton disabled={demo.lesson.read} onClick={() => { setDemo(current => ({ ...current, lesson: { ...current.lesson, read: true } })); notify("Lettura segnata come completata nell’esempio.") }}>{demo.lesson.read ? "Lezione completata (esempio)" : "Segna come letta"}</AppButton></AppCard><div className="flex flex-wrap gap-3"><AppButton data-tour-action="open-quiz" onClick={() => navigate("quiz")}>Vai al quiz</AppButton><AppButton variant="secondary" onClick={() => navigate("chapters")}>Torna al capitolo</AppButton></div></div>

  if (screen === "quiz") return <form className="space-y-4" onSubmit={event => {
    event.preventDefault()
    if (!demo.quiz.selected) { notify("Scegli una risposta per provare il quiz.", true); return }
    const passed = demo.quiz.selected === demo.quiz.correctAnswer
    setDemo(current => ({ ...current, quiz: { ...current.quiz, passed: current.quiz.passed || passed }, lesson: { ...current.lesson, read: current.lesson.read || passed } }))
    notify(passed ? "Quiz superato! Punteggio di esempio: 100%." : "Risposta non corretta. Puoi cambiare scelta e riprovare.", !passed)
  }}><h3 className="text-2xl font-black">{demo.quiz.title}</h3><AppCard className="space-y-4"><p className="text-sm text-[var(--text-muted)]">Punteggio minimo: {demo.quiz.passingScore}%</p><fieldset className="space-y-3"><legend className="mb-3 font-bold">{demo.quiz.question}</legend>{["d20", "d4"].map(answer => <label key={answer} className="flex cursor-pointer items-center gap-3 rounded-xl bg-[var(--surface-muted)] p-4"><input type="radio" name="tour-answer" value={answer} checked={demo.quiz.selected === answer} onChange={() => setDemo(current => ({ ...current, quiz: { ...current.quiz, selected: answer } }))} />{answer}</label>)}</fieldset><AppButton type="submit">Invia quiz di esempio</AppButton></AppCard><AppButton variant="secondary" onClick={() => navigate("chapters")}>Torna al capitolo</AppButton></form>

  if (screen === "characters") return <div className="space-y-4"><h3 className="text-2xl font-black">Il personaggio della campagna</h3>{demo.chosenCharacter && <p className="rounded-xl bg-[var(--surface-muted)] p-3 text-sm">Hai scelto {demo.character.name} per questa dimostrazione.</p>}<div data-tour-action="character"><CharacterCard character={{ ...demo.character, playerUsername: demo.chosenCharacter ? demo.profile.username : null }} campaignName={demo.campaign.name} mode={demo.chosenCharacter ? "owned" : "available"} onClaim={() => { setDemo(current => ({ ...current, chosenCharacter: true })); notify("Personaggio scelto nell’esempio. Puoi averne uno per campagna.") }} /></div></div>

  if (screen === "combat") return <div className="space-y-4"><h3 className="text-2xl font-black">{demo.encounter.title}</h3><p className="text-sm text-[var(--accent-soft)]">{demo.combat.started ? demo.combat.won ? "Vittoria dimostrativa" : `Tocca a ${demo.character.name}` : "Preparazione dello scontro"}</p><div className="grid gap-4 sm:grid-cols-2"><AppCard><h4 className="flex items-center gap-2 text-lg font-black"><FiShield aria-hidden="true" />{demo.character.name}</h4><p className="mt-3">HP {demo.character.currentHp}/{demo.character.maxHp} · CA {demo.character.armorClass}</p><p className="mt-2 text-sm text-[var(--text-muted)]">{demo.character.weaponName} · d{demo.character.damageDie}</p></AppCard><AppCard><h4 className="text-lg font-black">Goblin delle miniere</h4><p className="mt-3">HP {demo.combat.won ? "0" : "6"}/6 · CA 12</p><p className="mt-2 text-sm text-[var(--text-muted)]">Nemico di esempio</p></AppCard></div>{!demo.combat.started ? <AppButton data-tour-action="start-combat" onClick={() => { setDemo(current => ({ ...current, combat: { ...current.combat, started: true, log: ["Iniziativa di esempio: personaggio 17, goblin 10."] } })); notify("Preparazione conclusa: il personaggio agisce per primo nell’esempio.") }}>Inizia il combattimento di esempio</AppButton> : !demo.combat.won ? <div data-tour-action="attack-controls" className="space-y-3 rounded-xl bg-[var(--surface-muted)] p-4"><label className="block text-sm font-bold">Bersaglio<select aria-label="Bersaglio" value={targetSelected ? "goblin" : ""} onChange={event => setTargetSelected(event.target.value === "goblin")} className="mt-2 block w-full rounded-xl bg-[var(--surface)] p-3"><option value="">Seleziona un nemico</option><option value="goblin">Goblin delle miniere</option></select></label><AppButton disabled={!targetSelected} onClick={() => { setDemo(current => ({ ...current, combat: { started: true, won: true, log: [...current.combat.log, "Tiro di esempio: 16 + 3 = 19 contro CA 12. Colpito!", "Danno di esempio: 6 HP. Il goblin è sconfitto."] } })); notify("Vittoria dimostrativa! Torna al capitolo per completarlo.") }}>Attacca</AppButton></div> : <AppButton data-tour-action="return-chapter" onClick={() => navigate("reward")}>Torna al capitolo e prosegui</AppButton>}<AppCard><h4 className="font-bold">Registro del combattimento</h4>{demo.combat.log.length ? <ol className="mt-3 space-y-2 text-sm text-[var(--text-soft)]">{demo.combat.log.map(line => <li key={line}>{line}</li>)}</ol> : <p className="mt-2 text-sm text-[var(--text-muted)]">Le azioni appariranno qui dopo l’avvio.</p>}</AppCard></div>

  if (screen === "reward") return <AppCard className="space-y-4 border-[var(--border-gold)]"><h3 className="text-2xl font-black">{demo.chapter.title}</h3><p className="text-[var(--text-soft)]">Hai completato tutte le attività richieste. Ora puoi concludere il capitolo e ottenere la sua ricompensa.</p><ul className="space-y-2 text-sm">{["Lezione completata", "Quiz superato", "Combattimento vinto"].map(text => <li key={text} className="flex items-center gap-2 text-[var(--primary)]"><FiCheckCircle aria-hidden="true" />{text}</li>)}</ul><AppButton data-tour-action="complete-chapter" disabled={demo.chapter.completed} onClick={() => { setDemo(current => ({ ...current, chapter: { ...current.chapter, completed: true } })); notify(`Capitolo completato nell’esempio. Badge ottenuto: ${demo.badge.name}.`) }}>{demo.chapter.completed ? "Capitolo completato (esempio)" : "Completa capitolo"}</AppButton>{demo.chapter.completed && <p className="text-sm text-[var(--accent-soft)]">Capitolo successivo sbloccato: La sala della luce.</p>}</AppCard>

  if (screen === "history") return <div className="space-y-4">
    <h3 className="text-2xl font-black">Storico combattimenti</h3>
    <AppCard data-tour-action="history-record" className="space-y-3">
      <h4 className="font-black">Combattimento concluso</h4>
      <p>{demo.campaign.name} · {demo.chapter.title}</p>
      <p className="text-sm text-[var(--primary)]">{demo.encounter.title} · Vittoria di esempio</p>
      <p className="text-sm text-[var(--text-muted)]">Questo scontro è terminato: puoi consultarne l’esito e il registro.</p>
      <details open={stepId === "history-result"} className="rounded-xl bg-[var(--surface-muted)] p-3"><summary data-tour-action="history-details" onClick={() => act("read-history")} className="cursor-pointer font-bold">Visualizza dettagli e registro</summary><p className="mt-3 text-sm">Iniziativa 17 · Attacco 19 contro CA 12 · Danno 6 · Vittoria.</p></details>
    </AppCard>
    <AppCard className="space-y-3">
      <h4 className="font-bold">Un altro scontro interrotto (esempio)</h4>
      <p className="text-sm text-[var(--text-muted)]">Se interrompi uno scontro prima della fine, puoi ritrovarlo qui e continuarlo dal punto in cui lo avevi lasciato.</p>
      <p className="text-sm text-[var(--accent-soft)]">È un tentativo separato: la vittoria mostrata sopra rimane conclusa.</p>
      <AppButton onClick={() => { setDemo(current => ({ ...current, combat: { started: true, won: false, log: ["Scontro interrotto di esempio ripreso: l’iniziativa era già stata risolta. È un tentativo separato dalla vittoria nello storico."] } })); navigate("combat") }}>Riprendi lo scontro interrotto</AppButton>
    </AppCard>
  </div>

  if (screen === "badges") {
    const badges = [{ name: "Primo Quiz", description: "Supera il tuo primo quiz.", unlocked: demo.quiz.passed }, { name: demo.badge.name, description: demo.badge.description, unlocked: demo.chapter.completed }, { name: "Avventuriero Esperto", description: "Raggiungi il livello avanzato.", unlocked: false }]
    const query = badgeSearch.trim().toLocaleLowerCase("it")
    const visible = badges.filter(badge => (badgeFilter === "all" || (badgeFilter === "unlocked" ? badge.unlocked : !badge.unlocked)) && `${badge.name} ${badge.description}`.toLocaleLowerCase("it").includes(query))
    return <div data-tour-action="badges" className="space-y-4">
      <h3 className="text-2xl font-black">I tuoi badge</h3>
      <label className="block text-sm font-bold">Cerca badge di esempio<input type="search" value={badgeSearch} onChange={event => setBadgeSearch(event.target.value)} placeholder="Nome o descrizione" className="mt-2 block w-full rounded-xl bg-[var(--surface-muted)] p-3" /></label>
      <label className="block text-sm font-bold">Stato dei badge di esempio<select value={badgeFilter} onChange={event => setBadgeFilter(event.target.value)} className="mt-2 block w-full rounded-xl bg-[var(--surface-muted)] p-3"><option value="all">Tutti</option><option value="unlocked">Ottenuti</option><option value="locked">Da sbloccare</option></select></label>
      {visible.map(badge => <AppCard key={badge.name} className={badge.unlocked ? "border-[var(--border-gold)]" : ""}><h4 className="flex items-center gap-2 font-black">{badge.unlocked ? <FiAward aria-hidden="true" /> : <FiLock aria-hidden="true" />}{badge.name}</h4><p className="mt-2 text-sm text-[var(--text-soft)]">{badge.description}</p><p className="mt-2 text-sm text-[var(--accent-soft)]">{badge.unlocked ? "Ottenuto nell’esempio" : "Da sbloccare"}</p></AppCard>)}
      {visible.length === 0 && <p role="status" className="text-sm text-[var(--text-muted)]">Nessun badge di esempio corrisponde alla ricerca e al filtro.</p>}
    </div>
  }

  if (screen === "profile") return <div className="space-y-4">
    <h3 className="text-2xl font-black">Profilo dimostrativo</h3>
    <AppCard className="space-y-4">
      <div className="flex flex-wrap items-center gap-4"><UserAvatar username={demo.profile.avatar ? "Lyria" : demo.profile.username} large /><div><p className="font-black">{demo.profile.username}</p><p className="text-sm text-[var(--text-muted)]">{demo.profile.role === "MASTER" ? "Master" : "Player"} · {learningLevelLabels[demo.profile.learningLevel]} · Account di esempio</p></div></div>
      <AppButton data-tour-action="avatar" variant="secondary" onClick={() => { setDemo(current => ({ ...current, profile: { ...current.profile, avatar: !current.profile.avatar } })); notify("Avatar dimostrativo aggiornato. Nell’app reale scegli un’immagine e il caricamento parte subito.") }}>Prova un avatar di esempio</AppButton>
    </AppCard>
    <p className="text-sm text-[var(--text-muted)]">Qui puoi provare con i dati di esempio. Nel tuo profilo, per salvare username ed email devi confermare con la password attuale.</p>
    <form onSubmit={event => { event.preventDefault(); setDemo(current => ({ ...current, profile: { ...current.profile, saved: true } })); notify("Dati salvati solo nel tour. Il tuo profilo reale non è cambiato.") }} className="space-y-4">
      <FormInput label="Username dimostrativo" name="tour-profile-name" required minLength={3} maxLength={40} pattern="[A-Za-z0-9_.\-]{3,40}" title="Da 3 a 40 lettere, numeri, punti, trattini o underscore" value={demo.profile.username} onChange={event => setDemo(current => ({ ...current, profile: { ...current.profile, username: event.target.value } }))} />
      <FormInput label="Email dimostrativa" name="tour-profile-email" type="email" required value={demo.profile.email} onChange={event => setDemo(current => ({ ...current, profile: { ...current.profile, email: event.target.value } }))} />
      <AppButton type="submit">Salva profilo di esempio</AppButton>
    </form>
    <AppCard className="space-y-3"><h4 className="font-black">Cambio password</h4><p className="text-sm text-[var(--text-muted)]">La password attuale e la nuova password si inseriscono soltanto nel profilo reale, fuori dal tour.</p><AppButton data-tour-action="password" variant="secondary" onClick={() => { setDemo(current => ({ ...current, profile: { ...current.profile, passwordChanged: true } })); notify("Cambio password simulato. Nell’app reale dovrai accedere di nuovo con la nuova password; qui puoi continuare il tour.") }}>Simula cambio password</AppButton></AppCard>
  </div>

  return <AppCard><FiUsers aria-hidden="true" /><p>Segui i passi della guida per conoscere il percorso.</p></AppCard>
}
