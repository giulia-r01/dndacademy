package com.giulia.dndacademy.repository;

import com.giulia.dndacademy.model.CampaignProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CampaignProgressRepository extends JpaRepository<CampaignProgress, Long> {

    Optional<CampaignProgress> findByUserIdAndCampaignId(
            Long userId,
            Long campaignId
    );

    boolean existsByUserIdAndCampaignId(
            Long userId,
            Long campaignId
    );

    List<CampaignProgress> findByUserIdOrderByCampaignIdAsc(
            Long userId
    );
}