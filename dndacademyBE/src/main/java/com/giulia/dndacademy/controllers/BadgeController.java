package com.giulia.dndacademy.controllers;

import com.giulia.dndacademy.dto.BadgeDTO;
import com.giulia.dndacademy.dto.CreateBadgeRequest;
import com.giulia.dndacademy.service.BadgeService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/badges")
@RequiredArgsConstructor
public class BadgeController {

    private final BadgeService badgeService;

    @PreAuthorize("hasRole('MASTER')")
    @PostMapping
    public BadgeDTO createBadge(@RequestBody CreateBadgeRequest request) {
        return badgeService.createBadge(request);
    }

    @GetMapping("/me")
    public List<BadgeDTO> getMyBadges(Authentication authentication) {

        String username = authentication.getName();

        return badgeService.getMyBadges(username);
    }
}