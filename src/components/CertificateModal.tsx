import React, { useRef } from 'react';
import { 
  X, Printer, Download, Award, Sparkles, Star, 
  CheckCircle2, Share2, Medal, FileText 
} from 'lucide-react';
import { Student } from '../types';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  className: string;
  schoolName: string;
  teacherName: string;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  onClose,
  student,
  className,
  schoolName,
  teacherName,
}) => {
  const printRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen || !student) return null;

  const todayStr = new Date().toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  // Xác định danh hiệu dựa trên điểm sao
  let titleAward = 'Đại Sứ Hạnh Phúc';
  if (student.points >= 20) {
    titleAward = 'Học Sinh Xuất Sắc & Đại Sứ Hạnh Phúc';
  } else if (student.points >= 15) {
    titleAward = 'Hiệp Sĩ Chăm Chỉ & Lan Tỏa Yêu Thương';
  } else {
    titleAward = 'Bạn Nhỏ Tích Cực & Chăm Ngoan';
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadText = () => {
    const textContent = `
============================================================
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                 Độc lập - Tự do - Hạnh phúc
------------------------------------------------------------
                    GIẤY KHEN DANH DỰ
                LỚP HỌC HẠNH PHÚC - ${schoolName.toUpperCase()}
------------------------------------------------------------

Thầy Chủ Nhiệm khen tặng:
Học sinh: ${student.name.toUpperCase()}
Lớp: ${className} - ${schoolName}
Đã có thành tích xuất sắc: Đạt ${student.points} ngôi sao thi đua học tập và rèn luyện.
Danh hiệu trao tặng: ${titleAward}

Ngày cấp: ${todayStr}
GIÁO VIÊN CHỦ NHIỆM
(Đã ký)
Thầy ${teacherName}
============================================================
    `.trim();

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GiayKhen_${student.name.replace(/\s+/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[95vh] flex flex-col shadow-2xl border-4 border-amber-300 overflow-hidden">
        {/* THANH ĐIỀU KHIỂN TRÊN CÙNG (KHÔNG HIỆN KHI IN) */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-4 text-white flex items-center justify-between shadow-md print:hidden">
          <div className="flex items-center gap-2">
            <Award className="w-6 h-6 text-yellow-300" />
            <h3 className="font-black text-sm sm:text-base">
              Giấy Khen Học Sinh Hạnh Phúc · {student.name}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-white hover:bg-amber-50 text-amber-950 font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95 shadow"
            >
              <Printer size={15} />
              <span>In Giấy Khen (A4)</span>
            </button>

            <button
              onClick={handleDownloadText}
              className="bg-black/20 hover:bg-black/30 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1 transition"
            >
              <Download size={15} />
              <span>Tải File</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition text-white"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* KHUNG GIẤY KHEN CHUẨN HOÀNG GIA (ĐỂ IN) */}
        <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-amber-50/20 flex items-center justify-center print:p-0 print:m-0">
          <div
            ref={printRef}
            className="w-full max-w-2xl bg-[#FFFDF7] p-8 sm:p-12 rounded-3xl border-8 border-double border-amber-400 shadow-xl relative text-center text-gray-900 select-none print:border-8 print:shadow-none print:w-full"
            style={{
              backgroundImage: 'radial-gradient(circle at center, #FFFDF7 0%, #FFF8E7 100%)',
            }}
          >
            {/* HOA VĂN 4 GÓC */}
            <div className="absolute top-2 left-2 text-2xl text-amber-500 opacity-80">⚜️</div>
            <div className="absolute top-2 right-2 text-2xl text-amber-500 opacity-80">⚜️</div>
            <div className="absolute bottom-2 left-2 text-2xl text-amber-500 opacity-80">⚜️</div>
            <div className="absolute bottom-2 right-2 text-2xl text-amber-500 opacity-80">⚜️</div>

            {/* QUỐC HIỆU */}
            <div className="text-[11px] sm:text-xs font-black tracking-widest text-amber-900 uppercase">
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
            </div>
            <div className="text-[10px] text-gray-600 font-bold tracking-wider mb-6">
              Độc lập - Tự do - Hạnh phúc
            </div>

            {/* HUY CHƯƠNG LỚP HỌC HẠNH PHÚC */}
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-3xl shadow-md mb-2 border-2 border-white">
              🏅
            </div>

            <div className="text-xs font-black uppercase tracking-widest text-emerald-800 mb-1">
              {schoolName} · LỚP {className}
            </div>

            <h1 className="text-3xl sm:text-4xl font-serif font-black text-rose-700 tracking-wider mb-2">
              GIẤY KHEN DANH DỰ
            </h1>

            <div className="text-xs sm:text-sm text-gray-700 italic font-serif mb-4">
              Thầy giáo Chủ nhiệm trân trọng tuyên dương và trao tặng:
            </div>

            {/* TÊN HỌC SINH */}
            <div className="text-2xl sm:text-3xl font-black text-emerald-950 font-serif border-b-2 border-amber-300 inline-block px-8 pb-1 mb-3">
              {student.avatar} {student.name.toUpperCase()}
            </div>

            <div className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">
              Học sinh Tổ {student.group} · Đã tích lũy xuất sắc{' '}
              <strong className="text-amber-700 font-black text-base">{student.points} ⭐ Ngôi Sao Thi Đua</strong>
            </div>

            <div className="inline-block bg-amber-100 text-amber-900 font-black px-4 py-1.5 rounded-full text-xs sm:text-sm border border-amber-300 mb-6 shadow-sm">
              ✨ Danh hiệu: {titleAward} ✨
            </div>

            {/* CHỮ KÝ */}
            <div className="flex items-center justify-between pt-6 border-t border-amber-200 text-xs font-serif text-gray-700">
              <div className="text-left">
                <div className="text-[11px] text-gray-500">Mã số vinh danh: #{student.id}</div>
                <div className="text-[11px] text-gray-500">Lớp Học Hạnh Phúc</div>
              </div>

              <div className="text-right">
                <div className="italic text-[11px] text-gray-600 mb-1">
                  Đồng Tháp, ngày {todayStr}
                </div>
                <div className="font-bold text-gray-900 uppercase tracking-wider">
                  GIÁO VIÊN CHỦ NHIỆM
                </div>
                <div className="h-10 flex items-center justify-end">
                  <span className="font-serif italic font-bold text-indigo-900 text-base">
                    Phạm Hậu
                  </span>
                </div>
                <div className="font-black text-emerald-950 text-xs">
                  Thầy {teacherName}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
