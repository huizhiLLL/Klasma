-- Remove the retired version field from software metadata.
UPDATE resources
SET metadata = json_remove(metadata, '$.version')
WHERE type = 'tools' AND json_valid(metadata) AND json_type(metadata, '$.version') IS NOT NULL;
