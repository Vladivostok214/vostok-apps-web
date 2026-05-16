import Dexie from 'dexie';

export const db = new Dexie('VostokDatabase');

// Define tables:
// - messages: for user feedback (offline-first)
// - telemetry: for hardware specs and performance logs
// - engine_logs: for general activity logs
db.version(1).stores({
  messages: '++id, email, content, status, created_at',
  telemetry: '++id, type, data, timestamp',
  logs: '++id, level, event, timestamp'
});

/**
 * Saves a message locally.
 */
export const saveMessageLocally = async (email, content) => {
  return await db.messages.add({
    email,
    content,
    status: 'pending', // pending, synced
    created_at: new Date()
  });
};

/**
 * Logs telemetry data locally.
 */
export const logTelemetry = async (type, data) => {
  return await db.telemetry.add({
    type,
    data,
    timestamp: new Date()
  });
};

/**
 * General event logger.
 */
export const logEvent = async (event, properties = {}) => {
  return await db.logs.add({
    event,
    properties,
    timestamp: new Date()
  });
};

/**
 * Retrieves pending messages to sync.
 */
export const getPendingMessages = async () => {
  return await db.messages.where('status').equals('pending').toArray();
};

/**
 * Marks messages as synced.
 */
export const markMessagesAsSynced = async (ids) => {
  return await db.messages.where('id').anyOf(ids).modify({ status: 'synced' });
};

/**
 * Syncs pending data to a self-hosted server if configured.
 */
export const syncData = async () => {
  const serverUrl = import.meta.env.VITE_SYNC_SERVER_URL;
  if (!serverUrl) return { info: 'No sync server configured' };

  try {
    const pendingMessages = await getPendingMessages();
    if (pendingMessages.length === 0) return { info: 'Nothing to sync' };

    const response = await fetch(`${serverUrl}/vostok/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: pendingMessages })
    });

    if (response.ok) {
      const ids = pendingMessages.map(m => m.id);
      await markMessagesAsSynced(ids);
      return { success: true, count: ids.length };
    }
  } catch (e) {
    console.warn("[Vostok Sync] Failed to connect to self-hosted server:", e);
    return { error: e.message };
  }
};
