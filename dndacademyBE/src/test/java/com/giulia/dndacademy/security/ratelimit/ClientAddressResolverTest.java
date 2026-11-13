package com.giulia.dndacademy.security.ratelimit;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.server.ResponseStatusException;
import static org.junit.jupiter.api.Assertions.*;

class ClientAddressResolverTest {
    @Test void renderUsesTheSingleCloudflareAddressAndIgnoresCallerControlledChains() {
        var resolver = new ClientAddressResolver("render");
        var request = new MockHttpServletRequest();
        request.setRemoteAddr("192.0.2.100");
        request.addHeader("CF-Connecting-IP", "203.0.113.9");
        request.addHeader("X-Forwarded-For", "198.51.100.99, 192.0.2.1");
        request.addHeader("X-Real-IP", "198.51.100.88");
        assertEquals("203.0.113.9", resolver.resolve(request));
        request.removeHeader("X-Forwarded-For");
        request.addHeader("X-Forwarded-For", "198.51.100.10");
        assertEquals("203.0.113.9", resolver.resolve(request));
    }

    @Test void renderFailsClosedOnAbsentDuplicateOrInvalidCloudflareAddress() {
        var resolver = new ClientAddressResolver("render");
        var missing = new MockHttpServletRequest();
        missing.addHeader("X-Forwarded-For", "203.0.113.9");
        assertThrows(ResponseStatusException.class, () -> resolver.resolve(missing));
        for (String value : new String[]{"example.com", "1.2.3.4,5.6.7.8", "999.1.1.1", "127.1", "::1%eth0", "", " 1.2.3.4"}) {
            var request = new MockHttpServletRequest(); request.addHeader("CF-Connecting-IP",value);
            assertThrows(ResponseStatusException.class, () -> resolver.resolve(request));
        }
        var repeated = new MockHttpServletRequest(); repeated.addHeader("CF-Connecting-IP","203.0.113.9"); repeated.addHeader("CF-Connecting-IP","203.0.113.10");
        assertThrows(ResponseStatusException.class, () -> resolver.resolve(repeated));
    }
    @Test void localIgnoresSpoofedForwardingHeaders() {
        var request = new MockHttpServletRequest();
        request.setRemoteAddr("192.0.2.1");
        request.addHeader("X-Real-IP", "203.0.113.4");
        request.addHeader("X-Forwarded-For", "203.0.113.5");
        assertEquals("192.0.2.1", new ClientAddressResolver("remote").resolve(request));
    }
    @Test void railwayUsesOnlySingleValidNumericRealIpAndNormalizesIpv6() {
        var resolver = new ClientAddressResolver("railway");
        var request = new MockHttpServletRequest();
        request.addHeader("X-Real-IP", "2001:db8::1");
        String first = resolver.resolve(request);
        request.removeHeader("X-Real-IP");
        request.addHeader("X-Real-IP", "2001:0db8:0000:0000:0000:0000:0000:ffff");
        assertEquals(first, resolver.resolve(request));
        request.addHeader("X-Real-IP", "192.0.2.2");
        assertThrows(ResponseStatusException.class, () -> resolver.resolve(request));
    }
    @Test void missingMalformedAddressesAndUnknownConfigurationAreRejected() {
        var resolver = new ClientAddressResolver("railway");
        assertThrows(ResponseStatusException.class, () -> resolver.resolve(new MockHttpServletRequest()));
        for (String value : new String[]{"example.com", "1.2.3.4,5.6.7.8", "999.1.1.1", "127.1", "010.0.0.1", "::1%eth0", "", " 1.2.3.4"}) {
            var request = new MockHttpServletRequest();
            request.addHeader("X-Real-IP", value);
            assertThrows(ResponseStatusException.class, () -> resolver.resolve(request), value);
        }
        assertThrows(IllegalArgumentException.class, () -> new ClientAddressResolver("unknown"));
    }
}
