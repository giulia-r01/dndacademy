package com.giulia.dndacademy.repository;

import com.giulia.dndacademy.model.Character;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CharacterRepository extends JpaRepository<Character, Long> {

    List<Character> findByCampaignId(Long campaignId);

    List<Character> findByPlayerUsername(String username);
}
