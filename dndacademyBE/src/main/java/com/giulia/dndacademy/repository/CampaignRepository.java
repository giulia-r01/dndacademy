package com.giulia.dndacademy.repository;

import com.giulia.dndacademy.model.Campaign;
import com.giulia.dndacademy.model.enumerations.CampaignDifficulty;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CampaignRepository extends JpaRepository<Campaign, Long> {
    List<Campaign> findByDifficulty(CampaignDifficulty difficulty);
}