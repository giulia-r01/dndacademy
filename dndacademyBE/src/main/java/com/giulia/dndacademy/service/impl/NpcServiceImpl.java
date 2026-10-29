package com.giulia.dndacademy.service.impl;

import com.giulia.dndacademy.dto.NpcDTO;
import com.giulia.dndacademy.dto.NpcRequest;
import com.giulia.dndacademy.model.Npc;
import com.giulia.dndacademy.model.User;
import com.giulia.dndacademy.repository.CombatParticipantRepository;
import com.giulia.dndacademy.repository.EncounterNpcRepository;
import com.giulia.dndacademy.repository.NpcRepository;
import com.giulia.dndacademy.service.NpcService;
import com.giulia.dndacademy.service.UserService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NpcServiceImpl implements NpcService {

    private final NpcRepository npcRepository;
    private final EncounterNpcRepository encounterNpcRepository;
    private final CombatParticipantRepository combatParticipantRepository;
    private final UserService userService;
    private final com.giulia.dndacademy.service.ImageUploadService imageUploadService;

    @Override
    @Transactional
    public NpcDTO uploadNpcImage(Long npcId, org.springframework.web.multipart.MultipartFile file, String username) {
        Npc npc = getOwnedNpc(npcId, userService.getByUsername(username));
        npc.setImageUrl(imageUploadService.uploadNpcImage(file));
        return mapToDTO(npcRepository.save(npc));
    }

    @Override
    @Transactional
    public NpcDTO createNpc(NpcRequest request, String username) {

        User master = userService.getByUsername(username);

        validateDamageDie(request.getDamageDie());
        validateHealing(request);

        Npc npc = Npc.builder()
                .name(request.getName().trim())
                .description(request.getDescription())
                .maxHp(request.getMaxHp())
                .armorClass(request.getArmorClass())
                .dexterity(request.getDexterity())
                .attackModifier(request.getAttackModifier())
                .damageDie(request.getDamageDie())
                .damageModifier(request.getDamageModifier())
                .healer(request.isHealer()).healingDie(request.isHealer() ? request.getHealingDie() : 0)
                .healingModifier(request.isHealer() ? request.getHealingModifier() : 0)
                .healingUses(request.isHealer() ? request.getHealingUses() : 0)
                .enemy(request.getEnemy())
                .owner(master)
                .build();

        return mapToDTO(npcRepository.save(npc));
    }

    @Override
    @Transactional(readOnly = true)
    public List<NpcDTO> getMyNpcs(String username) {

        User master = userService.getByUsername(username);

        return npcRepository
                .findByOwnerIdOrderByNameAsc(master.getId())
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public NpcDTO getNpcById(Long npcId, String username) {

        User master = userService.getByUsername(username);

        Npc npc = getOwnedNpc(npcId, master);

        return mapToDTO(npc);
    }

    @Override
    @Transactional
    public NpcDTO updateNpc(
            Long npcId,
            NpcRequest request,
            String username
    ) {

        User master = userService.getByUsername(username);

        Npc npc = getOwnedNpc(npcId, master);

        validateDamageDie(request.getDamageDie());
        validateHealing(request);

        // Evitiamo di modificare le statistiche di NPC già usati
        // in combattimenti, perché altererebbe le sessioni salvate.
        if (combatParticipantRepository.existsByNpcId(npcId)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Non puoi modificare un NPC già utilizzato in un combattimento"
            );
        }

        npc.setName(request.getName().trim());
        npc.setDescription(request.getDescription());
        npc.setMaxHp(request.getMaxHp());
        npc.setArmorClass(request.getArmorClass());
        npc.setDexterity(request.getDexterity());
        npc.setAttackModifier(request.getAttackModifier());
        npc.setDamageDie(request.getDamageDie());
        npc.setDamageModifier(request.getDamageModifier());
        npc.setEnemy(request.getEnemy());
        npc.setHealer(request.isHealer());
        npc.setHealingDie(request.isHealer() ? request.getHealingDie() : 0);
        npc.setHealingModifier(request.isHealer() ? request.getHealingModifier() : 0);
        npc.setHealingUses(request.isHealer() ? request.getHealingUses() : 0);

        return mapToDTO(npcRepository.save(npc));
    }

    @Override
    @Transactional
    public void deleteNpc(Long npcId, String username) {

        User master = userService.getByUsername(username);

        Npc npc = getOwnedNpc(npcId, master);

        boolean usedInEncounter =
                encounterNpcRepository.existsByNpcId(npcId);

        boolean usedInCombat =
                combatParticipantRepository.existsByNpcId(npcId);

        if (usedInEncounter || usedInCombat) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Non puoi eliminare un NPC utilizzato in un incontro o combattimento"
            );
        }

        npcRepository.delete(npc);
    }

    private Npc getOwnedNpc(Long npcId, User master) {

        Npc npc = npcRepository.findById(npcId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "NPC non trovato"
                ));

        if (npc.getOwner() == null ||
                !npc.getOwner().getId().equals(master.getId())) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Non puoi gestire questo NPC"
            );
        }

        return npc;
    }

    private void validateHealing(NpcRequest request) {
        if (!request.isHealer()) return;
        if (!Boolean.FALSE.equals(request.getEnemy())
                || !List.of(4, 6, 8, 10, 12).contains(request.getHealingDie())
                || request.getHealingModifier() < 0 || request.getHealingModifier() > 30
                || request.getHealingUses() < 1 || request.getHealingUses() > 20)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Un guaritore deve essere un aiutante: cura d4/d6/d8/d10/d12, bonus 0-30 e utilizzi 1-20.");
    }

    private void validateDamageDie(Integer damageDie) {

        if (damageDie == null ||
                !List.of(4, 6, 8, 10, 12).contains(damageDie)) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Il dado danni deve essere d4, d6, d8, d10 o d12"
            );
        }
    }

    private NpcDTO mapToDTO(Npc npc) {

        return NpcDTO.builder()
                .id(npc.getId())
                .imageUrl(npc.getImageUrl())
                .name(npc.getName())
                .description(npc.getDescription())
                .maxHp(npc.getMaxHp())
                .armorClass(npc.getArmorClass())
                .dexterity(npc.getDexterity())
                .attackModifier(npc.getAttackModifier())
                .damageDie(npc.getDamageDie())
                .damageModifier(npc.getDamageModifier())
                .healer(npc.isHealer()).healingDie(npc.getHealingDie())
                .healingModifier(npc.getHealingModifier()).healingUses(npc.getHealingUses())
                .enemy(npc.isEnemy())
                .build();
    }
}
