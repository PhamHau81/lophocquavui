import React, { useState } from 'react';
import { 
  X, Sparkles, Download, RefreshCw, 
  Palette, Image as ImageIcon, Sliders, CheckCircle2, AlertCircle
} from 'lucide-react';
import { StoryPage } from '../types';
import { generateIllustrationAI } from '../services/geminiService';

interface IllustrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  page: StoryPage;
  onIllustrationGenerated: (pageNumber: number, imageUrl: string, imageSize: '1K' | '2K' | '4K') => void;
}

export const IllustrationModal: React.FC<IllustrationModalProps> = ({
  isOpen,
  onClose,
  page,
  onIllustrationGenerated,
}) => {
  const [prompt, setPrompt] = useState(page.illustrationPrompt || '');
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>(page.imageSize || '1K');
  const [aspectRatio, setAspectRatio] = useState<'4:3' | '16:9' | '1:1'>('4:3');
  const [stylePreset, setStylePreset] = useState<string>(
    "Tranh minh họa sách thiếu nhi tuyệt đẹp, phong cách truyện cổ tích, màu sắc rực rỡ ấm áp, ánh sáng dịu dàng, chất liệu chi tiết, đáng yêu và thân thiện với trẻ em"
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoNotice, setInfoNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const styleOptions = [
    { id: 'storybook', label: '📖 Cổ Tích Kinh Điển', prompt: "Tranh minh họa sách thiếu nhi cổ tích, màu sắc rực rỡ ấm áp, ánh sáng dịu dàng, nhân vật đáng yêu và thân thiện" },
    { id: 'watercolor', label: '🎨 Màu Nước Êm Dịu', prompt: "Tranh vẽ màu nước mơ màng, tông màu pastel dịu ngọt, vân giấy hữu cơ mềm mại, ánh sáng thơ mộng" },
    { id: 'pixar', label: '✨ Hoạt Hình 3D', prompt: "Phong cách hoạt hình 3D hiện đại dễ thương, nhân vật ngộ nghĩnh, ánh sáng rực rỡ, chiều sâu sống động" },
    { id: 'crayon', label: '🖍️ Tranh Sáp Màu', prompt: "Tranh vẽ tay bằng sáp màu rực rỡ, nét vẽ hồn nhiên trong sáng của tuổi thơ, tươi vui rộn ràng" },
  ];

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setErrorMessage(null);
    setInfoNotice(null);

    try {
      const data = await generateIllustrationAI({
        prompt: prompt.trim(),
        imageSize,
        aspectRatio,
        stylePreset,
      });

      if (data.imageUrl) {
        onIllustrationGenerated(page.pageNumber, data.imageUrl, imageSize);
        if (data.notice) {
          setInfoNotice(data.notice);
        }
      } else {
        throw new Error('Không nhận được dữ liệu tranh vẽ');
      }
    } catch (err: any) {
      console.error('Lỗi tạo ảnh:', err);
      setErrorMessage(err.message || 'Không thể tạo ảnh minh họa. Vui lòng thử lại sau.');
    } finally {
      setIsGenerating(false);
    }
  };

  const addFunDetail = (detail: string) => {
    setPrompt((prev) => `${prev.trim()}, ${detail}`);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border-4 border-amber-200 overflow-hidden">
        {/* TIÊU ĐỀ HỘP THOẠI */}
        <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 p-4 sm:p-5 text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-white/20 rounded-2xl backdrop-blur-sm text-2xl">🎨</span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                Xưởng Vẽ Tranh Minh Họa · Trang {page.pageNumber}
              </h2>
              <p className="text-xs sm:text-sm text-amber-100 font-medium">
                Vận hành bởi mô hình <code className="font-mono bg-black/20 px-1.5 py-0.5 rounded text-amber-100 font-bold">gemini-3-pro-image-preview</code>
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* CỘT TRÁI: XEM TRƯỚC TRANH & TẢI VỀ */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <div className="w-full relative aspect-[4/3] bg-gradient-to-tr from-amber-50 to-orange-100 rounded-3xl overflow-hidden border-2 border-amber-200 shadow-inner flex items-center justify-center group">
              {page.imageUrl ? (
                <>
                  <img
                    src={page.imageUrl}
                    alt={`Tranh minh họa trang ${page.pageNumber}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-green-400" />
                    <span>Độ phân giải {page.imageSize || imageSize}</span>
                  </div>
                  <a
                    href={page.imageUrl}
                    download={`tranh-minh-hoa-trang-${page.pageNumber}.png`}
                    className="absolute bottom-3 right-3 bg-white/90 hover:bg-white text-gray-800 p-2.5 rounded-2xl shadow-lg transition flex items-center gap-1.5 text-xs font-bold active:scale-95"
                  >
                    <Download size={15} /> Tải Tranh Về
                  </a>
                </>
              ) : (
                <div className="text-center p-6 text-amber-800/60 flex flex-col items-center">
                  <ImageIcon size={48} className="mb-2 text-amber-300" />
                  <p className="font-bold text-sm">Chưa có tranh vẽ</p>
                  <p className="text-xs">Bấm "Vẽ tranh minh họa mới" để sáng tạo!</p>
                </div>
              )}

              {isGenerating && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10 animate-in fade-in">
                  <div className="relative mb-4">
                    <div className="w-16 h-16 rounded-full border-4 border-amber-300 border-t-amber-600 animate-spin"></div>
                    <Sparkles className="absolute inset-0 m-auto text-amber-600 animate-pulse" size={24} />
                  </div>
                  <h4 className="text-lg font-black text-amber-900">Họa sĩ AI Đang Vẽ Tranh...</h4>
                  <p className="text-xs text-amber-700 mt-1 max-w-xs font-medium">
                    Đang gọi mô hình <span className="font-mono font-bold">gemini-3-pro-image-preview</span> ở độ phân giải {imageSize}.
                  </p>
                </div>
              )}
            </div>

            {/* TRÍCH ĐOẠN LỜI TRUYỆN TRANG NÀY */}
            <div className="w-full mt-4 bg-amber-50/70 p-3.5 rounded-2xl border border-amber-100">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 block mb-1">
                Lời Truyện Trang Này
              </span>
              <p className="text-xs text-gray-700 italic leading-relaxed">
                "{page.text}"
              </p>
            </div>
          </div>

          {/* CỘT PHẢI: BỘ CÔNG CỤ TÙY CHỈNH */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            {/* TÙY CHỌN ĐỘ PHÂN GIẢI 1K, 2K, 4K */}
            <div className="bg-white p-4 rounded-2xl border-2 border-amber-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders size={14} className="text-amber-500" />
                  Kích Thước Tranh (Tùy Chọn Độ Phân Giải)
                </label>
                <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                  Đang chọn: {imageSize}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['1K', '2K', '4K'] as const).map((size) => {
                  const isSelected = imageSize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setImageSize(size)}
                      className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${
                        isSelected
                          ? 'border-amber-500 bg-gradient-to-b from-amber-50 to-orange-50 text-amber-900 shadow-md scale-102'
                          : 'border-gray-200 hover:border-amber-300 bg-gray-50/50 text-gray-600'
                      }`}
                    >
                      <span className="text-lg font-black">{size}</span>
                      <span className="text-[10px] font-medium text-gray-500 mt-0.5">
                        {size === '1K' ? '1024px · Nhanh' : size === '2K' ? '2048px · Sắc Nét' : '4096px · Tuyệt Tác'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TỈ LỆ KHUNG HÌNH */}
            <div className="bg-white p-3.5 rounded-2xl border border-gray-200">
              <label className="text-xs font-bold text-gray-700 mb-2 block">
                Tỉ Lệ Khung Hình
              </label>
              <div className="flex gap-2">
                {(['4:3', '16:9', '1:1'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setAspectRatio(ratio)}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold border transition ${
                      aspectRatio === ratio
                        ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                    }`}
                  >
                    {ratio === '4:3' ? '📖 4:3 Sách Truyện' : ratio === '16:9' ? '🎬 16:9 Rộng' : '🔲 1:1 Vuông'}
                  </button>
                ))}
              </div>
            </div>

            {/* PHONG CÁCH HỘI HỌA */}
            <div className="bg-white p-3.5 rounded-2xl border border-gray-200">
              <label className="text-xs font-bold text-gray-700 mb-2 block flex items-center gap-1.5">
                <Palette size={14} className="text-rose-500" /> Phong Cách Nghệ Thuật
              </label>
              <div className="grid grid-cols-2 gap-2">
                {styleOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setStylePreset(opt.prompt)}
                    className={`p-2 rounded-xl text-xs font-bold text-left border transition ${
                      stylePreset === opt.prompt
                        ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-sm'
                        : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ô NHẬP MÔ TẢ TRANH */}
            <div className="bg-white p-3.5 rounded-2xl border border-gray-200 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-gray-700">Mô Tả Chi Tiết Khung Cảnh</label>
                <button
                  type="button"
                  onClick={() => setPrompt(page.illustrationPrompt)}
                  className="text-[11px] font-semibold text-amber-600 hover:text-amber-800 transition"
                >
                  Khôi phục mặc định
                </button>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:ring-2 focus:ring-amber-500 focus:bg-white outline-none resize-none leading-relaxed font-medium"
                placeholder="Mô tả bức tranh thần tiên bạn muốn vẽ..."
              />

              {/* TỪ KHÓA LẤP LÁNH THÊM VÀO */}
              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold text-gray-400">Thêm phép màu:</span>
                {[
                  'ngôi sao phát sáng lấp lánh',
                  'cánh bướm ngũ sắc',
                  'nụ cười rạng rỡ hạnh phúc',
                  'ánh nắng ban mai ấm áp',
                ].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addFunDetail(tag)}
                    className="text-[10px] font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200 transition"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* THÔNG BÁO HƯỚNG DẪN / DỰ PHÒNG */}
            {infoNotice && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2 shadow-2xs">
                <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-amber-600" />
                <span className="font-medium leading-relaxed">{infoNotice}</span>
              </div>
            )}

            {/* THÔNG BÁO LỖI NẾU CÓ */}
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-500" />
                <span className="font-medium">{errorMessage}</span>
              </div>
            )}

            {/* NÚT HÀNH ĐỘNG TẠO ẢNH */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 active:scale-98 text-white py-3.5 px-6 rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Đang Vẽ Tranh Minh Họa ({imageSize})...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Vẽ Tranh Minh Họa Mới ({imageSize})
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
