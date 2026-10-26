package com.giulia.dndacademy.service.impl;

import com.giulia.dndacademy.dto.*;
import com.giulia.dndacademy.model.*;
import com.giulia.dndacademy.repository.*;
import com.giulia.dndacademy.service.EncounterService;
import com.giulia.dndacademy.service.UserService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@Service
@RequiredArgsConstructor
public class EncounterServiceImpl implements EncounterService {

    private final EncounterRepository encounterRepository;
    private final EncounterNpcRepository encounterNpcRepository;
    private final NpcRepository npcRepository;
    private final CampaignChapterRepository chapterRepository;
    private final CombatRepository combatRepository;
    private final UserService userService;

    @Override
    @Transactional
    public EncounterDTO createEncounter(
            EncounterRequest request,
            String username
    ) {
        User master = userService.getByUsername(username);

        CampaignChapter chapter = getOwnedChapter(
                request.getChapterId(),
                master
        );

        if (!chapter.isHasCombat()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Il capitolo non prevede un combattimento"
            );
        }

        if (encounterRepository.existsByChapterId(chapter.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Questo capitolo possiede già un incontro"
            );
        }

        List<NpcSelection> selected = validateNpcSelection(
                request.getNpcs(),
                master
        );

        Encounter encounter = Encounter.builder()
                .title(request.getTitle().trim())
                .description(request.getDescription())
                .chapter(chapter)
                .build();

        Encounter saved = encounterRepository.save(encounter);

        saveEncounterNpcs(saved, selected);

        return mapToDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<EncounterDTO> getEncountersByChapter(
            Long chapterId,
            String username
    ) {
        User master = userService.getByUsername(username);

        getOwnedChapter(chapterId, master);

        return encounterRepository.findByChapterId(chapterId)
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public EncounterDTO getEncounterById(
            Long encounterId,
            String username
    ) {
        User master = userService.getByUsername(username);

        Encounter encounter = getOwnedEncounter(
                encounterId,
                master
        );

        return mapToDTO(encounter);
    }

    @Override
    @Transactional
    public EncounterDTO updateEncounter(
            Long encounterId,
            EncounterRequest request,
            String username
    ) {
        User master = userService.getByUsername(username);

        Encounter encounter = getOwnedEncounter(
                encounterId,
                master
        );

        CampaignChapter chapter = getOwnedChapter(
                request.getChapterId(),
                master
        );

        if (!chapter.isHasCombat()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Il capitolo non prevede un combattimento"
            );
        }

        if (!encounter.getChapter().getId().equals(chapter.getId())
                && encounterRepository.existsByChapterId(chapter.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Il capitolo selezionato possiede già un incontro"
            );
        }

        if (combatRepository.existsByEncounterId(encounterId)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Non puoi modificare un incontro già utilizzato in un combattimento"
            );
        }

        List<NpcSelection> selected = validateNpcSelection(
                request.getNpcs(),
                master
        );

        encounter.setTitle(request.getTitle().trim());
        encounter.setDescription(request.getDescription());
        encounter.setChapter(chapter);

        encounterNpcRepository.deleteByEncounterId(encounterId);
        encounterNpcRepository.flush();

        saveEncounterNpcs(encounter, selected);

        return mapToDTO(encounter);
    }

    @Override
    @Transactional
    public void deleteEncounter(
            Long encounterId,
            String username
    ) {
        User master = userService.getByUsername(username);

        Encounter encounter = getOwnedEncounter(
                encounterId,
                master
        );

        if (combatRepository.existsByEncounterId(encounterId)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Non puoi eliminare un incontro già utilizzato"
            );
        }

        encounterNpcRepository.deleteByEncounterId(encounterId);
        encounterNpcRepository.flush();

        encounterRepository.delete(encounter);
    }

    private CampaignChapter getOwnedChapter(
            Long chapterId,
            User master
    ) {
        CampaignChapter chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Capitolo non trovato"
                ));

        if (!chapter.getCampaign()
                .getMaster()
                .getId()
                .equals(master.getId())) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Non puoi gestire i capitoli di questa campagna"
            );
        }

        return chapter;
    }

    private Encounter getOwnedEncounter(
            Long encounterId,
            User master
    ) {
        Encounter encounter = encounterRepository.findById(encounterId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Incontro non trovato"
                ));

        getOwnedChapter(encounter.getChapter().getId(), master);

        return encounter;
    }

    private List<NpcSelection> validateNpcSelection(
            List<EncounterNpcRequest> requests,
            User master
    ) {
        if (requests == null || requests.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Aggiungi almeno un NPC"
            );
        }

        Set<Long> selectedIds = new HashSet<>();
        List<NpcSelection> result = new ArrayList<>();
        boolean hasEnemy = false;

        for (EncounterNpcRequest request : requests) {

            if (request == null ||
                    request.getNpcId() == null ||
                    request.getQuantity() == null ||
                    request.getQuantity() < 1 ||
                    request.getQuantity() > 20) {

                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Configurazione NPC non valida"
                );
            }

            if (!selectedIds.add(request.getNpcId())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Lo stesso NPC è stato aggiunto più volte"
                );
            }

            Npc npc = npcRepository.findById(request.getNpcId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "NPC non trovato"
                    ));

            if (npc.getOwner() == null ||
                    !npc.getOwner().getId().equals(master.getId())) {

                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Puoi utilizzare soltanto i tuoi NPC"
                );
            }

            if (npc.isEnemy()) {
                hasEnemy = true;
            }

            result.add(new NpcSelection(npc, request.getQuantity()));
        }

        if (!hasEnemy) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "L'incontro deve contenere almeno un nemico"
            );
        }

        return result;
    }

    private void saveEncounterNpcs(
            Encounter encounter,
            List<NpcSelection> selected
    ) {
        for (NpcSelection selection : selected) {

            EncounterNpc encounterNpc = EncounterNpc.builder()
                    .encounter(encounter)
                    .npc(selection.npc())
                    .quantity(selection.quantity())
                    .build();

            encounterNpcRepository.save(encounterNpc);
        }
    }

    private EncounterDTO mapToDTO(Encounter encounter) {

        List<EncounterNpcDTO> npcs = encounterNpcRepository
                .findByEncounterId(encounter.getId())
                .stream()
                .map(en -> EncounterNpcDTO.builder()
                        .npcId(en.getNpc().getId())
                        .npcName(en.getNpc().getName())
                        .enemy(en.getNpc().isEnemy())
                        .quantity(en.getQuantity())
                        .build())
                .toList();

        return EncounterDTO.builder()
                .id(encounter.getId())
                .title(encounter.getTitle())
                .description(encounter.getDescription())
                .chapterId(encounter.getChapter().getId())
                .campaignId(encounter.getChapter().getCampaign().getId())
                .npcs(npcs)
                .build();
    }

    private record NpcSelection(Npc npc, int quantity) {
    }
}