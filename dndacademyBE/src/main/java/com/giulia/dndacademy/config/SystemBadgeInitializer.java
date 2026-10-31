package com.giulia.dndacademy.config;

import com.giulia.dndacademy.model.Badge;
import com.giulia.dndacademy.model.enumerations.SystemBadge;
import com.giulia.dndacademy.repository.BadgeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class SystemBadgeInitializer implements ApplicationRunner {
    private final BadgeRepository badges;
    @Override
    @Transactional
    public void run(ApplicationArguments arguments) {
        for (SystemBadge code : SystemBadge.values()) {
            if (badges.findBySystemCode(code).isPresent()) continue;
            Badge badge = badges.findByName(code.getTitle()).orElseGet(() -> Badge.builder()
                    .name(code.getTitle()).description(code.getDescription()).build());
            badge.setSystemCode(code);
            badges.save(badge);
        }
    }
}
