/**
 * Conversation Storage Utility
 * Manages multi-conversation history in localStorage with 2-week expiry.
 *
 * Data structure:
 * localStorage['conversations'] = JSON array of Conversation objects:
 * [
 *   {
 *     id: string,           // UUID
 *     title: string,        // First user message (preview)
 *     createdAt: number,    // Timestamp
 *     updatedAt: number,    // Timestamp
 *     messages: Message[]   // Array of { role, content, steps? }
 *   }
 * ]
 */

const STORAGE_KEY = 'react_agent_conversations';
const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;
const MAX_CONVERSATIONS = 50;

/**
 * Load all conversations from localStorage, pruning expired ones.
 */
export function loadConversations() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const all = JSON.parse(raw);
    const now = Date.now();
    // Prune conversations older than 2 weeks
    return all.filter(c => now - c.updatedAt < TWO_WEEKS_MS);
  } catch {
    return [];
  }
}

/**
 * Save all conversations to localStorage.
 */
export function saveConversations(conversations) {
  try {
    // Keep only most recent MAX_CONVERSATIONS
    const trimmed = conversations.slice(0, MAX_CONVERSATIONS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('Failed to save conversations to localStorage:', e);
  }
}

/**
 * Create a new conversation entry.
 */
export function createConversation() {
  return {
    id: crypto.randomUUID(),
    title: 'Cuộc trò chuyện mới',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
    isPinned: false
  };
}

/**
 * Update a conversation's messages and title (derived from first user message).
 */
export function updateConversation(conversations, id, messages) {
  return conversations.map(c => {
    if (c.id !== id) return c;
    const firstUserMsg = messages.find(m => m.role === 'user');
    const title = firstUserMsg
      ? firstUserMsg.content.slice(0, 60) + (firstUserMsg.content.length > 60 ? '...' : '')
      : c.title;
    return { ...c, messages, title, updatedAt: Date.now() };
  });
}

/**
 * Toggle pinned status for a conversation.
 */
export function togglePin(conversations, id) {
  return conversations.map(c => 
    c.id === id ? { ...c, isPinned: !c.isPinned, updatedAt: Date.now() } : c
  );
}

/**
 * Delete a conversation by ID.
 */
export function deleteConversation(conversations, id) {
  return conversations.filter(c => c.id !== id);
}

/**
 * Clear all conversations.
 */
export function clearAllConversations() {
  localStorage.removeItem(STORAGE_KEY);
}
