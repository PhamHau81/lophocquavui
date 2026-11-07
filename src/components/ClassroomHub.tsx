import React, { useState, useRef } from 'react';
import { 
  Users, CheckSquare, Gift, Phone, Settings, 
  Play, Trophy, BarChart3, 
  LayoutGrid, Target, Upload, PhoneCall, BookOpen, 
  Save, CheckCircle2, Download, RefreshCw, X, Edit3, Check, 
  UserPlus, Trash2, Sparkles, Filter, Search, Award,
  FileSpreadsheet, FileUp, FileText, CheckCheck, AlertCircle, ArrowRight,
  Flame, Bot, Medal
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Student } from '../types';
import { HappyTreeWidget } from './HappyTreeWidget';
import { ClassroomArena } from './ClassroomArena';
import { TeacherAiAssistant } from './TeacherAiAssistant';
import { CertificateModal } from './CertificateModal';

interface ClassroomHubProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  className: string;
  setClassName: (name: string) => void;
  schoolName: string;
  setSchoolName: (name: string) => void;
  teacherName: string;
  setTeacherName: (name: string) => void;
  attendance: Record<number, { status: string; reason?: string }>;
  setAttendance: React.Dispatch<React.SetStateAction<Record<number, { status: string; reason?: string }>>>;
  lastSynced: string | null;
  onSyncAll: () => Promise<void>;
  isSyncing: boolean;
  onOpenStoryShelf: () => void;
  onOpenStoryCreatorWithStudent?: (student: Student) => void;
}

export const ClassroomHub: React.FC<ClassroomHubProps> = ({
  students,
  setStudents,
  className,
  setClassName,
  schoolName,
  setSchoolName,
  teacherName,
  setTeacherName,
  attendance,
  setAttendance,
  lastSynced,
  onSyncAll,
  isSyncing,
  onOpenStoryShelf,
  onOpenStoryCreatorWithStudent,
}) => {
  const [activeTab, setActiveTab] = useState('danh-sach'); // Mặc định mở tab Danh Sách Học Sinh để người dùng thấy ngay

  // Excel import state
  const [excelData, setExcelData] = useState('');
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [excelInputMode, setExcelInputMode] = useState<'paste' | 'file'>('paste');
  const [parsedExcelStudents, setParsedExcelStudents] = useState<Student[]>([]);
  const [excelImportMode, setExcelImportMode] = useState<'append' | 'replace'>('append');
  const [excelError, setExcelError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sơ đồ chỗ ngồi
  const [seatMap, setSeatMap] = useState<Student[]>(students);

  // Vòng quay may mắn
  const [winner, setWinner] = useState<Student | null>(null);
  const [excludeCalled, setExcludeCalled] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);

  // Quick edit modal for class info
  const [isEditClassModalOpen, setIsEditClassModalOpen] = useState(false);
  const [editClassName, setEditClassName] = useState(className);
  const [editSchoolName, setEditSchoolName] = useState(schoolName);
  const [editTeacherName, setEditTeacherName] = useState(teacherName);

  // Form thêm học sinh mới
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentAvatar, setNewStudentAvatar] = useState('🐰');
  const [newStudentGroup, setNewStudentGroup] = useState(1);
  const [newStudentPhone, setNewStudentPhone] = useState('');

  // Modal sửa học sinh
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Tìm kiếm và lọc học sinh
  const [searchStudent, setSearchStudent] = useState('');
  const [filterGroup, setFilterGroup] = useState<number | 'all'>('all');

  // --- POINT MODAL STATE ---
  const [pointModal, setPointModal] = useState<{ isOpen: boolean; studentId: number | null }>({
    isOpen: false,
    studentId: null,
  });

  // Modal Giấy Khen Học Sinh Hạnh Phúc
  const [certificateStudent, setCertificateStudent] = useState<Student | null>(null);
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);

  const openCertificate = (student: Student) => {
    setCertificateStudent(student);
    setIsCertificateOpen(true);
  };

  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // --- CORE FUNCTIONS ---
  const handleUpdatePoint = (studentId: number, pointsToAdd: number, reason: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, points: Math.max(0, s.points + pointsToAdd) } : s))
    );
    setPointModal({ isOpen: false, studentId: null });
    showNotification(`Đã ${pointsToAdd >= 0 ? 'cộng' : 'trừ'} ${Math.abs(pointsToAdd)} sao cho học sinh (${reason})`);
  };

  // Thêm học sinh thủ công
  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) {
      alert('Vui lòng nhập họ và tên học sinh!');
      return;
    }

    const newStudent: Student = {
      id: Date.now() + Math.floor(Math.random() * 10000) + 1,
      name: newStudentName.trim(),
      avatar: newStudentAvatar,
      group: newStudentGroup,
      phone: newStudentPhone.trim(),
      points: 0,
      called: false,
    };

    setStudents((prev) => [...prev, newStudent]);
    setNewStudentName('');
    setNewStudentPhone('');
    showNotification(`Đã thêm học sinh "${newStudent.name}" vào Tổ ${newStudent.group}! Bấm "Lưu & Đồng bộ" để lưu vĩnh viễn.`);
  };

  // Lưu sửa học sinh
  const handleSaveEditStudent = () => {
    if (!editingStudent) return;
    setStudents((prev) =>
      prev.map((s) => (s.id === editingStudent.id ? editingStudent : s))
    );
    setEditingStudent(null);
    showNotification('Đã cập nhật thông tin học sinh!');
  };

  // Xóa học sinh
  const handleDeleteStudent = (id: number, name: string) => {
    if (window.confirm(`Thầy/cô có chắc chắn muốn xóa học sinh "${name}" khỏi lớp?`)) {
      setStudents((prev) => prev.filter((s) => s.id !== id));
      showNotification(`Đã xóa học sinh "${name}" khỏi danh sách lớp.`);
    }
  };

  // Export data as JSON file
  const handleExportBackup = () => {
    const backupData = {
      className,
      schoolName,
      teacherName,
      students,
      attendance,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Danh_Sach_Lop_${className}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Đã xuất file sao lưu dữ liệu lớp học thành công!');
  };

  // Open Quick Edit
  const openQuickEdit = () => {
    setEditClassName(className);
    setEditSchoolName(schoolName);
    setEditTeacherName(teacherName);
    setIsEditClassModalOpen(true);
  };

  const saveQuickEdit = () => {
    setClassName(editClassName);
    setSchoolName(editSchoolName);
    setTeacherName(editTeacherName);
    setIsEditClassModalOpen(false);
    showNotification('Đã cập nhật thông tin lớp, trường và GVCN!');
    onSyncAll();
  };

  const animalAvatars = ['🐰', '🦊', '🐯', '🐼', '🐶', '🐱', '🦁', '🐻', '🐹', '🐨', '🐸', '🦄'];

  // Helper phân tích dữ liệu mảng 2 chiều từ file Excel hoặc từ văn bản copy-paste
  const parseRawRows = (data: any[][]) => {
    setExcelError(null);
    if (!data || data.length === 0) {
      setParsedExcelStudents([]);
      return [];
    }

    // Lọc bỏ các dòng hoàn toàn trống
    const nonBlankRows = data.filter((row) =>
      row && Array.isArray(row) && row.some((cell) => cell !== null && cell !== undefined && String(cell).trim() !== '')
    );

    if (nonBlankRows.length === 0) {
      setParsedExcelStudents([]);
      return [];
    }

    // Kiểm tra tối đa 3 dòng đầu để phát hiện dòng tiêu đề cột (Header)
    let headerRowIdx = -1;
    let nameCol = -1;
    let surnameCol = -1;
    let firstNameCol = -1;
    let groupCol = -1;
    let phoneCol = -1;

    for (let r = 0; r < Math.min(3, nonBlankRows.length); r++) {
      const row = nonBlankRows[r].map((c) => String(c || '').toLowerCase().trim());
      const hasKeywords = row.some((c) =>
        ['stt', 'họ và tên', 'họ tên', 'tên', 'họ', 'tổ', 'sđt', 'điện thoại', 'phone', 'học sinh'].some((kw) =>
          c.includes(kw)
        )
      );

      if (hasKeywords) {
        headerRowIdx = r;
        row.forEach((colStr, colIdx) => {
          if (colStr.includes('họ và tên') || colStr.includes('họ tên') || (colStr.includes('học sinh') && !colStr.includes('danh sách'))) {
            nameCol = colIdx;
          } else if (colStr.includes('họ và chữ lót') || colStr.includes('họ đệm') || colStr === 'họ') {
            surnameCol = colIdx;
          } else if (colStr === 'tên' || colStr.includes('tên hs')) {
            firstNameCol = colIdx;
          } else if (colStr.includes('tổ') || colStr.includes('nhóm') || colStr.includes('group')) {
            groupCol = colIdx;
          } else if (colStr.includes('điện thoại') || colStr.includes('sđt') || colStr.includes('phone') || colStr.includes('liên lạc')) {
            phoneCol = colIdx;
          }
        });
        break;
      }
    }

    const dataRows = headerRowIdx >= 0 ? nonBlankRows.slice(headerRowIdx + 1) : nonBlankRows;
    const recognized: Student[] = [];

    dataRows.forEach((row, idx) => {
      let fullName = '';
      let group = (idx % 4) + 1;
      let phone = '';

      if (headerRowIdx >= 0 && (nameCol >= 0 || (surnameCol >= 0 && firstNameCol >= 0))) {
        // Ánh xạ theo tiêu đề cột tìm thấy
        if (surnameCol >= 0 && firstNameCol >= 0) {
          const surname = String(row[surnameCol] || '').trim();
          const firstName = String(row[firstNameCol] || '').trim();
          fullName = `${surname} ${firstName}`.trim();
        } else if (nameCol >= 0) {
          fullName = String(row[nameCol] || '').trim();
        }

        if (groupCol >= 0 && row[groupCol] !== undefined) {
          const gVal = String(row[groupCol]).replace(/[^0-9]/g, '');
          const gNum = parseInt(gVal, 10);
          if (gNum >= 1 && gNum <= 10) group = gNum > 4 ? ((gNum - 1) % 4) + 1 : gNum;
        }

        if (phoneCol >= 0 && row[phoneCol] !== undefined) {
          phone = String(row[phoneCol] || '').trim();
        }
      } else {
        // Tự động nhận diện định dạng tự do hoặc dán từ Excel
        const cleanCells = row.map((c) => String(c || '').trim()).filter((c) => c !== '');
        if (cleanCells.length === 0) return;

        let workingCells = [...cleanCells];
        // Nếu ô đầu tiên là số thứ tự (ví dụ: "1", "01", "1.")
        if (/^\d+[\.\-\/]?$/.test(workingCells[0]) && workingCells.length > 1) {
          workingCells.shift();
        }

        if (workingCells.length === 1) {
          fullName = workingCells[0];
        } else if (workingCells.length >= 2) {
          // Nhận diện số điện thoại (ví dụ: 09..., 08..., 03..., 05..., 07...)
          const phoneIdx = workingCells.findIndex((c) => /^0[35789]\d{8}$/.test(c.replace(/[\s\.\-]/g, '')));
          if (phoneIdx >= 0) {
            phone = workingCells[phoneIdx].replace(/[\s\.\-]/g, '');
            workingCells.splice(phoneIdx, 1);
          }

          // Nhận diện tổ (ví dụ: "Tổ 1", "Tổ 2" hoặc số 1-4)
          const gIdx = workingCells.findIndex((c) => /^(tổ\s*)?[1-4]$/i.test(c));
          if (gIdx >= 0) {
            const gNum = parseInt(workingCells[gIdx].replace(/[^0-9]/g, ''), 10);
            if (gNum >= 1 && gNum <= 4) group = gNum;
            workingCells.splice(gIdx, 1);
          }

          fullName = workingCells.join(' ');
        }
      }

      // Xóa số thứ tự đầu chuỗi nếu còn sót lại (ví dụ "1. Nguyễn Văn A")
      fullName = fullName.replace(/^(\d+[\.\-\/\s]+)/, '').trim();

      if (fullName && fullName.length > 1 && !/^(stt|tên|họ|stt\.)/i.test(fullName)) {
        recognized.push({
          id: Date.now() + (idx + 1) * 10000 + Math.floor(Math.random() * 9000) + 1,
          name: fullName,
          avatar: animalAvatars[idx % animalAvatars.length],
          group: group || (idx % 4) + 1,
          phone: phone,
          points: 0,
          called: false,
        });
      }
    });

    setParsedExcelStudents(recognized);
    return recognized;
  };

  // Xử lý khi gõ hoặc dán vào ô văn bản
  const handleTextareaChange = (text: string) => {
    setExcelData(text);
    if (!text.trim()) {
      setParsedExcelStudents([]);
      return;
    }
    const lines = text.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
    const rows = lines.map((line) => {
      if (line.includes('\t')) return line.split('\t');
      if (line.includes(',')) return line.split(',');
      if (line.includes(';')) return line.split(';');
      if (line.includes(' - ')) return line.split(' - ');
      return [line];
    });
    parseRawRows(rows);
  };

  // Xử lý khi tải file Excel (.xlsx, .xls, .csv)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
        const parsed = parseRawRows(data);
        if (parsed.length === 0) {
          setExcelError('Không tìm thấy danh sách học sinh hợp lệ trong file Excel. Vui lòng kiểm tra lại cột Họ và tên.');
        } else {
          setExcelError(null);
        }
      } catch (err: any) {
        console.error('Lỗi đọc file Excel:', err);
        setExcelError('Không thể đọc file. Vui lòng đảm bảo file có định dạng .xlsx, .xls hoặc .csv.');
      }
    };
    reader.readAsBinaryString(file);
  };

  // Tải file mẫu Excel chuẩn để giáo viên dễ điền
  const handleDownloadSampleExcel = () => {
    const sampleData = [
      ['STT', 'Họ và tên', 'Tổ', 'Số điện thoại'],
      [1, 'Nguyễn Phương Anh', 1, '0901234567'],
      [2, 'Cao Minh Tuấn', 1, '0912345678'],
      [3, 'Lê Hoàng Yến', 2, '0987654321'],
      [4, 'Trần Quốc Đạt', 2, '0978123456'],
      [5, 'Phạm Quỳnh Nga', 3, '0934567890'],
      [6, 'Võ Gia Huy', 4, '0945678901'],
      [7, 'Đỗ Bảo Châu', 4, '0967890123'],
    ];
    const ws = XLSX.utils.aoa_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Danh Sách Lớp');
    XLSX.writeFile(wb, `Mau_Danh_Sach_Hoc_Sinh_Lop_${className}.xlsx`);
    showNotification('Đã tải file mẫu Excel (.xlsx) về máy!');
  };

  // Xóa 1 bạn khỏi bảng xem trước Excel trước khi đồng bộ
  const handleRemoveParsedStudent = (id: number) => {
    setParsedExcelStudents((prev) => prev.filter((s) => s.id !== id));
  };

  // Đồng bộ và thêm toàn bộ học sinh từ Excel vào lớp học
  const handleApplyExcelImport = async () => {
    if (parsedExcelStudents.length === 0) {
      alert('Chưa có học sinh nào được nhận diện từ dữ liệu Excel. Vui lòng kiểm tra lại file hoặc nội dung dán!');
      return;
    }

    const count = parsedExcelStudents.length;
    const existingIds = new Set(students.map((s) => s.id));
    const sanitizedIncoming = parsedExcelStudents.map((s, i) => {
      let finalId = s.id;
      if (!finalId || existingIds.has(finalId)) {
        finalId = Date.now() + (i + 1) * 10000 + Math.floor(Math.random() * 90000) + 1;
      }
      existingIds.add(finalId);
      return { ...s, id: finalId };
    });

    const updatedList = excelImportMode === 'append'
      ? [...students, ...sanitizedIncoming]
      : sanitizedIncoming;

    setStudents(updatedList);
    setSeatMap(updatedList);
    setIsExcelModalOpen(false);
    setParsedExcelStudents([]);
    setExcelData('');

    showNotification(`Đã đồng bộ thành công ${count} học sinh từ Excel vào lớp ${className}! Đang lưu toàn hệ thống...`);

    // Tự động kích hoạt lưu dữ liệu lên máy chủ & đồng bộ sang bên Sáng Tác & Tủ Sách
    try {
      await onSyncAll();
    } catch (err) {
      console.error('Lỗi tự động đồng bộ sau khi nhập Excel:', err);
    }
  };

  // Spin Lucky Wheel
  const handleSpin = () => {
    if (students.length === 0) return;

    setIsSpinning(true);
    setWinner(null);

    setTimeout(() => {
      let availableStudents = students;
      if (excludeCalled) {
        availableStudents = students.filter((s) => !s.called);
        if (availableStudents.length === 0) {
          alert('Đã gọi hết tất cả học sinh trong lớp! Danh sách gọi sẽ được làm mới lại từ đầu.');
          setStudents((prev) => prev.map((s) => ({ ...s, called: false })));
          availableStudents = students;
        }
      }

      const randomIdx = Math.floor(Math.random() * availableStudents.length);
      const selected = availableStudents[randomIdx];

      setWinner(selected);
      setStudents((prev) => prev.map((s) => (s.id === selected.id ? { ...s, called: true } : s)));
      setIsSpinning(false);
    }, 1200);
  };

  // Attendance handlers
  const handleAttendanceStatusChange = (id: number, status: string) => {
    setAttendance((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || { reason: '' }), status },
    }));
  };

  const handleAttendanceReasonChange = (id: number, reason: string) => {
    setAttendance((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || { status: 'Có mặt' }), reason },
    }));
  };


  // Lọc học sinh
  const filteredStudents = students.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchStudent.toLowerCase()) || (s.phone && s.phone.includes(searchStudent));
    const matchesGroup = filterGroup === 'all' || s.group === filterGroup;
    return matchesSearch && matchesGroup;
  });

  // --- RENDER FUNCTIONS ---

  // 1. TAB DANH SÁCH HỌC SINH CHI TIẾT (MỤC TRỌNG TÂM NGƯỜI DÙNG YÊU CẦU)
  const renderStudentRosterTab = () => {
    return (
      <div className="p-4 space-y-6">
        {/* THANH TIÊU ĐỀ & NÚT ĐỒNG BỘ */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-emerald-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-2xl text-xl">👥</span>
              <h2 className="text-xl sm:text-2xl font-black text-emerald-950">
                Danh Sách Học Sinh Lớp {className}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Trường: <strong>{schoolName}</strong> · GVCN: <strong>{teacherName}</strong> · Tổng số: <strong className="text-emerald-700">{students.length} học sinh</strong>
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => {
                setIsExcelModalOpen(true);
                setExcelError(null);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black px-4 py-2.5 rounded-2xl text-xs sm:text-sm shadow-md flex items-center gap-2 transition"
              title="Nhập danh sách học sinh từ file Excel (.xlsx, .csv) hoặc dán bảng"
            >
              <FileSpreadsheet size={16} />
              <span>Nhập Học Sinh Từ Excel</span>
            </button>

            <button
              onClick={onSyncAll}
              disabled={isSyncing}
              className="bg-yellow-400 hover:bg-yellow-300 text-emerald-950 font-black px-4 py-2.5 rounded-2xl text-xs sm:text-sm shadow-md flex items-center gap-2 transition active:scale-95 disabled:opacity-50"
            >
              <Save size={16} className={isSyncing ? 'animate-spin' : ''} />
              <span>{isSyncing ? 'Đang lưu...' : 'Lưu Danh Sách & Đồng Bộ'}</span>
            </button>

            <button
              onClick={handleExportBackup}
              className="bg-white hover:bg-gray-50 text-gray-700 font-bold px-3.5 py-2.5 rounded-2xl border border-gray-200 text-xs shadow-sm flex items-center gap-1.5 transition active:scale-95"
            >
              <Download size={15} /> Xuất JSON
            </button>
          </div>
        </div>

        {/* BANNER NHẬP EXCEL & ĐỒNG BỘ NHANH */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-green-700 rounded-3xl p-5 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl backdrop-blur-xs shrink-0 shadow-inner">
              📊
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base flex items-center gap-2">
                <span>Đồng Bộ Học Sinh Từ File Excel Vào Lớp Học</span>
                <span className="bg-yellow-400 text-emerald-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  Tự động nhận diện
                </span>
              </h3>
              <p className="text-xs text-emerald-100 font-medium mt-0.5">
                Tải lên file <strong>.xlsx, .xls, .csv</strong> hoặc Copy-Paste bảng từ Excel. Tự động nhận diện Họ tên, Tổ, Số điện thoại và đồng bộ ngay sang Sáng Tác Truyện & Tủ Sách!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto">
            <button
              onClick={handleDownloadSampleExcel}
              className="flex-1 md:flex-none px-3.5 py-2.5 bg-white/15 hover:bg-white/25 border border-white/30 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Download size={14} /> Tải Mẫu Excel (.xlsx)
            </button>
            <button
              onClick={() => {
                setIsExcelModalOpen(true);
                setExcelError(null);
              }}
              className="flex-1 md:flex-none px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-emerald-950 font-black rounded-2xl text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2"
            >
              <Upload size={16} /> Mở Trình Nhập Excel
            </button>
          </div>
        </div>

        {/* THỐNG KÊ NHANH CÁC TỔ */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-emerald-100 text-center shadow-sm">
            <span className="text-xs font-bold text-gray-500 uppercase block">Tổng Sĩ Số</span>
            <span className="text-2xl font-black text-emerald-700">{students.length}</span>
          </div>
          {[1, 2, 3, 4].map((g) => {
            const count = students.filter((s) => s.group === g).length;
            const pts = students.filter((s) => s.group === g).reduce((sum, s) => sum + s.points, 0);
            return (
              <div key={g} className="bg-white p-4 rounded-2xl border border-emerald-100 text-center shadow-sm">
                <span className="text-xs font-bold text-gray-500 uppercase block">Tổ {g}</span>
                <div className="text-lg font-black text-gray-800">{count} bạn</div>
                <span className="text-[11px] font-bold text-amber-600">{pts} ⭐️</span>
              </div>
            );
          })}
        </div>

        {/* FORM THÊM HỌC SINH MỚI TRỰC TIẾP */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border-2 border-emerald-200 shadow-sm">
          <h3 className="text-sm sm:text-base font-black text-emerald-900 mb-3 flex items-center gap-2">
            <UserPlus size={18} className="text-emerald-600" /> Thêm Học Sinh Mới Vào Lớp
          </h3>
          <form onSubmit={handleAddStudent} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-gray-700 mb-1">Họ và tên học sinh *</label>
              <input
                type="text"
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                placeholder="Ví dụ: Hoàng Bảo Nam"
                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white text-xs sm:text-sm font-semibold outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">Linh vật đại diện</label>
              <select
                value={newStudentAvatar}
                onChange={(e) => setNewStudentAvatar(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-lg outline-none font-bold"
              >
                {animalAvatars.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">Tổ sinh hoạt</label>
              <select
                value={newStudentGroup}
                onChange={(e) => setNewStudentGroup(Number(e.target.value))}
                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm font-bold outline-none"
              >
                <option value={1}>Tổ 1</option>
                <option value={2}>Tổ 2</option>
                <option value={3}>Tổ 3</option>
                <option value={4}>Tổ 4</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">Số điện thoại PH</label>
              <input
                type="text"
                value={newStudentPhone}
                onChange={(e) => setNewStudentPhone(e.target.value)}
                placeholder="0912..."
                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 px-3 rounded-xl text-xs sm:text-sm shadow-md flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <UserPlus size={16} /> Thêm Vào Lớp
              </button>
            </div>
          </form>
        </div>

        {/* TÌM KIẾM & BẢNG DANH SÁCH */}
        <div className="bg-white rounded-3xl shadow-sm border border-emerald-100 overflow-hidden">
          {/* THANH TÌM KIẾM VÀ LỌC TỔ */}
          <div className="p-4 bg-emerald-50/50 border-b border-emerald-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search size={16} className="absolute left-3.5 top-3 text-emerald-600" />
              <input
                type="text"
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                placeholder="Tìm theo tên học sinh, số điện thoại..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs font-bold text-gray-500 mr-1">Lọc:</span>
              <button
                onClick={() => setFilterGroup('all')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                  filterGroup === 'all' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-gray-700 border border-gray-200'
                }`}
              >
                Tất cả ({students.length})
              </button>
              {[1, 2, 3, 4].map((g) => (
                <button
                  key={g}
                  onClick={() => setFilterGroup(g)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                    filterGroup === g ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-gray-700 border border-gray-200'
                  }`}
                >
                  Tổ {g}
                </button>
              ))}
            </div>
          </div>

          {/* BẢNG HỌC SINH */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead className="bg-emerald-50 text-emerald-950 border-b border-emerald-200 font-bold">
                <tr>
                  <th className="p-3.5 text-center">STT</th>
                  <th className="p-3.5">Học sinh</th>
                  <th className="p-3.5">Tổ</th>
                  <th className="p-3.5">Điểm sao</th>
                  <th className="p-3.5">Số điện thoại PH</th>
                  <th className="p-3.5 text-center">Đồng bộ sang Sáng Tác & Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s, idx) => (
                  <tr key={`hub-roster-${s.id}-${idx}`} className="border-b border-gray-100 hover:bg-emerald-50/50 transition">
                    <td className="p-3.5 text-center font-bold text-gray-400">{idx + 1}</td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl p-1 bg-amber-50 rounded-xl border border-amber-200">{s.avatar}</span>
                        <span className="font-bold text-gray-900 text-sm">{s.name}</span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-lg text-xs">
                        Tổ {s.group}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 text-xs">
                        {s.points} ⭐️
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-gray-600 font-medium">
                      {s.phone || 'Chưa cập nhật'}
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {/* NÚT ĐỒNG BỘ QUA SÁNG TÁC TRUYỆN CHO BẠN NÀY (YÊU CẦU CHÍNH) */}
                        <button
                          onClick={() => {
                            if (onOpenStoryCreatorWithStudent) {
                              onOpenStoryCreatorWithStudent(s);
                            } else {
                              alert(`Đã chọn học sinh ${s.name} để sáng tác truyện!`);
                            }
                          }}
                          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-2.5 py-1.5 rounded-xl font-bold text-xs shadow-sm flex items-center gap-1 active:scale-95 transition"
                          title="Sáng tác câu chuyện riêng cho học sinh này làm nhân vật chính"
                        >
                          <Sparkles size={13} />
                          <span>Sáng tác truyện</span>
                        </button>

                        {/* NÚT CHẤM ĐIỂM */}
                        <button
                          onClick={() => setPointModal({ isOpen: true, studentId: s.id })}
                          className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-2.5 py-1.5 rounded-xl font-bold text-xs transition"
                          title="Chấm điểm thi đua"
                        >
                          +⭐
                        </button>

                        {/* NÚT IN GIẤY KHEN HỌC SINH HẠNH PHÚC */}
                        <button
                          onClick={() => openCertificate(s)}
                          className="bg-amber-100 hover:bg-amber-200 text-amber-900 px-2.5 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1 active:scale-95"
                          title="Tạo và in Giấy Khen Học Sinh Hạnh Phúc"
                        >
                          <Award size={13} className="text-amber-700" />
                          <span className="hidden xl:inline">Giấy Khen</span>
                        </button>

                        {/* NÚT SỬA */}
                        <button
                          onClick={() => setEditingStudent(s)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Sửa thông tin học sinh"
                        >
                          <Edit3 size={15} />
                        </button>

                        {/* NÚT XÓA */}
                        <button
                          onClick={() => handleDeleteStudent(s.id, s.name)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                          title="Xóa học sinh"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredStudents.length === 0 && (
            <div className="p-8 text-center text-gray-500 italic">
              Không tìm thấy học sinh nào phù hợp. Thầy/cô có thể thêm học sinh mới ở ô phía trên!
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderDashboardTab = () => {
    const sortedStudents = [...students].sort((a, b) => b.points - a.points).slice(0, 5);
    const totalPoints = students.reduce((sum, s) => sum + s.points, 0);
    const absentCount = Object.values(attendance).filter((v) => v && v.status !== 'Có mặt').length;
    const presentCount = students.length - absentCount;

    return (
      <div className="p-4 space-y-6">
        {/* BANNER CHÀO MỪNG */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-gradient-to-r from-emerald-600 via-teal-700 to-green-700 text-white p-6 sm:p-8 rounded-3xl shadow-lg">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-xs font-bold mb-2">
              <span className="w-2 h-2 rounded-full bg-yellow-300 animate-pulse"></span>
              <span>LỚP HỌC HẠNH PHÚC _ PHẠM HẬU</span>
            </div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl sm:text-3xl font-black">Lớp {className} · {schoolName}</h2>
              <button
                onClick={openQuickEdit}
                className="bg-white/20 hover:bg-white/30 text-white p-1.5 rounded-xl transition flex items-center gap-1 text-xs font-bold"
                title="Sửa nhanh tên lớp, trường, GVCN"
              >
                <Edit3 size={15} /> <span>Sửa</span>
              </button>
            </div>
            <p className="text-emerald-100 text-xs sm:text-sm mt-1">
              Giáo viên chủ nhiệm: <strong>{teacherName}</strong> · Tổng sĩ số: <strong>{students.length}</strong> học sinh
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onSyncAll}
              disabled={isSyncing}
              className="bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-emerald-950 font-black px-5 py-3 rounded-2xl shadow-md flex items-center gap-2 transition disabled:opacity-50 text-xs sm:text-sm"
            >
              <Save size={18} className={isSyncing ? 'animate-spin' : ''} />
              <span>{isSyncing ? 'Đang đồng bộ...' : 'Lưu dữ liệu & Đồng bộ tất cả'}</span>
            </button>

            <button
              onClick={onOpenStoryShelf}
              className="bg-white/20 hover:bg-white/30 text-white font-bold px-4 py-3 rounded-2xl shadow-sm flex items-center gap-2 transition text-xs sm:text-sm active:scale-95"
            >
              <BookOpen size={16} /> Mở Tủ Sách Truyện
            </button>
          </div>
        </div>

        {/* CÂY HẠNH PHÚC CỦA LỚP HỌC (THEO BỘ SKILL EDUCATION) */}
        <HappyTreeWidget
          totalPoints={totalPoints}
          className={className}
          teacherName={teacherName}
        />

        {/* THỐNG KÊ NHANH */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-black uppercase tracking-wider">SĨ SỐ HÔM NAY</p>
              <h3 className="text-3xl font-black text-emerald-700 mt-1">{presentCount}/{students.length}</h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">Học sinh có mặt</p>
            </div>
            <Users className="w-12 h-12 text-emerald-200" />
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-black uppercase tracking-wider">TỔNG SAO THI ĐUA</p>
              <h3 className="text-3xl font-black text-amber-500 mt-1">{totalPoints} ⭐️</h3>
              <p className="text-[11px] text-amber-600 font-semibold mt-1">Toàn lớp tích lũy</p>
            </div>
            <Trophy className="w-12 h-12 text-amber-200" />
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-black uppercase tracking-wider">VẮNG HÔM NAY</p>
              <h3 className="text-3xl font-black text-rose-500 mt-1">{absentCount}</h3>
              <p className="text-[11px] text-rose-600 font-semibold mt-1">Cần liên hệ gia đình</p>
            </div>
            <BarChart3 className="w-12 h-12 text-rose-200" />
          </div>
        </div>

        {/* TOP HỌC SINH CHĂM NGOAN */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-emerald-900 flex items-center">
              <Trophy className="mr-2 text-yellow-500" /> Top 5 Học Sinh Chăm Ngoan & Đọc Hay Nhất
            </h2>
            <button
              onClick={() => setActiveTab('danh-sach')}
              className="text-xs font-bold text-emerald-700 hover:underline"
            >
              Xem toàn bộ danh sách →
            </button>
          </div>

          <div className="space-y-3">
            {sortedStudents.map((s, idx) => (
              <div
                key={`hub-leaderboard-${s.id}-${idx}`}
                className="flex items-center justify-between p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`font-black text-lg ${
                      idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-orange-400' : 'text-gray-600'
                    }`}
                  >
                    #{idx + 1}
                  </span>
                  <span className="text-2xl">{s.avatar}</span>
                  <div>
                    <span className="font-bold text-gray-800">{s.name}</span>
                    <span className="ml-2 text-xs text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200 font-semibold">
                      Tổ {s.group}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenStoryCreatorWithStudent && onOpenStoryCreatorWithStudent(s)}
                    className="bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold px-3 py-1 rounded-lg text-xs flex items-center gap-1 transition"
                  >
                    <Sparkles size={12} /> Sáng tác truyện
                  </button>
                  <span className="font-bold text-emerald-700 bg-white px-3 py-1 rounded-full border border-emerald-200 shadow-sm text-sm">
                    {s.points} ⭐️
                  </span>
                </div>
              </div>
            ))}
            {sortedStudents.length === 0 && (
              <p className="text-gray-500 italic text-center py-4">Chưa có dữ liệu học sinh trong lớp</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderAttendanceTab = () => {
    return (
      <div className="p-4 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-emerald-100">
          <div>
            <h2 className="text-2xl font-bold text-emerald-900 flex items-center">
              <CheckSquare className="mr-2 text-emerald-600" /> Điểm Danh Lớp {className}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Ngày ghi nhận: {new Date().toLocaleDateString('vi-VN')} · Sĩ số lớp: <strong>{students.length}</strong>
            </p>
          </div>
          <button
            onClick={onSyncAll}
            disabled={isSyncing}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-sm transition"
          >
            <Save size={16} /> Lưu & Đồng bộ điểm danh
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead className="bg-emerald-50 text-emerald-900 border-b border-emerald-100">
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
                    <tr key={`hub-att-${s.id}-${index}`} className="border-b border-gray-100 hover:bg-emerald-50/40 transition-colors">
                      <td className="p-4 font-medium text-gray-500">{index + 1}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{s.avatar}</span>
                          <div>
                            <span className="font-bold text-gray-800">{s.name}</span>
                            <span className="text-xs text-gray-400 block">Tổ {s.group}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {['Có mặt', 'Vắng phép', 'Vắng KP', 'Đi trễ'].map((st) => {
                            const isSelected = currentStatus === st;
                            return (
                              <button
                                key={st}
                                onClick={() => handleAttendanceStatusChange(s.id, st)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                  isSelected
                                    ? st === 'Có mặt'
                                      ? 'bg-emerald-600 text-white shadow-sm'
                                      : st.includes('Vắng')
                                      ? 'bg-rose-500 text-white shadow-sm'
                                      : 'bg-amber-500 text-white shadow-sm'
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
                        {currentStatus !== 'Có mặt' ? (
                          <input
                            type="text"
                            placeholder="Nhập lý do nghỉ hoặc đi trễ..."
                            value={currentReason}
                            onChange={(e) => handleAttendanceReasonChange(s.id, e.target.value)}
                            className="w-full p-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                        ) : (
                          <span className="text-xs text-gray-400 italic">Đúng giờ</span>
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

  const renderRewardsTab = () => {
    const rewardsList = [
      { id: 1, name: 'Cây bút bi điểm 10', cost: 5, icon: '🖊️' },
      { id: 2, name: 'Quyển truyện tranh thiếu nhi', cost: 10, icon: '📚' },
      { id: 3, name: 'Miễn 1 lần kiểm tra bài cũ', cost: 15, icon: '🛡️' },
      { id: 4, name: 'Được đổi chỗ ngồi 1 tuần', cost: 25, icon: '🪑' },
      { id: 5, name: 'Cộng 1 điểm miệng kiểm tra', cost: 30, icon: '💯' },
      { id: 6, name: 'Ly trà sữa ngọt ngào thơm ngon', cost: 50, icon: '🧋' },
    ];

    const handleRedeem = (reward: any) => {
      alert(`Phần thưởng "${reward.name}" (giá: ${reward.cost} sao) đã sẵn sàng! Thầy/cô vui lòng chọn học sinh đổi quà.`);
    };

    return (
      <div className="p-4 space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-emerald-900 flex items-center">
              <Gift className="mr-2 text-amber-500" /> Cửa Hàng Đổi Quà Thi Đua & Đọc Truyện
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Dùng điểm sao tích lũy sau mỗi lần đọc bài hay để đổi quà khích lệ</p>
          </div>
          <button
            onClick={onSyncAll}
            className="bg-yellow-400 hover:bg-yellow-300 text-emerald-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-sm transition"
          >
            <Save size={15} /> Lưu dữ liệu sao
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {rewardsList.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-2xl p-5 border border-amber-100 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center"
            >
              <div className="text-5xl mb-3">{r.icon}</div>
              <h3 className="font-bold text-gray-800 text-xs sm:text-sm mb-2 h-10 flex items-center justify-center">
                {r.name}
              </h3>
              <div className="bg-amber-50 text-amber-800 font-black px-3.5 py-1 rounded-full text-xs mb-4 border border-amber-200">
                {r.cost} ⭐️
              </div>
              <button
                onClick={() => handleRedeem(r)}
                className="w-full bg-emerald-600 text-white py-2 rounded-xl font-bold text-xs shadow-sm hover:bg-emerald-700 transition-colors mt-auto"
              >
                Đổi quà
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderContactsTab = () => {
    return (
      <div className="p-4 space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-emerald-900 flex items-center">
              <Phone className="mr-2 text-blue-500" /> Sổ Liên Lạc Phụ Huynh Học Sinh
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Danh bạ kết nối nhanh giữa giáo viên và gia đình</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead className="bg-emerald-50 text-emerald-900 border-b border-emerald-100">
                <tr>
                  <th className="p-4 font-bold">Học sinh</th>
                  <th className="p-4 font-bold">Tổ</th>
                  <th className="p-4 font-bold">Số điện thoại phụ huynh</th>
                  <th className="p-4 font-bold">Điểm sao hiện tại</th>
                  <th className="p-4 font-bold text-center">Thao tác liên hệ</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, idx) => (
                  <tr key={`hub-contact-${s.id}-${idx}`} className="border-b border-gray-100 hover:bg-emerald-50/40 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{s.avatar}</span>
                        <span className="font-bold text-gray-800">{s.name}</span>
                      </div>
                    </td>
                    <td className="p-4 font-medium text-gray-600">Tổ {s.group}</td>
                    <td className="p-4 font-mono font-medium text-gray-700">{s.phone || 'Chưa cập nhật'}</td>
                    <td className="p-4 font-bold text-emerald-600">{s.points} ⭐️</td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <a
                          href={`tel:${s.phone}`}
                          className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 hover:bg-blue-100 transition-colors"
                        >
                          <PhoneCall size={13} /> Gọi điện
                        </a>
                        <button
                          onClick={() => alert(`Mở liên hệ Zalo phụ huynh của học sinh ${s.name} (${s.phone})`)}
                          className="bg-sky-50 text-sky-600 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 hover:bg-sky-100 transition-colors"
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

  const renderRandomCallTab = () => {
    return (
      <div className="flex flex-col items-center justify-center p-6 sm:p-10 h-full min-h-[70vh]">
        <h2 className="text-2xl sm:text-3xl font-black text-emerald-900 mb-2">🎯 Vòng Quay May Mắn</h2>
        <p className="text-gray-500 mb-8 text-xs sm:text-sm">Gọi tên ngẫu nhiên học sinh đọc truyện hoặc trả lời câu hỏi</p>

        <label className="flex items-center gap-3 mb-8 bg-white px-5 py-3 rounded-full shadow-sm border border-emerald-200 cursor-pointer hover:bg-emerald-50 transition-colors">
          <input
            type="checkbox"
            checked={excludeCalled}
            onChange={(e) => setExcludeCalled(e.target.checked)}
            className="w-5 h-5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
          />
          <span className="font-semibold text-gray-700 select-none text-xs sm:text-sm">
            Không gọi lại bạn đã được gọi trong tiết
          </span>
        </label>

        <div className="relative w-60 h-60 sm:w-64 sm:h-64 bg-white rounded-full shadow-2xl border-[12px] border-emerald-500 flex flex-col items-center justify-center mb-10 overflow-hidden">
          {isSpinning ? (
            <div className="text-xl sm:text-2xl font-bold animate-pulse text-emerald-600">Đang quay...</div>
          ) : winner ? (
            <div className="text-center animate-in zoom-in p-4 bg-emerald-50 w-full h-full flex flex-col justify-center items-center">
              <div className="text-5xl sm:text-6xl mb-2 filter drop-shadow-md">{winner.avatar}</div>
              <div className="font-bold text-lg sm:text-xl text-emerald-950 leading-tight px-2">{winner.name}</div>
              <div className="text-xs font-bold text-emerald-600 mt-1">Tổ {winner.group}</div>
            </div>
          ) : (
            <Target className="w-20 h-20 text-emerald-100" />
          )}
        </div>

        <button
          onClick={handleSpin}
          disabled={isSpinning}
          className="bg-emerald-600 text-white px-10 py-3.5 sm:px-12 sm:py-4 rounded-full text-xl sm:text-2xl font-black hover:bg-emerald-700 shadow-xl transform active:scale-95 transition-all disabled:opacity-50"
        >
          {isSpinning ? 'Đang quay...' : '🎲 QUAY NGAY!'}
        </button>
      </div>
    );
  };

  const renderSeatingTab = () => {
    const shuffleSeats = () => {
      const shuffled = [...seatMap].sort(() => 0.5 - Math.random());
      setSeatMap(shuffled);
      showNotification('Đã xáo trộn sơ đồ chỗ ngồi ngẫu nhiên!');
    };

    return (
      <div className="p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-emerald-900 flex items-center">
              <LayoutGrid className="mr-2 text-emerald-600" /> Sơ Đồ Chỗ Ngồi Lớp {className}
            </h2>
            <p className="text-xs text-gray-500 mt-1">Sắp xếp trực quan vị trí bàn học của từng học sinh</p>
          </div>
          <button
            onClick={shuffleSeats}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm hover:bg-blue-700 transition-colors text-xs sm:text-sm"
          >
            🔄 Xáo trộn chỗ ngồi ngẫu nhiên
          </button>
        </div>

        <div className="bg-emerald-50/50 p-4 md:p-8 rounded-3xl flex flex-col items-center border-2 border-emerald-100 min-h-[500px]">
          <div className="w-full max-w-sm bg-white text-center py-4 rounded-xl border-b-4 border-emerald-600 font-black text-emerald-900 mb-10 shadow-md flex items-center justify-center gap-2">
            <Users size={20} className="text-emerald-600" /> BÀN GIÁO VIÊN
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6 w-full max-w-5xl">
            {seatMap.map((s, idx) => (
              <div
                key={idx}
                className="bg-white border-b-4 border-emerald-200 rounded-2xl p-4 text-center shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-4xl mb-2">{s.avatar}</div>
                <div className="font-bold text-xs sm:text-sm text-gray-800 h-10 flex items-center justify-center leading-tight">
                  {s.name}
                </div>
                <div className="text-xs font-bold text-emerald-600 mt-2 bg-emerald-50 py-1 rounded-md">
                  Tổ {s.group}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderSettingsTab = () => {
    return (
      <div className="p-4 space-y-6">
        {/* KHỐI LƯU DỮ LIỆU VÀ ĐỒNG BỘ TRỌNG TÂM */}
        <div className="bg-gradient-to-r from-amber-50 to-emerald-50 p-6 md:p-8 rounded-3xl border-2 border-emerald-300 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="text-emerald-600" size={24} />
              <h3 className="text-xl font-black text-emerald-950">Lưu Dữ Liệu & Đồng Bộ Lớp Học</h3>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              {lastSynced ? (
                <>Lần đồng bộ gần nhất: <strong className="text-emerald-700">{new Date(lastSynced).toLocaleTimeString('vi-VN')} ({new Date(lastSynced).toLocaleDateString('vi-VN')})</strong></>
              ) : (
                'Chưa đồng bộ lên máy chủ trong phiên này'
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onSyncAll}
              disabled={isSyncing}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-3 rounded-2xl shadow-md flex items-center gap-2 text-xs sm:text-sm active:scale-95 transition disabled:opacity-50"
            >
              <Save size={18} className={isSyncing ? 'animate-spin' : ''} />
              <span>{isSyncing ? 'Đang lưu...' : 'Lưu Dữ Liệu Ngay'}</span>
            </button>

            <button
              onClick={handleExportBackup}
              className="bg-white hover:bg-gray-50 text-gray-800 font-bold px-4 py-3 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-2 text-xs sm:text-sm active:scale-95 transition"
            >
              <Download size={16} /> Xuất File JSON
            </button>
          </div>
        </div>

        {/* NƠI NHẬP TÊN LỚP, TRƯỜNG VÀ GVCN */}
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-emerald-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-emerald-900 flex items-center">
                <Settings className="mr-2 text-emerald-600" /> Cập Nhật Thông Tin Chung (Nhập Liền Mạch)
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Gõ liên tục không bị gián đoạn hay mất dấu.
              </p>
            </div>
            <button
              onClick={onSyncAll}
              className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition"
            >
              <Save size={14} /> Lưu ngay
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase">
                Tên lớp học
              </label>
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="Ví dụ: 12A6"
                className="w-full p-3.5 bg-gray-50 hover:bg-white border border-gray-300 focus:border-emerald-500 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-gray-900 text-sm transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase">
                Tên trường
              </label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="Ví dụ: THPT Hồng Ngự 3"
                className="w-full p-3.5 bg-gray-50 hover:bg-white border border-gray-300 focus:border-emerald-500 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-gray-900 text-sm transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase">
                Giáo viên chủ nhiệm (GVCN)
              </label>
              <input
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder="Ví dụ: Phạm Hậu"
                className="w-full p-3.5 bg-gray-50 hover:bg-white border border-gray-300 focus:border-emerald-500 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-gray-900 text-sm transition"
              />
            </div>
          </div>
        </div>

        {/* NHẬP EXCEL */}
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-emerald-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
            <h2 className="text-xl font-bold text-emerald-900 flex items-center">
              <Upload className="mr-2 text-emerald-600" /> Nhập Danh Sách Học Sinh Từ Excel
            </h2>
            <button
              type="button"
              onClick={handleDownloadSampleExcel}
              className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
            >
              <Download size={14} /> Tải Mẫu Excel (.xlsx)
            </button>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mb-4">
            Mở file Excel của lớp, bôi đen cột <strong>Họ và Tên</strong> và <strong>Số điện thoại</strong> (nếu có), bấm Copy (Ctrl+C) và Dán (Ctrl+V) vào ô bên dưới, hoặc bấm nút để mở trình nhập file và xem trước.
          </p>

          <textarea
            value={excelData}
            onChange={(e) => handleTextareaChange(e.target.value)}
            className="w-full h-36 p-4 bg-gray-50 border border-gray-300 focus:border-emerald-500 rounded-2xl mb-4 text-xs sm:text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none resize-none leading-relaxed placeholder-gray-400"
            placeholder="Nguyễn Phương Anh	0901234567&#10;Cao Minh Tuấn	0912345678"
          />

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (excelData.trim() && parsedExcelStudents.length === 0) {
                  handleTextareaChange(excelData);
                }
                setIsExcelModalOpen(true);
              }}
              className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-emerald-700 transition-colors flex items-center gap-2 text-xs sm:text-sm active:scale-95"
            >
              <Upload size={18} /> Mở Trình Xem Trước & Đồng Bộ Vào Lớp
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCertificateTab = () => {
    const sorted = [...students].sort((a, b) => b.points - a.points);
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-6 sm:p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-xs font-bold mb-2 shadow-inner">
              <Award size={15} className="text-yellow-300" />
              <span>Vinh Danh & Giấy Khen Học Sinh Hạnh Phúc</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Bảng Vàng Vinh Danh Lớp {className}
            </h2>
            <p className="text-amber-100 text-xs sm:text-sm mt-1">
              Bấm vào học sinh bất kỳ để xem trước và in Giấy Khen Danh Dự chuẩn khổ A4!
            </p>
          </div>
        </div>

        {/* DANH SÁCH HỌC SINH ĐỂ IN GIẤY KHEN */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((s, idx) => {
            const isTop3 = idx < 3;
            return (
              <div
                key={`cert-card-${s.id}`}
                className={`p-4 rounded-3xl border-2 transition-all flex items-center justify-between shadow-sm bg-white hover:border-amber-300 hover:shadow-md ${
                  isTop3 ? 'border-amber-300 bg-amber-50/30' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-xl shrink-0 font-black">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                  </div>
                  <div>
                    <div className="font-black text-gray-900 text-sm flex items-center gap-1">
                      <span>{s.avatar}</span>
                      <span className="truncate max-w-[130px]">{s.name}</span>
                    </div>
                    <div className="text-xs text-amber-600 font-bold">
                      {s.points} ⭐ thi đua · Tổ {s.group}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => openCertificate(s)}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black px-3 py-2 rounded-xl text-xs flex items-center gap-1 shadow-sm transition active:scale-95"
                >
                  <Award size={14} />
                  <span>In Giấy Khen</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const menuItems = [
    { id: 'danh-sach', icon: Users, label: 'Danh Sách Học Sinh' },
    { id: 'dau-truong', icon: Flame, label: 'Đấu Trường 4 Tổ' },
    { id: 'tong-quan', icon: BarChart3, label: 'Tổng Quan & Cây Hạnh Phúc' },
    { id: 'tro-ly-ai', icon: Bot, label: 'Trợ Lý Sư Phạm AI' },
    { id: 'giay-khen', icon: Award, label: 'Giấy Khen & Vinh Danh' },
    { id: 'diem-danh', icon: CheckSquare, label: 'Điểm danh' },
    { id: 'vong-quay', icon: Play, label: 'Gọi tên ngẫu nhiên' },
    { id: 'so-do', icon: LayoutGrid, label: 'Sơ đồ chỗ ngồi' },
    { id: 'doi-qua', icon: Gift, label: 'Đổi quà' },
    { id: 'so-lien-lac', icon: Phone, label: 'Sổ liên lạc' },
    { id: 'cai-dat', icon: Settings, label: 'Cài đặt & Đồng bộ' },
  ];

  return (
    <div className="min-h-screen bg-[#F0FDF4] flex flex-col md:flex-row font-sans text-gray-800">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-white border-r border-emerald-100 flex flex-col shrink-0 shadow-sm">
        <div className="p-6 border-b border-emerald-50">
          <div className="text-[10px] font-black text-emerald-600 tracking-widest uppercase mb-1">{schoolName}</div>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Lớp {className}</h1>
            <button
              onClick={openQuickEdit}
              className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
              title="Chỉnh sửa thông tin lớp"
            >
              <Edit3 size={16} />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1 font-medium flex items-center">
            <Users size={13} className="mr-1 text-emerald-600" /> GV: {teacherName}
          </p>

          <div className="mt-3 pt-3 border-t border-emerald-100 flex items-center gap-2 text-[11px] font-semibold text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{lastSynced ? `Đã đồng bộ (${students.length} HS)` : `Chưa đồng bộ (${students.length} HS)`}</span>
          </div>
        </div>

        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm translate-x-1'
                    : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-emerald-100 space-y-2">
          {/* NÚT LƯU TRỰC TIẾP TRÊN MENU */}
          <button
            onClick={onSyncAll}
            disabled={isSyncing}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-2xl font-black text-xs shadow-md flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
          >
            <Save size={16} /> Lưu & Đồng bộ
          </button>

          <button
            onClick={onOpenStoryShelf}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white p-2.5 rounded-2xl font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition active:scale-95"
          >
            <BookOpen size={15} /> Mở Tủ Sách Truyện
          </button>
        </div>
      </aside>

      {/* MAIN TAB CONTENT */}
      <main className="flex-1 h-screen overflow-y-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {notification && (
            <div className="mb-4 p-3.5 bg-emerald-600 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 size={18} />
              <span>{notification}</span>
            </div>
          )}

          {activeTab === 'danh-sach' && renderStudentRosterTab()}
          {activeTab === 'dau-truong' && (
            <ClassroomArena
              students={students}
              onAwardStudent={handleUpdatePoint}
              className={className}
            />
          )}
          {activeTab === 'tong-quan' && renderDashboardTab()}
          {activeTab === 'tro-ly-ai' && (
            <TeacherAiAssistant
              students={students}
              className={className}
              schoolName={schoolName}
              teacherName={teacherName}
            />
          )}
          {activeTab === 'giay-khen' && renderCertificateTab()}
          {activeTab === 'diem-danh' && renderAttendanceTab()}
          {activeTab === 'vong-quay' && renderRandomCallTab()}
          {activeTab === 'so-do' && renderSeatingTab()}
          {activeTab === 'doi-qua' && renderRewardsTab()}
          {activeTab === 'so-lien-lac' && renderContactsTab()}
          {activeTab === 'cai-dat' && renderSettingsTab()}
        </div>
      </main>

      {/* QUICK EDIT CLASS MODAL */}
      {isEditClassModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-emerald-600 p-5 flex justify-between items-center text-white">
              <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
                <Edit3 size={18} />
                Chỉnh Sửa Thông Tin Lớp Học & GVCN
              </h3>
              <button
                onClick={() => setIsEditClassModalOpen(false)}
                className="hover:bg-emerald-700 p-1 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">
                  Tên lớp học
                </label>
                <input
                  type="text"
                  value={editClassName}
                  onChange={(e) => setEditClassName(e.target.value)}
                  placeholder="Ví dụ: 12A6"
                  className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none font-bold text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">
                  Tên trường học
                </label>
                <input
                  type="text"
                  value={editSchoolName}
                  onChange={(e) => setEditSchoolName(e.target.value)}
                  placeholder="Ví dụ: THPT Hồng Ngự 3"
                  className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">
                  Giáo viên chủ nhiệm (GVCN)
                </label>
                <input
                  type="text"
                  value={editTeacherName}
                  onChange={(e) => setEditTeacherName(e.target.value)}
                  placeholder="Ví dụ: Phạm Hậu"
                  className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none font-bold text-sm"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditClassModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={saveQuickEdit}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md flex items-center gap-1.5 transition"
                >
                  <Check size={16} /> Lưu Thay Đổi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SỬA THÔNG TIN HỌC SINH */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-emerald-600 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Edit3 size={18} /> Chỉnh Sửa Học Sinh: {editingStudent.name}
              </h3>
              <button onClick={() => setEditingStudent(null)} className="p-1 hover:bg-emerald-700 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Họ và tên</label>
                <input
                  type="text"
                  value={editingStudent.name}
                  onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-semibold outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Linh vật</label>
                  <select
                    value={editingStudent.avatar}
                    onChange={(e) => setEditingStudent({ ...editingStudent, avatar: e.target.value })}
                    className="w-full p-2 bg-gray-50 border border-gray-300 rounded-xl text-lg font-bold"
                  >
                    {animalAvatars.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tổ</label>
                  <select
                    value={editingStudent.group}
                    onChange={(e) => setEditingStudent({ ...editingStudent, group: Number(e.target.value) })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold"
                  >
                    {[1, 2, 3, 4].map((g) => (
                      <option key={g} value={g}>Tổ {g}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Số điện thoại phụ huynh</label>
                <input
                  type="text"
                  value={editingStudent.phone}
                  onChange={(e) => setEditingStudent({ ...editingStudent, phone: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-semibold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Điểm sao thi đua hiện tại</label>
                <input
                  type="number"
                  value={editingStudent.points}
                  onChange={(e) => setEditingStudent({ ...editingStudent, points: Math.max(0, Number(e.target.value)) })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-bold text-amber-600 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditStudent}
                  className="px-5 py-2 rounded-xl text-xs font-black bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Lưu cập nhật
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POPUP TIÊU CHÍ CHẤM ĐIỂM */}
      {pointModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-emerald-600 p-4 flex justify-between items-center text-white">
              <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                <Target size={18} />
                Đánh giá: {students.find((s) => s.id === pointModal.studentId)?.name}
              </h3>
              <button
                onClick={() => setPointModal({ isOpen: false, studentId: null })}
                className="hover:bg-emerald-700 p-1 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h4 className="font-bold text-emerald-700 mb-2 flex items-center gap-1 text-xs sm:text-sm">
                  🌟 Cộng sao (Tích cực & Đọc Truyện)
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleUpdatePoint(pointModal.studentId!, 2, 'Đọc truyện diễn cảm')}
                    className="p-3 border border-emerald-200 rounded-xl hover:bg-emerald-50 text-left text-xs font-bold text-gray-700 transition"
                  >
                    📖 Đọc diễn cảm (+2)
                  </button>
                  <button
                    onClick={() => handleUpdatePoint(pointModal.studentId!, 1, 'Hăng hái phát biểu')}
                    className="p-3 border border-emerald-200 rounded-xl hover:bg-emerald-50 text-left text-xs font-bold text-gray-700 transition"
                  >
                    🙋‍♂️ Phát biểu (+1)
                  </button>
                  <button
                    onClick={() => handleUpdatePoint(pointModal.studentId!, 2, 'Làm bài tập tốt')}
                    className="p-3 border border-emerald-200 rounded-xl hover:bg-emerald-50 text-left text-xs font-bold text-gray-700 transition"
                  >
                    📝 Làm bài tốt (+2)
                  </button>
                  <button
                    onClick={() => handleUpdatePoint(pointModal.studentId!, 3, 'Điểm số xuất sắc')}
                    className="p-3 border border-emerald-200 rounded-xl hover:bg-emerald-50 text-left text-xs font-bold text-gray-700 transition"
                  >
                    💯 Điểm giỏi (+3)
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <h4 className="font-bold text-rose-600 mb-2 flex items-center gap-1 text-xs sm:text-sm">
                  ⚠️ Trừ sao (Nhắc nhở nề nếp)
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleUpdatePoint(pointModal.studentId!, -1, 'Mất trật tự')}
                    className="p-3 border border-rose-200 rounded-xl hover:bg-rose-50 text-left text-xs font-bold text-gray-700 transition"
                  >
                    🗣 Nói chuyện (-1)
                  </button>
                  <button
                    onClick={() => handleUpdatePoint(pointModal.studentId!, -2, 'Đi học muộn')}
                    className="p-3 border border-rose-200 rounded-xl hover:bg-rose-50 text-left text-xs font-bold text-gray-700 transition"
                  >
                    ⏰ Đi trễ (-2)
                  </button>
                  <button
                    onClick={() => handleUpdatePoint(pointModal.studentId!, -5, 'Chưa chuẩn bị bài')}
                    className="p-3 border border-rose-200 rounded-xl hover:bg-rose-50 text-left text-xs font-bold text-gray-700 transition"
                  >
                    🚫 Không thuộc bài (-5)
                  </button>
                  <button
                    onClick={() => handleUpdatePoint(pointModal.studentId!, -3, 'Dùng điện thoại trong giờ')}
                    className="p-3 border border-rose-200 rounded-xl hover:bg-rose-50 text-left text-xs font-bold text-gray-700 transition"
                  >
                    📱 Dùng điện thoại (-3)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NHẬP HỌC SINH TỪ EXCEL VÀ ĐỒNG BỘ */}
      {isExcelModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3 sm:p-5 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl border-4 border-emerald-300 overflow-hidden">
            {/* TIÊU ĐỀ MODAL */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-green-700 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-sm text-2xl shadow-inner">
                  📊
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black tracking-tight">
                    Nhập Danh Sách Học Sinh Từ Excel Vào Lớp {className}
                  </h3>
                  <p className="text-xs text-emerald-100 font-medium">
                    Trường: {schoolName} • GVCN: {teacherName} • Tự động đồng bộ sang Sáng Tác Truyện & Tủ Sách
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsExcelModalOpen(false);
                  setParsedExcelStudents([]);
                }}
                className="p-1.5 hover:bg-white/20 rounded-2xl transition text-white"
              >
                <X size={22} />
              </button>
            </div>

            {/* THÂN MODAL */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              {/* THANH CHUYỂN ĐỔI CHẾ ĐỘ NHẬP & TẢI MẪU */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-emerald-50/70 p-2 rounded-2xl border border-emerald-200">
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setExcelInputMode('paste')}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      excelInputMode === 'paste'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-gray-700 hover:bg-white/80'
                    }`}
                  >
                    <FileText size={15} />
                    <span>Dán Bảng (Ctrl+V)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setExcelInputMode('file')}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      excelInputMode === 'file'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-gray-700 hover:bg-white/80'
                    }`}
                  >
                    <FileUp size={15} />
                    <span>Tải File (.xlsx, .csv)</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadSampleExcel}
                  className="w-full sm:w-auto px-3.5 py-1.5 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Download size={14} /> Tải Mẫu Excel Chuẩn
                </button>
              </div>

              {/* VÙNG NHẬP LIỆU: DÁN VĂN BẢN HOẶC TẢI FILE */}
              {excelInputMode === 'paste' ? (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                      <FileSpreadsheet size={14} className="text-emerald-600" />
                      Sao chép cột từ Excel / Google Sheets rồi Dán (Ctrl+V) vào đây:
                    </label>
                    <span className="text-[11px] text-gray-500">
                      Hỗ trợ: STT, Họ tên, Tổ, Số điện thoại
                    </span>
                  </div>
                  <textarea
                    value={excelData}
                    onChange={(e) => handleTextareaChange(e.target.value)}
                    placeholder="Ví dụ dán trực tiếp từ Excel:&#10;1	Nguyễn Phương Anh	1	0901234567&#10;2	Cao Minh Tuấn	1	0912345678&#10;3	Lê Hoàng Yến	2	0987654321&#10;&#10;Hoặc dán danh sách họ tên mỗi bạn 1 dòng:&#10;Trần Quốc Đạt&#10;Phạm Quỳnh Nga"
                    className="w-full h-36 p-3.5 bg-gray-50 border-2 border-emerald-200 focus:border-emerald-500 rounded-2xl text-xs sm:text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none resize-none leading-relaxed"
                  />
                </div>
              ) : (
                <div className="border-2 border-dashed border-emerald-300 rounded-2xl p-6 text-center bg-emerald-50/40 hover:bg-emerald-50 transition flex flex-col items-center justify-center gap-3">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center text-3xl shadow-xs">
                    📁
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-gray-900">
                      Chọn file Excel danh sách lớp của thầy/cô
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Hỗ trợ định dạng file: <strong>.xlsx, .xls, .csv</strong> (tự động đọc các cột STT, Họ và tên, Tổ, Số điện thoại)
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2 active:scale-95"
                  >
                    <FileUp size={16} /> Chọn File Từ Máy Tính
                  </button>
                </div>
              )}

              {/* THÔNG BÁO LỖI NẾU CÓ */}
              {excelError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-medium flex items-center gap-2">
                  <AlertCircle size={16} className="text-rose-600 shrink-0" />
                  <span>{excelError}</span>
                </div>
              )}

              {/* BẢNG XEM TRƯỚC HỌC SINH NHẬN DIỆN ĐƯỢC */}
              {parsedExcelStudents.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-emerald-100">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <h4 className="text-xs sm:text-sm font-black text-emerald-950 uppercase">
                        ✅ Nhận diện được {parsedExcelStudents.length} học sinh
                      </h4>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
                      Tự động gán linh vật & phân tổ 1-4
                    </span>
                  </div>

                  {/* DANH SÁCH BẢNG XEM TRƯỚC */}
                  <div className="max-h-52 overflow-y-auto rounded-2xl border border-emerald-200 overflow-hidden shadow-xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-emerald-100/80 text-emerald-950 font-bold sticky top-0">
                        <tr>
                          <th className="p-2.5 text-center w-12">STT</th>
                          <th className="p-2.5">Họ và tên học sinh</th>
                          <th className="p-2.5 text-center">Tổ</th>
                          <th className="p-2.5">Số điện thoại</th>
                          <th className="p-2.5 text-center w-10">Bỏ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-100 bg-white">
                        {parsedExcelStudents.map((s, idx) => (
                          <tr key={`hub-parsed-excel-${s.id}-${idx}`} className="hover:bg-emerald-50/50">
                            <td className="p-2 text-center font-bold text-gray-400">{idx + 1}</td>
                            <td className="p-2 font-bold text-gray-800 flex items-center gap-2">
                              <span className="text-lg">{s.avatar}</span>
                              <span>{s.name}</span>
                            </td>
                            <td className="p-2 text-center">
                              <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md text-[11px]">
                                Tổ {s.group}
                              </span>
                            </td>
                            <td className="p-2 font-mono text-gray-600 text-[11px]">
                              {s.phone || <span className="text-gray-300 italic font-sans">Chưa có</span>}
                            </td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveParsedStudent(s.id)}
                                className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="Xóa dòng này"
                              >
                                <X size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* CHỌN CHẾ ĐỘ ĐỒNG BỘ */}
                  <div className="bg-emerald-50/90 p-3.5 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <span className="text-xs font-black text-emerald-950 uppercase">
                      Phương thức đồng bộ vào lớp {className}:
                    </span>
                    <div className="flex items-center gap-4 text-xs font-bold text-gray-800">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="importMode"
                          checked={excelImportMode === 'append'}
                          onChange={() => setExcelImportMode('append')}
                          className="accent-emerald-600"
                        />
                        <span>
                          Thêm mới (+{parsedExcelStudents.length} bạn, tổng sĩ số: {students.length + parsedExcelStudents.length})
                        </span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-amber-900">
                        <input
                          type="radio"
                          name="importMode"
                          checked={excelImportMode === 'replace'}
                          onChange={() => setExcelImportMode('replace')}
                          className="accent-emerald-600"
                        />
                        <span>
                          Thay thế danh sách cũ (Làm mới: {parsedExcelStudents.length} bạn)
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* CHÂN MODAL & NÚT THỰC THI ĐỒNG BỘ */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsExcelModalOpen(false);
                  setParsedExcelStudents([]);
                }}
                className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-100 transition"
              >
                Đóng lại
              </button>

              <button
                type="button"
                onClick={handleApplyExcelImport}
                disabled={parsedExcelStudents.length === 0}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-40 text-white text-xs sm:text-sm font-black shadow-md flex items-center gap-2 transition disabled:pointer-events-none"
              >
                <CheckCheck size={18} />
                <span>
                  Đồng Bộ & Lưu {parsedExcelStudents.length > 0 ? `${parsedExcelStudents.length} Học Sinh` : ''} Vào Lớp
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL IN GIẤY KHEN HỌC SINH HẠNH PHÚC */}
      <CertificateModal
        isOpen={isCertificateOpen}
        onClose={() => {
          setIsCertificateOpen(false);
          setCertificateStudent(null);
        }}
        student={certificateStudent}
        className={className}
        schoolName={schoolName}
        teacherName={teacherName}
      />
    </div>
  );
};
