package com.giulia.dndacademy.mail;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import static org.junit.jupiter.api.Assertions.*;

class MailSettingsTest {
    @Test void gmailModeRequiresOnlyOAuthConfigurationAndNoSmtpPassword() {
        var settings = new MailSettings(GmailApiTransportTest.gmailEnvironment());
        assertEquals("gmail-api", settings.provider());
        assertFalse(settings.toString().contains("PRIVATE_"));
    }
    @Test void productionCannotUseSmtpAndMissingSecretsFailWithOnlyPropertyName() {
        var environment = GmailApiTransportTest.gmailEnvironment();
        environment.setActiveProfiles("prod");
        assertDoesNotThrow(() -> new MailSettings(environment));
        environment.setProperty("app.mail.provider", "smtp");
        assertThrows(IllegalArgumentException.class, () -> new MailSettings(environment));
        environment.setProperty("app.mail.provider", "gmail-api");
        environment.setProperty("app.mail.gmail.refresh-token", "");
        var failure = assertThrows(IllegalArgumentException.class, () -> new MailSettings(environment));
        assertEquals("Configurazione email mancante: app.mail.gmail.refresh-token", failure.getMessage());
    }
    @Test void invalidProviderAndHeaderInjectionAreRejected() {
        for (String value : new String[]{"bad", "a@example.test\r\nBcc: hidden@example.test", "Name <a@example.test>"}) {
            var environment = GmailApiTransportTest.gmailEnvironment().withProperty("app.mail.from", value);
            assertThrows(IllegalArgumentException.class, () -> new MailSettings(environment));
        }
        assertThrows(IllegalArgumentException.class, () -> new MailSettings(new MockEnvironment().withProperty("app.mail.provider", "unknown")));
    }
}
