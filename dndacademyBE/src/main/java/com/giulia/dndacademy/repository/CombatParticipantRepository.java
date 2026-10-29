package com.giulia.dndacademy.repository;

import com.giulia.dndacademy.model.CombatParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;

import java.util.List;

public interface CombatParticipantRepository
        extends JpaRepository<CombatParticipant, Long> {

    @EntityGraph(attributePaths = "character")
    List<CombatParticipant> findByCombatIdInAndCharacterIsNotNull(List<Long> combatIds);

    List<CombatParticipant> findByCombatId(Long combatId);

    List<CombatParticipant> findByCombatIdOrderByInitiativeDesc(Long combatId);

    boolean existsByNpcId(Long npcId);
}
