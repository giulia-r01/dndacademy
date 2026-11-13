package com.giulia.dndacademy.mail;

public final class MailDeliveryException extends RuntimeException {
    public enum Reason {
        TEMPORARY("Servizio email temporaneamente non disponibile."),
        QUOTA("Limite di invio delle email raggiunto."),
        AUTHORIZATION("Autorizzazione del servizio email non valida."),
        INVALID_MESSAGE("Impossibile preparare il messaggio email.");

        private final String message;
        Reason(String message) { this.message = message; }
        public String message() { return message; }
    }
    private final Reason reason;
    private final long retryAfterSeconds;
    public MailDeliveryException(Reason reason) { this(reason, 0); }
    public MailDeliveryException(Reason reason, long retryAfterSeconds) {
        super(reason.message()); this.reason = reason; this.retryAfterSeconds = Math.max(0, Math.min(retryAfterSeconds, 86400));
    }
    public Reason reason() { return reason; }
    public long retryAfterSeconds() { return retryAfterSeconds; }
    public boolean retryable() { return reason == Reason.TEMPORARY || reason == Reason.QUOTA; }
}
