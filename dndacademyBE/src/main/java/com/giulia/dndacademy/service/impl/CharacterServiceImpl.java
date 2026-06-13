package com.giulia.dndacademy.service.impl;

import com.giulia.dndacademy.dto.AttackRequest;
import com.giulia.dndacademy.dto.CharacterDTO;
import com.giulia.dndacademy.dto.CharacterStatsDTO;
import com.giulia.dndacademy.dto.CreateCharacterRequest;
import com.giulia.dndacademy.model.Campaign;
import com.giulia.dndacademy.model.Character;
import com.giulia.dndacademy.model.CharacterStats;
import com.giulia.dndacademy.model.Combat;
import com.giulia.dndacademy.model.User;
import com.giulia.dndacademy.model.enumerations.AttackAbility;
import com.giulia.dndacademy.model.enumerations.CombatActionType;
import com.giulia.dndacademy.repository.CampaignRepository;
import com.giulia.dndacademy.repository.CharacterRepository;
import com.giulia.dndacademy.repository.CharacterStatsRepository;
import com.giulia.dndacademy.repository.CombatRepository;
import com.giulia.dndacademy.service.CharacterService;
import com.giulia.dndacademy.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CharacterServiceImpl implements CharacterService {

    private final CharacterRepository characterRepository;
    private final CharacterStatsRepository characterStatsRepository;
    private final CampaignRepository campaignRepository;
    private final UserService userService;
    private final CombatRepository combatRepository;

    @Override
    public CharacterDTO createCharacter(CreateCharacterRequest request, String username) {
        User master = userService.getByUsername(username);

        Campaign campaign = campaignRepository.findById(request.getCampaignId())
                .orElseThrow(() -> new RuntimeException("Nessuna campagna trovata"));

        boolean isMaster = campaign.getMaster().getId().equals(master.getId());

        if (!isMaster) {
            throw new RuntimeException("Solo il master della campagna può creare personaggi");
        }

        validateCreateCharacterRequest(request);

        Character character = Character.builder()
                .name(request.getName())
                .race(request.getRace())
                .characterClass(request.getCharacterClass())
                .level(request.getLevel())
                .maxHp(request.getMaxHp())
                .currentHp(request.getMaxHp())
                .armorClass(request.getArmorClass())
                .alive(true)
                .player(null)
                .campaign(campaign)
                .weaponName(request.getWeaponName())
                .damageDie(request.getDamageDie())
                .attackAbility(request.getAttackAbility())
                .spellcaster(request.isSpellcaster())
                .spellName(request.isSpellcaster() ? request.getSpellName() : null)
                .spellDamageDie(request.isSpellcaster() ? request.getSpellDamageDie() : 0)
                .spellAbility(request.isSpellcaster() ? request.getSpellAbility() : null)
                .build();

        Character saved = characterRepository.save(character);

        CharacterStatsDTO statsDTO = request.getStats();

        CharacterStats stats = CharacterStats.builder()
                .strength(statsDTO.getStrength())
                .dexterity(statsDTO.getDexterity())
                .constitution(statsDTO.getConstitution())
                .intelligence(statsDTO.getIntelligence())
                .wisdom(statsDTO.getWisdom())
                .charisma(statsDTO.getCharisma())
                .character(saved)
                .build();

        characterStatsRepository.save(stats);

        return mapToDTO(saved);
    }

    @Override
    public CharacterDTO claimCharacter(Long characterId, String username) {
        User player = userService.getByUsername(username);

        Character character = characterRepository.findById(characterId)
                .orElseThrow(() -> new RuntimeException("Personaggio non trovato"));

        Campaign campaign = character.getCampaign();

        boolean isPlayerInCampaign = campaign.getPlayers()
                .stream()
                .anyMatch(campaignPlayer -> campaignPlayer.getId().equals(player.getId()));

        if (!isPlayerInCampaign) {
            throw new RuntimeException("Devi unirti alla campagna prima di scegliere un personaggio");
        }

        if (character.getPlayer() != null) {
            throw new RuntimeException("Questo personaggio è già stato scelto");
        }

        character.setPlayer(player);
        character.setCurrentHp(character.getMaxHp());
        character.setAlive(true);

        Character saved = characterRepository.save(character);

        return mapToDTO(saved);
    }

    @Override
    public List<CharacterDTO> getAvailableCharactersByCampaign(Long campaignId, String username) {
        Campaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new RuntimeException("Campagna non trovata"));

        checkCampaignAccess(campaign, username);

        return characterRepository.findByCampaignIdAndPlayerIsNull(campaignId)
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Override
    public List<CharacterDTO> getCharactersByCampaign(Long campaignId, String username) {
        Campaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new RuntimeException("Campagna non trovata"));

        checkCampaignAccess(campaign, username);

        return characterRepository.findByCampaignIdAndPlayerIsNotNull(campaignId)
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Override
    public List<CharacterDTO> getMyCharacters(String username) {
        return characterRepository.findByPlayerUsername(username)
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Override
    public CharacterDTO damageCharacter(Long characterId, int damage) {
        Character character = characterRepository.findById(characterId)
                .orElseThrow(() -> new RuntimeException("Personaggio non trovato"));

        int newHp = Math.max(character.getCurrentHp() - damage, 0);

        character.setCurrentHp(newHp);

        if (newHp == 0) {
            character.setAlive(false);
        }

        Character saved = characterRepository.save(character);

        return mapToDTO(saved);
    }

    @Override
    public CharacterDTO healCharacter(Long characterId, int heal) {
        Character character = characterRepository.findById(characterId)
                .orElseThrow(() -> new RuntimeException("Personaggio non trovato"));

        int newHp = Math.min(character.getCurrentHp() + heal, character.getMaxHp());

        character.setCurrentHp(newHp);

        if (newHp > 0) {
            character.setAlive(true);
        }

        Character saved = characterRepository.save(character);

        return mapToDTO(saved);
    }

    @Override
    public String attack(AttackRequest request, String username) {
        Character attacker = characterRepository.findById(request.getAttackerId())
                .orElseThrow(() -> new RuntimeException("Attaccante non trovato"));

        Character target = characterRepository.findById(request.getTargetId())
                .orElseThrow(() -> new RuntimeException("Bersaglio non trovato"));

        User currentUser = userService.getByUsername(username);

        if (attacker.getPlayer() == null) {
            throw new RuntimeException("Il personaggio attaccante non è stato ancora scelto da nessun player");
        }

        boolean isOwner = attacker.getPlayer().getId().equals(currentUser.getId());
        boolean isMaster = attacker.getCampaign().getMaster().getId().equals(currentUser.getId());

        if (!isOwner && !isMaster) {
            throw new RuntimeException("Non puoi usare un personaggio che non ti appartiene");
        }

        if (!attacker.isAlive()) {
            throw new RuntimeException("Ops... Sei morto ☠️");
        }

        if (!target.isAlive()) {
            throw new RuntimeException("Il bersaglio è già morto ☠️");
        }

        Combat combat = combatRepository.findById(request.getCombatId())
                .orElseThrow(() -> new RuntimeException("Combattimento non trovato"));

        if (!attacker.getCampaign().getId().equals(combat.getCampaign().getId())) {
            throw new RuntimeException("Non sei in questa campagna");
        }

        if (!target.getCampaign().getId().equals(combat.getCampaign().getId())) {
            throw new RuntimeException("Bersaglio non valido per questo combat");
        }

        List<Long> alive = combat.getTurnOrder()
                .stream()
                .map(id -> characterRepository.findById(id).orElseThrow())
                .filter(Character::isAlive)
                .map(Character::getId)
                .toList();

        if (alive.size() <= 1) {
            throw new RuntimeException("Il combattimento è finito!");
        }

        Long currentTurn = combat.getTurnOrder().get(combat.getCurrentTurnIndex());

        if (!attacker.getId().equals(currentTurn)) {
            throw new RuntimeException("Non è il tuo turno. Tocca a: " + currentTurn);
        }

        CharacterStats stats = attacker.getStats();

        if (stats == null) {
            throw new RuntimeException("Il personaggio non ha statistiche");
        }

        CombatActionData actionData = getCombatActionData(attacker, request.getActionType());

        int abilityScore = getAbilityScore(stats, actionData.ability());
        int abilityMod = getModifier(abilityScore);

        int attackRoll = rollDie(20);
        int totalAttack = attackRoll + abilityMod;

        boolean isCritical = attackRoll == 20;

        if (isCritical || totalAttack >= target.getArmorClass()) {
            int damageRoll = rollDie(actionData.damageDie());

            if (isCritical) {
                damageRoll += rollDie(actionData.damageDie());
            }

            int damage = Math.max(damageRoll + abilityMod, 1);
            int newHp = Math.max(target.getCurrentHp() - damage, 0);

            target.setCurrentHp(newHp);

            if (newHp == 0) {
                target.setAlive(false);
            }

            characterRepository.save(target);

            return "Colpito! 🎯 " +
                    (isCritical ? "CRITICO 💀 " : "") +
                    "| Azione: " + actionData.name() +
                    " | Tiro per colpire: " + attackRoll +
                    " + mod(" + abilityMod + ")" +
                    " = " + totalAttack +
                    " vs CA " + target.getArmorClass() +
                    " | Dado danno: d" + actionData.damageDie() +
                    " | Danno: " + damage +
                    " | HP rimasti: " + newHp;
        }

        return "Mancato ❌ | Azione: " + actionData.name() +
                " | Tiro per colpire: " + attackRoll +
                " + mod(" + abilityMod + ")" +
                " = " + totalAttack +
                " vs CA " + target.getArmorClass();
    }

    private void validateCreateCharacterRequest(CreateCharacterRequest request) {
        if (request.getStats() == null) {
            throw new RuntimeException("Stats obbligatorie");
        }

        if (!List.of(4, 6, 8, 10, 12).contains(request.getDamageDie())) {
            throw new RuntimeException("Il dado danno dell'arma deve essere d4, d6, d8, d10 o d12");
        }

        if (request.getAttackAbility() == null) {
            throw new RuntimeException("La caratteristica di attacco è obbligatoria");
        }

        if (request.getWeaponName() == null || request.getWeaponName().isBlank()) {
            throw new RuntimeException("Il nome dell'arma è obbligatorio");
        }

        if (request.isSpellcaster()) {
            if (request.getSpellName() == null || request.getSpellName().isBlank()) {
                throw new RuntimeException("Il nome dell'incantesimo è obbligatorio per gli spellcaster");
            }

            if (!List.of(4, 6, 8, 10, 12).contains(request.getSpellDamageDie())) {
                throw new RuntimeException("Il dado danno dell'incantesimo deve essere d4, d6, d8, d10 o d12");
            }

            if (request.getSpellAbility() == null) {
                throw new RuntimeException("La caratteristica dell'incantesimo è obbligatoria");
            }
        }
    }

    private CombatActionData getCombatActionData(Character attacker, CombatActionType actionType) {
        if (actionType == null) {
            throw new RuntimeException("Tipo azione obbligatorio");
        }

        if (actionType == CombatActionType.SPELL) {
            if (!attacker.isSpellcaster()) {
                throw new RuntimeException("Questo personaggio non può lanciare incantesimi");
            }

            if (attacker.getSpellName() == null ||
                    attacker.getSpellName().isBlank() ||
                    attacker.getSpellAbility() == null ||
                    attacker.getSpellDamageDie() <= 0) {
                throw new RuntimeException("Incantesimo non configurato correttamente");
            }

            return new CombatActionData(
                    attacker.getSpellName(),
                    attacker.getSpellDamageDie(),
                    attacker.getSpellAbility()
            );
        }

        if (attacker.getWeaponName() == null ||
                attacker.getWeaponName().isBlank() ||
                attacker.getAttackAbility() == null ||
                attacker.getDamageDie() <= 0) {
            throw new RuntimeException("Arma non configurata correttamente");
        }

        return new CombatActionData(
                attacker.getWeaponName(),
                attacker.getDamageDie(),
                attacker.getAttackAbility()
        );
    }

    private int rollDie(int sides) {
        return (int) (Math.random() * sides) + 1;
    }

    private int getAbilityScore(CharacterStats stats, AttackAbility ability) {
        return switch (ability) {
            case STRENGTH -> stats.getStrength();
            case DEXTERITY -> stats.getDexterity();
            case INTELLIGENCE -> stats.getIntelligence();
            case WISDOM -> stats.getWisdom();
            case CHARISMA -> stats.getCharisma();
        };
    }

    private int getModifier(int stat) {
        return Math.floorDiv(stat - 10, 2);
    }

    private CharacterDTO mapToDTO(Character c) {
        return CharacterDTO.builder()
                .id(c.getId())
                .name(c.getName())
                .race(c.getRace())
                .characterClass(c.getCharacterClass())
                .level(c.getLevel())
                .maxHp(c.getMaxHp())
                .currentHp(c.getCurrentHp())
                .armorClass(c.getArmorClass())
                .playerUsername(c.getPlayer() != null ? c.getPlayer().getUsername() : null)
                .campaignId(c.getCampaign().getId())
                .weaponName(c.getWeaponName())
                .damageDie(c.getDamageDie())
                .attackAbility(c.getAttackAbility())
                .spellcaster(c.isSpellcaster())
                .spellName(c.getSpellName())
                .spellDamageDie(c.getSpellDamageDie())
                .spellAbility(c.getSpellAbility())
                .build();
    }

    private void checkCampaignAccess(Campaign campaign, String username) {
        User user = userService.getByUsername(username);

        boolean isMaster = campaign.getMaster().getId().equals(user.getId());

        boolean isPlayer = campaign.getPlayers()
                .stream()
                .anyMatch(player -> player.getId().equals(user.getId()));

        if (!isMaster && !isPlayer) {
            throw new RuntimeException("Non fai parte di questa campagna");
        }
    }

    private record CombatActionData(
            String name,
            int damageDie,
            AttackAbility ability
    ) {
    }
}