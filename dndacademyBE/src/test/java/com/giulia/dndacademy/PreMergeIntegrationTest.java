package com.giulia.dndacademy;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.giulia.dndacademy.dto.*;
import com.giulia.dndacademy.model.*;
import com.giulia.dndacademy.model.Character;
import com.giulia.dndacademy.model.enumerations.*;
import com.giulia.dndacademy.repository.*;
import com.giulia.dndacademy.service.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;
import java.util.concurrent.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class PreMergeIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired UserRepository users;
    @Autowired CampaignRepository campaigns;
    @Autowired CharacterRepository characters;
    @Autowired CampaignChapterRepository chapters;
    @Autowired EncounterRepository encounters;
    @Autowired NpcRepository npcs;
    @Autowired CampaignChapterProgressRepository chapterProgress;
    @Autowired CampaignProgressRepository campaignProgress;
    @Autowired CharacterService characterService;
    @Autowired EncounterService encounterService;
    @Autowired CampaignProgressService campaignProgressService;
    @Autowired CombatService combatService;
    @Autowired CombatParticipantRepository participants;
    @Autowired PlatformTransactionManager transactions;
    User master, outsider, player, otherPlayer;
    Campaign campaign;
    String suffix;

    @BeforeEach void fixtures() {
        suffix = UUID.randomUUID().toString();
        master = account("master", Role.MASTER);
        outsider = account("outsider", Role.MASTER);
        player = account("player", Role.PLAYER);
        otherPlayer = account("other", Role.PLAYER);
        campaign = campaigns.save(Campaign.builder().name("Audit " + suffix).master(master)
                .difficulty(CampaignDifficulty.BEGINNER).players(new ArrayList<>(List.of(player, otherPlayer))).build());
    }
    User account(String name, Role role) {
        return users.save(User.builder().username(name + suffix).email(name + suffix + "@test.invalid")
                .password("unused").role(role).learningLevel(LearningLevel.BEGINNER).build());
    }
    Character hero(String name) {
        Character c = characters.save(Character.builder().name(name).race("Nano").characterClass("Guerriero")
                .campaign(campaign).maxHp(15).currentHp(15).armorClass(16).level(1)
                .weaponName("Ascia").damageDie(10).attackAbility(AttackAbility.STRENGTH).build());
        c.setStats(CharacterStats.builder().character(c).strength(16).dexterity(12).constitution(14).intelligence(10).wisdom(12).charisma(10).build());
        return characters.save(c);
    }
    CampaignChapter chapter(boolean combat) {
        return chapters.save(CampaignChapter.builder().campaign(campaign).title("Capitolo")
                .storyText("Storia").orderIndex(1).hasCombat(combat).build());
    }
    @Test void hpChangesRequireOwnershipPositiveAmountsAndStayBoundedEvenOnOverflow() throws Exception {
        Character c = hero("Thorin");
        for (String action : List.of("damage", "heal")) {
            mvc.perform(patch("/api/characters/{id}/" + action, c.getId()).param("amount", "1").with(user(outsider)))
                    .andExpect(status().isForbidden());
            for (String amount : List.of("0", "-100", "-2147483648"))
                mvc.perform(patch("/api/characters/{id}/" + action, c.getId()).param("amount", amount).with(user(master)))
                        .andExpect(status().isBadRequest());
        }
        mvc.perform(patch("/api/characters/{id}/damage", c.getId()).param("amount", "2147483647").with(user(master)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.currentHp").value(0));
        mvc.perform(patch("/api/characters/{id}/heal", c.getId()).param("amount", "2147483647").with(user(master)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.currentHp").value(15));
    }
    @Test void roleDenialIs403AndCampaignWhitespaceIsRejected() throws Exception {
        mvc.perform(get("/api/npcs").with(user(player))).andExpect(status().isForbidden());
        mvc.perform(post("/api/campaigns").with(user(master)).contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"   \",\"difficulty\":\"BEGINNER\"}"))
                .andExpect(status().isBadRequest());
    }
    @Test void lockedCampaignCannotBeJoinedOrReadEvenWithExistingMembership() throws Exception {
        campaign.setDifficulty(CampaignDifficulty.ADVANCED);
        campaigns.save(campaign);
        chapter(true);
        mvc.perform(post("/api/campaigns/{id}/join", campaign.getId()).with(user(player)))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/campaigns/{id}/chapters/player", campaign.getId()).with(user(player)))
                .andExpect(status().isForbidden());
        mvc.perform(patch("/api/characters/{id}/claim", hero("Locked").getId()).with(user(player)))
                .andExpect(status().isForbidden());
    }
    @Test void eligiblePlayerCanJoinANewIntermediateCampaignWithoutFirstOpeningProgressPage() throws Exception {
        CampaignChapter chapter = chapter(false);
        chapterProgress.save(CampaignChapterProgress.builder().user(player).chapter(chapter)
                .unlocked(true).completed(true).build());
        campaignProgress.save(CampaignProgress.builder().user(player).campaign(campaign)
                .unlocked(true).completed(true).build());
        Campaign next = campaigns.save(Campaign.builder().name("Next " + suffix).master(master)
                .difficulty(CampaignDifficulty.INTERMEDIATE).build());
        mvc.perform(post("/api/campaigns/{id}/join", next.getId()).with(user(player)))
                .andExpect(status().isOk());
    }
    @Test void simultaneousClaimsGiveOneCharacterPerPlayer() throws Exception {
        Character a = hero("A"), b = hero("B");
        List<Integer> outcomes = concurrently(List.of(
                () -> claim(a.getId(), player), () -> claim(b.getId(), player)));
        assertEquals(List.of(200, 409), outcomes.stream().sorted().toList());
        assertEquals(1, characters.findByPlayerUsername(player.getUsername()).size());
    }
    @Test void simultaneousPlayersReceiveIndependentCopiesOfTheSameTemplate() throws Exception {
        Character a = hero("A");
        List<Integer> outcomes = concurrently(List.of(
                () -> claim(a.getId(), player), () -> claim(a.getId(), otherPlayer)));
        assertEquals(List.of(200, 200), outcomes.stream().sorted().toList());
        var first = characters.findByCampaignIdAndPlayerId(campaign.getId(), player.getId()).orElseThrow();
        var second = characters.findByCampaignIdAndPlayerId(campaign.getId(), otherPlayer.getId()).orElseThrow();
        assertNotEquals(first.getId(), second.getId());
        assertNotEquals(first.getStats().getId(), second.getStats().getId());
        assertNotEquals(a.getStats().getId(), first.getStats().getId());
        assertEquals(a.getId(), first.getSourceTemplate().getId());
        assertEquals(a.getId(), second.getSourceTemplate().getId());
        assertEquals(1, characterService.getAvailableCharactersByCampaign(campaign.getId(), player.getUsername()).size());
    }
    int claim(Long id, User user) {
        try { characterService.claimCharacter(id, user.getUsername()); return 200; }
        catch (ResponseStatusException e) { return e.getStatusCode().value(); }
    }
    @Test void templateEditsAffectOnlyFutureCopiesAndPersonalCopiesCannotBeClaimed() {
        Character model = hero("Snapshot");
        CharacterDTO first = characterService.claimCharacter(model.getId(), player.getUsername());
        CharacterDTO second = characterService.claimCharacter(model.getId(), otherPlayer.getUsername());
        assertThrows(ResponseStatusException.class, () -> characterService.claimCharacter(first.getId(), otherPlayer.getUsername()));
        User future = account("future", Role.PLAYER);
        new TransactionTemplate(transactions).executeWithoutResult(tx -> {
            Character stored = characters.findById(model.getId()).orElseThrow();
            stored.setName("Future snapshot"); stored.getStats().setStrength(20); characters.save(stored);
            Campaign joined = campaigns.findById(campaign.getId()).orElseThrow();
            joined.getPlayers().add(future); campaigns.save(joined);
        });
        CharacterDTO third = characterService.claimCharacter(model.getId(), future.getUsername());
        assertEquals("Future snapshot", third.getName());
        assertEquals(20, third.getStats().getStrength());
        assertEquals("Snapshot", characterService.getMyCharacters(player.getUsername()).get(0).getName());
        assertEquals(16, characterService.getMyCharacters(player.getUsername()).get(0).getStats().getStrength());
        assertEquals(16, characterService.getMyCharacters(otherPlayer.getUsername()).get(0).getStats().getStrength());
        assertEquals(3, characterService.getAllCharactersByCampaignForMaster(campaign.getId(), master.getUsername()).get(0).getAssignedCount());
        assertNotEquals(first.getId(), second.getId());
    }
    @Test void simultaneousEncounterCreationLeavesExactlyOneEncounter() throws Exception {
        CampaignChapter chapter = chapter(true);
        Npc npc = npcs.save(Npc.builder().name("Goblin").owner(master).enemy(true).maxHp(10)
                .armorClass(13).dexterity(12).attackModifier(2).damageDie(6).build());
        String body = "{\"title\":\"Incontro\",\"chapterId\":" + chapter.getId()
                + ",\"npcs\":[{\"npcId\":" + npc.getId() + ",\"quantity\":2}]}";
        EncounterRequest request = json.readValue(body, EncounterRequest.class);
        List<Callable<Integer>> calls = new ArrayList<>();
        for (int i = 0; i < 6; i++) calls.add(() -> {
            try { encounterService.createEncounter(request, master.getUsername()); return 201; }
            catch (ResponseStatusException e) { return e.getStatusCode().value(); }
        });
        List<Integer> outcomes = concurrently(calls);
        assertEquals(1, outcomes.stream().filter(s -> s == 201).count());
        assertEquals(5, outcomes.stream().filter(s -> s == 409).count());
        assertEquals(1, encounters.findByChapterId(chapter.getId()).size());
    }
    @Test void databaseAlsoRejectsDuplicateAssignmentsWithoutServiceLocks() {
        Character a = hero("A"), b = hero("B");
        characterService.claimCharacter(a.getId(), player.getUsername());
        b.setPlayer(player);
        b.setSourceTemplate(a);
        assertThrows(org.springframework.dao.DataIntegrityViolationException.class,
                () -> characters.saveAndFlush(b));
    }
    @Test void databaseAlsoRejectsDuplicateEncountersWithoutServiceLocks() {
        CampaignChapter chapter = chapter(true);
        encounters.saveAndFlush(Encounter.builder().chapter(chapter).title("A").build());
        assertThrows(org.springframework.dao.DataIntegrityViolationException.class,
                () -> encounters.saveAndFlush(Encounter.builder().chapter(chapter).title("B").build()));
    }
    @Test void encounterReadApisRemainReadOnlyAndCheckOwnership() throws Exception {
        CampaignChapter chapter = chapter(true);
        Encounter encounter = encounters.saveAndFlush(Encounter.builder().chapter(chapter).title("Read fixture").build());
        mvc.perform(get("/api/encounters/{id}", encounter.getId()).with(user(master)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.title").value("Read fixture"));
        mvc.perform(get("/api/encounters/chapter/{id}", chapter.getId()).with(user(master)))
                .andExpect(status().isOk());
        mvc.perform(get("/api/encounters/{id}", encounter.getId()).with(user(outsider)))
                .andExpect(status().isForbidden());
    }
    @Test void usedChapterCannotBeDeletedAndDoesNotExposeSql() throws Exception {
        CampaignChapter chapter = chapter(false);
        chapterProgress.save(CampaignChapterProgress.builder().user(player).chapter(chapter).unlocked(true).build());
        mvc.perform(delete("/api/campaigns/chapters/{id}", chapter.getId()).with(user(master)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("SQL"))));
        assertTrue(chapters.existsById(chapter.getId()));
    }
    @Test void trainingRestartsAtFullHpButResumeAndPersonalCopiesRemainIndependent() throws Exception {
        Character model = hero("Thorin");
        CharacterDTO chosen = characterService.claimCharacter(model.getId(), player.getUsername());
        CharacterDTO other = characterService.claimCharacter(model.getId(), otherPlayer.getUsername());
        CampaignChapter chapter = chapter(true);
        Npc npc = npcs.save(Npc.builder().name("Goblin").owner(master).enemy(true).maxHp(10)
                .armorClass(13).dexterity(12).attackModifier(2).damageDie(6).build());
        EncounterRequest encounter = new EncounterRequest();
        encounter.setTitle("Incontro"); encounter.setChapterId(chapter.getId());
        EncounterNpcRequest entry = new EncounterNpcRequest(); entry.setNpcId(npc.getId()); entry.setQuantity(1);
        encounter.setNpcs(List.of(entry));
        encounterService.createEncounter(encounter, master.getUsername());
        new TransactionTemplate(transactions).executeWithoutResult(tx -> {
            Character copy = characters.findById(chosen.getId()).orElseThrow();
            copy.setCurrentHp(0); copy.setAlive(false); characters.save(copy);
        });
        campaignProgressService.getMyCampaignProgress(player.getUsername());
        chapterProgress.save(CampaignChapterProgress.builder().user(player).chapter(chapter).unlocked(true).build());
        CombatDTO combat = combatService.startChapterCombat(chapter.getId(), player.getUsername());
        assertEquals(15, combatService.getCombatStatus(combat.getId(), player.getUsername()).getFighters().stream()
                .filter(f -> chosen.getId().equals(f.getCharacterId())).findFirst().orElseThrow().getCurrentHp());
        new TransactionTemplate(transactions).executeWithoutResult(tx -> {
            CombatParticipant fighter = participants.findByCombatId(combat.getId()).stream().filter(f -> f.getCharacter() != null).findFirst().orElseThrow();
            fighter.setCurrentHp(7); participants.save(fighter);
        });
        CombatDTO retry = combatService.startChapterCombat(chapter.getId(), player.getUsername());
        assertEquals(7, combatService.getCombatStatus(combat.getId(), player.getUsername()).getFighters().stream()
                .filter(f -> chosen.getId().equals(f.getCharacterId())).findFirst().orElseThrow().getCurrentHp());
        assertEquals(15, combatService.getCombatStatus(retry.getId(), player.getUsername()).getFighters().stream()
                .filter(f -> chosen.getId().equals(f.getCharacterId())).findFirst().orElseThrow().getCurrentHp());
        assertEquals(15, characters.findById(other.getId()).orElseThrow().getCurrentHp());
        UpdateCharacterRequest update = new UpdateCharacterRequest();
        update.setName("Future Thorin"); update.setRace("Nano"); update.setCharacterClass("Guerriero"); update.setLevel(1);
        update.setMaxHp(15); update.setArmorClass(25); update.setWeaponName("Ascia"); update.setDamageDie(10);
        update.setAttackAbility(AttackAbility.STRENGTH); update.setStats(new CharacterStatsDTO(16,12,14,10,12,10));
        mvc.perform(put("/api/characters/{id}", chosen.getId()).with(user(master)).contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(update))).andExpect(status().isConflict());
        mvc.perform(put("/api/characters/{id}", model.getId()).with(user(master)).contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(update))).andExpect(status().isOk());
        assertEquals("Thorin", characters.findById(chosen.getId()).orElseThrow().getName());
        assertEquals("Thorin", characters.findById(other.getId()).orElseThrow().getName());
        mvc.perform(delete("/api/characters/{id}", model.getId()).with(user(master))).andExpect(status().isConflict());
    }
    <T> List<T> concurrently(List<Callable<T>> calls) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(calls.size());
        CountDownLatch ready = new CountDownLatch(calls.size()), start = new CountDownLatch(1);
        try {
            List<Future<T>> results = new ArrayList<>();
            for (Callable<T> call : calls) results.add(pool.submit(() -> {
                ready.countDown();
                if (!start.await(10, TimeUnit.SECONDS)) throw new TimeoutException();
                return call.call();
            }));
            assertTrue(ready.await(10, TimeUnit.SECONDS));
            start.countDown();
            List<T> values = new ArrayList<>();
            for (Future<T> result : results) values.add(result.get(30, TimeUnit.SECONDS));
            return values;
        } finally { start.countDown(); pool.shutdownNow(); }
    }
}
