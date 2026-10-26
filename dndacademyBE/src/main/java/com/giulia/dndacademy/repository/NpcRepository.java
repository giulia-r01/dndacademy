package com.giulia.dndacademy.repository;

import com.giulia.dndacademy.model.Npc;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NpcRepository extends JpaRepository<Npc, Long> {

    List<Npc> findByOwnerIdOrderByNameAsc(Long ownerId);
}