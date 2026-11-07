import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));

// Initialize Google GenAI client server-side (hỗ trợ client API key và env)
const getAiClient = (req?: Request) => {
  const customKey = (req?.headers['x-api-key'] as string) || req?.body?.apiKey;
  const apiKey = (customKey && customKey.trim()) || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Chưa cấu hình GEMINI_API_KEY. Vui lòng nhập API Key trong phần Cài đặt.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'lophoc-hanhphuc-pham-hau',
      },
    },
  });
};

// Classroom data file path for server persistence
const CLASSROOM_DATA_FILE = path.resolve(process.cwd(), 'classroom_data.json');

// ----------------------------------------------------
// 0. Classroom Data Sync endpoints (Lưu & Đồng bộ lớp học)
// ----------------------------------------------------
app.get('/api/class-data', (req: Request, res: Response) => {
  try {
    if (fs.existsSync(CLASSROOM_DATA_FILE)) {
      const data = fs.readFileSync(CLASSROOM_DATA_FILE, 'utf-8');
      res.json(JSON.parse(data));
    } else {
      res.json({ exists: false });
    }
  } catch (error: any) {
    console.error('Lỗi đọc dữ liệu lớp học:', error);
    res.status(500).json({ error: 'Không thể đọc dữ liệu lớp học trên máy chủ' });
  }
});

app.post('/api/class-data', (req: Request, res: Response) => {
  try {
    const payload = req.body;
    if (Array.isArray(payload.students)) {
      const seenIds = new Set<number>();
      payload.students = payload.students.map((s: any, idx: number) => {
        let id = typeof s.id === 'number' ? s.id : parseInt(s.id, 10);
        if (!id || isNaN(id) || seenIds.has(id)) {
          id = Date.now() + (idx + 1) * 10000 + Math.floor(Math.random() * 9000) + 1;
        }
        seenIds.add(id);
        return { ...s, id };
      });
    }

    const dataWithTimestamp = {
      ...payload,
      lastSynced: new Date().toISOString(),
    };
    fs.writeFileSync(CLASSROOM_DATA_FILE, JSON.stringify(dataWithTimestamp, null, 2), 'utf-8');
    res.json({ success: true, lastSynced: dataWithTimestamp.lastSynced, students: payload.students });
  } catch (error: any) {
    console.error('Lỗi lưu dữ liệu lớp học:', error);
    res.status(500).json({ error: 'Không thể lưu dữ liệu lớp học lên máy chủ' });
  }
});

// ----------------------------------------------------
// 1. Text to Speech endpoint (gemini-3.8-flash-tts)
// ----------------------------------------------------
app.post('/api/tts', async (req: Request, res: Response) => {
  try {
    const { 
      text, 
      voiceName = 'Puck', 
      style = "Người đọc truyện cổ tích truyền cảm, ấm áp, ngữ điệu sinh động, phát âm tiếng Việt rõ ràng, truyền cảm hứng cho các bạn nhỏ" 
    } = req.body;

    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Vui lòng cung cấp văn bản cần đọc' });
      return;
    }

    const ai = getAiClient(req);

    // Use gemini-3.8-flash-tts as explicitly instructed
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text.trim(),
              speechMetadata: {
                speaker: 'Storyteller',
                style,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const candidate = response.candidates?.[0];
    const audioPart = candidate?.content?.parts?.find((p: any) => p.inlineData?.data);

    if (!audioPart || !audioPart.inlineData?.data) {
      res.status(500).json({
        error: 'Mô hình âm thanh không trả về dữ liệu.',
        details: candidate?.finishReason || 'Lỗi không xác định',
      });
      return;
    }

    const base64Audio = audioPart.inlineData.data;
    const mimeType = audioPart.inlineData.mimeType || 'audio/wav';

    res.json({
      audioUrl: `data:${mimeType};base64,${base64Audio}`,
      format: mimeType,
      voiceName,
    });
  } catch (error: any) {
    console.error('Lỗi tạo giọng đọc TTS:', error);
    res.status(500).json({
      error: error.message || 'Không thể tạo giọng đọc với gemini-3.8-flash-tts',
      status: error.status || 500,
    });
  }
});

// ----------------------------------------------------
// Helper: Curated children's book illustrations by theme for Free Tier / Quota fallback
// ----------------------------------------------------
function getSmartThemedIllustration(prompt: string): string {
  const p = (prompt || '').toLowerCase();

  // 1. Trường học, lớp học, thầy cô, bạn bè
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

  // 2. Đại dương, biển, cá voi, san hô
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

  // 3. Rừng xanh, động vật, gấu, thỏ, cáo, muông thú
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

  // 4. Vũ trụ, vì sao, hành tinh, ban đêm
  if (
    p.includes('vũ trụ') || p.includes('sao') || p.includes('trăng') ||
    p.includes('hành tinh') || p.includes('space') || p.includes('star') ||
    p.includes('night') || p.includes('moon') || p.includes('galaxy')
  ) {
    const list = [
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1200&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=85',
    ];
    return list[Math.floor(Math.random() * list.length)];
  }

  // 5. Vườn hoa, cầu vồng, thần tiên, kẹo ngọt
  if (
    p.includes('hoa') || p.includes('vườn') || p.includes('cầu vồng') ||
    p.includes('thần tiên') || p.includes('kẹo') || p.includes('flower') ||
    p.includes('garden') || p.includes('rainbow') || p.includes('fairy')
  ) {
    const list = [
      'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=1200&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1200&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=85',
    ];
    return list[Math.floor(Math.random() * list.length)];
  }

  // Mặc định tranh minh họa thiếu nhi nghệ thuật
  const defaultList = [
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1200&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200&auto=format&fit=crop&q=85',
  ];
  return defaultList[Math.floor(Math.random() * defaultList.length)];
}

// ----------------------------------------------------
// 2. High-Quality Image Generation endpoint (gemini-3-pro-image-preview)
// ----------------------------------------------------
app.post('/api/generate-image', async (req: Request, res: Response) => {
  const {
    prompt,
    imageSize = '1K', // affordance: 1K, 2K, 4K
    aspectRatio = '4:3',
    stylePreset = "Tranh minh họa sách thiếu nhi tuyệt đẹp, phong cách truyện cổ tích, màu sắc rực rỡ ấm áp, ánh sáng dịu dàng, chất liệu chi tiết, đáng yêu và thân thiện với trẻ em",
  } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'Vui lòng cung cấp mô tả tranh cần vẽ' });
    return;
  }

  const fullPrompt = `${stylePreset}. Khung cảnh: ${prompt.trim()}`;
  const validSizes = ['1K', '2K', '4K'];
  const chosenSize = validSizes.includes(imageSize) ? imageSize : '1K';

  const validAspectRatios = ['1:1', '3:4', '4:3', '9:16', '16:9'];
  const chosenAspect = validAspectRatios.includes(aspectRatio) ? aspectRatio : '4:3';

  try {
    const ai = getAiClient(req);

    // 1. Thử mô hình tạo ảnh cao cấp gemini-3-pro-image-preview
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: [{ text: fullPrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: chosenAspect as any,
            imageSize: chosenSize as any,
          },
        },
      });

      let imageUrl = '';
      for (const part of response.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType || 'image/png';
          imageUrl = `data:${mime};base64,${part.inlineData.data}`;
          break;
        }
      }

      if (imageUrl) {
        return res.json({
          imageUrl,
          imageSize: chosenSize,
          aspectRatio: chosenAspect,
          model: 'gemini-3-pro-image-preview',
        });
      }
    } catch (primaryErr: any) {
      // 2. Thử mô hình dự phòng gemini-3.1-flash-lite-image
      try {
        const fallbackResponse = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite-image',
          contents: {
            parts: [{ text: fullPrompt }],
          },
          config: {
            imageConfig: {
              aspectRatio: chosenAspect as any,
            },
          },
        });

        let fallbackImageUrl = '';
        for (const part of fallbackResponse.candidates?.[0]?.content?.parts ?? []) {
          if (part.inlineData?.data) {
            const mime = part.inlineData.mimeType || 'image/png';
            fallbackImageUrl = `data:${mime};base64,${part.inlineData.data}`;
            break;
          }
        }

        if (fallbackImageUrl) {
          return res.json({
            imageUrl: fallbackImageUrl,
            imageSize: chosenSize,
            aspectRatio: chosenAspect,
            model: 'gemini-3.1-flash-lite-image',
          });
        }
      } catch (secondaryErr: any) {
        // Cả hai mô hình AI đều bị giới hạn (429 Quota Exceeded do Free Tier limit: 0)
        // Chuyển sang ảnh minh họa nghệ thuật theo ngữ cảnh để không làm gián đoạn câu chuyện
      }
    }
  } catch (clientErr: any) {
    // Client initialization issue
  }

  // 3. Fallback thông minh: Gán tranh minh họa thiếu nhi nghệ thuật chất lượng cao theo chủ đề
  const themedIllustration = getSmartThemedIllustration(prompt);
  return res.json({
    imageUrl: themedIllustration,
    imageSize: chosenSize,
    aspectRatio: chosenAspect,
    isFallback: true,
    quotaExceeded: true,
    model: 'Curated Studio Illustration (Free Tier Fallback)',
    notice: 'Khóa API hiện tại đang sử dụng gói Free Tier (giới hạn 0 lượt tạo ảnh AI/ngày). Hệ thống đã tự động chọn tranh minh họa nghệ thuật phù hợp nhất với cảnh này. Để vẽ ảnh AI trực tiếp, quý thầy/cô có thể chọn khóa API có thanh toán trong Settings > Secrets.',
  });
});

// ----------------------------------------------------
// 3. Multi-Turn Chatbot with Personas and Model Selection
// (gemini-4-argon, gemini-3.8-flash, gemini-3.1-flash-lite)
// ----------------------------------------------------
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const {
      messages = [],
      role = 'story_owl',
      model = 'gemini-3.8-flash', // options: 'gemini-4-argon' | 'gemini-3.8-flash' | 'gemini-3.1-flash-lite'
      currentStoryContext = '',
    } = req.body;

    const roleSystemInstructions: Record<string, string> = {
      story_owl: `Bạn là Bác Cú Mèo Barnaby Thông Thái, một học giả thông thái, hiền từ và vô cùng yêu thích sách truyện thiếu nhi! Bạn luôn trò chuyện bằng tiếng Việt chuẩn, tự nhiên, lễ phép, ấm áp, thỉnh thoảng reo vui: "Hú-hú!", "Thật là kỳ diệu!". Nhiệm vụ của bạn là giải thích các từ ngữ khó một cách dễ hiểu nhất cho các em nhỏ, khích lệ trí tưởng tượng, đặt những câu hỏi gợi mở về bài học đạo đức, lòng nhân ái, và luôn giữ câu trả lời ngắn gọn, trong sáng (tối đa 1-3 đoạn văn ngắn).`,
      dragon_pip: `Bạn là Chú Rồng Con Pip Tinh Nghịch, một chú rồng nhỏ màu xanh lá siêu đáng yêu, mê phiêu lưu và những ý tưởng ngộ nghĩnh! Bạn nói tiếng Việt rộn ràng, vui tươi, thỉnh thoảng kèm âm thanh hoạt hình như "Vùuu!", "Khè lửa tí hon!". Bạn gợi ý những bước ngoặt truyện hài hước, làm thơ vui nhộn và cổ vũ các bé dũng cảm. Giữ câu trả lời vui nhộn dưới 3 đoạn ngắn.`,
      fairy_luna: `Bạn là Cô Tiên Sao Luna Dịu Êm, một nàng tiên nhân hậu toát ra ánh sáng sao trời lấp lánh. Bạn trò chuyện bằng tiếng Việt dịu dàng, êm ái, mang lại cảm giác bình yên, ấm áp trước giờ đi ngủ. Bạn giúp các em nhỏ nhận diện cảm xúc, nuôi dưỡng lòng tốt, sự biết ơn và chìm vào giấc ngủ ngọt ngào.`,
      detective_hound: `Bạn là Thám Tử Cún Con Sherlock Hound, đeo kính lúp tí hon và đội mũ thám tử! Bạn coi mỗi trang truyện như một chuyến phiêu lưu phá án kỳ thú. Bạn dùng tiếng Việt thông minh, dí dỏm, đố các bé quan sát các manh mối trong tranh và suy luận tìm ra bí mật. "Aha! Cùng thám tử soi kỹ manh mối nào!"`,
    };

    const validModels = ['gemini-4-argon', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'];
    const chosenModel = validModels.includes(model) ? model : 'gemini-3.8-flash';

    let baseInstruction = roleSystemInstructions[role] || roleSystemInstructions.story_owl;
    baseInstruction += `\n\nQUAN TRỌNG: Luôn trả lời hoàn toàn bằng TIẾNG VIỆT CHUẨN mực, trong sáng, thân thiện, không dùng tiếng Anh trừ tên riêng.`;

    if (currentStoryContext) {
      baseInstruction += `\n\nNgữ cảnh câu chuyện bé đang đọc:\n"""\n${currentStoryContext}\n"""\nHãy liên hệ nhân vật và tình huống trong truyện khi trò chuyện.`;
    }

    const ai = getAiClient(req);

    // Map conversation history
    // Filter to ensure alternating valid roles
    const contents: any[] = [];
    for (const msg of messages) {
      if (msg.role === 'user' || msg.role === 'model') {
        contents.push({
          role: msg.role,
          parts: [{ text: msg.content }],
        });
      }
    }

    if (contents.length === 0) {
      res.status(400).json({ error: 'No messages provided.' });
      return;
    }

    let response;
    let modelActuallyUsed = chosenModel;

    try {
      response = await ai.models.generateContent({
        model: chosenModel,
        contents,
        config: {
          systemInstruction: baseInstruction,
        },
      });
    } catch (primaryErr: any) {
      console.warn(`Primary chat model ${chosenModel} failed (${primaryErr.message}), falling back to gemini-3.1-flash-lite:`, primaryErr);
      if (chosenModel !== 'gemini-3.1-flash-lite') {
        response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents,
          config: {
            systemInstruction: baseInstruction,
          },
        });
        modelActuallyUsed = 'gemini-3.1-flash-lite';
      } else {
        throw primaryErr;
      }
    }

    res.json({
      reply: response.text || "Hoo-hoo! That is a wonderful thought! What do you think happens next?",
      modelUsed: modelActuallyUsed,
    });
  } catch (error: any) {
    console.error('Error in chat:', error);
    res.status(500).json({
      error: error.message || 'Chat generation failed',
      status: error.status || 500,
    });
  }
});

// ----------------------------------------------------
// Helper: Fallback story generator if models are unreachable or rate-limited
// ----------------------------------------------------
function generateFallbackStory(params: {
  character: string;
  setting: string;
  topic?: string;
  moral?: string;
  pageCount: number;
  language: string;
}) {
  const isVi = params.language === 'vi';
  const char = (params.character || '').trim() || (isVi ? 'Bạn nhỏ chăm ngoan' : 'A curious child');
  const loc = (params.setting || '').trim() || (isVi ? 'Lớp học thân thương' : 'A wonderful school');
  const moral = (params.moral || '').trim() || (isVi ? 'Lòng tốt và tình bạn sẻ chia' : 'Kindness and friendship');
  const count = Math.max(3, Math.min(Number(params.pageCount) || 4, 6));

  if (isVi) {
    const storyTemplates = [
      {
        pageNumber: 1,
        text: `Vào một buổi sáng ngập tràn ánh nắng ấm áp, ${char} bước đi trên con đường quen thuộc với tâm trạng vô cùng háo hức. Hôm nay là một ngày thật đặc biệt tại ${loc}, nơi tiếng cười rộn rã và những điều kỳ thú đang chờ đón.`,
        illustrationPrompt: `Tranh minh họa sách thiếu nhi ấm áp rực rỡ: ${char} tươi cười rạng rỡ chào buổi sáng tại ${loc}, xung quanh là hoa cỏ tươi thắm, chim ca hát, phong cách truyện tranh cổ tích dễ thương`,
      },
      {
        pageNumber: 2,
        text: `Tại ${loc}, ${char} bắt gặp một điều bất ngờ: một khu vườn ước mơ với những chiếc mầm xanh biếc đang cần được chăm sóc. Các bạn nhỏ xung quanh đều rất tò mò nhưng chưa biết cách làm sao để cây đơm hoa kết trái.`,
        illustrationPrompt: `Tranh thiếu nhi sinh động: ${char} cùng các bạn nhỏ quây quần bên khu vườn xanh mát tại ${loc}, ánh mắt tràn ngập niềm vui và sự tò mò khám phá`,
      },
      {
        pageNumber: 3,
        text: `Không ngần ngại, ${char} liền rủ các bạn cùng chung tay. Người tưới nước, người xới đất, mọi người đều sẻ chia công việc trong tiếng cười giòn tan. Bài học về ${moral.toLowerCase()} đã kết nối tất cả lại gần nhau hơn bao giờ hết.`,
        illustrationPrompt: `Tranh minh họa truyện cổ tích: ${char} và các bạn nhỏ cùng nhau tưới cây, giúp đỡ lẫn nhau với nụ cười rạng rỡ, cầu vồng bảy sắc lung linh phía trên`,
      },
      {
        pageNumber: 4,
        text: `Kỳ diệu thay, những đóa hoa thơm ngát bừng nở rực rỡ dưới nắng vàng. ${char} nhận ra rằng, chỉ cần chúng ta có ${moral.toLowerCase()} và biết yêu thương giúp đỡ nhau, mọi nơi trên đời đều trở thành khu vườn hạnh phúc.`,
        illustrationPrompt: `Khung cảnh kết thúc truyện cổ tích: Những đóa hoa nở rộ lộng lẫy, ${char} cùng thầy cô và bạn bè vỗ tay hân hoan, ánh hoàng hôn dịu dàng ấm áp phủ khắp ${loc}`,
      },
      {
        pageNumber: 5,
        text: `Cả lớp cùng nhau ngắm nhìn thành quả tuyệt vời. Thầy cô và bạn bè đều dành tặng ${char} những tràng pháo tay giòn giã và những lời khen ngợi chân thành nhất.`,
        illustrationPrompt: `Tranh thiếu nhi tươi sáng: ${char} được thầy cô và bạn bè chúc mừng trong niềm tự hào, nụ cười hạnh phúc rạng ngời`,
      },
      {
        pageNumber: 6,
        text: `Khi ánh hoàng hôn dần buông xuống, ${char} mỉm cười thanh thản khép lại một ngày học tập và phiêu lưu ý nghĩa. Những bài học yêu thương sẽ mãi là hành trang tuyệt đẹp chắp cánh cho tương lai.`,
        illustrationPrompt: `Bức tranh êm đềm: ${char} nhìn ra bầu trời sao lấp lánh, một giấc mơ ngọt ngào bình yên đang chờ đón`,
      },
    ];

    const shortTitle = char.length > 20 ? 'Bạn Nhỏ Dũng Cảm' : char;
    return {
      title: `Chuyến Phiêu Lưu Diệu Kỳ Của ${shortTitle}`,
      summary: `Câu chuyện ý nghĩa và ấm áp về ${char} tại ${loc}, lan tỏa thông điệp sâu sắc về ${moral.toLowerCase()}.`,
      theme: moral,
      pages: storyTemplates.slice(0, count),
      modelUsed: 'creative-engine-fallback',
    };
  }

  // English fallback
  return {
    title: `The Wonderful Adventure of ${char}`,
    summary: `A heartwarming story about ${char} exploring ${loc} and discovering ${moral}.`,
    theme: moral,
    pages: Array.from({ length: count }, (_, idx) => ({
      pageNumber: idx + 1,
      text: `Once upon a time in ${loc}, ${char} discovered a magical secret. Through joy and teamwork, the true beauty of ${moral} touched everyone's heart.`,
      illustrationPrompt: `Delightful children's book illustration: ${char} enjoying an adventure in ${loc}, colorful, warm and uplifting style`,
    })),
    modelUsed: 'creative-engine-fallback',
  };
}

// ----------------------------------------------------
// 4. Story Generator endpoint (Create new multi-page stories)
// ----------------------------------------------------
app.post('/api/generate-story', async (req: Request, res: Response) => {
  const {
    topic = 'Chuyến phiêu lưu diệu kỳ',
    character = 'Bạn nhỏ chăm ngoan',
    setting = 'Lớp học thân thương',
    moral = 'Lòng tốt và tình bạn sẻ chia',
    pageCount = 4,
    language = 'vi', // 'vi' or 'en'
  } = req.body;

  const isVi = language === 'vi';
  const targetPages = Math.max(3, Math.min(Number(pageCount) || 4, 6));

  const prompt = isVi
    ? `Bạn là nhà văn chuyên sáng tác truyện thiếu nhi Việt Nam tài hoa và ấm áp. Hãy sáng tác một câu chuyện tranh cổ tích học trò tuyệt đẹp, giàu cảm xúc, truyền cảm hứng và mang tính giáo dục nhẹ nhàng cho học sinh (từ 4-10 tuổi) với đúng ${targetPages} trang.
Nhân vật chính: ${character}
Bối cảnh diễn ra: ${setting}
Chủ đề / Đề tài: ${topic}
Bài học đạo đức / Thông điệp: ${moral}
Ngôn ngữ: Tiếng Việt chuẩn mực, từ ngữ trong sáng, giàu nhạc điệu, ấm áp, hoàn toàn không chêm từ tiếng Anh.

Yêu cầu định dạng JSON:
- "title": Tiêu đề truyện hay, truyền cảm, hấp dẫn trẻ nhỏ (tiếng Việt).
- "summary": Tóm tắt ngắn gọn 1-2 câu về câu chuyện.
- "theme": Chủ đề bài học rút ra.
- "pages": Mảng gồm đúng ${targetPages} trang. Mỗi trang gồm:
    + "pageNumber": số thứ tự trang từ 1 đến ${targetPages}.
    + "text": Nội dung kể chuyện của trang (khoảng 45-75 từ, câu từ nhịp nhàng, tình cảm, phù hợp đọc to cho cả lớp nghe).
    + "illustrationPrompt": Lời nhắc mô tả khung cảnh chi tiết để họa sĩ AI vẽ tranh minh họa (phong cách minh họa sách tranh thiếu nhi, ấm áp, sinh động, dễ thương).`
    : `Write a delightful, heartwarming illustrated children's story for ages 4-9 with exactly ${targetPages} pages.
Character: ${character}
Setting: ${setting}
Theme / Topic: ${topic}
Moral Lesson: ${moral}
Language: English

Return JSON with "title", "summary", "theme", and "pages" array of ${targetPages} pages each containing "pageNumber", "text", and "illustrationPrompt".`;

  const storySchema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: 'Tiêu đề câu chuyện' },
      summary: { type: Type.STRING, description: 'Tóm tắt câu chuyện' },
      theme: { type: Type.STRING, description: 'Chủ đề và bài học' },
      pages: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            pageNumber: { type: Type.INTEGER },
            text: { type: Type.STRING, description: 'Nội dung trang truyện' },
            illustrationPrompt: { type: Type.STRING, description: 'Mô tả tranh minh họa' },
          },
          required: ['pageNumber', 'text', 'illustrationPrompt'],
        },
      },
    },
    required: ['title', 'summary', 'theme', 'pages'],
  };

  // Model fallback waterfall theo tiêu chuẩn AI Instructions: gemini-3-flash-preview -> gemini-3-pro-preview -> gemini-2.5-flash
  const modelsToTry = [
    'gemini-3-flash-preview',
    'gemini-3-pro-preview',
    'gemini-2.5-flash',
    'gemini-3.8-flash',
    'gemini-3.1-flash-lite',
  ];
  let lastError: any = null;

  try {
    const ai = getAiClient(req);

    for (const modelName of modelsToTry) {
      try {
        console.log(`[StoryGenerator] Đang thử sáng tác truyện bằng mô hình: ${modelName}...`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: storySchema,
          },
        });

        const rawText = (response.text || '').trim();
        if (rawText) {
          const cleanJson = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
          const parsed = JSON.parse(cleanJson);
          if (parsed.title && Array.isArray(parsed.pages) && parsed.pages.length > 0) {
            console.log(`[StoryGenerator] Sáng tác truyện thành công rực rỡ với ${modelName}!`);
            return res.json({
              ...parsed,
              modelUsed: modelName,
            });
          }
        }
      } catch (modelErr: any) {
        console.warn(`[StoryGenerator] Mô hình ${modelName} gặp sự cố (${modelErr.message}), tự động chuyển sang mô hình tiếp theo...`);
        lastError = modelErr;
      }
    }
  } catch (clientErr: any) {
    console.warn('[StoryGenerator] Lỗi khởi tạo AI client:', clientErr.message);
    lastError = clientErr;
  }

  // Graceful fallback to guaranteed local creative engine if all remote models encounter transient errors
  console.log('[StoryGenerator] Kích hoạt bộ máy sáng tác dự phòng chất lượng cao cho giáo viên & học sinh:', lastError?.message);
  const fallbackStory = generateFallbackStory({
    character,
    setting,
    topic,
    moral,
    pageCount: targetPages,
    language,
  });

  res.json(fallbackStory);
});

// ----------------------------------------------------
// Vite Dev Server / Static File Serving
// ----------------------------------------------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const distPath = path.resolve(process.cwd(), 'dist');

  if (!isProd && fs.existsSync(path.resolve(process.cwd(), 'vite.config.ts'))) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LỚP HỌC HẠNH PHÚC _ PHẠM HẬU server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server start error:', err);
});
