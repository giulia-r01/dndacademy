package com.giulia.dndacademy.mail;

import org.springframework.context.annotation.*;
import org.springframework.core.env.Environment;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.web.client.RestClient;
import java.net.http.HttpClient;
import java.time.Duration;

@Configuration
@org.springframework.scheduling.annotation.EnableScheduling
public class MailConfiguration {
    @Bean public MailSettings mailSettings(Environment environment) { return new MailSettings(environment); }

    @Bean public MailTransport mailTransport(MailSettings settings) {
        if (settings.provider().equals("gmail-api")) {
            var client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5))
                    .followRedirects(HttpClient.Redirect.NEVER).build();
            var requests = new JdkClientHttpRequestFactory(client);
            requests.setReadTimeout(Duration.ofSeconds(10));
            return new GmailApiTransport(RestClient.builder().requestFactory(requests).build(), settings);
        }
        var sender = new JavaMailSenderImpl();
        sender.setHost(settings.get("app.mail.smtp.host"));
        sender.setPort(settings.smtpPort());
        sender.setUsername(settings.get("app.mail.smtp.username"));
        sender.setPassword(settings.get("app.mail.smtp.password"));
        var props = sender.getJavaMailProperties();
        props.setProperty("mail.smtp.auth", "true");
        props.setProperty("mail.smtp.starttls.enable", "true");
        props.setProperty("mail.smtp.starttls.required", "true");
        props.setProperty("mail.smtp.connectiontimeout", "5000");
        props.setProperty("mail.smtp.timeout", "10000");
        props.setProperty("mail.smtp.writetimeout", "10000");
        return message -> {
            try { sender.send(message); }
            catch (org.springframework.mail.MailAuthenticationException ex) {
                throw new MailDeliveryException(MailDeliveryException.Reason.AUTHORIZATION);
            } catch (org.springframework.mail.MailException ex) {
                throw new MailDeliveryException(MailDeliveryException.Reason.TEMPORARY);
            }
        };
    }
}
