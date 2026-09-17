-- run D2: re-block t_fixblock1 with a fresh blocked event (backdated past 1h filter).
BEGIN;
UPDATE tasks SET status='blocked' WHERE id='t_fixblock1';
INSERT INTO task_events (task_id, kind, payload, created_at)
VALUES ('t_fixblock1', 'blocked', '{"reason":"fixture one: REBLOCKED AGAIN run D2"}', strftime('%s','now')-7200);
COMMIT;