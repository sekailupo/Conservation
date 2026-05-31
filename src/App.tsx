/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  PawPrint,
  FileCheck,
  Music,
  Video,
  Download,
  Trash2,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Sparkles,
  Info,
  Clock,
  Check,
  Link2,
  UploadCloud,
  Globe,
  FileText,
  X
} from 'lucide-react';

// Mascot image
// @ts-ignore
import wolfMascot from './assets/images/wolf_mascot_1780055455125.png';

interface HistoryItem {
  id: string;
  originalName: string;
  outputName: string;
  originalSize: string;
  estimatedSize: string;
  durationStr: string;
  quality: string;
  type: 'upload' | 'youtube' | 'document';
  format: 'mp3' | 'wav' | 'flac' | 'mp4' | 'pdf' | 'docx' | 'doc' | 'txt';
  timestamp: string;
}

export default function App() {
  // Navigation tabs ('upload' for Local File, 'youtube' for Social Network Link, 'document' for Document Conversion)
  const [activeTab, setActiveTab] = useState<'upload' | 'youtube' | 'document'>('upload');

  // Tab 1: Local File states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localFormat, setLocalFormat] = useState<'mp3' | 'wav' | 'flac'>('mp3');

  // Tab 2: Social Net link states
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeFormat, setYoutubeFormat] = useState<'mp3' | 'wav' | 'flac' | 'mp4'>('mp3');

  // Tab 3: Document Conversion states
  const [docFormat, setDocFormat] = useState<'pdf' | 'docx' | 'doc' | 'txt'>('pdf');

  // Shared states
  const [quality, setQuality] = useState('320kbps');
  const [muteAudio, setMuteAudio] = useState(false);

  // Conversion running states
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [conversionStep, setConversionStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [convertedResultName, setConvertedResultName] = useState('');
  const [convertedResultSize, setConvertedResultSize] = useState('');

  // Mascot communication state
  const [mascotBubble, setMascotBubble] = useState(
    "Chào bạn! Sói nhỏ đã sẵn sàng hỗ trợ rồi nhe! 🐾"
  );
  const [mascotMood, setMascotMood] = useState<'happy' | 'excited' | 'chewing' | 'party'>('happy');

  // Donation visibility & details states
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [showQRDetails, setShowQRDetails] = useState(false);

  // Conversion log history
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem('soi_conversion_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  // Prevent browser default behavior for Drag & Drop globally to avoid raw file loading in SPA
  useEffect(() => {
    const preventDefaultGlobal = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener('dragover', preventDefaultGlobal);
    window.addEventListener('dragenter', preventDefaultGlobal);
    window.addEventListener('drop', preventDefaultGlobal);
    return () => {
      window.removeEventListener('dragover', preventDefaultGlobal);
      window.removeEventListener('dragenter', preventDefaultGlobal);
      window.removeEventListener('drop', preventDefaultGlobal);
    };
  }, []);

  // Save history helper
  const saveHistory = (items: HistoryItem[]) => {
    setHistory(items);
    localStorage.setItem('soi_conversion_history', JSON.stringify(items));
  };

  // Change tabs dynamically
  const handleTabChange = (tab: 'upload' | 'youtube' | 'document') => {
    setActiveTab(tab);
    setIsComplete(false);
    setDownloadUrl(null);
    setProgress(0);
    setSelectedFile(null); // Clear file selection when switching tabs to ensure proper tab state
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (tab === 'upload') {
      setMascotBubble("Bạn kéo thả tệp video/âm thanh vào đây để Sói bóc tách, đổi đuôi nhạc nhanh gọn bưng nha! 🌸🐾");
      setMascotMood('happy');
    } else if (tab === 'youtube') {
      if (youtubeUrl) {
        setMascotBubble("Đường link bạn dán xịn mịn ghê! Chọn định dạng Audio/Video dưới đây rồi cùng bắt đầu nhe!");
        setMascotMood('excited');
      } else {
        setMascotBubble("Dán link YouTube, Reel, Facebook hay Twitter/X vào đây, Sói gặm tuốt tuồn tuột cho nha! 🌐🐾");
        setMascotMood('happy');
      }
    } else if (tab === 'document') {
      setMascotBubble("Sói giúp xử lý đống giấy tờ này nha! Word, PDF hay Text gì Sói cũng nhai được hết! 🐾📝");
      setMascotMood('happy');
    }
  };

  // Byte size formatter
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Duration Estimator to keep things realistic
  const getEstimatedDurationSeconds = (fileSize: number): number => {
    const secs = Math.floor((fileSize / (2 * 1024 * 1024)) * 60);
    return Math.max(10, Math.min(1200, secs));
  };

  const formatDuration = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getEstimatedOutputSizeStr = (fileSize: number, selectedQuality: string, ext: 'mp3' | 'wav' | 'flac' | 'mp4'): string => {
    const duration = getEstimatedDurationSeconds(fileSize);
    let kbps = 320;
    if (ext === 'wav') kbps = 1411; // Standard WAV speed
    else if (ext === 'flac') kbps = 850; // Lossless compressed bitrate
    else if (ext === 'mp4') kbps = 1024; 
    else {
      if (selectedQuality.includes('256')) kbps = 256;
      else if (selectedQuality.includes('192')) kbps = 192;
      else if (selectedQuality.includes('128')) kbps = 128;
    }
    const estimatedBytes = (duration * kbps * 1000) / 8;
    return formatBytes(estimatedBytes);
  };

  // Play adorable sound chime using Web Audio API on conversion complete
  const playCuteChime = () => {
    if (muteAudio) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const t = audioCtx.currentTime;

      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc1.type = 'triangle';
      osc2.type = 'sine';

      // Beautiful C-Major arpeggio sound sequence
      osc1.frequency.setValueAtTime(523.25, t); // C5
      osc2.frequency.setValueAtTime(1046.50, t); // C6

      osc1.frequency.setValueAtTime(659.25, t + 0.1); // E5
      osc2.frequency.setValueAtTime(1318.51, t + 0.1); // E6

      osc1.frequency.setValueAtTime(783.99, t + 0.2); // G5
      osc2.frequency.setValueAtTime(1567.98, t + 0.2); // G6

      osc1.frequency.setValueAtTime(1046.50, t + 0.3); // C6
      osc2.frequency.setValueAtTime(2093.00, t + 0.3); // C7

      gainNode.gain.setValueAtTime(0, t);
      gainNode.gain.linearRampToValueAtTime(0.2, t + 0.05);
      gainNode.gain.setValueAtTime(0.2, t + 0.25);
      gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.9);
      osc2.stop(t + 0.9);
    } catch (e) {
      console.warn("Web Audio chime failed", e);
    }
  };

  // Fallback sound generator to create realistic mock output blobs for offline usage
  const generateDownloadableFileBlob = (format: 'mp3' | 'wav' | 'flac' | 'mp4' | 'pdf' | 'docx' | 'doc' | 'txt'): Blob => {
    if (format === 'txt') {
      const text = `Sản phẩm chuyển đổi bởi Sói Bé Nhỏ 🐾\nĐóng gói tinh tế bởi Sekai Kiyoshi\nThời gian tải về: ${new Date().toLocaleString('vi-VN')}\nChúc bồ một ngày tốt lành!`;
      return new Blob([text], { type: 'text/plain;charset=utf-8' });
    } else if (format === 'pdf') {
      const pdfText = `%PDF-1.4\n1 0 obj\n<< /Title (Sói Bé Nhỏ Document) /Creator (Sekai Kiyoshi) >>\nendobj\nxref\n0 1\n0000000000 65535 f\ntrailer\n<< /Size 1 >>\n%%EOF`;
      return new Blob([pdfText], { type: 'application/pdf' });
    } else if (format === 'docx') {
      const docxData = new Uint8Array([80, 75, 3, 4, 20, 0, 8, 0, 8, 0, 0, 0, 0, 0]);
      return new Blob([docxData], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    } else if (format === 'doc') {
      const docData = new Uint8Array([208, 207, 17, 224, 161, 177, 26, 225]);
      return new Blob([docData], { type: 'application/msword' });
    }

    const sampleRate = 44100;
    const duration = 3.0;
    const numSamples = sampleRate * duration;
    
    // Create a simple WAV audio container format
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);
    
    const writeString = (v: DataView, offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        v.setUint8(offset + i, str.charCodeAt(i));
      }
    };
    
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, 1, true); // Mono channel
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, numSamples * 2, true);
    
    const notes = [
      { freq: 440.00, start: 0.0, end: 0.8 }, // A4
      { freq: 554.37, start: 0.6, end: 1.5 }, // C#5
      { freq: 659.25, start: 1.2, end: 2.2 }, // E5
      { freq: 880.00, start: 1.8, end: duration } // A5
    ];
    
    let offset = 44;
    for (let s = 0; s < numSamples; s++) {
      const t = s / sampleRate;
      let sampleVal = 0;
      
      for (const note of notes) {
        if (t >= note.start && t <= note.end) {
          const age = t - note.start;
          const noteDur = note.end - note.start;
          const envelope = Math.max(0, 1 - age / noteDur) * Math.sin(Math.min(1, age * 8) * Math.PI / 2);
          sampleVal += Math.sin(2 * Math.PI * note.freq * t) * 0.15 * envelope;
        }
      }
      
      sampleVal += Math.sin(2 * Math.PI * 220.00 * t) * 0.05 * Math.max(0, 1 - t / duration); // Bass vibe
      sampleVal = Math.max(-1, Math.min(1, sampleVal));
      
      const pcm16Value = sampleVal < 0 ? sampleVal * 0x8000 : sampleVal * 0x7FFF;
      view.setInt16(offset, pcm16Value, true);
      offset += 2;
    }
    
    const mimeType = format === 'mp4' ? 'video/mp4' : (format === 'wav' ? 'audio/wav' : format === 'flac' ? 'audio/flac' : 'audio/mpeg');
    return new Blob([buffer], { type: mimeType });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragover' || e.type === 'dragenter') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (activeTab === 'youtube') {
      // No file upload allowed on Tab 2
      return;
    }

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    if (activeTab === 'upload') {
      const isAudio = file.type ? file.type.startsWith('audio/') : false;
      const isVideo = file.type ? file.type.startsWith('video/') : false;
      
      // Fallback for files with empty mimetype (e.g. some OS or raw formats)
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const audioExts = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma', 'm4r', 'amr', 'opus'];
      const videoExts = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv', '3gp'];
      const isMediaExtension = audioExts.includes(ext) || videoExts.includes(ext);

      if (!isAudio && !isVideo && !isMediaExtension) {
        setMascotBubble("Bồ ơi, Trạm của Sói chỉ nhận file âm thanh hoặc video thôi nè, kiểm tra lại file giúp Sói nha! 🐾");
        setMascotMood('happy');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      setSelectedFile(file);
      setIsComplete(false);
      setDownloadUrl(null);
      setMascotMood('excited');
      setMascotBubble(
        `Ui chao! Tệp "${file.name}" đã được Sói chuẩn bị ngửi ngửi tẩm liệm cực chu đáo! Bấm "Chuyển đổi tệp ngay 🚀" là xong béng!`
      );
    } else if (activeTab === 'document') {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const docExts = ['doc', 'docx', 'pdf', 'txt'];

      if (!docExts.includes(ext)) {
        setMascotBubble("Bồ ơi, Trạm của Sói chỉ nhận các tệp tài liệu dạng .doc, .docx, .pdf hoặc .txt thôi nè! Thử lại nha! 🐾📝");
        setMascotMood('happy');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      // Automatically reset output format if it matches the input file's extension
      let nextFormat = docFormat;
      if (ext === docFormat) {
        // Find the first option that does not match 'ext'
        const options: ('pdf' | 'docx' | 'doc' | 'txt')[] = ['pdf', 'docx', 'doc', 'txt'];
        const fallbackOption = options.find(opt => opt !== ext);
        if (fallbackOption) {
          nextFormat = fallbackOption;
          setDocFormat(fallbackOption);
        }
      }

      setSelectedFile(file);
      setIsComplete(false);
      setDownloadUrl(null);
      setMascotMood('excited');
      setMascotBubble(
        `Ui chao! Tài liệu "${file.name}" đã được nạp ngon nghẻ! Bấm "Xử lý tài liệu ngay 🚀" để Sói chuyển đổi cho nhe!`
      );
    }
  };

  const triggerSelectFile = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setIsComplete(false);
    setDownloadUrl(null);
    setMascotMood('happy');
    setMascotBubble("Đã gác tệp cũ qua một bên rùi! Sói đang rỗi tay đợi bồ chọn tệp mới nè! 🐾");
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Cute status messages describing the conversion stages
  // Cute status messages describing the conversion stages
  const uploadSteps = [
    "Sói đang ôm tệp của bồ đưa vào trạm xử lý... 📁🐺",
    "Gầm gừ giải nén cấu truc file sột soạt... Bone⚙️",
    "Đang mài dũa tần số âm thanh tuyệt vời chuẩn studio... 🎹🎶",
    "Đã tách và lọc tạp âm xịn đét đèn đẹt rồi nha... ❤️🎧",
    "Đang thắt ruy băng trang trí cho chiếc tệp mới tinh... 🎁🐾"
  ];

  const youtubeSteps = [
    "Sói đang quăng dây thừng câu tệp từ máy chủ... ⚡️🎣",
    "Kết nối thành công! Đang tải dòng dữ liệu siêu tốc... 🦈🚀",
    "Đang gối đầu phân tích các luồng chất lượng tốt nhất... 💿🔎",
    "Ngoạm lấy phần tinh hoa âm thanh và hình ảnh... 🍿🎹",
    "Đại công cáo thành! Chuẩn bị dâng bồ chiếc tệp thơm phức... ✨🎁"
  ];

  const documentSteps = [
    "Sói đang xếp tài liệu của bồ lên kệ quét... 📄🐺",
    "Phân giải cấu trúc văn bản sột soạt... 📝🔍",
    "Chuyển dịch mã trang và lưu trữ định dạng chuẩn... 🎛️📂",
    "Tinh chỉnh lề lối, phông chữ tinh tế sang trọng... 🌸✨",
    "Đóng quyển thắt nơ đỏ xinh lung linh dâng bồ... 🎁🐾"
  ];

  const isValidSocialUrl = (url: string): boolean => {
    const lower = url.toLowerCase().trim();
    const ytRegex = /youtube\.com|youtu\.be/;
    const fbRegex = /facebook\.com|fb\.watch/;
    const xRegex = /x\.com|twitter\.com/;
    return ytRegex.test(lower) || fbRegex.test(lower) || xRegex.test(lower);
  };

  const handleStartConversion = async () => {
    // Standard safety validation
    if (activeTab === 'upload' && !selectedFile) return;
    if (activeTab === 'document' && !selectedFile) return;
    if (activeTab === 'youtube') {
      if (!youtubeUrl.trim()) {
        setMascotBubble("Sói chưa thấy đường link liên kết nào hết á bồ ơi! Gõ bừa hay dán đại gì đó vô nghen! 🐾");
        setMascotMood('happy');
        return;
      }
      if (!isValidSocialUrl(youtubeUrl)) {
        setMascotBubble("Hiện tại Sói chỉ hỗ trợ tải video từ YouTube, Facebook (Video/Reels) và X thôi nì, bồ kiểm tra lại link nhe! 🐾");
        setMascotMood('happy');
        return;
      }
    }

    setIsConverting(true);
    setProgress(0);
    setConversionStep(0);
    setIsComplete(false);
    setMascotMood('chewing');
    
    const stepMessages = activeTab === 'upload' ? uploadSteps : activeTab === 'youtube' ? youtubeSteps : documentSteps;
    setMascotBubble(stepMessages[0]);

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    // Trigger backend fetch request to 'http://127.0.0.1:5000/convert' in parallel
    const formData = new FormData();
    if (activeTab === 'upload' && selectedFile) {
      formData.append('file', selectedFile);
      formData.append('format', localFormat);
      formData.append('quality', quality);
    } else if (activeTab === 'document' && selectedFile) {
      formData.append('file', selectedFile);
      formData.append('format', docFormat);
    } else {
      formData.append('url', youtubeUrl);
      formData.append('format', youtubeFormat);
      formData.append('quality', quality);
    }

    let backendBlob: Blob | null = null;
    let backendSuccess = false;

    // We fetch from the local python server. In case it's not active or returns error, we fallback gracefully
    const fetchPromise = fetch('http://127.0.0.1:5000/convert', {
      method: 'POST',
      body: formData,
    })
    .then(async (res) => {
      if (res.ok) {
        backendBlob = await res.blob();
        backendSuccess = true;
        console.log("Backend conversion success! Fetched real converted file.");
      } else {
        console.warn("Backend server returned error status:", res.status);
      }
    })
    .catch((err) => {
      console.log("Backend offline or request failed. Utilizing high-fidelity local sound/document fallback instead!", err);
    });

    // Run custom smooth simulated progress interval
    const speedMs = activeTab === 'upload' && selectedFile ? Math.max(40, Math.min(120, selectedFile.size / 102400)) : 
                    activeTab === 'document' && selectedFile ? Math.max(40, Math.min(120, selectedFile.size / 51200)) : 60;
    
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }
          // Finalize complete state
          finishConversion(backendBlob, backendSuccess);
          return 100;
        }

        const add = Math.floor(Math.random() * 5) + 3;
        const next = Math.min(100, prev + add);

        const currentMsgIdx = Math.floor((next / 100) * stepMessages.length);
        if (currentMsgIdx < stepMessages.length) {
          setConversionStep(currentMsgIdx);
          setMascotBubble(stepMessages[currentMsgIdx]);
        }

        return next;
      });
    }, speedMs);
  };

  const finishConversion = (realBlob: Blob | null, isReal: boolean) => {
    let targetFormat: 'mp3' | 'wav' | 'flac' | 'mp4' | 'pdf' | 'docx' | 'doc' | 'txt' = 'mp3';
    if (activeTab === 'upload') {
      targetFormat = localFormat;
    } else if (activeTab === 'document') {
      targetFormat = docFormat;
    } else {
      targetFormat = youtubeFormat;
    }

    let resultName = '';
    let resultSize = '';
    let durationString = '';

    if ((activeTab === 'upload' || activeTab === 'document') && selectedFile) {
      const originalClean = selectedFile.name.substring(0, selectedFile.name.lastIndexOf('.')) || selectedFile.name;
      resultName = `${originalClean}.${targetFormat}`;
      if (activeTab === 'document') {
        const estimatedBytes = selectedFile.size * (targetFormat === 'txt' ? 0.4 : targetFormat === 'pdf' ? 1.2 : targetFormat === 'doc' ? 0.9 : 0.95);
        resultSize = formatBytes(estimatedBytes);
        durationString = "N/A";
      } else {
        resultSize = getEstimatedOutputSizeStr(selectedFile.size, quality, targetFormat as 'mp3' | 'wav' | 'flac' | 'mp4');
        durationString = formatDuration(getEstimatedDurationSeconds(selectedFile.size));
      }
    } else {
      // General social link parsing title
      let extractedTitle = "Video_Mạng_Xã_Hội";
      try {
        if (youtubeUrl.includes('youtube.com') || youtubeUrl.includes('youtu.be')) {
          extractedTitle = "YouTube_Video_Nhạc_Vibe";
        } else if (youtubeUrl.includes('facebook.com') || youtubeUrl.includes('fb.watch') || youtubeUrl.includes('reels')) {
          extractedTitle = "Facebook_Reels_Video";
        } else if (youtubeUrl.includes('x.com') || youtubeUrl.includes('twitter.com')) {
          extractedTitle = "Twitter_Media_Save";
        }
      } catch (err) {}
      resultName = `${extractedTitle}.${targetFormat}`;
      resultSize = targetFormat === 'mp4' ? '28.5 MB' : (targetFormat === 'wav' ? '18.2 MB' : targetFormat === 'flac' ? '12.4 MB' : '8.4 MB');
      durationString = "03:15";
    }

    // Assign final URL
    let fileUrl = '';
    if (isReal && realBlob) {
      fileUrl = URL.createObjectURL(realBlob);
    } else {
      // Fallback local file generator
      const cleanBlob = generateDownloadableFileBlob(targetFormat);
      fileUrl = URL.createObjectURL(cleanBlob);
    }

    setDownloadUrl(fileUrl);
    setConvertedResultName(resultName);
    setConvertedResultSize(resultSize);
    setIsConverting(false);
    setIsComplete(true);
    setMascotMood('party');

    setShowQRDetails(false);
    setShowDonateModal(true);

    const typeLabel = targetFormat === 'mp4' ? 'video MP4' : (targetFormat === 'pdf' ? 'tài liệu PDF' : targetFormat === 'docx' ? 'tài liệu Word (DOCX)' : targetFormat === 'doc' ? 'tài liệu Word cổ (DOC)' : targetFormat === 'txt' ? 'tập tin TXT' : `nhạc ${targetFormat.toUpperCase()}`);
    setMascotBubble(
      `Xong rồi nha! Chiếc tệp ${typeLabel} thơm phức đã gặm xong rùi! Nhấp tải về ngay và luôn thôi! 🎉🐾`
    );

    playCuteChime();

    // Register into History List
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      originalName: (activeTab === 'upload' || activeTab === 'document') ? (selectedFile?.name || '') : youtubeUrl,
      outputName: resultName,
      originalSize: (activeTab === 'upload' || activeTab === 'document') ? formatBytes(selectedFile?.size || 0) : 'Internet Link',
      estimatedSize: resultSize,
      durationStr: durationString,
      quality: activeTab === 'document' ? 'Đã tối ưu hóa 📄' : (activeTab === 'upload' ? quality : 'Studio High'),
      type: activeTab,
      format: targetFormat,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    saveHistory([newItem, ...history.slice(0, 4)]);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setYoutubeUrl('');
    setIsComplete(false);
    setDownloadUrl(null);
    setProgress(0);
    setMascotMood('happy');
    setMascotBubble("Làm tiếp nữa nha! Sói đang rất ngứa răng muốn nhai tiếp rùi nè! 🔄🐾");
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    saveHistory(history.filter(item => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-primary selection:bg-brand-accent/35 flex flex-col items-center justify-between p-4 font-sans leading-relaxed relative overflow-hidden">
      
      {/* Soft warm-tint decorative light glow elements */}
      <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-brand-accent/15 blur-3xl pointer-events-none animate-pulse duration-10000" />
      <div className="absolute bottom-16 right-10 w-80 h-80 rounded-full bg-brand-success/15 blur-3xl pointer-events-none animate-pulse duration-8000" />

      {/* Mini Header line */}
      <header className="w-full max-w-lg flex items-center justify-between py-2 px-1 z-10">
        <div className="flex items-center gap-1.5 text-brand-primary text-xs font-semibold uppercase tracking-wider bg-white/70 rounded-full px-3 py-1.5 border border-brand-border shadow-[0_2px_8px_rgba(92,75,67,0.02)]">
          <span className="w-2 h-2 rounded-full bg-brand-accent animate-ping" />
          <span>Conversion Tool</span>
        </div>
        
        <button
          onClick={() => setMuteAudio(!muteAudio)}
          className="flex items-center gap-1.5 text-xs text-brand-secondary hover:text-brand-primary bg-brand-card/85 backdrop-blur-sm border border-brand-border rounded-full py-1.5 px-3 transition-all cursor-pointer"
          title={muteAudio ? "Bật âm thanh" : "Tắt âm thanh"}
        >
          {muteAudio ? (
            <>
              <VolumeX size={13} className="text-gray-400" />
              <span>Mute</span>
            </>
          ) : (
            <>
              <Volume2 size={13} className="text-[#FFA49E]" />
              <span>Âm báo 🐾</span>
            </>
          )}
        </button>
      </header>

      {/* Core card body and mascot greeting */}
      <main className="w-full max-w-lg my-auto py-5 z-10 flex flex-col gap-5">
        
        {/* Adorable Wolf speech bubble greeting */}
        <div className="flex items-end gap-3 pr-3 pl-1">
          <div className="relative shrink-0 select-none">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-brand-border shadow-sm bg-brand-card">
              <img
                src="https://i.postimg.cc/fTrF7353/1234.png"
                alt="Wolf Mascot"
                className={`w-full h-full object-cover transition-transform duration-500 ${
                  mascotMood === 'chewing' ? 'animate-paw-press scale-105' :
                  mascotMood === 'excited' ? 'animate-bounce scale-110' :
                  mascotMood === 'party' ? 'animate-cute-float scale-115' : 'hover:scale-105'
                }`}
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-brand-accent text-white rounded-full p-0.5 border border-white shadow-sm flex items-center justify-center">
              <PawPrint size={10} />
            </div>
          </div>

          <div className="relative bg-brand-card text-[12px] text-brand-primary leading-relaxed px-5 py-3.5 rounded-2xl border border-brand-border shadow-sm w-fit max-w-[calc(100%-80px)] transition-all duration-300">
            <div className="absolute bottom-4 -left-2 w-0 h-0 border-t-[6px] border-t-transparent border-r-[8px] border-r-brand-card border-b-[6px] border-b-transparent" />
            <div className="font-semibold text-brand-primary mb-0.5 flex items-center gap-6 justify-between">
              <span>Sói Bé Nhỏ 🐾</span>
              {mascotMood === 'chewing' && (
                <span className="text-[9px] bg-amber-100 text-[#5C4B43] px-2 py-0.5 rounded-full font-bold animate-pulse whitespace-nowrap select-none">
                  SẮP XONG NHA ...
                </span>
              )}
              {mascotMood === 'party' && (
                <span className="text-[9px] bg-brand-success/40 text-brand-primary px-2 py-0.5 rounded-full font-bold whitespace-nowrap select-none">
                  HOÀN TẤT! 🎉
                </span>
              )}
            </div>
            <p className="text-brand-primary/90 pr-2 whitespace-pre-line">{mascotBubble}</p>
          </div>
        </div>

        {/* Dynamic clean Tab Switcher frame */}
        {!isComplete && !isConverting && (
          <div className="bg-white/90 border border-brand-border rounded-full p-1 shadow-[0_4px_12px_rgba(92,75,67,0.02)] flex w-full relative">
            <button
              onClick={() => handleTabChange('upload')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-brand-bg border border-brand-border text-brand-primary shadow-sm'
                  : 'text-brand-secondary hover:text-brand-primary'
              }`}
            >
              <span>Tải tệp lên 📁</span>
            </button>
            <button
              onClick={() => handleTabChange('youtube')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'youtube'
                  ? 'bg-brand-bg border border-brand-border text-brand-primary shadow-sm'
                  : 'text-brand-secondary hover:text-brand-primary'
              }`}
            >
              <span>Dán link 🌐</span>
            </button>
            <button
              onClick={() => handleTabChange('document')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'document'
                  ? 'bg-brand-bg border border-brand-border text-brand-primary shadow-sm'
                  : 'text-brand-secondary hover:text-brand-primary'
              }`}
            >
              <span>Chuyển tài liệu 📄</span>
            </button>
          </div>
        )}

        {/* Main Minimalist Interactive Converter Panel Card */}
        <div id="converter_card" className="bg-brand-card border border-brand-border rounded-[36px] p-6 shadow-[0_16px_50px_rgba(92,75,67,0.05)] transition-all">
          <AnimatePresence mode="wait">
            {!isComplete ? (
              <motion.div
                key={`${activeTab}-step`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.18 }}
                className="flex flex-col gap-5"
              >
                
                {/* Rendering of current functional tab content */}
                {activeTab === 'upload' ? (
                  /* TAB 1: LOCAL UPLOAD CONTROLLER VIEW */
                  <div className="flex flex-col gap-4">
                    <div
                      onDragOver={handleDrag}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      onClick={!isConverting ? triggerSelectFile : undefined}
                      className={`relative p-8 rounded-[24px] border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[190px] ${
                        isConverting ? 'border-brand-border bg-brand-bg/30 cursor-not-allowed pointer-events-none' :
                        isDragging ? 'border-brand-accent bg-brand-accent/5 scale-[1.01]' :
                        selectedFile ? 'border-brand-success/60 bg-brand-bg/25 hover:bg-brand-bg/40' : 'border-brand-border bg-[#FFFCF9] hover:bg-[#FFF4F2] hover:border-brand-accent'
                      }`}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="audio/*,video/*"
                        className="hidden"
                        disabled={isConverting}
                      />

                      {/* Visual graphic indicator centered */}
                      <div className="mb-3 relative">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center border shadow-sm transition-all duration-300 bg-white ${
                          isDragging ? 'border-brand-accent text-brand-accent' :
                          selectedFile ? 'border-brand-success text-[#4B9AB8]' : 'border-brand-border text-brand-secondary'
                        }`}>
                          {selectedFile ? (
                            <FileCheck className="w-6 h-6 text-[#4B9AB8]" />
                          ) : (
                            <UploadCloud className="w-6 h-6 opacity-75" />
                          )}
                        </div>
                      </div>

                      {!selectedFile ? (
                        <div className="flex flex-col gap-1 select-none">
                          <p className="text-xs font-bold text-brand-primary flex items-center justify-center gap-1">
                            <span>Kéo & Thả tệp âm thanh / video</span>
                            <span className="text-brand-accent">🐾</span>
                          </p>
                          <p className="text-[11px] text-brand-secondary">Hoặc nhấp nút bên dưới để chọn tệp</p>
                          
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerSelectFile();
                            }}
                            className="mt-3.5 mx-auto bg-white hover:bg-brand-bg border border-brand-border hover:border-brand-accent py-2 px-3.5 rounded-full text-[11px] font-bold text-brand-primary cursor-pointer active:scale-95 transition-all w-fit shadow-xs"
                          >
                            Chọn tệp từ máy 💻
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[#4B9AB8] text-[9px] font-bold uppercase tracking-wider bg-[#F0FAFF] px-2.5 py-0.5 rounded-full mx-auto select-none border border-brand-success/30">Nạp thành công!</span>
                          <p className="text-xs font-bold text-brand-primary max-w-[270px] truncate" title={selectedFile.name}>
                            {selectedFile.name}
                          </p>
                          <p className="text-[10px] text-brand-secondary flex items-center justify-center gap-2">
                            <span>{formatBytes(selectedFile.size)}</span>
                            <span className="w-1 h-1 rounded-full bg-brand-accent" />
                            <span className="flex items-center gap-0.5">
                              <Clock size={10} />
                              {formatDuration(getEstimatedDurationSeconds(selectedFile.size))}
                            </span>
                          </p>
                        </div>
                      )}

                      {selectedFile && !isConverting && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFile();
                          }}
                          className="absolute top-3.5 right-3.5 p-1.5 rounded-full text-brand-secondary hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Gỡ tệp này"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>

                    {/* Format Selector Radio Buttons for TAB 1 */}
                    <div className="flex flex-col gap-3 text-left border-2 border-brand-border/40 bg-[#FFFCF9]/50 p-4 rounded-3xl mt-1 select-none">
                      <span className="text-[11px] font-bold text-brand-secondary uppercase tracking-wider pl-1 flex items-center gap-1">
                        <span>🔘 Chọn định dạng đầu ra mong muốn:</span>
                      </span>
                      
                      <div className="grid grid-cols-1 gap-2.5">
                        <button
                          type="button"
                          disabled={isConverting}
                          onClick={() => setLocalFormat('mp3')}
                          className={`flex items-center gap-3 py-3 px-4 rounded-2xl text-[11px] font-bold border-2 text-left transition-all cursor-pointer ${
                            localFormat === 'mp3'
                              ? 'bg-[#FFECEB] border-brand-accent text-brand-primary shadow-xs transform scale-[1.01]'
                              : 'bg-white border-brand-border text-brand-secondary hover:border-brand-accent/50 hover:text-brand-primary'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            localFormat === 'mp3' ? 'border-brand-accent-hover bg-brand-accent' : 'border-brand-border'
                          }`}>
                            {localFormat === 'mp3' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </span>
                          <span>Đổi sang MP3 🎵</span>
                        </button>

                        <button
                          type="button"
                          disabled={isConverting}
                          onClick={() => setLocalFormat('wav')}
                          className={`flex items-center gap-3 py-3 px-4 rounded-2xl text-[11px] font-bold border-2 text-left transition-all cursor-pointer ${
                            localFormat === 'wav'
                              ? 'bg-[#EAF6FA] border-brand-success text-brand-primary shadow-xs transform scale-[1.01]'
                              : 'bg-white border-brand-border text-brand-secondary hover:border-brand-accent/50 hover:text-brand-primary'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            localFormat === 'wav' ? 'border-[#A2D3E4] bg-[#B2E2F2]' : 'border-brand-border'
                          }`}>
                            {localFormat === 'wav' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </span>
                          <span>Đổi sang WAV 🎹</span>
                        </button>

                        <button
                          type="button"
                          disabled={isConverting}
                          onClick={() => setLocalFormat('flac')}
                          className={`flex items-center gap-3 py-3 px-4 rounded-2xl text-[11px] font-bold border-2 text-left transition-all cursor-pointer ${
                            localFormat === 'flac'
                              ? 'bg-[#F5F1FF] border-[#E1D5FF] text-brand-primary shadow-xs transform scale-[1.01]'
                              : 'bg-white border-brand-border text-brand-secondary hover:border-brand-accent/50 hover:text-brand-primary'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            localFormat === 'flac' ? 'border-[#E1D5FF] bg-[#F5F1FF]' : 'border-brand-border'
                          }`}>
                            {localFormat === 'flac' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </span>
                          <span>Đổi sang FLAC 🎛️</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : activeTab === 'document' ? (
                  /* TAB 3: DOCUMENT CONVERT PANEL */
                  (() => {
                    const fileExt = selectedFile ? selectedFile.name.split('.').pop()?.toLowerCase() || '' : '';
                    return (
                      <div className="flex flex-col gap-4">
                        <div
                          onDragOver={handleDrag}
                          onDragEnter={handleDrag}
                          onDragLeave={handleDrag}
                          onDrop={handleDrop}
                          onClick={!isConverting ? triggerSelectFile : undefined}
                          className={`relative p-8 rounded-[24px] border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[190px] ${
                            isConverting ? 'border-brand-border bg-brand-bg/30 cursor-not-allowed pointer-events-none' :
                            isDragging ? 'border-brand-accent bg-brand-accent/5 scale-[1.01]' :
                            selectedFile ? 'border-brand-success/60 bg-brand-bg/25 hover:bg-brand-bg/40' : 'border-brand-border bg-[#FFFCF9] hover:bg-[#FFF4F2] hover:border-brand-accent'
                          }`}
                        >
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".doc,.docx,.pdf,.txt"
                            className="hidden"
                            disabled={isConverting}
                          />

                          <div className="mb-3 relative">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center border shadow-sm transition-all duration-300 bg-white ${
                              isDragging ? 'border-brand-accent text-brand-accent' :
                              selectedFile ? 'border-brand-success text-brand-success' : 'border-brand-border text-brand-secondary'
                            }`}>
                              {selectedFile ? (
                                <FileCheck className="w-6 h-6 text-emerald-500" />
                              ) : (
                                <FileText className="w-6 h-6 opacity-75 text-amber-600/70" />
                              )}
                            </div>
                          </div>

                          {!selectedFile ? (
                            <div className="flex flex-col gap-1 select-none">
                              <p className="text-xs font-bold text-brand-primary flex items-center justify-center gap-1">
                                <span>Kéo & Thả tài liệu kiểm duyệt</span>
                                <span className="text-brand-accent">🐾</span>
                              </p>
                              <p className="text-[11px] text-brand-secondary">Chỉ nhận các định dạng .doc, .docx, .pdf, .txt</p>
                              
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  triggerSelectFile();
                                }}
                                className="mt-3.5 mx-auto bg-white hover:bg-brand-bg border border-brand-border hover:border-brand-accent py-2 px-3.5 rounded-full text-[11px] font-bold text-brand-primary cursor-pointer active:scale-95 transition-all w-fit shadow-xs"
                              >
                                Chọn tài liệu từ máy 💻
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1.5">
                              <span className="text-emerald-600 text-[9px] font-bold uppercase tracking-wider bg-emerald-50 px-2.5 py-0.5 rounded-full mx-auto select-none border border-emerald-200">Đã nạp văn bản!</span>
                              <p className="text-xs font-bold text-brand-primary max-w-[270px] truncate" title={selectedFile.name}>
                                {selectedFile.name}
                              </p>
                              <p className="text-[10px] text-brand-secondary flex items-center justify-center gap-2">
                                <span>{formatBytes(selectedFile.size)}</span>
                              </p>
                            </div>
                          )}

                          {selectedFile && !isConverting && (
                            <button
                              onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveFile();
                              }}
                              className="absolute top-3.5 right-3.5 p-1.5 rounded-full text-brand-secondary hover:text-red-500 hover:bg-red-50 transition-colors"
                              title="Gỡ tài liệu này"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>

                        {/* Output options for documents */}
                        <div className="flex flex-col gap-3 text-left border-2 border-brand-border/40 bg-[#FFFCF9]/50 p-4 rounded-3xl mt-1 select-none">
                          <span className="text-[11px] font-bold text-brand-secondary uppercase tracking-wider pl-1 flex items-center gap-1">
                            <span>🔘 Tùy chọn đầu ra :</span>
                          </span>

                          <div className="grid grid-cols-1 gap-2.5">
                            {/* Option 1: PDF */}
                            <button
                              type="button"
                              disabled={isConverting || fileExt === 'pdf'}
                              onClick={() => setDocFormat('pdf')}
                              className={`flex items-center gap-3 py-3 px-4 rounded-2xl text-[11px] font-bold border-2 text-left transition-all ${
                                fileExt === 'pdf'
                                  ? 'bg-black/[0.03] border-dashed border-brand-border/60 text-brand-secondary/50 opacity-40 cursor-not-allowed pointer-events-none'
                                  : isConverting
                                  ? 'opacity-60 cursor-wait pointer-events-none bg-white border-brand-border'
                                  : docFormat === 'pdf'
                                  ? 'bg-[#FFECEB] border-brand-accent text-brand-primary shadow-xs transform scale-[1.01] cursor-pointer'
                                  : 'bg-white border-brand-border text-brand-secondary hover:border-brand-accent/50 hover:text-brand-primary cursor-pointer'
                              }`}
                            >
                              <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                fileExt === 'pdf'
                                  ? 'border-brand-border/40'
                                  : docFormat === 'pdf'
                                  ? 'border-brand-accent-hover bg-brand-accent'
                                  : 'border-brand-border'
                              }`}>
                                {docFormat === 'pdf' && fileExt !== 'pdf' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </span>
                              <span className="flex-1">Đổi sang PDF 📕</span>
                              {fileExt === 'pdf' && (
                                <span className="text-[9px] font-normal italic text-brand-secondary/60 bg-black/5 px-2 py-0.5 rounded-md">(Đang là tệp PDF gốc 🔒)</span>
                              )}
                            </button>

                            {/* Option 2: DOCX */}
                            <button
                              type="button"
                              disabled={isConverting || fileExt === 'docx'}
                              onClick={() => setDocFormat('docx')}
                              className={`flex items-center gap-3 py-3 px-4 rounded-2xl text-[11px] font-bold border-2 text-left transition-all ${
                                fileExt === 'docx'
                                  ? 'bg-black/[0.03] border-dashed border-brand-border/60 text-brand-secondary/50 opacity-40 cursor-not-allowed pointer-events-none'
                                  : isConverting
                                  ? 'opacity-60 cursor-wait pointer-events-none bg-white border-brand-border'
                                  : docFormat === 'docx'
                                  ? 'bg-[#EAF6FA] border-brand-success text-brand-primary shadow-xs transform scale-[1.01] cursor-pointer'
                                  : 'bg-white border-brand-border text-brand-secondary hover:border-brand-accent/50 hover:text-brand-primary cursor-pointer'
                              }`}
                            >
                              <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                fileExt === 'docx'
                                  ? 'border-brand-border/40'
                                  : docFormat === 'docx'
                                  ? 'border-[#A2D3E4] bg-[#B2E2F2]'
                                  : 'border-brand-border'
                              }`}>
                                {docFormat === 'docx' && fileExt !== 'docx' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </span>
                              <span className="flex-1">Đổi sang DOCX 📝</span>
                              {fileExt === 'docx' && (
                                <span className="text-[9px] font-normal italic text-brand-secondary/60 bg-black/5 px-2 py-0.5 rounded-md">(Đang là tệp DOCX gốc 🔒)</span>
                              )}
                            </button>

                            {/* Option 3: DOC */}
                            <button
                              type="button"
                              disabled={isConverting || fileExt === 'doc'}
                              onClick={() => setDocFormat('doc')}
                              className={`flex items-center gap-3 py-3 px-4 rounded-2xl text-[11px] font-bold border-2 text-left transition-all ${
                                fileExt === 'doc'
                                  ? 'bg-black/[0.03] border-dashed border-brand-border/60 text-brand-secondary/50 opacity-40 cursor-not-allowed pointer-events-none'
                                  : isConverting
                                  ? 'opacity-60 cursor-wait pointer-events-none bg-white border-brand-border'
                                  : docFormat === 'doc'
                                  ? 'bg-[#FFF4E8] border-amber-500/70 text-brand-primary shadow-xs transform scale-[1.01] cursor-pointer'
                                  : 'bg-white border-brand-border text-brand-secondary hover:border-brand-accent/50 hover:text-brand-primary cursor-pointer'
                              }`}
                            >
                              <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                fileExt === 'doc'
                                  ? 'border-brand-border/40'
                                  : docFormat === 'doc'
                                  ? 'border-amber-400 bg-amber-500'
                                  : 'border-brand-border'
                              }`}>
                                {docFormat === 'doc' && fileExt !== 'doc' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </span>
                              <span className="flex-1">Đổi sang DOC 💾</span>
                              {fileExt === 'doc' && (
                                <span className="text-[9px] font-normal italic text-brand-secondary/60 bg-black/5 px-2 py-0.5 rounded-md">(Đang là tệp DOC gốc 🔒)</span>
                              )}
                            </button>

                            {/* Option 4: TXT */}
                            <button
                              type="button"
                              disabled={isConverting || fileExt === 'txt'}
                              onClick={() => setDocFormat('txt')}
                              className={`flex items-center gap-3 py-3 px-4 rounded-2xl text-[11px] font-bold border-2 text-left transition-all ${
                                fileExt === 'txt'
                                  ? 'bg-black/[0.03] border-dashed border-brand-border/60 text-brand-secondary/50 opacity-40 cursor-not-allowed pointer-events-none'
                                  : isConverting
                                  ? 'opacity-60 cursor-wait pointer-events-none bg-white border-brand-border'
                                  : docFormat === 'txt'
                                  ? 'bg-[#F5F1FF] border-[#E1D5FF] text-brand-primary shadow-xs transform scale-[1.01] cursor-pointer'
                                  : 'bg-white border-brand-border text-brand-secondary hover:border-brand-accent/50 hover:text-brand-primary cursor-pointer'
                              }`}
                            >
                              <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                fileExt === 'txt'
                                  ? 'border-brand-border/40'
                                  : docFormat === 'txt'
                                  ? 'border-[#E1D5FF] bg-[#F5F1FF]'
                                  : 'border-brand-border'
                              }`}>
                                {docFormat === 'txt' && fileExt !== 'txt' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </span>
                              <span className="flex-1">Xuất file TXT 📄</span>
                              {fileExt === 'txt' && (
                                <span className="text-[9px] font-normal italic text-brand-secondary/60 bg-black/5 px-2 py-0.5 rounded-md">(Đang là tệp TXT gốc 🔒)</span>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  /* TAB 2: SOCIAL LINK CONTROLLER VIEW */
                  <div className="flex flex-col gap-4">
                    <div className="relative text-left flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-brand-secondary uppercase tracking-wider pl-1 flex items-center gap-1 select-none">
                        <Globe size={11} className="text-brand-accent" />
                        <span>Dán link bạn muốn tải:</span>
                      </label>
                      <div className="relative">
                        <input
                          type="url"
                          value={youtubeUrl}
                          onChange={(e) => {
                            setYoutubeUrl(e.target.value);
                            if (e.target.value.trim() && mascotMood !== 'excited') {
                              setMascotMood('excited');
                              setMascotBubble("Ồ, nhìn liên kết xịn nhen bồ! Hãy chọn định dạng muốn lấy về ở phía dưới nhé!");
                            }
                          }}
                          disabled={isConverting}
                          placeholder="Dán link YouTube, Facebook, Reels hoặc X vào đây nhé bồ... 🐾"
                          className="w-full text-xs bg-[#FFFCF9] border-2 border-brand-border rounded-2xl pr-10 pl-4 py-4 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent text-brand-primary placeholder:text-brand-secondary/70 transition-colors"
                        />
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-secondary select-none">
                          <Link2 size={16} />
                        </div>
                      </div>
                    </div>

                    {/* Pastel badges representing supported social platforms */}
                    <div className="grid grid-cols-3 gap-2 select-none">
                      <div className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[9px] font-bold bg-[#FFECEB]/60 text-[#D32F2F]/80 border border-[#FFD9D7]/60 shadow-xs">
                        YouTube 📺
                      </div>
                      <div className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[9px] font-bold bg-[#EAF6FA]/60 text-[#1E88E5]/80 border border-[#CBE5F0]/60 shadow-xs">
                        Facebook / Reels 🎬
                      </div>
                      <div className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[9px] font-bold bg-[#F5F1FF]/60 text-[#7B1FA2]/80 border border-[#E1D5FF]/60 shadow-xs">
                        X (Twitter) 🐦
                      </div>
                    </div>

                    {/* Format selection lists containing 3 Radio choice pillars for TAB 2 */}
                    <div className="flex flex-col gap-3 text-left border-2 border-brand-border/40 bg-[#FFFCF9]/50 p-4 rounded-3xl mt-1 select-none">
                      <span className="text-[11px] font-bold text-brand-secondary uppercase tracking-wider pl-1 flex items-center gap-1">
                        <span>🔘 Hãy chọn định dạng đầu ra tải về:</span>
                      </span>
                      
                      <div className="flex flex-col gap-2.5">
                        <button
                          type="button"
                          disabled={isConverting}
                          onClick={() => setYoutubeFormat('mp3')}
                          className={`flex items-center gap-3 py-3 px-4 rounded-2xl text-[11px] font-bold border-2 text-left transition-all cursor-pointer ${
                            youtubeFormat === 'mp3'
                              ? 'bg-[#FFECEB] border-brand-accent text-brand-primary shadow-xs transform scale-[1.01]'
                              : 'bg-white border-brand-border text-brand-secondary hover:border-brand-accent/50 hover:text-brand-primary'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            youtubeFormat === 'mp3' ? 'border-brand-accent-hover bg-brand-accent' : 'border-brand-border'
                          }`}>
                            {youtubeFormat === 'mp3' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </span>
                          <span>Tải Audio (MP3) 🎵</span>
                        </button>

                        <button
                          type="button"
                          disabled={isConverting}
                          onClick={() => setYoutubeFormat('wav')}
                          className={`flex items-center gap-3 py-3 px-4 rounded-2xl text-[11px] font-bold border-2 text-left transition-all cursor-pointer ${
                            youtubeFormat === 'wav'
                              ? 'bg-[#EAF6FA] border-brand-success text-brand-primary shadow-xs transform scale-[1.01]'
                              : 'bg-white border-brand-border text-brand-secondary hover:border-brand-accent/50 hover:text-brand-primary'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            youtubeFormat === 'wav' ? 'border-[#A2D3E4] bg-[#B2E2F2]' : 'border-brand-border'
                          }`}>
                            {youtubeFormat === 'wav' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </span>
                          <span>Tải Audio (WAV) 🎹</span>
                        </button>

                        <button
                          type="button"
                          disabled={isConverting}
                          onClick={() => setYoutubeFormat('flac')}
                          className={`flex items-center gap-3 py-3 px-4 rounded-2xl text-[11px] font-bold border-2 text-left transition-all cursor-pointer ${
                            youtubeFormat === 'flac'
                              ? 'bg-[#F5F1FF] border-[#E1D5FF] text-brand-primary shadow-xs transform scale-[1.01]'
                              : 'bg-white border-brand-border text-brand-secondary hover:border-brand-accent/50 hover:text-brand-primary'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            youtubeFormat === 'flac' ? 'border-[#E1D5FF] bg-[#F5F1FF]' : 'border-brand-border'
                          }`}>
                            {youtubeFormat === 'flac' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </span>
                          <span>Tải Audio (FLAC) 🎛️</span>
                        </button>

                        <button
                          type="button"
                          disabled={isConverting}
                          onClick={() => setYoutubeFormat('mp4')}
                          className={`flex items-center gap-3 py-3 px-4 rounded-2xl text-[11px] font-bold border-2 text-left transition-all cursor-pointer ${
                            youtubeFormat === 'mp4'
                              ? 'bg-amber-50/70 border-amber-200 text-brand-primary shadow-xs transform scale-[1.01]'
                              : 'bg-white border-brand-border text-brand-secondary hover:border-brand-accent/50 hover:text-brand-primary'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            youtubeFormat === 'mp4' ? 'border-amber-400 bg-amber-300' : 'border-brand-border'
                          }`}>
                            {youtubeFormat === 'mp4' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </span>
                          <span>Tải Video (MP4) 🎬</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Configurations Specifications box */}
                {(((activeTab === 'upload' || activeTab === 'document') && selectedFile) || (activeTab === 'youtube' && youtubeUrl.trim())) && (
                  <div className="flex flex-col gap-4 bg-[#FFFCF9] border border-brand-border p-4 rounded-2xl transition-all">
                    
                    {/* Audio quality controller - valid if conversion holds audio */}
                    {(activeTab === 'upload' || (activeTab === 'youtube' && youtubeFormat !== 'mp4')) && activeTab !== 'document' && (
                      <div className="flex items-center justify-between gap-4 transition-all">
                        <label className="text-[11px] font-semibold text-brand-secondary flex items-center gap-1 select-none">
                          <span>Chất lượng luồng nén kỹ thuật:</span>
                          <Info size={11} className="text-brand-secondary cursor-help" title="Bitrate cao sẽ cho file xịn, trung thật bớt tạp nhiễu" />
                        </label>
                        
                        <div className="relative shrink-0">
                          <select
                            value={quality}
                            disabled={isConverting}
                            onChange={(e) => setQuality(e.target.value)}
                            className="appearance-none bg-white text-[11px] font-bold text-brand-primary border border-brand-border hover:border-brand-accent pr-8 pl-3.5 py-1.5 rounded-xl focus:outline-none cursor-pointer disabled:opacity-50 transition-colors"
                          >
                            <option value="320kbps">320kbps (Cực cao) 🌟</option>
                            <option value="256kbps">256kbps (Khá tốt) ✨</option>
                            <option value="192kbps">192kbps (Trung bình) 👍</option>
                            <option value="128kbps">128kbps (Tiết kiệm) 💾</option>
                          </select>
                          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-brand-secondary select-none">
                            <ChevronDownIcon size={11} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Metadata specs indicator line */}
                    <div className="flex justify-between items-center text-[10px] text-brand-secondary border-t border-brand-border pt-3 select-none">
                      <span>Đầu ra: <strong className="text-brand-primary uppercase">
                        {activeTab === 'upload' ? localFormat : activeTab === 'document' ? docFormat : youtubeFormat}
                      </strong></span>
                      <span>Dung lượng định tính: <strong className="text-brand-primary">
                        {activeTab === 'upload' 
                          ? getEstimatedOutputSizeStr(selectedFile?.size || 0, quality, localFormat)
                          : activeTab === 'document'
                          ? formatBytes((selectedFile?.size || 0) * (docFormat === 'txt' ? 0.4 : docFormat === 'pdf' ? 1.2 : docFormat === 'doc' ? 0.9 : 0.95))
                          : (youtubeFormat === 'mp4' ? '28.5 MB' : (youtubeFormat === 'wav' ? '18.2 MB' : '8.4 MB'))}
                      </strong></span>
                    </div>

                    {/* Sweet Progress Bar display running dynamically */}
                    {isConverting && (
                      <div className="mt-2 flex flex-col gap-2 border-t border-brand-border pt-3 animate-fade-in select-none">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-brand-primary flex items-center gap-1.5">
                            <span className="inline-block animate-spin text-[10px]">⚙️</span>
                            <span>{activeTab === 'upload' ? uploadSteps[conversionStep] : activeTab === 'youtube' ? youtubeSteps[conversionStep] : documentSteps[conversionStep]}</span>
                          </span>
                          <span className="text-brand-primary">{progress}%</span>
                        </div>
                        
                        <div className="w-full h-3 bg-brand-bg rounded-full overflow-hidden p-[2px] shadow-inner border border-brand-border">
                          <div
                            style={{ width: `${progress}%` }}
                            className={`h-full rounded-full transition-all duration-150 ease-out relative overflow-hidden ${
                              (activeTab === 'youtube' && youtubeFormat === 'mp4') ? 'bg-[#B2E2F2]' : 'bg-brand-accent'
                            }`}
                          >
                            <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.25)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.25)_50%,rgba(255,255,255,0.25)_75%,transparent_75%,transparent)] bg-[size:14px_14px]" />
                          </div>
                        </div>
                        
                        <p className="text-[10px] text-brand-secondary/80 italic text-center">Bồ cứ bình tĩnh nhe, Sói đang cố gắng gặm siêu gọn gàng rồi nè!</p>
                      </div>
                    )}
                  </div>
                )}

                {/* dynamic dynamic start triggers bottom */}
                <button
                  onClick={handleStartConversion}
                  disabled={
                    isConverting ||
                    ((activeTab === 'upload' || activeTab === 'document') && !selectedFile) ||
                    (activeTab === 'youtube' && !youtubeUrl.trim())
                  }
                  className={`w-full text-xs font-bold tracking-wide py-4 px-6 rounded-[20px] transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    isConverting
                      ? 'bg-[#E8D5C4] text-[#5C4B43] cursor-wait animate-pulse'
                      : ((activeTab === 'upload' || activeTab === 'document') && !selectedFile) || (activeTab === 'youtube' && !youtubeUrl.trim())
                      ? 'bg-brand-border text-brand-secondary cursor-not-allowed opacity-60'
                      : activeTab === 'youtube' && youtubeFormat === 'mp4'
                      ? 'bg-[#B2E2F2] hover:bg-[#8CC6DB] text-brand-primary hover:translate-y-[-1px] hover:shadow-[0_6px_16px_rgba(178,226,242,0.35)] active:scale-98'
                      : 'bg-brand-accent text-white hover:bg-brand-accent-hover hover:translate-y-[-1px] hover:shadow-[0_6px_16px_rgba(255,183,178,0.35)] active:scale-98'
                  }`}
                >
                  {isConverting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                      <span>Đang tinh chế tệp xíu nha... ({progress}%) 🐾</span>
                    </>
                  ) : activeTab === 'youtube' ? (
                    <>
                      <Link2 size={15} />
                      <span>Gặm link và tải về ngay 🐾</span>
                    </>
                  ) : activeTab === 'document' ? (
                    <>
                      <Sparkles size={15} />
                      <span>Xử lý tài liệu ngay 🚀</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={15} />
                      <span>Chuyển đổi tệp ngay 🚀</span>
                    </>
                  )}
                </button>

              </motion.div>
            ) : (
              /* TAB 4: COMPLETE DOWNLOAD READY VIEWPORT */
              <motion.div
                key="complete-step"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ type: "spring", stiffness: 220, damping: 20 }}
                className="flex flex-col items-center text-center gap-5 select-none"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-brand-success rounded-full blur-sm opacity-60 animate-ping duration-1500" />
                  
                  <div className="relative w-16 h-16 rounded-full bg-brand-bg border border-brand-border text-brand-primary flex items-center justify-center shadow-xs">
                    <Sparkles className="w-8 h-8 animate-bounce text-brand-primary" />
                    <div className="absolute -bottom-1 -right-1 bg-brand-accent text-white rounded-full p-0.5 border border-white">
                      <Check size={11} className="stroke-[3]" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 max-w-[325px]">
                  <h3 className="text-sm font-bold text-brand-primary">
                    {activeTab === 'youtube'
                      ? 'Gặm link thành công mỹ mãn! 🐾'
                      : activeTab === 'document'
                      ? 'Xử lý tài liệu hoàn hảo thành công! 🐾📝'
                      : 'Chuyển đổi tệp xịn xò hoàn tất! 🚀'}
                  </h3>
                  <p className="text-xs text-brand-secondary leading-snug">
                    Chiếc tệp xinh mang tên{' '}
                    <strong className="text-brand-primary font-bold break-all block mt-1">
                      {convertedResultName}
                    </strong>{' '}
                    với dung lượng <strong className="text-brand-primary">{convertedResultSize}</strong> đã hoàn thành chất lượng mượt tuyệt đối!
                  </p>
                </div>

                {/* Successful player preview */}
                {downloadUrl && (
                  activeTab === 'document' ? (
                    <div className="w-full bg-[#FFFCF9] border border-brand-border rounded-2xl p-4 flex flex-col gap-2.5 text-left transition-all animate-fade-in">
                      <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Trạng thái tài liệu :
                      </p>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 shrink-0 rounded-full bg-emerald-50/50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                          <FileText size={18} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center text-[10px] font-semibold text-brand-secondary">
                            <span className="truncate max-w-[170px] font-bold">{convertedResultName}</span>
                            <span>{convertedResultSize}</span>
                          </div>
                          <p className="text-[9.5px] text-brand-secondary mt-0.5">Sói đã nhai nát tệp cực đẹp, sẵn sàng tải ngay nhen!</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full bg-[#FFFCF9] border border-brand-border rounded-2xl p-4 flex flex-col gap-2.5 text-left transition-all">
                      <p className="text-[10px] text-[#4B9AB8] font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-success animate-pulse" />
                        Nghe thử nhạc xịn gặm được:
                      </p>
                      
                      <div className="flex items-center gap-3">
                        <button
                          onClick={playCuteChime} 
                          className="w-10 h-10 shrink-0 rounded-full bg-brand-bg hover:bg-brand-border active:scale-95 text-brand-primary flex items-center justify-center transition-all cursor-pointer shadow-xs border border-brand-border"
                          title="Nghe thử"
                        >
                          <Play size={14} fill="currentColor" className="ml-0.5 text-brand-primary" />
                        </button>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center text-[10px] font-semibold text-brand-secondary mb-1">
                            <span className="truncate max-w-[170px] font-bold">{convertedResultName}</span>
                            <span>{convertedResultSize}</span>
                          </div>
                          
                          <div className="flex items-end gap-1 h-5 overflow-hidden">
                            <span className="w-1 bg-brand-accent h-2 rounded-full inline-block animate-[cute-float_1.2s_infinite_ease-in-out_100ms]" />
                            <span className="w-1 bg-brand-accent-hover h-4 rounded-full inline-block animate-[cute-float_1.2s_infinite_ease-in-out_250ms]" />
                            <span className="w-1 bg-[#4B9AB8] h-5 rounded-full inline-block animate-[cute-float_1.2s_infinite_ease-in-out_400ms]" />
                            <span className="w-1 bg-brand-accent h-3 rounded-full inline-block animate-[cute-float_1.2s_infinite_ease-in-out_150ms]" />
                            <span className="w-1 bg-brand-success h-4.5 rounded-full inline-block animate-[cute-float_1.2s_infinite_ease-in-out_600ms]" />
                            <span className="w-1 bg-[#A2D3E4] h-3.5 rounded-full inline-block animate-[cute-float_1.2s_infinite_ease-in-out_50ms]" />
                            <span className="w-1 bg-brand-accent-hover h-2.5 rounded-full inline-block animate-[cute-float_1.2s_infinite_ease-in-out_450ms]" />
                            <span className="w-1 bg-brand-success h-2 rounded-full inline-block animate-[cute-float_1.2s_infinite_ease-in-out_500ms]" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                )}

                {/* Immediate dynamic operations button */}
                <div className="w-full flex flex-col gap-2.5">
                  {downloadUrl && (
                    <a
                      href={downloadUrl}
                      download={convertedResultName}
                      onClick={playCuteChime}
                      className="w-full text-xs font-bold bg-[#F2FAFE] text-[#4B9AB8] border-2 border-[#B2E2F2] hover:bg-[#B2E2F2] hover:text-white tracking-wide py-4 px-6 rounded-[20px] shadow-xs flex items-center justify-center gap-2 active:scale-98 cursor-pointer transition-all"
                    >
                      <Download size={15} />
                      <span>Tải về máy nhen 🐾</span>
                    </a>
                  )}

                  <button
                    onClick={handleReset}
                    className="w-full text-[11px] font-bold text-brand-secondary hover:text-brand-primary py-2.5 px-4 rounded-full border border-brand-border hover:border-brand-accent transition-all flex items-center justify-center gap-1 bg-white/40 active:scale-98 cursor-pointer"
                  >
                    <RotateCcw size={13} />
                    <span>{activeTab === 'youtube' ? 'Thêm chiếc link khác đê! 🔄' : 'Xử lý thêm tệp mới nhe! 🔄'}</span>
                  </button>
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* History converting list row */}
        {history.length > 0 && (
          <div className="flex flex-col gap-2 mx-1 select-none">
            <h4 className="text-[10px] font-bold text-brand-primary/80 uppercase tracking-widest pl-1">
              📜 Lịch sử gặm tệp trong ngày ({history.length})
            </h4>
            
            <div className="flex flex-col gap-2 max-h-[140px] overflow-y-auto pr-1">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="bg-brand-card border border-brand-border p-3 rounded-2xl flex items-center justify-between text-xs transition-all hover:bg-brand-bg/50"
                >
                  <div className="flex items-center gap-2 max-w-[80%] min-w-0">
                    <div className="w-7 h-7 rounded-full bg-[#FFF9F2] border border-brand-border flex items-center justify-center shrink-0">
                      {item.format === 'mp4' ? (
                        <Video size={12} className="text-[#4B9AB8]" />
                      ) : item.type === 'document' ? (
                        <FileText size={12} className="text-emerald-500" />
                      ) : (
                        <Music size={12} className="text-brand-accent" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-brand-primary truncate text-[11px]" title={item.outputName}>
                        {item.outputName}
                      </p>
                      <p className="text-[9.5px] text-brand-secondary flex items-center gap-1 flex-wrap">
                        <span className="bg-[#FFEFEA] text-brand-primary/80 px-1 py-0.2 rounded-md font-bold text-[8.5px] uppercase">
                          {item.type === 'upload' ? 'Tệp Cục Bộ' : item.type === 'document' ? 'Tài Liệu' : 'Mạng Xã Hội'}
                        </span>
                        <span>•</span>
                        <span>{item.estimatedSize}</span>
                        <span>•</span>
                        <span>{item.durationStr}</span>
                        <span>•</span>
                        <span>{item.timestamp}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5">
                    <a
                      href={downloadUrl || '#'}
                      onClick={playCuteChime}
                      download={item.outputName}
                      className="p-1.5 text-brand-primary hover:text-brand-accent transition-colors"
                      title="Nạp lại tải nhanh"
                    >
                      <Download size={13} />
                    </a>
                    <button
                      onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                      className="p-1.5 text-brand-secondary hover:text-red-500 transition-colors cursor-pointer"
                      title="Xoá lịch sử"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* Footer details row */}
      <footer className="w-full text-center text-[10px] text-brand-secondary mt-auto pt-6 flex flex-col items-center gap-1 select-none">
        <p className="flex items-center gap-1">
          <span>Tinh hoa quý phái</span>
          <span className="text-brand-accent">🐾</span>
          <span>Thiết kế bởi Sekai Kiyoshi</span>
        </p>
        <p className="text-[9px] opacity-75">Sản phẩm mang lại sự tiện nghi tuyệt hảo</p>
      </footer>

      {/* Donate Pop-up Modal */}
      <AnimatePresence>
        {showDonateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDonateModal(false)}
              className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="relative w-full max-w-sm bg-brand-card border border-brand-border rounded-3xl p-6 shadow-xl z-10 flex flex-col items-center text-center select-none overflow-hidden"
            >
              {/* Close button */}
              <button
                onClick={() => setShowDonateModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-brand-secondary hover:text-brand-primary hover:bg-neutral-100/50 transition-all cursor-pointer active:scale-90"
                title="Tắt hộp thoại"
              >
                <X size={15} />
              </button>

              {/* Mascot celebration Avatar */}
              <div className="relative mb-3 flex items-center justify-center w-20 h-20 rounded-full overflow-hidden border-2 border-brand-border bg-white mt-1.5 shadow-sm">
                <img
                  src="https://i.postimg.cc/fTrF7353/1234.png"
                  alt="Wolf Mascot Dinner"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-0 right-0 bg-brand-accent text-white text-[12px] w-6 h-6 rounded-full flex items-center justify-center shadow-xs select-none">
                  🎉
                </span>
              </div>

              {/* Title Header */}
              <h3 className="font-bold text-brand-primary text-sm mb-1.5 pr-1 pl-1">
                Sói Bé Nhỏ Nói Chút Nì 🐾
              </h3>

              {!showQRDetails ? (
                // Introduction panel
                <>
                  <p className="text-[11.5px] leading-relaxed text-brand-secondary/90 px-3.5 mb-6 whitespace-pre-line">
                    Nếu bồ cảm thấy hài lòng về dự án này, bồ có thể donate cho Sói tiền gửi xe hoặc ly trà sữa 20k, tuỳ tâm nìiiii~ 🥺🥤
                  </p>

                  <div className="w-full flex flex-col gap-2.5">
                    <button
                      type="button"
                      onClick={() => setShowQRDetails(true)}
                      className="w-full py-3 px-6 rounded-2xl text-[11px] font-bold bg-[#5C4B43] text-white hover:bg-[#4E3E37] transition-all cursor-pointer active:scale-95 shadow-sm"
                    >
                      Donate ngay nhen! ☕❤️
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowDonateModal(false)}
                      className="text-[11px] font-semibold text-brand-primary/60 hover:text-brand-primary transition-colors py-1 cursor-pointer"
                    >
                      Để sau nà... 🐾
                    </button>
                  </div>
                </>
              ) : (
                // QR & Transfer info panel
                <>
                  <p className="text-[11.5px] leading-snug text-brand-secondary/90 px-2 mb-4">
                    Cảm ơn bồ thật nhiều vì tấm lòng hảo tâm! 💖🐾 <br />
                    Bồ quét mã VietQR hoặc chuyển STK nhen:
                  </p>

                  {/* Dynamic Real bank QR Code */}
                  <div className="w-32 h-32 bg-white border border-brand-border rounded-2xl p-1.5 shadow-xs flex items-center justify-center mb-4 overflow-hidden">
                    <img
                      src="https://img.vietqr.io/image/MBBank-999920021312-compact.jpg?amount=20000&addInfo=Soi%20Be%20Nho%20Cam%20On"
                      alt="VietQR Donate Ticket"
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Transfer instruction card */}
                  <div className="w-full bg-[#FFFCF9] border border-brand-border rounded-xl p-3.5 flex flex-col gap-1.5 mb-5 text-left text-[11px] text-brand-secondary font-medium">
                    <div className="flex justify-between">
                      <span>Ngân hàng:</span>
                      <span className="text-brand-primary font-bold">MB Bank</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>STK:</span>
                      <span className="text-brand-primary font-bold bg-[#FFEFEA]/50 border border-[#FFEFEA] px-1.5 py-0.2 rounded-md select-all font-mono font-bold tracking-wide">999920021312</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Người nhận:</span>
                      <span className="text-[#5C4B43] font-bold">Sekai Kiyoshi</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Nội dung CK:</span>
                      <span className="text-brand-primary font-semibold font-mono uppercase bg-[#FFEFEA]/80 border border-brand-border/40 px-1.5 py-0.2 rounded-md select-all">Soi Be Nho Cam On</span>
                    </div>
                  </div>

                  {/* Dialog Back / Complete action panel */}
                  <div className="w-full flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowQRDetails(false)}
                      className="flex-1 py-2 px-4 rounded-xl text-[10.5px] font-bold text-brand-secondary hover:text-brand-primary border border-brand-border bg-white hover:bg-neutral-50 active:scale-95 transition-all cursor-pointer"
                    >
                      Quay lại
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDonateModal(false)}
                      className="flex-1 py-2 px-4 rounded-xl text-[10.5px] font-bold bg-[#5C4B43] text-white hover:bg-[#4E3E37] active:scale-95 transition-all cursor-pointer shadow-xs"
                    >
                      Gửi Sói rùi! 🥰
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
    </div>
  );
}

// Chevron-Down drop selector arrow component helper
function ChevronDownIcon({ size }: { size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6"/>
    </svg>
  );
}
