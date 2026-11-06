import type { Character } from "@/types/character"
import type { LearningLevel, UserRole } from "@/types/user"
import type { TourAudience } from "@/lib/tour"

export type TourDemo = {
  campaign: { name: string; description: string; difficulty: LearningLevel; joined: boolean; saved: boolean }
  character: Character
  characterSaved: boolean
  chosenCharacter: boolean
  lesson: { title: string; content: string; order: number; read: boolean; saved: boolean }
  quiz: { title: string; passingScore: number; question: string; correctAnswer: "d20" | "d4"; selected: string; passed: boolean; saved: boolean }
  npc: { name: string; maxHp: number; armorClass: number; enemy: boolean; healer: boolean; saved: boolean }
  badge: { name: string; description: string; saved: boolean }
  chapter: { title: string; story: string; order: number; combat: boolean; lesson: boolean; quiz: boolean; badge: boolean; completed: boolean; saved: boolean }
  encounter: { title: string; enemies: number; allies: number; saved: boolean }
  combat: { started: boolean; won: boolean; log: string[] }
  users: Array<{ id: number; username: string; role: UserRole; learningLevel: LearningLevel; self?: boolean }>
  profile: { username: string; email: string; learningLevel: LearningLevel; role: UserRole; avatar: boolean; passwordChanged: boolean; saved: boolean }
}

export function createTourDemo(audience: TourAudience = "player"): TourDemo {
  return {
    campaign: { name: "Le miniere di Cristallo", description: "Una spedizione guidata per ritrovare la luce delle antiche miniere.", difficulty: "BEGINNER", joined: false, saved: false },
    character: { id: -101, campaignId: -100, name: "Lyria", race: "Elfa", characterClass: "Guerriera", level: 1, maxHp: 16, currentHp: 16, armorClass: 15, playerUsername: null, imageUrl: null, weaponName: "Spada lunga", damageDie: 8, attackAbility: "STRENGTH", spellcaster: false, spellName: null, spellDamageDie: 0, spellAbility: null, stats: { strength: 16, dexterity: 12, constitution: 14, intelligence: 10, wisdom: 12, charisma: 10 } },
    characterSaved: false, chosenCharacter: false,
    lesson: { title: "Il tiro per colpire", content: "Quando attacchi, tira un d20 e aggiungi i modificatori. Confronta il totale con la Classe Armatura del bersaglio: se la raggiungi o la superi, il colpo va a segno.", order: 1, read: false, saved: false },
    quiz: { title: "Pronto per l’avventura?", passingScore: 70, question: "Quale dado si usa per il tiro per colpire?", correctAnswer: "d20", selected: "", passed: false, saved: false },
    npc: { name: "Goblin delle miniere", maxHp: 6, armorClass: 12, enemy: true, healer: false, saved: false },
    badge: { name: "Luce nelle miniere", description: "Completa il primo capitolo dell’avventura.", saved: false },
    chapter: { title: "Il sentiero dei cristalli", story: "Tra le pareti della miniera scorgi una luce azzurra. Una guida ti indica il sentiero, ma un goblin sorveglia il passaggio. Prima di affrontarlo, ripassa come si effettua un attacco.", order: 1, combat: true, lesson: true, quiz: true, badge: true, completed: false, saved: false },
    encounter: { title: "Il custode del passaggio", enemies: 1, allies: 1, saved: false },
    combat: { started: false, won: false, log: [] },
    users: [{ id: -1, username: "master_demo", role: "MASTER", learningLevel: "ADVANCED", self: true }, { id: -2, username: "arianna_demo", role: "PLAYER", learningLevel: "BEGINNER" }, { id: -3, username: "luca_demo", role: "MASTER", learningLevel: "INTERMEDIATE" }],
    profile: { username: audience === "master" ? "master_demo" : "arianna_demo", email: audience === "master" ? "master@example.test" : "arianna@example.test", learningLevel: audience === "master" ? "ADVANCED" : "BEGINNER", role: audience === "master" ? "MASTER" : "PLAYER", avatar: false, passwordChanged: false, saved: false },
  }
}
