const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;

/**
 * Send a message to the N8N webhook and wait for the final answer.
 * The chain of thought is streamed separately via Firebase.
 */
export async function sendMessage(message, sessionId) {
  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        sessionId,
      }),
    });

    if (!response.ok) {
      throw new Error(`N8N webhook error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error calling N8N webhook:', error);
    throw error;
  }
}
