package com.giulia.dndacademy.exceptions;

import com.giulia.dndacademy.dto.ErrorResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.MethodArgumentNotValidException;

@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(RuntimeException.class)
  public ResponseEntity<ErrorResponse> handleRuntime(RuntimeException ex) {
    return ResponseEntity.badRequest()
            .body(ErrorResponse.builder()
                    .message(ex.getMessage())
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