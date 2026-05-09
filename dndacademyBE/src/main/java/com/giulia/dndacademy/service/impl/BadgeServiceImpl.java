package com.giulia.dndacademy.service.impl;

import com.giulia.dndacademy.dto.BadgeDTO;
import com.giulia.dndacademy.dto.CreateBadgeRequest;
import com.giulia.dndacademy.model.Badge;
import com.giulia.dndacademy.model.User;
import com.giulia.dndacademy.model.UserBadge;
import com.giulia.dndacademy.repository.BadgeRepository;
import com.giulia.dndacademy.repository.UserBadgeRepository;
import com.giulia.dndacademy.service.BadgeService;
import com.giulia.dndacademy.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BadgeServiceImpl implements BadgeService {

    private final BadgeRepository badgeRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final UserService userService;

    @Override
    public void assignBadge(String username, String badgeName) {

        boolean alreadyExists = userBadgeRepository
                .existsByUserUsernameAndBadgeName(username, badgeName);

        if (alreadyExists) {
            return;
        }

        User user = userService.getByUsername(username);

        Badge badge = badgeRepository.findByName(badgeName)
                .orElseThrow(() -> new RuntimeException("Badge non trovato"));

        UserBadge userBadge = UserBadge.builder()
                .user(user)
                .badge(badge)
                .unlockedAt(LocalDateTime.now())
                .build();

        userBadgeRepository.save(userBadge);
    }

    @Override
    public List<BadgeDTO> getMyBadges(String username) {

        return userBadgeRepository.findByUserUsername(username)
                .stream()
                .map(userBadge -> BadgeDTO.builder()
                        .id(userBadge.getBadge().getId())
                        .name(userBadge.getBadge().getName())
                        .description(userBadge.getBadge().getDescription())
                        .unlockedAt(userBadge.getUnlockedAt())
                        .build())
                .toList();
    }

    @Override
    public BadgeDTO createBadge(CreateBadgeRequest request) {

        Badge badge = Badge.builder()
                .name(request.getName())
                .description(request.getDescription())
                .build();

        Badge saved = badgeRepository.save(badge);

        return BadgeDTO.builder()
                .id(saved.getId())
                .name(saved.getName())
                .description(saved.getDescription())
                .build();
    }
}