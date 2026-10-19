package com.giulia.dndacademy.repository;

import com.giulia.dndacademy.model.Npc;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NpcRepository extends JpaRepository<Npc, Long> {
}