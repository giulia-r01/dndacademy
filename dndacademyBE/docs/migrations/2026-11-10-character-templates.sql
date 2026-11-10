-- PostgreSQL: run once, with the application stopped and after backing up the DB.
-- No rows, accounts, progress or combat history are removed. Safe to rerun.
BEGIN;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS source_template_id bigint;

DO $$
DECLARE
  owned record;
  model_id bigint;
BEGIN
  FOR owned IN SELECT * FROM characters WHERE player_id IS NOT NULL AND source_template_id IS NULL FOR UPDATE LOOP
    INSERT INTO characters (name, race, character_class, image_url, level, max_hp, current_hp,
      armor_class, weapon_name, damage_die, attack_ability, spellcaster, spell_name, spell_damage_die,
      spell_ability, alive, player_id, campaign_id, source_template_id)
    VALUES (owned.name, owned.race, owned.character_class, owned.image_url, owned.level, owned.max_hp, owned.max_hp,
      owned.armor_class, owned.weapon_name, owned.damage_die, owned.attack_ability, owned.spellcaster,
      owned.spell_name, owned.spell_damage_die, owned.spell_ability, true, NULL, owned.campaign_id, NULL)
    RETURNING id INTO model_id;
    INSERT INTO character_stats (strength, dexterity, constitution, intelligence, wisdom, charisma, character_id)
      SELECT strength, dexterity, constitution, intelligence, wisdom, charisma, model_id
      FROM character_stats WHERE character_id = owned.id;
    UPDATE characters SET source_template_id = model_id WHERE id = owned.id;
  END LOOP;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_character_source_template' AND conrelid = 'characters'::regclass) THEN
    ALTER TABLE characters ADD CONSTRAINT fk_character_source_template FOREIGN KEY (source_template_id) REFERENCES characters(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_character_model_instance' AND conrelid = 'characters'::regclass) THEN
    ALTER TABLE characters ADD CONSTRAINT ck_character_model_instance CHECK (
      (player_id IS NULL AND source_template_id IS NULL) OR
      (player_id IS NOT NULL AND source_template_id IS NOT NULL AND source_template_id <> id));
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS ix_characters_source_template ON characters(source_template_id);
COMMIT;
