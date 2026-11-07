import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Sparkles, RefreshCw, X, ChevronDown, Check, Zap, Brain
} from 'lucide-react';
import { BUDDY_PERSONAS } from '../data/defaultStories';
import { ChatMessage, BuddyPersona, GeminiModelChoice, Story, StoryPage } from '../types';
import { chatWithBuddyAI } from '../services/geminiService';

interface StoryBuddyChatProps {
  currentStory?: Story;
  currentPage?: StoryPage;
  isOpen: boolean;
  onClose: () => void;
}

export const StoryBuddyChat: React.FC<StoryBuddyChatProps> = ({
  currentStory,
  currentPage,
  isOpen,
  onClose,
}) => {
  const [selectedPersona, setSelectedPersona] = useState<BuddyPersona>(BUDDY_PERSONAS[0]);
  const [selectedModel, setSelectedModel] = useState<GeminiModelChoice>('gemini-3.8-flash');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'model',
      content: BUDDY_PERSONAS[0].greeting,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'gemini-3.8-flash',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSelectPersona = (persona: BuddyPersona) => {
    setSelectedPersona(persona);
    setMessages((prev) => [
      ...prev,
      {
        id: `switch-${Date.now()}`,
        role: 'model',
        content: persona.greeting,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: selectedModel,
      },
    ]);
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      let context = '';
      if (currentStory) {
        context += `Sách: "${currentStory.title}" (${currentStory.theme}). Tóm tắt: ${currentStory.summary}.`;
      }
      if (currentPage) {
        context += ` Hiện đang ở Trang ${currentPage.pageNumber}: "${currentPage.text}".`;
      }

      const conversationHistory = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const chatResult = await chatWithBuddyAI({
        messages: conversationHistory,
        roleId: selectedPersona.id,
        context,
        preferredModel: selectedModel,
      });

      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        content: chatResult.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: chatResult.modelUsed || selectedModel,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      console.error('Lỗi trò chuyện:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          content: `🌟 Ôi, có chút gián đoạn nhỏ: ${err.message || 'Vui lòng kiểm tra lại API Key'}. Chúng mình cùng thử lại nhé!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: `fresh-${Date.now()}`,
        role: 'model',
        content: selectedPersona.greeting,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: selectedModel,
      },
    ]);
  };

  const sampleQuestions = [
    'Ý nghĩa bài học của trang này là gì?',
    'Giải thích từ ngữ khó giúp em!',
    'Làm một bài thơ vui về câu chuyện',
    'Điều gì sẽ xảy ra tiếp theo?',
    'Đố em một câu đố vui về tranh này!',
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[460px] bg-white shadow-2xl z-50 flex flex-col border-l border-amber-200 animate-in slide-in-from-right duration-300">
      {/* TIÊU ĐỀ KHUNG CHAT */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-4 text-white flex flex-col gap-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-3xl p-1.5 bg-white/20 rounded-2xl shadow-inner backdrop-blur-sm">
              {selectedPersona.avatar}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg tracking-tight">{selectedPersona.name}</h3>
                <span className="bg-white/25 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {selectedPersona.badge}
                </span>
              </div>
              <p className="text-xs text-amber-100 font-medium">{selectedPersona.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={clearChat}
              title="Làm mới cuộc trò chuyện"
              className="p-1.5 hover:bg-white/20 rounded-xl transition text-white/90 hover:text-white"
            >
              <RefreshCw size={17} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-xl transition text-white/90 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* CHỌN LINH VẬT & CHỌN MÔ HÌNH GEMINI */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/20">
          {/* Avatar linh vật */}
          <div className="flex items-center gap-1.5 bg-black/10 p-1 rounded-xl">
            {BUDDY_PERSONAS.map((p) => {
              const isSelected = selectedPersona.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectPersona(p)}
                  title={`${p.name} - ${p.description}`}
                  className={`text-xl p-1 rounded-lg transition-all ${
                    isSelected ? 'bg-white shadow-sm scale-110' : 'opacity-70 hover:opacity-100 hover:scale-105'
                  }`}
                >
                  {p.avatar}
                </button>
              );
            })}
          </div>

          {/* Chọn mô hình Gemini */}
          <div className="relative">
            <button
              onClick={() => setShowModelMenu(!showModelMenu)}
              className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white px-2.5 py-1.5 rounded-xl text-xs font-bold transition shadow-sm backdrop-blur-sm border border-white/25"
            >
              {selectedModel === 'gemini-4-argon' ? (
                <>
                  <Brain size={13} className="text-purple-200" />
                  <span>Argon (Sâu sắc)</span>
                </>
              ) : selectedModel === 'gemini-3.1-flash-lite' ? (
                <>
                  <Zap size={13} className="text-yellow-200" />
                  <span>Lite (Nhanh)</span>
                </>
              ) : (
                <>
                  <Sparkles size={13} className="text-amber-200" />
                  <span>Flash 3.8</span>
                </>
              )}
              <ChevronDown size={13} />
            </button>

            {showModelMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white text-gray-800 rounded-2xl shadow-2xl border border-gray-200 p-2 z-50 animate-in fade-in zoom-in-95">
                <p className="text-[10px] font-black uppercase text-gray-400 px-2 py-1 tracking-wider">
                  Chọn Mô Hình Gemini AI
                </p>

                <button
                  onClick={() => {
                    setSelectedModel('gemini-3.8-flash');
                    setShowModelMenu(false);
                  }}
                  className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition ${
                    selectedModel === 'gemini-3.8-flash' ? 'bg-amber-50 text-amber-900 font-bold' : 'hover:bg-gray-50'
                  }`}
                >
                  <Sparkles size={16} className="text-amber-500 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span>gemini-3.8-flash</span>
                      {selectedModel === 'gemini-3.8-flash' && <Check size={14} className="text-amber-600" />}
                    </div>
                    <p className="text-[11px] text-gray-500 font-normal">Kể chuyện phong phú & chuẩn mực</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setSelectedModel('gemini-3.1-flash-lite');
                    setShowModelMenu(false);
                  }}
                  className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition ${
                    selectedModel === 'gemini-3.1-flash-lite' ? 'bg-yellow-50 text-yellow-900 font-bold' : 'hover:bg-gray-50'
                  }`}
                >
                  <Zap size={16} className="text-yellow-500 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span>gemini-3.1-flash-lite</span>
                      {selectedModel === 'gemini-3.1-flash-lite' && <Check size={14} className="text-yellow-600" />}
                    </div>
                    <p className="text-[11px] text-gray-500 font-normal">Phản hồi siêu tốc tức thì</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setSelectedModel('gemini-4-argon');
                    setShowModelMenu(false);
                  }}
                  className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition ${
                    selectedModel === 'gemini-4-argon' ? 'bg-purple-50 text-purple-900 font-bold' : 'hover:bg-gray-50'
                  }`}
                >
                  <Brain size={16} className="text-purple-600 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span>gemini-4-argon</span>
                      {selectedModel === 'gemini-4-argon' && <Check size={14} className="text-purple-600" />}
                    </div>
                    <p className="text-[11px] text-gray-500 font-normal">Tư duy sâu sắc & sáng tạo cao</p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* THANH NGỮ CẢNH TRUYỆN ĐANG ĐỌC */}
      {currentStory && (
        <div className="bg-amber-50/90 px-4 py-2 border-b border-amber-100 flex items-center justify-between text-xs text-amber-900 font-medium">
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-bold text-amber-700">Đang đọc:</span>
            <span className="truncate italic font-semibold">{currentStory.title}</span>
            {currentPage && (
              <span className="bg-amber-200/70 text-amber-900 font-bold px-1.5 py-0.2 rounded text-[10px]">
                Trang {currentPage.pageNumber}
              </span>
            )}
          </div>
        </div>
      )}

      {/* KHUNG TIN NHẮN CUỘN */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-gradient-to-b from-[#FFFDF9] to-[#FFF9F0]">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-lg shadow-sm shrink-0 mt-0.5">
                  {selectedPersona.avatar}
                </div>
              )}
              {isUser && (
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold shadow-sm shrink-0 mt-0.5">
                  🧒
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-white text-gray-800 border border-amber-100/80 rounded-tl-none'
                }`}
              >
                <div className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                <div
                  className={`flex items-center gap-2 mt-1.5 text-[10px] ${
                    isUser ? 'text-blue-200 justify-end' : 'text-gray-400 justify-between'
                  }`}
                >
                  {!isUser && msg.modelUsed && (
                    <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-mono text-[9px] border border-amber-200/50">
                      {msg.modelUsed}
                    </span>
                  )}
                  <span>{msg.timestamp}</span>
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-lg shadow-sm animate-bounce">
              {selectedPersona.avatar}
            </div>
            <div className="bg-white border border-amber-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm text-sm text-amber-800 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse delay-150"></span>
              <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse delay-300"></span>
              <span className="text-xs font-bold text-amber-700 ml-1">
                {selectedPersona.name} đang suy nghĩ...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* GỢI Ý CÂU HỎI NHANH */}
      <div className="px-4 py-2 bg-white border-t border-amber-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {sampleQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            disabled={loading}
            className="text-[11px] font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full border border-amber-200 whitespace-nowrap transition shrink-0 active:scale-95 disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Ô NHẬP TIN NHẮN */}
      <div className="p-3 bg-white border-t border-amber-200 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={`Trò chuyện cùng ${selectedPersona.name}...`}
          disabled={loading}
          className="flex-1 p-3 bg-amber-50/50 border border-amber-200 rounded-2xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:bg-white outline-none transition font-medium placeholder-amber-400/80"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || loading}
          className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-white p-3 rounded-2xl shadow-md transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shrink-0"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};
