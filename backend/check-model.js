require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function listAllModels() {
  // Sử dụng v1beta để xem được cả các model mới nhất đang thử nghiệm
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.error("Lỗi API:", data.error.message);
      return;
    }

    console.log("--- DANH SÁCH MODELS KHẢ DỤNG ---");
    console.table(data.models.map(model => ({
      ID: model.name.replace('models/', ''),
      DisplayName: model.displayName,
      Methods: model.supportedGenerationMethods.join(', ')
    })));

  } catch (error) {
    console.error("Không thể kết nối API:", error.message);
  }
}

listAllModels();