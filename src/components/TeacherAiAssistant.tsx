import React, { useState } from 'react';
import { 
  Bot, Sparkles, Copy, Check, Send, BookOpen, 
  Heart, MessageSquare, Award, RefreshCw, UserCheck, AlertCircle 
} from 'lucide-react';
import { Student } from '../types';
import { callGeminiGenerateContent, getSavedApiKey } from '../services/geminiService';

interface TeacherAiAssistantProps {
  students: Student[];
  className: string;
  schoolName: string;
  teacherName: string;
}

export const TeacherAiAssistant: React.FC<TeacherAiAssistantProps> = ({
  students,
  className,
  schoolName,
  teacherName,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<number>(students[0]?.id || 1);
  const [customPrompt, setCustomPrompt] = useState('');
  const [generatedRemarks, setGeneratedRemarks] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'remark' | 'quiz' | 'lesson'>('remark');

  // Câu hỏi đọc hiểu
  const [lessonTopic, setLessonTopic] = useState('Lòng nhân ái và Tình bạn sẻ chia');
  const [generatedQuestions, setGeneratedQuestions] = useState<string[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const selectedStudent = students.find((s) => s.id === selectedStudentId) || students[0];

  // 1. Sinh lời nhận xét cho học sinh được chọn
  const handleGenerateRemark = async () => {
    if (!selectedStudent) return;
    setLoading(true);

    const promptText = `Bạn là Trợ Lý Sư Phạm Lớp Học Hạnh Phúc của thầy giáo ${teacherName} (chủ nhiệm lớp ${className}, trường ${schoolName}).
Hãy viết một đoạn tin nhắn nhận xét ngắn gọn (khoảng 3-5 câu), chân thành, ấm áp, giàu tình cảm gửi cho Phụ Huynh của em ${selectedStudent.name}.
Thông tin học sinh:
- Tên: ${selectedStudent.name}
- Tổ: ${selectedStudent.group}
- Điểm sao thi đua tích lũy: ${selectedStudent.points} sao
- Đặc điểm: ${customPrompt || 'Chăm ngoan, lễ phép, hòa đồng cùng bạn bè'}

Yêu cầu:
- Lời mở đầu thân thương gửi quý phụ huynh.
- Tuyên dương nỗ lực và điểm sáng tích cực của em trong tuần qua.
- Động viên em tiếp tục phát huy để rực rỡ hơn nữa trong tuần mới.
- Văn phong chuẩn mực, tình cảm, tôn trọng, không chêm từ tiếng Anh.
- Ký tên: Thầy ${teacherName} - GVCN Lớp ${className}.`;

    try {
      const res = await callGeminiGenerateContent({
        contents: [{ role: 'user', parts: [{ text: promptText }] }],
      });

      if (res.text) {
        setGeneratedRemarks((prev) => ({
          ...prev,
          [selectedStudent.id]: res.text,
        }));
      }
    } catch (err: any) {
      // Fallback cục bộ
      const fallbackMsg = `Kính gửi Quý Phụ Huynh em ${selectedStudent.name},\nThầy ${teacherName} rất vui mừng thông báo trong tuần qua, em ${selectedStudent.name} đã học tập rất tích cực, đạt được ${selectedStudent.points} ngôi sao thi đua rực rỡ và luôn chan hòa cùng các bạn Tổ ${selectedStudent.group}. Gia đình hãy cùng thầy dành tặng em những lời khen ngợi để em thêm tự tin nhé!\nTrân trọng,\nThầy ${teacherName} - GVCN Lớp ${className}.`;
      setGeneratedRemarks((prev) => ({
        ...prev,
        [selectedStudent.id]: fallbackMsg,
      }));
    } finally {
      setLoading(false);
    }
  };

  // 2. Sinh bộ câu hỏi đọc hiểu 5 mức độ
  const handleGenerateQuestions = async () => {
    setLoadingQuestions(true);
    const promptText = `Bạn là chuyên gia sư phạm tiểu học & THCS. Hãy soạn 4 câu hỏi đọc hiểu và thảo luận nhóm cho học sinh lớp ${className} xoay quanh chủ đề: "${lessonTopic}".
Yêu cầu 4 câu hỏi theo thang tư duy Bloom:
1. [Nhận biết]: Câu hỏi gợi nhớ chi tiết hoặc hành động đẹp.
2. [Thông hiểu]: Vì sao việc làm đó lại mang lại niềm vui cho mọi người?
3. [Vận dụng]: Em sẽ làm gì cụ thể nếu gặp bạn bè hoặc người thân trong tình huống tương tự?
4. [Cảm xúc - Kết nối]: Thông điệp ý nghĩa nhất mà em rút ra để xây dựng một lớp học hạnh phúc là gì?
Xuất ra định dạng danh sách 4 gạch đầu dòng rõ ràng bằng tiếng Việt.`;

    try {
      const res = await callGeminiGenerateContent({
        contents: [{ role: 'user', parts: [{ text: promptText }] }],
      });

      if (res.text) {
        const lines = res.text.split('\n').filter((l) => l.trim().length > 0);
        setGeneratedQuestions(lines);
      }
    } catch (err) {
      setGeneratedQuestions([
        '1. [Nhận biết]: Em hãy kể lại 1 hành động giúp đỡ bạn bè mà em ấn tượng nhất?',
        '2. [Thông hiểu]: Tại sao khi chia sẻ niềm vui, chúng ta lại cảm thấy hạnh phúc hơn?',
        '3. [Vận dụng]: Hôm nay ở lớp, em có thể làm việc tốt nào để tặng bạn ngồi cạnh mình?',
        '4. [Cảm xúc]: Một lớp học hạnh phúc theo em cần những nụ cười và sự lắng nghe như thế nào?',
      ]);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleCopy = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-green-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-xs font-bold mb-2 shadow-inner">
            <Bot size={15} className="text-yellow-300" />
            <span>Trợ Lý Sư Phạm AI Đa Tác Tử · Thầy {teacherName}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Trợ Lý AI Lớp Học Hạnh Phúc
          </h2>
          <p className="text-emerald-100 text-xs sm:text-sm mt-1">
            Tự động soạn nhận xét gửi phụ huynh, tạo câu hỏi thảo luận đạo đức và hỗ trợ giảng dạy thông minh.
          </p>
        </div>

        {/* TABS CON */}
        <div className="flex items-center gap-1.5 bg-black/20 p-1 rounded-2xl backdrop-blur-sm">
          <button
            onClick={() => setActiveSubTab('remark')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
              activeSubTab === 'remark' ? 'bg-white text-emerald-950 shadow' : 'text-emerald-100 hover:text-white'
            }`}
          >
            Nhận Xét Phụ Huynh
          </button>
          <button
            onClick={() => setActiveSubTab('quiz')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
              activeSubTab === 'quiz' ? 'bg-white text-emerald-950 shadow' : 'text-emerald-100 hover:text-white'
            }`}
          >
            Câu Hỏi Đọc Hiểu
          </button>
        </div>
      </div>

      {activeSubTab === 'remark' ? (
        /* TAB 1: NHẬN XÉT HỌC BẠ / TIN NHẮN PHỤ HUYNH */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CỘT TRÁI: CHỌN HỌC SINH */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-emerald-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-gray-900 text-sm">Danh Sách Học Sinh ({students.length})</h3>
              <span className="text-xs text-gray-400 font-bold">Lớp {className}</span>
            </div>

            <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1 no-scrollbar">
              {students.map((s) => {
                const isSelected = s.id === selectedStudentId;
                const hasRemark = Boolean(generatedRemarks[s.id]);
                return (
                  <div
                    key={`asst-student-${s.id}`}
                    onClick={() => setSelectedStudentId(s.id)}
                    className={`p-3 rounded-2xl cursor-pointer transition-all flex items-center justify-between text-xs border ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-500 shadow-sm ring-1 ring-emerald-300'
                        : 'bg-white hover:bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{s.avatar}</span>
                      <div>
                        <div className="font-bold text-gray-900">{s.name}</div>
                        <div className="text-[10px] text-gray-500">Tổ {s.group} · {s.points} ⭐</div>
                      </div>
                    </div>
                    {hasRemark && (
                      <span className="text-emerald-600 bg-emerald-100 p-1 rounded-full text-[10px]">
                        ✓
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* CỘT PHẢI: KHUNG SOẠN VÀ XEM KẾT QUẢ */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{selectedStudent?.avatar}</span>
                  <div>
                    <h4 className="font-black text-gray-900 text-base">
                      {selectedStudent?.name} (Tổ {selectedStudent?.group})
                    </h4>
                    <p className="text-xs text-gray-500">
                      Tích lũy: <strong className="text-amber-600">{selectedStudent?.points} ⭐ thi đua</strong>
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleGenerateRemark}
                  disabled={loading}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white font-black px-4 py-2.5 rounded-2xl text-xs shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Sparkles size={15} className={loading ? 'animate-spin' : ''} />
                  <span>{loading ? 'AI Đang Viết...' : 'Soạn Nhận Xét Bằng AI'}</span>
                </button>
              </div>

              {/* TÙY CHỈNH THÊM LỜI NHẮC */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Ghi chú thêm về học sinh (tùy chọn):
                </label>
                <input
                  type="text"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Ví dụ: Tuần này bạn rất tích cực phát biểu, đọc truyện to rõ ràng..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              {/* KHUNG HIỂN THỊ LỜI NHẬN XÉT */}
              <div className="relative">
                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center justify-between">
                  <span>Nội dung tin nhắn gửi Phụ Huynh:</span>
                  {generatedRemarks[selectedStudent?.id || 0] && (
                    <button
                      onClick={() => handleCopy(generatedRemarks[selectedStudent?.id || 0], selectedStudent?.id || 0)}
                      className="text-emerald-700 hover:text-emerald-800 text-xs font-bold flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg transition"
                    >
                      {copiedId === selectedStudent?.id ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedId === selectedStudent?.id ? 'Đã Sao Chép!' : 'Copy Gửi Zalo'}</span>
                    </button>
                  )}
                </label>

                <textarea
                  value={generatedRemarks[selectedStudent?.id || 0] || ''}
                  onChange={(e) =>
                    setGeneratedRemarks((prev) => ({
                      ...prev,
                      [selectedStudent?.id || 0]: e.target.value,
                    }))
                  }
                  rows={6}
                  placeholder="Bấm nút 'Soạn Nhận Xét Bằng AI' ở trên để AI tạo ngay bức thư ngắn gọn, tình cảm gửi phụ huynh..."
                  className="w-full p-4 bg-emerald-50/40 border border-emerald-200 rounded-2xl text-xs sm:text-sm font-sans leading-relaxed text-gray-800 outline-none focus:border-emerald-500 focus:bg-white resize-none"
                />
              </div>

              {generatedRemarks[selectedStudent?.id || 0] && (
                <div className="flex items-center justify-between bg-emerald-50 p-3 rounded-xl text-xs text-emerald-900">
                  <span>📱 Đã sẵn sàng gửi cho Phụ Huynh qua Zalo hoặc Sổ liên lạc điện tử!</span>
                  <button
                    onClick={() => handleCopy(generatedRemarks[selectedStudent?.id || 0], selectedStudent?.id || 0)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg transition"
                  >
                    Sao Chép Tin Nhắn
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* TAB 2: CÂU HỎI ĐỌC HIỂU 5 MỨC ĐỘ */
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100 space-y-6 max-w-3xl mx-auto">
          <div>
            <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
              <BookOpen size={20} className="text-emerald-600" />
              Tạo Bộ Câu Hỏi Đọc Hiểu & Thảo Luận Lớp Học
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Tạo 4 câu hỏi thảo luận đạo đức và kỹ năng sống phù hợp sau khi đọc xong truyện cổ tích.
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={lessonTopic}
              onChange={(e) => setLessonTopic(e.target.value)}
              placeholder="Nhập chủ đề bài học (VD: Lòng dũng cảm, Tình bạn, Sự trung thực...)"
              className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm outline-none focus:border-emerald-500 font-bold"
            />
            <button
              onClick={handleGenerateQuestions}
              disabled={loadingQuestions}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md transition flex items-center gap-1.5 whitespace-nowrap active:scale-95 disabled:opacity-50"
            >
              <Sparkles size={15} />
              <span>{loadingQuestions ? 'Đang Tạo...' : 'Tạo Câu Hỏi'}</span>
            </button>
          </div>

          {generatedQuestions.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="font-black text-gray-800 text-xs uppercase tracking-wider">
                Gợi Ý Câu Hỏi Thảo Luận Cả Lớp:
              </h4>
              <div className="space-y-2">
                {generatedQuestions.map((q, idx) => (
                  <div
                    key={`q-${idx}`}
                    className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-2xl text-xs sm:text-sm text-gray-800 font-medium leading-relaxed flex items-start gap-2"
                  >
                    <span className="font-black text-emerald-700">{idx + 1}.</span>
                    <span>{q.replace(/^\d+[\.\:\-]\s*/, '')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
