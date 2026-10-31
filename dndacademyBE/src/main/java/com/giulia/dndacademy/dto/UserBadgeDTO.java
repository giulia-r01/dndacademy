package com.giulia.dndacademy.dto;
import java.time.LocalDateTime;

public record UserBadgeDTO(Long id, String name, String description, boolean unlocked, LocalDateTime unlockedAt) {}
