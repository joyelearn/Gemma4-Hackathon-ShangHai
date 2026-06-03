"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowLeft,
  Check,
  Copy,
  MapPin,
  Mic,
  MoreVertical,
  Send,
  Trash2,
} from "lucide-react";
import { cities } from "@/data/characters";
import { loadMessages, saveMessages, deleteMessages } from "@/lib/chatDb";

interface PracticalLink {
  type: string;
  landmark: string;
  city: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  imageBase64?: string;
  imageMimeType?: string;
  practicalLink?: PracticalLink;
}

const MAP_HINTS: Record<string, string> = {
  sushi: "老夫那时全凭双脚，你且借此一观",
  zhukezhen: "精确的数据才可靠，不妨查看",
  baijuyi: "后世之便利，老夫甚为羡慕",
  gukaizhi: "画中山水虽美，实地还须查看",
  qianzhongshu: "纸上得来终觉浅，不如亲自查看",
  xuxiake: "老夫若有此物，何愁迷路",
  sunzhongshan: "知行合一，出行亦然",
  libai: "某向来随性，不过你可借此一看",
  caoxueqin: "梦中事可虚，路上事须实",
  tangbohu: "莫学老夫醉里糊涂，出门还是看清路",
  fanzhongyan: "行路之事不可马虎",
  jinshengtan: "此物比老夫批注还实用",
  "luxun-sh": "实事求是，不妨直接查看",
  songqingling: "善用现代工具，方为明智之举",
  xuguangqi: "此乃实用之器，不妨一试",
  // 北京
  laoshe: "得嘞，您查查这个",
  meilanfang: "此物倒便利，不妨一观",
  jixiaolan: "此物比老夫的舆图精细多了",
  // 天津
  lishutong: "世间便利法门，善加利用",
  huoyuanjia: "出门在外，认清路",
  yanfu: "此器可资出行之便",
  // 重庆
  qinliangyu: "行军须知地形，出行亦然",
  zourong: "前路须明，不可盲行",
  luzuofu: "实业报国，路亦须明",
  // 武汉
  quyuan: "行路之事，不可不察",
  zhangzhidong: "实用之器，可资出行",
  cuihao: "莫迷了路，先查看此物",
  // 成都
  dufu: "出门在外，须知路径",
  zhugeliang: "行军布阵讲地利，出行亦然",
  bajin: "出门在外，且看真实的路",
};

const LINK_LABELS: Record<string, string> = {
  traffic: "高德地图·查看路线",
  food: "高德地图·附近美食",
  hotel: "高德地图·附近住宿",
  ticket: "高德地图·查看详情",
  hours: "高德地图·查看详情",
};

const LOADING_HINTS = {
  guide: ["攻略", "推荐", "美食", "餐厅", "饭店", "小吃", "酒店", "住宿", "周边", "附近", "一日游", "路线规划"],
  practical: ["地铁", "公交", "交通", "怎么去", "怎么走", "路线", "门票", "票价", "开放", "闭馆", "预约"],
  weather: ["天气", "气温", "温度", "下雨", "穿什么", "冷不冷", "热不热"],
  history: ["历史", "故事", "典故", "来历", "由来", "建筑", "文化", "详细"],
};

function buildMapUrl(link: PracticalLink): string {
  const suffixes: Record<string, string> = { food: "附近美食", hotel: "附近酒店" };
  const suffix = suffixes[link.type] || "";
  const keyword = link.landmark + suffix;
  return `https://uri.amap.com/search?keyword=${encodeURIComponent(keyword)}&city=${encodeURIComponent(link.city)}`;
}

function getLoadingText(text: string, characterName: string): string {
  if (LOADING_HINTS.weather.some((kw) => text.includes(kw))) {
    return `${characterName}正在查看天气与出行建议…`;
  }
  if (LOADING_HINTS.practical.some((kw) => text.includes(kw))) {
    return `${characterName}正在核对交通、门票或开放信息…`;
  }
  if (LOADING_HINTS.guide.some((kw) => text.includes(kw))) {
    return `${characterName}正在整理近期游览建议…`;
  }
  if (LOADING_HINTS.history.some((kw) => text.includes(kw))) {
    return `${characterName}正在回想此地的来历…`;
  }
  return `${characterName}正在斟酌回应…`;
}

// 清理 Gemma 偶尔输出的 LaTeX 语法
function cleanLatex(text: string): string {
  return text
    .replace(/\$\\text\{([^}]*)\}\$/g, "$1")   // $\text{《xxx》}$ → 《xxx》
    .replace(/\$([^$]*)\$/g, "$1")              // $xxx$ → xxx
    .replace(/\\text\{([^}]*)\}/g, "$1");       // \text{xxx} → xxx
}

function findCharacter(characterId: string) {
  for (const city of cities) {
    const char = city.characters.find((c) => c.id === characterId);
    if (char) return { character: char, city };
  }
  return null;
}

export default function ChatPage({
  params,
}: {
  params: Promise<{ characterId: string }> | { characterId: string };
}) {
  const [characterId, setCharacterId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string>("");

  const [lengthMode, setLengthMode] = useState<"brief" | "standard" | "detailed">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("chat-length-mode") as "brief" | "standard" | "detailed") || "standard";
    }
    return "standard";
  });

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = useCallback((text: string, index: number) => {
    const onSuccess = () => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1500);
    };
    const fallback = () => {
      const el = document.createElement("textarea");
      el.value = text;
      el.style.cssText = "position:fixed;opacity:0;pointer-events:none";
      document.body.appendChild(el);
      el.focus();
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      onSuccess();
    };
    navigator.clipboard.writeText(text).then(onSuccess).catch(fallback);
  }, []);

  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve(params).then((p) => {
      if (!cancelled) setCharacterId(p.characterId);
    });
    return () => {
      cancelled = true;
    };
  }, [params]);

  const result = useMemo(
    () => characterId ? findCharacter(characterId) : null,
    [characterId]
  );

  // 设置页面标题
  useEffect(() => {
    if (result) document.title = `与${result.character.name}对话 — Anchoracle`;
  }, [result]);

  // 加载聊天记录或初始化问候
  useEffect(() => {
    if (!result || !characterId) return;
    let cancelled = false;
    (async () => {
      const greeting: Message[] = [
        {
          role: "assistant",
          content: `你好！我是${result.character.name}，${result.character.title}。${result.character.intro}。你想聊些什么？`,
        },
      ];

      // 如果有扫描上下文，优先使用（一次性消费）
      let scanContext: { landmark?: string; narration?: string; characterName?: string } | null = null;
      try {
        const raw = sessionStorage.getItem("scan-context");
        if (raw) {
          sessionStorage.removeItem("scan-context");
          scanContext = JSON.parse(raw);
        }
      } catch {}

      if (scanContext?.landmark && scanContext?.narration) {
        setMessages([
          { role: "user", content: `我刚拍了一张${scanContext.landmark}的照片，跟我讲讲这里吧。` },
          { role: "assistant", content: scanContext.narration },
        ]);
        return;
      }

      try {
        const saved = await Promise.race([
          loadMessages(characterId),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 800)),
        ]);
        if (cancelled) return;
        if (Array.isArray(saved) && saved.length > 0) {
          setMessages(saved as Message[]);
          return;
        }
      } catch {
        if (cancelled) return;
      }
      setMessages(greeting);
    })();
    return () => {
      cancelled = true;
    };
  }, [characterId, result]);

  // 保存聊天记录到 IndexedDB（防抖 300ms）
  useEffect(() => {
    if (!characterId || messages.length === 0) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveMessages(characterId, messages).catch(console.error);
    }, 300);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [messages, characterId]);

  const isNearBottom = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  }, []);

  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg) return;
    // 用户发送的消息：无论在哪都强制滚到底部
    // AI 流式输出：仅在已接近底部时跟随滚动（不打断用户翻阅历史）
    if (lastMsg.role === "user" || isNearBottom()) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isNearBottom]);

  const handleScroll = useCallback(() => {
    setShowScrollBtn(!isNearBottom());
  }, [isNearBottom]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  function clearHistory() {
    if (!characterId || !result) return;
    if (!window.confirm("确定要清空所有聊天记录吗？此操作无法撤销。")) return;
    deleteMessages(characterId).catch(console.error);
    setMessages([
      {
        role: "assistant",
        content: `你好！我是${result.character.name}，${result.character.title}。${result.character.intro}。你想聊些什么？`,
      },
    ]);
  }

  function toggleVoiceInput() {
    setVoiceError("");
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      // 移动浏览器可能拦截 alert，改用 inline 提示
      setVoiceError("当前浏览器不支持语音输入。建议使用 Chrome 或 Safari。");
      setTimeout(() => setVoiceError(""), 4500);
      return;
    }
    const rec = new SR();
    rec.lang = "zh-CN";
    rec.continuous = false;
    rec.interimResults = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => setInput(e.results[0][0].transcript);
    // onerror 需向用户区分权限拒绝 / 无信号等错误，而非静默处理
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onerror = (e: any) => {
      setIsListening(false);
      const code = e?.error || "unknown";
      const msg =
        code === "not-allowed" || code === "permission-denied"
          ? "需要麦克风权限。请在浏览器地址栏权限图标中允许麦克风访问，然后重试。"
          : code === "no-speech"
            ? "没有听到说话，请重试。"
            : code === "audio-capture"
              ? "没有可用的麦克风。"
              : code === "network"
                ? "语音识别网络错误，请检查网络连接。"
                : `语音识别失败：${code}`;
      setVoiceError(msg);
      setTimeout(() => setVoiceError(""), 4500);
    };
    rec.onend = () => setIsListening(false);
    recognitionRef.current = rec;
    try {
      rec.start();
      setIsListening(true);
    } catch (err) {
      // rec.start() 在已 listening 状态下可能抛 InvalidStateError
      setVoiceError(`无法启动语音识别：${err instanceof Error ? err.message : String(err)}`);
      setTimeout(() => setVoiceError(""), 4500);
    }
  }

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId,
          messages: [...messages, userMsg],
          lengthMode,
        }),
      });

      // JSON 错误响应（服务端早期异常）
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json") || !res.body) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let data: any;
        try { data = await res.json(); } catch {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: "请求超时，稍后再试一下吧。若问的是实用信息（交通/门票），建议直接查地图哦。" },
          ]);
          setLoading(false);
          return;
        }
        const reply: string = data.reply ?? data.error ?? "抱歉，我暂时无法回答。";
        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
        setLoading(false);
        return;
      }

      // SSE 流式读取
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let text = "";
      let link: PracticalLink | undefined;
      let warn = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      let totalChunks = 0;
      let malformedChunks = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() || "";
        for (const part of parts) {
          const line = part.startsWith("data: ") ? part.slice(6) : "";
          if (!line) continue;
          totalChunks++;
          try {
            const d = JSON.parse(line);
            if (d.t) {
              text += d.t;
              setMessages((prev) => {
                const u = [...prev];
                u[u.length - 1] = { ...u[u.length - 1], content: text };
                return u;
              });
            }
            if (d.link) link = d.link;
            if (d.warn) warn = d.warn;
            if (d.error) {
              text = d.error;
              setMessages((prev) => {
                const u = [...prev];
                u[u.length - 1] = { ...u[u.length - 1], content: text };
                return u;
              });
            }
          } catch (parseErr) {
            // 单个分片解析失败可容忍（实际罕见）；但若每个分片都失败（服务端 bug、
            // 代理注入 HTML、网关超时返回 text/html 而非 SSE），用户只会看到兜底
            // 文案而无从诊断。这里至少记录一个样例，便于在浏览器 devtools 中定位。
            malformedChunks++;
            if (malformedChunks <= 3) {
              console.warn("[chat] malformed SSE chunk:", line.slice(0, 200), parseErr);
            }
          }
        }
      }
      if (totalChunks > 0 && malformedChunks === totalChunks) {
        console.error(`[chat] ALL ${totalChunks} SSE chunks failed to parse — server may be returning non-SSE response`);
      }

      // 最终应用 link / warning
      setMessages((prev) => {
        const u = [...prev];
        const content = warn ? `${text}\n\n⚠️ ${warn}` : text;
        u[u.length - 1] = { ...u[u.length - 1], content: content || "抱歉，我暂时无法回答。", ...(link && { practicalLink: link }) };
        return u;
      });
      setLoading(false);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "网络出错，请稍后再试。" },
      ]);
      setLoading(false);
    }
  }

  if (!characterId) return null;
  if (!result) return <div className="p-12 text-center text-white">人物不存在</div>;

  const { character, city } = result;
  const lastUserMessage = [...messages].reverse().find((msg) => msg.role === "user")?.content || "";
  const lm = character.landmarks;
  const quickPrompts = [
    `帮我规划${lm[0]?.name || city.name}半日游`,
    `${(lm[1] || lm[0])?.name || city.name}今天开放吗？`,
    `${(lm[2] || lm[0])?.name || city.name}附近有什么吃的？`,
    `讲讲${lm[0]?.name || city.name}的来历`,
  ];

  return (
    <div className="relative mx-auto flex h-screen max-w-3xl flex-col overflow-hidden border-x border-white/10 bg-[#07090f] shadow-2xl shadow-black/40">
      {/* 全局遮罩层（必须在 backdrop-blur 容器外部才能覆盖全屏） */}
      {headerMenuOpen && (
        <div
          className="absolute inset-0 z-[60]"
          onClick={() => setHeaderMenuOpen(false)}
        />
      )}

      {/* 移动端更多菜单下拉面板 */}
      {headerMenuOpen && (
        <div className="animate-msg-in absolute right-4 top-14 z-[70] w-48 rounded-xl border border-white/12 bg-[#090b10]/95 p-2 shadow-xl sm:hidden">
          <div className="mb-2 px-2 text-xs text-white/40">回复长度</div>
          <div className="mb-2 flex gap-1 px-1">
            {(["brief", "standard", "detailed"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  setLengthMode(mode);
                  localStorage.setItem("chat-length-mode", mode);
                }}
                className={`flex-1 rounded-lg px-2 py-1.5 text-xs transition ${
                  lengthMode === mode
                    ? "bg-amber-200 text-stone-950"
                    : "text-white/50 hover:bg-white/10"
                }`}
              >
                {mode === "brief" ? "简洁" : mode === "standard" ? "标准" : "详细"}
              </button>
            ))}
          </div>
          <div className="my-1 border-t border-white/10" />
          <button
            onClick={() => { clearHistory(); setHeaderMenuOpen(false); }}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-red-300/80 hover:bg-white/10"
          >
            <Trash2 size={14} />
            清空聊天记录
          </button>
        </div>
      )}

      {/* 背景图 */}
      <div className="fixed inset-0 -z-10 mx-auto max-w-3xl">
        <img
          src={city.image}
          alt={city.name}
          className="h-full w-full object-cover opacity-75"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#07090f]/88 via-[#07090f]/72 to-[#07090f]/92 backdrop-blur-sm" />
        <div className="soft-grid absolute inset-0 opacity-50" />
      </div>

      {/* Header */}
      <div className="flex flex-shrink-0 items-center gap-3 border-b border-white/10 bg-black/35 px-4 py-3 backdrop-blur-xl">
        <Link
          href={`/city/${city.id}`}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/60 transition hover:border-white/25 hover:text-white"
          title="返回"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-2xl border border-amber-200/25 bg-white/5">
          <img src={character.avatar} alt={character.name} className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="truncate font-semibold text-white">{character.name}</div>
            <span className="hidden rounded-full border border-emerald-200/20 bg-emerald-200/10 px-2 py-0.5 text-[11px] text-emerald-100 sm:inline">
              在地守护者
            </span>
          </div>
          <div className="mt-0.5 truncate text-xs text-white/45">
            {character.title} · {city.name} · {character.era}
          </div>
        </div>
        <div className="hidden rounded-xl border border-white/10 bg-white/[0.04] p-1 sm:flex">
          {(["brief", "standard", "detailed"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => {
                setLengthMode(mode);
                localStorage.setItem("chat-length-mode", mode);
              }}
              className={`rounded-lg px-2.5 py-1.5 text-xs transition ${
                lengthMode === mode
                  ? "bg-amber-200 text-stone-950"
                  : "text-white/45 hover:bg-white/10 hover:text-white/80"
              }`}
            >
              {mode === "brief" ? "简" : mode === "standard" ? "标" : "详"}
            </button>
          ))}
        </div>
        <button
          onClick={clearHistory}
          className="hidden h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/45 transition hover:border-white/25 hover:text-white sm:flex"
          title="清空记录"
        >
          <Trash2 size={16} />
        </button>
        {/* 移动端更多菜单按钮 */}
        <button
          onClick={() => setHeaderMenuOpen((v) => !v)}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/45 transition hover:border-white/25 hover:text-white sm:hidden"
          title="更多"
        >
          <MoreVertical size={16} />
        </button>
      </div>

      {/* 相关景点与推荐问题 */}
      <div className="flex-shrink-0 border-b border-white/10 bg-black/20 px-4 py-3 backdrop-blur-xl">
        <div className="mb-2 flex gap-2 overflow-x-auto">
          <span className="flex flex-shrink-0 items-center gap-1.5 self-center text-xs text-white/35">
            <MapPin size={13} />
            守护景点
          </span>
          {character.landmarks.map((lm) => (
            <button
              key={lm.name}
              onClick={() => setInput(`请和我聊聊${lm.name}`)}
              className="flex-shrink-0 rounded-full border border-white/12 bg-white/[0.04] px-3 py-1 text-xs text-white/58 transition hover:border-cyan-200/35 hover:bg-cyan-200/10 hover:text-cyan-50"
            >
              {lm.name}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => setInput(prompt)}
              className="flex-shrink-0 rounded-xl border border-amber-200/15 bg-amber-200/[0.07] px-3 py-1.5 text-xs text-amber-50/70 transition hover:border-amber-100/35 hover:bg-amber-200/12 hover:text-amber-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="relative flex-1 space-y-5 overflow-y-auto px-4 py-6" ref={scrollContainerRef} onScroll={handleScroll}>
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex items-start gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {/* 人物头像 */}
            {msg.role === "assistant" && (
              <div className="mb-1 h-8 w-8 flex-shrink-0 overflow-hidden rounded-xl border border-amber-200/20">
                <img src={character.avatar} alt={character.name} className="h-full w-full object-cover" />
              </div>
            )}

            <div className={`max-w-[78%] group/msg ${msg.role === "assistant" ? "animate-msg-in" : ""}`}>
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-7 shadow-lg ${
                  msg.role === "user"
                    ? "rounded-br-md border border-cyan-200/20 bg-cyan-200/12 text-white backdrop-blur-md"
                    : "rounded-bl-md border border-white/10 border-l-amber-200/35 bg-black/45 text-white/90 backdrop-blur-md"
                }`}
              >
                {msg.imageBase64 && (
                  <img
                    src={`data:${msg.imageMimeType};base64,${msg.imageBase64}`}
                    alt="用户上传图片"
                    className="mb-2 max-h-48 max-w-full rounded-xl object-cover"
                  />
                )}
                {cleanLatex(msg.content)}
              </div>
              {msg.content && (
                <div className={`mt-1 flex items-center gap-1 opacity-40 transition-opacity group-hover/msg:opacity-100 ${msg.role === "user" ? "justify-end" : ""}`}>
                  <button
                    onClick={() => handleCopy(msg.content, i)}
                    title={copiedIndex === i ? "已复制" : "复制"}
                    className="rounded-lg p-1.5 text-white/40 transition hover:bg-white/10 hover:text-white/70"
                  >
                    {copiedIndex === i ? (
                      <Check size={14} strokeWidth={2.5} />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>
              )}
              {msg.practicalLink && (
                <div className="mt-1.5 text-xs leading-relaxed text-white/40">
                  {MAP_HINTS[characterId || ""] || ""}
                  {" → "}
                  <a
                    href={buildMapUrl(msg.practicalLink)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-cyan-300/80 transition-colors hover:text-cyan-200"
                  >
                    <MapPin size={13} /> {LINK_LABELS[msg.practicalLink.type] || "查看详情"}
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* 正在思考 */}
        {loading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex items-start justify-start gap-2">
            <div className="mt-1 h-8 w-8 flex-shrink-0 overflow-hidden rounded-xl border border-amber-200/20">
              <img src={character.avatar} alt={character.name} className="h-full w-full object-cover" />
            </div>
            <div className="rounded-2xl rounded-bl-md border border-white/10 bg-black/45 px-4 py-3 text-sm text-white/50 backdrop-blur-md">
              {getLoadingText(lastUserMessage, character.name)}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 回到底部按钮 */}
      {showScrollBtn && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-6 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white shadow-lg backdrop-blur-md transition hover:bg-white/20"
          title="回到底部"
        >
          <ArrowDown size={17} />
        </button>
      )}

      {/* Input — chat 专注对话，图片识别请走 /scan 页面 */}
      <div className="relative z-[80] flex-shrink-0 border-t border-white/10 bg-black/38 px-4 py-3 backdrop-blur-xl">
        {isListening && (
          <div className="mb-2 flex items-center justify-center gap-2 rounded-full border border-red-500/40 bg-red-500/15 px-4 py-1.5 text-xs text-red-200 backdrop-blur animate-pulse">
            <Mic size={12} />
            正在聆听... 请说话，再点一次麦克风按钮取消
          </div>
        )}
        {voiceError && (
          <div className="mb-2 rounded-xl border border-amber-300/30 bg-amber-200/10 px-3 py-2 text-xs leading-relaxed text-amber-100">
            {voiceError}
          </div>
        )}
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex gap-2"
        >
          {/* 直接在输入框旁边露出语音按钮，让用户一眼看到语音输入支持 */}
          <button
            type="button"
            onClick={toggleVoiceInput}
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border transition ${
              isListening
                ? "border-red-400/50 bg-red-500/20 text-red-200 animate-pulse"
                : "border-white/12 bg-white/[0.05] text-white/70 hover:border-white/25 hover:bg-white/[0.09]"
            }`}
            title={isListening ? "停止录音" : "语音输入"}
          >
            <Mic size={18} />
          </button>

          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              // 自动调整高度
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={isListening ? "正在聆听…" : `和${character.name}说点什么…`}
            rows={1}
            className="min-w-0 flex-1 resize-none overflow-y-auto rounded-xl border border-white/12 bg-white/[0.055] px-4 py-2.5 text-sm text-white placeholder-white/35 backdrop-blur-md focus:border-cyan-200/40 focus:outline-none"
            style={{ maxHeight: "120px" }}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="flex h-10 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-amber-200/30 bg-amber-200 text-stone-950 transition hover:bg-amber-100 disabled:border-white/10 disabled:bg-white/10 disabled:text-white/30"
            title="发送"
          >
            <Send size={17} />
          </button>
        </form>
      </div>
    </div>
  );
}
