package com.giulia.dndacademy.service.impl;

import com.giulia.dndacademy.dto.*;
import com.giulia.dndacademy.model.*;
import com.giulia.dndacademy.model.Character;
import com.giulia.dndacademy.model.enumerations.*;
import com.giulia.dndacademy.repository.*;
import com.giulia.dndacademy.service.CombatService;
import com.giulia.dndacademy.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDateTime;
import java.util.*;

@Service @RequiredArgsConstructor
public class CombatServiceImpl implements CombatService {
    private final CharacterRepository characterRepository;
    private final CombatRepository combatRepository;
    private final UserService userService;
    private final CampaignChapterRepository campaignChapterRepository;
    private final CampaignChapterProgressRepository campaignChapterProgressRepository;
    private final EncounterRepository encounterRepository;
    private final EncounterNpcRepository encounterNpcRepository;
    private final CombatParticipantRepository combatParticipantRepository;

    @Override @Transactional
    public CombatDTO startChapterCombat(Long chapterId, String username) {
        User user = userService.getByUsername(username);
        CampaignChapter chapter = campaignChapterRepository.findById(chapterId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Capitolo non trovato"));
        Campaign campaign = chapter.getCampaign();
        boolean joined = campaign.getPlayers().stream().anyMatch(p -> p.getId().equals(user.getId()));
        if (!joined) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Non sei iscritto alla campagna");
        if (!chapter.isHasCombat()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Capitolo senza combattimento");
        boolean unlocked = campaignChapterProgressRepository.findByUserIdAndChapterId(user.getId(), chapterId)
                .map(CampaignChapterProgress::isUnlocked).orElse(false);
        if (!unlocked) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Capitolo bloccato");
        Encounter encounter = encounterRepository.findFirstByChapterIdOrderByIdAsc(chapterId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Il Master deve configurare l'incontro"));
        Character character = characterRepository.findByCampaignIdAndPlayerId(campaign.getId(), user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Scegli prima un personaggio"));
        if (character.getStats() == null || !character.isAlive() || character.getCurrentHp() <= 0)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Personaggio non pronto al combattimento");
        List<EncounterNpc> configured = encounterNpcRepository.findByEncounterId(encounter.getId());
        if (configured.isEmpty() || configured.stream().noneMatch(en -> en.getNpc().isEnemy()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Configura almeno un nemico nell'incontro");
        for (EncounterNpc en : configured) {
            Npc npc = en.getNpc();
            if (en.getQuantity() < 1 || npc.getMaxHp() < 1 || npc.getArmorClass() < 1 ||
                    npc.getDamageDie() < 1)
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "NPC non valido: " + npc.getName());
        }
        Combat combat = combatRepository.save(Combat.builder()
                .campaign(campaign).chapter(chapter).encounter(encounter).user(user)
                .currentTurnIndex(0).completed(false).build());
        combatParticipantRepository.save(CombatParticipant.builder().combat(combat).character(character)
                .maxHp(character.getMaxHp()).currentHp(character.getCurrentHp())
                .initiative(roll(20) + modifier(character.getStats().getDexterity()))
                .alive(true).enemy(false).build());
        for (EncounterNpc en : configured) for (int i = 0; i < en.getQuantity(); i++) {
            Npc npc = en.getNpc();
            combatParticipantRepository.save(CombatParticipant.builder().combat(combat).npc(npc)
                    .maxHp(npc.getMaxHp()).currentHp(npc.getMaxHp())
                    .initiative(roll(20) + modifier(npc.getDexterity()))
                    .alive(true).enemy(npc.isEnemy()).build());
        }
        List<CombatParticipant> ordered =
                combatParticipantRepository.findByCombatIdOrderByInitiativeDesc(combat.getId());

        List<Long> turnOrder = ordered.stream()
                .map(CombatParticipant::getId)
                .collect(java.util.stream.Collectors.toCollection(ArrayList::new));

        combat.setTurnOrder(turnOrder);
        combat.setCurrentTurnIndex(0);
        combatRepository.save(combat);
        return mapToDTO(combat);
    }

    @Override @Transactional(readOnly = true)
    public Long getCurrentTurn(Long combatId, String username) {
        Combat combat = authorized(combatRepository.findById(combatId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Combattimento non trovato")), username);
        return combat.isCompleted() ? null : combat.getTurnOrder().get(combat.getCurrentTurnIndex());
    }

    @Override @Transactional(readOnly = true)
    public CombatStatusDTO getCombatStatus(Long combatId, String username) {
        Combat combat = authorized(combatRepository.findById(combatId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Combattimento non trovato")), username);
        Long current = combat.isCompleted() ? null : combat.getTurnOrder().get(combat.getCurrentTurnIndex());
        List<CombatFighterDTO> fighters = combat.getTurnOrder().stream().map(id -> {
            CombatParticipant p = participant(id, combat);
            Character c = p.getCharacter();
            Npc n = p.getNpc();
            return CombatFighterDTO.builder().participantId(p.getId())
                    .characterId(c == null ? null : c.getId()).npcId(n == null ? null : n.getId())
                    .name(c == null ? n.getName() : c.getName())
                    .imageUrl(c == null ? n.getImageUrl() : c.getImageUrl())
                    .characterClass(c == null ? "NPC" : c.getCharacterClass())
                    .currentHp(p.getCurrentHp()).maxHp(p.getMaxHp())
                    .armorClass(c == null ? n.getArmorClass() : c.getArmorClass())
                    .alive(p.isAlive()).enemy(p.isEnemy())
                    .currentTurn(Objects.equals(current, p.getId())).initiative(p.getInitiative())
                    .spellcaster(c != null && c.isSpellcaster())
                    .weaponName(c == null ? "Attacco" : c.getWeaponName())
                    .damageDie(c == null ? n.getDamageDie() : c.getDamageDie())
                    .spellName(c == null ? null : c.getSpellName())
                    .spellDamageDie(c == null ? 0 : c.getSpellDamageDie()).build();
        }).toList();
        return CombatStatusDTO.builder().combatId(combat.getId()).campaignId(combat.getCampaign().getId())
                .chapterId(combat.getChapter().getId()).encounterId(combat.getEncounter().getId())
                .currentTurnParticipantId(current).combatOver(combat.isCompleted())
                .completed(combat.isCompleted()).outcome(combat.getOutcome())
                .completedAt(combat.getCompletedAt()).fighters(fighters).events(combat.getEvents()).build();
    }

    @Override @Transactional
    public AttackResultDTO attack(AttackRequest request, String username) {
        Combat combat = authorized(combatRepository.findLockedById(request.getCombatId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Combattimento non trovato")), username);
        if (combat.isCompleted()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Combattimento terminato");
        CombatParticipant attacker = participant(request.getAttackerId(), combat);
        CombatParticipant target = participant(request.getTargetId(), combat);
        if (attacker.getCharacter() == null || attacker.isEnemy() ||
                attacker.getCharacter().getPlayer() == null ||
                !attacker.getCharacter().getPlayer().getId().equals(combat.getUser().getId()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Non puoi controllare questo combattente");
        if (target.getId().equals(attacker.getId()) || !target.isEnemy() || !target.isAlive())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bersaglio non valido");
        if (!attacker.isAlive() || attacker.getCurrentHp() < 1)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Il tuo personaggio è sconfitto");
        if (!attacker.getId().equals(combat.getTurnOrder().get(combat.getCurrentTurnIndex())))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Non è il tuo turno");
        Character c = attacker.getCharacter();
        CharacterStats stats = c.getStats();
        if (stats == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Statistiche non disponibili");
        boolean spell = request.getActionType() == CombatActionType.SPELL;
        if (request.getActionType() == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Azione richiesta");
        if (spell && (!c.isSpellcaster() || c.getSpellAbility() == null || c.getSpellDamageDie() < 1))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Incantesimo non configurato");
        AttackAbility ability = spell ? c.getSpellAbility() : c.getAttackAbility();
        int die = spell ? c.getSpellDamageDie() : c.getDamageDie();
        if (ability == null || die < 1) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Arma non configurata");
        int bonus = modifier(abilityScore(stats, ability));
        int roll = roll(20);
        int total = roll + bonus;
        int ac = armorClass(target);
        boolean crit = roll == 20;
        boolean hit = crit || (roll != 1 && total >= ac);
        int damageRoll = hit ? roll(die) + (crit ? roll(die) : 0) : 0;
        int damage = hit ? Math.max(1, damageRoll + bonus) : 0;
        int hpBefore = target.getCurrentHp();
        if (hit) damage(target, damage);
        recordEvent(combat, attacker, target, roll, total, ac, hit, crit, damage, hpBefore);
        boolean defeated = !target.isAlive();
        finishIfOver(combat);
        if (!combat.isCompleted()) {
            nextAlive(combat);
        }
        combatRepository.save(combat);
        Long next = combat.isCompleted() ? null : combat.getTurnOrder().get(combat.getCurrentTurnIndex());
        String msg = hit ? (crit ? "Colpo critico!" : "Colpito!") : "Mancato!";
        return AttackResultDTO.builder().hit(hit).critical(crit)
                .actionName(spell ? c.getSpellName() : c.getWeaponName()).attackRoll(roll)
                .abilityModifier(bonus).totalAttack(total).targetArmorClass(ac)
                .damage(damage).targetRemainingHp(target.getCurrentHp()).targetDefeated(defeated)
                .combatOver(combat.isCompleted()).outcome(combat.getOutcome())
                .nextTurnParticipantId(next).message(msg).actionType(request.getActionType())
                .damageDie(die).damageRoll(damageRoll).attackerId(attacker.getId())
                .attackerName(c.getName()).targetId(target.getId())
                .targetName(target.getNpc().getName()).build();
    }

    @Override @Transactional
    public CombatStatusDTO advanceNpcTurn(Long combatId, int expectedEventCount, String username) {
        Combat combat = authorized(combatRepository.findLockedById(combatId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Combattimento non trovato")), username);
        // A retried request must never resolve another turn.
        if (expectedEventCount < 0 || expectedEventCount != combat.getEvents().size())
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Il turno è già cambiato: aggiorna il combattimento");
        if (combat.isCompleted())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Combattimento terminato");
        CombatParticipant actor = current(combat);
        if (actor.getNpc() == null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "È il turno del tuo personaggio");
        List<CombatParticipant> targets = combatParticipantRepository.findByCombatId(combatId)
                .stream().filter(p -> p.isAlive() && p.isEnemy() != actor.isEnemy())
                .sorted(Comparator.comparing(CombatParticipant::getId)).toList();
        if (!targets.isEmpty()) {
            CombatParticipant target = targets.get(0);
            Npc npc = actor.getNpc();
            int roll = roll(20);
            int total = roll + npc.getAttackModifier();
            int ac = armorClass(target);
            boolean critical = roll == 20;
            boolean hit = critical || (roll != 1 && total >= ac);
            int amount = hit ? Math.max(1, roll(npc.getDamageDie()) +
                    (critical ? roll(npc.getDamageDie()) : 0) + npc.getDamageModifier()) : 0;
            int hpBefore = target.getCurrentHp();
            if (hit) damage(target, amount);
            recordEvent(combat, actor, target, roll, total, ac, hit, critical, amount, hpBefore);
        }
        finishIfOver(combat);
        if (!combat.isCompleted()) nextAlive(combat);
        combatRepository.save(combat);
        return getCombatStatus(combatId, username);
    }

    private void recordEvent(Combat combat, CombatParticipant actor, CombatParticipant target,
                             int roll, int total, int ac, boolean hit, boolean critical, int amount, int hpBefore) {
        combat.getEvents().add(CombatEvent.builder()
                .attackerId(actor.getId()).attackerName(name(actor)).enemy(actor.isEnemy())
                .targetId(target.getId()).targetName(name(target)).attackRoll(roll).totalAttack(total)
                .targetArmorClass(ac).hit(hit).critical(critical).damage(amount)
                .targetHpBefore(hpBefore).targetRemainingHp(target.getCurrentHp()).build());
    }

    private void finishIfOver(Combat combat) {
        if (combat.isCompleted()) return;
        List<CombatParticipant> ps = combatParticipantRepository.findByCombatId(combat.getId());
        boolean enemies = ps.stream().anyMatch(p -> p.isEnemy() && p.isAlive());
        boolean allies = ps.stream().anyMatch(p -> !p.isEnemy() && p.isAlive());
        if (enemies && allies) return;
        combat.setCompleted(true);
        combat.setOutcome(allies && !enemies ? CombatOutcome.PLAYER_VICTORY : CombatOutcome.ENEMY_VICTORY);
        combat.setCompletedAt(LocalDateTime.now());
    }

    private void nextAlive(Combat combat) {
        List<Long> order = combat.getTurnOrder();
        for (int i = 1; i <= order.size(); i++) {
            int idx = (combat.getCurrentTurnIndex() + i) % order.size();
            if (participant(order.get(idx), combat).isAlive()) { combat.setCurrentTurnIndex(idx); return; }
        }
        throw new ResponseStatusException(HttpStatus.CONFLICT, "Nessun partecipante vivo");
    }

    private CombatParticipant current(Combat combat) {
        return participant(combat.getTurnOrder().get(combat.getCurrentTurnIndex()), combat);
    }

    private CombatParticipant participant(Long participantId, Combat combat) {
        return combatParticipantRepository.findById(participantId)
                .filter(p -> p.getCombat().getId().equals(combat.getId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Partecipante non valido"));
    }

    private Combat authorized(Combat combat, String username) {
        User user = userService.getByUsername(username);
        if (!combat.getUser().getId().equals(user.getId()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Combattimento non tuo");
        return combat;
    }

    private void damage(CombatParticipant target, int amount) {
        target.setCurrentHp(Math.max(0, target.getCurrentHp() - amount));
        target.setAlive(target.getCurrentHp() > 0);
        combatParticipantRepository.save(target);
    }

    private int armorClass(CombatParticipant p) { return p.getNpc() != null ? p.getNpc().getArmorClass() : p.getCharacter().getArmorClass(); }

    private String name(CombatParticipant p) { return p.getNpc() != null ? p.getNpc().getName() : p.getCharacter().getName(); }

    private int roll(int sides) { return java.util.concurrent.ThreadLocalRandom.current().nextInt(1, sides + 1); }

    private int modifier(int stat) { return Math.floorDiv(stat - 10, 2); }

    private int abilityScore(CharacterStats s, AttackAbility a) {
        return switch (a) {
            case STRENGTH -> s.getStrength(); case DEXTERITY -> s.getDexterity();
            case INTELLIGENCE -> s.getIntelligence(); case WISDOM -> s.getWisdom();
            case CHARISMA -> s.getCharisma();
        };
    }

    private CombatDTO mapToDTO(Combat c) {
        return CombatDTO.builder().id(c.getId()).campaignId(c.getCampaign().getId())
                .chapterId(c.getChapter().getId()).encounterId(c.getEncounter().getId())
                .turnOrder(c.getTurnOrder()).currentTurnIndex(c.getCurrentTurnIndex())
                .completed(c.isCompleted()).outcome(c.getOutcome()).completedAt(c.getCompletedAt()).build();
    }
}
