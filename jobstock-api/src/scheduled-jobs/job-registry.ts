export interface JobDefinition {
  name: string;
  description: string;
  cronExpression: string;
  cronLabel: string;
}

// The single source of truth for what scheduled jobs exist — both the cron
// handlers and the admin monitoring UI read from this list, so a job can
// never show up in one place but not the other.
export const JOB_DEFINITIONS: JobDefinition[] = [
  {
    name: 'nightly-database-backup',
    description: 'Runs a full pg_dump of the production database',
    cronExpression: '0 2 * * *',
    cronLabel: 'Daily at 2:00 AM',
  },
  {
    name: 'stale-security-log-cleanup',
    description: 'Deletes failed-login and rate-limit-hit records older than 30 days',
    cronExpression: '0 3 * * *',
    cronLabel: 'Daily at 3:00 AM',
  },
];
