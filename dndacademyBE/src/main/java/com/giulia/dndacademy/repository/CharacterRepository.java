package com.giulia.dndacademy.repository;

import com.giulia.dndacademy.model.Character;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CharacterRepository extends JpaRepository<Character, Long> {

    @org.springframework.data.jpa.repository.Query("select c.campaign.id from Character c where c.id = :id")
    Optional<Long> findCampaignIdById(@org.springframework.data.repository.query.Param("id") Long id);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select c from Character c where c.id = :id")
    Optional<Character> findLockedById(@org.springframework.data.repository.query.Param("id") Long id);

    List<Character> findByCampaignId(Long campaignId);

    List<Character> findByPlayerUsername(String username);

    List<Character> findByCampaignIdAndPlayerIsNull(Long campaignId);

    List<Character> findByCampaignIdAndPlayerIsNotNull(Long campaignId);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    Optional<Character> findLockedByCampaignIdAndPlayerId(Long campaignId, Long playerId);

    Optional<Character> findByCampaignIdAndPlayerId(
            Long campaignId,
            Long playerId
    );
}
