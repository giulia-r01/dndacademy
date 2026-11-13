package com.giulia.dndacademy.service.impl;

import com.giulia.dndacademy.exceptions.ApiException;

import com.giulia.dndacademy.dto.AttackRequest;
import com.giulia.dndacademy.dto.AttackResultDTO;
import com.giulia.dndacademy.dto.CharacterDTO;
import com.giulia.dndacademy.dto.CharacterStatsDTO;
import com.giulia.dndacademy.dto.CreateCharacterRequest;
import com.giulia.dndacademy.model.*;
import com.giulia.dndacademy.model.Character;
import com.giulia.dndacademy.repository.CampaignRepository;
import com.giulia.dndacademy.repository.CharacterRepository;
import com.giulia.dndacademy.repository.CharacterStatsRepository;

import com.giulia.dndacademy.service.CharacterService;
import com.giulia.dndacademy.service.UserService;
import com.giulia.dndacademy.service.CombatService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.giulia.dndacademy.service.ImageUploadService;
import org.springframework.web.multipart.MultipartFile;
import com.giulia.dndacademy.dto.UpdateCharacterRequest;



import java.util.List;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import com.giulia.dndacademy.repository.CombatParticipantRepository;

@Service
@RequiredArgsConstructor
public class CharacterServiceImpl implements CharacterService {

    private final CharacterRepository characterRepository;
    private final CharacterStatsRepository characterStatsRepository;
    private final CampaignRepository campaignRepository;
    private final UserService userService;
    private final CombatService combatService;
    private final ImageUploadService imageUploadService;
    private final CombatParticipantRepository participants;
    private final com.giulia.dndacademy.service.CampaignProgressService campaignProgressService;


    @Override
    @Transactional
    public CharacterDTO createCharacter(CreateCharacterRequest request, String username) {
        User master = userService.getByUsername(username);

        Campaign campaign = campaignRepository.findById(request.getCampaignId())
                .orElseThrow(() -> ApiException.notFound("Nessuna campagna trovata"));

        boolean isMaster = campaign.getMaster().getId().equals(master.getId());

        if (!isMaster) {
            throw ApiException.forbidden("Solo il master della campagna può creare personaggi");
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

        saved.setStats(characterStatsRepository.save(stats));

        return mapToDTO(saved);
    }

    @Override
    @Transactional
    public CharacterDTO claimCharacter(Long characterId, String username) {
        User player = userService.getByUsername(username);

        // Serialize all choices within a campaign before loading the character.
        Long campaignId = characterRepository.findCampaignIdById(characterId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Personaggio non trovato"));
        campaignProgressService.requireUnlocked(campaignId, username);
        Campaign campaign = campaignRepository.findLockedById(campaignId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Campagna non trovata"));
        Character character = characterRepository.findLockedById(characterId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Personaggio non trovato"));

        boolean isPlayerInCampaign = campaign.getPlayers()
                .stream()
                .anyMatch(campaignPlayer -> campaignPlayer.getId().equals(player.getId()));

        if (!isPlayerInCampaign) {
            throw ApiException.forbidden("Devi unirti alla campagna prima di scegliere un personaggio");
        }

        if (character.getPlayer() != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Questo personaggio è già stato scelto");
        }

        boolean alreadyHasCharacter = characterRepository
                .findByCampaignIdAndPlayerId(campaign.getId(), player.getId())
                .isPresent();

        if (alreadyHasCharacter) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Hai già scelto un personaggio per questa campagna"
            );
        }

        if (character.getStats() == null) throw new ResponseStatusException(HttpStatus.CONFLICT, "Il modello non ha le caratteristiche complete.");
        Character copy = Character.builder()
                .name(character.getName()).race(character.getRace()).characterClass(character.getCharacterClass())
                .level(character.getLevel()).maxHp(character.getMaxHp()).currentHp(character.getMaxHp())
                .armorClass(character.getArmorClass()).alive(true).player(player).campaign(campaign)
                .sourceTemplate(character).imageUrl(character.getImageUrl())
                .weaponName(character.getWeaponName()).damageDie(character.getDamageDie()).attackAbility(character.getAttackAbility())
                .spellcaster(character.isSpellcaster()).spellName(character.getSpellName())
                .spellDamageDie(character.getSpellDamageDie()).spellAbility(character.getSpellAbility()).build();
        CharacterStats original = character.getStats();
        copy.setStats(CharacterStats.builder().character(copy).strength(original.getStrength()).dexterity(original.getDexterity())
                .constitution(original.getConstitution()).intelligence(original.getIntelligence())
                .wisdom(original.getWisdom()).charisma(original.getCharisma()).build());
        Character saved = characterRepository.save(copy);

        return mapToDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CharacterDTO> getAvailableCharactersByCampaign(Long campaignId, String username) {
        Campaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> ApiException.notFound("Campagna non trovata"));

        checkCampaignAccess(campaign, username);

        return characterRepository.findByCampaignIdAndPlayerIsNullAndSourceTemplateIsNull(campaignId)
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CharacterDTO> getCharactersByCampaign(Long campaignId, String username) {
        Campaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> ApiException.notFound("Campagna non trovata"));

        checkCampaignAccess(campaign, username);

        return characterRepository.findByCampaignIdAndPlayerIsNotNull(campaignId)
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CharacterDTO> getMyCharacters(String username) {
        return characterRepository.findByPlayerUsername(username)
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Override
    @Transactional
    public CharacterDTO damageCharacter(Long characterId, int damage, String username) {
        return changeHp(characterId, damage, username, false);
    }

    @Override
    @Transactional
    public CharacterDTO healCharacter(Long characterId, int heal, String username) {
        return changeHp(characterId, heal, username, true);
    }

    private CharacterDTO changeHp(Long id, int amount, String username, boolean healing) {
        Character character = characterRepository.findLockedById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Personaggio non trovato"));
        User master = userService.getByUsername(username);
        if (!character.getCampaign().getMaster().getId().equals(master.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Puoi modificare solo personaggi delle tue campagne");
        }
        if (amount <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "L'importo deve essere positivo");
        }
        long hp = (long) character.getCurrentHp() + (healing ? (long) amount : -(long) amount);
        int bounded = (int) Math.max(0L, Math.min((long) character.getMaxHp(), hp));
        character.setCurrentHp(bounded);
        character.setAlive(bounded > 0);
        return mapToDTO(characterRepository.save(character));
    }

    @Override
    public AttackResultDTO attack(AttackRequest request, String username) {
        return combatService.attack(request, username);
    }

    private void validateCreateCharacterRequest(CreateCharacterRequest request) {
        if (request.getStats() == null) {
            throw ApiException.badRequest("Stats obbligatorie");
        }

        if (request.getWeaponName() == null || request.getWeaponName().isBlank()) {
            throw ApiException.badRequest("Il nome dell'arma è obbligatorio");
        }

        if (!List.of(4, 6, 8, 10, 12).contains(request.getDamageDie())) {
            throw ApiException.badRequest("Il dado danno dell'arma deve essere d4, d6, d8, d10 o d12");
        }

        if (request.getAttackAbility() == null) {
            throw ApiException.badRequest("La caratteristica di attacco è obbligatoria");
        }

        if (request.isSpellcaster()) {
            if (request.getSpellName() == null || request.getSpellName().isBlank()) {
                throw ApiException.badRequest("Il nome dell'incantesimo è obbligatorio per gli spellcaster");
            }

            if (!List.of(4, 6, 8, 10, 12).contains(request.getSpellDamageDie())) {
                throw ApiException.badRequest("Il dado danno dell'incantesimo deve essere d4, d6, d8, d10 o d12");
            }

            if (request.getSpellAbility() == null) {
                throw ApiException.badRequest("La caratteristica dell'incantesimo è obbligatoria");
            }
        }
    }

    private CharacterDTO mapToDTO(Character c) {
        return CharacterDTO.builder()
                .id(c.getId())
                .templateId(c.getSourceTemplate() == null ? null : c.getSourceTemplate().getId())
                .assignedCount(c.getPlayer() == null ? characterRepository.countBySourceTemplateId(c.getId()) : 0)
                .usedInCombat(participants.existsByCharacterId(c.getId()))
                .name(c.getName())
                .race(c.getRace())
                .characterClass(c.getCharacterClass())
                .imageUrl(c.getImageUrl())
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
                .stats(
                        c.getStats() != null
                                ? CharacterStatsDTO.builder()
                                .strength(c.getStats().getStrength())
                                .dexterity(c.getStats().getDexterity())
                                .constitution(c.getStats().getConstitution())
                                .intelligence(c.getStats().getIntelligence())
                                .wisdom(c.getStats().getWisdom())
                                .charisma(c.getStats().getCharisma())
                                .build()
                                : null
                )
                .build();
    }

    private void checkCampaignAccess(Campaign campaign, String username) {
        User user = userService.getByUsername(username);

        boolean isMaster = campaign.getMaster().getId().equals(user.getId());

        if (!isMaster) campaignProgressService.requireUnlocked(campaign.getId(), username);

        boolean isPlayer = campaign.getPlayers()
                .stream()
                .anyMatch(player -> player.getId().equals(user.getId()));

        if (!isMaster && !isPlayer) {
            throw ApiException.forbidden("Non fai parte di questa campagna");
        }
    }


    @Override
    @Transactional
    public CharacterDTO uploadCharacterImage(Long characterId, MultipartFile file, String username) {
        User master = userService.getByUsername(username);

        Character character = characterRepository.findLockedById(characterId)
                .orElseThrow(() -> ApiException.notFound("Personaggio non trovato"));

        boolean isCampaignMaster = character.getCampaign()
                .getMaster()
                .getId()
                .equals(master.getId());

        if (!isCampaignMaster) {
            throw ApiException.forbidden("Puoi modificare solo personaggi delle tue campagne");
        }

        requireTemplate(character);
        String imageUrl = imageUploadService.uploadCharacterImage(file);

        character.setImageUrl(imageUrl);

        Character saved = characterRepository.save(character);

        return mapToDTO(saved);
    }

    private void requireTemplate(Character character) {
        if (character.getPlayer() != null || character.getSourceTemplate() != null)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Le copie personali non possono essere modificate dal catalogo Master.");
    }

    private void validateUpdateCharacterRequest(UpdateCharacterRequest request) {
        if (request.getStats() == null) {
            throw ApiException.badRequest("Stats obbligatorie");
        }

        if (request.getWeaponName() == null || request.getWeaponName().isBlank()) {
            throw ApiException.badRequest("Il nome dell'arma è obbligatorio");
        }

        if (!List.of(4, 6, 8, 10, 12).contains(request.getDamageDie())) {
            throw ApiException.badRequest("Il dado danno dell'arma deve essere d4, d6, d8, d10 o d12");
        }

        if (request.getAttackAbility() == null) {
            throw ApiException.badRequest("La caratteristica di attacco è obbligatoria");
        }

        if (request.isSpellcaster()) {
            if (request.getSpellName() == null || request.getSpellName().isBlank()) {
                throw ApiException.badRequest("Il nome dell'incantesimo è obbligatorio per gli spellcaster");
            }

            if (!List.of(4, 6, 8, 10, 12).contains(request.getSpellDamageDie())) {
                throw ApiException.badRequest("Il dado danno dell'incantesimo deve essere d4, d6, d8, d10 o d12");
            }

            if (request.getSpellAbility() == null) {
                throw ApiException.badRequest("La caratteristica dell'incantesimo è obbligatoria");
            }
        }
    }

    @Override
    @Transactional
    public CharacterDTO updateCharacter(Long characterId, UpdateCharacterRequest request, String username) {
        User master = userService.getByUsername(username);

        Character character = characterRepository.findLockedById(characterId)
                .orElseThrow(() -> ApiException.notFound("Personaggio non trovato"));

        boolean isCampaignMaster = character.getCampaign()
                .getMaster()
                .getId()
                .equals(master.getId());

        if (!isCampaignMaster) {
            throw ApiException.forbidden("Puoi modificare solo personaggi delle tue campagne");
        }

        requireTemplate(character);
        if (participants.existsByCharacterId(characterId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Non puoi modificare un personaggio gia utilizzato in un combattimento");
        }
        validateUpdateCharacterRequest(request);

        character.setName(request.getName().trim());
        character.setRace(request.getRace().trim());
        character.setCharacterClass(request.getCharacterClass().trim());
        character.setLevel(request.getLevel());
        character.setMaxHp(request.getMaxHp());
        character.setArmorClass(request.getArmorClass());

        // Only the reusable model is edited; existing personal snapshots are untouched.
        character.setCurrentHp(request.getMaxHp());

        character.setWeaponName(request.getWeaponName().trim());
        character.setDamageDie(request.getDamageDie());
        character.setAttackAbility(request.getAttackAbility());

        character.setSpellcaster(request.isSpellcaster());

        if (request.isSpellcaster()) {
            character.setSpellName(request.getSpellName().trim());
            character.setSpellDamageDie(request.getSpellDamageDie());
            character.setSpellAbility(request.getSpellAbility());
        } else {
            character.setSpellName(null);
            character.setSpellDamageDie(0);
            character.setSpellAbility(null);
        }

        CharacterStats stats = character.getStats();

        if (stats == null) {
            stats = CharacterStats.builder()
                    .character(character)
                    .build();
        }

        CharacterStatsDTO statsDTO = request.getStats();

        stats.setStrength(statsDTO.getStrength());
        stats.setDexterity(statsDTO.getDexterity());
        stats.setConstitution(statsDTO.getConstitution());
        stats.setIntelligence(statsDTO.getIntelligence());
        stats.setWisdom(statsDTO.getWisdom());
        stats.setCharisma(statsDTO.getCharisma());

        character.setAlive(character.getCurrentHp() > 0);
        character.setStats(stats);

        Character saved = characterRepository.save(character);

        return mapToDTO(saved);
    }

    @Override
    @Transactional
    public void deleteCharacter(Long characterId, String username) {
        User master = userService.getByUsername(username);

        Character character = characterRepository.findLockedById(characterId)
                .orElseThrow(() -> ApiException.notFound("Personaggio non trovato"));

        boolean isCampaignMaster = character.getCampaign()
                .getMaster()
                .getId()
                .equals(master.getId());

        if (!isCampaignMaster) {
            throw ApiException.forbidden("Puoi eliminare solo personaggi delle tue campagne");
        }

        requireTemplate(character);
        if (characterRepository.existsBySourceTemplateId(characterId)) throw new ResponseStatusException(HttpStatus.CONFLICT, "Questo modello ha copie personali: puoi modificarlo per le scelte future, ma non eliminarlo.");
        characterRepository.delete(character);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CharacterDTO> getAllCharactersByCampaignForMaster(
            Long campaignId,
            String username
    ) {
        Campaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> ApiException.notFound("Campagna non trovata"));

        User master = userService.getByUsername(username);

        boolean isCampaignMaster = campaign.getMaster().getId().equals(master.getId());

        if (!isCampaignMaster) {
            throw ApiException.forbidden("Puoi visualizzare solo personaggi delle tue campagne");
        }

        return characterRepository.findByCampaignIdAndPlayerIsNullAndSourceTemplateIsNull(campaignId)
                .stream()
                .map(this::mapToDTO)
                .toList();
    }
}
