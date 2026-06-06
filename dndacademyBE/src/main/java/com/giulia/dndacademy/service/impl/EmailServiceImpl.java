package com.giulia.dndacademy.service.impl;

import com.giulia.dndacademy.service.EmailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Override
    public void sendPasswordResetEmail(String to, String username, String resetLink) {

        try {
            MimeMessage message = mailSender.createMimeMessage();

            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(to);
            helper.setSubject("Recupero password - DnD Academy");

            String html = """
                    <!DOCTYPE html>
                    <html lang="it">
                    <body style="margin:0;padding:0;font-family:Arial,sans-serif;color:#f8fafc;">
                        <table width="100%%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
                            <tr>
                                <td align="center">
                                    <table width="100%%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#102434;border:1px solid #14532d;border-radius:16px;padding:32px;">
                                        <tr>
                                            <td>
                                                <h1 style="margin:0 0 16px;color:#fbbf24;font-size:26px;">
                                                    Recupero password
                                                </h1>

                                                <p style="font-size:16px;line-height:1.6;color:#ecfdf5;">
                                                    Ciao %s,
                                                </p>

                                                <p style="font-size:16px;line-height:1.6;color:#d1fae5;">
                                                    Hai richiesto di reimpostare la password del tuo account D&D Academy.
                                                </p>

                                                <p style="font-size:16px;line-height:1.6;color:#d1fae5;">
                                                    Clicca sul pulsante qui sotto per scegliere una nuova password.
                                                </p>

                                                <p style="text-align:center;margin:32px 0;">
                                                    <a href="%s"
                                                       style="display:inline-block;background-color:#10b981;color:#031b1b;text-decoration:none;
                                                              padding:14px 24px;border-radius:999px;font-weight:bold;font-size:16px;">
                                                        Reimposta password
                                                    </a>
                                                </p>

                                                <p style="font-size:14px;line-height:1.6;color:#a7f3d0;">
                                                    Il link scadrà tra 30 minuti.
                                                </p>

                                                <p style="font-size:14px;line-height:1.6;color:#94a3b8;">
                                                    Se non hai richiesto tu questa operazione, puoi ignorare questa email.
                                                </p>

                                                <hr style="border:none;border-top:1px solid #14532d;margin:24px 0;" />

                                                <p style="font-size:13px;color:#64748b;">
                                                    D&D Academy
                                                </p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </body>
                    </html>
                    """.formatted(username, resetLink);

            helper.setText(html, true);

            mailSender.send(message);

        } catch (MessagingException | MailException e) {
            throw new RuntimeException("Errore durante l'invio dell'email di recupero password");
        }
    }

    @Override
    public void sendWelcomeEmail(String to, String username) {

        try {
            MimeMessage message = mailSender.createMimeMessage();

            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(to);
            helper.setSubject("Benvenuto in D&D Academy");

            String html = """
                <!DOCTYPE html>
                <html lang="it">
                <body style="margin:0;padding:0;font-family:Arial,sans-serif;color:#f8fafc;">
                    <table width="100%%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
                        <tr>
                            <td align="center">
                                <table width="100%%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#102434;border:1px solid #14532d;border-radius:16px;padding:32px;">
                                    <tr>
                                        <td>
                                            <h1 style="margin:0 0 16px;color:#fbbf24;font-size:26px;">
                                                Benvenuto in D&D Academy 🐉
                                            </h1>

                                            <p style="font-size:16px;line-height:1.6;color:#ecfdf5;">
                                                Ciao %s,
                                            </p>

                                            <p style="font-size:16px;line-height:1.6;color:#d1fae5;">
                                                Il tuo account è stato creato con successo.
                                            </p>

                                            <p style="font-size:16px;line-height:1.6;color:#d1fae5;">
                                                Da ora puoi iniziare il tuo percorso per imparare Dungeons & Dragons passo dopo passo:
                                                lezioni, quiz, personaggi, campagne tutorial e combattimenti guidati.
                                            </p>

                                            <p style="font-size:16px;line-height:1.6;color:#fde68a;">
                                                Parti dalle basi, completa i quiz e sblocca nuove lezioni mentre aumenti il tuo livello da avventuriero.
                                            </p>

                                            <hr style="border:none;border-top:1px solid #14532d;margin:24px 0;" />

                                            <p style="font-size:13px;color:#94a3b8;">
                                                Buona avventura,<br />
                                                Il team di D&D Academy
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
                """.formatted(username);

            helper.setText(html, true);

            mailSender.send(message);

        } catch (MessagingException | MailException e) {
            throw new RuntimeException("Errore durante l'invio dell'email di benvenuto");
        }
    }
}