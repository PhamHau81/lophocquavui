import React, { useState } from 'react';
import { 
  X, Save, BookOpen, Sparkles, Image as ImageIcon, 
  Trash2, Plus, ChevronLeft, ChevronRight, Check, AlertCircle, 
  Layers, Palette, Edit3
} from 'lucide-react';
import { Story, StoryPage } from '../types';

interface StoryEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  story: Story;
  onSaveStory: (updatedStory: Story) => void;
}

export const StoryEditorModal: React.FC<StoryEditorModalProps> = ({
  isOpen,
  onClose,
  story,
  onSaveStory,
}) => {
  const [title, setTitle] = useState(story.title);
  const [author, setAuthor] = useState(story.author);
  const [category, setCategory] = useState(story.category);
  const [theme, setTheme] = useState(story.theme);
  const [summary, setSummary] = useState(story.summary);
  const [coverImage, setCoverImage] = useState(story.coverImage);
  const [pages, setPages] = useState<StoryPage[]>(JSON.parse(JSON.stringify(story.pages)));
  const [activeTab, setActiveTab] = useState<'info' | 'pages'>('pages');
  const [selectedPageIndex, setSelectedPageIndex] = useState<number>(0);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentPage = pages[selectedPageIndex] || pages[0];

  const handleUpdatePageText = (newText: string) => {
    setPages((prev) =>
      prev.map((p, idx) => (idx === selectedPageIndex ? { ...p, text: newText } : p))
    );
  };

  const handleUpdatePagePrompt = (newPrompt: string) => {
    setPages((prev) =>
      prev.map((p, idx) => (idx === selectedPageIndex ? { ...p, illustrationPrompt: newPrompt } : p))
    );
  };

  const handleUpdatePageImageUrl = (newUrl: string) => {
    setPages((prev) =>
      prev.map((p, idx) => (idx === selectedPageIndex ? { ...p, imageUrl: newUrl } : p))
    );
  };

  const handleAddNewPage = () => {
    const newPageNum = pages.length + 1;
    const newPage: StoryPage = {
      pageNumber: newPageNum,
      text: 'Viết tiếp câu chuyện diệu kỳ ở đây...',
      illustrationPrompt: `Tranh minh họa trang ${newPageNum} tươi sáng cổ tích`,
      imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&auto=format&fit=crop&q=80',
      imageSize: '1K',
    };
    setPages((prev) => [...prev, newPage]);
    setSelectedPageIndex(pages.length);
  };

  const handleDeletePage = (indexToDelete: number) => {
    if (pages.length <= 1) {
      alert('Truyện phải có ít nhất 1 trang!');
      return;
    }
    if (window.confirm(`Thầy/cô có chắc muốn xóa trang ${indexToDelete + 1}?`)) {
      const updated = pages
        .filter((_, idx) => idx !== indexToDelete)
        .map((p, idx) => ({ ...p, pageNumber: idx + 1 }));
      setPages(updated);
      setSelectedPageIndex(Math.max(0, indexToDelete - 1));
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề truyện!');
      return;
    }

    const updatedStory: Story = {
      ...story,
      title: title.trim(),
      author: author.trim(),
      category,
      theme: theme.trim(),
      summary: summary.trim(),
      coverImage: coverImage.trim() || story.coverImage,
      pages,
    };

    onSaveStory(updatedStory);
    onClose();
  };

  const sampleCovers = [
    { label: 'Lớp Học Hạnh Phúc', url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&auto=format&fit=crop&q=80' },
    { label: 'Khu Rừng Thần Tiên', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80' },
    { label: 'Thế Giới Loài Vật', url: 'https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?w=600&auto=format&fit=crop&q=80' },
    { label: 'Vũ Trụ Kỳ Ảo', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80' },
    { label: 'Đại Dương Xanh', url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=600&auto=format&fit=crop&q=80' },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border-4 border-amber-300 overflow-hidden">
        {/* HEADER MODAL */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-sm text-2xl shadow-inner">
              ✏️
            </div>
            <div>
              <h3 className="text-base sm:text-xl font-black tracking-tight">
                Chỉnh Sửa Trực Tiếp Truyện: {title}
              </h3>
              <p className="text-xs text-amber-100 font-medium">
                Biên tập câu chữ, nhân vật, lời thoại và tranh minh họa trực tiếp lên hệ thống
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-2xl transition text-white"
          >
            <X size={22} />
          </button>
        </div>

        {/* CHUYỂN TAB: THÔNG TIN TRUYỆN vs BIÊN TẬP TỪNG TRANG */}
        <div className="px-5 pt-3 border-b border-amber-100 bg-amber-50/50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('pages')}
              className={`px-4 py-2.5 rounded-t-2xl font-black text-xs sm:text-sm transition flex items-center gap-2 border-b-2 ${
                activeTab === 'pages'
                  ? 'bg-white text-amber-900 border-amber-500 shadow-xs'
                  : 'text-gray-500 hover:text-amber-800 border-transparent'
              }`}
            >
              <Layers size={16} />
              <span>Biên Tập Lời Thoại Từng Trang ({pages.length} trang)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('info')}
              className={`px-4 py-2.5 rounded-t-2xl font-black text-xs sm:text-sm transition flex items-center gap-2 border-b-2 ${
                activeTab === 'info'
                  ? 'bg-white text-amber-900 border-amber-500 shadow-xs'
                  : 'text-gray-500 hover:text-amber-800 border-transparent'
              }`}
            >
              <Edit3 size={16} />
              <span>Thông Tin Bìa & Chủ Đề</span>
            </button>
          </div>

          <span className="text-[11px] font-bold text-amber-700 bg-amber-100/70 px-3 py-1 rounded-full hidden sm:inline">
            Tự động đồng bộ lên máy chủ & tủ sách
          </span>
        </div>

        {/* THÂN MODAL */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {activeTab === 'pages' ? (
            /* TAB 1: BIÊN TẬP LỜI THOẠI TỪNG TRANG */
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* CỘT TRÁI: DANH SÁCH TRANG */}
              <div className="md:col-span-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase text-gray-700">
                    Danh Sách Trang ({pages.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddNewPage}
                    className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl text-xs font-black transition flex items-center gap-1 active:scale-95"
                  >
                    <Plus size={14} /> Thêm Trang
                  </button>
                </div>

                <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
                  {pages.map((p, idx) => {
                    const isSelected = selectedPageIndex === idx;
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedPageIndex(idx)}
                        className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-amber-500 text-white border-amber-600 shadow-md font-bold'
                            : 'bg-white hover:bg-amber-50/60 border-amber-200 text-gray-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-white text-amber-700' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className="text-xs truncate">
                            {p.text.slice(0, 32)}...
                          </span>
                        </div>

                        {pages.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePage(idx);
                            }}
                            className={`p-1 rounded-lg transition hover:bg-rose-500 hover:text-white ${
                              isSelected ? 'text-amber-100' : 'text-gray-400'
                            }`}
                            title="Xóa trang này"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CỘT PHẢI: KHUNG SOẠN THẢO TRANG ĐANG CHỌN */}
              <div className="md:col-span-8 bg-amber-50/50 p-4 sm:p-5 rounded-3xl border-2 border-amber-200 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                  <span className="text-sm font-black text-amber-950 flex items-center gap-1.5">
                    <BookOpen size={16} className="text-amber-600" />
                    Chỉnh Sửa Lời Thoại Trang {currentPage.pageNumber}
                  </span>
                  <span className="text-xs font-mono font-bold text-gray-500">
                    {currentPage.text.split(' ').filter(Boolean).length} từ
                  </span>
                </div>

                {/* TEXTAREA LỜI THOẠI TRUYỆN */}
                <div>
                  <label className="block text-xs font-black text-gray-700 mb-1">
                    📖 Lời kể truyện trên trang này (Học sinh sẽ nghe và đọc theo):
                  </label>
                  <textarea
                    value={currentPage.text}
                    onChange={(e) => handleUpdatePageText(e.target.value)}
                    rows={5}
                    className="w-full p-3.5 bg-white border-2 border-amber-200 focus:border-amber-500 rounded-2xl text-xs sm:text-sm leading-relaxed font-serif text-gray-800 focus:ring-2 focus:ring-amber-400 outline-none resize-none shadow-xs"
                    placeholder="Nhập nội dung lời truyện của trang..."
                  />
                </div>

                {/* PROMPT TRANH MINH HỌA */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    🎨 Gợi ý cảnh vẽ tranh minh họa cho AI (Prompt):
                  </label>
                  <input
                    type="text"
                    value={currentPage.illustrationPrompt}
                    onChange={(e) => handleUpdatePagePrompt(e.target.value)}
                    className="w-full p-2.5 bg-white border border-amber-200 focus:border-amber-500 rounded-xl text-xs text-gray-700 outline-none"
                    placeholder="Mô tả bối cảnh để AI vẽ tranh..."
                  />
                </div>

                {/* ẢNH MINH HỌA CỦA TRANG */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    🖼️ Tranh minh họa hiện tại của trang:
                  </label>
                  <div className="flex items-center gap-3">
                    {currentPage.imageUrl ? (
                      <div className="w-20 h-16 rounded-xl overflow-hidden border border-amber-300 shrink-0">
                        <img
                          src={currentPage.imageUrl}
                          alt={`Tranh trang ${currentPage.pageNumber}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-16 rounded-xl bg-amber-100 flex items-center justify-center text-xs text-amber-600 font-bold shrink-0">
                        Chưa có
                      </div>
                    )}
                    <input
                      type="text"
                      value={currentPage.imageUrl || ''}
                      onChange={(e) => handleUpdatePageImageUrl(e.target.value)}
                      placeholder="Dán link ảnh (URL) hoặc tạo bằng AI khi vào phòng đọc"
                      className="flex-1 p-2 bg-white border border-amber-200 rounded-xl text-xs font-mono outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* TAB 2: THÔNG TIN BÌA & CHỦ ĐỀ */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-700 mb-1">
                    Tiêu đề truyện *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ví dụ: Lớp Học Hạnh Phúc: Ngày Hội Đọc Sách"
                    className="w-full p-3 bg-gray-50 focus:bg-white border-2 border-amber-200 focus:border-amber-500 rounded-xl text-sm font-bold text-gray-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-700 mb-1">
                    Tác giả / Người sáng tác
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Ví dụ: GV. Phạm Hậu & Lớp 12A6"
                    className="w-full p-3 bg-gray-50 focus:bg-white border-2 border-amber-200 focus:border-amber-500 rounded-xl text-sm font-bold text-gray-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-700 mb-1">
                    Thể loại câu chuyện
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Story['category'])}
                    className="w-full p-3 bg-gray-50 focus:bg-white border-2 border-amber-200 focus:border-amber-500 rounded-xl text-xs font-bold text-gray-800 outline-none"
                  >
                    <option value="classroom">🏫 Lớp Học & Học Sinh</option>
                    <option value="fantasy">✨ Cổ Tích Thần Tiên</option>
                    <option value="animals">🐾 Thế Giới Loài Vật</option>
                    <option value="adventure">🧭 Phiêu Lưu Kỳ Thú</option>
                    <option value="sci-fi">🚀 Khám Phá Vũ Trụ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-700 mb-1">
                    Chủ đề & Bài học rút ra
                  </label>
                  <input
                    type="text"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    placeholder="Ví dụ: Đoàn kết, Yêu thương, Giúp đỡ bạn bè"
                    className="w-full p-3 bg-gray-50 focus:bg-white border-2 border-amber-200 focus:border-amber-500 rounded-xl text-xs font-bold text-gray-800 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-700 mb-1">
                  Tóm tắt ngắn gọn câu chuyện
                </label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={2}
                  placeholder="Mô tả nội dung chính..."
                  className="w-full p-3 bg-gray-50 focus:bg-white border-2 border-amber-200 focus:border-amber-500 rounded-xl text-xs text-gray-800 outline-none resize-none"
                />
              </div>

              {/* CHỌN ẢNH BÌA */}
              <div>
                <label className="block text-xs font-black text-gray-700 mb-1.5">
                  Ảnh bìa truyện (URL hoặc chọn từ thư viện)
                </label>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-24 h-16 rounded-xl overflow-hidden border-2 border-amber-300 shrink-0 shadow-xs">
                    <img src={coverImage} alt={title} className="w-full h-full object-cover" />
                  </div>
                  <input
                    type="text"
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    className="flex-1 p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-mono outline-none"
                    placeholder="https://..."
                  />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {sampleCovers.map((sc, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCoverImage(sc.url)}
                      className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 whitespace-nowrap transition active:scale-95"
                    >
                      {sc.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CHÂN MODAL: LƯU & ĐỒNG BỘ */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-100 transition"
          >
            Hủy Bỏ
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 active:scale-95 text-white text-xs sm:text-sm font-black shadow-md flex items-center gap-2 transition"
          >
            <Save size={16} />
            <span>Lưu & Đồng Bộ Trực Tiếp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
