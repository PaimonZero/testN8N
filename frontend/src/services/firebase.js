import { initializeApp } from "firebase/app";
import { getDatabase, ref, onChildAdded, off, remove } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DB_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

/**
 * Subscribe to a session's steps in Firebase Realtime Database.
 * onChildAdded fires once for EACH NEW child added to the path.
 * This gives us real-time streaming of each step as N8N pushes them.
 */
export function subscribeToSession(sessionId, onNewStep) {
  const stepsRef = ref(database, `sessions/${sessionId}/steps`);

  onChildAdded(stepsRef, (snapshot) => {
    const step = snapshot.val();
    if (step) {
      onNewStep(step);
    }
  });

  // Return unsubscribe function
  return () => off(stepsRef);
}

/**
 * Cleanup session data after completion to keep Firebase tidy.
 */
export async function cleanupSession(sessionId) {
  try {
    const sessionRef = ref(database, `sessions/${sessionId}`);
    await remove(sessionRef);
  } catch (error) {
    console.warn('Failed to cleanup session:', error);
  }
}

export { database };
