/**
 * getRateLimitStatus — Fetch the current IP's daily usage quota.
 */
const BE_API_URL = import.meta.env.VITE_BE_API_URL || 'http://localhost:3000/api/chat';
const BE_BASE_URL = BE_API_URL.replace('/api/chat', '');

export async function sendMessage(message, sessionId, version = 'v3', llmModel = 'claude', history = [], userKeys = {}, adminCode = '') {
  try {
    const response = await fetch(`${BE_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        sessionId,
        version,
        llmModel,
        history,
        userKeys,
        adminCode,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 429) {
        const fetchError = new Error(errorData.message || 'Đã đạt giới hạn request trong ngày.');
        if (errorData.rateLimitStatus) {
            fetchError.rateLimitStatus = errorData.rateLimitStatus;
        }
        throw fetchError;
      }
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error.message.includes('Failed to fetch')) {
      throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra backend có đang chạy không.');
    }
    throw error;
  }
}

export async function getRateLimitStatus(userKeys = {}, llmModel = 'gemini', adminCode = '') {
  try {
    const response = await fetch(`${BE_BASE_URL}/api/rate-limit-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userKeys, llmModel, adminCode })
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}
