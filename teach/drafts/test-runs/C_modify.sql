-- Apply to the COPY only (test-blocked-dedup.db). Backdate all block events
-- past the script's 3600s filter so the changed set actually emits.
BEGIN;
-- unblock t_fixblock2 (drops from reported set)
UPDATE tasks SET status='todo' WHERE id='t_fixblock2';
INSERT INTO task_events (task_id, kind, payload, created_at)
VALUES ('t_fixblock2', 'unblocked', '{"by":"test-run-c"}', strftime('%s','now')-7200);
-- block a brand-new task t_fixblock3
INSERT OR REPLACE INTO tasks (id, title, status, assignee, created_at, workspace_kind)
VALUES ('t_fixblock3', 'fixture three', 'blocked', 'crazydave', strftime('%s','now')-7200, 'scratch');
INSERT INTO task_events (task_id, kind, payload, created_at)
VALUES ('t_fixblock3', 'blocked', '{"reason":"fixture three: new block run C"}', strftime('%s','now')-7200);
-- re-block t_fixblock1 (unblock then re-block -> should re-notify)
UPDATE tasks SET status='todo' WHERE id='t_fixblock1';
INSERT INTO task_events (task_id, kind, payload, created_at)
VALUES ('t_fixblock1', 'unblocked', '{"by":"test-run-c"}', strftime('%s','now')-7200);
UPDATE tasks SET status='blocked' WHERE id='t_fixblock1';
INSERT INTO task_events (task_id, kind, payload, created_at)
VALUES ('t_fixblock1', 'blocked', '{"reason":"fixture one: REBLOCKED run C"}', strftime('%s','now')-7200);
COMMIT;