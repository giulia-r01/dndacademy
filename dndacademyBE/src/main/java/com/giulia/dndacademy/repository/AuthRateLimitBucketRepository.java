package com.giulia.dndacademy.repository;

import com.giulia.dndacademy.model.AuthRateLimitBucket;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.Optional;

public interface AuthRateLimitBucketRepository extends JpaRepository<AuthRateLimitBucket, String> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select bucket from AuthRateLimitBucket bucket where bucket.id = :id")
    Optional<AuthRateLimitBucket> findLocked(@Param("id") String id);

    @Transactional @Modifying
    @Query("delete from AuthRateLimitBucket bucket where bucket.expiresAt < :cutoff")
    int deleteExpired(@Param("cutoff") Instant cutoff);
}
