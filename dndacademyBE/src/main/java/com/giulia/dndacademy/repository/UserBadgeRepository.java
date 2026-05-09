package com.giulia.dndacademy.repository;

import com.giulia.dndacademy.model.UserBadge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserBadgeRepository extends JpaRepository<UserBadge, Long> {

    List<UserBadge> findByUserUsername(String username);

    boolean existsByUserUsernameAndBadgeName(String username, String badgeName);
}