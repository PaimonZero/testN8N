/**
 * ReAct Agent — Manual orchestration of the Thought → Action → Observation loop.
 *
 * This is the Express.js equivalent of the N8N workflow.
 * Each step pushes a log to Firebase for real-time streaming to the frontend.
 *
 * Flow:
 *   1. 🧠 Parse user request (LLM)
 *   2. ⚡ Call Weather API
 *   3. 👁️ Process weather observation
 *   4. 🧠 Reason about weather condition
 *   5. ⚡ Search for locations
 *   6. 👁️ Process search results
 *   7. 🧠 Generate final plan (LLM)
 *   8. ✅ Complete
 */

const { pushStep } = require('../services/firebase');
const { callClaude } = require('../services/llm');
const { getWeather } = require('../services/weather');
const { searchWeb } = require('../services/search');

/**
 * Run the ReAct agent for event planning based on weather.
 *
 * @param {string} message - User's message
 * @param {string} sessionId - Unique session ID for Firebase streaming
 * @returns {object} - { success, finalAnswer }
 */
async function runAgent(message, sessionId) {
  // ──────────────────────────────────────────────
  // Step 1: 🧠 THOUGHT — Analyzing the request
  // ──────────────────────────────────────────────
  await pushStep(sessionId, 1, 'thought', '🧠', 'Phân tích yêu cầu',
    `Đang phân tích yêu cầu của bạn: "${message}"`
  );

  // Step 2: 🧠 THOUGHT — Parse request with LLM
  const parsePrompt = `Bạn là bộ phân tích yêu cầu. Trích xuất thông tin sau từ tin nhắn người dùng và trả về JSON (CHỈ JSON, không thêm gì khác):
{
  "city": "tên thành phố",
  "latitude": số,
  "longitude": số,
  "date": "ngày cụ thể (YYYY-MM-DD)",
  "dateDescription": "mô tả ngày",
  "request": "yêu cầu chính",
  "sunnyAction": "hành động nếu trời nắng",
  "rainyAction": "hành động nếu trời mưa"
}

Tọa độ các thành phố Việt Nam:
- Vũng Tàu: lat=10.346, lon=107.084
- Hồ Chí Minh: lat=10.823, lon=106.630
- Hà Nội: lat=21.028, lon=105.854
- Đà Nẵng: lat=16.054, lon=108.202
- Nha Trang: lat=12.238, lon=109.196
- Đà Lạt: lat=11.941, lon=108.458
- Phú Quốc: lat=10.227, lon=103.967
- Huế: lat=16.463, lon=107.590

Ngày hôm nay là: ${new Date().toISOString().split('T')[0]}
Nếu người dùng nói "thứ 7 tới", hãy tính ngày cụ thể.

Tin nhắn: "${message}"`;

  const parseResponse = await callClaude(parsePrompt, '', 1024);

  // Extract JSON from response
  const jsonMatch = parseResponse.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Không thể phân tích yêu cầu. Vui lòng thử lại.');
  }
  const parsed = JSON.parse(jsonMatch[0]);

  await pushStep(sessionId, 2, 'thought', '🧠', 'Đã xác định thông tin',
    `Thành phố: ${parsed.city}\nNgày: ${parsed.dateDescription} (${parsed.date})\nYêu cầu: ${parsed.request}`
  );

  // ──────────────────────────────────────────────
  // Step 3: ⚡ ACTION — Call Weather API
  // ──────────────────────────────────────────────
  await pushStep(sessionId, 3, 'action', '⚡', 'Gọi Weather API',
    `Đang kiểm tra thời tiết tại ${parsed.city} (lat: ${parsed.latitude}, lon: ${parsed.longitude})...`,
    'Open-Meteo Weather API'
  );

  const weather = await getWeather(parsed.latitude, parsed.longitude, parsed.date);

  // Step 4: 👁️ OBSERVATION — Weather result
  await pushStep(sessionId, 4, 'observation', '👁️', 'Kết quả thời tiết',
    weather.summary,
    'Open-Meteo Weather API',
    {
      weather: {
        condition: weather.condition,
        description: weather.description,
        maxTemp: weather.maxTemp,
        minTemp: weather.minTemp,
        rainProbability: weather.rainProbability,
        weatherCode: weather.weatherCode,
      },
    }
  );

  // ──────────────────────────────────────────────
  // Step 5: 🧠 THOUGHT — Reasoning based on weather
  // ──────────────────────────────────────────────
  let reasoning, searchQuery, category;

  if (weather.isSunny) {
    reasoning = `Thời tiết tại ${parsed.city} vào ${parsed.dateDescription}: ${weather.description}, nhiệt độ ${weather.maxTemp}°C. Xác suất mưa chỉ ${weather.rainProbability}% → Trời NẮNG ĐẸP. Theo yêu cầu, khi trời nắng sẽ tìm: ${parsed.sunnyAction}`;
    searchQuery = `${parsed.sunnyAction} ${parsed.city} tốt nhất`;
    category = parsed.sunnyAction;
  } else {
    reasoning = `Thời tiết tại ${parsed.city} vào ${parsed.dateDescription}: ${weather.description}, xác suất mưa ${weather.rainProbability}% → Có khả năng MƯA. Theo yêu cầu, khi trời mưa sẽ tìm: ${parsed.rainyAction}`;
    searchQuery = `${parsed.rainyAction} ${parsed.city} tốt nhất`;
    category = parsed.rainyAction;
  }

  await pushStep(sessionId, 5, 'thought', '🧠', 'Suy luận điều kiện', reasoning);

  // ──────────────────────────────────────────────
  // Step 6: ⚡ ACTION — Search for locations
  // ──────────────────────────────────────────────
  await pushStep(sessionId, 6, 'action', '⚡', 'Tìm kiếm địa điểm',
    `Đang tìm kiếm: "${searchQuery}"`,
    'Google Search'
  );

  const searchResults = await searchWeb(searchQuery);

  // Step 7: 👁️ OBSERVATION — Search results
  await pushStep(sessionId, 7, 'observation', '👁️', 'Kết quả tìm kiếm',
    searchResults,
    'Google Search'
  );

  // ──────────────────────────────────────────────
  // Step 8: 🧠 THOUGHT — LLM Reasoning about plan approach
  // ──────────────────────────────────────────────
  await pushStep(sessionId, 8, 'thought', '🧠', 'Tổng hợp kế hoạch',
    'Đang phân tích dữ liệu và lên chiến lược cho kế hoạch sự kiện...'
  );

  // Ask LLM to explain its reasoning BEFORE generating the final plan
  const reasoningPrompt = `Bạn là AI Agent đang suy luận để lên kế hoạch sự kiện. Dựa trên dữ liệu sau, hãy giải thích ngắn gọn (3-5 câu) chiến lược bạn sẽ dùng để lên kế hoạch:

Yêu cầu: ${message}
Thời tiết: ${weather.summary}  
Điều kiện: ${weather.isSunny ? 'NẮNG' : 'MƯA'} → ${category}
Kết quả tìm kiếm: ${searchResults.substring(0, 500)}

Hãy giải thích:
1. Tại sao chọn hoạt động này (dựa trên thời tiết)
2. Tiêu chí chọn địa điểm
3. Cách sắp xếp lịch trình hợp lý

Chỉ viết phần giải thích suy luận, KHÔNG viết kế hoạch chi tiết. Viết ngắn gọn bằng tiếng Việt.`;

  const planReasoning = await callClaude(reasoningPrompt, '', 512);

  // Push the actual LLM reasoning to Firebase — this is the real CoT!
  await pushStep(sessionId, 9, 'thought', '🧠', 'Chiến lược lập kế hoạch',
    planReasoning
  );

  // Step 10: Generating final answer
  await pushStep(sessionId, 10, 'action', '⚡', 'Viết kế hoạch chi tiết',
    'Đang sử dụng Claude AI để viết kế hoạch sự kiện đầy đủ...',
    'Claude AI'
  );

  const finalPrompt = `Bạn là AI Agent lên kế hoạch sự kiện. Hãy tổng hợp tất cả thông tin và viết kế hoạch chi tiết bằng Markdown.

**Yêu cầu gốc:** ${message}

**Thời tiết:** ${weather.summary}

**Suy luận:** ${reasoning}

**Chiến lược:** ${planReasoning}

**Kết quả tìm kiếm:** ${searchResults}

**Loại hoạt động:** ${category}
**Thành phố:** ${parsed.city}
**Ngày:** ${parsed.dateDescription}

Hãy viết kế hoạch sự kiện chi tiết bao gồm:
1. 📋 **Tóm tắt thời tiết** - Mô tả ngắn gọn tình hình thời tiết
2. 🧠 **Giải thích suy luận** - Tại sao chọn hoạt động này dựa trên thời tiết
3. 📍 **Gợi ý 3 địa điểm cụ thể** - Mỗi địa điểm gồm: tên, mô tả, điểm nổi bật, lý do phù hợp
4. 🗓️ **Lịch trình gợi ý** - Lịch trình chi tiết cho cả ngày (giờ cụ thể)
5. 💡 **Lưu ý và mẹo** - Tips hữu ích cho nhóm

Viết bằng tiếng Việt, dùng emoji phù hợp, format markdown đẹp.`;

  const finalAnswer = await callClaude(finalPrompt, '', 2048);

  // ──────────────────────────────────────────────
  // Step 11: ✅ COMPLETE
  // ──────────────────────────────────────────────
  await pushStep(sessionId, 11, 'final', '✅', 'Hoàn tất!',
    'Kế hoạch sự kiện đã được tạo thành công!'
  );

  return {
    success: true,
    finalAnswer,
  };
}

module.exports = { runAgent };
