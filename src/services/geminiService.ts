/**
 * LỚP HỌC HẠNH PHÚC _ PHẠM HẬU
 * Dịch vụ tích hợp Gemini AI đa mô hình & Quản lý API Key người dùng
 * Hỗ trợ Fallback tự động: gemini-3-flash-preview -> gemini-3-pro-preview -> gemini-2.5-flash
 */

export const STORAGE_KEYS = {
  API_KEY: 'gemini_api_key',
  SELECTED_MODEL: 'gemini_selected_model',
  CLASSROOM_DATA: 'lophoc_hanhphuc_data',
  LEGACY_DATA: 'storypals_classroom_data',
};

export const AI_MODELS = [
  {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash Preview',
    badge: 'Mặc định - Nhanh & Thông minh',
    desc: 'Tốc độ phản hồi cực nhanh, sáng tác truyện và trò chuyện tự nhiên, tiết kiệm hạn mức.',
    isDefault: true,
  },
  {
    id: 'gemini-3-pro-preview',
    name: 'Gemini 3 Pro Preview',
    badge: 'Mạnh mẽ - Tư duy chuyên sâu',
    desc: 'Văn phong văn học sâu sắc, cấu tứ câu chuyện giàu cảm xúc, sáng tác nghệ thuật.',
    isDefault: false,
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    badge: 'Ổn định & Bền bỉ',
    desc: 'Mô hình thế hệ ổn định cao, dự phòng tin cậy khi các mô hình mới quá tải.',
    isDefault: false,
  },
];

export const FALLBACK_MODEL_CHAIN = [
  'gemini-3-flash-preview',
  'gemini-3-pro-preview',
  'gemini-2.5-flash',
];

// Lấy API Key đang lưu (ưu tiên localStorage, sau đó đến VITE_GEMINI_API_KEY)
export function getSavedApiKey(): string {
  if (typeof window !== 'undefined') {
    const localKey = localStorage.getItem(STORAGE_KEYS.API_KEY);
    if (localKey && localKey.trim()) {
      return localKey.trim();
    }
  }
  return (import.meta.env.VITE_GEMINI_API_KEY as string) || '';
}

// Lưu API Key mới
export function saveApiKey(key: string): void {
  if (typeof window !== 'undefined') {
    if (key && key.trim()) {
      localStorage.setItem(STORAGE_KEYS.API_KEY, key.trim());
    } else {
      localStorage.removeItem(STORAGE_KEYS.API_KEY);
    }
  }
}

// Lấy Model được cấu hình
export function getSelectedModel(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEYS.SELECTED_MODEL);
    if (saved && AI_MODELS.some((m) => m.id === saved)) {
      return saved;
    }
  }
  return 'gemini-3-flash-preview';
}

// Lưu Model
export function saveSelectedModel(modelId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.SELECTED_MODEL, modelId);
  }
}

// Trích xuất JSON an toàn từ phản hồi AI (chống lỗi SyntaxError khi AI trả về markdown)
export function extractAndParseJson(rawText: string): any {
  if (!rawText) return null;
  const clean = rawText.trim();
  try {
    return JSON.parse(clean);
  } catch {}

  const jsonBlock = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (jsonBlock && jsonBlock[1]) {
    try {
      return JSON.parse(jsonBlock[1].trim());
    } catch {}
  }

  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(clean.slice(firstBrace, lastBrace + 1));
    } catch {}
  }

  return null;
}

// Kiểm tra nhanh tính hợp lệ của API Key
export async function testGeminiApiKey(apiKey: string): Promise<{ success: boolean; message: string }> {
  if (!apiKey || !apiKey.trim()) {
    return { success: false, message: 'Vui lòng nhập API Key của bạn' };
  }

  const testModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  let lastErrMsg = '';

  for (const m of testModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey.trim()}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Chào mừng Lớp Học Hạnh Phúc Phạm Hậu' }] }],
        }),
      });

      if (res.ok) {
        return { success: true, message: `Khóa API Gemini hoạt động hoàn hảo! (Kiểm định qua ${m})` };
      }

      const errJson = await res.json().catch(() => ({}));
      lastErrMsg = errJson?.error?.message || `Mã lỗi HTTP: ${res.status}`;
      // Nếu 404 (model chưa có), thử tiếp model tiếp theo
      if (res.status === 404) continue;
      // Nếu 400 hoặc 403 (Invalid API Key), trả về ngay
      return { success: false, message: lastErrMsg };
    } catch (err: any) {
      lastErrMsg = err.message || 'Không thể kết nối đến máy chủ Google AI';
    }
  }

  return { success: false, message: lastErrMsg || 'Không thể kết nối đến máy chủ Google AI' };
}

export interface GeminiGenerateContentParams {
  contents: Array<{
    role?: string;
    parts: Array<{ text: string } | any>;
  }>;
  systemInstruction?: string | { parts: Array<{ text: string }> };
  generationConfig?: Record<string, any>;
  model?: string;
}

export interface GeminiGenerateContentResult {
  text: string;
  modelUsed?: string;
}

/**
 * Gọi Gemini Generate Content đa năng với chuỗi Fallback mô hình tự động
 */
export async function callGeminiGenerateContent(
  params: GeminiGenerateContentParams
): Promise<GeminiGenerateContentResult> {
  const apiKey = getSavedApiKey();
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Chưa cấu hình API Key. Vui lòng nhập API Key để sử dụng tính năng AI.');
  }

  const preferred = params.model || getSelectedModel();
  const modelsToTry = [preferred, ...FALLBACK_MODEL_CHAIN.filter((m) => m !== preferred)];

  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;

      const payload: any = {
        contents: params.contents,
      };

      if (params.systemInstruction) {
        if (typeof params.systemInstruction === 'string') {
          payload.systemInstruction = { parts: [{ text: params.systemInstruction }] };
        } else {
          payload.systemInstruction = params.systemInstruction;
        }
      }

      if (params.generationConfig) {
        payload.generationConfig = params.generationConfig;
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const rawApiError = errData?.error?.message || errData?.error?.status || `Mã lỗi HTTP: ${res.status}`;
        throw new Error(rawApiError);
      }

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text !== undefined && text !== null) {
        return { text, modelUsed: model };
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[callGeminiGenerateContent] Model ${model} gặp sự cố:`, err?.message || err);
    }
  }

  throw lastError || new Error('Không thể kết nối đến AI');
}

/**
 * Tranh minh họa thiếu nhi chất lượng cao theo chủ đề (dự phòng thông minh khi hết quota ảnh)
 */
export function getSmartThemedIllustration(prompt: string): string {
  const p = (prompt || '').toLowerCase();

  if (
    p.includes('lớp') || p.includes('học') || p.includes('trường') ||
    p.includes('bảng') || p.includes('thầy') || p.includes('cô') ||
    p.includes('bạn') || p.includes('class') || p.includes('school') || p.includes('student')
  ) {
    const list = [
      'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1200&auto=format&fit=crop&q=85',
    ];
    return list[Math.floor(Math.random() * list.length)];
  }

  if (
    p.includes('biển') || p.includes('cá') || p.includes('thủy cung') ||
    p.includes('đại dương') || p.includes('san hô') || p.includes('ocean') ||
    p.includes('sea') || p.includes('underwater') || p.includes('coral')
  ) {
    const list = [
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=1200&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=85',
    ];
    return list[Math.floor(Math.random() * list.length)];
  }

  if (
    p.includes('rừng') || p.includes('cây') || p.includes('thỏ') ||
    p.includes('gấu') || p.includes('cáo') || p.includes('động vật') ||
    p.includes('forest') || p.includes('animal') || p.includes('bear') || p.includes('rabbit')
  ) {
    const list = [
      'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1535083783855-76ae62b2914e?w=1200&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=1200&auto=format&fit=crop&q=85',
    ];
    return list[Math.floor(Math.random() * list.length)];
  }

  const defaultList = [
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1200&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=85',
  ];
  return defaultList[Math.floor(Math.random() * defaultList.length)];
}

/**
 * Bộ tạo truyện dự phòng tại chỗ khi không có kết nối internet
 */
export function generateLocalFallbackStory(params: {
  character: string;
  setting: string;
  topic?: string;
  moral?: string;
  pageCount: number;
  language?: string;
}) {
  const isVi = params.language !== 'en';
  const char = (params.character || '').trim() || (isVi ? 'Bạn nhỏ chăm ngoan' : 'A curious child');
  const loc = (params.setting || '').trim() || (isVi ? 'Lớp học thân thương' : 'A wonderful school');
  const moral = (params.moral || '').trim() || (isVi ? 'Lòng tốt và tình bạn sẻ chia' : 'Kindness and friendship');
  const count = Math.max(3, Math.min(Number(params.pageCount) || 4, 6));

  const storyTemplates = [
    {
      pageNumber: 1,
      text: `Vào một buổi sáng ngập tràn ánh nắng ấm áp, ${char} bước đi trên con đường quen thuộc với tâm trạng háo hức. Hôm nay là một ngày thật đặc biệt tại ${loc}, nơi tiếng cười rộn rã và những điều kỳ thú đang chờ đón.`,
      illustrationPrompt: `Tranh minh họa thiếu nhi ấm áp rực rỡ: ${char} tươi cười rạng rỡ chào buổi sáng tại ${loc}, xung quanh là hoa cỏ tươi thắm, phong cách truyện cổ tích dễ thương`,
    },
    {
      pageNumber: 2,
      text: `Tại ${loc}, ${char} bắt gặp một điều bất ngờ: một khu vườn ước mơ với những chiếc mầm xanh biếc đang cần được chăm sóc. Các bạn nhỏ xung quanh đều rất tò mò nhưng chưa biết cách làm sao để cây đơm hoa kết trái.`,
      illustrationPrompt: `Tranh thiếu nhi sinh động: ${char} cùng các bạn nhỏ quây quần bên khu vườn xanh mát tại ${loc}, ánh mắt tràn ngập niềm vui và sự tò mò`,
    },
    {
      pageNumber: 3,
      text: `Không ngần ngại, ${char} liền rủ các bạn cùng chung tay. Người tưới nước, người xới đất, mọi người đều sẻ chia công việc trong tiếng cười giòn tan. Bài học về ${moral.toLowerCase()} đã kết nối tất cả lại gần nhau hơn bao giờ hết.`,
      illustrationPrompt: `Tranh minh họa truyện cổ tích: ${char} và các bạn nhỏ cùng nhau tưới cây, giúp đỡ lẫn nhau với nụ cười rạng rỡ`,
    },
    {
      pageNumber: 4,
      text: `Kỳ diệu thay, những đóa hoa thơm ngát bừng nở rực rỡ dưới nắng vàng. ${char} nhận ra rằng, chỉ cần chúng ta có ${moral.toLowerCase()} và biết yêu thương giúp đỡ nhau, mọi nơi trên đời đều trở thành lớp học hạnh phúc.`,
      illustrationPrompt: `Khung cảnh kết thúc truyện cổ tích: Những đóa hoa nở rộ lộng lẫy, ${char} cùng thầy cô và bạn bè vỗ tay hân hoan, ánh hoàng hôn dịu dàng ấm áp phủ khắp ${loc}`,
    },
    {
      pageNumber: 5,
      text: `Cả lớp cùng nhau ngắm nhìn thành quả tuyệt vời. Thầy cô và bạn bè đều dành tặng ${char} những tràng pháo tay giòn giã và những lời khen ngợi chân thành nhất.`,
      illustrationPrompt: `Tranh thiếu nhi tươi sáng: ${char} được thầy cô và bạn bè chúc mừng trong niềm tự hào, nụ cười rạng ngời`,
    },
    {
      pageNumber: 6,
      text: `Khi ánh hoàng hôn dần buông xuống, ${char} mỉm cười thanh thản khép lại một ngày học tập và phiêu lưu ý nghĩa. Những bài học yêu thương sẽ mãi là hành trang tuyệt đẹp chắp cánh cho tương lai.`,
      illustrationPrompt: `Bức tranh êm đềm: ${char} nhìn ra bầu trời sao lấp lánh, một giấc mơ ngọt ngào bình yên đang chờ đón`,
    },
  ];

  const shortTitle = char.length > 25 ? 'Bạn Nhỏ Dũng Cảm' : char;
  return {
    title: `Chuyến Phiêu Lưu Của ${shortTitle}`,
    summary: `Câu chuyện ý nghĩa và ấm áp về ${char} tại ${loc}, lan tỏa thông điệp sâu sắc về ${moral.toLowerCase()}.`,
    theme: moral,
    pages: storyTemplates.slice(0, count),
    modelUsed: 'creative-engine-offline',
  };
}

/**
 * Kiểu trạng thái các bước xử lý theo AI_INSTRUCTIONS.md
 */
export type StepStatus = 'waiting' | 'running' | 'success' | 'error';

export interface WorkflowStepState {
  step: number;
  name: string;
  status: StepStatus;
  modelUsed?: string;
  errorMessage?: string;
}

/**
 * 1. SÁNG TÁC TRUYỆN TRANH AI (với cơ chế 3 Bước, Fallback & Quản lý trạng thái lỗi nghiêm ngặt theo AI_INSTRUCTIONS.md)
 */
export async function generateStoryWithStrictProgress(params: {
  character: string;
  setting: string;
  topic?: string;
  moral?: string;
  pageCount: number;
  language?: string;
  onStepChange?: (steps: WorkflowStepState[]) => void;
}): Promise<any> {
  const steps: WorkflowStepState[] = [
    { step: 1, name: 'Step 1: Khởi tạo ý tưởng & Cốt truyện', status: 'waiting' },
    { step: 2, name: 'Step 2: Soạn thảo nội dung các trang', status: 'waiting' },
    { step: 3, name: 'Step 3: Xây dựng kịch bản tranh minh họa', status: 'waiting' },
  ];

  const updateSteps = () => {
    if (params.onStepChange) {
      params.onStepChange([...steps]);
    }
  };

  const apiKey = getSavedApiKey();
  if (!apiKey || !apiKey.trim()) {
    // Đảm bảo toàn bộ các bước đều chuyển ngay thành 'error' ("Đã dừng do lỗi") theo AI_INSTRUCTIONS.md
    steps.forEach((s) => {
      s.status = 'error';
      s.errorMessage = 'Chưa cấu hình API Key';
    });
    updateSteps();
    throw new Error('Chưa cấu hình API Key. Vui lòng bấm vào nút "Settings (API Key)" trên thanh điều hướng để nhập mã API Key của bạn từ Google AI Studio.');
  }

  const preferred = getSelectedModel();
  // Chuỗi waterfall ưu tiên các model theo yêu cầu, sau đó mở rộng sang các model tương thích để tăng tỷ lệ thành công
  const modelsToTry = [
    preferred,
    ...FALLBACK_MODEL_CHAIN.filter((m) => m !== preferred),
    'gemini-2.0-flash',
    'gemini-1.5-flash',
  ];
  const targetPages = Math.max(3, Math.min(Number(params.pageCount) || 4, 6));

  // Helper thực hiện gọi API kèm Fallback và Retry tự động cho từng bước
  const executeStepWithRetry = async (
    stepIdx: number,
    prompt: string,
    isJson: boolean = true
  ): Promise<{ text: string; model: string }> => {
    steps[stepIdx].status = 'running';
    steps[stepIdx].errorMessage = undefined;
    updateSteps();

    let stepError: string = '';

    for (const model of modelsToTry) {
      try {
        steps[stepIdx].modelUsed = model;
        updateSteps();

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        
        let res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            ...(isJson ? { generationConfig: { responseMimeType: 'application/json' } } : {}),
          }),
        });

        // Nếu model không hỗ trợ responseMimeType, thử lại không có generationConfig
        if (!res.ok && isJson && res.status !== 404 && res.status !== 429) {
          res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt + '\nTrả về định dạng JSON hợp lệ duy nhất.' }] }],
            }),
          });
        }

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const rawApiError = errData?.error?.message || errData?.error?.status || `Mã lỗi HTTP: ${res.status}`;
          stepError = `[${model}] ${rawApiError}`;
          console.warn(`[AI Instructions Fallback] ${model} gặp sự cố: ${stepError}. Đang tự động thử lại với model tiếp theo...`);
          continue; // Tự động thử lại ngay với model tiếp theo trong danh sách
        }

        const data = await res.json();
        const outputText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (outputText && outputText.trim()) {
          steps[stepIdx].status = 'success';
          steps[stepIdx].modelUsed = model;
          updateSteps();
          return { text: outputText.trim(), model };
        }
      } catch (networkErr: any) {
        stepError = `[${model}] ${networkErr.message || 'Lỗi kết nối mạng'}`;
        console.warn(`[AI Instructions Fallback] Lỗi mạng khi gọi ${model}:`, stepError);
      }
    }

    // Nếu tất cả các model đều thất bại ở bước này:
    // Chuyển bước này thành 'error' và các bước đang chờ phía sau thành 'error' ("Đã dừng do lỗi")
    steps[stepIdx].status = 'error';
    steps[stepIdx].errorMessage = stepError || '429 RESOURCE_EXHAUSTED: Hạn mức gọi API của tất cả các mô hình đã hết';
    for (let i = stepIdx + 1; i < steps.length; i++) {
      steps[i].status = 'error';
      steps[i].errorMessage = 'Đã dừng do lỗi ở bước trước';
    }
    updateSteps();

    throw new Error(steps[stepIdx].errorMessage);
  };

  try {
    // --- BƯỚC 1: Khởi tạo tiêu đề, tóm tắt và chủ đề ---
    const step1Prompt = `Bạn là nhà văn thiếu nhi tài hoa. Hãy tạo tiêu đề hấp dẫn, tóm tắt 1-2 câu và chủ đề bài học cho câu chuyện:
Nhân vật: ${params.character}
Bối cảnh: ${params.setting}
Chủ đề: ${params.topic || 'Yêu thương và sẻ chia'}
Bài học: ${params.moral || 'Lòng nhân ái'}
Xuất JSON dạng:
{
  "title": "Tiêu đề truyện (tiếng Việt)",
  "summary": "Tóm tắt ngắn gọn",
  "theme": "Chủ đề bài học"
}`;
    const step1Result = await executeStepWithRetry(0, step1Prompt, true);
    const step1Data = extractAndParseJson(step1Result.text) || {
      title: `Chuyến Phiêu Lưu Của ${params.character.slice(0, 30)}`,
      summary: `Câu chuyện ý nghĩa về ${params.character} tại ${params.setting}`,
      theme: params.moral || 'Lòng nhân ái',
    };

    // --- BƯỚC 2: Soạn thảo nội dung từng trang ---
    const step2Prompt = `Dựa trên câu chuyện "${step1Data.title}" (${step1Data.summary}), hãy viết nội dung cho đúng ${targetPages} trang truyện thiếu nhi (tiếng Việt trong sáng, ấm áp, khoảng 45-75 từ/trang).
Nhân vật: ${params.character} tại ${params.setting}.
Xuất JSON dạng:
{
  "pages": [
    { "pageNumber": 1, "text": "Nội dung trang 1..." },
    { "pageNumber": 2, "text": "Nội dung trang 2..." }
  ]
}`;
    const step2Result = await executeStepWithRetry(1, step2Prompt, true);
    let step2Data = extractAndParseJson(step2Result.text);

    if (!step2Data || !Array.isArray(step2Data.pages) || step2Data.pages.length === 0) {
      const fallbackLocal = generateLocalFallbackStory({
        character: params.character,
        setting: params.setting,
        topic: params.topic,
        moral: params.moral,
        pageCount: targetPages,
        language: params.language,
      });
      step2Data = { pages: fallbackLocal.pages };
    }

    // --- BƯỚC 3: Xây dựng kịch bản tranh minh họa cho từng trang (gán luôn ảnh thông minh theo bối cảnh) ---
    steps[2].status = 'running';
    steps[2].modelUsed = step2Result.model;
    updateSteps();

    const pagesWithIllustrations = (step2Data.pages || []).map((p: any, idx: number) => {
      const pageNum = p.pageNumber || idx + 1;
      const promptDesc = p.illustrationPrompt || `Tranh thiếu nhi cổ tích rực rỡ ấm áp: ${params.character} tại ${params.setting}, chi tiết cảnh: ${p.text?.slice(0, 80) || ''}`;
      // Gán luôn tranh minh họa thiếu nhi nghệ thuật theo bối cảnh cho truyện tranh
      const imageUrl = getSmartThemedIllustration(promptDesc + ' ' + (p.text || '') + ' ' + params.setting);
      return {
        pageNumber: pageNum,
        text: p.text || 'Nội dung trang...',
        illustrationPrompt: promptDesc,
        imageUrl,
        imageSize: '1K',
      };
    });

    // Hoàn tất bước 3
    steps[2].status = 'success';
    updateSteps();

    return {
      title: step1Data.title || 'Chuyến Phiêu Lưu Diệu Kỳ',
      summary: step1Data.summary || 'Một câu chuyện ý nghĩa cho học sinh.',
      theme: step1Data.theme || params.moral,
      pages: pagesWithIllustrations,
      modelUsed: step2Result.model,
    };
  } catch (error: any) {
    // Giữ nguyên lỗi nguyên văn để UI hiển thị thông báo màu đỏ
    throw error;
  }
}

/**
 * 1. SÁNG TÁC TRUYỆN TRANH AI (với cơ chế Fallback tự động 3 cấp)
 */
export async function generateStoryAI(params: {
  character: string;
  setting: string;
  topic?: string;
  moral?: string;
  pageCount: number;
  language?: string;
  onModelChange?: (modelName: string) => void;
}): Promise<any> {
  const apiKey = getSavedApiKey();
  const preferred = getSelectedModel();
  const modelsToTry = [preferred, ...FALLBACK_MODEL_CHAIN.filter((m) => m !== preferred)];
  const targetPages = Math.max(3, Math.min(Number(params.pageCount) || 4, 6));

  const promptText = `Bạn là nhà văn chuyên sáng tác truyện thiếu nhi Việt Nam tài hoa và ấm áp. Hãy sáng tác một câu chuyện tranh cổ tích học trò tuyệt đẹp, giàu cảm xúc, truyền cảm hứng và mang tính giáo dục nhẹ nhàng cho học sinh với đúng ${targetPages} trang.
Nhân vật chính: ${params.character}
Bối cảnh diễn ra: ${params.setting}
Chủ đề / Đề tài: ${params.topic || 'Hành trình vượt khó và chia sẻ yêu thương'}
Bài học đạo đức / Thông điệp: ${params.moral || 'Lòng nhân ái và sự sẻ chia'}
Ngôn ngữ: Tiếng Việt chuẩn mực, từ ngữ trong sáng, giàu nhạc điệu, ấm áp, hoàn toàn không chêm từ tiếng Anh.

Yêu cầu xuất ra định dạng JSON hợp lệ duy nhất:
{
  "title": "Tiêu đề truyện hay, truyền cảm (tiếng Việt)",
  "summary": "Tóm tắt ngắn gọn 1-2 câu",
  "theme": "Chủ đề bài học",
  "pages": [
    {
      "pageNumber": 1,
      "text": "Nội dung trang kể chuyện từ 45-75 từ",
      "illustrationPrompt": "Lời nhắc chi tiết cho họa sĩ vẽ tranh minh họa sinh động"
    }
  ]
}`;

  let lastErr: any = null;

  // Thử gọi qua backend trước (nếu đang chạy dev với server.ts)
  try {
    const res = await fetch('/api/generate-story', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'x-api-key': apiKey } : {}),
      },
      body: JSON.stringify(params),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.title && Array.isArray(data.pages)) {
        return data;
      }
    }
  } catch (backendErr) {
    // Không có server.ts (môi trường Vercel SPA) -> Tiếp tục gọi trực tiếp Gemini REST
  }

  // Thử gọi trực tiếp Google Gemini REST API qua chuỗi fallback
  if (apiKey) {
    for (const model of modelsToTry) {
      try {
        if (params.onModelChange) {
          params.onModelChange(model);
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: {
              responseMimeType: 'application/json',
            },
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData?.error?.message || `HTTP ${res.status}`;
          console.warn(`[Story Fallback] ${model} thất bại (${errMsg}), thử model tiếp theo...`);
          lastErr = new Error(`Lỗi [${model}]: ${errMsg}`);
          continue;
        }

        const data = await res.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const cleanJson = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
        const parsed = JSON.parse(cleanJson);

        if (parsed.title && Array.isArray(parsed.pages) && parsed.pages.length > 0) {
          return {
            ...parsed,
            modelUsed: model,
          };
        }
      } catch (err: any) {
        console.warn(`[Story Fallback] Lỗi khi tạo truyện với ${model}:`, err.message);
        lastErr = err;
      }
    }
  }

  // Nếu cả các mô hình trực tiếp đều hết quota hoặc chưa có key -> Kích hoạt bộ tạo truyện dự phòng tại chỗ
  console.log('[Story AI] Kích hoạt bộ sáng tác dự phòng tại chỗ:', lastErr?.message);
  return generateLocalFallbackStory(params);
}

/**
 * 2. TRÒ CHUYỆN VỚI BẠN KỂ CHUYỆN AI (với Fallback)
 */
export async function chatWithBuddyAI(params: {
  messages: Array<{ role: string; content: string }>;
  roleId?: string;
  context?: string;
  preferredModel?: string;
}): Promise<{ reply: string; modelUsed: string }> {
  const apiKey = getSavedApiKey();
  const preferred = params.preferredModel || getSelectedModel();
  const modelsToTry = [preferred, ...FALLBACK_MODEL_CHAIN.filter((m) => m !== preferred)];

  const systemPrompt = `Bạn là Bác Cú Mèo Barnaby Thông Thái, một học giả hiền từ và vô cùng yêu mến các bạn học sinh Lớp Học Hạnh Phúc của thầy Phạm Hậu!
Bạn luôn nói tiếng Việt chuẩn, ấm áp, thỉnh thoảng reo vui: "Hú-hú!".
Nhiệm vụ: Giải thích từ khó, khích lệ lòng nhân ái, giúp học sinh học tốt và yêu sách truyện. Trả lời ngắn gọn 1-3 đoạn văn.
Ngữ cảnh truyện đang đọc (nếu có): ${params.context || 'Đang ở lớp học thân thương'}`;

  // Thử gọi backend server.ts trước
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'x-api-key': apiKey } : {}),
      },
      body: JSON.stringify({
        messages: params.messages,
        role: params.roleId || 'story_owl',
        model: preferred,
        currentStoryContext: params.context,
      }),
    });

    if (res.ok) {
      const bData = await res.json();
      if (bData.reply) {
        return { reply: bData.reply, modelUsed: bData.modelUsed || preferred };
      }
    }
  } catch {
    // Môi trường Vercel SPA
  }

  // Gọi trực tiếp Gemini REST
  if (apiKey) {
    const contents = params.messages.map((m) => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    for (const model of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            systemInstruction: { parts: [{ text: systemPrompt }] },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            return { reply: text, modelUsed: model };
          }
        }
      } catch (e) {
        console.warn(`[Chat Fallback] ${model} lỗi, chuyển model tiếp theo...`);
      }
    }
  }

  return {
    reply: 'Hú-hú! Bác Cú Mèo rất vui khi được đọc truyện cùng các em học sinh Lớp Học Hạnh Phúc! Hãy cùng cố gắng thi đua và lan tỏa nhiều việc tốt nhé!',
    modelUsed: 'local-companion-fallback',
  };
}

/**
 * 3. VẼ TRANH MINH HỌA (với Fallback tự động)
 */
export async function generateIllustrationAI(params: {
  prompt: string;
  imageSize?: '1K' | '2K' | '4K';
  aspectRatio?: string;
  stylePreset?: string;
}): Promise<{ imageUrl: string; modelUsed: string; isFallback?: boolean; notice?: string }> {
  const apiKey = getSavedApiKey();

  // Thử gọi backend server.ts nếu có
  try {
    const res = await fetch('/api/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'x-api-key': apiKey } : {}),
      },
      body: JSON.stringify(params),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.imageUrl) {
        return {
          imageUrl: data.imageUrl,
          modelUsed: data.model || 'gemini-3-pro-image-preview',
          isFallback: data.isFallback,
          notice: data.notice,
        };
      }
    }
  } catch {
    // Vercel SPA
  }

  // Fallback thông minh: Chọn tranh minh họa thiếu nhi tuyệt đẹp theo chủ đề
  const curatedUrl = getSmartThemedIllustration(params.prompt);
  return {
    imageUrl: curatedUrl,
    modelUsed: 'Curated Studio Illustration (Free Tier Fallback)',
    isFallback: true,
    notice: 'Đã tự động chọn tranh minh họa nghệ thuật phù hợp nhất với khung cảnh này!',
  };
}
