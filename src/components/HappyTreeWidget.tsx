import React from 'react';
import { Sparkles, Heart, Trophy, Award, Star } from 'lucide-react';
import confetti from 'canvas-confetti';

interface HappyTreeWidgetProps {
  totalPoints: number;
  className: string;
  teacherName: string;
}

export const HappyTreeWidget: React.FC<HappyTreeWidgetProps> = ({
  totalPoints,
  className,
  teacherName,
}) => {
  // Tính cấp độ cây dựa trên tổng điểm sao (mỗi 50 điểm lên 1 cấp)
  const treeLevel = Math.max(1, Math.min(10, Math.floor(totalPoints / 30) + 1));
  const fruitsCount = Math.min(18, Math.max(4, Math.floor(totalPoints / 10)));

  const triggerCelebrate = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6'],
    });
  };

  return (
    <div className="bg-gradient-to-br from-emerald-500 via-teal-600 to-green-700 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
      {/* HIỆU ỨNG NỀN */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-400/10 rounded-full blur-2xl pointer-events-none"></div>

      {/* CỘT THÔNG TIN CÂY HẠNH PHÚC */}
      <div className="relative z-10 max-w-md space-y-3">
        <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold shadow-inner">
          <Sparkles size={14} className="text-yellow-300" />
          <span>Biểu Tượng Gắn Kết Lớp Học Hạnh Phúc</span>
        </div>

        <h3 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight flex items-center gap-2">
          🌳 Cây Hạnh Phúc Lớp {className}
        </h3>

        <p className="text-emerald-100 text-xs sm:text-sm leading-relaxed">
          Mỗi việc tốt, mỗi nụ cười và mỗi câu chuyện đọc hay của các bạn học sinh đều nuôi dưỡng Cây Hạnh Phúc của Thầy <strong>{teacherName}</strong> đơm hoa kết trái rực rỡ!
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <div className="bg-black/20 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/20 flex items-center gap-2">
            <Star className="text-yellow-300 fill-yellow-300 w-5 h-5 animate-pulse" />
            <div>
              <div className="text-[10px] text-emerald-200 uppercase tracking-wider font-bold">Tổng Sao Tích Lũy</div>
              <div className="text-xl font-black text-yellow-300">{totalPoints} ⭐</div>
            </div>
          </div>

          <div className="bg-black/20 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/20 flex items-center gap-2">
            <Trophy className="text-amber-300 w-5 h-5" />
            <div>
              <div className="text-[10px] text-emerald-200 uppercase tracking-wider font-bold">Cấp Độ Cây</div>
              <div className="text-xl font-black text-white">Cấp {treeLevel} / 10</div>
            </div>
          </div>

          <button
            onClick={triggerCelebrate}
            className="bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-emerald-950 font-black px-4 py-2.5 rounded-2xl text-xs shadow-lg transition flex items-center gap-1.5"
            title="Tung pháo hoa chúc mừng lớp học"
          >
            🎉 Chúc Mừng Lớp
          </button>
        </div>
      </div>

      {/* MINH HỌA CÂY HẠNH PHÚC BẰNG SVG TRỰC QUAN */}
      <div className="relative z-10 shrink-0 w-64 h-64 flex items-center justify-center">
        <svg viewBox="0 0 240 240" className="w-full h-full drop-shadow-2xl">
          {/* Vầng hào quang */}
          <circle cx="120" cy="120" r="100" fill="url(#haloGrad)" opacity="0.3" />

          {/* Gốc và thân cây */}
          <path
            d="M120 220 C110 180, 95 150, 105 110 C108 95, 115 85, 120 80 C125 85, 132 95, 135 110 C145 150, 130 180, 120 220 Z"
            fill="#8B4513"
          />
          {/* Rễ cây */}
          <path d="M120 220 Q90 230 70 235" stroke="#8B4513" strokeWidth="6" strokeLinecap="round" fill="none" />
          <path d="M120 220 Q150 230 170 235" stroke="#8B4513" strokeWidth="6" strokeLinecap="round" fill="none" />

          {/* Tán lá xanh */}
          <circle cx="120" cy="80" r="50" fill="#34D399" opacity="0.9" />
          <circle cx="85" cy="100" r="42" fill="#10B981" opacity="0.95" />
          <circle cx="155" cy="100" r="42" fill="#10B981" opacity="0.95" />
          <circle cx="95" cy="65" r="38" fill="#6EE7B7" opacity="0.85" />
          <circle cx="145" cy="65" r="38" fill="#6EE7B7" opacity="0.85" />
          <circle cx="120" cy="55" r="32" fill="#A7F3D0" opacity="0.9" />

          {/* Các quả / hoa sao vàng phát sáng */}
          {Array.from({ length: fruitsCount }).map((_, i) => {
            const angle = (i * (360 / fruitsCount) * Math.PI) / 180;
            const radius = 25 + (i % 3) * 15;
            const cx = 120 + Math.cos(angle) * radius;
            const cy = 85 + Math.sin(angle) * radius * 0.7;
            const isStar = i % 2 === 0;

            return (
              <g key={`fruit-${i}`} className="animate-bounce" style={{ animationDelay: `${i * 150}ms`, animationDuration: '2.5s' }}>
                <circle cx={cx} cy={cy} r="7" fill={isStar ? '#FBBF24' : '#F43F5E'} stroke="#FFF" strokeWidth="1.5" />
                <circle cx={cx - 2} cy={cy - 2} r="2" fill="#FFF" />
              </g>
            );
          })}

          {/* Ngôi sao đỉnh cây */}
          <polygon
            points="120,20 124,32 137,32 127,40 131,52 120,44 109,52 113,40 103,32 116,32"
            fill="#FBBF24"
            stroke="#F59E0B"
            strokeWidth="1.5"
            className="animate-spin"
            style={{ transformOrigin: '120px 36px', animationDuration: '12s' }}
          />

          <defs>
            <radialGradient id="haloGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
};
