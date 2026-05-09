package com.giulia.dndacademy.service;

import com.giulia.dndacademy.dto.BadgeDTO;
import com.giulia.dndacademy.dto.CreateBadgeRequest;

import java.util.List;

public interface BadgeService {

    void assignBadge(String username, String badgeName);

    List<BadgeDTO> getMyBadges(String username);

    BadgeDTO createBadge(CreateBadgeRequest request);
}