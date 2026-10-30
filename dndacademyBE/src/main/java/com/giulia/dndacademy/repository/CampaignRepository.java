package com.giulia.dndacademy.repository;

import com.giulia.dndacademy.model.Campaign;
import com.giulia.dndacademy.model.enumerations.CampaignDifficulty;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CampaignRepository extends JpaRepository<Campaign, Long> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select c from Campaign c where c.id = :id")
    java.util.Optional<Campaign> findLockedById(@org.springframework.data.repository.query.Param("id") Long id);

    List<Campaign> findByDifficulty(CampaignDifficulty difficulty);
}