package com.giulia.dndacademy.repository;

import com.giulia.dndacademy.model.Combat;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CombatRepository extends JpaRepository<Combat, Long> {
}
