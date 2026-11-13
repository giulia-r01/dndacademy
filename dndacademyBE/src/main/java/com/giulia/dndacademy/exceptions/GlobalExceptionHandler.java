package com.giulia.dndacademy.exceptions;

import com.giulia.dndacademy.dto.ErrorResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.*;
import org.springframework.http.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErrorResponse> handleStatus(ResponseStatusException ex) {
        HttpStatusCode status = ex.getStatusCode();
        String message = ex.getReason();
        if (status.is5xxServerError()) {
            log.error("Errore del servizio durante una richiesta API", ex);
            message = ApiErrorMessages.forStatus(status);
        } else if (message == null || message.isBlank()) {
            message = ApiErrorMessages.forStatus(status);
        }
        return ResponseEntity.status(status).headers(ex.getHeaders()).contentType(MediaType.APPLICATION_JSON).body(body(message));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex) {
        return response(HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuthentication(AuthenticationException ex) {
        return response(HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleIntegrity(DataIntegrityViolationException ex) {
        log.warn("Conflitto di integrità durante una richiesta API", ex);
        return response(HttpStatus.CONFLICT);
    }

    @ExceptionHandler({OptimisticLockingFailureException.class, PessimisticLockingFailureException.class})
    public ResponseEntity<ErrorResponse> handleConcurrentUpdate(DataAccessException ex) {
        log.warn("Aggiornamento concorrente durante una richiesta API", ex);
        return response(HttpStatus.CONFLICT);
    }

    @ExceptionHandler({DataAccessResourceFailureException.class, TransientDataAccessResourceException.class, QueryTimeoutException.class})
    public ResponseEntity<ErrorResponse> handleUnavailableData(DataAccessException ex) {
        log.error("Database non disponibile durante una richiesta API", ex);
        return response(HttpStatus.SERVICE_UNAVAILABLE);
    }

    @ExceptionHandler(MultipartException.class)
    public ResponseEntity<ErrorResponse> handleMultipart(MultipartException ex) {
        return response(HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(Exception ex) {
        log.error("Errore inatteso durante una richiesta API", ex);
        return response(HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
            HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getDefaultMessage()).filter(value -> value != null && !value.isBlank())
                .findFirst().orElse(ApiErrorMessages.forStatus(status));
        return handleExceptionInternal(ex, body(message), headers, status, request);
    }

    @Override
    protected ResponseEntity<Object> handleExceptionInternal(Exception ex, Object body,
            HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        Object safeBody = body instanceof ErrorResponse && !status.is5xxServerError()
                ? body : body(ApiErrorMessages.forStatus(status));
        if (status.is5xxServerError()) log.error("Errore interno di gestione della risposta HTTP", ex);
        return super.handleExceptionInternal(ex, safeBody, headers, status, request);
    }

    @Override
    protected ResponseEntity<Object> createResponseEntity(Object body, HttpHeaders headers,
            HttpStatusCode status, WebRequest request) {
        HttpHeaders responseHeaders = new HttpHeaders();
        responseHeaders.putAll(headers);
        responseHeaders.setContentType(MediaType.APPLICATION_JSON);
        return new ResponseEntity<>(body, responseHeaders, status);
    }

    private ResponseEntity<ErrorResponse> response(HttpStatus status) {
        return ResponseEntity.status(status).contentType(MediaType.APPLICATION_JSON).body(body(ApiErrorMessages.forStatus(status)));
    }

    private static ErrorResponse body(String message) {
        return ErrorResponse.builder().message(message).build();
    }
}
