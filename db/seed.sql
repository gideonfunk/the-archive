INSERT OR IGNORE INTO personas
  (name, slug, primary_color, description, theological_statement, status, sort_order)
VALUES
  ('The War Scroll', 'the-war-scroll', '#8B0000', 'Warfare worship and prayer-warrior devotional music.', 'Isaiah 59:19; Psalm 57:8; Psalm 91:1; Revelation 12:11', 'active', 1),
  ('Echo Gray', 'echo-gray', '#708090', 'Melancholic ambient work exploring memory, loss, distance, and hope.', NULL, 'active', 2),
  ('Chanokh', 'chanokh', '#A67C00', 'Prophetic word, spoken-word performance, and beat-driven scripture meditation.', NULL, 'active', 3),
  ('Instrumental Band', 'instrumental-band', '#2F4F4F', 'Instrumental compositions, ensemble studies, improvisations, and cinematic work.', NULL, 'active', 4),
  ('Gideon', 'gideon', '#B8860B', 'Original works released under Gideon''s own name.', NULL, 'active', 5);

INSERT OR IGNORE INTO tracks
  (persona_id, track_id, title, slug, status, genre, language, explicit, curator_tags, scripture_references, rights_note)
VALUES
  ((SELECT id FROM personas WHERE slug = 'the-war-scroll'), 'TWS-2026-001', 'Dawn Witness', 'dawn-witness', 'public', 'Warfare Worship', 'en', 0, 'morning;witness;psalm', 'Psalm 57:8', 'Written and performed by Gideon Funk'),
  ((SELECT id FROM personas WHERE slug = 'the-war-scroll'), 'TWS-2026-002', 'Standard Raised High', 'standard-raised-high', 'public', 'Warfare Worship', 'en', 0, 'banner;victory;standard', 'Isaiah 59:19', 'Written and performed by Gideon Funk'),
  ((SELECT id FROM personas WHERE slug = 'the-war-scroll'), 'TWS-2026-003', 'Threefold Cord', 'threefold-cord', 'public', 'Warfare Worship', 'en', 0, 'unity;strength;cord', 'Ecclesiastes 4:9–12', 'Written and performed by Gideon Funk'),
  ((SELECT id FROM personas WHERE slug = 'the-war-scroll'), 'TWS-2026-004', 'Steadfast Hearts', 'steadfast-hearts', 'public', 'Warfare Worship', 'en', 0, 'steadfast;heart;faith', 'Colossians 3:12–14', 'Written and performed by Gideon Funk'),
  ((SELECT id FROM personas WHERE slug = 'the-war-scroll'), 'TWS-2026-005', 'Blood and Mercy Morning', 'blood-and-mercy-morning', 'public', 'Warfare Worship', 'en', 0, 'mercy;morning;blood', 'Lamentations 3:22–23', 'Written and performed by Gideon Funk');

INSERT OR IGNORE INTO track_versions
  (track_id, version, purpose, duration, object_key, public_url, is_public)
SELECT id, 'v01', 'web', 180, 'audio/the-war-scroll/' || track_id || '/v01/stream.mp3', NULL, 0
FROM tracks
WHERE track_id LIKE 'TWS-2026-%'
  AND NOT EXISTS (
    SELECT 1 FROM track_versions
    WHERE track_versions.track_id = tracks.id
      AND track_versions.version = 'v01'
      AND track_versions.purpose = 'web'
  );
