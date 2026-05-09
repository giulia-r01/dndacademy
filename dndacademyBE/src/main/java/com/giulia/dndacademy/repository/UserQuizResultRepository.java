package com.giulia.dndacademy.repository;

import com.giulia.dndacademy.model.UserQuizResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserQuizResultRepository extends JpaRepository<UserQuizResult, Long> {

    List<UserQuizResult> findByUserUsername(String username);

    List<UserQuizResult> findByUserUsernameAndPassedTrue(String username);
}