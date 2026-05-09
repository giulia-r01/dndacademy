package com.giulia.dndacademy.repository;

import com.giulia.dndacademy.model.UserQuizResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UserQuizResultRepository extends JpaRepository<UserQuizResult, Long> {

    List<UserQuizResult> findByUserUsername(String username);

    List<UserQuizResult> findByUserUsernameAndPassedTrue(String username);

    boolean existsByUserUsernameAndQuizIdAndPassedTrue(String username, Long quizId);

    @Query("SELECT COUNT(DISTINCT r.quiz.id) FROM UserQuizResult r WHERE r.user.username = :username AND r.passed = true")
    long countDistinctPassedQuizzesByUsername(@Param("username") String username);
}