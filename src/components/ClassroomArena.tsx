import React, { useState } from 'react';
import { 
  Trophy, Gift, Star, Award, Zap, Sparkles, Check, 
  HelpCircle, Music, Flame, Shuffle, RefreshCw 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Student } from '../types';

interface ClassroomArenaProps {
  students: Student[];
  onAwardStudent: (studentId: number, points: number, reason: string) => void;
  className: string;
}

interface MysteryBoxItem {
  id: number;
  type: 'stars' | 'quiz' | 'action' | 'fun';
  title: string;
  desc: string;
  points: number;
  icon: string;
}

const MYSTERY_POOL: MysteryBoxItem[] = [
  { id: 1, type: 'stars', title: 'Ngôi Sao May Mắn!', desc: 'Nhận ngay +3 sao thi đua cho tinh thần xung phong!', points: 3, icon: '🌟' },
  { id: 2, type: 'action', title: 'Đọc Thơ Diễn Cảm', desc: 'Đọc 4 câu thơ thiếu nhi hoặc hát 1 bài hát vui nhộn tặng cả lớp!', points: 2, icon: '🎤' },
  { id: 3, type: 'quiz', title: 'Câu Đố Trí Tuệ', desc: 'Con gì chân ngắn mà lại có màng, mỏ bẹt màu vàng hay kêu cạp cạp? (Con Vịt)', points: 2, icon: '🦆' },
  { id: 4, type: 'stars', title: 'Kho Báu Vàng!', desc: 'Chúc mừng bạn! Cả tổ của bạn đều được cộng +1 sao thi đua!', points: 1, icon: '🏆' },
  { id: 5, type: 'fun', title: 'Nụ Cười Thân Thiện', desc: 'Gửi một lời chúc ngọt ngào nhất tới người bạn ngồi bên cạnh!', points: 2, icon: '💖' },
  { id: 6, type: 'quiz', title: 'Thử Thách Đố Vui', desc: 'Cái gì càng rửa thì càng bẩn? (Nước)', points: 2, icon: '🧩' },
];

export const ClassroomArena: React.FC<ClassroomArenaProps> = ({
  students,
  onAwardStudent,
  className,
}) => {
  // Tính điểm theo từng tổ (1 -> 4)
  const groups = [1, 2, 3, 4].map((groupId) => {
    const members = students.filter((s) => s.group === groupId);
    const totalPoints = members.reduce((sum, s) => sum + s.points, 0);
    const avgPoints = members.length > 0 ? (totalPoints / members.length).toFixed(1) : '0';
    return {
      id: groupId,
      name: `Tổ ${groupId}`,
      members,
      totalPoints,
      avgPoints,
    };
  });

  // Tìm tổ dẫn đầu
  const sortedGroups = [...groups].sort((a, b) => b.totalPoints - a.totalPoints);
  const leadingGroup = sortedGroups[0];

  // Minigame Hộp Quà Bí Ẩn State
  const [boxes, setBoxes] = useState<Array<{ id: number; isOpen: boolean; content: MysteryBoxItem }>>(() => {
    return [0, 1, 2, 3].map((idx) => ({
      id: idx + 1,
      isOpen: false,
      content: MYSTERY_POOL[idx % MYSTERY_POOL.length],
    }));
  });
  const [selectedStudentForBox, setSelectedStudentForBox] = useState<number | null>(
    students[0]?.id || null
  );
  const [recentBoxOpened, setRecentBoxOpened] = useState<MysteryBoxItem | null>(null);

  // Thưởng điểm cho cả tổ
  const handleAwardWholeGroup = (groupId: number, points: number) => {
    const targetMembers = students.filter((s) => s.group === groupId);
    if (targetMembers.length === 0) return;

    targetMembers.forEach((member) => {
      onAwardStudent(member.id, points, `Thưởng thi đua Tổ ${groupId}`);
    });

    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#F59E0B', '#10B981', '#3B82F6'],
    });
  };

  // Mở hộp quà bí ẩn
  const handleOpenBox = (boxId: number) => {
    const targetBox = boxes.find((b) => b.id === boxId);
    if (!targetBox || targetBox.isOpen) return;

    const updated = boxes.map((b) => (b.id === boxId ? { ...b, isOpen: true } : b));
    setBoxes(updated);
    setRecentBoxOpened(targetBox.content);

    if (selectedStudentForBox && targetBox.content.points > 0) {
      onAwardStudent(
        selectedStudentForBox,
        targetBox.content.points,
        `Mở hộp quà bí ẩn: ${targetBox.content.title}`
      );
    }

    confetti({
      particleCount: 90,
      spread: 80,
      origin: { y: 0.6 },
    });
  };

  // Xáo trộn và đóng lại các hộp quà
  const handleResetBoxes = () => {
    const shuffled = [...MYSTERY_POOL].sort(() => 0.5 - Math.random());
    setBoxes(
      [0, 1, 2, 3].map((idx) => ({
        id: idx + 1,
        isOpen: false,
        content: shuffled[idx % shuffled.length],
      }))
    );
    setRecentBoxOpened(null);
  };

  return (
    <div className="p-4 sm:p-6 space-y-8">
      {/* BANNER ĐẤU TRƯỜNG THI ĐUA */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-xs font-bold mb-2 shadow-inner">
            <Flame className="text-yellow-300 w-4 h-4 animate-bounce" />
            <span>Đấu Trường Ngôi Sao Thi Đua · Lớp {className}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Thi Đua Giữa 4 Tổ Học Tập
          </h2>
          <p className="text-amber-100 text-xs sm:text-sm mt-1">
            Tổ đang dẫn đầu tuần này:{' '}
            <strong className="text-yellow-200 underline text-base">
              🏆 {leadingGroup?.name} ({leadingGroup?.totalPoints} ⭐)
            </strong>
          </p>
        </div>

        <button
          onClick={handleResetBoxes}
          className="bg-white/20 hover:bg-white/30 text-white font-bold px-4 py-2.5 rounded-2xl text-xs backdrop-blur-sm transition flex items-center gap-1.5 active:scale-95 shadow"
        >
          <RefreshCw size={15} />
          <span>Làm Mới Hộp Quà</span>
        </button>
      </div>

      {/* BẢNG XẾP HẠNG 4 TỔ (DẠNG CỘT CỜ / TÊN LỬA VƯƠN CAO) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {groups.map((group) => {
          const isLeading = group.id === leadingGroup?.id && group.totalPoints > 0;
          return (
            <div
              key={`group-card-${group.id}`}
              className={`rounded-3xl p-5 border-2 transition-all shadow-sm flex flex-col justify-between ${
                isLeading
                  ? 'bg-gradient-to-b from-amber-50 via-white to-amber-50/50 border-amber-400 ring-2 ring-amber-300 shadow-md'
                  : 'bg-white border-gray-200 hover:border-emerald-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black text-gray-900 text-lg flex items-center gap-1.5">
                    {isLeading ? '👑' : '🚩'} {group.name}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full font-bold">
                    {group.members.length} bạn
                  </span>
                </div>

                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-3xl font-black text-amber-600">{group.totalPoints}</span>
                  <span className="text-xs text-gray-500 font-bold">⭐ tổng</span>
                  <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold ml-auto">
                    TB: {group.avgPoints} ⭐/bạn
                  </span>
                </div>

                {/* THANH TIẾN ĐỘ THI ĐUA */}
                <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden mb-4">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isLeading ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-emerald-500'
                    }`}
                    style={{
                      width: `${Math.min(100, (group.totalPoints / Math.max(1, leadingGroup.totalPoints)) * 100)}%`,
                    }}
                  />
                </div>

                {/* DANH SÁCH THÀNH VIÊN TRONG TỔ */}
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 no-scrollbar mb-4">
                  {group.members.map((m) => (
                    <div
                      key={`member-${m.id}`}
                      className="flex items-center justify-between text-xs p-1.5 rounded-xl hover:bg-gray-50 transition"
                    >
                      <span className="font-semibold text-gray-800 flex items-center gap-1 truncate max-w-[120px]">
                        <span>{m.avatar}</span>
                        <span className="truncate">{m.name}</span>
                      </span>
                      <span className="font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                        +{m.points} ⭐
                      </span>
                    </div>
                  ))}
                  {group.members.length === 0 && (
                    <div className="text-xs text-gray-400 italic py-2">Chưa có học sinh</div>
                  )}
                </div>
              </div>

              {/* NÚT THƯỞNG ĐIỂM NHANH CHO CẢ TỔ */}
              <div className="pt-3 border-t border-gray-100 space-y-1.5">
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                  Thưởng điểm cả tổ:
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    onClick={() => handleAwardWholeGroup(group.id, 1)}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold py-1.5 rounded-xl text-xs transition active:scale-95"
                    title={`Thưởng +1 sao cho tất cả bạn trong ${group.name}`}
                  >
                    +1 ⭐
                  </button>
                  <button
                    onClick={() => handleAwardWholeGroup(group.id, 2)}
                    className="bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold py-1.5 rounded-xl text-xs transition active:scale-95"
                    title={`Thưởng +2 sao cho tất cả bạn trong ${group.name}`}
                  >
                    +2 ⭐
                  </button>
                  <button
                    onClick={() => handleAwardWholeGroup(group.id, 5)}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold py-1.5 rounded-xl text-xs transition active:scale-95"
                    title={`Thưởng +5 sao xuất sắc cho ${group.name}`}
                  >
                    +5 ⭐
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MINIGAME: 4 HỘP QUÀ BÍ ẨN (MYSTERY BOXES) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-emerald-100 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-2xl text-white shadow-md">
              🎁
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight">
                Hộp Quà Bí Ẩn · Phần Thưởng Bất Ngờ
              </h3>
              <p className="text-xs text-gray-500">
                Sau khi học sinh xung phong trả lời, hãy cho bạn ấy chọn 1 trong 4 hộp quà may mắn!
              </p>
            </div>
          </div>

          {/* CHỌN HỌC SINH MỞ HỘP */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-gray-600 whitespace-nowrap">Trao cho:</span>
            <select
              value={selectedStudentForBox || ''}
              onChange={(e) => setSelectedStudentForBox(Number(e.target.value))}
              className="bg-gray-50 border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-bold outline-none text-gray-800 max-w-[200px]"
            >
              {students.map((s) => (
                <option key={`gift-student-${s.id}`} value={s.id}>
                  {s.avatar} {s.name} (Tổ {s.group})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4 HỘP QUÀ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {boxes.map((b) => (
            <div
              key={`mystery-box-${b.id}`}
              onClick={() => handleOpenBox(b.id)}
              className={`rounded-3xl p-5 border-2 cursor-pointer transition-all text-center flex flex-col items-center justify-center min-h-[160px] ${
                b.isOpen
                  ? 'bg-gradient-to-b from-amber-50 to-emerald-50 border-emerald-300 shadow-inner'
                  : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-indigo-200 hover:border-indigo-400 hover:scale-105 active:scale-95 shadow-md'
              }`}
            >
              {b.isOpen ? (
                <div className="animate-in zoom-in duration-300 space-y-2">
                  <span className="text-4xl">{b.content.icon}</span>
                  <div className="font-black text-xs text-gray-900 leading-tight">
                    {b.content.title}
                  </div>
                  <div className="text-[11px] text-gray-600 leading-snug">
                    {b.content.desc}
                  </div>
                  {b.content.points > 0 && (
                    <span className="inline-block bg-amber-400 text-amber-950 font-black px-2 py-0.5 rounded-full text-[10px]">
                      +{b.content.points} ⭐
                    </span>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-5xl animate-bounce" style={{ animationDuration: `${2 + b.id * 0.3}s` }}>
                    🎁
                  </div>
                  <div className="font-black text-sm text-indigo-950">
                    Hộp Quà Số {b.id}
                  </div>
                  <div className="text-[10px] text-indigo-600 font-semibold bg-white/70 px-2 py-0.5 rounded-full">
                    Chạm để mở ✨
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {recentBoxOpened && (
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between text-xs font-bold text-emerald-900">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{recentBoxOpened.icon}</span>
              <div>
                <span>Vừa mở: <strong>{recentBoxOpened.title}</strong> — {recentBoxOpened.desc}</span>
                {recentBoxOpened.points > 0 && (
                  <span className="text-amber-700 ml-2">
                    (Đã cộng +{recentBoxOpened.points} sao cho bạn được chọn!)
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleResetBoxes}
              className="bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-xs hover:bg-emerald-700 transition"
            >
              Chơi Lại Lượt Mới
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
