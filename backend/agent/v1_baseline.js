const { pushStep } = require('../services/firebase');
const { callLLM } = require('../services/llm');

/**
 * Baseline Chatbot (V1)
 * Just a simple LLM prompt without any tools, API calls or CoT loop.
 * It has to rely purely on its internal knowledge date to fulfill the request.
 */
async function runAgentV1(message, sessionId, llmModel = 'claude', history = [], userKeys = {}) {
  // Step 1: Just read the message
  await pushStep(sessionId, 1, 'thought', '🧠', 'Phân tích yêu cầu (V1)',
    `Đang đọc yêu cầu của bạn: "${message}"${history.length > 0 ? ` (Có ${history.length} tin nhắn cũ)` : ''}`
  );

  const historyText = history.length > 0 
    ? history.map(h => `${h.role === 'user' ? 'Người dùng' : 'AI'}: ${h.content}`).join('\n')
    : 'Không có lịch sử cũ.';

  const prompt = `Bạn là một trợ lý ảo tư vấn địa điểm đi chơi và team building.
Dưới đây là lịch sử trò chuyện:
${historyText}

Người dùng vừa nói: "${message}"

HƯỚNG DẪN DÀNH CHO BẠN:
1. Bạn KHÔNG CÓ KHẢ NĂNG truy cập mạng (Search).
2. Bạn KHÔNG CÓ API thời tiết (Weather).
3. Do bạn bị bịt mắt về thế giới thực, hãy trả lời dựa trên suy đoán và kiến thức nội tại.
4. Hãy cảnh báo người dùng rằng bạn không biết thời tiết hôm nay ra sao nên chỉ có thể gợi ý chung chung giả định.`;

  await pushStep(sessionId, 2, 'action', '⚡', 'Sinh nội dung từ LLM nội tại', 'Gọi trực tiếp LLM không qua Tool...');
  
  const finalAnswer = await callLLM(prompt, '', 2048, llmModel, userKeys);

  await pushStep(sessionId, 3, 'final_answer', '✅', 'Hoàn thành', finalAnswer);

  return { success: true, finalAnswer };
}

module.exports = { runAgentV1 };
