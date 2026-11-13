package com.giulia.dndacademy.mail;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.*;
import org.springframework.http.*;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.test.web.client.*;
import org.springframework.web.client.RestClient;
import java.io.ByteArrayInputStream;
import java.net.SocketTimeoutException;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class GmailApiTransportTest {
    static final String TOKEN = "https://oauth2.googleapis.com/token";
    static final String SEND = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";
    MockRestServiceServer server;
    GmailApiTransport transport;
    MutableClock clock;
    MailRenderer renderer;
    @BeforeEach void setup() {
        var builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
        var settings = new MailSettings(gmailEnvironment());
        clock = new MutableClock();
        transport = new GmailApiTransport(builder.build(), settings, clock);
        renderer = new MailRenderer(settings);
    }
    static MockEnvironment gmailEnvironment() {
        return new MockEnvironment().withProperty("app.mail.provider", "gmail-api")
                .withProperty("app.mail.from", "sender@gmail.com")
                .withProperty("app.mail.gmail.client-id", "test-client")
                .withProperty("app.mail.gmail.client-secret", "PRIVATE_CLIENT_SECRET")
                .withProperty("app.mail.gmail.refresh-token", "PRIVATE_REFRESH_TOKEN");
    }
    void token(String value) {
        server.expect(requestTo(TOKEN)).andExpect(method(HttpMethod.POST))
                .andExpect(content().contentType(MediaType.APPLICATION_FORM_URLENCODED))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("grant_type=refresh_token")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("client_secret=PRIVATE_CLIENT_SECRET")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("refresh_token=PRIVATE_REFRESH_TOKEN")))
                .andRespond(withSuccess("{\"access_token\":\"" + value + "\",\"expires_in\":3600,\"token_type\":\"Bearer\"}", MediaType.APPLICATION_JSON));
    }
    MimeMessage message() { return renderer.render(UUID.randomUUID().toString(), "player@example.test", "Nyx", null); }
    @Test void sendsBase64UrlMimeOverHttpsAndReusesAccessToken() throws Exception {
        token("access-one");
        server.expect(ExpectedCount.times(2), requestTo(SEND)).andExpect(method(HttpMethod.POST))
                .andExpect(header("Authorization", "Bearer access-one"))
                .andExpect(request -> {
                    var bytes = ((org.springframework.mock.http.client.MockClientHttpRequest) request).getBodyAsBytes();
                    String raw = new ObjectMapper().readTree(bytes).get("raw").asText();
                    assertFalse(raw.contains("="));
                    try {
                        var mime = new MimeMessage(Session.getInstance(new Properties()), new ByteArrayInputStream(Base64.getUrlDecoder().decode(raw)));
                        assertEquals("sender@gmail.com", ((jakarta.mail.internet.InternetAddress) mime.getFrom()[0]).getAddress());
                        assertEquals("player@example.test", mime.getAllRecipients()[0].toString());
                        assertEquals("Benvenuto in D&D Academy", mime.getSubject());
                        assertTrue(mime.isMimeType("multipart/*"));
                    } catch (jakarta.mail.MessagingException ex) { throw new AssertionError(ex); }
                    assertFalse(new String(bytes, StandardCharsets.UTF_8).contains("PRIVATE_"));
                }).andRespond(withSuccess("{\"id\":\"accepted\"}", MediaType.APPLICATION_JSON));
        transport.send(message()); transport.send(message()); server.verify();
    }
    @Test void refreshesOnceOnUnauthorizedAndDoesNotRetrySuccessfulSend() {
        token("old");
        server.expect(requestTo(SEND)).andExpect(header("Authorization", "Bearer old")).andRespond(withStatus(HttpStatus.UNAUTHORIZED));
        token("new");
        server.expect(requestTo(SEND)).andExpect(header("Authorization", "Bearer new")).andRespond(withSuccess());
        transport.send(message()); server.verify();
    }
    @Test void refreshesBeforeExpiry() {
        token("old");
        server.expect(requestTo(SEND)).andRespond(withSuccess());
        token("new");
        server.expect(requestTo(SEND)).andExpect(header("Authorization", "Bearer new")).andRespond(withSuccess());
        transport.send(message());
        clock.now = clock.now.plusSeconds(3541);
        transport.send(message()); server.verify();
    }
    @Test void revokedRefreshTokenIsPermanentAndNeverExposesResponseOrSecrets() {
        server.expect(requestTo(TOKEN)).andRespond(withStatus(HttpStatus.BAD_REQUEST)
                .contentType(MediaType.APPLICATION_JSON).body("{\"error\":\"invalid_grant\",\"detail\":\"PRIVATE_REFRESH_TOKEN\"}"));
        var failure = assertThrows(MailDeliveryException.class, () -> transport.send(message()));
        assertEquals(MailDeliveryException.Reason.AUTHORIZATION, failure.reason());
        assertFalse(failure.retryable()); assertNull(failure.getCause());
        assertFalse(failure.toString().contains("PRIVATE_")); server.verify();
    }
    @Test void quotaAndServerFailuresAreRetryableButSendIsNotRepeatedInsideTransport() {
        token("one");
        server.expect(requestTo(SEND)).andRespond(withStatus(HttpStatus.FORBIDDEN).contentType(MediaType.APPLICATION_JSON)
                .body("{\"error\":{\"errors\":[{\"reason\":\"dailyLimitExceeded\"}],\"message\":\"PRIVATE_DETAIL\"}}"));
        server.expect(requestTo(SEND)).andRespond(withStatus(HttpStatus.SERVICE_UNAVAILABLE).body("PRIVATE_DETAIL"));
        assertEquals(MailDeliveryException.Reason.QUOTA, assertThrows(MailDeliveryException.class, () -> transport.send(message())).reason());
        assertEquals(MailDeliveryException.Reason.TEMPORARY, assertThrows(MailDeliveryException.class, () -> transport.send(message())).reason());
        server.verify();
    }
    @Test void timeoutsAreSanitizedAndDeferredToOutbox() {
        token("one");
        server.expect(requestTo(SEND)).andRespond(withException(new SocketTimeoutException("PRIVATE_MESSAGE")));
        var failure = assertThrows(MailDeliveryException.class, () -> transport.send(message()));
        assertEquals(MailDeliveryException.Reason.TEMPORARY, failure.reason());
        assertFalse(failure.toString().contains("PRIVATE_")); assertNull(failure.getCause()); server.verify();
    }
    @Test void providerRetryAfterIsRespectedForSecondsAndHttpDates() {
        token("one");
        server.expect(requestTo(SEND)).andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS).header("Retry-After", "1200"));
        String date = ZonedDateTime.ofInstant(clock.instant().plusSeconds(600), ZoneOffset.UTC).format(java.time.format.DateTimeFormatter.RFC_1123_DATE_TIME);
        server.expect(requestTo(SEND)).andRespond(withStatus(HttpStatus.SERVICE_UNAVAILABLE).header("Retry-After", date));
        assertEquals(1200, assertThrows(MailDeliveryException.class, () -> transport.send(message())).retryAfterSeconds());
        assertEquals(600, assertThrows(MailDeliveryException.class, () -> transport.send(message())).retryAfterSeconds());
        server.verify();
    }
    @Test void malformedTokenResponseCannotBeUsedOrLeaked() {
        server.expect(requestTo(TOKEN)).andRespond(withSuccess("{\"access_token\":\"PRIVATE_BAD_TOKEN\",\"expires_in\":1,\"token_type\":\"Bearer\"}", MediaType.APPLICATION_JSON));
        var failure = assertThrows(MailDeliveryException.class, () -> transport.send(message()));
        assertEquals(MailDeliveryException.Reason.AUTHORIZATION, failure.reason());
        assertFalse(failure.toString().contains("PRIVATE_")); server.verify();
    }
    @Test void repeatedUnauthorizedCannotLoopForever() {
        token("one");
        server.expect(requestTo(SEND)).andRespond(withStatus(HttpStatus.UNAUTHORIZED));
        token("two");
        server.expect(requestTo(SEND)).andRespond(withStatus(HttpStatus.UNAUTHORIZED));
        assertEquals(MailDeliveryException.Reason.AUTHORIZATION, assertThrows(MailDeliveryException.class, () -> transport.send(message())).reason());
        server.verify();
    }
    static class MutableClock extends Clock {
        Instant now = Instant.parse("2026-11-13T10:00:00Z");
        public ZoneId getZone() { return ZoneOffset.UTC; }
        public Clock withZone(ZoneId zone) { return this; }
        public Instant instant() { return now; }
    }
}
