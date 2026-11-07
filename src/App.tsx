import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Sparkles, Plus, GraduationCap, Volume2, 
  MessageCircle, Star, Search, Save, CheckCircle2, 
  Clock, AlertCircle, Users, Edit3, Settings, KeyRound, ExternalLink
} from 'lucide-react';
import { Story, StoryPage, Student, ClassroomData } from './types';
import { DEFAULT_STORIES } from './data/defaultStories';
import { StoryReader } from './components/StoryReader';
import { StoryBuddyChat } from './components/StoryBuddyChat';
import { StoryCreatorModal } from './components/StoryCreatorModal';
import { StoryEditorModal } from './components/StoryEditorModal';
import { ClassroomHub } from './components/ClassroomHub';
import { ApiKeyModal } from './components/ApiKeyModal';
import { getSavedApiKey, STORAGE_KEYS } from './services/geminiService';

const PRIMARY_STORAGE_KEY = STORAGE_KEYS.CLASSROOM_DATA;
const LEGACY_STORAGE_KEY = STORAGE_KEYS.LEGACY_DATA;

export default function App() {
  const [stories, setStories] = useState<Story[]>(DEFAULT_STORIES);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [activeView, setActiveView] = useState<'shelf' | 'reader' | 'classroom'>('shelf');
  
  // API Key & Model Settings Modal
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(true);

  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<StoryPage | undefined>(undefined);

  // Story Creator state
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [heroStudentForStory, setHeroStudentForStory] = useState<Student | null>(null);

  // Filter & Search
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Classroom Global State (Đồng bộ lớp học)
  const [className, setClassName] = useState<string>('12A6');
  const [schoolName, setSchoolName] = useState<string>('THPT Hồng Ngự 3');
  const [teacherName, setTeacherName] = useState<string>('Phạm Hậu');
  const [students, setStudents] = useState<Student[]>([
    { id: 1, name: 'Nguyễn Phương Anh', points: 15, avatar: '🐰', group: 1, phone: '0901234567', called: false },
    { id: 2, name: 'Cao Minh Tuấn', points: 12, avatar: '🦊', group: 2, phone: '0912345678', called: false },
    { id: 3, name: 'Lục Thành An', points: 20, avatar: '🐯', group: 3, phone: '0923456789', called: false },
    { id: 4, name: 'Đỗ Tùng Lâm', points: 8, avatar: '🐼', group: 4, phone: '0934567890', called: false },
    { id: 5, name: 'Trần Đăng Khoa', points: 5, avatar: '🐶', group: 1, phone: '0945678901', called: false },
  ]);
  const [attendance, setAttendance] = useState<Record<number, { status: string; reason?: string }>>({});
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [globalNotice, setGlobalNotice] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setGlobalNotice(msg);
    setTimeout(() => setGlobalNotice(null), 3500);
  };

  // Kiểm tra API Key khi khởi chạy app
  useEffect(() => {
    const key = getSavedApiKey();
    const keyExists = Boolean(key && key.trim());
    setHasApiKey(keyExists);
    if (!keyExists) {
      // Nhắc nhở người dùng nhập API Key sau 1.5 giây nếu chưa có
      const timer = setTimeout(() => {
        setIsApiKeyModalOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Hàm đảm bảo toàn bộ học sinh có ID duy nhất tuyệt đối (chống lỗi trùng key)
  const ensureUniqueStudentIds = (rawStudents: Student[]): Student[] => {
    if (!rawStudents || !Array.isArray(rawStudents)) return [];
    const seenIds = new Set<number>();
    return rawStudents.map((s, idx) => {
      let id = s.id;
      if (!id || seenIds.has(id)) {
        id = Date.now() + (idx + 1) * 10000 + Math.floor(Math.random() * 9000) + 1;
      }
      seenIds.add(id);
      return { ...s, id };
    });
  };

  // 1. Tự động tải dữ liệu đã lưu từ server & localStorage khi mở app
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const res = await fetch('/api/class-data');
        if (res.ok) {
          const serverData = await res.json();
          if (serverData && serverData.students && serverData.students.length > 0) {
            setClassName(serverData.className || '12A6');
            setSchoolName(serverData.schoolName || 'THPT Hồng Ngự 3');
            setTeacherName(serverData.teacherName || 'Phạm Hậu');
            setStudents(ensureUniqueStudentIds(serverData.students));
            setAttendance(serverData.attendance || {});
            if (serverData.stories && serverData.stories.length > 0) {
              setStories(serverData.stories);
            }
            setLastSynced(serverData.lastSynced || null);
            return;
          }
        }
      } catch (err) {
        console.warn('Không thể đọc dữ liệu từ máy chủ, chuyển sang bộ nhớ cục bộ:', err);
      }

      // Đọc từ localStorage (hỗ trợ cả khoá mới và khoá cũ)
      try {
        const local = localStorage.getItem(PRIMARY_STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
        if (local) {
          const parsed: ClassroomData = JSON.parse(local);
          if (parsed.students && parsed.students.length > 0) {
            setClassName(parsed.className || '12A6');
            setSchoolName(parsed.schoolName || 'THPT Hồng Ngự 3');
            setTeacherName(parsed.teacherName || 'Phạm Hậu');
            setStudents(ensureUniqueStudentIds(parsed.students));
            setAttendance(parsed.attendance || {});
            if (parsed.stories && parsed.stories.length > 0) {
              setStories(parsed.stories);
            }
            setLastSynced(parsed.lastSynced || null);
          }
        }
      } catch (e) {
        console.error('Lỗi phân tích localStorage:', e);
      }
    };

    loadSavedData();
  }, []);

  // 2. Hàm Lưu và Đồng Bộ Tất Cả Dữ Liệu Lớp Học, Học Sinh & Truyện
  const handleSyncAll = async () => {
    setIsSyncing(true);
    const nowIso = new Date().toISOString();

    const payload: ClassroomData = {
      className,
      schoolName,
      teacherName,
      students,
      attendance,
      stories, // Đồng bộ cả danh sách truyện và tranh ảnh mới tạo
      lastSynced: nowIso,
    };

    // Lưu ngay vào localStorage (cả 2 khoá để tương thích tuyệt đối)
    try {
      localStorage.setItem(PRIMARY_STORAGE_KEY, JSON.stringify(payload));
      localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('Lỗi lưu localStorage:', e);
    }

    // Gửi lên server nếu đang chạy môi trường Node backend
    try {
      const res = await fetch('/api/class-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setLastSynced(nowIso);
        showNotice(`Đã lưu và đồng bộ thành công lớp ${className} (${students.length} học sinh & ${stories.length} truyện)!`);
        return;
      }
    } catch (err: any) {
      // Khi chạy Vercel SPA không có server backend thì bỏ qua lỗi mạng
    } finally {
      setIsSyncing(false);
    }

    setLastSynced(nowIso);
    showNotice(`Đã lưu toàn bộ dữ liệu lớp ${className} (${students.length} học sinh) an toàn trên thiết bị!`);
  };

  const handleOpenReader = (story: Story) => {
    setSelectedStory(story);
    setCurrentPage(story.pages[0]);
    setActiveView('reader');
  };

  const handleBackToShelf = () => {
    setActiveView('shelf');
  };

  const handleStoryCreated = (newStory: Story) => {
    const updated = [newStory, ...stories];
    setStories(updated);
    handleOpenReader(newStory);
    showNotice(`Đã sáng tác xong truyện "${newStory.title}"! Đang tự động đồng bộ...`);

    // Tự động lưu truyện mới cùng danh sách học sinh
    setTimeout(() => {
      handleSyncAll();
    }, 500);
  };

  // Cập nhật và lưu thay đổi truyện (Chỉnh sửa trực tiếp)
  const handleUpdateStory = (updatedStory: Story) => {
    setStories((prev) =>
      prev.map((s) => (s.id === updatedStory.id ? updatedStory : s))
    );
    if (selectedStory?.id === updatedStory.id) {
      setSelectedStory(updatedStory);
      setCurrentPage(updatedStory.pages[0]);
    }
    showNotice(`Đã lưu và cập nhật trực tiếp truyện "${updatedStory.title}"! Đang đồng bộ...`);

    setTimeout(() => {
      handleSyncAll();
    }, 400);
  };

  // Mở trình sáng tác truyện với bạn học sinh này là nhân vật chính
  const handleOpenStoryCreatorForStudent = (student: Student) => {
    setHeroStudentForStory(student);
    setIsCreatorOpen(true);
  };

  // Thưởng sao cho học sinh khi đọc diễn cảm trong StoryReader
  const handleAwardStudent = (studentId: number, points: number, reason: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, points: s.points + points, called: true } : s))
    );
    showNotice(`Đã cộng +${points} sao thi đua cho bạn đọc sách!`);
  };

  const categories = [
    { id: 'all', label: 'Tất Cả Truyện' },
    { id: 'classroom', label: `🏫 Lớp ${className} & Học Sinh` },
    { id: 'fantasy', label: '✨ Cổ Tích Thần Tiên' },
    { id: 'animals', label: '🐾 Thế Giới Loài Vật' },
    { id: 'adventure', label: '🧭 Phiêu Lưu Kỳ Thú' },
    { id: 'sci-fi', label: '🚀 Khám Phá Vũ Trụ' },
  ];

  const filteredStories = stories.filter((story) => {
    const matchesCategory = selectedCategory === 'all' || story.category === selectedCategory;
    const matchesSearch =
      story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (story.titleVi && story.titleVi.toLowerCase().includes(searchQuery.toLowerCase())) ||
      story.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.theme.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const ngayHoiStory = stories.find(
    (s) => s.id === 'lop-hoc-hanh-phuc-story' || s.title.toLowerCase().includes('ngày hội')
  );

  return (
    <div className="min-h-screen bg-[#FFFDF9] text-gray-800 font-sans flex flex-col relative selection:bg-amber-200">
      {/* THÔNG BÁO NỔI TOÀN HỆ THỐNG */}
      {globalNotice && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-700 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 animate-in fade-in zoom-in-95">
          <CheckCircle2 size={18} className="text-yellow-300" />
          <span>{globalNotice}</span>
        </div>
      )}

      {/* THANH ĐIỀU HƯỚNG CHUNG */}
      {activeView !== 'reader' && (
        <header className="bg-white/95 backdrop-blur-md border-b-2 border-amber-200 sticky top-0 z-40 px-4 py-3 shadow-sm">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
            {/* THƯƠNG HIỆU */}
            <div
              onClick={() => setActiveView('shelf')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center text-white text-xl shadow-md group-hover:scale-105 transition">
                🏫
              </div>
              <div>
                <h1 className="text-sm sm:text-lg font-black text-amber-950 tracking-tight flex items-center gap-1.5">
                  LỚP HỌC HẠNH PHÚC <span className="text-[10px] sm:text-xs bg-rose-600 text-white font-black px-2 py-0.5 rounded-full shadow-sm">PHẠM HẬU</span>
                </h1>
                <p className="text-[10px] sm:text-[11px] text-amber-700 font-medium hidden sm:block">
                  Quản Lý Lớp Học Hạnh Phúc & Sách Nói AI Lớp {className}
                </p>
              </div>
            </div>

            {/* CÁC NÚT ĐIỀU HƯỚNG VÀ LƯU DỮ LIỆU */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* NÚT SETTINGS API KEY (QUY CHUẨN: DÒNG CHỮ ĐỎ LẤY API KEY ĐỂ SỬ DỤNG APP) */}
              <button
                onClick={() => setIsApiKeyModalOpen(true)}
                className={`relative px-2.5 sm:px-3 py-2 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-sm border ${
                  hasApiKey
                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-950 border-amber-300'
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-950 border-rose-300 ring-2 ring-rose-400 animate-pulse'
                }`}
                title="Cài đặt Google Gemini API Key & Chọn Model AI"
              >
                <KeyRound size={15} className={hasApiKey ? 'text-amber-600' : 'text-rose-600'} />
                <span className="hidden md:inline font-bold">Settings (API Key)</span>
                <span className="text-rose-600 font-black text-[10px] sm:text-[11px]">
                  Lấy API key để sử dụng app
                </span>
                {!hasApiKey && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-600 rounded-full border-2 border-white animate-ping" />
                )}
              </button>

              {/* NÚT LƯU DỮ LIỆU LỚP VÀ DANH SÁCH HỌC SINH */}
              <button
                onClick={handleSyncAll}
                disabled={isSyncing}
                className="bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-emerald-950 font-black px-3 py-2 rounded-2xl text-xs flex items-center gap-1.5 shadow-md transition disabled:opacity-50"
                title="Lưu dữ liệu lớp học, điểm danh, danh sách học sinh và truyện mới"
              >
                <Save size={15} className={isSyncing ? 'animate-spin' : ''} />
                <span className="hidden lg:inline">
                  {isSyncing ? 'Đang lưu...' : 'Lưu & Đồng Bộ'}
                </span>
                <span className="lg:hidden">Lưu</span>
              </button>

              {/* NÚT CHUYỂN SANG LỚP HỌC HẠNH PHÚC */}
              <button
                onClick={() => setActiveView(activeView === 'classroom' ? 'shelf' : 'classroom')}
                className={`px-3 py-2 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition active:scale-95 ${
                  activeView === 'classroom'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                <Users size={15} />
                <span className="hidden sm:inline">Lớp {className} ({students.length})</span>
                <span className="sm:hidden">Lớp</span>
              </button>

              {/* NÚT SÁNG TÁC TRUYỆN MỚI */}
              <button
                onClick={() => {
                  setHeroStudentForStory(null);
                  setIsCreatorOpen(true);
                }}
                className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 active:scale-95 text-white px-3 py-2 rounded-2xl font-black text-xs shadow-md flex items-center gap-1.5 transition"
              >
                <Plus size={15} />
                <span className="hidden sm:inline">Sáng Tác Truyện</span>
                <span className="sm:hidden">Tạo</span>
              </button>

              {/* NÚT MỞ BẠN KỂ CHUYỆN */}
              <button
                onClick={() => setIsChatOpen(true)}
                className="bg-amber-100 hover:bg-amber-200 text-amber-900 p-2 rounded-2xl font-bold transition flex items-center justify-center active:scale-95"
                title="Trò chuyện với Bạn Kể Chuyện AI"
              >
                <MessageCircle size={18} />
              </button>
            </div>
          </div>
        </header>
      )}

      {/* CHUYỂN ĐỔI GIAO DIỆN */}
      {activeView === 'reader' && selectedStory ? (
        <StoryReader
          story={selectedStory}
          onBack={handleBackToShelf}
          onOpenChat={() => setIsChatOpen(true)}
          onPageChange={(page) => setCurrentPage(page)}
          students={students}
          onAwardStudent={handleAwardStudent}
          onOpenStoryCreatorWithStudent={handleOpenStoryCreatorForStudent}
          onStoryUpdated={handleUpdateStory}
        />
      ) : activeView === 'classroom' ? (
        <ClassroomHub
          students={students}
          setStudents={setStudents}
          className={className}
          setClassName={setClassName}
          schoolName={schoolName}
          setSchoolName={setSchoolName}
          teacherName={teacherName}
          setTeacherName={setTeacherName}
          attendance={attendance}
          setAttendance={setAttendance}
          lastSynced={lastSynced}
          onSyncAll={handleSyncAll}
          isSyncing={isSyncing}
          onOpenStoryShelf={() => setActiveView('shelf')}
          onOpenStoryCreatorWithStudent={handleOpenStoryCreatorForStudent}
        />
      ) : (
        /* GIAO DIỆN TỦ SÁCH TRUYỆN */
        <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-8 pb-24">
          {/* BANNER NỔI BẬT */}
          <div className="relative rounded-3xl sm:rounded-[36px] bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 p-6 sm:p-10 text-white shadow-xl overflow-hidden">
            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3.5 py-1 rounded-full text-xs font-bold mb-3 shadow-inner">
                <Sparkles size={14} className="text-yellow-200" />
                <span>Lớp Học Hạnh Phúc · Giáo Viên {teacherName} · Lớp {className} ({schoolName})</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                LỚP HỌC HẠNH PHÚC _ PHẠM HẬU
              </h2>
              <p className="mt-2 text-xs sm:text-base text-amber-100 font-medium leading-relaxed">
                Đồng bộ danh sách <strong>{students.length} học sinh</strong>: Quản lý lớp, điểm danh, vòng quay gọi tên, thi đua sao thưởng và sáng tác truyện cổ tích AI giọng đọc <strong className="text-white underline">gemini-3.8-flash-tts</strong>, vẽ tranh minh họa sinh động!
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    setHeroStudentForStory(null);
                    setIsCreatorOpen(true);
                  }}
                  className="bg-white hover:bg-amber-50 active:scale-95 text-amber-900 font-black px-6 py-3 rounded-2xl text-xs sm:text-sm shadow-lg flex items-center gap-2 transition"
                >
                  <Sparkles size={16} className="text-amber-500" />
                  Sáng Tác Truyện Cho Học Sinh Lớp Mình
                </button>

                {ngayHoiStory && (
                  <button
                    onClick={() => setEditingStory(ngayHoiStory)}
                    className="bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-amber-950 font-black px-5 py-3 rounded-2xl text-xs sm:text-sm shadow-lg flex items-center gap-2 transition"
                    title="Chỉnh sửa trực tiếp truyện Lớp Học Hạnh Phúc: Ngày Hội Đọc Sách"
                  >
                    <Edit3 size={16} className="text-amber-800" />
                    <span>Chỉnh Sửa Truyện Ngày Hội Sách</span>
                  </button>
                )}

                <button
                  onClick={() => setActiveView('classroom')}
                  className="bg-black/20 hover:bg-black/30 text-white font-bold px-5 py-3 rounded-2xl text-xs sm:text-sm backdrop-blur-sm transition flex items-center gap-2"
                >
                  <Users size={16} /> Xem Danh Sách Học Sinh ({students.length})
                </button>
              </div>
            </div>

            <div className="absolute -right-8 -bottom-10 text-9xl opacity-25 select-none pointer-events-none">
              📖
            </div>
          </div>

          {/* THANH ĐỒNG BỘ DANH SÁCH HỌC SINH NHANH TRÊN TỦ SÁCH */}
          <div className="bg-emerald-50/80 p-4 rounded-3xl border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🎒</span>
              <div>
                <h4 className="font-black text-emerald-950 text-xs sm:text-sm">
                  Danh Sách Học Sinh Lớp {className} ({students.length} bạn)
                </h4>
                <p className="text-[11px] text-emerald-700">
                  Bấm vào tên bạn học sinh bất kỳ để sáng tác ngay câu chuyện cổ tích độc quyền!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 no-scrollbar">
              {students.slice(0, 5).map((s, idx) => (
                <button
                  key={`shelf-student-${s.id}-${idx}`}
                  onClick={() => handleOpenStoryCreatorForStudent(s)}
                  className="bg-white hover:bg-emerald-100 text-gray-800 border border-emerald-300 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 whitespace-nowrap transition active:scale-95"
                  title={`Sáng tác truyện cho bạn ${s.name}`}
                >
                  <span>{s.avatar}</span>
                  <span>{s.name}</span>
                </button>
              ))}
              <button
                onClick={() => setActiveView('classroom')}
                className="bg-emerald-600 text-white hover:bg-emerald-700 px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition"
              >
                Xem tất cả ({students.length}) →
              </button>
            </div>
          </div>

          {/* TÌM KIẾM & BỘ LỌC THỂ LOẠI */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 no-scrollbar">
              {categories.map((c) => {
                const isSelected = selectedCategory === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id)}
                    className={`px-4 py-2 rounded-2xl font-bold text-xs whitespace-nowrap transition-all ${
                      isSelected
                        ? 'bg-amber-500 text-white shadow-md'
                        : 'bg-white hover:bg-amber-50 text-gray-700 border border-amber-200'
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>

            <div className="relative w-full sm:w-72">
              <Search size={16} className="absolute left-3.5 top-3 text-amber-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm truyện, bài học ý nghĩa..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-amber-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none shadow-sm"
              />
            </div>
          </div>

          {/* LƯỚI DANH SÁCH TRUYỆN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStories.map((story, idx) => (
              <div
                key={`shelf-story-${story.id}-${idx}`}
                className="bg-white rounded-3xl border-2 border-amber-100 hover:border-amber-300 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group cursor-pointer"
                onClick={() => handleOpenReader(story)}
              >
                {/* ẢNH BÌA TRUYỆN */}
                <div className="relative aspect-[16/10] overflow-hidden bg-amber-100">
                  <img
                    src={story.coverImage}
                    alt={story.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-amber-900 text-[11px] font-black px-2.5 py-1 rounded-full shadow-sm border border-amber-200 flex items-center gap-1">
                    <Star size={12} className="text-yellow-500 fill-yellow-500" />
                    <span>{story.pages.length} Trang</span>
                  </div>

                  {/* NÚT CHỈNH SỬA TRỰC TIẾP TRÊN ẢNH BÌA */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingStory(story);
                    }}
                    className="absolute top-3 right-3 bg-white/95 hover:bg-white active:scale-95 text-amber-950 text-xs font-black px-2.5 py-1.5 rounded-xl shadow-md border border-amber-300 flex items-center gap-1 transition z-10"
                    title="Chỉnh sửa câu chữ, cốt truyện và ảnh minh họa trực tiếp"
                  >
                    <Edit3 size={13} className="text-amber-600" />
                    <span>Sửa trực tiếp</span>
                  </button>

                  <div className="absolute bottom-3 right-3 bg-amber-500 text-white p-2.5 rounded-2xl shadow-lg opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                    <Volume2 size={18} />
                  </div>
                </div>

                {/* NỘI DUNG THẺ TRUYỆN */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-600 mb-1.5 flex-wrap">
                      <span>{story.theme}</span>
                      <span>•</span>
                      <span className="text-gray-400 capitalize">{story.category}</span>
                      {(story.id === 'lop-hoc-hanh-phuc-story' || story.title.toLowerCase().includes('ngày hội')) && (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-300">
                          🎪 Ngày Hội Sách
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-black text-amber-950 group-hover:text-amber-600 transition leading-snug">
                      {story.title}
                    </h3>

                    <p className="text-xs text-gray-600 font-medium mt-2 line-clamp-2 leading-relaxed">
                      {story.summary}
                    </p>
                  </div>

                  {/* CHÂN THẺ */}
                  <div className="pt-3 mt-3 border-t border-amber-100 flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-500 truncate max-w-[130px]" title={story.author}>
                      Tác giả: {story.author}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingStory(story);
                        }}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl font-bold text-xs flex items-center gap-1 transition active:scale-95"
                        title="Chỉnh sửa câu chữ hoặc tranh minh họa của truyện này"
                      >
                        <Edit3 size={13} className="text-amber-600" />
                        <span>Sửa</span>
                      </button>
                      <span className="font-black text-amber-600 group-hover:translate-x-1 transition flex items-center gap-0.5 pl-1">
                        Đọc →
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredStories.length === 0 && (
            <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-amber-200">
              <span className="text-5xl mb-3 block">🔍</span>
              <h3 className="text-lg font-bold text-gray-800">Không tìm thấy câu chuyện phù hợp</h3>
              <p className="text-xs text-gray-500 mt-1">Hãy thử với từ khóa khác hoặc bấm nút Sáng tác truyện mới!</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="mt-4 bg-amber-500 text-white px-4 py-2 rounded-xl text-xs font-bold"
              >
                Xem tất cả truyện
              </button>
            </div>
          )}
        </main>
      )}

      {/* NÚT NỔI MỞ BẠN KỂ CHUYỆN */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 active:scale-95 text-white p-4 rounded-full shadow-2xl z-40 transition-all flex items-center gap-2 group"
          title="Trò chuyện cùng Bạn Kể Chuyện AI"
        >
          <span className="text-2xl group-hover:rotate-12 transition-transform">🦉</span>
          <span className="font-black text-xs hidden sm:inline pr-1">Hỏi Bạn Kể Chuyện</span>
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-yellow-300 rounded-full border-2 border-white animate-ping"></span>
        </button>
      )}

      {/* KHUNG CHAT TRÒ CHUYỆN */}
      <StoryBuddyChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        currentStory={selectedStory || undefined}
        currentPage={currentPage}
      />

      {/* HỘP THOẠI SÁNG TÁC TRUYỆN MỚI (ĐỒNG BỘ HỌC SINH) */}
      <StoryCreatorModal
        isOpen={isCreatorOpen}
        onClose={() => {
          setIsCreatorOpen(false);
          setHeroStudentForStory(null);
        }}
        onStoryCreated={handleStoryCreated}
        students={students}
        className={className}
        schoolName={schoolName}
        teacherName={teacherName}
        preselectedStudent={heroStudentForStory}
        onOpenApiKeySettings={() => setIsApiKeyModalOpen(true)}
      />

      {/* MODAL CHỈNH SỬA TRỰC TIẾP TRUYỆN */}
      {editingStory && (
        <StoryEditorModal
          isOpen={editingStory !== null}
          onClose={() => setEditingStory(null)}
          story={editingStory}
          onSaveStory={handleUpdateStory}
        />
      )}

      {/* MODAL THIẾT LẬP MODEL & API KEY GEMINI */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onSaved={() => {
          setHasApiKey(Boolean(getSavedApiKey()));
          showNotice('Đã cập nhật cấu hình API Key & Model AI thành công!');
        }}
      />
    </div>
  );
}
