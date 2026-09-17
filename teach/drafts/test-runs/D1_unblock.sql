-- Bonus run D: isolate re-block re-notify. Current blocked>1h = {t_fixblock1, t_fixblock3}.
-- Step 1: unblock t_fixblock1 (drops set to {t_fixblock3}) -> run D1 should emit nothing
--          beyond the change... actually t_fixblock3 is unchanged, so after unblock
--          the set changes ({t1,t3}->{t3}), and since filtered output only contains
--          t_fixblock3 which is unchanged, CHANGED=1 but OUTPUT has just t3 line ->
--          it emits. To isolate cleanly, just unblock t3 too so output is empty-ish.
-- Simpler isolation: unblock BOTH, run (empty), then re-block t_fixblock1, run (re-notify).
BEGIN;
UPDATE tasks SET status='todo' WHERE id='t_fixblock1';
INSERT INTO task_events (task_id, kind, payload, created_at)
VALUES ('t_fixblock1', 'unblocked', '{"by":"run-D-step1-unblock"}', strftime('%s','now')-7200);
UPDATE tasks SET status='todo' WHERE id='t_fixblock3';
INSERT INTO task_events (task_id, kind, payload, created_at)
VALUES ('t_fixblock3', 'unblocked', '{"by":"run-D-step1-unblock"}', strftime('%s','now')-7200);
COMMIT;