package com.giulia.dndacademy.service.impl;

import com.giulia.dndacademy.dto.UserDTO;
import com.giulia.dndacademy.model.User;
import com.giulia.dndacademy.model.enumerations.LearningLevel;
import com.giulia.dndacademy.repository.UserRepository;
import com.giulia.dndacademy.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.giulia.dndacademy.model.enumerations.LearningLevel;
import com.giulia.dndacademy.repository.UserLessonProgressRepository;
import com.giulia.dndacademy.repository.UserQuizResultRepository;


import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private LearningLevel learningLevel;
    private final UserLessonProgressRepository userLessonProgressRepository;
    private final UserQuizResultRepository userQuizResultRepository;

    @Override
    public User register(User user) {
        return userRepository.save(user);
    }

    @Override
    public User getByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Utente non trovato con username: " + username));
    }

    @Override
    public UserDTO getUserById(Long id) {
        return userRepository.findById(id)
                .map(u -> UserDTO.builder()
                        .id(u.getId())
                        .username(u.getUsername())
                        .email(u.getEmail())
                        .role(u.getRole())
                        .build())
                .orElse(null);
    }

    @Override
    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream().map(u ->
                UserDTO.builder()
                        .id(u.getId())
                        .username(u.getUsername())
                        .email(u.getEmail())
                        .role(u.getRole())
                        .learningLevel(u.getLearningLevel())
                        .build()
        ).collect(Collectors.toList());
    }

    @Override
    public UserDTO getByUsernameDTO(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Utente non trovato"));

        return UserDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .learningLevel(user.getLearningLevel())
                .build();
    }

    @Override
    public void updateLearningLevel(String username) {

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Utente non trovato"));

        long completedLessons = userLessonProgressRepository
                .findByUserUsernameOrderByLessonOrderIndexAsc(username)
                .stream()
                .filter(progress -> progress.isCompleted())
                .count();

        long passedQuizzes = userQuizResultRepository
                .findByUserUsernameAndPassedTrue(username)
                .size();

        LearningLevel newLevel = LearningLevel.BEGINNER;

        if (completedLessons >= 5 && passedQuizzes >= 5) {
            newLevel = LearningLevel.ADVANCED;
        } else if (completedLessons >= 2 && passedQuizzes >= 2) {
            newLevel = LearningLevel.INTERMEDIATE;
        }

        user.setLearningLevel(newLevel);

        userRepository.save(user);
    }
}