package com.giulia.dndacademy.exceptions;

import com.giulia.dndacademy.dto.ErrorResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.MethodArgumentNotValidException;

@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(org.springframework.web.server.ResponseStatusException.class)
  public ResponseEntity<ErrorResponse> handleStatus(org.springframework.web.server.ResponseStatusException ex) {
    return ResponseEntity.status(ex.getStatusCode())
            .body(ErrorResponse.builder()
                    .message(ex.getReason() == null ? "Richiesta non valida" : ex.getReason())
                    .build());
  }

  @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
  public ResponseEntity<ErrorResponse> handleAccessDenied(org.springframework.security.access.AccessDeniedException ex) {
    return ResponseEntity.status(403).body(ErrorResponse.builder().message("Accesso non consentito").build());
  }

  @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
  public ResponseEntity<ErrorResponse> handleIntegrity(org.springframework.dao.DataIntegrityViolationException ex) {
    return ResponseEntity.status(409).body(ErrorResponse.builder()
            .message("Operazione in conflitto con dati gia presenti o utilizzati").build());
  }

  @ExceptionHandler(RuntimeException.class)
  public ResponseEntity<ErrorResponse> handleRuntime(RuntimeException ex) {
    return ResponseEntity.badRequest()
            .body(ErrorResponse.builder()
                    .message(ex.getMessage() == null || ex.getMessage().isBlank()
                            ? "Impossibile completare l'operazione" : ex.getMessage())
                    .build());
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
    String message = ex.getBindingResult()
            .getFieldErrors()
            .stream()
            .findFirst()
            .map(error -> error.getDefaultMessage())
            .orElse("Dati non validi");

    return ResponseEntity.badRequest()
            .body(ErrorResponse.builder()
                    .message(message)
                    .build());
  }
}
