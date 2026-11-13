package com.giulia.dndacademy.exceptions;

import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import com.giulia.dndacademy.dto.ErrorResponse;

import java.sql.SQLException;

import static org.junit.jupiter.api.Assertions.*;

class GlobalExceptionHandlerTest {
    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void preservesExpectedConflictStatusAndMessage() {
        var response = handler.handleStatus(ApiException.conflict("Turno già cambiato"));
        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertEquals("Turno già cambiato", response.getBody().getMessage());
    }

    @Test
    void missingExpectedMessageGetsASafeFallback() {
        var response = handler.handleStatus(new ResponseStatusException(HttpStatus.NOT_FOUND));
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertEquals(ApiErrorMessages.forStatus(HttpStatus.NOT_FOUND), response.getBody().getMessage());
    }

    @Test
    void unexpectedRuntimeAndCheckedFailuresNeverExposeTheirMessages() {
        for (Exception failure : new Exception[] {new IllegalStateException("PRIVATE_SQL"), new SQLException("PRIVATE_JDBC")}) {
            var response = handler.handleUnexpected(failure);
            assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
            assertEquals(ApiErrorMessages.forStatus(HttpStatus.INTERNAL_SERVER_ERROR), response.getBody().getMessage());
        }
    }

    @Test
    void evenExplicitServerStatusReasonsAreNotReturned() {
        var response = handler.handleStatus(new ResponseStatusException(HttpStatus.BAD_GATEWAY, "PRIVATE_PROVIDER_SECRET"));
        assertEquals(HttpStatus.BAD_GATEWAY, response.getStatusCode());
        assertEquals(ApiErrorMessages.forStatus(HttpStatus.BAD_GATEWAY), response.getBody().getMessage());
    }

    @Test
    void databaseConflictsDoNotExposeConstraintNames() {
        var response = handler.handleIntegrity(new DataIntegrityViolationException("PRIVATE_TABLE_CONSTRAINT"));
        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertEquals(ApiErrorMessages.forStatus(HttpStatus.CONFLICT), response.getBody().getMessage());
    }

    @Test
    void multipartLimitKeeps413AndTheHumanMessage() throws Exception {
        var response = handler.handleException(new MaxUploadSizeExceededException(5 * 1024 * 1024),
                new ServletWebRequest(new MockHttpServletRequest(), new MockHttpServletResponse()));
        assertEquals(HttpStatus.PAYLOAD_TOO_LARGE, response.getStatusCode());
        assertEquals(ApiErrorMessages.forStatus(HttpStatus.PAYLOAD_TOO_LARGE), ((ErrorResponse) response.getBody()).getMessage());
    }
}
