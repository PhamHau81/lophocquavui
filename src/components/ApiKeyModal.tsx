import React, { useState, useEffect } from 'react';
import { 
  KeyRound, Sparkles, ExternalLink, Check, Eye, EyeOff, 
  X, AlertTriangle, ShieldCheck, RefreshCw, Cpu, Layers
} from 'lucide-react';
import { 
  AI_MODELS, 
  getSavedApiKey, 
  saveApiKey, 
  getSelectedModel, 
  saveSelectedModel,
  testGeminiApiKey 
} from '../services/geminiService';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
  isRequired?: boolean;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  isRequired = false,
}) => {
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setApiKey(getSavedApiKey());
      setSelectedModel(getSelectedModel());
      setTestResult(null);
      setSaveSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveApiKey(apiKey.trim());
    saveSelectedModel(selectedModel);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      if (onSaved) onSaved();
      onClose();
    }, 600);
  };

  const handleTest = async () => {
    if (!apiKey.trim()) {
      setTestResult({ success: false, message: 'Vui lòng nhập API Key trước khi kiểm tra!' });
      return;
    }
    setTesting(true);
    setTestResult(null);
    const res = await testGeminiApiKey(apiKey.trim());
    setTesting(false);
    setTestResult(res);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border-4 border-amber-300 overflow-hidden">
        {/* HEADER MODAL */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-4 sm:p-5 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-xl">
              🔑
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight">
                Thiết Lập Model & API Key Gemini
              </h2>
              <p className="text-xs sm:text-sm text-amber-100 font-medium">
                Lớp Học Hạnh Phúc · Thầy Phạm Hậu
              </p>
            </div>
          </div>
          {!isRequired && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition text-white"
              title="Đóng hộp thoại"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* NỘI DUNG MODAL */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-gray-800">
          {/* DÒNG CẢNH BÁO BẮT BUỘC/HƯỚNG DẪN */}
          <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle size={20} className="text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-black text-rose-950 text-xs sm:text-sm">
                  Lấy API Key Google Gemini Hoàn Toàn Miễn Phí
                </h4>
                <p className="text-[11px] sm:text-xs text-rose-700 leading-relaxed">
                  Để sử dụng tính năng sáng tác truyện AI, giọng đọc và trò chuyện, bạn cần có API Key từ Google AI Studio.
                </p>
              </div>
            </div>
            <a
              href="https://aistudio.google.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 whitespace-nowrap shadow transition shrink-0"
            >
              <span>Lấy API Key Miễn Phí</span>
              <ExternalLink size={14} />
            </a>
          </div>

          {/* Ô NHẬP API KEY */}
          <div className="space-y-2">
            <label className="block text-xs sm:text-sm font-black text-gray-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound size={15} className="text-amber-600" />
                Google Gemini API Key:
              </span>
              <span className="text-[11px] text-gray-500 font-normal">
                (Lưu an toàn trong bộ nhớ máy của bạn)
              </span>
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Dán mã API Key của bạn (bắt đầu bằng AIzaSy...)"
                className="w-full px-4 py-3 pr-24 rounded-2xl border-2 border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none font-mono text-xs sm:text-sm transition bg-amber-50/30"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg transition"
                  title={showKey ? 'Ẩn khóa' : 'Hiện khóa'}
                >
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={testing || !apiKey.trim()}
                  className="bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1 transition disabled:opacity-40"
                  title="Kiểm tra khóa hoạt động"
                >
                  <RefreshCw size={12} className={testing ? 'animate-spin' : ''} />
                  <span>{testing ? 'Test...' : 'Test'}</span>
                </button>
              </div>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  testResult.success
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                    : 'bg-rose-50 text-rose-800 border border-rose-300'
                }`}
              >
                {testResult.success ? (
                  <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle size={16} className="text-rose-600 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          {/* CHỌN MODEL AI (DẠNG THẺ CARDS THEO YÊU CẦU) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs sm:text-sm font-black text-gray-800 flex items-center gap-1.5">
                <Cpu size={15} className="text-amber-600" />
                Chọn Mô Hình AI (AI Model):
              </label>
              <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                Tự động Fallback khi lỗi
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {AI_MODELS.map((model) => {
                const isSelected = selectedModel === model.id;
                return (
                  <div
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    className={`cursor-pointer p-3.5 rounded-2xl border-2 transition-all relative flex flex-col justify-between text-left ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/80 shadow-md ring-2 ring-amber-300'
                        : 'border-gray-200 bg-white hover:border-amber-200 hover:bg-gray-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-black text-gray-900 leading-snug">
                          {model.name}
                        </span>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                            <Check size={12} strokeWidth={3} />
                          </span>
                        )}
                      </div>
                      <span className="inline-block text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md mb-2">
                        {model.badge}
                      </span>
                      <p className="text-[11px] text-gray-600 leading-relaxed">
                        {model.desc}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500 font-mono">
                      <span>ID: {model.id}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed flex items-center gap-2">
              <Layers size={16} className="text-amber-600 shrink-0" />
              <span>
                <strong>Cơ chế tự chuyển đổi thông minh:</strong> Nếu model đang chọn gặp lỗi hoặc hết hạn mức (429), app sẽ <strong>tự động chuyển ngay</strong> sang các model tiếp theo để không làm gián đoạn bài giảng và câu chuyện của lớp!
              </span>
            </div>
          </div>
        </div>

        {/* NÚT THAO TÁC Ở ĐÁY MODAL */}
        <div className="bg-gray-50 p-4 border-t border-gray-200 flex items-center justify-between gap-3">
          <div className="text-xs text-gray-500">
            {apiKey ? '🟢 Đã cấu hình khóa' : '🔴 Chưa nhập khóa API'}
          </div>

          <div className="flex items-center gap-2">
            {!isRequired && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl font-bold text-xs text-gray-600 hover:bg-gray-200 transition"
              >
                Đóng
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 active:scale-95 text-white font-black px-6 py-2.5 rounded-xl text-xs sm:text-sm shadow-md flex items-center gap-2 transition"
            >
              {saveSuccess ? (
                <>
                  <Check size={16} />
                  <span>Đã Lưu Cài Đặt!</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Lưu Cài Đặt & Sử Dụng</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
