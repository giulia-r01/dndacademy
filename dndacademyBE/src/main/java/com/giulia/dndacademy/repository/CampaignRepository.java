package com.giulia.dndacademy.repository;

import com.giulia.dndacademy.model.Campaign;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CampaignRepository extends JpaRepository<Campaign, Long> {
}