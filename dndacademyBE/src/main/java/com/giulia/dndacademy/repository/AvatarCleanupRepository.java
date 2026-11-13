package com.giulia.dndacademy.repository;

import com.giulia.dndacademy.model.AvatarCleanup;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Pageable;
import java.time.Instant;
import java.util.*;

public interface AvatarCleanupRepository extends JpaRepository<AvatarCleanup, String> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from AvatarCleanup a where a.nextAttemptAt <= :now order by a.nextAttemptAt, a.id")
    List<AvatarCleanup> findReady(@Param("now") Instant now, Pageable page);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from AvatarCleanup a where a.id = :id")
    Optional<AvatarCleanup> findLocked(@Param("id") String id);
}
