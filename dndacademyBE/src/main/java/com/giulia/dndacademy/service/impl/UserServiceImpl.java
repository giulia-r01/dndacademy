package com.giulia.dndacademy.service.impl;

import com.giulia.dndacademy.dto.UserDTO;
import com.giulia.dndacademy.model.User;
import com.giulia.dndacademy.model.enumerations.Role;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;
import com.giulia.dndacademy.model.enumerations.LearningLevel;
import com.giulia.dndacademy.repository.UserRepository;
import com.giulia.dndacademy.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.giulia.dndacademy.repository.UserLessonProgressRepository;
import com.giulia.dndacademy.repository.UserQuizResultRepository;


import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserLessonProgressRepository userLessonProgressRepository;
    private final UserQuizResultRepository userQuizResultRepository;

    @Override
    @Transactional
    public UserDTO updateRole(Long id, Role role, String actorUsername) {
        if (role == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Il ruolo e obbligatorio");
        }
        User actor = userRepository.findByUsername(actorUsername)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Accesso non consentito"));
        if (actor.getRole() != Role.MASTER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accesso riservato ai Master");
        }
        User target = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utente non trovato"));
        if (target.getId().equals(actor.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Non puoi modificare il tuo ruolo");
        }
        target.setRole(role);
        User saved = userRepository.save(target);
        return UserDTO.builder()
                .id(saved.getId())
                .username(saved.getUsername())
                .email(saved.getEmail())
                .role(saved.getRole())
                .learningLevel(saved.getLearningLevel())
                .build();
    }

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
                        .learningLevel(u.getLearningLevel())
                        .build())
                .orElse(null);
    }

    @Override
    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    @Override
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
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
                .countDistinctPassedQuizzesByUsername(username);

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