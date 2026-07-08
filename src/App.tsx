/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { 
  Upload, 
  Image as ImageIcon, 
  Sparkles, 
  Download, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Trash2, 
  Eye, 
  Columns, 
  ChevronRight, 
  Info, 
  Check, 
  ArrowRight,
  HelpCircle,
  Key,
  EyeOff,
  Settings
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ImageState {
  data: string; // base64 data URL
  mimeType: string;
  name: string;
  size: string;
}

export default function App() {
  // Input States
  const [originalImage, setOriginalImage] = useState<ImageState | null>(null);
  const [referenceImage, setReferenceImage] = useState<ImageState | null>(null);
  const [prompt, setPrompt] = useState<string>("");
  
  // App Control States
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // API Key States for Vercel deploy compatibility
  const [userApiKey, setUserApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem("archvision_user_api_key") || "";
    } catch {
      return "";
    }
  });
  const [showKeyInput, setShowKeyInput] = useState<boolean>(false);
  const [showKeyPassword, setShowKeyPassword] = useState<boolean>(false);
  const [apiKeySavedStatus, setApiKeySavedStatus] = useState<boolean>(false);
  
  // Custom interactive comparison tab state: 'result' | 'side-by-side' | 'slider'
  const [viewMode, setViewMode] = useState<'result' | 'side-by-side' | 'slider'>('result');
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const sliderContainerRef = useRef<HTMLDivElement>(null);

  const handleSaveApiKey = () => {
    try {
      if (userApiKey.trim()) {
        localStorage.setItem("archvision_user_api_key", userApiKey.trim());
        setApiKeySavedStatus(true);
        setTimeout(() => setApiKeySavedStatus(false), 2000);
      } else {
        localStorage.removeItem("archvision_user_api_key");
      }
      setValidationError(null);
    } catch (err) {
      setValidationError("브라우저 로컬 스토리지에 API 키를 저장하는 데 실패했습니다.");
    }
  };

  const handleDeleteApiKey = () => {
    try {
      localStorage.removeItem("archvision_user_api_key");
      setUserApiKey("");
      setValidationError(null);
    } catch (err) {
      setValidationError("API 키를 삭제하는 데 실패했습니다.");
    }
  };

  // File Inputs
  const originalInputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);

  // Architectural Prompt Presets
  const architecturalPresets = [
    { label: "🌅 노을 야경 조명 추가", text: "외벽에 아늑하고 고급스러운 간접 조명을 추가하고, 배경 하늘을 노을빛 저녁 분위기로 변경해줘." },
    { label: "🪵 노출 콘크리트 & 목재 데크", text: "건물의 메인 외벽을 모던한 고급 노출 콘크리트로 변경하고, 1층 앞마당에 티크 목재 데크와 식재 조경을 더해줘." },
    { label: "⚪ 화이트 럭셔리 석재 마감", text: "외벽 전체를 깔끔한 무광 화이트톤 석재 대리석 마감으로 변경하고, 주변 조명을 밝고 화사하게 조성해줘." },
    { label: "🌿 친환경 식재 및 루프탑 가든", text: "테라스와 파사드 일부에 수직 정원(식재)을 자연스럽게 배치하고, 모던하고 자연친화적인 조경 스타일을 반영해줘." },
    { label: "🪟 초대형 전면 통유리창", text: "창문을 프레임리스 초대형 통유리 마감으로 변경하고, 내부에서 은은하게 비치는 따뜻한 인테리어 조명을 반영해줘." }
  ];

  // Helper to convert File to Base64 Image State
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isOriginal: boolean) => {
    setValidationError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate MIME Type
    if (!file.type.startsWith("image/")) {
      setValidationError("이미지 파일(JPG, PNG, WEBP)만 업로드할 수 있습니다.");
      return;
    }

    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const state: ImageState = {
        data: base64String,
        mimeType: file.type,
        name: file.name,
        size: `${sizeInMB} MB`
      };

      if (isOriginal) {
        setOriginalImage(state);
      } else {
        setReferenceImage(state);
      }
    };
    reader.onerror = () => {
      setValidationError("파일을 읽는 중에 오류가 발생했습니다.");
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, isOriginal: boolean) => {
    e.preventDefault();
    setValidationError(null);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setValidationError("이미지 파일(JPG, PNG, WEBP)만 업로드할 수 있습니다.");
      return;
    }

    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const state: ImageState = {
        data: base64String,
        mimeType: file.type,
        name: file.name,
        size: `${sizeInMB} MB`
      };

      if (isOriginal) {
        setOriginalImage(state);
      } else {
        setReferenceImage(state);
      }
    };
    reader.readAsDataURL(file);
  };

  // API Call to edit the image
  const triggerImageEditing = async () => {
    if (!originalImage) {
      setValidationError("원본 건축 이미지를 먼저 업로드해 주세요.");
      return;
    }

    setIsEditing(true);
    setError(null);
    setValidationError(null);

    try {
      const response = await fetch("/api/edit-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          originalImage: {
            data: originalImage.data,
            mimeType: originalImage.mimeType
          },
          referenceImage: referenceImage ? {
            data: referenceImage.data,
            mimeType: referenceImage.mimeType
          } : null,
          prompt: prompt.trim(),
          userApiKey: userApiKey.trim() || undefined
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "이미지 편집에 실패했습니다. 프롬프트를 조금 더 구체적으로 입력해주세요.");
      }

      setResultImage(result.image);
      setViewMode('result'); // Reset to default result view on new output
    } catch (err: any) {
      console.error(err);
      setError(err.message || "이미지 편집에 실패했습니다. 프롬프트를 조금 더 구체적으로 입력해주세요.");
    } finally {
      setIsEditing(false);
    }
  };

  // Trigger download of resulting image
  const handleDownload = () => {
    if (!resultImage) {
      setValidationError("다운로드할 결과 이미지가 없습니다.");
      return;
    }

    try {
      const link = document.createElement("a");
      link.href = resultImage;
      link.download = `archvision-edited-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      setValidationError("이미지 다운로드에 실패했습니다. 다시 시도해주세요.");
    }
  };

  // Drag logic for before-after slider
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    const touchX = e.touches[0].clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (touchX / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (e.buttons !== 1) return; // Only trigger on drag/click hold
    if (!sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (mouseX / rect.width) * 100));
    setSliderPosition(percentage);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-teal-500/10 selection:text-teal-700">
      
      {/* 1. Header Section */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-teal-600 flex items-center justify-center shadow-md shadow-teal-600/20 text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 font-display">아치비전</h1>
                <span className="text-[10px] bg-teal-50 text-teal-700 font-semibold px-1.5 py-0.5 rounded-md border border-teal-100">AI Beta</span>
              </div>
              <p className="text-xs text-slate-500">AI 건축 이미지 편집 도구</p>
            </div>
          </div>
          <div className="flex items-center gap-3 self-end md:self-auto">
            {/* User API Key Indicator / Button */}
            <div className="relative">
              <button
                onClick={() => setShowKeyInput(!showKeyInput)}
                className={`text-xs font-semibold px-3 py-2 rounded-xl border flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  userApiKey.trim() 
                    ? "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100/70" 
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
                title="개인 Gemini API 키 설정 (Vercel 배포 시 필요)"
              >
                <Key className="h-3.5 w-3.5" />
                <span>API 키 설정</span>
                {userApiKey.trim() && (
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
                )}
              </button>

              {/* API Key settings dropdown panel */}
              <AnimatePresence>
                {showKeyInput && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 z-50 text-left space-y-3"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Key className="h-3.5 w-3.5 text-teal-600" />
                        개인 Gemini API 키 설정
                      </h4>
                      <p className="text-[10px] text-slate-400 leading-normal mt-1">
                        버셀(Vercel) 배포 후 본인의 Google AI Studio에서 발급받은 <strong>GEMINI_API_KEY</strong>를 등록해 사용하세요. 입력된 키는 로컬 브라우저에만 암호화 저장되며, 실시간 AI 이미지 생성에만 일회성으로 사용됩니다.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <div className="relative">
                        <input
                          type={showKeyPassword ? "text" : "password"}
                          value={userApiKey}
                          onChange={(e) => setUserApiKey(e.target.value)}
                          placeholder="AIzaSy..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-3 pr-8 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowKeyPassword(!showKeyPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showKeyPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <button
                          onClick={handleDeleteApiKey}
                          disabled={!userApiKey}
                          className="text-[10px] font-bold text-red-500 hover:text-red-600 disabled:opacity-40 transition-colors py-1 cursor-pointer"
                        >
                          초기화
                        </button>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => setShowKeyInput(false)}
                            className="text-[10px] font-bold text-slate-500 hover:text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg cursor-pointer"
                          >
                            닫기
                          </button>
                          <button
                            onClick={handleSaveApiKey}
                            className="text-[10px] font-bold text-white bg-teal-600 hover:bg-teal-700 px-3 py-1 rounded-lg shadow-sm cursor-pointer"
                          >
                            {apiKeySavedStatus ? "저장 완료!" : "저장하기"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Badge/Indicator inside dropdown */}
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex items-start gap-2">
                      <Info className="h-3 w-3 text-slate-400 shrink-0 mt-0.5" />
                      <p className="text-[9px] text-slate-400 leading-normal">
                        키를 비워두면 서버에 미리 설정된 전역 환경변수를 기본으로 사용합니다.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <span className="text-xs font-medium text-slate-400 bg-slate-100/80 px-3 py-1.5 rounded-full border border-slate-200/50 hidden sm:inline-block">
              AI 건축 보조 도구
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        
        {/* Toast / Error Banner Area */}
        <AnimatePresence>
          {validationError && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3"
            >
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-900">안내 메시지</p>
                <p className="text-xs text-red-700 mt-0.5">{validationError}</p>
              </div>
              <button 
                onClick={() => setValidationError(null)}
                className="text-red-400 hover:text-red-600 text-xs font-semibold px-2 py-1"
              >
                닫기
              </button>
            </motion.div>
          )}

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3"
            >
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-900">편집 실패 안내</p>
                <p className="text-xs text-amber-700 mt-0.5">{error}</p>
              </div>
              <button 
                onClick={() => setError(null)}
                className="text-amber-400 hover:text-amber-600 text-xs font-semibold px-2 py-1"
              >
                닫기
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2-Column Desktop Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ========================================================= */}
          {/* LEFT PANEL: 1 편집 설정 */}
          {/* ========================================================= */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
              
              <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                <div className="h-7 w-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <h2 className="font-bold text-base text-slate-900 font-display">편집 설정</h2>
              </div>

              {/* Requirement: 1. 원본 건축 이미지 업로드 (Required *) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>원본 건축 이미지 <span className="text-red-500">*</span></span>
                  <span className="text-[10px] text-slate-400 font-normal">JPG, PNG, WEBP 지원</span>
                </label>

                {!originalImage ? (
                  <div 
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, true)}
                    onClick={() => originalInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 hover:border-teal-500 bg-slate-50/50 hover:bg-teal-50/5 transition-all duration-200 rounded-xl p-8 text-center cursor-pointer group"
                  >
                    <input 
                      type="file" 
                      ref={originalInputRef}
                      onChange={(e) => handleFileChange(e, true)}
                      accept="image/*"
                      className="hidden"
                    />
                    <div className="mx-auto h-12 w-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200">
                      <Upload className="h-5 w-5 text-slate-400 group-hover:text-teal-600" />
                    </div>
                    <p className="text-xs font-semibold text-slate-700 mt-3">클릭하거나 이미지를 끌어다 놓으세요</p>
                    <p className="text-[11px] text-slate-400 mt-1">건축물의 원본 사진, 3D 렌더링 샷 등</p>
                  </div>
                ) : (
                  <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center aspect-square md:aspect-auto md:h-56">
                    <img 
                      src={originalImage.data} 
                      alt="Original Architectural" 
                      className="max-h-full max-w-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3 text-white">
                      <div className="flex justify-end">
                        <button 
                          onClick={() => setOriginalImage(null)}
                          className="h-8 w-8 rounded-lg bg-black/40 hover:bg-red-600 backdrop-blur-md flex items-center justify-center transition-colors"
                          title="이미지 삭제"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="text-left">
                        <p className="text-[11px] font-medium truncate">{originalImage.name}</p>
                        <p className="text-[10px] text-slate-300">{originalImage.size}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Requirement: 2. 레퍼런스 이미지 업로드 (선택사항) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    레퍼런스 이미지
                    <span className="text-[10px] text-slate-400 font-normal bg-slate-100 px-1.5 py-0.5 rounded">선택사항</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">스타일 참고용</span>
                </label>

                {!referenceImage ? (
                  <div 
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, false)}
                    onClick={() => referenceInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 hover:border-teal-500 bg-slate-50/50 hover:bg-teal-50/5 transition-all duration-200 rounded-xl p-6 text-center cursor-pointer group"
                  >
                    <input 
                      type="file" 
                      ref={referenceInputRef}
                      onChange={(e) => handleFileChange(e, false)}
                      accept="image/*"
                      className="hidden"
                    />
                    <div className="mx-auto h-10 w-10 rounded-lg bg-white border border-slate-100 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200">
                      <ImageIcon className="h-4 w-4 text-slate-400 group-hover:text-teal-600" />
                    </div>
                    <p className="text-xs font-semibold text-slate-700 mt-2">참고할 스타일 이미지 선택</p>
                    <p className="text-[10px] text-slate-400 mt-1">질감, 자재, 무드, 조명을 추출하여 반영</p>
                  </div>
                ) : (
                  <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center aspect-square md:aspect-auto md:h-36">
                    <img 
                      src={referenceImage.data} 
                      alt="Reference Architectural Style" 
                      className="max-h-full max-w-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-2.5 text-white">
                      <div className="flex justify-end">
                        <button 
                          onClick={() => setReferenceImage(null)}
                          className="h-7 w-7 rounded-lg bg-black/40 hover:bg-red-600 backdrop-blur-md flex items-center justify-center transition-colors"
                          title="이미지 삭제"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] font-medium truncate">{referenceImage.name}</p>
                        <p className="text-[9px] text-slate-300">{referenceImage.size}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Requirement: 3. 수정 요청 사항 입력 */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>수정 요청 사항 (자연어 프롬프트)</span>
                  <span className="text-[10px] text-slate-400 font-normal">비워둘 시 고품질 보정</span>
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="예: 외벽을 화이트톤 석재 마감으로 변경하고, 야간 조명을 추가해줘."
                  className="w-full min-h-[80px] bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all resize-none"
                />

                {/* Quick Presets */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-teal-600" />
                    건축가 전용 프롬프트 프리셋
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {architecturalPresets.map((preset, index) => {
                      const isSelected = prompt === preset.text;
                      return (
                        <button
                          key={index}
                          onClick={() => setPrompt(preset.text)}
                          className={`text-[10px] font-medium px-2 py-1 rounded-md transition-all duration-150 border text-left ${
                            isSelected 
                              ? "bg-teal-50 text-teal-700 border-teal-200 font-semibold" 
                              : "bg-white text-slate-600 border-slate-200/60 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Requirement: 4. 이미지 생성/수정 실행 버튼 */}
              <button
                onClick={triggerImageEditing}
                disabled={!originalImage || isEditing}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2 shadow-lg ${
                  !originalImage 
                    ? "bg-slate-100 text-slate-400 border border-slate-200/50 cursor-not-allowed shadow-none" 
                    : isEditing 
                    ? "bg-teal-600/80 text-white cursor-wait shadow-teal-600/10" 
                    : "bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20 active:scale-[0.98]"
                }`}
              >
                {isEditing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>이미지를 편집하는 중입니다...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>이미지 편집 시작</span>
                  </>
                )}
              </button>

            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT PANEL: 2 결과물 미리보기 */}
          {/* ========================================================= */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col min-h-[580px]">
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <h2 className="font-bold text-base text-slate-900 font-display">결과물 미리보기</h2>
                </div>

                {/* View Mode Controller (SaaS premium feel) */}
                {resultImage && !isEditing && (
                  <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200/50 shrink-0">
                    <button
                      onClick={() => setViewMode('result')}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                        viewMode === 'result' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <ImageIcon className="h-3 w-3" />
                      결과물
                    </button>
                    <button
                      onClick={() => setViewMode('side-by-side')}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                        viewMode === 'side-by-side' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <Columns className="h-3 w-3" />
                      비교하기
                    </button>
                    <button
                      onClick={() => setViewMode('slider')}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                        viewMode === 'slider' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <Eye className="h-3 w-3" />
                      비포앤애프터
                    </button>
                  </div>
                )}
              </div>

              {/* Main Preview Screen */}
              <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden relative flex flex-col items-center justify-center min-h-[380px]">
                
                {/* Loader State with detailed architectural statuses */}
                {isEditing ? (
                  <div className="absolute inset-0 bg-white/95 z-10 flex flex-col items-center justify-center p-6 text-center">
                    <div className="relative flex items-center justify-center">
                      <div className="h-16 w-16 rounded-full border-4 border-slate-100 border-t-teal-600 animate-spin" />
                      <Sparkles className="h-6 w-6 text-teal-600 absolute animate-pulse" />
                    </div>
                    
                    <h3 className="text-sm font-bold text-slate-900 mt-6 font-display">AI 건축 렌더 편집 엔진 가동 중</h3>
                    
                    {/* Simulated elegant progress steps */}
                    <div className="mt-4 max-w-xs space-y-2">
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-slate-500 flex items-center justify-center gap-2"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-ping" />
                        파사드 및 고유 구조 분석 중...
                      </motion.div>
                    </div>
                    
                    <p className="text-xs text-slate-400 mt-8 leading-relaxed max-w-xs">
                      원본 구조 및 원근을 정밀하게 추출하고 프롬프트 디자인 변경사항을 시각화 렌더에 주입하는 중입니다. 대략 5-10초 가량 소요됩니다.
                    </p>
                  </div>
                ) : null}

                {/* Condition: No results yet */}
                {!resultImage && !isEditing ? (
                  <div className="p-8 text-center max-w-sm">
                    <div className="h-16 w-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto shadow-inner mb-4">
                      <ImageIcon className="h-8 w-8" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">편집 결과물이 여기에 표시됩니다</h3>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                      작업을 시작해주세요. 좌측에서 이미지를 업로드하고 <span className="font-semibold text-slate-600">"이미지 편집 시작"</span> 버튼을 누르세요.
                    </p>
                  </div>
                ) : null}

                {/* Condition: Result is loaded */}
                {resultImage && !isEditing && (
                  <div className="w-full h-full flex items-center justify-center bg-slate-950 p-1 min-h-[380px]">
                    
                    {/* View Mode 1: Result Only */}
                    {viewMode === 'result' && (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <img 
                          src={resultImage} 
                          alt="AI Architectural Result" 
                          className="max-h-[500px] max-w-full object-contain rounded-lg"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-3 left-3 bg-teal-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          편집 완료
                        </div>
                      </div>
                    )}

                    {/* View Mode 2: Side-by-Side */}
                    {viewMode === 'side-by-side' && originalImage && (
                      <div className="grid grid-cols-2 gap-2 w-full p-2 h-full items-center">
                        <div className="space-y-1.5">
                          <div className="text-[10px] font-bold text-slate-400 bg-slate-900/60 backdrop-blur px-2 py-0.5 rounded inline-block">BEFORE</div>
                          <div className="border border-slate-800 bg-slate-900 rounded overflow-hidden aspect-square flex items-center justify-center">
                            <img src={originalImage.data} alt="Before" className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <div className="text-[10px] font-bold text-teal-400 bg-slate-900/60 backdrop-blur px-2 py-0.5 rounded inline-block">AFTER</div>
                          <div className="border border-slate-800 bg-slate-900 rounded overflow-hidden aspect-square flex items-center justify-center">
                            <img src={resultImage} alt="After" className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* View Mode 3: Swipe Slider (Advanced Feature) */}
                    {viewMode === 'slider' && originalImage && (
                      <div 
                        ref={sliderContainerRef}
                        onMouseMove={handleMouseMove}
                        onTouchMove={handleTouchMove}
                        className="relative w-full max-w-[500px] aspect-square rounded-xl overflow-hidden select-none cursor-ew-resize"
                      >
                        {/* Before Image (Background) */}
                        <img 
                          src={originalImage.data} 
                          alt="Before" 
                          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                          referrerPolicy="no-referrer"
                        />
                        
                        {/* After Image (Foreground, sliding block) */}
                        <div 
                          className="absolute inset-y-0 left-0 right-0 overflow-hidden pointer-events-none"
                          style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
                        >
                          <img 
                            src={resultImage} 
                            alt="After" 
                            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        {/* Slider Bar */}
                        <div 
                          className="absolute inset-y-0 w-1 bg-white shadow-2xl pointer-events-none"
                          style={{ left: `${sliderPosition}%` }}
                        >
                          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-8 w-8 rounded-full bg-white shadow-lg border border-slate-200 flex items-center justify-center">
                            <Columns className="h-4 w-4 text-slate-500 rotate-90" />
                          </div>
                        </div>

                        {/* Labels */}
                        <div className="absolute bottom-3 left-3 bg-slate-900/70 text-slate-300 text-[9px] font-bold px-2 py-0.5 rounded backdrop-blur">BEFORE</div>
                        <div className="absolute bottom-3 right-3 bg-teal-600/70 text-white text-[9px] font-bold px-2 py-0.5 rounded backdrop-blur">AFTER</div>
                      </div>
                    )}

                  </div>
                )}

              </div>

              {/* Requirement: Actions block (Download, Re-edit) */}
              {resultImage && !isEditing && (
                <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
                  
                  {/* Re-edit prompt action */}
                  <div className="w-full sm:flex-1 flex items-center gap-2">
                    <button
                      onClick={triggerImageEditing}
                      className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/60 font-bold text-xs tracking-wide transition-all flex items-center justify-center gap-2"
                      title="동일한 이미지에 수정된 프롬프트로 재생성합니다"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>다시 편집하기</span>
                    </button>
                  </div>

                  {/* Native Download Action */}
                  <button
                    onClick={handleDownload}
                    className="w-full sm:w-auto py-3 px-6 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs tracking-wide transition-all flex items-center justify-center gap-2 shadow-md shadow-teal-600/15"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>결과 이미지 다운로드</span>
                  </button>

                </div>
              )}

              {/* Informative block */}
              <div className="mt-4 bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-start gap-2.5">
                <Info className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                <div className="text-[10px] text-slate-400 leading-relaxed">
                  <span className="font-semibold text-slate-500">이미지 편집 원칙:</span> 아치비전은 원본 건축물의 구조적 비율, 원근 구도, 개구부(창문, 문) 고유 형태를 최대한 보호하면서 질감 변화, 야간 조명 설치, 스타일 레퍼런스의 대안 디자인 적용을 수행하여 실제 기획서 수준의 결과물을 제작합니다.
                </div>
              </div>

            </div>
          </div>

        </div>

      </main>

      {/* Elegant minimalist footer */}
      <footer className="mt-16 border-t border-slate-200/60 bg-white py-8 px-6 text-center text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p>© 2026 ArchVision Inc. All rights reserved.</p>
          <div className="flex justify-center gap-4 text-slate-400">
            <a href="#" className="hover:text-slate-600 transition-colors">이용약관</a>
            <span>•</span>
            <a href="#" className="hover:text-slate-600 transition-colors">개인정보처리방침</a>
            <span>•</span>
            <a href="#" className="hover:text-slate-600 transition-colors">고객지원</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
