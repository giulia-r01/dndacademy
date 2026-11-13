package com.giulia.dndacademy.mail;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.mail.internet.MimeMessage;
import org.springframework.http.MediaType;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;
import java.io.ByteArrayOutputStream;
import java.time.*;
import java.util.*;

public final class GmailApiTransport implements MailTransport {
    private final RestClient http;
    private final MailSettings settings;
    private final Clock clock;
    private final ObjectMapper json = new ObjectMapper();
    private String token;
    private Instant expires = Instant.EPOCH;

    public GmailApiTransport(RestClient http, MailSettings settings) { this(http, settings, Clock.systemUTC()); }
    GmailApiTransport(RestClient http, MailSettings settings, Clock clock) {
        this.http = http; this.settings = settings; this.clock = clock;
    }

    @Override public void send(MimeMessage message) {
        String raw;
        try {
            var bytes = new ByteArrayOutputStream();
            message.writeTo(bytes);
            raw = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes.toByteArray());
        } catch (Exception ex) { throw new MailDeliveryException(MailDeliveryException.Reason.INVALID_MESSAGE); }
        for (int attempt = 0; attempt < 2; attempt++) {
            String usedToken = accessToken();
            try {
                http.post().uri("https://gmail.googleapis.com/gmail/v1/users/me/messages/send")
                        .headers(headers -> headers.setBearerAuth(usedToken))
                        .contentType(MediaType.APPLICATION_JSON).body(new SendPayload(raw))
                        .retrieve().onStatus(status -> !status.is2xxSuccessful(), (request, response) -> {
                            int status = response.getStatusCode().value();
                            if (status == 401) throw new ExpiredAccessToken();
                            if (status == 429) throw failure(MailDeliveryException.Reason.QUOTA, response.getHeaders());
                            if (status >= 500) throw failure(MailDeliveryException.Reason.TEMPORARY, response.getHeaders());
                            if (status == 403) {
                                boolean quota = false;
                                try {
                                    var error = json.readTree(response.getBody().readNBytes(8192));
                                    for (var detail : error.path("error").path("errors")) {
                                        if (Set.of("rateLimitExceeded", "userRateLimitExceeded", "dailyLimitExceeded")
                                                .contains(detail.path("reason").asText())) quota = true;
                                    }
                                } catch (Exception ignored) { quota = false; }
                                throw failure(quota ? MailDeliveryException.Reason.QUOTA : MailDeliveryException.Reason.AUTHORIZATION, response.getHeaders());
                            }
                            throw new MailDeliveryException(MailDeliveryException.Reason.INVALID_MESSAGE);
                        }).toBodilessEntity();
                return;
            } catch (ExpiredAccessToken ex) {
                invalidate(usedToken);
                if (attempt == 1) throw new MailDeliveryException(MailDeliveryException.Reason.AUTHORIZATION);
            } catch (MailDeliveryException ex) { throw ex; }
            catch (RuntimeException ex) { throw new MailDeliveryException(MailDeliveryException.Reason.TEMPORARY); }
        }
    }

    private synchronized void invalidate(String used) {
        if (Objects.equals(token, used)) { token = null; expires = Instant.EPOCH; }
    }

    private synchronized String accessToken() {
        if (token != null && clock.instant().isBefore(expires.minusSeconds(60))) return token;
        var form = new SecretForm();
        form.add("grant_type", "refresh_token");
        form.add("client_id", settings.get("app.mail.gmail.client-id"));
        form.add("client_secret", settings.get("app.mail.gmail.client-secret"));
        form.add("refresh_token", settings.get("app.mail.gmail.refresh-token"));
        try {
            TokenResponse response = http.post().uri("https://oauth2.googleapis.com/token")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED).body(form).retrieve()
                    .onStatus(status -> !status.is2xxSuccessful(), (request, result) -> {
                        int status = result.getStatusCode().value();
                        throw failure(status == 429 ? MailDeliveryException.Reason.QUOTA
                                : status >= 500 ? MailDeliveryException.Reason.TEMPORARY : MailDeliveryException.Reason.AUTHORIZATION, result.getHeaders());
                    }).body(TokenResponse.class);
            if (response == null || response.accessToken() == null || response.accessToken().isBlank()
                    || response.expiresIn() <= 60 || !"Bearer".equalsIgnoreCase(response.tokenType())) {
                throw new MailDeliveryException(MailDeliveryException.Reason.AUTHORIZATION);
            }
            token = response.accessToken();
            expires = clock.instant().plusSeconds(Math.min(response.expiresIn(), 86400));
            return token;
        } catch (MailDeliveryException ex) { throw ex; }
        catch (RuntimeException ex) { throw new MailDeliveryException(MailDeliveryException.Reason.TEMPORARY); }
    }

    private MailDeliveryException failure(MailDeliveryException.Reason reason, org.springframework.http.HttpHeaders headers) {
        String value = headers.getFirst("Retry-After");
        long delay = 0;
        if (value != null) {
            try { delay = Long.parseLong(value); }
            catch (NumberFormatException ex) {
                try { delay = Duration.between(clock.instant(), ZonedDateTime.parse(value, java.time.format.DateTimeFormatter.RFC_1123_DATE_TIME).toInstant()).getSeconds(); }
                catch (java.time.format.DateTimeParseException ignored) { delay = 0; }
            }
        }
        return new MailDeliveryException(reason, delay);
    }

    private record SendPayload(String raw) {
        @Override public String toString() { return "[Contenuto email oscurato]"; }
    }
    private static class SecretForm extends LinkedMultiValueMap<String, String> {
        @Override public String toString() { return "[Parametri OAuth oscurati]"; }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record TokenResponse(@JsonProperty("access_token") String accessToken,
            @JsonProperty("expires_in") long expiresIn, @JsonProperty("token_type") String tokenType) {
        @Override public String toString() { return "[Risposta OAuth oscurata]"; }
    }
    private static class ExpiredAccessToken extends RuntimeException {}
}
