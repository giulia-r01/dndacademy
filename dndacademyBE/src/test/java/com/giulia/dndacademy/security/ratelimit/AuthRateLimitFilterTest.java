package com.giulia.dndacademy.security.ratelimit;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.mock.web.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AuthRateLimitFilterTest {
    @Test void unavailableCountersFailClosedWithSafe503() throws Exception {
        var limiter = mock(AuthRateLimiter.class);
        doThrow(new DataAccessResourceFailureException("PRIVATE_DB_PASSWORD")).when(limiter).checkAddress("login", "127.0.0.1");
        var filter = new AuthRateLimitFilter(limiter, new ClientAddressResolver("remote"), new ObjectMapper());
        var request = new MockHttpServletRequest("POST", "/auth/login");
        request.setServletPath("/auth/login");
        var response = new MockHttpServletResponse();
        var chain = new MockFilterChain();
        filter.doFilter(request, response, chain);
        assertEquals(503, response.getStatus());
        assertFalse(response.getContentAsString().contains("PRIVATE_"));
        assertNull(chain.getRequest());
    }
    @Test void railwayRequestsWithoutRealIpCannotReachAuthenticationOrConsumeBuckets() throws Exception {
        var limiter = mock(AuthRateLimiter.class);
        var filter = new AuthRateLimitFilter(limiter, new ClientAddressResolver("railway"), new ObjectMapper());
        var request = new MockHttpServletRequest("POST", "/auth/login");
        request.setServletPath("/auth/login");
        request.addHeader("X-Forwarded-For", "192.0.2.1");
        var response = new MockHttpServletResponse();
        var chain = new MockFilterChain();
        filter.doFilter(request, response, chain);
        assertEquals(400, response.getStatus());
        assertNull(chain.getRequest());
        verifyNoInteractions(limiter);
    }
}
