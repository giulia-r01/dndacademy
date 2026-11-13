package com.giulia.dndacademy.repository;

import com.giulia.dndacademy.model.EmailOutbox;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.*;

public interface EmailOutboxRepository extends JpaRepository<EmailOutbox, String> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select task from EmailOutbox task where task.status in :statuses and task.nextAttemptAt <= :now order by task.createdAt, task.id")
    List<EmailOutbox> findReady(@Param("now") Instant now, @Param("statuses") Collection<EmailOutbox.Status> statuses, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select task from EmailOutbox task where task.id = :id")
    Optional<EmailOutbox> findLocked(@Param("id") String id);

    @Transactional @Modifying
    @Query("delete from EmailOutbox task where task.expiresAt < :cutoff")
    int deleteExpired(@Param("cutoff") Instant cutoff);
}
