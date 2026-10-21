package com.giulia.dndacademy.service.impl;

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

@Service
@RequiredArgsConstructor
public class CharacterServiceImpl implements CharacterService {

    private final CharacterRepository characterRepository;
    private final CharacterStatsRepository characterStatsRepository;
    private final CampaignRepository campaignRepository;
    private final UserService userService;
    private final CombatService combatService;
    private final ImageUploadService imageUploadService;


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

        boolean alreadyHasCharacter = characterRepository
                .findByCampaignIdAndPlayerId(campaign.getId(), player.getId())
                .isPresent();

        if (alreadyHasCharacter) {
            throw new RuntimeException(
                    "Hai già scelto un personaggio per questa campagna"
            );
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
    public AttackResultDTO attack(AttackRequest request, String username) {
        return combatService.attack(request, username);
    }

    private void validateCreateCharacterRequest(CreateCharacterRequest request) {
        if (request.getStats() == null) {
            throw new RuntimeException("Stats obbligatorie");
        }

        if (request.getWeaponName() == null || request.getWeaponName().isBlank()) {
            throw new RuntimeException("Il nome dell'arma è obbligatorio");
        }

        if (!List.of(4, 6, 8, 10, 12).contains(request.getDamageDie())) {
            throw new RuntimeException("Il dado danno dell'arma deve essere d4, d6, d8, d10 o d12");
        }

        if (request.getAttackAbility() == null) {
            throw new RuntimeException("La caratteristica di attacco è obbligatoria");
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

    private CharacterDTO mapToDTO(Character c) {
        return CharacterDTO.builder()
                .id(c.getId())
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

        boolean isPlayer = campaign.getPlayers()
                .stream()
                .anyMatch(player -> player.getId().equals(user.getId()));

        if (!isMaster && !isPlayer) {
            throw new RuntimeException("Non fai parte di questa campagna");
        }
    }


    @Override
    public CharacterDTO uploadCharacterImage(Long characterId, MultipartFile file, String username) {
        User master = userService.getByUsername(username);

        Character character = characterRepository.findById(characterId)
                .orElseThrow(() -> new RuntimeException("Personaggio non trovato"));

        boolean isCampaignMaster = character.getCampaign()
                .getMaster()
                .getId()
                .equals(master.getId());

        if (!isCampaignMaster) {
            throw new RuntimeException("Puoi modificare solo personaggi delle tue campagne");
        }

        String imageUrl = imageUploadService.uploadCharacterImage(file);

        character.setImageUrl(imageUrl);

        Character saved = characterRepository.save(character);

        return mapToDTO(saved);
    }

    private void validateUpdateCharacterRequest(UpdateCharacterRequest request) {
        if (request.getStats() == null) {
            throw new RuntimeException("Stats obbligatorie");
        }

        if (request.getWeaponName() == null || request.getWeaponName().isBlank()) {
            throw new RuntimeException("Il nome dell'arma è obbligatorio");
        }

        if (!List.of(4, 6, 8, 10, 12).contains(request.getDamageDie())) {
            throw new RuntimeException("Il dado danno dell'arma deve essere d4, d6, d8, d10 o d12");
        }

        if (request.getAttackAbility() == null) {
            throw new RuntimeException("La caratteristica di attacco è obbligatoria");
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

    @Override
    public CharacterDTO updateCharacter(Long characterId, UpdateCharacterRequest request, String username) {
        User master = userService.getByUsername(username);

        Character character = characterRepository.findById(characterId)
                .orElseThrow(() -> new RuntimeException("Personaggio non trovato"));

        boolean isCampaignMaster = character.getCampaign()
                .getMaster()
                .getId()
                .equals(master.getId());

        if (!isCampaignMaster) {
            throw new RuntimeException("Puoi modificare solo personaggi delle tue campagne");
        }

        validateUpdateCharacterRequest(request);

        character.setName(request.getName().trim());
        character.setRace(request.getRace().trim());
        character.setCharacterClass(request.getCharacterClass().trim());
        character.setLevel(request.getLevel());
        character.setMaxHp(request.getMaxHp());
        character.setArmorClass(request.getArmorClass());

        if (character.getCurrentHp() > request.getMaxHp()) {
            character.setCurrentHp(request.getMaxHp());
        }

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

        character.setStats(stats);

        Character saved = characterRepository.save(character);

        return mapToDTO(saved);
    }

    @Override
    public void deleteCharacter(Long characterId, String username) {
        User master = userService.getByUsername(username);

        Character character = characterRepository.findById(characterId)
                .orElseThrow(() -> new RuntimeException("Personaggio non trovato"));

        boolean isCampaignMaster = character.getCampaign()
                .getMaster()
                .getId()
                .equals(master.getId());

        if (!isCampaignMaster) {
            throw new RuntimeException("Puoi eliminare solo personaggi delle tue campagne");
        }

        if (character.getPlayer() != null) {
            throw new RuntimeException("Non puoi eliminare un personaggio già scelto da un player");
        }

        characterRepository.delete(character);
    }

    @Override
    public List<CharacterDTO> getAllCharactersByCampaignForMaster(
            Long campaignId,
            String username
    ) {
        Campaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new RuntimeException("Campagna non trovata"));

        User master = userService.getByUsername(username);

        boolean isCampaignMaster = campaign.getMaster().getId().equals(master.getId());

        if (!isCampaignMaster) {
            throw new RuntimeException("Puoi visualizzare solo personaggi delle tue campagne");
        }

        return characterRepository.findByCampaignId(campaignId)
                .stream()
                .map(this::mapToDTO)
                .toList();
    }
}
