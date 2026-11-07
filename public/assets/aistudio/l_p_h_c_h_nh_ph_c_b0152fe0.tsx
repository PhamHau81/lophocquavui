import React, { useState, useEffect } from 'react';
import { 
  Users, CheckSquare, Gift, Phone, Settings, 
  Menu, X, Play, Square, Dna, Trophy, BarChart3, 
  LayoutGrid, Target, UserPlus, Upload, PhoneCall, CheckCircle2, Clock
} from 'lucide-react';

export default function LopHocHanhPhuc() {
  const [activeTab, setActiveTab] = useState('tong-quan');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- GLOBAL STATE ---
  const [className, setClassName] = useState("12A6");
  const [schoolName, setSchoolName] = useState("THPT Hồng Ngự 3");
  const [teacherName, setTeacherName] = useState("Phạm Hậu");

  const [students, setStudents] = useState([
    { id: 1, name: 'Nguyễn Phương Anh', points: 15, avatar: '🐰', group: 1, phone: '0901234567', called: false },
    { id: 2, name: 'Cao Minh Tuấn', points: 12, avatar: '🦊', group: 2, phone: '0912345678', called: false },
    { id: 3, name: 'Lục Thành An', points: 20, avatar: '🐯', group: 3, phone: '0923456789', called: false },
    { id: 4, name: 'Đỗ Tùng Lâm', points: 8, avatar: '🐼', group: 4, phone: '0934567890', called: false },
    { id: 5, name: 'Trần Đăng Khoa', points: 5, avatar: '🐶', group: 1, phone: '0945678901', called: false }
  ]);

  // --- ATTENDANCE STATE ---
  const [attendance, setAttendance] = useState({});

  // --- POINT MODAL STATE ---
  const [pointModal, setPointModal] = useState({ isOpen: false, studentId: null });

  // --- CORE FUNCTIONS ---
  const handleUpdatePoint = (studentId, pointsToAdd) => {
    setStudents(students.map(s => 
      s.id === studentId ? { ...s, points: Math.max(0, s.points + pointsToAdd) } : s
    ));
    setPointModal({ isOpen: false, studentId: null });
  };

  // --- COMPONENT: TỔNG QUAN (DASHBOARD) ---
  const DashboardTab = () => {
    const sortedStudents = [...students].sort((a, b) => b.points - a.points).slice(0, 5);
    const totalPoints = students.reduce((sum, s) => sum + s.points, 0);
    const absentCount = Object.values(attendance).filter(v => v && v.status !== 'Có mặt').length;
    const presentCount = students.length - absentCount;

    return (
      <div className="p-4 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-bold">SĨ SỐ HÔM NAY</p>
              <h3 className="text-3xl font-black text-green-700">{presentCount}/{students.length}</h3>
            </div>
            <Users className="w-12 h-12 text-green-200" />
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-bold">TỔNG SAO THI ĐUA</p>
              <h3 className="text-3xl font-black text-orange-500">{totalPoints} ⭐️</h3>
            </div>
            <Trophy className="w-12 h-12 text-orange-200" />
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-bold">VẮNG HÔM NAY</p>
              <h3 className="text-3xl font-black text-red-500">{absentCount}</h3>
            </div>
            <BarChart3 className="w-12 h-12 text-red-200" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100">
          <h2 className="text-xl font-bold text-green-800 mb-4 flex items-center"><Trophy className="mr-2"/> Top 5 Học Sinh Chăm Ngoan</h2>
          <div className="space-y-3">
            {sortedStudents.map((s, idx) => (
              <div key={s.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                <div className="flex items-center gap-3">
                  <span className={`font-black text-lg ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-orange-400' : 'text-gray-600'}`}>
                    #{idx + 1}
                  </span>
                  <span className="text-2xl">{s.avatar}</span>
                  <span className="font-bold text-gray-800">{s.name}</span>
                  <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">Tổ {s.group}</span>
                </div>
                <span className="font-bold text-green-600 bg-white px-3 py-1 rounded-full border border-green-200">{s.points} ⭐️</span>
              </div>
            ))}
            {sortedStudents.length === 0 && <p className="text-gray-500 italic text-center py-4">Chưa có dữ liệu học sinh</p>}
          </div>
        </div>
      </div>
    );
  };

  // --- COMPONENT: ĐIỂM DANH (ATTENDANCE) ---
  const AttendanceTab = () => {
    const handleStatusChange = (id, status) => {
      setAttendance(prev => ({
        ...prev,
        [id]: { ...(prev[id] || { reason: '' }), status }
      }));
    };

    const handleReasonChange = (id, reason) => {
      setAttendance(prev => ({
        ...prev,
        [id]: { ...(prev[id] || { status: 'Có mặt' }), reason }
      }));
    };

    return (
      <div className="p-4 space-y-6">
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-green-100">
          <div>
            <h2 className="text-2xl font-bold text-green-800 flex items-center"><CheckSquare className="mr-2"/> Điểm Danh Lớp {className}</h2>
            <p className="text-sm text-gray-500 mt-1">Hôm nay: {new Date().toLocaleDateString('vi-VN')}</p>
          </div>
          <div className="bg-green-100 text-green-800 font-bold px-4 py-2 rounded-xl text-sm">
            Sĩ số: {students.length}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-green-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-green-50 text-green-900 border-b border-green-100">
                <tr>
                  <th className="p-4 font-bold">STT</th>
                  <th className="p-4 font-bold">Học sinh</th>
                  <th className="p-4 font-bold text-center">Trạng thái</th>
                  <th className="p-4 font-bold">Lý do / Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, index) => {
                  const currentStatus = attendance[s.id]?.status || 'Có mặt';
                  const currentReason = attendance[s.id]?.reason || '';
                  
                  return (
                    <tr key={s.id} className="border-b border-gray-100 hover:bg-green-50/50 transition-colors">
                      <td className="p-4 font-medium text-gray-500">{index + 1}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{s.avatar}</span>
                          <span className="font-bold text-gray-800">{s.name}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          {['Có mặt', 'Vắng phép', 'Vắng KP', 'Đi trễ'].map(st => {
                            const isSelected = currentStatus === st;
                            return (
                              <button
                                key={st}
                                onClick={() => handleStatusChange(s.id, st)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                  isSelected 
                                    ? st === 'Có mặt' ? 'bg-green-600 text-white shadow-sm' 
                                      : st.includes('Vắng') ? 'bg-red-500 text-white shadow-sm' 
                                      : 'bg-orange-500 text-white shadow-sm'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                {st}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td className="p-4">
                        {currentStatus !== 'Có mặt' && (
                          <input 
                            type="text" 
                            placeholder="Ghi chú lý do..." 
                            value={currentReason}
                            onChange={(e) => handleReasonChange(s.id, e.target.value)}
                            className="w-full p-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // --- COMPONENT: CỬA HÀNG ĐỔI QUÀ (REWARDS) ---
  const RewardsTab = () => {
    const rewardsList = [
      { id: 1, name: 'Cây bút bi điểm 10', cost: 5, icon: '🖊️' },
      { id: 2, name: 'Miễn 1 lần trả bài cũ', cost: 15, icon: '🛡️' },
      { id: 3, name: 'Đổi chỗ ngồi 1 tuần', cost: 25, icon: '🪑' },
      { id: 4, name: 'Cộng 1 điểm miệng', cost: 30, icon: '💯' },
      { id: 5, name: 'Ly trà sữa thơm ngon', cost: 50, icon: '🧋' }
    ];

    const handleRedeem = (reward) => {
      alert(`Tính năng đổi quà "${reward.name}" đang sẵn sàng! Hãy chọn học sinh nhận phần thưởng này.`);
    };

    return (
      <div className="p-4 space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-green-800 flex items-center"><Gift className="mr-2"/> Cửa Hàng Đổi Quà Thi Đua</h2>
            <p className="text-sm text-gray-500 mt-1">Dùng điểm sao tích lũy để đổi các phần quà hấp dẫn</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {rewardsList.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl p-6 border border-amber-100 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center">
              <div className="text-6xl mb-4">{r.icon}</div>
              <h3 className="font-bold text-gray-800 mb-2 h-12 flex items-center">{r.name}</h3>
              <div className="bg-amber-50 text-amber-800 font-black px-4 py-1.5 rounded-full text-sm mb-6 border border-amber-200">
                {r.cost} ⭐️
              </div>
              <button 
                onClick={() => handleRedeem(r)}
                className="w-full bg-green-600 text-white py-2.5 rounded-xl font-bold shadow-sm hover:bg-green-700 transition-colors mt-auto"
              >
                Đổi quà ngay
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // --- COMPONENT: SỔ LIÊN LẠC (CONTACTS) ---
  const ContactsTab = () => {
    return (
      <div className="p-4 space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100">
          <h2 className="text-2xl font-bold text-green-800 flex items-center"><Phone className="mr-2"/> Sổ Liên Lạc Phụ Huynh</h2>
          <p className="text-sm text-gray-500 mt-1">Danh bạ liên hệ nhanh chóng và ghi chú trao đổi học tập</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-green-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-green-50 text-green-900 border-b border-green-100">
                <tr>
                  <th className="p-4 font-bold">Học sinh</th>
                  <th className="p-4 font-bold">Tổ</th>
                  <th className="p-4 font-bold">Số điện thoại PH</th>
                  <th className="p-4 font-bold">Điểm sao hiện tại</th>
                  <th className="p-4 font-bold text-center">Thao tác liên hệ</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-b border-gray-100 hover:bg-green-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{s.avatar}</span>
                        <span className="font-bold text-gray-800">{s.name}</span>
                      </div>
                    </td>
                    <td className="p-4 font-medium text-gray-600">Tổ {s.group}</td>
                    <td className="p-4 font-mono font-medium text-gray-700">{s.phone || 'Chưa cập nhật'}</td>
                    <td className="p-4 font-bold text-green-600">{s.points} ⭐️</td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <a 
                          href={`tel:${s.phone}`} 
                          className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1 hover:bg-blue-100 transition-colors"
                        >
                          <PhoneCall size={14} /> Gọi điện
                        </a>
                        <button 
                          onClick={() => alert(`Mở liên hệ Zalo phụ huynh của học sinh ${s.name}`)}
                          className="bg-sky-50 text-sky-600 px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1 hover:bg-sky-100 transition-colors"
                        >
                          Zalo
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // --- COMPONENT: HỌC SINH & CỘNG SAO CÓ TIÊU CHÍ ---
  const StudentsTab = () => (
    <div className="p-4">
      <h2 className="text-2xl font-bold text-green-800 mb-6 flex items-center"><Users className="mr-2"/> Chấm điểm Thi đua</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {students.map((s) => (
          <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm hover:shadow-md transition relative">
            <div className="text-5xl mb-2">{s.avatar}</div>
            <h3 className="font-bold text-gray-800 text-sm h-10 flex items-center justify-center">{s.name}</h3>
            <p className="text-xs font-medium text-gray-500 bg-gray-100 inline-block px-2 py-1 rounded-md mb-2">Tổ {s.group}</p>
            <div className="text-xl font-black text-green-600 mb-4">{s.points} ⭐️</div>
            
            <button 
              onClick={() => setPointModal({ isOpen: true, studentId: s.id })}
              className="w-full bg-green-100 text-green-700 py-2 rounded-lg font-bold text-sm hover:bg-green-200 transition-colors"
            >
              Chấm điểm
            </button>
          </div>
        ))}
      </div>

      {/* POPUP TIÊU CHÍ CHẤM ĐIỂM */}
      {pointModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-green-600 p-4 flex justify-between items-center text-white">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Target size={20}/> 
                Đánh giá: {students.find(s => s.id === pointModal.studentId)?.name}
              </h3>
              <button onClick={() => setPointModal({ isOpen: false, studentId: null })} className="hover:bg-green-700 p-1 rounded-full"><X/></button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <h4 className="font-bold text-green-700 mb-2 flex items-center gap-1">🌟 Cộng sao (Tích cực)</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => handleUpdatePoint(pointModal.studentId, 1)} className="p-3 border border-green-200 rounded-xl hover:bg-green-50 text-left text-sm font-semibold text-gray-700 transition-colors">🙋‍♂️ Phát biểu (+1)</button>
                  <button onClick={() => handleUpdatePoint(pointModal.studentId, 2)} className="p-3 border border-green-200 rounded-xl hover:bg-green-50 text-left text-sm font-semibold text-gray-700 transition-colors">📝 Làm bài tốt (+2)</button>
                  <button onClick={() => handleUpdatePoint(pointModal.studentId, 1)} className="p-3 border border-green-200 rounded-xl hover:bg-green-50 text-left text-sm font-semibold text-gray-700 transition-colors">🧹 Trực nhật (+1)</button>
                  <button onClick={() => handleUpdatePoint(pointModal.studentId, 3)} className="p-3 border border-green-200 rounded-xl hover:bg-green-50 text-left text-sm font-semibold text-gray-700 transition-colors">💯 Điểm giỏi (+3)</button>
                </div>
              </div>
              
              <div className="pt-2 border-t border-gray-100">
                <h4 className="font-bold text-red-600 mb-2 flex items-center gap-1">⚠️ Trừ sao (Vi phạm)</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => handleUpdatePoint(pointModal.studentId, -1)} className="p-3 border border-red-200 rounded-xl hover:bg-red-50 text-left text-sm font-semibold text-gray-700 transition-colors">🗣 Nói chuyện (-1)</button>
                  <button onClick={() => handleUpdatePoint(pointModal.studentId, -2)} className="p-3 border border-red-200 rounded-xl hover:bg-red-50 text-left text-sm font-semibold text-gray-700 transition-colors">⏰ Đi trễ (-2)</button>
                  <button onClick={() => handleUpdatePoint(pointModal.studentId, -5)} className="p-3 border border-red-200 rounded-xl hover:bg-red-50 text-left text-sm font-semibold text-gray-700 transition-colors">🚫 Không thuộc bài (-5)</button>
                  <button onClick={() => handleUpdatePoint(pointModal.studentId, -3)} className="p-3 border border-red-200 rounded-xl hover:bg-red-50 text-left text-sm font-semibold text-gray-700 transition-colors">📱 Dùng điện thoại (-3)</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // --- COMPONENT: GỌI TÊN MỚI (CÓ LOẠI TRỪ NGƯỜI ĐÃ GỌI) ---
  const RandomCallTab = () => {
    const [winner, setWinner] = useState(null);
    const [excludeCalled, setExcludeCalled] = useState(true);
    const [isSpinning, setIsSpinning] = useState(false);

    const handleSpin = () => {
      if (students.length === 0) return;
      
      setIsSpinning(true);
      setWinner(null);
      
      setTimeout(() => {
        let availableStudents = students;
        if (excludeCalled) {
          availableStudents = students.filter(s => !s.called);
          if (availableStudents.length === 0) {
             alert("Đã gọi hết tất cả học sinh trong lớp! Danh sách sẽ được làm mới lại.");
             setStudents(students.map(s => ({ ...s, called: false })));
             availableStudents = students; // Reset
          }
        }

        const randomIdx = Math.floor(Math.random() * availableStudents.length);
        const selected = availableStudents[randomIdx];
        
        setWinner(selected);
        setStudents(students.map(s => s.id === selected.id ? { ...s, called: true } : s));
        setIsSpinning(false);
      }, 1200);
    };

    return (
      <div className="flex flex-col items-center justify-center p-10 h-full min-h-[70vh]">
        <h2 className="text-3xl font-black text-green-800 mb-2">🎯 Vòng Quay May Mắn</h2>
        <p className="text-gray-500 mb-8">Gọi tên ngẫu nhiên học sinh trả lời bài</p>

        <label className="flex items-center gap-3 mb-8 bg-white px-5 py-3 rounded-full shadow-sm border border-green-200 cursor-pointer hover:bg-green-50 transition-colors">
          <input 
            type="checkbox" 
            checked={excludeCalled} 
            onChange={(e) => setExcludeCalled(e.target.checked)}
            className="w-5 h-5 text-green-600 rounded border-gray-300 focus:ring-green-500"
          />
          <span className="font-semibold text-gray-700 select-none">Không gọi lại bạn đã được gọi</span>
        </label>

        <div className="relative w-64 h-64 bg-white rounded-full shadow-2xl border-[12px] border-green-500 flex flex-col items-center justify-center mb-10 overflow-hidden">
           {isSpinning ? (
             <div className="text-2xl font-bold animate-pulse text-green-600">Đang quay...</div>
           ) : winner ? (
             <div className="text-center animate-in zoom-in p-4 bg-green-50 w-full h-full flex flex-col justify-center items-center">
               <div className="text-6xl mb-2 filter drop-shadow-md">{winner.avatar}</div>
               <div className="font-bold text-xl text-green-900 leading-tight px-2">{winner.name}</div>
             </div>
           ) : (
             <Target className="w-24 h-24 text-green-100" />
           )}
        </div>

        <button 
          onClick={handleSpin}
          disabled={isSpinning}
          className="bg-green-600 text-white px-12 py-4 rounded-full text-2xl font-black hover:bg-green-700 shadow-xl transform active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSpinning ? "Chờ chút..." : "🎲 QUAY NGAY!"}
        </button>
      </div>
    );
  };

  // --- COMPONENT: SƠ ĐỒ CHỖ NGỒI ---
  const SeatingTab = () => {
    const [seatMap, setSeatMap] = useState([...students]);

    useEffect(() => {
        setSeatMap(prev => {
            return prev.map(p => students.find(s => s.id === p.id) || p).filter(p => students.some(s => s.id === p.id));
        });
        const newStudents = students.filter(s => !seatMap.some(p => p.id === s.id));
        if (newStudents.length > 0) {
            setSeatMap(curr => [...curr, ...newStudents]);
        }
    }, [students]);

    const shuffleSeats = () => {
      const shuffled = [...seatMap].sort(() => 0.5 - Math.random());
      setSeatMap(shuffled);
    };

    return (
      <div className="p-4">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold text-green-800 flex items-center"><LayoutGrid className="mr-2"/> Sơ đồ lớp {className}</h2>
          <button onClick={shuffleSeats} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm hover:bg-blue-700 transition-colors w-full sm:w-auto">
            🔄 Đổi chỗ ngẫu nhiên
          </button>
        </div>
        
        <div className="bg-green-50/50 p-4 md:p-8 rounded-3xl flex flex-col items-center border-2 border-green-100 min-h-[500px]">
          <div className="w-full max-w-sm bg-white text-center py-4 rounded-xl border-b-4 border-green-600 font-black text-green-800 mb-12 shadow-md flex items-center justify-center gap-2">
            <Users size={20} className="text-green-600" /> BÀN GIÁO VIÊN
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-8 w-full max-w-5xl">
            {seatMap.map((s, idx) => (
              <div key={idx} className="bg-white border-b-4 border-green-200 rounded-2xl p-4 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="text-4xl mb-2">{s.avatar}</div>
                <div className="font-bold text-sm text-gray-800 h-10 flex items-center justify-center leading-tight">{s.name}</div>
                <div className="text-xs font-bold text-green-600 mt-2 bg-green-50 py-1 rounded-md">Tổ {s.group}</div>
              </div>
            ))}
            {Array.from({ length: Math.max(0, 16 - seatMap.length) }).map((_, idx) => (
              <div key={`empty-${idx}`} className="bg-transparent border-2 border-dashed border-green-200 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[120px]">
                <div className="w-10 h-10 rounded-full bg-green-100 mb-2"></div>
                <span className="text-green-300 text-xs font-bold uppercase">Trống</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // --- COMPONENT: CÀI ĐẶT & NHẬP EXCEL ---
  const SettingsTab = () => {
    const [excelData, setExcelData] = useState("");

    const handleImportExcel = () => {
      if (!excelData.trim()) return;
      const lines = excelData.split('\n');
      const newStudents = lines.map((line, index) => {
        const parts = line.split('\t');
        const name = parts[0] ? parts[0].trim() : '';
        const phone = parts[1] ? parts[1].trim() : '';
        
        if (!name) return null;

        return {
          id: Date.now() + index,
          name: name,
          points: 0,
          group: (index % 4) + 1,
          avatar: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐸','🐯','🦁','🐮'][index % 12],
          phone: phone,
          called: false
        };
      }).filter(s => s !== null);

      if (newStudents.length > 0 && window.confirm(`Bạn muốn thêm ${newStudents.length} học sinh này vào lớp?`)) {
        setStudents([...students, ...newStudents]);
        setExcelData("");
        alert("Nhập dữ liệu thành công!");
      }
    };

    return (
      <div className="p-4 space-y-6">
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-green-100">
          <h2 className="text-xl font-bold text-green-800 mb-6 flex items-center"><Settings className="mr-2"/> Thông tin chung</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-600 mb-2">Tên lớp học</label>
              <input type="text" value={className} onChange={(e) => setClassName(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white transition-all outline-none font-medium" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-600 mb-2">Tên trường</label>
              <input type="text" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white transition-all outline-none font-medium" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-600 mb-2">Giáo viên chủ nhiệm</label>
              <input type="text" value={teacherName} onChange={(e) => setTeacherName(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white transition-all outline-none font-medium" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-green-100">
          <h2 className="text-xl font-bold text-green-800 mb-2 flex items-center"><Upload className="mr-2"/> Nhập danh sách từ Excel</h2>
          <p className="text-sm text-gray-500 mb-6">Mở file Excel, bôi đen cột <strong>Họ và Tên</strong> và <strong>Số điện thoại</strong> (nếu có), nhấn Copy và Paste vào ô bên dưới.</p>
          
          <textarea 
            value={excelData}
            onChange={(e) => setExcelData(e.target.value)}
            className="w-full h-40 p-4 bg-gray-50 border border-gray-200 rounded-xl mb-6 text-sm font-mono focus:ring-2 focus:ring-green-500 focus:bg-white transition-all outline-none resize-none leading-relaxed placeholder-gray-400"
            placeholder="Nguyễn Phương Anh&#9;0901234567&#10;Cao Minh Tuấn&#9;0912345678"
          ></textarea>
          
          <button onClick={handleImportExcel} className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold shadow-md hover:bg-green-700 transition-colors flex items-center gap-2">
            <Upload size={18} /> Tiến hành nhập dữ liệu
          </button>
        </div>
      </div>
    );
  };

  // --- NAVIGATION MAP ---
  const menuItems = [
    { id: 'tong-quan', icon: BarChart3, label: 'Tổng quan' },
    { id: 'hoc-sinh', icon: Target, label: 'Chấm thi đua' },
    { id: 'diem-danh', icon: CheckSquare, label: 'Điểm danh' },
    { id: 'vong-quay', icon: Play, label: 'Gọi tên ngẫu nhiên' },
    { id: 'so-do', icon: LayoutGrid, label: 'Sơ đồ chỗ ngồi' },
    { id: 'doi-qua', icon: Gift, label: 'Đổi quà' },
    { id: 'so-lien-lac', icon: Phone, label: 'Sổ liên lạc' },
    { id: 'cai-dat', icon: Settings, label: 'Cài đặt & Excel' },
  ];

  return (
    <div className="min-h-screen bg-[#F0FDF4] flex flex-col md:flex-row font-sans text-gray-800">
      
      {/* MOBILE HEADER */}
      <div className="md:hidden bg-green-700 text-white p-4 flex justify-between items-center shadow-md z-30 sticky top-0">
        <h1 className="font-black text-xl flex items-center tracking-tight"><Dna className="mr-2"/> Lớp {className}</h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-1 hover:bg-green-600 rounded-md transition-colors">
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* MOBILE OVERLAY */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 transition-transform duration-300 ease-in-out
        fixed md:static inset-y-0 left-0 z-30 w-72 bg-white border-r border-green-100 shadow-2xl md:shadow-none flex flex-col
      `}>
        <div className="p-8 border-b border-green-50 hidden md:block">
          <div className="text-xs font-black text-green-500 tracking-widest uppercase mb-2">{schoolName}</div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Lớp {className}</h1>
          <p className="text-sm text-gray-500 mt-2 font-medium flex items-center"><Users size={14} className="mr-1"/> GV: {teacherName}</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold transition-all duration-200 ${
                  isActive 
                    ? 'bg-green-600 text-white shadow-md shadow-green-200 translate-x-1' 
                    : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
                }`}
              >
                <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                {item.label}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 h-screen overflow-y-auto">
        <div className="max-w-6xl mx-auto p-2 md:p-8 pb-20 md:pb-8">
          {activeTab === 'tong-quan' && <DashboardTab />}
          {activeTab === 'hoc-sinh' && <StudentsTab />}
          {activeTab === 'diem-danh' && <AttendanceTab />}
          {activeTab === 'vong-quay' && <RandomCallTab />}
          {activeTab === 'so-do' && <SeatingTab />}
          {activeTab === 'doi-qua' && <RewardsTab />}
          {activeTab === 'so-lien-lac' && <ContactsTab />}
          {activeTab === 'cai-dat' && <SettingsTab />}
        </div>
      </main>
    </div>
  );
}