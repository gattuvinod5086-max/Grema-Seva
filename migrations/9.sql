
-- Governance platform extensions: SLA, escalation, citizen confirmation, audit trail

ALTER TABLE issues ADD COLUMN priority TEXT DEFAULT 'MEDIUM';
ALTER TABLE issues ADD COLUMN sla_hours INTEGER;
ALTER TABLE issues ADD COLUMN sla_due_at DATETIME;
ALTER TABLE issues ADD COLUMN acknowledged_at DATETIME;
ALTER TABLE issues ADD COLUMN assigned_at DATETIME;
ALTER TABLE issues ADD COLUMN resolved_at DATETIME;
ALTER TABLE issues ADD COLUMN escalation_level INTEGER DEFAULT 0;
ALTER TABLE issues ADD COLUMN escalation_status TEXT DEFAULT 'NONE';
ALTER TABLE issues ADD COLUMN department TEXT;
ALTER TABLE issues ADD COLUMN ward TEXT;
ALTER TABLE issues ADD COLUMN estimated_affected_citizens INTEGER;
ALTER TABLE issues ADD COLUMN citizen_confirmed_at DATETIME;
ALTER TABLE issues ADD COLUMN citizen_confirmation_status TEXT;
ALTER TABLE issues ADD COLUMN citizen_rating INTEGER;
ALTER TABLE issues ADD COLUMN citizen_feedback TEXT;
ALTER TABLE issues ADD COLUMN sync_state TEXT DEFAULT 'synced';

ALTER TABLE issue_updates ADD COLUMN action_type TEXT DEFAULT 'status_change';
ALTER TABLE issue_updates ADD COLUMN actor_role TEXT;
ALTER TABLE issue_updates ADD COLUMN old_value TEXT;
ALTER TABLE issue_updates ADD COLUMN new_value TEXT;

CREATE INDEX IF NOT EXISTS idx_issues_priority ON issues(priority);
CREATE INDEX IF NOT EXISTS idx_issues_sla_due ON issues(sla_due_at);
CREATE INDEX IF NOT EXISTS idx_issues_escalation ON issues(escalation_status);
CREATE INDEX IF NOT EXISTS idx_issues_village ON issues(village);
