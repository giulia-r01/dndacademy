package com.giulia.dndacademy.repository;

import com.giulia.dndacademy.model.EncounterNpc;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EncounterNpcRepository
        extends JpaRepository<EncounterNpc, Long> {

    List<EncounterNpc> findByEncounterId(Long encounterId);

    boolean existsByNpcId(Long npcId);

    void deleteByEncounterId(Long encounterId);
}