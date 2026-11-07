import React, { useState, useEffect } from 'react';
import { 
  X, ChevronLeft, ChevronRight, Play, Pause, 
  Volume2, Maximize, Minimize, Sparkles, BookOpen 
} from 'lucide-react';
import { Story } from '../types';

interface StorySlidePresentationProps {
  isOpen: boolean;
  onClose: () => void;
  story: Story;
}

export const StorySlidePresentation: React.FC<StorySlidePresentationProps> = ({
  isOpen,
  onClose,
  story,
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentSlideIndex(0);
    }
  }, [isOpen]);

  if (!isOpen || !story) return null;

  const totalSlides = story.pages.length;
  const currentPage = story.pages[currentSlideIndex] || story.pages[0];

  const handleNext = () => {
    if (currentSlideIndex < totalSlides - 1) {
      setCurrentSlideIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex((prev) => prev - 1);
    }
  };

  const handleSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      if (!isPlaying) {
        const utterance = new SpeechSynthesisUtterance(currentPage.text);
        utterance.lang = 'vi-VN';
        utterance.rate = 0.9;
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);
        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col text-white animate-in fade-in duration-300">
      {/* THANH ĐIỀU KHIỂN TRÊN CÙNG */}
      <div className="bg-black/60 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="p-2 bg-amber-500 rounded-xl text-white text-xl">📽️</span>
          <div>
            <h3 className="font-black text-sm sm:text-base text-yellow-300">
              Chế Độ Trình Chiếu Bài Giảng Lớp Học · {story.title}
            </h3>
            <p className="text-xs text-gray-400">
              Trang {currentSlideIndex + 1} / {totalSlides} · {story.theme}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSpeech}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              isPlaying ? 'bg-rose-600 text-white animate-pulse' : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <Volume2 size={16} />
            <span>{isPlaying ? 'Dừng Đọc' : 'Đọc To Trang Này'}</span>
          </button>

          <button
            onClick={onClose}
            className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition text-white ml-2"
            title="Thoát chế độ trình chiếu"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* NỘI DUNG SLIDE TRÌNH CHIẾU */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8 flex flex-col md:flex-row items-center justify-center gap-8 overflow-hidden">
        {/* HÌNH ẢNH MINH HỌA TO RÕ */}
        <div className="w-full md:w-1/2 max-h-[65vh] flex items-center justify-center">
          <img
            src={currentPage.illustrationUrl || story.coverImage || 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1200'}
            alt={`Trang ${currentPage.pageNumber}`}
            className="max-h-[60vh] w-auto max-w-full rounded-3xl object-contain shadow-2xl border-4 border-white/10"
          />
        </div>

        {/* NỘI DUNG CHỮ LỚN CHO CẢ LỚP CÙNG ĐỌC */}
        <div className="w-full md:w-1/2 space-y-6 text-left">
          <div className="inline-block bg-amber-400/20 text-yellow-300 border border-yellow-300/30 px-3.5 py-1 rounded-full text-xs font-bold">
            Trang {currentPage.pageNumber} của câu chuyện
          </div>

          <p className="text-xl sm:text-3xl font-serif leading-relaxed text-gray-100 font-medium">
            "{currentPage.text}"
          </p>

          <div className="pt-4 border-t border-white/10">
            <span className="text-xs text-amber-300 font-bold flex items-center gap-1.5">
              <Sparkles size={14} /> Gợi ý câu hỏi tương tác cho cả lớp:
            </span>
            <p className="text-xs sm:text-sm text-gray-300 mt-1 italic">
              "Các em thấy hành động của nhân vật trong trang này mang lại bài học gì cho chúng ta?"
            </p>
          </div>
        </div>
      </div>

      {/* THANH ĐIỀU HƯỚNG CHUYỂN SLIDE Ở DƯỚI */}
      <div className="bg-black/80 px-6 py-4 flex items-center justify-between border-t border-white/10">
        <button
          onClick={handlePrev}
          disabled={currentSlideIndex === 0}
          className="bg-white/10 hover:bg-white/20 disabled:opacity-20 text-white font-bold px-5 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 transition active:scale-95"
        >
          <ChevronLeft size={18} />
          <span>Trang Trước</span>
        </button>

        {/* CÁC CHẤM CHỈ SỐ SLIDE */}
        <div className="flex items-center gap-2">
          {story.pages.map((_, idx) => (
            <button
              key={`dot-${idx}`}
              onClick={() => setCurrentSlideIndex(idx)}
              className={`h-2.5 rounded-full transition-all ${
                idx === currentSlideIndex ? 'w-8 bg-yellow-400' : 'w-2.5 bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={currentSlideIndex === totalSlides - 1}
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-20 text-white font-black px-6 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 transition active:scale-95 shadow-md"
        >
          <span>Trang Kế Tiếp</span>
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};
