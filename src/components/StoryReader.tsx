import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, RotateCcw, Volume2, Sparkles, ChevronLeft, ChevronRight, 
  Settings, Maximize2, Minimize2, Image as ImageIcon, Sliders, CheckCircle2, 
  MessageCircle, Heart, Award, VolumeX, Loader2, Shuffle, Check,
  Users, Search, X, Star, BookOpen, UserCheck, Plus, Edit3
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Story, StoryPage, Student } from '../types';
import { VOICE_OPTIONS } from '../data/defaultStories';
import { IllustrationModal } from './IllustrationModal';
import { StoryEditorModal } from './StoryEditorModal';
import { StorySlidePresentation } from './StorySlidePresentation';
import { getSavedApiKey } from '../services/geminiService';

interface StoryReaderProps {
  story: Story;
  onBack: () => void;
  onOpenChat: () => void;
  onPageChange?: (page: StoryPage) => void;
  students?: Student[];
  onAwardStudent?: (studentId: number, points: number, reason: string) => void;
  onOpenStoryCreatorWithStudent?: (student: Student) => void;
  onStoryUpdated?: (updatedStory: Story) => void;
}

export const StoryReader: React.FC<StoryReaderProps> = ({
  story,
  onBack,
  onOpenChat,
  onPageChange,
  students = [],
  onAwardStudent,
  onOpenStoryCreatorWithStudent,
  onStoryUpdated,
}) => {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [currentPages, setCurrentPages] = useState<StoryPage[]>(story.pages);

  // Audio / TTS state
  const [selectedVoice, setSelectedVoice] = useState('Puck');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [showVoiceMenu, setShowVoiceMenu] = useState(false);

  // Highlighting simulation
  const [highlightWordIndex, setHighlightWordIndex] = useState<number>(-1);

  // Illustration state
  const [selectedImageSize, setSelectedImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [isGeneratingIllustration, setIsGeneratingIllustration] = useState(false);
  const [showIllustrationModal, setShowIllustrationModal] = useState(false);
  const [isPresentationOpen, setIsPresentationOpen] = useState(false);

  // Classroom student reader call
  const [calledReader, setCalledReader] = useState<Student | null>(null);
  const [isPickingReader, setIsPickingReader] = useState(false);
  const [showStudentListDrawer, setShowStudentListDrawer] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

  // In-place text editing & full story editing modal
  const [isEditingPageText, setIsEditingPageText] = useState(false);
  const [editedPageText, setEditedPageText] = useState('');
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);

  // Audio element reference & cache
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCacheRef = useRef<Record<string, string>>({}); // cache key: `${pageNumber}_${voice}`

  const currentPage = currentPages[currentPageIndex] || currentPages[0];

  const handleSavePageText = () => {
    if (!editedPageText.trim()) return;
    const updatedPages = currentPages.map((p, idx) =>
      idx === currentPageIndex ? { ...p, text: editedPageText.trim() } : p
    );
    setCurrentPages(updatedPages);
    setIsEditingPageText(false);
    audioCacheRef.current = {};

    const updatedStory: Story = {
      ...story,
      pages: updatedPages,
    };

    if (onStoryUpdated) {
      onStoryUpdated(updatedStory);
    }
  };

  const handleFullStorySave = (updatedStory: Story) => {
    setCurrentPages(updatedStory.pages);
    audioCacheRef.current = {};
    if (onStoryUpdated) {
      onStoryUpdated(updatedStory);
    }
  };

  // Notify parent of current page
  useEffect(() => {
    if (currentPage && onPageChange) {
      onPageChange(currentPage);
    }
    stopAudio();
    setHighlightWordIndex(-1);
    setCalledReader(null);
    setIsEditingPageText(false);
  }, [currentPageIndex]);

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  // Play narration using gemini-3.8-flash-tts
  const handlePlayTTS = async () => {
    if (isPlaying) {
      stopAudio();
      return;
    }

    const textToRead = currentPage.text;
    const cacheKey = `${currentPage.pageNumber}_${selectedVoice}`;

    if (audioCacheRef.current[cacheKey]) {
      playAudioBlob(audioCacheRef.current[cacheKey]);
      return;
    }

    setIsLoadingAudio(true);
    setAudioError(null);

    try {
      const apiKey = getSavedApiKey();
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(apiKey ? { 'x-api-key': apiKey } : {}),
        },
        body: JSON.stringify({
          text: textToRead,
          voiceName: selectedVoice,
          style: "Người đọc truyện cổ tích truyền cảm, ấm áp, ngữ điệu sinh động, phát âm tiếng Việt rõ ràng, truyền cảm hứng cho các bạn nhỏ",
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Lỗi âm thanh (${res.status})`);
      }

      const data = await res.json();
      if (!data.audioUrl) {
        throw new Error('Không nhận được dữ liệu giọng đọc từ máy chủ');
      }

      audioCacheRef.current[cacheKey] = data.audioUrl;
      playAudioBlob(data.audioUrl);
    } catch (err: any) {
      console.warn('Lỗi đọc Gemini TTS, chuyển sang công cụ đọc của trình duyệt:', err);
      setAudioError('Sử dụng bộ đọc trình duyệt dự phòng');
      playBrowserSpeech(textToRead);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const playAudioBlob = (audioUrl: string) => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    audioRef.current.src = audioUrl;
    audioRef.current.playbackRate = playbackSpeed;

    audioRef.current.onended = () => {
      setIsPlaying(false);
      setHighlightWordIndex(-1);
      if (currentPageIndex === currentPages.length - 1) {
        triggerFinishCelebration();
      }
    };

    audioRef.current.onerror = () => {
      setIsPlaying(false);
      setAudioError('Lỗi phát âm thanh');
    };

    audioRef.current
      .play()
      .then(() => {
        setIsPlaying(true);
        startHighlightingWords(audioRef.current?.duration || 10);
      })
      .catch((err) => {
        console.error('Không thể phát âm thanh trực tiếp:', err);
        playBrowserSpeech(currentPage.text);
      });
  };

  // Browser speech synthesis fallback
  const playBrowserSpeech = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = playbackSpeed;
      utterance.lang = 'vi-VN';

      utterance.onstart = () => {
        setIsPlaying(true);
        startHighlightingWords(text.split(' ').length * 0.4);
      };

      utterance.onend = () => {
        setIsPlaying(false);
        setHighlightWordIndex(-1);
        if (currentPageIndex === currentPages.length - 1) {
          triggerFinishCelebration();
        }
      };

      window.speechSynthesis.speak(utterance);
    }
  };

  const startHighlightingWords = (estimatedDuration: number) => {
    const words = currentPage.text.split(' ');
    const intervalMs = (estimatedDuration * 1000) / (words.length || 1);
    let index = 0;

    const timer = setInterval(() => {
      if (!isPlaying && index > 0) {
        clearInterval(timer);
        return;
      }
      setHighlightWordIndex(index);
      index++;
      if (index >= words.length) {
        clearInterval(timer);
      }
    }, Math.max(150, intervalMs));
  };

  // Quick 1-click illustration generation with chosen imageSize
  const handleQuickGenerateIllustration = async (sizeToUse = selectedImageSize) => {
    if (isGeneratingIllustration) return;
    setIsGeneratingIllustration(true);

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: currentPage.illustrationPrompt,
          imageSize: sizeToUse, // Affordance for 1K, 2K, 4K
          aspectRatio: '4:3',
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Lỗi khi tạo tranh minh họa');
      }

      const data = await res.json();
      if (data.imageUrl) {
        handleIllustrationUpdated(currentPage.pageNumber, data.imageUrl, sizeToUse);
      }
    } catch (err: any) {
      console.warn('Thông báo khi tạo tranh minh họa:', err?.message);
    } finally {
      setIsGeneratingIllustration(false);
    }
  };

  const handleIllustrationUpdated = (pageNumber: number, imageUrl: string, imageSize: '1K' | '2K' | '4K') => {
    setCurrentPages((prev) =>
      prev.map((p) => (p.pageNumber === pageNumber ? { ...p, imageUrl, imageSize } : p))
    );
  };

  // Call a student from class to read the current page
  const handleCallStudentReader = () => {
    if (!students || students.length === 0) return;
    setIsPickingReader(true);

    setTimeout(() => {
      const uncalled = students.filter((s) => !s.called);
      const pool = uncalled.length > 0 ? uncalled : students;
      const chosen = pool[Math.floor(Math.random() * pool.length)];

      handlePickSpecificReader(chosen);
      setIsPickingReader(false);
    }, 800);
  };

  const handlePickSpecificReader = (student: Student) => {
    setCalledReader(student);
    if (onAwardStudent) {
      onAwardStudent(student.id, 2, `Đọc diễn cảm trang ${currentPage.pageNumber}`);
    }
    triggerFinishCelebration();
  };

  const triggerFinishCelebration = () => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#EC4899'],
    });
  };

  const goToPrev = () => {
    if (currentPageIndex > 0) setCurrentPageIndex((prev) => prev - 1);
  };

  const goToNext = () => {
    if (currentPageIndex < currentPages.length - 1) {
      setCurrentPageIndex((prev) => prev + 1);
    }
  };

  const words = currentPage.text.split(' ');

  return (
    <div className="min-h-screen bg-[#FFFBEB] flex flex-col font-sans pb-16">
      {/* THANH ĐIỀU HƯỚNG TRÊN CÙNG */}
      <header className="bg-white border-b-2 border-amber-200 sticky top-0 z-30 px-4 py-3 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-2xl transition flex items-center gap-1 text-xs font-bold active:scale-95"
            >
              <ChevronLeft size={18} />
              <span>Tủ Sách Truyện</span>
            </button>
            <div>
              <h1 className="text-sm sm:text-lg font-black text-amber-950 truncate max-w-[180px] sm:max-w-md">
                {story.title}
              </h1>
              <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Chủ đề: {story.theme}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* TRÌNH CHIẾU SLIDE BÀI GIẢNG TRÊN MÁY CHIẾU LỚP */}
            <button
              onClick={() => setIsPresentationOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-2xl font-bold text-xs shadow-md flex items-center gap-1.5 transition active:scale-95"
              title="Mở chế độ trình chiếu slide bài giảng toàn màn hình cho cả lớp xem"
            >
              <span>📽️</span>
              <span className="hidden md:inline">Trình Chiếu Slide</span>
              <span className="md:hidden">Chiếu</span>
            </button>

            {/* CHỈNH SỬA TRỰC TIẾP TRUYỆN NÀY */}
            <button
              onClick={() => setIsEditorModalOpen(true)}
              className="bg-amber-100 hover:bg-amber-200 text-amber-950 px-3 py-2 rounded-2xl font-bold text-xs shadow-xs flex items-center gap-1.5 transition active:scale-95 border border-amber-300"
              title="Chỉnh sửa câu chữ, nhân vật, tranh minh họa của truyện này"
            >
              <Edit3 size={15} className="text-amber-700" />
              <span className="hidden sm:inline">Chỉnh Sửa Truyện</span>
              <span className="sm:hidden">Sửa</span>
            </button>

            {/* HỎI BẠN KỂ CHUYỆN */}
            <button
              onClick={onOpenChat}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-3.5 py-2 rounded-2xl font-bold text-xs shadow-md flex items-center gap-1.5 transition active:scale-95"
            >
              <MessageCircle size={16} />
              <span className="hidden md:inline">Hỏi Bạn Kể Chuyện AI</span>
              <span className="md:hidden">Hỏi AI</span>
            </button>

            {/* DANH SÁCH HỌC SINH */}
            {students && students.length > 0 && (
              <button
                onClick={() => setShowStudentListDrawer(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-2xl font-bold text-xs shadow-md flex items-center gap-1.5 transition active:scale-95"
                title="Xem toàn bộ danh sách học sinh của lớp"
              >
                <Users size={15} />
                <span className="hidden sm:inline">Danh Sách Học Sinh ({students.length})</span>
                <span className="sm:hidden">DS Lớp ({students.length})</span>
              </button>
            )}

            {/* GỌI NGẪU NHIÊN BẠN ĐỌC */}
            {students && students.length > 0 && (
              <button
                onClick={handleCallStudentReader}
                disabled={isPickingReader}
                className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-2xl font-bold text-xs shadow-md flex items-center gap-1.5 transition active:scale-95"
                title="Gọi ngẫu nhiên học sinh đọc bài & thưởng 2 sao"
              >
                <Shuffle size={15} className={isPickingReader ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">Gọi Ngẫu Nhiên (+2⭐️)</span>
                <span className="sm:hidden">Ngẫu Nhiên</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* THÔNG BÁO LƯỢT ĐỌC CỦA HỌC SINH */}
      {calledReader && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 text-white p-3 shadow-md animate-in slide-in-from-top duration-300">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm font-bold">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{calledReader.avatar}</span>
              <span>
                Lượt đọc trang này thuộc về bạn: <strong className="underline text-yellow-300">{calledReader.name}</strong> (Tổ {calledReader.group})!
              </span>
            </div>
            <span className="bg-yellow-400 text-emerald-950 px-3 py-1 rounded-full font-black text-xs shadow-sm">
              +2 ⭐️ Thưởng Đọc Hay
            </span>
          </div>
        </div>
      )}

      {/* KHUNG ĐỌC SÁCH CHÍNH */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-6 flex flex-col justify-center">
        <div className="bg-white rounded-3xl sm:rounded-[36px] shadow-xl border-4 border-amber-200 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[520px]">
          
          {/* CỘT TRÁI: TRANH MINH HỌA */}
          <div className="lg:col-span-7 bg-amber-50/50 p-4 sm:p-8 flex flex-col justify-between border-b-4 lg:border-b-0 lg:border-r-4 border-amber-200 relative group">
            {/* TRANH VẼ */}
            <div className="w-full relative aspect-[4/3] rounded-3xl overflow-hidden shadow-md border-2 border-amber-300 bg-amber-100/70 flex items-center justify-center">
              {currentPage.imageUrl ? (
                <img
                  src={currentPage.imageUrl}
                  alt={`Tranh minh họa trang ${currentPage.pageNumber}`}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
              ) : (
                <div className="text-center p-6 text-amber-800/60 flex flex-col items-center">
                  <ImageIcon size={54} className="mb-2 text-amber-400" />
                  <p className="font-bold text-sm">Chưa có tranh minh họa cho trang này</p>
                  <p className="text-xs">Bấm nút bên dưới để vẽ tranh bằng AI!</p>
                </div>
              )}

              {/* HUY HIỆU ĐỘ PHÂN GIẢI */}
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                <Sparkles size={12} className="text-yellow-300" />
                <span>Tranh {currentPage.imageSize || selectedImageSize}</span>
              </div>

              {/* HIỆU ỨNG ĐANG TẠO ẢNH */}
              {isGeneratingIllustration && (
                <div className="absolute inset-0 bg-white/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10 animate-in fade-in">
                  <Loader2 size={36} className="text-amber-600 animate-spin mb-2" />
                  <h4 className="font-black text-amber-950 text-base">Đang Vẽ Tranh Minh Họa...</h4>
                  <p className="text-xs text-amber-700 font-medium mt-1">
                    Mô hình: <code className="font-mono font-bold">gemini-3-pro-image-preview</code> ({selectedImageSize})
                  </p>
                </div>
              )}
            </div>

            {/* THANH ĐIỀU KHIỂN & KÍCH THƯỚC TRANH (1K, 2K, 4K) */}
            <div className="mt-4 pt-3 border-t border-amber-200/80 flex flex-wrap items-center justify-between gap-2.5">
              {/* LỰA CHỌN KÍCH THƯỚC TRANH 1K / 2K / 4K */}
              <div className="flex items-center gap-1.5 bg-amber-100/80 p-1 rounded-2xl border border-amber-300">
                <span className="text-[10px] font-black uppercase text-amber-800 px-1.5">Kích thước:</span>
                {(['1K', '2K', '4K'] as const).map((size) => {
                  const isSelected = selectedImageSize === size;
                  return (
                    <button
                      key={size}
                      onClick={() => {
                        setSelectedImageSize(size);
                        handleQuickGenerateIllustration(size);
                      }}
                      disabled={isGeneratingIllustration}
                      className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all ${
                        isSelected
                          ? 'bg-amber-500 text-white shadow-sm scale-105'
                          : 'text-amber-900 hover:bg-white/60'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>

              {/* NÚT TẠO TRANH & TÙY BIẾN CHI TIẾT */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleQuickGenerateIllustration()}
                  disabled={isGeneratingIllustration}
                  className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-white px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 transition disabled:opacity-50"
                  title="Vẽ tranh mới bằng gemini-3-pro-image-preview"
                >
                  <Sparkles size={14} />
                  <span>Vẽ Tranh Mới</span>
                </button>

                <button
                  onClick={() => setShowIllustrationModal(true)}
                  className="bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1 active:scale-95"
                  title="Mở xưởng vẽ tùy chỉnh phong cách"
                >
                  <Sliders size={14} />
                  <span>Tùy Chỉnh</span>
                </button>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: LỜI TRUYỆN & GIỌNG ĐỌC AI */}
          <div className="lg:col-span-5 p-6 sm:p-10 flex flex-col justify-between bg-gradient-to-b from-white to-[#FFFDF7]">
            <div>
              {/* SỐ TRANG, CHỌN GIỌNG ĐỌC & NÚT SỬA LỜI VĂN TRANG NÀY */}
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                    Trang {currentPage.pageNumber} / {currentPages.length}
                  </span>

                  <button
                    onClick={() => {
                      if (!isEditingPageText) {
                        setEditedPageText(currentPage.text);
                      }
                      setIsEditingPageText(!isEditingPageText);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 active:scale-95 ${
                      isEditingPageText
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                    title="Chỉnh sửa trực tiếp lời văn của trang này"
                  >
                    <Edit3 size={13} />
                    <span>{isEditingPageText ? 'Đang sửa...' : 'Sửa Lời Văn'}</span>
                  </button>
                </div>

                {/* Chọn giọng đọc TTS */}
                <div className="relative">
                  <button
                    onClick={() => setShowVoiceMenu(!showVoiceMenu)}
                    className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-xl text-xs font-bold transition"
                  >
                    <span>🎙️ Giọng: {selectedVoice}</span>
                  </button>

                  {showVoiceMenu && (
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-amber-200 p-2 z-40 animate-in fade-in">
                      <p className="text-[10px] font-black uppercase text-amber-600 px-2 py-1 tracking-wider">
                        Giọng Đọc Gemini 3.8 Flash TTS
                      </p>
                      {VOICE_OPTIONS.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => {
                            setSelectedVoice(v.id);
                            setShowVoiceMenu(false);
                            stopAudio();
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs font-bold transition ${
                            selectedVoice === v.id ? 'bg-amber-100 text-amber-900' : 'hover:bg-amber-50 text-gray-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-base">{v.icon}</span>
                            <div>
                              <div>{v.name} ({v.gender})</div>
                              <div className="text-[10px] font-normal text-gray-500">{v.tone}</div>
                            </div>
                          </div>
                          {selectedVoice === v.id && <Check size={14} className="text-amber-700" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* LỜI TRUYỆN: HIỂN THỊ HOẶC CHỈNH SỬA TRỰC TIẾP */}
              {isEditingPageText ? (
                <div className="py-2 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900">
                      ✏️ Nhập lời văn mới cho trang {currentPage.pageNumber}:
                    </span>
                    <span className="text-[10px] text-gray-500 font-bold">
                      {editedPageText.split(' ').filter(Boolean).length} từ
                    </span>
                  </div>
                  <textarea
                    value={editedPageText}
                    onChange={(e) => setEditedPageText(e.target.value)}
                    rows={6}
                    className="w-full p-3.5 bg-white border-2 border-amber-400 focus:ring-2 focus:ring-amber-500 rounded-2xl text-base sm:text-lg font-serif leading-relaxed text-gray-900 outline-none shadow-inner"
                    placeholder="Nhập lời kể truyện mới..."
                  />
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsEditingPageText(false)}
                      className="px-3.5 py-1.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-600 hover:bg-gray-100"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleSavePageText}
                      className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-black shadow-sm flex items-center gap-1.5"
                    >
                      <Check size={14} />
                      <span>Lưu Trực Tiếp</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-2">
                  <p className="text-lg sm:text-xl md:text-2xl font-serif text-gray-800 leading-relaxed tracking-wide select-text">
                    {words.map((word, idx) => {
                      const isHighlighted = isPlaying && highlightWordIndex === idx;
                      return (
                        <span
                          key={idx}
                          className={`transition-colors duration-150 rounded px-1 inline-block ${
                            isHighlighted
                              ? 'bg-amber-300 text-amber-950 font-black scale-105 shadow-sm'
                              : 'hover:bg-amber-100/50'
                          }`}
                        >
                          {word}{' '}
                        </span>
                      );
                    })}
                  </p>
                </div>
              )}
            </div>

            {/* THANH ĐIỀU KHIỂN ÂM THANH & LẬT TRANG */}
            <div className="pt-6 border-t-2 border-amber-100 flex flex-col gap-4">
              {/* NÚT ĐỌC CHÍNH */}
              <div className="flex items-center justify-between gap-3 bg-amber-50/80 p-3 rounded-2xl border border-amber-200">
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={handlePlayTTS}
                    disabled={isLoadingAudio}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg active:scale-95 transition-all ${
                      isPlaying
                        ? 'bg-rose-500 hover:bg-rose-600'
                        : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
                    }`}
                    title={isPlaying ? 'Tạm dừng đọc' : 'Đọc to bằng giọng AI Gemini 3.8 Flash TTS'}
                  >
                    {isLoadingAudio ? (
                      <Loader2 size={22} className="animate-spin" />
                    ) : isPlaying ? (
                      <Pause size={22} />
                    ) : (
                      <Play size={22} className="ml-0.5" />
                    )}
                  </button>

                  <div>
                    <div className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                      <span>{isPlaying ? 'Đang đọc diễn cảm...' : 'Đọc To Trang Này'}</span>
                      {isPlaying && (
                        <span className="flex gap-0.5 items-end h-3">
                          <span className="w-1 bg-amber-500 h-2 animate-bounce"></span>
                          <span className="w-1 bg-amber-500 h-3 animate-bounce delay-75"></span>
                          <span className="w-1 bg-amber-500 h-1.5 animate-bounce delay-150"></span>
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-amber-700 font-medium">
                      Gemini 3.8 Flash TTS ({selectedVoice})
                    </span>
                  </div>
                </div>

                {/* TỐC ĐỘ ĐỌC */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-amber-200">
                  {[0.8, 1.0, 1.2].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => {
                        setPlaybackSpeed(speed);
                        if (audioRef.current) {
                          audioRef.current.playbackRate = speed;
                        }
                      }}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition ${
                        playbackSpeed === speed
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'text-gray-600 hover:text-amber-800'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>

              {/* ĐIỀU HƯỚNG TRANG TRƯỚC / SAU */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={goToPrev}
                  disabled={currentPageIndex === 0}
                  className="px-4 py-2.5 rounded-2xl bg-amber-100 hover:bg-amber-200 disabled:opacity-40 text-amber-900 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 disabled:pointer-events-none"
                >
                  <ChevronLeft size={16} /> Trang Trước
                </button>

                {/* CÁC CHẤM TRANG */}
                <div className="flex items-center gap-1.5">
                  {currentPages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPageIndex(idx)}
                      className={`h-2.5 rounded-full transition-all ${
                        currentPageIndex === idx
                          ? 'w-7 bg-amber-500'
                          : 'w-2.5 bg-amber-200 hover:bg-amber-300'
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={goToNext}
                  disabled={currentPageIndex === currentPages.length - 1}
                  className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm active:scale-95 disabled:pointer-events-none"
                >
                  Trang Kế <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* NGĂN KÉO DANH SÁCH HỌC SINH LỚP */}
      {showStudentListDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l-4 border-emerald-400">
            {/* TIÊU ĐỀ NGĂN KÉO */}
            <div className="p-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="font-black text-sm">Danh Sách Học Sinh Lớp</h3>
                  <p className="text-[11px] text-emerald-100 font-medium">
                    Tổng cộng {students.length} bạn • Đang đọc: {story.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowStudentListDrawer(false)}
                className="p-1.5 hover:bg-white/20 rounded-xl transition text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* THANH TÌM KIẾM HỌC SINH */}
            <div className="p-3 border-b border-gray-100 bg-emerald-50/50">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm học sinh theo tên hoặc theo tổ..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white rounded-xl text-xs border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>
            </div>

            {/* DANH SÁCH CUỘN */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {students
                .filter(
                  (s) =>
                    s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                    `tổ ${s.group}`.includes(studentSearch.toLowerCase())
                )
                .map((s, idx) => {
                  const isCurrentCalled = calledReader?.id === s.id;
                  return (
                    <div
                      key={`reader-student-${s.id}-${idx}`}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isCurrentCalled
                          ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-400'
                          : 'bg-white hover:bg-amber-50/50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-2xl p-1 bg-amber-50 rounded-xl border border-amber-200 shrink-0">
                          {s.avatar}
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-gray-900 truncate flex items-center gap-1.5">
                            <span>{s.name}</span>
                            {s.called && (
                              <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold">
                                Đã đọc
                              </span>
                            )}
                          </h4>
                          <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold mt-0.5">
                            <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">Tổ {s.group}</span>
                            <span className="text-amber-600 flex items-center gap-0.5">
                              <Star size={11} className="fill-amber-400 text-amber-500" /> {s.points} sao
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => {
                            handlePickSpecificReader(s);
                            setShowStudentListDrawer(false);
                          }}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-[11px] font-bold shadow-sm transition flex items-center gap-1"
                          title="Mời bạn này đọc trang sách và tặng 2 sao"
                        >
                          <Award size={13} />
                          <span>+2⭐️ Đọc</span>
                        </button>

                        {onOpenStoryCreatorWithStudent && (
                          <button
                            onClick={() => {
                              setShowStudentListDrawer(false);
                              onOpenStoryCreatorWithStudent(s);
                            }}
                            className="p-1.5 bg-amber-100 hover:bg-amber-200 active:scale-95 text-amber-900 rounded-xl transition"
                            title="Sáng tác truyện mới với bạn này là nhân vật chính"
                          >
                            <BookOpen size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* NÚT ĐÓNG */}
            <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <button
                onClick={() => {
                  handleCallStudentReader();
                  setShowStudentListDrawer(false);
                }}
                className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1"
              >
                <Shuffle size={14} /> Gọi ngẫu nhiên 1 bạn
              </button>
              <button
                onClick={() => setShowStudentListDrawer(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-xl text-xs font-bold text-gray-700 transition"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* XƯỞNG VẼ TRANH TÙY BIẾN CHI TIẾT */}
      <IllustrationModal
        isOpen={showIllustrationModal}
        onClose={() => setShowIllustrationModal(false)}
        page={currentPage}
        onIllustrationGenerated={handleIllustrationUpdated}
      />

      {/* MODAL BIÊN TẬP TRỰC TIẾP TOÀN BỘ TRUYỆN */}
      <StoryEditorModal
        isOpen={isEditorModalOpen}
        onClose={() => setIsEditorModalOpen(false)}
        story={story}
        onSaveStory={handleFullStorySave}
      />

      {/* CHẾ ĐỘ TRÌNH CHIẾU SLIDE BÀI GIẢNG TRÊN MÁY CHIẾU LỚP */}
      <StorySlidePresentation
        isOpen={isPresentationOpen}
        onClose={() => setIsPresentationOpen(false)}
        story={story}
      />
    </div>
  );
};
