package com.giulia.dndacademy.exceptions;

import com.giulia.dndacademy.dto.ErrorResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(RuntimeException.class)
  public ResponseEntity<ErrorResponse> handleRuntime(RuntimeException ex) {
    return ResponseEntity.badRequest()
            .body(ErrorResponse.builder()
                    .message(ex.getMessage())
                    .build());
  }
}