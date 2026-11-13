package com.giulia.dndacademy.mail;

import jakarta.mail.internet.InternetAddress;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;

public final class MailSettings {
    private final Environment environment;
    private final String provider;
    private final String from;

    public MailSettings(Environment environment) {
        this.environment = environment;
        provider = environment.getProperty("app.mail.provider", "smtp");
        if (!provider.equals("smtp") && !provider.equals("gmail-api")) throw new IllegalArgumentException("app.mail.provider deve essere smtp o gmail-api");
        if (environment.acceptsProfiles(Profiles.of("prod")) && !provider.equals("gmail-api")) {
            throw new IllegalArgumentException("In produzione è richiesto app.mail.provider=gmail-api");
        }
        from = required("app.mail.from");
        try {
            var parsed = new InternetAddress(from, true);
            parsed.validate();
            if (!from.equals(parsed.getAddress()) || from.contains("\r") || from.contains("\n")) throw new IllegalArgumentException();
        } catch (Exception ex) { throw new IllegalArgumentException("app.mail.from deve contenere un solo indirizzo email valido"); }
        if (provider.equals("gmail-api")) {
            required("app.mail.gmail.client-id");
            required("app.mail.gmail.client-secret");
            required("app.mail.gmail.refresh-token");
        } else {
            required("app.mail.smtp.host");
            required("app.mail.smtp.username");
            required("app.mail.smtp.password");
            int port = environment.getProperty("app.mail.smtp.port", Integer.class, 587);
            if (port < 1 || port > 65535) throw new IllegalArgumentException("app.mail.smtp.port deve essere compresa tra 1 e 65535");
        }
    }
    public String provider() { return provider; }
    public String from() { return from; }
    public String get(String property) { return required(property); }
    public int smtpPort() { return environment.getProperty("app.mail.smtp.port", Integer.class, 587); }
    private String required(String key) {
        String value = environment.getProperty(key);
        if (value == null || value.isBlank()) throw new IllegalArgumentException("Configurazione email mancante: " + key);
        return value;
    }
}
