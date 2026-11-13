package com.giulia.dndacademy.mail;

import java.nio.charset.StandardCharsets;
import java.security.*;
import java.util.HexFormat;

public final class MailTokens {
    private MailTokens() {}
    public static String hash(String token) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8))); }
        catch (NoSuchAlgorithmException ex) { throw new IllegalStateException("Algoritmo SHA-256 non disponibile", ex); }
    }
}
