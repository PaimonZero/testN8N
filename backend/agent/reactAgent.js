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
const { callLLM } = require('../services/llm');
const { getWeather } = require('../services/weather');
const { searchWeb } = require('../services/search');
const { getCoordinates } = require('../services/geocoding');

/**
 * Run the ReAct agent for event planning based on weather.
 *
 * @param {string} message - User's message
 * @param {string} sessionId - Unique session ID for Firebase streaming
 * @returns {object} - { success, finalAnswer }
 */
async function runAgent(message, sessionId, llmModel = 'claude', history = [], userKeys = {}) {
  // ──────────────────────────────────────────────
  // Step 1: 🧠 THOUGHT — Analyzing the request
  // ──────────────────────────────────────────────
  await pushStep(sessionId, 1, 'thought', '🧠', 'Phân tích yêu cầu',
    `Đang phân tích yêu cầu của bạn: "${message}"${history.length > 0 ? ` (Có ${history.length} tin nhắn cũ)` : ''}`
  );

  const historyText = history.length > 0 
    ? history.map(h => `${h.role === 'user' ? 'Người dùng' : 'AI'}: ${h.content}`).join('\n')
    : 'Không có lịch sử.';

  // Step 2: 🧠 THOUGHT — Parse request with LLM
  const parsePrompt = `Bạn là bộ phân tích yêu cầu cho ứng dụng du lịch & lên kế hoạch đi chơi theo thời tiết. 
Dưới đây là lịch sử chat:
${historyText}

Tin nhắn MỚI NHẤT của người dùng: "${message}"

---

**NGUYÊN TẮC XÁC ĐỊNH isRelevant:**

isRelevant = TRUE (có liên quan) nếu câu hỏi thuộc MỘT TRONG CÁC TRƯỜNG HỢP SAU:
- Hỏi về thời tiết tại địa điểm nào đó ("thời tiết Hà Nội", "trời có mưa không")
- Hỏi nên làm gì / đi đâu / chơi gì tại một địa điểm ("hôm nay ở HN làm gì", "Đà Lạt đi đâu")
- Lên kế hoạch du lịch, dã ngoại, team building, picnic
- Tìm địa điểm ăn uống, cà phê, vui chơi, tham quan tại một thành phố
- Hỏi về hoạt động ngoài trời hay trong nhà theo thời tiết
- Hỏi gợi ý địa điểm, quán ăn, quán cafe theo địa điểm
- Câu hỏi tiếp nối (follow-up) dựa theo lịch sử chat về du lịch/đi chơi

isRelevant = FALSE (lạc đề) chỉ khi câu hỏi HOÀN TOÀN không liên quan:
- Toán học, Vật lý, Hóa học, Lịch sử (không phải du lịch)
- Lập trình, code, debug kỹ thuật máy tính
- Chính trị, pháp luật, y tế không liên quan du lịch
- Câu hỏi triết học, thần thoại thuần túy
- Các câu hỏi không liên quan đến du lịch/đi chơi

**VÍ DỤ CỤ THỂ:**
- "Hôm nay ở Hà Nội nên làm gì?" → isRelevant: true, city: "Hà Nội"
- "Cuối tuần ở Đà Lạt thì đi đâu?" → isRelevant: true, city: "Đà Lạt"  
- "Thời tiết Vũng Tàu thứ 7 tới" → isRelevant: true, city: "Vũng Tàu"
- "Gợi ý quán ăn ngon ở Hội An" → isRelevant: true, city: "Hội An"
- "Giải phương trình bậc 2" → isRelevant: false
- "Tôi muốn đi chơi" (không có địa điểm, không có context) → isRelevant: true, city: suy luận từ lịch sử hoặc để trống

**LƯU Ý ĐIỀU PHỐI (ORCHESTRATION):**
1. Với câu follow-up ("còn nếu trời mưa?", "vậy tôi nên mang gì?"), bắt buộc dựa lịch sử để điền city, date.
2. Lập kế hoạch thực thi (executionPlan) để tối ưu:
   - "useGeocoding": false nếu địa điểm không đổi so với lượt trước.
   - "useWeather": false nếu địa điểm và ngày không đổi so với lượt trước.
   - Nếu "useGeocoding" là false, trích xuất tọa độ cũ vào "reusedGeo".
   - Nếu "useWeather" là false, trích xuất tóm tắt thời tiết cũ vào "reusedWeather".
3. Nếu không có city rõ ràng, hãy suy luận từ context lịch sử chat. Nếu thực sự không có, để city = "".

**HÃY CHỈ TRẢ VỀ JSON. KHÔNG VIẾT LỜI DẪN. KHÔNG CÓ MARKDOWN CODE BLOCKS.**

Format JSON yêu cầu:
{
  "isRelevant": boolean,
  "city": "tên địa danh (rỗng nếu không lquan hoặc không thể suy luận)",
  "date": "ngày (rỗng nếu không lquan, dùng today nếu nói 'hôm nay')",
  "dateDescription": "mô tả ngày bằng tiếng Việt",
  "request": "yêu cầu chính của người dùng",
  "sunnyAction": "hành động gợi ý khi trời nắng",
  "rainyAction": "hành động gợi ý khi trời mưa",
  "executionPlan": {
    "useGeocoding": boolean,
    "useWeather": boolean,
    "reusedGeo": { "lat": number, "lon": number, "name": "string" },
    "reusedWeather": "string"
  }
}

Ngày hôm nay là: ${new Date().toISOString().split('T')[0]}`;

  const parseResponse = await callLLM(parsePrompt, '', 1024, llmModel, userKeys);
  console.log('[AGENT] Raw LLM Parse Response:', parseResponse);

  // Extract JSON from response — handle potential markdown blocks or chatter
  const jsonMatch = parseResponse.match(/\{[\s\S]*\}/);
  let parsed;
  
  if (!jsonMatch) {
    console.warn('[AGENT] No JSON structure found in LLM response:', parseResponse);
    // Fallback: If it's a plain text refusal or error, treat as off-topic
    parsed = { isRelevant: false, city: "", request: parseResponse };
  } else {
    try {
      // Find the last closing brace to ensure we capture the full object if multiple exist
      const lastBrace = jsonMatch[0].lastIndexOf('}');
      const cleanedJson = jsonMatch[0].substring(0, lastBrace + 1);
      parsed = JSON.parse(cleanedJson);
    } catch(e) {
      console.warn('[AGENT] Failed to parse extracted JSON:', e.message, 'Raw match:', jsonMatch[0]);
      parsed = { isRelevant: false, city: "", request: jsonMatch[0] };
    }
  }

  await pushStep(sessionId, 2, 'thought', '🧠', 'Đã phân tích ngôn ngữ',
    parsed.isRelevant
      ? `Điểm đến: **${parsed.city || 'Chưa xác định'}**\nYêu cầu chính: ${parsed.request}`
      : `Lạc đề: Câu hỏi không liên quan đến du lịch/đi chơi.`
  );

  // GUARDRAIL: Off-topic early exit — only reject if explicitly marked off-topic
  if (!parsed.isRelevant) {
    const finalOffTopic = await callLLM(
      `Người dùng hỏi: "${message}". Câu hỏi này không thuộc lĩnh vực du lịch hay lên kế hoạch đi chơi theo thời tiết. Hãy từ chối lịch sự, giải thích bạn chỉ hỗ trợ lên kế hoạch du lịch/sự kiện ngoài trời, và gợi ý một số loại câu hỏi phù hợp.`,
      '', 512, llmModel, userKeys
    );
    await pushStep(sessionId, 3, 'final_answer', '🛑', 'Từ chối (Guardrail)', finalOffTopic);
    return { success: true, finalAnswer: finalOffTopic };
  }

  // If relevant but no city, ask user to clarify
  if (!parsed.city) {
    const noCityReply = await callLLM(
      `Người dùng muốn lên kế hoạch du lịch/đi chơi nhưng chưa nêu địa điểm cụ thể: "${message}". Hãy thân thiện hỏi lại họ muốn đi địa điểm nào để tôi có thể kiểm tra thời tiết và đưa ra gợi ý phù hợp.`,
      '', 256, llmModel, userKeys
    );
    await pushStep(sessionId, 3, 'final_answer', '📍', 'Cần thêm thông tin', noCityReply);
    return { success: true, finalAnswer: noCityReply };
  }

  // ──────────────────────────────────────────────
  // Step 3: ⚡ ACTION — Call Geocoding API (Conditional)
  // ──────────────────────────────────────────────
  let geo;
  if (parsed.executionPlan?.useGeocoding === false && parsed.executionPlan?.reusedGeo?.lat) {
    geo = {
      latitude: parsed.executionPlan.reusedGeo.lat,
      longitude: parsed.executionPlan.reusedGeo.lon,
      placeName: parsed.executionPlan.reusedGeo.name
    };
    await pushStep(sessionId, 3, 'thought', '🧠', 'Tái sử dụng vị trí',
      `📍 Đã có toạ độ của ${geo.placeName} từ lượt trước, bỏ qua bước Geocoding.`
    );
  } else {
    await pushStep(sessionId, 3, 'action', '⚡', 'Tìm toạ độ (Geocoding)',
      `Đang dùng Mapbox tìm toạ độ chính xác cho địa danh: "${parsed.city}"...`,
      'Mapbox Geocoding API'
    );
    geo = await getCoordinates(parsed.city, userKeys);
    await pushStep(sessionId, 4, 'observation', '👁️', 'Toạ độ bản đồ',
      `Tìm thấy: ${geo.placeName}\nVĩ độ (Lat): ${geo.latitude}\nKinh độ (Lon): ${geo.longitude}`,
      'Mapbox Geocoding API'
    );
  }

  // ──────────────────────────────────────────────
  // Step 5: ⚡ ACTION — Call Weather API (Conditional)
  // ──────────────────────────────────────────────
  let weather;
  if (parsed.executionPlan?.useWeather === false && parsed.executionPlan?.reusedWeather) {
    // We need to parse enough of the reused weather to decide if it's sunny
    const weatherText = parsed.executionPlan.reusedWeather.toLowerCase();
    const isSunny = weatherText.includes('nắng') || weatherText.includes('quang');
    
    weather = {
      summary: parsed.executionPlan.reusedWeather,
      isSunny: isSunny,
      description: parsed.executionPlan.reusedWeather,
      maxTemp: '?', // Optional since it's in the summary
      rainProbability: isSunny ? 0 : 70
    };

    await pushStep(sessionId, 5, 'thought', '🧠', 'Tái sử dụng thời tiết',
      `🌤️ Sử dụng dữ liệu thời tiết đã có cho ${parsed.dateDescription}, bỏ qua bước gọi API.`
    );
  } else {
    await pushStep(sessionId, 5, 'action', '⚡', 'Gọi Weather API',
      `Đang kiểm tra thời tiết tại ${geo.placeName} (lat: ${geo.latitude}, lon: ${geo.longitude})...`,
      'Open-Meteo Weather API'
    );
    weather = await getWeather(geo.latitude, geo.longitude, parsed.date);
    
    await pushStep(sessionId, 6, 'observation', '👁️', 'Kết quả thời tiết',
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
  }

  // ──────────────────────────────────────────────
  // Step 7: 🧠 THOUGHT — Reasoning based on weather
  // ──────────────────────────────────────────────
  let reasoning, searchQuery, category;

  if (weather.isSunny) {
    reasoning = `Thời tiết tại ${parsed.city} vào ${parsed.dateDescription}: ${weather.description}. Xác suất mưa thấp → Trời NẮNG ĐẸP. Theo yêu cầu, khi trời nắng sẽ tìm: ${parsed.sunnyAction}`;
    searchQuery = `${parsed.sunnyAction} ${parsed.city} tốt nhất`;
    category = parsed.sunnyAction;
  } else {
    reasoning = `Thời tiết tại ${parsed.city} vào ${parsed.dateDescription}: ${weather.description}. Xác suất mưa hoặc điều kiện → Có khả năng MƯA/MÂY. Theo yêu cầu, khi trời mưa sẽ tìm: ${parsed.rainyAction}`;
    searchQuery = `${parsed.rainyAction} ${parsed.city} tốt nhất`;
    category = parsed.rainyAction;
  }

  await pushStep(sessionId, 7, 'thought', '🧠', 'Suy luận điều kiện', reasoning);

  // ──────────────────────────────────────────────
  // Step 8: ⚡ ACTION — Search for locations
  // ──────────────────────────────────────────────
  await pushStep(sessionId, 8, 'action', '⚡', 'Tìm kiếm địa điểm',
    `Đang tìm kiếm: "${searchQuery}"`,
    'Google Search'
  );

  const searchResults = await searchWeb(searchQuery, userKeys);

  // Step 9: 👁️ OBSERVATION — Search results
  await pushStep(sessionId, 9, 'observation', '👁️', 'Kết quả tìm kiếm',
    searchResults,
    'Google Search'
  );

  // ──────────────────────────────────────────────
  // Step 10: 🧠 THOUGHT — LLM Reasoning about plan approach
  // ──────────────────────────────────────────────
  await pushStep(sessionId, 10, 'thought', '🧠', 'Tổng hợp kế hoạch',
    'Đang phân tích dữ liệu và lên chiến lược cho kế hoạch sự kiện...'
  );

  // Ask LLM to explain its reasoning BEFORE generating the final plan
  const reasoningPrompt = `Bạn là AI Agent đang suy luận để lên kế hoạch sự kiện.
Dưới đây là lịch sử chat:
${historyText}

Dựa trên dữ liệu sau, hãy giải thích ngắn gọn (3-5 câu) chiến lược bạn sẽ dùng để lên kế hoạch:

Yêu cầu mới nhất: ${message}
Thời tiết: ${weather.summary}  
Điều kiện: ${weather.isSunny ? 'NẮNG' : 'MƯA'} → ${category}
Kết quả tìm kiếm: ${searchResults.substring(0, 500)}

Hãy giải thích:
1. Tại sao chọn hoạt động này (dựa trên thời tiết và lịch sử trao đổi)
2. Tiêu chí chọn địa điểm
3. Cách sắp xếp lịch trình hợp lý

Chỉ viết phần giải thích suy luận, KHÔNG viết kế hoạch chi tiết. Viết ngắn gọn bằng tiếng Việt.`;

  const planReasoning = await callLLM(reasoningPrompt, '', 512, llmModel, userKeys);

  // Push the actual LLM reasoning to Firebase — this is the real CoT!
  await pushStep(sessionId, 11, 'thought', '🧠', 'Chiến lược lập kế hoạch',
    planReasoning
  );

  // Step 12: Generating final answer
  const aiName = llmModel === 'gemini' ? 'Gemini AI' : 'Claude AI';
  await pushStep(sessionId, 12, 'action', '⚡', 'Viết kế hoạch chi tiết',
    `Đang sử dụng ${aiName} để viết kế hoạch sự kiện đầy đủ...`,
    aiName
  );

  const finalPrompt = `Bạn là AI Agent lên kế hoạch sự kiện. Hãy tổng hợp tất cả thông tin và viết kế hoạch chi tiết bằng Markdown.
  
Lịch sử trao đổi trước đó:
${historyText}

**Yêu cầu mới nhất:** ${message}

**Thời tiết:** ${weather.summary}

**Suy luận:** ${reasoning}

**Chiến lược:** ${planReasoning}

**Kết quả tìm kiếm:** ${searchResults}

**Loại hoạt động:** ${category}
**Thành phố:** ${parsed.city}
**Ngày:** ${parsed.dateDescription}

Hãy viết kế hoạch sự kiện chi tiết bao gồm:
1. 📋 **Tóm tắt thời tiết** - Mô tả ngắn gọn tình hình thời tiết
2. 🧠 **Giải thích suy luận** - Tại sao chọn hoạt động này dựa trên thời tiết và lịch sử
3. 📍 **Gợi ý 3 địa điểm cụ thể** - Mỗi địa điểm gồm: tên, mô tả, điểm nổi bật, lý do phù hợp
4. 🗓️ **Lịch trình gợi ý** - Lịch trình chi tiết cho cả ngày (giờ cụ thể)
5. 💡 **Lưu ý và mẹo** - Tips hữu ích cho nhóm

Viết bằng tiếng Việt, dùng emoji phù hợp, format markdown đẹp.`;

  const finalAnswer = await callLLM(finalPrompt, '', 2048, llmModel, userKeys);

  // ──────────────────────────────────────────────
  // Step 13: ✅ COMPLETE
  // ──────────────────────────────────────────────
  await pushStep(sessionId, 13, 'final', '✅', 'Hoàn tất!',
    'Kế hoạch sự kiện đã được tạo thành công!'
  );

  return {
    success: true,
    finalAnswer,
  };
}

module.exports = { runAgent };
