"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";

// 扫描页标题（client component 无法 export metadata）
const PAGE_TITLE = "拍照识古迹 — Anchoracle";
import { ArrowLeft, Camera, CheckCircle2, Clipboard, ImagePlus, RotateCcw, ScanLine, Sparkles, Upload } from "lucide-react";
import { cities } from "@/data/characters";
import { compressImage } from "@/lib/imageUtils";

interface ScanSuggestion {
  landmark: string;
  characterId: string;
  characterName: string;
  cityName: string;
  avatar: string;
}

interface ScanResult {
  found: boolean;
  landmark?: string;
  confidence?: "high" | "medium" | "low";
  characterId?: string;
  characterName?: string;
  cityName?: string;
  avatar?: string;
  narration?: string;
  visualDescription?: string;
  suggestions?: ScanSuggestion[];
  message?: string;
  error?: string;
}

export default function ScanPage() {
  useEffect(() => { document.title = PAGE_TITLE; }, []);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedCityId, setSelectedCityId] = useState("");
  const [activeStep, setActiveStep] = useState(0);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // P3: 检测触摸设备 — 桌面端 capture 属性被忽略，"拍摄景点"和"从相册选择"是同一个 file picker
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot environment detection on mount; SSR-safe
      setIsTouchDevice(window.matchMedia("(pointer: coarse)").matches);
    }
  }, []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const stepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastImageRef = useRef<{ base64: string; mimeType: string } | null>(null);

  useEffect(() => {
    if (scanning) {
      setActiveStep(0);
      let step = 0;
      stepTimerRef.current = setInterval(() => {
        step++;
        if (step <= 2) setActiveStep(step);
      }, 2200);
    } else {
      if (stepTimerRef.current) clearInterval(stepTimerRef.current);
      setActiveStep(0);
    }
    return () => {
      if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    };
  }, [scanning]);

  const scanImage = useCallback(async (base64: string, mimeType: string, forcedLandmark?: string) => {
    if (!forcedLandmark) {
      setPreview(`data:${mimeType};base64,${base64}`);
      lastImageRef.current = { base64, mimeType };
    }
    setScanning(true);
    setResult(null);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, imageMimeType: mimeType, cityId: selectedCityId || undefined, ...(forcedLandmark && { forcedLandmark }) }),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let data: any;
      try {
        data = await res.json();
      } catch {
        // Vercel 504 函数超时返回 HTML → res.json() 抛出
        setResult({ found: false, message: "请求超时，请稍后再试。建议先选择城市缩小识别范围。" });
        return;
      }
      setResult(data);
    } catch {
      setResult({ found: false, message: "网络出错，请稍后再试。" });
    } finally {
      setScanning(false);
    }
  }, [selectedCityId]);

  function handleSuggestionClick(landmark: string) {
    const img = lastImageRef.current;
    if (!img) return;
    scanImage(img.base64, img.mimeType, landmark);
  }

  async function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      const { base64, mimeType } = await compressImage(file);
      scanImage(base64, mimeType);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "图片读取失败";
      setResult({ found: false, message: `${msg}，请换一张试试。` });
    }
  }

  // Ctrl+V / Cmd+V paste image support
  useEffect(() => {
    async function handlePaste(e: ClipboardEvent) {
      if (scanning) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (!file) return;
          try {
            const { base64, mimeType } = await compressImage(file);
            scanImage(base64, mimeType);
          } catch {
            setResult({ found: false, message: "粘贴的图片无法读取，请换用 JPEG 或 PNG 格式。" });
          }
          return;
        }
      }
    }
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [scanning, scanImage]);

  function reset() {
    setResult(null);
    setPreview(null);
  }

  const selectedCity = cities.find((city) => city.id === selectedCityId);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07090f] text-white">
      <div className="soft-grid pointer-events-none absolute inset-0 opacity-70" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-cyan-300/12 blur-3xl" />

      <div className="relative mx-auto grid min-h-screen max-w-6xl gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8">
        <section className="flex flex-col justify-between">
          <div>
            <Link
              href="/"
              className="mb-8 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/60 backdrop-blur transition hover:border-white/25 hover:text-white"
            >
              <ArrowLeft size={16} />
              返回首页
            </Link>

            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-200/25 bg-cyan-200/10 px-3 py-1.5 text-xs text-cyan-100">
              <ScanLine size={14} />
              古迹视觉识别
            </div>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              拍下一处古迹，
              <span className="block bg-gradient-to-r from-white via-amber-100 to-cyan-100 bg-clip-text text-transparent">
                唤醒它的守护者。
              </span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-8 text-white/58">
              <span className="block">上传景点照片后，系统会先辨认画面，</span>
              <span className="block">再匹配候选古迹，并让相关人物讲述它的来历。</span>
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-3 text-sm text-white/52 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur">
              <ScanLine size={17} className="mb-2 text-cyan-100" />
              10 城市 · 90 景点
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur">
              <CheckCircle2 size={17} className="mb-2 text-amber-100" />
              AI 多模态识别
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur">
              <Sparkles size={17} className="mb-2 text-emerald-100" />
              第一人称历史讲述
            </div>
          </div>
        </section>

        <section className="flex items-center">
          <div className="w-full rounded-3xl border border-white/10 bg-white/[0.045] p-4 shadow-2xl shadow-black/25 backdrop-blur-xl sm:p-5">
            {!result && !scanning && (
              <div>
                <label className="mb-4 block">
                  <span className="mb-2 block text-sm font-medium text-white/70">所在城市，可选</span>
                  <select
                    value={selectedCityId}
                    onChange={(e) => setSelectedCityId(e.target.value)}
                    className="w-full rounded-xl border border-white/12 bg-[#10131a] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-200/45"
                  >
                    <option value="">不确定，自动识别</option>
                    {cities.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                  <span className="mt-2 block text-xs leading-relaxed text-white/38">
                    不确定可不选；选错城市会缩小到错误候选范围，可能影响识别。
                  </span>
                </label>

                {/* 用 sr-only 而非 display:none：display:none 会阻止 iOS Safari 等浏览器对隐藏 input 的程序化 .click() */}
                <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" onChange={handleImage} />
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="sr-only" onChange={handleImage} />

                {/* P3: 桌面端用 fileInputRef（普通文件选择器）；移动端保留 cameraInputRef（直接调起相机） */}
                <button
                  onClick={() => (isTouchDevice ? cameraInputRef : fileInputRef).current?.click()}
                  className="group relative flex min-h-[330px] w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-cyan-200/25 bg-cyan-200/[0.035] px-6 text-center transition hover:border-cyan-100/45 hover:bg-cyan-200/[0.06]"
                >
                  <div className="absolute inset-8 rounded-2xl border border-cyan-100/20" />
                  <div className="scan-line absolute left-10 right-10 top-16 h-px bg-gradient-to-r from-transparent via-cyan-100 to-transparent" />
                  <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-100/25 bg-cyan-100/10 text-cyan-50 shadow-[0_0_50px_rgba(103,232,249,0.16)]">
                    {isTouchDevice ? <Camera size={30} /> : <ImagePlus size={30} />}
                  </span>
                  <span className="text-xl font-semibold">{isTouchDevice ? "拍摄景点" : "上传照片"}</span>
                  <span className="mt-2 max-w-xs text-sm leading-6 text-white/45">
                    {isTouchDevice
                      ? "尽量让建筑主体、题字、匾额或标志性构件出现在画面中央。"
                      : "选择一张古迹照片，主体清晰、标志性构件可见时识别效果最好。"}
                  </span>
                  {selectedCity && (
                    <span className="mt-5 rounded-full border border-amber-200/25 bg-amber-200/10 px-3 py-1 text-xs text-amber-100">
                      当前候选城市：{selectedCity.name}
                    </span>
                  )}
                </button>

                {/* P3: 桌面端不展示"从相册选择"，因为它和上面的"上传照片"等同 */}
                {isTouchDevice && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.05] px-4 py-3 text-sm font-medium text-white/70 transition hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
                  >
                    <ImagePlus size={17} />
                    从相册选择
                  </button>
                )}

                <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-white/30">
                  <Clipboard size={12} />
                  <span>也可以直接 Ctrl+V 粘贴图片</span>
                </div>
              </div>
            )}

            {scanning && (
              <div className="py-8">
                {preview && (
                  <div className="relative mx-auto mb-6 h-64 max-w-sm overflow-hidden rounded-2xl border border-cyan-200/20 bg-black/20">
                    <img src={preview} alt="扫描中" className="h-full w-full object-cover opacity-80" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="scan-line absolute left-4 right-4 top-4 h-px bg-gradient-to-r from-transparent via-cyan-100 to-transparent" />
                  </div>
                )}
                <div className="mx-auto max-w-sm space-y-3">
                  {["正在辨认画面", "正在匹配古迹", "正在唤起人物讲述"].map((step, index) => (
                    <div
                      key={step}
                      className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-all duration-500 ${
                        index <= activeStep
                          ? "border-cyan-200/30 bg-cyan-200/[0.08] text-white/85"
                          : "border-white/10 bg-white/[0.04] text-white/35"
                      }`}
                    >
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs transition-all duration-500 ${
                        index < activeStep
                          ? "border border-emerald-300/40 bg-emerald-300/15 text-emerald-200"
                          : index === activeStep
                          ? "border border-cyan-200/40 bg-cyan-200/15 text-cyan-100 animate-pulse"
                          : "border border-white/15 bg-white/5 text-white/30"
                      }`}>
                        {index < activeStep ? "✓" : index + 1}
                      </span>
                      {step}
                      {index === activeStep && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-200 animate-pulse" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result && !scanning && (
              <div className="space-y-5">
                {preview && (
                  <img src={preview} alt="景点照片" className="max-h-72 w-full rounded-2xl border border-white/10 object-cover" />
                )}

                {result.characterId && result.narration ? (
                  <div>
                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                      <div>
                        <div className="text-xs text-white/40">识别结果</div>
                        <div className="mt-1 text-sm text-white/75">
                          {result.found ? `${result.cityName} · ${result.landmark}` : result.message}
                        </div>
                      </div>
                      <CheckCircle2 size={22} className={result.found ? "text-emerald-200" : "text-amber-200"} />
                    </div>

                    <div className="mt-5 flex items-center gap-3">
                      <div className="h-14 w-14 overflow-hidden rounded-2xl border border-white/15">
                        <img src={result.avatar} alt={result.characterName} className="h-full w-full object-cover" />
                      </div>
                      <div>
                        <div className="text-xl font-semibold">{result.characterName}</div>
                        <div className="text-sm text-white/42">
                          {result.found ? "为你讲述此地" : "有感而发"}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4 text-sm leading-7 text-white/82">
                      {result.narration}
                    </div>

                    {result.confidence === "medium" && (
                      <div className="mt-2 text-xs leading-5 text-white/30">
                        ⚠ 识别结果置信度不高，景点信息仅供参考，建议结合现场实际情况核实。
                      </div>
                    )}

                    <div className="mt-5 grid grid-cols-[1fr_auto] gap-3">
                      <Link
                        href={`/chat/${result.characterId}`}
                        onClick={() => {
                          try {
                            sessionStorage.setItem("scan-context", JSON.stringify({
                              landmark: result.landmark,
                              narration: result.narration,
                              characterName: result.characterName,
                            }));
                          } catch {}
                        }}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-200 px-4 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-100"
                      >
                        继续和{result.characterName}聊天
                      </Link>
                      <button
                        onClick={reset}
                        className="inline-flex items-center justify-center rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm text-white/65 transition hover:border-white/25 hover:text-white"
                        title="再扫一次"
                      >
                        <RotateCcw size={17} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                      <div className="flex items-start gap-3">
                        <Upload size={22} className="mt-0.5 shrink-0 text-white/35" />
                        <div>
                          <div className="text-base font-semibold">未能识别此景点</div>
                          <div className="mt-1 text-sm leading-6 text-white/45">
                            {result.message || result.error || "可以换一张主体更清晰的照片，或先选择城市再试。"}
                          </div>
                        </div>
                      </div>

                      {result.visualDescription && (
                        <div className="mt-4 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
                          <div className="mb-1.5 text-xs text-white/38">AI 识别到的画面内容</div>
                          <div className="text-xs leading-5 text-white/55">{result.visualDescription}</div>
                        </div>
                      )}
                    </div>

                    {result.suggestions && result.suggestions.length > 0 && (
                      <div className="rounded-2xl border border-amber-200/15 bg-amber-200/[0.04] p-4">
                        <div className="mb-3 text-xs text-amber-100/60">你拍的是哪个景点？点击后将为你生成对应讲述</div>
                        <div className="flex flex-wrap gap-2">
                          {result.suggestions.map((s) => (
                            <button
                              key={s.landmark}
                              onClick={() => handleSuggestionClick(s.landmark)}
                              className="rounded-lg border border-white/12 bg-white/[0.05] px-3 py-1.5 text-xs text-white/70 transition hover:border-amber-200/40 hover:bg-amber-200/[0.08] hover:text-amber-100"
                            >
                              {s.landmark}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={reset}
                      className="w-full rounded-xl border border-white/12 bg-white/[0.04] px-6 py-3 text-sm text-white/70 transition hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
                    >
                      重新拍摄
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
