package com.giulia.dndacademy.repository;

import com.giulia.dndacademy.model.Character;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CharacterRepository extends JpaRepository<Character, Long> {

    List<Character> findByCampaignId(Long campaignId);

    List<Character> findByPlayerUsername(String username);

    List<Character> findByCampaignIdAndPlayerIsNull(Long campaignId);

    List<Character> findByCampaignIdAndPlayerIsNotNull(Long campaignId);

    Optional<Character> findByCampaignIdAndPlayerId(
            Long campaignId,
            Long playerId
    );
}
