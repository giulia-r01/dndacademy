package com.giulia.dndacademy.service;

import com.giulia.dndacademy.dto.EncounterDTO;
import com.giulia.dndacademy.dto.EncounterRequest;

import java.util.List;

public interface EncounterService {

    EncounterDTO createEncounter(EncounterRequest request, String username);

    List<EncounterDTO> getEncountersByChapter(Long chapterId, String username);

    EncounterDTO getEncounterById(Long encounterId, String username);

    EncounterDTO updateEncounter(
            Long encounterId,
            EncounterRequest request,
            String username
    );

    void deleteEncounter(Long encounterId, String username);
}