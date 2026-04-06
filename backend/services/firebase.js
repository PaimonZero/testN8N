/**
 * Firebase Service — Push logs to Firebase Realtime Database via REST API.
 * No Firebase SDK needed on backend, just HTTP POST.
 */

const FIREBASE_DB_URL = process.env.FIREBASE_DB_URL;

/**
 * Push a CoT step log to Firebase Realtime Database.
 * React frontend subscribes to this path via onChildAdded for real-time updates.
 *
 * @param {string} sessionId - Unique session identifier
 * @param {object} step - Step data to push
 */
async function pushLog(sessionId, step) {
  const url = `${FIREBASE_DB_URL}/sessions/${sessionId}/steps.json`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...step,
        timestamp: Date.now(),
      }),
    });

    if (!response.ok) {
      console.warn(`Firebase push failed: ${response.status}`);
    }
  } catch (error) {
    console.warn('Firebase push error:', error.message);
  }
}

/**
 * Helper to push a standardized CoT step.
 */
async function pushStep(sessionId, stepNumber, type, icon, title, content, tool = null, extra = {}) {
  await pushLog(sessionId, {
    stepNumber,
    type,
    icon,
    title,
    content,
    tool,
    ...extra,
  });
}

module.exports = { pushLog, pushStep };
