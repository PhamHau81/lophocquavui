import React, { useState, useEffect } from 'react';
import { 
  X, Sparkles, Wand2, BookOpen, Heart, 
  Compass, Smile, Globe2, Loader2, Users, Star, UserCheck, Search
} from 'lucide-react';
import { Story, Student } from '../types';
import { 
  generateStoryWithStrictProgress, 
  WorkflowStepState,
  generateStoryAI, 
  generateLocalFallbackStory,
  getSmartThemedIllustration,
  getSavedApiKey 
} from '../services/geminiService';

interface StoryCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStoryCreated: (newStory: Story) => void;
  students?: Student[];
  className?: string;
  schoolName?: string;
  teacherName?: string;
  preselectedStudent?: Student | null;
  onOpenApiKeySettings?: () => void;
}

export const StoryCreatorModal: React.FC<StoryCreatorModalProps> = ({
  isOpen,
  onClose,
  onStoryCreated,
  students = [],
  className = '12A6',
  schoolName = 'THPT Hồng Ngự 3',
  teacherName = 'Phạm Hậu',
  preselectedStudent = null,
  onOpenApiKeySettings,
}) => {
  const [character, setCharacter] = useState('Một bạn nhỏ thông minh, dũng cảm và yêu thương bạn bè');
  const [selectedStudentHero, setSelectedStudentHero] = useState<Student | null>(null);
  const [setting, setSetting] = useState(`Lớp học ${className} thân thương tại ${schoolName}`);
  const [topic, setTopic] = useState('Hành trình cùng các bạn trong lớp vượt qua thử thách học tập và khám phá điều kỳ diệu');
  const [moral, setMoral] = useState('Tình bạn chân thành, lòng dũng cảm và niềm vui sẻ chia');
  const [language, setLanguage] = useState<'vi' | 'en'>('vi');
  const [pageCount, setPageCount] = useState<number>(4);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [showFullStudentGrid, setShowFullStudentGrid] = useState(false);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStepState[]>([]);
  const [hasStartedWorkflow, setHasStartedWorkflow] = useState(false);

  // Khi mở hộp thoại hoặc thay đổi học sinh nhân vật chính
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setHasStartedWorkflow(false);
      setWorkflowSteps([]);
      setIsGenerating(false);

      if (preselectedStudent) {
        chooseStudentAsHero(preselectedStudent);
      } else if (students && students.length > 0) {
        if (!selectedStudentHero || !students.some((s) => s.id === selectedStudentHero.id)) {
          chooseStudentAsHero(students[0]);
        }
      }
    }
  }, [isOpen, preselectedStudent, students]);

  const chooseStudentAsHero = (s: Student) => {
    setSelectedStudentHero(s);
    setCharacter(`Bạn nhỏ ${s.name} ${s.avatar} (học sinh Tổ ${s.group}, lớp ${className} trường ${schoolName}), một bạn học sinh chăm ngoan, dũng cảm và giàu lòng nhân ái`);
    setSetting(`Lớp học ${className} trường ${schoolName} cùng thầy giáo chủ nhiệm ${teacherName} và các bạn học sinh`);
    setTopic(`Chuyến phiêu lưu kỳ thú của ${s.name} cùng các bạn lớp ${className} để giúp đỡ bạn bè và thắp sáng những ngôi sao thi đua`);
    setMoral('Tình bạn chân thành, lòng dũng cảm và tinh thần đoàn kết giúp đỡ bạn bè');
  };

  if (!isOpen) return null;

  const quickCharacters = [
    { label: '🐱 Mèo Con Phi Hành Gia', val: 'Một chú mèo trắng mặc bộ đồ phi hành gia mini thích ngắm trăng sao' },
    { label: '🐲 Rồng Con Tinh Nghịch', val: 'Một chú rồng nhỏ màu xanh lá đáng yêu hắt xì ra những bông hoa lửa lấp lánh' },
    { label: '🤖 Chó Robot Trồng Cây', val: 'Một chú chó robot thông minh thích tưới nước cho những bông hoa biết nói' },
    { label: '🐰 Thỏ Trắng Tập Múa', val: 'Một cô thỏ con tai dài đáng yêu luôn ước mơ trở thành vũ công ba-lê rừng xanh' },
  ];

  const quickSettings = [
    { label: `🏫 Lớp Học ${className} & Thầy ${teacherName}`, val: `Lớp học ${className} tại trường ${schoolName} cùng thầy chủ nhiệm ${teacherName} và bạn bè thân thiết` },
    { label: '🌲 Rừng Pha Lê Phát Sáng', val: 'Khu rừng nguyên sinh cổ tích có những cây cổ thụ biết hát và thảm rêu phát quang' },
    { label: '☁️ Vương Quốc Mây Kẹo Bông', val: 'Vương quốc bay lơ lửng trên trời làm bằng mây kẹo ngọt ngào và cầu vồng bảy sắc' },
    { label: '🐠 Thủy Cung San Hô', val: 'Đại dương trong xanh lấp lánh với những hang động ngọc trai và đàn rùa biển thân thiện' },
  ];

  const quickMorals = [
    'Lòng nhân ái & Giúp đỡ bạn bè',
    'Lòng dũng cảm & Tự tin vào bản thân',
    'Niềm vui sẻ chia & Đoàn kết một lòng',
    'Tinh thần ham học hỏi & Yêu thiên nhiên',
  ];

  // Sáng tác truyện dự phòng nhanh tại chỗ (đảm bảo không bao giờ gián đoạn giờ học)
  const handleCreateFallbackStoryNow = () => {
    setIsGenerating(true);
    const heroName = selectedStudentHero ? selectedStudentHero.name : 'Bạn Nhỏ Dũng Cảm';
    const fallbackData = generateLocalFallbackStory({
      character,
      setting,
      topic,
      moral,
      pageCount,
      language,
    });

    const newStory: Story = {
      id: `story-${Date.now()}`,
      title: fallbackData.title || `Chuyện Về Bạn ${heroName}`,
      author: selectedStudentHero ? `Thầy ${teacherName} & Lớp ${className}` : 'Em & Trí Tuệ Nhân Tạo AI',
      category: selectedStudentHero ? 'classroom' : 'fantasy',
      coverImage: selectedStudentHero
        ? getSmartThemedIllustration(`lớp học ${className} học sinh ${heroName}`)
        : getSmartThemedIllustration(setting || 'lớp học thiếu nhi'),
      summary: fallbackData.summary || `Một câu chuyện tuyệt đẹp đầy ắp phép màu và tình yêu thương dành cho bạn ${heroName} lớp ${className}.`,
      theme: moral,
      language,
      pages: fallbackData.pages.map((p: any, idx: number) => ({
        pageNumber: p.pageNumber || idx + 1,
        text: p.text,
        illustrationPrompt: p.illustrationPrompt,
        imageUrl: getSmartThemedIllustration(p.illustrationPrompt + ' ' + (p.text || '') + ' ' + setting),
        imageSize: '1K',
      })),
    };

    setTimeout(() => {
      setIsGenerating(false);
      onStoryCreated(newStory);
      onClose();
    }, 400);
  };

  const handleGenerateStory = async () => {
    setIsGenerating(true);
    setError(null);
    setHasStartedWorkflow(true);

    const initialSteps: WorkflowStepState[] = [
      { step: 1, name: 'Step 1: Khởi tạo ý tưởng & Cốt truyện', status: 'waiting' },
      { step: 2, name: 'Step 2: Soạn thảo nội dung các trang', status: 'waiting' },
      { step: 3, name: 'Step 3: Xây dựng kịch bản tranh minh họa', status: 'waiting' },
    ];
    setWorkflowSteps(initialSteps);

    try {
      const generated = await generateStoryWithStrictProgress({
        character,
        setting,
        topic,
        moral,
        pageCount,
        language,
        onStepChange: (updated) => setWorkflowSteps(updated),
      });

      const heroName = selectedStudentHero ? selectedStudentHero.name : 'Bạn Nhỏ Dũng Cảm';
      const pagesList = Array.isArray(generated.pages) && generated.pages.length > 0
        ? generated.pages
        : generateLocalFallbackStory({
            character,
            setting,
            topic,
            moral,
            pageCount,
            language,
          }).pages;

      const newStory: Story = {
        id: `story-${Date.now()}`,
        title: generated.title || `Chuyện Về Bạn ${heroName}`,
        author: selectedStudentHero ? `Thầy ${teacherName} & Lớp ${className}` : 'Em & Trí Tuệ Nhân Tạo AI',
        category: selectedStudentHero ? 'classroom' : 'fantasy',
        coverImage: selectedStudentHero
          ? getSmartThemedIllustration(`lớp học ${className} học sinh ${heroName}`)
          : getSmartThemedIllustration(setting || 'lớp học thiếu nhi'),
        summary: generated.summary || `Một câu chuyện tuyệt đẹp đầy ắp phép màu và tình yêu thương dành cho bạn ${heroName}.`,
        theme: moral,
        language,
        pages: pagesList.map((p: any, idx: number) => {
          const pPrompt = p.illustrationPrompt || `Tranh thiếu nhi cổ tích rực rỡ ấm áp: ${character} tại ${setting}`;
          return {
            pageNumber: p.pageNumber || idx + 1,
            text: p.text || 'Ngày xửa ngày xưa...',
            illustrationPrompt: pPrompt,
            imageUrl: p.imageUrl || getSmartThemedIllustration(pPrompt + ' ' + (p.text || '') + ' ' + setting),
            imageSize: '1K',
          };
        }),
      };

      setTimeout(() => {
        onStoryCreated(newStory);
        onClose();
      }, 700);
    } catch (err: any) {
      console.error('Lỗi khi tạo truyện theo quy trình AI Instructions:', err);
      // Hiển thị nguyên văn lỗi từ API (VD: 429 RESOURCE_EXHAUSTED)
      const rawApiMsg = err.message || '429 RESOURCE_EXHAUSTED: Hạn mức của các model đều đã cạn kiệt';
      setError(rawApiMsg);
      // Đảm bảo toàn bộ các bước chưa thành công đều chuyển thành 'error' ("Đã dừng do lỗi") theo AI_INSTRUCTIONS.md
      setWorkflowSteps((prev) =>
        prev.map((s) => (s.status === 'success' ? s : { ...s, status: 'error', errorMessage: rawApiMsg }))
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border-4 border-amber-200 overflow-hidden">
        {/* TIÊU ĐỀ */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-sm text-2xl">✨</span>
            <div>
              <h2 className="text-lg sm:text-2xl font-black tracking-tight">
                Sáng Tác Truyện Mới Cùng AI
              </h2>
              <p className="text-xs text-amber-100 font-medium">
                Đồng bộ học sinh lớp {className} vào truyện & tạo cuộc phiêu lưu kỳ thú!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-2xl transition text-white active:scale-95"
          >
            <X size={24} />
          </button>
        </div>

        {/* THÂN HỘP THOẠI */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* MỤC ĐỒNG BỘ: CHỌN HỌC SINH TRONG LỚP LÀM NHÂN VẬT CHÍNH */}
          {students && students.length > 0 && (
            <div className="bg-emerald-50/90 p-4 rounded-2xl border-2 border-emerald-300 shadow-sm space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-black text-emerald-950 uppercase flex items-center gap-1.5">
                  <Users size={16} className="text-emerald-600" />
                  <span>Đồng Bộ Học Sinh Lớp {className} Vào Truyện ({students.length} bạn)</span>
                </label>
                <div className="flex items-center gap-2">
                  {selectedStudentHero && (
                    <span className="text-[11px] font-bold text-emerald-900 bg-white px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1 shadow-2xs">
                      <UserCheck size={13} className="text-emerald-600" />
                      Nhân vật chính: <strong>{selectedStudentHero.name}</strong>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowFullStudentGrid(!showFullStudentGrid)}
                    className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline"
                  >
                    {showFullStudentGrid ? 'Thu gọn' : 'Xem toàn bộ lưới'}
                  </button>
                </div>
              </div>

              {/* Ô tìm kiếm nhanh học sinh */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600" />
                <input
                  type="text"
                  placeholder={`Tìm bạn học sinh trong ${students.length} bạn theo tên hoặc tổ...`}
                  value={studentSearchTerm}
                  onChange={(e) => setStudentSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white text-xs rounded-xl border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              {/* Danh sách học sinh */}
              <div className={showFullStudentGrid ? "grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1" : "flex gap-2 overflow-x-auto pb-1.5 no-scrollbar"}>
                {students
                  .filter((s) => s.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) || `tổ ${s.group}`.includes(studentSearchTerm.toLowerCase()))
                  .map((s, idx) => {
                    const isSelected = selectedStudentHero?.id === s.id;
                    return (
                      <button
                        key={`creator-student-${s.id}-${idx}`}
                        type="button"
                        onClick={() => chooseStudentAsHero(s)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                          showFullStudentGrid ? 'w-full justify-between' : 'whitespace-nowrap shrink-0'
                        } ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-md scale-102 ring-2 ring-emerald-300'
                            : 'bg-white hover:bg-emerald-100 text-gray-800 border-emerald-200'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-base">{s.avatar}</span>
                          <span className="truncate">{s.name}</span>
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${isSelected ? 'bg-emerald-700 text-emerald-100' : 'bg-emerald-50 text-emerald-800'}`}>
                          Tổ {s.group}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          {/* CHỌN NGÔN NGỮ & SỐ TRANG */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                <Globe2 size={14} className="text-red-500" /> Ngôn Ngữ Câu Chuyện
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setLanguage('vi')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                    language === 'vi'
                      ? 'bg-red-600 text-white border-red-600 shadow-sm'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                  }`}
                >
                  🇻🇳 Tiếng Việt
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                    language === 'en'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                  }`}
                >
                  🇬🇧 Tiếng Anh
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                <BookOpen size={14} className="text-amber-500" /> Độ Dài Cuốn Sách
              </label>
              <div className="flex gap-2">
                {[3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setPageCount(num)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                      pageCount === num
                        ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                    }`}
                  >
                    {num} trang
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* NHÂN VẬT CHÍNH MÔ TẢ */}
          <div>
            <label className="text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
              <Smile size={14} className="text-orange-500" /> Mô Tả Nhân Vật Chính
            </label>
            <div className="flex gap-1.5 overflow-x-auto pb-2 no-scrollbar">
              {quickCharacters.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setSelectedStudentHero(null);
                    setCharacter(c.val);
                  }}
                  className="text-xs font-bold px-3 py-1.5 rounded-full bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-200 whitespace-nowrap transition"
                >
                  {c.label}
                </button>
              ))}
            </div>
            <textarea
              rows={2}
              value={character}
              onChange={(e) => setCharacter(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white outline-none resize-none"
              placeholder="Nhập tên và đặc điểm bạn nhỏ hoặc nhân vật..."
            />
          </div>

          {/* BỐI CẢNH */}
          <div>
            <label className="text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
              <Compass size={14} className="text-emerald-500" /> Chuyến Phiêu Lưu Diễn Ra Ở Đâu?
            </label>
            <div className="flex gap-1.5 overflow-x-auto pb-2 no-scrollbar">
              {quickSettings.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSetting(s.val)}
                  className="text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 whitespace-nowrap transition"
                >
                  {s.label}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={setting}
              onChange={(e) => setSetting(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white outline-none"
              placeholder="Ví dụ: Lớp học 12A6 cùng thầy Phạm Hậu và các bạn"
            />
          </div>

          {/* CHỦ ĐỀ & BÀI HỌC Ý NGHĨA */}
          <div>
            <label className="text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
              <Heart size={14} className="text-rose-500" /> Bài Học Đạo Đức & Thông Điệp
            </label>
            <div className="flex gap-1.5 overflow-x-auto pb-2 no-scrollbar">
              {quickMorals.map((m, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setMoral(m)}
                  className="text-xs font-bold px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 whitespace-nowrap transition"
                >
                  {m}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={moral}
              onChange={(e) => setMoral(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white outline-none"
              placeholder="Ví dụ: Lòng nhân ái, tình bạn và niềm vui học tập"
            />
          </div>

          {/* TIẾN TRÌNH 3 BƯỚC THEO QUY CHUẨN AI_INSTRUCTIONS.MD */}
          {hasStartedWorkflow && (
            <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-black text-gray-800">
                <span>TIẾN TRÌNH XỬ LÝ (QUY CHUẨN 3 BƯỚC & RETRY FALLBACK):</span>
                <span className="text-amber-700 font-bold">
                  {workflowSteps.filter((s) => s.status === 'success').length} / 3 bước thành công
                </span>
              </div>

              {/* PROGRESS BAR: CHỈ HIỂN THỊ XANH KHI BƯỚC ĐÓ THỰC SỰ THÀNH CÔNG */}
              <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    error ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                  style={{
                    width: `${(workflowSteps.filter((s) => s.status === 'success').length / 3) * 100}%`,
                  }}
                />
              </div>

              {/* 3 CỘT TIẾN TRÌNH */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {workflowSteps.map((st) => {
                  let statusBadge = (
                    <span className="text-[10px] text-gray-500 font-bold bg-gray-200 px-2 py-0.5 rounded-md">
                      Đang chờ
                    </span>
                  );
                  let borderColor = 'border-gray-200 bg-white';

                  if (st.status === 'running') {
                    borderColor = 'border-amber-400 bg-amber-50 ring-1 ring-amber-300';
                    statusBadge = (
                      <span className="text-[10px] text-amber-800 font-bold bg-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Loader2 size={10} className="animate-spin" />
                        Đang chạy ({st.modelUsed || 'AI'})
                      </span>
                    );
                  } else if (st.status === 'success') {
                    borderColor = 'border-emerald-400 bg-emerald-50';
                    statusBadge = (
                      <span className="text-[10px] text-emerald-800 font-bold bg-emerald-200 px-2 py-0.5 rounded-md">
                        ✓ Hoàn tất
                      </span>
                    );
                  } else if (st.status === 'error') {
                    borderColor = 'border-rose-400 bg-rose-50';
                    statusBadge = (
                      <span className="text-[10px] text-rose-800 font-black bg-rose-200 px-2 py-0.5 rounded-md">
                        Đã dừng do lỗi
                      </span>
                    );
                  }

                  return (
                    <div
                      key={`wf-step-${st.step}`}
                      className={`p-2.5 rounded-xl border text-left flex flex-col justify-between ${borderColor}`}
                    >
                      <div className="text-xs font-black text-gray-800 mb-1">{st.name}</div>
                      <div>{statusBadge}</div>
                    </div>
                  );
                })}
              </div>

              {/* THÔNG BÁO LỖI NGUYÊN VĂN TỪ API (VD: 429 RESOURCE_EXHAUSTED) */}
              {error && (
                <div className="p-3.5 bg-rose-50 border-2 border-rose-400 rounded-xl text-xs text-rose-800 font-semibold space-y-2.5">
                  <div className="font-black flex items-center gap-1.5 text-rose-900">
                    <span>⚠️ THÔNG BÁO LỖI TỪ MÔ HÌNH:</span>
                  </div>
                  <div className="font-mono text-[11px] bg-white p-2 rounded border border-rose-200 break-words text-rose-700">
                    {error}
                  </div>
                  <p className="text-[11px] text-rose-800 leading-relaxed">
                    * Các bước đang chờ đã chuyển thành <strong>"Đã dừng do lỗi"</strong> theo đúng quy chuẩn AI Instructions. Quý thầy/cô có thể cập nhật mã khóa mới hoặc bấm nút tạo truyện dự phòng thông minh ngay bên dưới để tiếp tục bài giảng mà không bị gián đoạn.
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {onOpenApiKeySettings && (
                      <button
                        type="button"
                        onClick={onOpenApiKeySettings}
                        className="bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-xs transition"
                      >
                        🔑 Mở Cài Đặt API Key
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleCreateFallbackStoryNow}
                      className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black px-3.5 py-1.5 rounded-xl text-xs shadow-xs flex items-center gap-1.5 transition"
                    >
                      <Sparkles size={13} />
                      <span>⚡ Tạo Truyện Tranh Dự Phòng Ngay Cho Bé</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* CHÂN HỘP THOẠI */}
        <div className="p-4 sm:p-5 bg-amber-50/60 border-t border-amber-200 flex items-center justify-between">
          <p className="text-xs text-gray-500 font-medium">
            Mô hình: <span className="font-bold text-amber-700">Gemini AI (Tự động chuyển tiếp thông minh)</span>
          </p>
          <button
            onClick={handleGenerateStory}
            disabled={isGenerating || !character.trim() || !setting.trim()}
            className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 active:scale-95 text-white px-6 py-3 rounded-2xl font-black text-xs sm:text-sm shadow-xl flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Đang Viết Truyện Cho Bé...
              </>
            ) : (
              <>
                <Wand2 size={18} />
                Bắt Đầu Sáng Tác!
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
