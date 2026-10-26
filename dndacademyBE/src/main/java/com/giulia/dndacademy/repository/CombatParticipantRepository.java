package com.giulia.dndacademy.repository;

import com.giulia.dndacademy.model.CombatParticipant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CombatParticipantRepository
        extends JpaRepository<CombatParticipant, Long> {

    List<CombatParticipant> findByCombatId(Long combatId);

    List<CombatParticipant> findByCombatIdOrderByInitiativeDesc(Long combatId);

    boolean existsByNpcId(Long npcId);
}