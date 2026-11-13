package com.giulia.dndacademy.mail;

import com.giulia.dndacademy.dto.ForgotPasswordRequest;
import com.giulia.dndacademy.model.*;
import com.giulia.dndacademy.model.enumerations.*;
import com.giulia.dndacademy.repository.*;
import com.giulia.dndacademy.service.*;
import jakarta.mail.*;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.*;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import static com.giulia.dndacademy.model.EmailOutbox.Status.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {"spring.datasource.url=${MAIL_TEST_DATABASE_URL:jdbc:h2:mem:email_outbox_review;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1;LOCK_TIMEOUT=10000}",
        "spring.datasource.username=${MAIL_TEST_DATABASE_USER:sa}", "spring.datasource.password=${MAIL_TEST_DATABASE_PASSWORD:}", "spring.flyway.enabled=true",
        "spring.flyway.default-schema=public", "spring.jpa.hibernate.ddl-auto=validate"})
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class MailOutboxIntegrationTest {
    @Autowired EmailOutboxRepository outbox;
    @Autowired UserRepository users;
    @Autowired PasswordResetTokenRepository tokens;
    @Autowired UserService accounts;
    @Autowired EmailService emails;
    @Autowired PasswordResetService resets;
    @Autowired MailOutboxStore store;
    @Autowired PlatformTransactionManager manager;
    @Autowired MockMvc mvc;
    @MockitoBean MailTransport transport;
    GmailApiTransportTest.MutableClock clock;
    MailOutboxDispatcher dispatcher;
    @BeforeEach void setup() {
        outbox.deleteAll(); tokens.deleteAll(); users.deleteAll(); reset(transport);
        clock = new GmailApiTransportTest.MutableClock();
        clock.now = Instant.now().plusSeconds(1);
        dispatcher = new MailOutboxDispatcher(store, transport, clock);
    }
    User account() {
        return User.builder().username("learner").email("learner@example.test").password("test-hash")
                .role(Role.PLAYER).learningLevel(LearningLevel.BEGINNER).build();
    }
    User existing() { return users.saveAndFlush(account()); }
    void queueWelcome(User user) { new TransactionTemplate(manager).executeWithoutResult(status -> emails.queueWelcomeEmail(user)); }
    void requestReset() { resets.forgotPassword(new ForgotPasswordRequest("learner@example.test")); }
    @Test void registrationQueuesAtomicallyAndProviderRunsOnlyAfterCommitOutsideTransaction() {
        accounts.register(account());
        assertEquals(1, users.count()); assertEquals(1, outbox.count()); verifyNoInteractions(transport);
        doAnswer(invocation -> { assertFalse(TransactionSynchronizationManager.isActualTransactionActive()); return null; }).when(transport).send(any());
        assertTrue(dispatcher.runOne());
        assertEquals(SENT, outbox.findAll().get(0).getStatus());
        assertFalse(dispatcher.runOne()); verify(transport, times(1)).send(any());
    }
    @Test void rollbackCannotLeaveAnEmailForAnAccountThatWasNeverCreated() {
        new TransactionTemplate(manager).executeWithoutResult(status -> { accounts.register(account()); status.setRollbackOnly(); });
        assertEquals(0, users.count()); assertEquals(0, outbox.count());
        assertFalse(dispatcher.runOne()); verifyNoInteractions(transport);
    }
    @Test void temporaryFailureSurvivesDispatcherRecreationAndUsesSameMessageId() throws Exception {
        queueWelcome(existing());
        doThrow(new MailDeliveryException(MailDeliveryException.Reason.TEMPORARY)).doNothing().when(transport).send(any());
        assertTrue(dispatcher.runOne());
        var pending = outbox.findAll().get(0);
        assertEquals(PENDING, pending.getStatus()); assertEquals(1, pending.getAttempts());
        assertFalse(dispatcher.runOne());
        clock.now = pending.getNextAttemptAt().plusSeconds(1);
        assertTrue(new MailOutboxDispatcher(store, transport, clock).runOne());
        assertEquals(SENT, outbox.findAll().get(0).getStatus());
        var capture = org.mockito.ArgumentCaptor.forClass(MimeMessage.class);
        verify(transport, times(2)).send(capture.capture());
        assertEquals(capture.getAllValues().get(0).getMessageID(), capture.getAllValues().get(1).getMessageID());
    }
    @Test void replacedResetRequestsCancelOldMailAndOnlyCurrentTokenIsRendered() throws Exception {
        var user = existing();
        requestReset(); String oldToken = tokens.findByUserId(user.getId()).orElseThrow().getToken();
        requestReset(); String latest = tokens.findByUserId(user.getId()).orElseThrow().getToken();
        assertNotEquals(oldToken, latest);
        assertEquals(2, outbox.count());
        assertTrue(outbox.findAll().stream().allMatch(task -> task.getResetTokenHash().matches("[0-9a-f]{64}")));
        while (dispatcher.runOne()) {  }
        assertEquals(1, outbox.findAll().stream().filter(task -> task.getStatus() == CANCELLED).count());
        assertEquals(1, outbox.findAll().stream().filter(task -> task.getStatus() == SENT).count());
        var capture = org.mockito.ArgumentCaptor.forClass(MimeMessage.class);
        verify(transport).send(capture.capture());
        assertTrue(text(capture.getValue()).contains(latest)); assertFalse(text(capture.getValue()).contains(oldToken));
    }
    @Test void expiredUsedAndDeletedResetTokensAreNotSent() {
        var user = existing();
        requestReset();
        var token = tokens.findByUserId(user.getId()).orElseThrow(); token.setUsed(true); tokens.saveAndFlush(token);
        dispatcher.runOne();
        requestReset(); tokens.deleteAll(); dispatcher.runOne();
        requestReset(); clock.now = clock.now.plus(Duration.ofMinutes(31)); dispatcher.runOne();
        assertTrue(outbox.findAll().stream().allMatch(task -> task.getStatus() == CANCELLED));
        verifyNoInteractions(transport);
    }
    @Test void changedRecipientCancelsQueuedMail() {
        var user = existing(); requestReset();
        user.setEmail("changed@example.test"); users.saveAndFlush(user);
        dispatcher.runOne();
        assertEquals(CANCELLED, outbox.findAll().get(0).getStatus()); verifyNoInteractions(transport);
    }
    @Test void authorizationFailureIsRecordedWithoutSendingAgainAndTemporaryRetriesAreBounded() {
        queueWelcome(existing());
        doThrow(new MailDeliveryException(MailDeliveryException.Reason.AUTHORIZATION)).when(transport).send(any());
        dispatcher.runOne();
        assertEquals(FAILED, outbox.findAll().get(0).getStatus()); assertFalse(dispatcher.runOne());
        assertEquals("AUTHORIZATION", outbox.findAll().get(0).getLastFailure());
        outbox.deleteAll(); reset(transport);
        queueWelcome(users.findAll().get(0));
        doThrow(new MailDeliveryException(MailDeliveryException.Reason.TEMPORARY)).when(transport).send(any());
        for (int i = 0; i < 8; i++) {
            assertTrue(dispatcher.runOne());
            clock.now = outbox.findAll().get(0).getNextAttemptAt().plusSeconds(1);
        }
        assertEquals(FAILED, outbox.findAll().get(0).getStatus()); assertFalse(dispatcher.runOne());
        verify(transport, times(8)).send(any());
    }
    @Test void abandonedLeaseIsRecoveredAndLateCompletionCannotOverwriteNewResult() {
        queueWelcome(existing());
        var abandoned = store.claim(clock.instant());
        assertNotNull(abandoned); assertFalse(dispatcher.runOne());
        clock.now = clock.now.plusSeconds(121);
        dispatcher.runOne();
        store.finish(abandoned, FAILED, MailDeliveryException.Reason.AUTHORIZATION, clock.instant(), clock.instant());
        assertEquals(SENT, outbox.findAll().get(0).getStatus());
        assertEquals(2, outbox.findAll().get(0).getAttempts());
    }
    @Test void simultaneousWorkersCannotClaimSameLiveLease() throws Exception {
        queueWelcome(existing());
        var pool = Executors.newFixedThreadPool(8);
        var start = new CountDownLatch(1);
        List<Future<MailOutboxStore.Claim>> futures = new ArrayList<>();
        try {
            for (int i = 0; i < 16; i++) futures.add(pool.submit(() -> { start.await(); return store.claim(clock.instant()); }));
            start.countDown(); int claimed = 0;
            for (var future : futures) if (future.get(20, TimeUnit.SECONDS) != null) claimed++;
            assertEquals(1, claimed); assertEquals(1, outbox.findAll().get(0).getAttempts());
        } finally { pool.shutdownNow(); }
    }
    @Test void forgotPasswordHttpResponseIsUniformAndDoesNotCallProvider() throws Exception {
        existing();
        for (String email : new String[]{"learner@example.test", "unknown@example.test"}) {
            mvc.perform(post("/auth/forgot-password").contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"" + email + "\"}"))
                    .andExpect(status().isOk()).andExpect(content().string(""));
        }
        assertEquals(1, outbox.count()); verifyNoInteractions(transport);
    }
    @Test void cleanupRetainsRecentTasksAndDeletesOldExpiredData() {
        queueWelcome(existing());
        assertEquals(0, outbox.deleteExpired(clock.instant().minus(Duration.ofDays(7))));
        assertEquals(1, outbox.deleteExpired(clock.instant().plus(Duration.ofDays(2))));
    }
    static String text(Part part) throws Exception {
        if (part.isMimeType("text/*")) return part.getContent().toString();
        if (part.getContent() instanceof Multipart multipart) {
            StringBuilder result = new StringBuilder();
            for (int index = 0; index < multipart.getCount(); index++) result.append(text(multipart.getBodyPart(index)));
            return result.toString();
        }
        return "";
    }
}
