package com.giulia.dndacademy.service;

import com.giulia.dndacademy.dto.BadgeDTO;
import com.giulia.dndacademy.dto.CreateBadgeRequest;
import com.giulia.dndacademy.dto.UpdateBadgeRequest;

import java.util.List;

public interface BadgeService {

    void assignBadge(String username, String badgeName);
    void assignSystemBadge(String username, com.giulia.dndacademy.model.enumerations.SystemBadge code);

    List<BadgeDTO> getMyBadges(String username);
    List<com.giulia.dndacademy.dto.UserBadgeDTO> getCatalog(String username);

    BadgeDTO createBadge(CreateBadgeRequest request);

    List<BadgeDTO> getAllBadges();

    BadgeDTO updateBadge(Long badgeId, UpdateBadgeRequest request);

    void deleteBadge(Long badgeId);
}