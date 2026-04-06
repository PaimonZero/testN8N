const { pushStep } = require('../services/firebase');
const { callLLM } = require('../services/llm');
const { getWeather } = require('../services/weather');
const { searchWeb } = require('../services/search');

/**
 * Basic ReAct Agent (V2)
 * Demonstrates an intermediate capability: has tools, but lack of strict LLM output parsing,
 * naive direct tool calls without self-reflection steps. This showcases format hallucinations.
 */
async function runAgentV2(message, sessionId, llmModel = 'claude', history = [], userKeys = {}) {
  await pushStep(sessionId, 1, 'thought', '🧠', 'Phân tích yêu cầu (V2 Basic)', `Tìm các thực thể trong: ${message}${history.length > 0 ? ` (Có ${history.length} tin nhắn cũ)` : ''}`);
  
  const historyText = history.length > 0 
    ? history.map(h => `${h.role === 'user' ? 'U' : 'AI'}: ${h.content}`).join('\n')
    : 'No history.';

  // Naive prompt without strict output schema formats
  const parsePrompt = `Dưới đây là lịch sử chat:
${historyText}

Trích xuất từ tin nhắn mới nhất này "${message}" các thông tin sau: city, latitude, longitude, date. Trả về JSON nguyên chất.`;
  const parseResult = await callLLM(parsePrompt, '', 1024, llmModel, userKeys);
  
  await pushStep(sessionId, 2, 'thought', '🧠', 'Kết quả JSON thô', parseResult);
  
  let entity;
  try {
    // V2 is naive, directly parses without cleaning Markdown wrapper (```json ... ```)
    // Sometimes it passes, usually it crashes if LLM surrounds it with chat.
    const rawJson = parseResult.replace(/```json/g, '').replace(/```/g, ''); // Attempt minimal cleaning
    entity = JSON.parse(rawJson.trim());
  } catch (e) {
    // Fallback if crash - This highlights format limitations
    const errText = 'LLM trả về format sai chuẩn JSON: ' + e.message;
    await pushStep(sessionId, 3, 'observation', '❌', 'Lỗi Parse JSON', errText);
    const finalAnswer = "**🚫 Lỗi V2 Hệ Thống**: Không thể trích xuất JSON địa danh do LLM sinh ra văn bản thừa.\n```\n" + parseResult + "\n```\n_Lưu ý: Để giải quyết lỗi này, Agent V3 đã sử dụng Prompt Guardrail và Regex phức tạp hơn._";
    await pushStep(sessionId, 4, 'final_answer', '🛑', 'Kết thúc vì lỗi', finalAnswer);
    return { success: true, finalAnswer };
  }

  // Without a "Reasoning/Review" thought step, we jump directly to Action
  await pushStep(sessionId, 3, 'action', '⚡', 'Check Weather', `Lấy thời tiết cho ${entity.city || 'địa điểm'} (${entity.latitude}, ${entity.longitude})`);
  const weatherResult = await getWeather(entity.latitude || 10.346, entity.longitude || 107.084);
  
  // Hardcoded direct search without dynamic thought
  await pushStep(sessionId, 4, 'action', '⚡', 'Search Web', `Dùng Search Web tìm chỗ chơi tại ${entity.city || 'địa điểm'}`);
  const searchResult = await searchWeb(`Du lịch ${entity.city || 'điểm đến'} ${!weatherResult.isSunny ? "trong nhà" : "ngoài trời"}`, userKeys);
  
  await pushStep(sessionId, 5, 'observation', '👁️', 'Search & Weather results', `Thời tiết: ${weatherResult.summary}\n\nTìm kiếm:\n${searchResult.substring(0, 300)}...`);

  // Final without robust template
  const finalPrompt = `Dựa vào thời tiết: ${weatherResult.summary} và kết quả search: ${searchResult}. Em hãy lên một dự án cho câu hỏi: "${message}".`;
  const finalAnswer = await callLLM(finalPrompt, '', 2048, llmModel, userKeys);

  await pushStep(sessionId, 6, 'final_answer', '✅', 'Hoàn thành máy móc', finalAnswer);
  
  return { success: true, finalAnswer };
}

module.exports = { runAgentV2 };
