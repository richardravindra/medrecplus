
export const createSampleLogs = () => {
  // Don't create any automatic logs - logs should only be created by actual user actions
  // This prevents the "started the application" log from cluttering the activity logs
  return;
};

export const clearSampleLogs = () => {
  localStorage.removeItem('activity_logs');
  localStorage.removeItem('logs_last_seen');
};