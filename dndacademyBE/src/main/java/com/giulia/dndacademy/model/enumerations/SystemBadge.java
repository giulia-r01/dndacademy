package com.giulia.dndacademy.model.enumerations;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SystemBadge {
    FIRST_QUIZ("Primo Quiz", "Supera il tuo primo quiz."),
    STUDENT("Studente di D&D", "Completa almeno 2 lezioni e supera 2 quiz diversi."),
    EXPERT("Avventuriero Esperto", "Raggiungi il livello avanzato: completa 5 lezioni e supera 5 quiz diversi.");
    private final String title;
    private final String description;
}
