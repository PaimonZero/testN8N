/**
 * Automated Test Suite cho ReAct Agent (V1, V2, V3)
 * Chạy chay bằng Node.js: node test/scenarios.js
 */

const ENDPOINT = 'http://localhost:3000/api/chat';

const SCENARIOS = [
  {
    name: '1. Normal Case',
    message: 'Cuối tuần này team 10 người mình đi Vũng Tàu, muốn hoạt động gì đó khoẻ khoắn ngoài trời',
    expectedFocus: 'Tìm toạ độ Vũng Tàu, lấy thời tiết cuối tuần, đề xuất team building'
  },
  {
    name: '2. Edge Case (Địa danh lạ, thời gian xa)',
    message: 'Tư vấn chỗ camping ở Mù Cang Chải ngày 30 tháng 12 năm 2029',
    expectedFocus: 'Mapbox phải tìm ra Mù Cang Chải. Thời tiết phải báo lỗi hoặc lấy dự báo xa nhất có thể. LLM không được sập.'
  },
  {
    name: '3. Abnormal Case (Nhiễu loạn)',
    message: '@#$(*@ đi đâu cho nóng nực đây @$*@#',
    expectedFocus: 'LLM nên từ chối hoặc nhận diện được intent siêu mờ. Không được vỡ JSON.'
  },
  {
    name: '4. Off-topic Case (Lạc đề)',
    message: 'Giải phương trình bậc 2: x^2 - 4x + 4 = 0',
    expectedFocus: 'Agent V3 phải từ chối khéo vì đây là chatbot thời tiết, không search Google tào lao.'
  }
];

async function runTest(scenario, version) {
  console.log(`\n▶️ [${version.toUpperCase()}] Thử nghiệm: ${scenario.name}`);
  console.log(`Nhập: "${scenario.message}"`);
  
  const startTime = Date.now();
  const sessionId = crypto.randomUUID();

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: scenario.message, sessionId, version })
    });

    const data = await response.json();
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    if (!response.ok || !data.success) {
      console.log(`❌ THẤT BẠI (${duration}s): ${data.error || 'Unknown error'}`);
    } else {
      console.log(`✅ HOÀN THÀNH (${duration}s)`);
      console.log(`Kết quả trích xuất: \n  ${data.finalAnswer.substring(0, 150).replace(/\n/g, ' ')}...`);
    }
  } catch (error) {
    console.log(`🚨 CRASH: ${error.message}`);
  }
}

async function runAll() {
  console.log("=========================================");
  console.log(" BẮT ĐẦU CHẠY TEST SUITE (V1, V2, V3)    ");
  console.log(" Chú ý: Cần bật server.js ở port 3000!   ");
  console.log("=========================================\n");

  // Run V3 Tests mapping
  console.log("--- BẢN V3: CẦN HOÀN HẢO ---");
  for (const s of SCENARIOS) {
    await runTest(s, 'v3');
  }

  console.log("\n--- BẢN V2: SẼ CÓ LỖI DO THIẾU GUARDRAIL ---");
  await runTest(SCENARIOS[2], 'v2'); // Abnormal

  console.log("\n--- BẢN V1: BASELINE TỪ CHỐI TOOL ---");
  await runTest(SCENARIOS[0], 'v1'); // Normal

  console.log("\n✅ Test Suite kết thúc.");
}

runAll();
