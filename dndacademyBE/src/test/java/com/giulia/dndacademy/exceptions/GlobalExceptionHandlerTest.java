package com.giulia.dndacademy.exceptions;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import static org.junit.jupiter.api.Assertions.*;

class GlobalExceptionHandlerTest {
    @Test void preservesConflictStatusAndProvidesFallbackMessage() {
        GlobalExceptionHandler handler = new GlobalExceptionHandler();
        var response = handler.handleStatus(new ResponseStatusException(HttpStatus.CONFLICT, "Turno già cambiato"));
        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertEquals("Turno già cambiato", response.getBody().getMessage());
        assertNotNull(handler.handleRuntime(new UnsupportedOperationException()).getBody().getMessage());
    }
}
