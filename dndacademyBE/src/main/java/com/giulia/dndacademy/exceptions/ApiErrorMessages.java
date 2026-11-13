package com.giulia.dndacademy.exceptions;

import org.springframework.http.HttpStatusCode;

public final class ApiErrorMessages {
    private ApiErrorMessages() {}

    public static String forStatus(HttpStatusCode status) {
        return switch (status.value()) {
            case 400 -> "Richiesta non valida. Controlla i dati inseriti.";
            case 401 -> "Accedi per continuare.";
            case 403 -> "Accesso non consentito.";
            case 404 -> "Risorsa non trovata.";
            case 405 -> "Metodo non consentito.";
            case 406 -> "Formato di risposta non supportato.";
            case 409 -> "Operazione in conflitto con dati già presenti o utilizzati.";
            case 413 -> "L'immagine non può superare 5 MB.";
            case 415 -> "Formato della richiesta non supportato.";
            case 429 -> "Troppe richieste. Riprova più tardi.";
            case 502, 503, 504 -> "Servizio temporaneamente non disponibile. Riprova più tardi.";
            default -> status.is5xxServerError()
                    ? "Si è verificato un errore interno. Riprova più tardi."
                    : "Richiesta non valida.";
        };
    }
}
