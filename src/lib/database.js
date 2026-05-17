import Dexie from 'dexie';

export const db = new Dexie('VostokDatabase');

// Define tables:
// - telemetry: for hardware specs and performance logs
// - logs: for general activity logs
db.version(2).stores({
  telemetry: '++id, type, data, timestamp',
  logs: '++id, level, event, timestamp'
});

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
