package com.giulia.dndacademy.repository;

import com.giulia.dndacademy.model.CharacterStats;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CharacterStatsRepository extends JpaRepository<CharacterStats, Long> {
}