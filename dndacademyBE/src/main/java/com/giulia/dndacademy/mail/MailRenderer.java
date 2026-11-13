package com.giulia.dndacademy.mail;

import jakarta.mail.Session;
import jakarta.mail.internet.*;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;
import org.springframework.web.util.HtmlUtils;
import java.util.Properties;

@Component @RequiredArgsConstructor
public class MailRenderer {
    private final MailSettings settings;

    public MimeMessage render(String id, String recipient, String username, String resetLink) {
        String title = resetLink == null ? "Benvenuto in D&D Academy 🐉" : "Recupero password";
        String paragraphs = resetLink == null
                ? "<p>Il tuo account è stato creato con successo.</p><p>Da ora puoi iniziare il tuo percorso per imparare Dungeons &amp; Dragons passo dopo passo: lezioni, quiz, personaggi, campagne tutorial e combattimenti guidati.</p><p>Parti dalle basi, completa i quiz e sblocca nuove lezioni mentre aumenti il tuo livello da avventuriero.</p><p>Buona avventura,<br>Il team di D&amp;D Academy</p>"
                : "<p>Hai richiesto di reimpostare la password del tuo account D&amp;D Academy.</p><p>Clicca sul pulsante qui sotto per scegliere una nuova password.</p><p style=\"text-align:center;margin:32px 0\"><a style=\"background:#10b981;color:#031b1b;padding:14px 24px;border-radius:24px;text-decoration:none;font-weight:bold\" href=\""
                + HtmlUtils.htmlEscape(resetLink) + "\">Reimposta password</a></p><p>Il link scadrà tra 30 minuti dalla richiesta.</p><p>Se non hai richiesto tu questa operazione, puoi ignorare questa email.</p>";
        String html = "<!DOCTYPE html><html lang=\"it\"><body style=\"margin:0;padding:32px 12px;font-family:Arial,sans-serif;background:#031b1b;color:#ecfdf5\">"
                + "<table role=\"presentation\" style=\"width:100%;max-width:560px;margin:auto;background:#102434;border:1px solid #14532d;border-radius:16px\"><tr><td style=\"padding:32px;font-size:16px;line-height:1.6\">"
                + "<h1 style=\"color:#fbbf24;font-size:26px\">" + title + "</h1><p>Ciao " + HtmlUtils.htmlEscape(username) + ",</p>"
                + paragraphs + "<hr style=\"border:0;border-top:1px solid #14532d\"><p style=\"font-size:13px;color:#94a3b8\">D&amp;D Academy</p></td></tr></table></body></html>";
        String plain = "Ciao " + username + ",\n\n" + (resetLink == null
                ? "Il tuo account D&D Academy è stato creato con successo. Buona avventura!"
                : "Per reimpostare la password: " + resetLink + "\nIl link scade 30 minuti dopo la richiesta. Se non hai richiesto il recupero, ignora questa email.");
        try {
            var message = new MimeMessage(Session.getInstance(new Properties()));
            var helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(new InternetAddress(settings.from(), "D&D Academy", "UTF-8"));
            helper.setTo(new InternetAddress(recipient, true));
            helper.setSubject(resetLink == null ? "Benvenuto in D&D Academy" : "Recupero password - DnD Academy");
            helper.setText(plain, html);
            message.saveChanges();
            message.setHeader("Message-ID", "<" + id + "@" + settings.from().substring(settings.from().lastIndexOf('@') + 1) + ">");
            return message;
        } catch (Exception ex) { throw new MailDeliveryException(MailDeliveryException.Reason.INVALID_MESSAGE); }
    }
}
