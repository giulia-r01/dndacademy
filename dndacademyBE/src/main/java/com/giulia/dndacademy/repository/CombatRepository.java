package com.giulia.dndacademy.repository;

import com.giulia.dndacademy.model.Combat;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CombatRepository extends JpaRepository<Combat, Long> {
    List<Combat> findByCampaignId(Long campaignId);
}
