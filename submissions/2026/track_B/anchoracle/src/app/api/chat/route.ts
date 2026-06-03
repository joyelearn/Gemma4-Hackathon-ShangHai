import { personas, GLOBAL_CONSTRAINTS } from "@/data/personas";
import { landmarkData } from "@/data/landmarks";
import { cities } from "@/data/characters";
import { getAI, isQuotaError, switchKey, consumeKeyWarning, getKeyCount } from "@/lib/aiClient";

// 基础实用信息查询
const PRACTICAL_KEYWORDS = [
  "几点", "开放", "开门", "关门", "营业", "闭馆",
  "门票", "票价", "多少钱", "收费", "免费",
  "怎么去", "怎么过去", "怎么到", "怎么走", "怎么坐",
  "交通", "地铁", "公交", "路线", "打车", "步行", "骑行",
  "多远", "多长时间", "要多久",
  "地址", "在哪", "在哪里", "位置",
];

// "从A到/去B"模式：即使没有显式关键词也视为交通查询
function hasTransportPattern(msg: string): boolean {
  return /从.{1,15}(?:到|去|出发)/.test(msg) || /(?:想去|要去|准备去|打算去)/.test(msg);
}

// 联网策略关键词：只决定是否调用 Gemini Search，不决定问题属于哪种模式
const SEARCH_POLICY_KEYWORDS = {
  realtime: ["最新", "现在", "今天", "最近", "实时", "目前", "还开吗", "还开放吗", "关了吗", "闭馆了吗", "变了吗", "准不准", "准确吗"],
  alwaysSearchPractical: ["地铁", "公交", "交通", "怎么去", "怎么走", "路线", "直达吗", "怎么坐", "几号线", "哪一站"],
  alwaysSearchGuide: ["附近", "周边", "美食", "餐厅", "饭店", "小吃", "酒店", "住宿", "民宿", "住哪", "攻略", "路线规划", "一日游", "半日游", "小红书", "携程", "马蜂窝"],
  deepSearch: ["历史", "来历", "由来", "起源", "谁建", "什么时候", "建筑特色", "典故", "传说", "文化背景", "详细", "具体", "冷门", "鲜为人知", "考证"],
};

// 代词：用户说"这里""你的故居"时也应触发
const PRONOUN_KEYWORDS = [
  "这里", "这个地方", "这儿", "此处", "那里", "那儿", "那个地方",
  "你的故居", "你的纪念馆", "你住的地方", "你的旧居", "你待过的地方",
];

// 深度知识查询关键词（触发 Gemini + Google Search）
const DEEP_KNOWLEDGE_KEYWORDS = [
  "历史", "故事", "典故", "传说", "来历", "由来", "起源",
  "建筑", "特色", "风格", "设计", "构造",
  "文化", "意义", "象征", "内涵",
  "诗词", "名句", "名篇",
  "为什么", "谁建", "什么时候",
  "讲讲", "说说", "聊聊", "介绍", "详细",
];
const BROAD_DEEP_KEYWORDS = ["讲讲", "说说", "聊聊", "介绍"];

// 攻略实用查询关键词（触发 Gemini 搜索旅游攻略）
const GUIDE_KEYWORDS = [
  "攻略", "推荐", "美食", "吃什么", "吃的", "小吃", "特产", "餐厅", "饭店",
  "住哪", "住宿", "酒店", "民宿",
  "周边", "附近", "旁边",
  "拍照", "打卡", "拍摄",
  "最佳时间", "什么季节", "几月", "什么时候去",
  "值得", "好玩", "怎么玩", "一日游", "半天", "半日游", "路线规划",
  "注意事项", "小贴士", "tips", "建议",
  "夜景", "日出", "日落",
  "带孩子", "亲子", "老人",
];

// 天气查询关键词
const WEATHER_KEYWORDS = [
  "天气", "气温", "温度", "下雨", "下雪", "穿什么", "穿啥",
  "带伞", "冷不冷", "热不热", "几度", "多少度", "气候",
];

const SEARCH_RELIABILITY_RULES = `信息可信度要求：
1. 门票、开放时间、预约政策、临时闭馆等高风险信息，优先参考景区官网、博物馆官网、官方公众号或官方票务/预约平台；如果没有明确官方来源，请说明“建议临行前以官方预约页为准”。
2. 交通路线优先参考地图平台、地铁/公交官方信息和近期搜索结果；如果线路或站点信息冲突，不要强行断定。
3. 餐厅、住宿、拍照点和游览体验可以参考小红书、马蜂窝、携程、大众点评等用户分享，但不要把单条游记当成确定事实。
4. 如果不同来源互相矛盾，请保留最稳妥的说法，并明确“不敢替你断定最新情况”。不要编造没有来源的价格、时间、店名或路线。
5. 输出时只保留对用户有用的结论，不要列网址，不要写资料来源清单。`;

// 获取某个角色的所有景点名
function getCharacterLandmarkNames(characterId: string): string[] {
  for (const city of cities) {
    const char = city.characters.find((c) => c.id === characterId);
    if (char) return char.landmarks.map((lm) => lm.name);
  }
  return [];
}

function getCharacterCityName(characterId: string): string {
  for (const city of cities) {
    if (city.characters.some((c) => c.id === characterId)) return city.name;
  }
  return "";
}

// 当 detect* 函数走 pronoun/catch-all 兜底注入了角色全部景点时，
// 用对话历史缩窄到用户真正在指代的那一个，避免回答把不相关的景点也带上
function narrowLandmarksByHistory(
  candidates: string[],
  messages: { role: string; content: string }[],
  currentMsg: string,
  lookback: number = 6
): string[] {
  if (candidates.length <= 1) return candidates;
  const recent = messages.slice(-lookback);
  const isSingularRef = /那里|这里|那儿|这儿|那个|这个/.test(currentMsg);

  // 优先级 1：最近一条历史用户消息里明确提到的 landmark（用户意图最强）
  // 跳过当前消息（最后一条）
  for (let i = recent.length - 2; i >= 0; i--) {
    if (recent[i].role !== "user") continue;
    const found = candidates.filter((n) => recent[i].content.includes(n));
    if (found.length > 0) {
      console.log(`[Landmarks] narrowed by user history (msg -${recent.length - i}): ${found.join(",")}`);
      return found;
    }
  }

  // 优先级 2：最近一条 assistant 消息 + 用户用了单数指代词 → 只取最后提到的那一个
  if (isSingularRef) {
    for (let i = recent.length - 1; i >= 0; i--) {
      if (recent[i].role !== "assistant") continue;
      const found = candidates.filter((n) => recent[i].content.includes(n));
      if (found.length > 0) {
        const sorted = [...found].sort(
          (a, b) => recent[i].content.lastIndexOf(b) - recent[i].content.lastIndexOf(a)
        );
        console.log(`[Landmarks] narrowed by singular ref to last-mentioned: ${sorted[0]}`);
        return [sorted[0]];
      }
    }
  }

  // 找不到上下文线索，保留全部（保守兜底）
  return candidates;
}

function detectLandmarkQuery(userMessage: string, characterId: string): string[] {
  const hasPracticalKeyword = PRACTICAL_KEYWORDS.some((kw) => userMessage.includes(kw));
  const hasTransport = hasTransportPattern(userMessage);
  if (!hasPracticalKeyword && !hasTransport) return [];

  // 精确匹配：消息里直接提到了景点名
  const exactMatches = Object.keys(landmarkData).filter((name) => userMessage.includes(name));
  if (exactMatches.length > 0) return exactMatches;

  // 代词兜底：说的是"这里""你的故居"等 → 注入该角色所有景点数据
  const hasPronoun = PRONOUN_KEYWORDS.some((kw) => userMessage.includes(kw));
  if (hasPronoun) {
    const charLandmarks = getCharacterLandmarkNames(characterId);
    return charLandmarks.filter((name) => landmarkData[name]);
  }

  // 无景点名也无代词 → 兜底注入角色所有景点（例如只问"门票多少"或"想去你那里"）
  const charLandmarks = getCharacterLandmarkNames(characterId);
  return charLandmarks.filter((name) => landmarkData[name]);
}

function detectDeepQuery(userMessage: string, characterId: string): string[] {
  const hasDeepKeyword = DEEP_KNOWLEDGE_KEYWORDS.some((kw) => userMessage.includes(kw));
  if (!hasDeepKeyword) return [];

  const exactMatches = Object.keys(landmarkData).filter((name) => userMessage.includes(name));
  if (exactMatches.length > 0) return exactMatches;

  const hasPronoun = PRONOUN_KEYWORDS.some((kw) => userMessage.includes(kw));
  if (hasPronoun) {
    return getCharacterLandmarkNames(characterId).filter((name) => landmarkData[name]);
  }

  const hasSpecificDeepKeyword = DEEP_KNOWLEDGE_KEYWORDS
    .filter((kw) => !BROAD_DEEP_KEYWORDS.includes(kw))
    .some((kw) => userMessage.includes(kw));
  if (!hasSpecificDeepKeyword) return [];

  return getCharacterLandmarkNames(characterId).filter((name) => landmarkData[name]);
}

function detectGuideQuery(userMessage: string, characterId: string): string[] {
  const hasGuideKeyword = GUIDE_KEYWORDS.some((kw) => userMessage.includes(kw));
  if (!hasGuideKeyword) return [];

  const exactMatches = Object.keys(landmarkData).filter((name) => userMessage.includes(name));
  if (exactMatches.length > 0) return exactMatches;

  const hasPronoun = PRONOUN_KEYWORDS.some((kw) => userMessage.includes(kw));
  if (hasPronoun) {
    return getCharacterLandmarkNames(characterId).filter((name) => landmarkData[name]);
  }

  return getCharacterLandmarkNames(characterId).filter((name) => landmarkData[name]);
}

// ── 从近期消息中提取景点名（用于追问场景）──
function extractLandmarksFromRecentMessages(
  messages: { role: string; content: string }[],
  lookback: number = 6
): string[] {
  const recent = messages.slice(-lookback);
  const allLandmarkNames = Object.keys(landmarkData);
  const currentMsg = recent[recent.length - 1]?.content || "";
  // 单数指代词：表示用户在指代某一个具体的地点
  const isSingularRef = /那里|这里|那儿|这儿|那个|这个/.test(currentMsg);

  // 优先级 1：最近一条历史用户消息里明确提到的 landmark（用户意图信号最强）
  // 跳过当前消息本身（如果当前消息含 landmark，外层 matchedLandmarks 已经处理）
  for (let i = recent.length - 2; i >= 0; i--) {
    if (recent[i].role !== "user") continue;
    const found = allLandmarkNames.filter((n) => recent[i].content.includes(n));
    if (found.length > 0) {
      console.log(`[Landmarks] from user history (msg -${recent.length - i}): ${found.join(",")}`);
      return found;
    }
  }

  // 优先级 2：最近一条 assistant 消息提到的 landmark
  // 如果用户用了单数指代词（那里/这里等）且 assistant 提到多个 landmark，
  // 只返回 assistant 消息中**最后提到**的那一个（最贴近"那里"的指代对象）
  for (let i = recent.length - 1; i >= 0; i--) {
    if (recent[i].role !== "assistant") continue;
    const found = allLandmarkNames.filter((n) => recent[i].content.includes(n));
    if (found.length > 0) {
      if (isSingularRef && found.length > 1) {
        const sorted = [...found].sort(
          (a, b) => recent[i].content.lastIndexOf(b) - recent[i].content.lastIndexOf(a)
        );
        console.log(`[Landmarks] singular ref, picked last-mentioned from assistant: ${sorted[0]}`);
        return [sorted[0]];
      }
      console.log(`[Landmarks] from assistant (msg -${recent.length - i}): ${found.join(",")}`);
      return found;
    }
  }

  return [];
}

// lastSearchError 已移至每个请求的局部变量，避免并发竞态

// ── 搜索缓存（景点+模式 → 结果，1小时过期）──
const searchCache = new Map<string, { text: string; time: number }>();
const DEFAULT_CACHE_TTL = 60 * 60 * 1000; // 1小时

function getCached(key: string, ttl = DEFAULT_CACHE_TTL): string | null {
  const entry = searchCache.get(key);
  if (entry && Date.now() - entry.time < ttl) return entry.text;
  if (entry) searchCache.delete(key);
  return null;
}

function detectQueryIntent(query: string): string {
  if (["美食", "餐厅", "饭店", "小吃", "吃什么", "吃的"].some((kw) => query.includes(kw))) return "food";
  if (["酒店", "住宿", "民宿", "住哪"].some((kw) => query.includes(kw))) return "hotel";
  if (["地铁", "公交", "交通", "怎么去", "怎么走", "怎么坐", "路线", "几号线", "哪一站"].some((kw) => query.includes(kw)) || hasTransportPattern(query)) return "traffic";
  if (["门票", "票价", "多少钱", "收费", "免费", "预约"].some((kw) => query.includes(kw))) return "ticket";
  if (["开放", "开门", "关门", "营业", "闭馆", "还开吗", "还开放吗"].some((kw) => query.includes(kw))) return "hours";
  if (WEATHER_KEYWORDS.some((kw) => query.includes(kw))) return "weather";
  return "general";
}

function getCacheTtl(mode: "practical" | "deep" | "guide" | "weather", query: string): number {
  if (mode === "weather") return 30 * 60 * 1000;
  if (["今天", "现在", "实时", "还开吗", "还开放吗", "闭馆了吗"].some((kw) => query.includes(kw))) return 60 * 60 * 1000;
  if (mode === "guide") return 12 * 60 * 60 * 1000;
  if (mode === "deep") return 24 * 60 * 60 * 1000;
  return 6 * 60 * 60 * 1000;
}

function getCacheQueryScope(mode: "practical" | "deep" | "guide" | "weather", query: string): string {
  if (mode !== "guide" && mode !== "weather") return "";
  return query.replace(/\s+/g, "").slice(0, 40);
}

async function searchWithGemini(query: string, landmarkNames: string[], mode: "practical" | "deep" | "guide" | "weather", cityName: string, intent?: string): Promise<{ text: string; error: string }> {
  let lastSearchError = "";

  const resolvedIntent = intent || detectQueryIntent(query);
  const queryScope = getCacheQueryScope(mode, query);
  const cacheKey = `${mode}:${resolvedIntent}:${cityName}:${[...landmarkNames].sort().join(",")}:${queryScope}`;
  const cached = getCached(cacheKey, getCacheTtl(mode, query));
  if (cached) {
    return { text: cached, error: "cache_hit" };
  }

  const today = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  const cityPrefix = cityName ? `${cityName}·` : "";
  const names = landmarkNames.map((n) => `${cityPrefix}${n}`).join("、");
  const cityHint = cityName ? `注意：所有景点均位于中国${cityName}，请只搜索${cityName}的相关信息，不要混淆其他城市的同名景点。` : "";

  // 从用户消息提取出发���（匹配"从X到/去/出发"模式）
  const originMatch = query.match(/从(.{2,15}?)(?:到|去|出发|坐|怎���)/);
  const origin = originMatch?.[1] || "";

  // 本地交通参考（无出发地时提供最近站点作为搜索基线）
  const localTransportHints = !origin ? landmarkNames
    .map((n) => landmarkData[n]?.transport ? `${n}参考：${landmarkData[n].transport}` : "")
    .filter(Boolean).join("；") : "";
  const transportRef = localTransportHints ? `\n参考信息（仅供交叉验证，以搜索结果为准）：${localTransportHints}` : "";

  // 按用户意图构造精准搜索词（比笼统的"请提供实用信息"准确率高很多）
  const intentPrompts: Record<string, string> = {
    traffic: origin
      ? `今天是${today}。请按以下步骤搜索从【${origin}】到【${names}】的交通路线：\n第一步：确认【${origin}】最近的地铁站是哪个（几号线、站名）。\n第二步：确认【${names}】最近的地铁站是哪个（几号线、站名、哪个出口）。\n第三步：基于以上两个站点，给出完整的地铁换乘路线（从哪站上车、坐几号线、在哪站换乘几号线、在哪站下车）。\n同时请补充公交方案和骑行距离参考。${cityHint}用户问题：${query}`
      : `今天是${today}。请搜索到${names}的详细交通方式：最近的地铁站（几号线、站名、哪个出口、步行约几分钟到达）、公交路线（几路车、在哪站下车）、骑行距离参考。${cityHint}${transportRef}\n用户问题：${query}`,
    food: `今天是${today}。请搜索${names}附近步行可达的餐厅推荐：具体店名、招牌菜、人均消费、距景点步行距离。可参考大众点评、美团、携程、小红书等平台，但只保留多来源较一致或表述稳妥的推荐。${cityHint}用户问题：${query}`,
    hotel: `今天是${today}。请搜索${names}附近的住宿推荐：酒店或民宿名称、每晚价格范围、评分、距景点距离。价格波动较大时请给区间并说明以预订平台实时价格为准。${cityHint}用户问题：${query}`,
    ticket: `今天是${today}。请搜索${names}的最新门票信息：当前票价、优惠政策、是否需要预约、预约渠道。门票和预约政策必须优先参考官方或官方票务渠道。${cityHint}用户问题：${query}`,
    hours: `今天是${today}。请搜索${names}的最新开放时间：每日开放关闭时间、是否周一闭馆、近期特殊安排。开放时间和闭馆安排必须优先参考官方渠道。${cityHint}用户问题：${query}`,
    weather: `今天是${today}。请搜索中国${cityName}最新天气预报：今天和未来3天的天气状况、最高最低气温、降水概率、穿衣建议。天气信息优先参考天气服务和近期预报。用户问题：${query}`,
  };

  const prompts: Record<string, string> = {
    practical: `今天是${today}。请提供${names}的最新实用信息，包括：交通方式（地铁线路和站点、公交线路）、开放时间、门票价格、详细地址。高风险信息优先查官方来源，无法确认时不要强答。${cityHint}用户的具体问题：${query}`,
    guide: `今天是${today}。请从小红书、马蜂窝、携程、大众点评、美团等旅游平台搜索${names}的最新旅游攻略，同时对门票、开放时间、预约政策优先参考官方渠道。请整合真实用户分享，包括：最佳游览路线、推荐游览时间、周边美食推荐（具体店名和招牌菜）、拍照打卡点、注意事项和实用建议。${cityHint}用户的具体问题：${query}`,
    deep: `今天是${today}。请详细介绍以下中国景点的历史文化背景：${names}。历史文化内容优先参考较权威的百科、景区介绍、博物馆或官方文旅资料；传说和民间故事要与史实区分。${cityHint}用户的具体问题：${query}`,
    weather: intentPrompts.weather,
  };

  const baseSearchPrompt = (resolvedIntent && intentPrompts[resolvedIntent]) ? intentPrompts[resolvedIntent] : prompts[mode];
  const searchPrompt = `${baseSearchPrompt}\n\n${SEARCH_RELIABILITY_RULES}`;

  const isTransient = (err: unknown) => {
    const s = String(err);
    return s.includes("500") || s.includes("503") || s.includes("UNAVAILABLE") || s.includes("INTERNAL") || s.includes("overloaded") || s.includes("timeout");
  };
  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const callSearch = (timeoutMs = 18000) =>
    Promise.race([
      getAI().models.generateContent({
        model: "gemini-2.5-flash",
        contents: searchPrompt,
        config: { tools: [{ googleSearch: {} }], temperature: 0.3, thinkingConfig: { thinkingBudget: 0 } },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout_search")), timeoutMs)
      ),
    ]);

  // gemini-2.5-flash 重试策略：503 时最多重试 1 次（超时不重试，避免超出 Vercel 60s 限制）
  const RETRY_DELAYS = [3000];
  try {
    let result;
    let lastErr = "";
    try {
      result = await callSearch();
    } catch (err: unknown) {
      lastErr = err instanceof Error ? err.message : String(err);
      let searchKeysLeft = getKeyCount() - 1;
      while (searchKeysLeft-- > 0 && isQuotaError(lastErr) && switchKey()) {
        try { result = await callSearch(); lastErr = ""; } catch (qErr: unknown) {
          lastErr = qErr instanceof Error ? qErr.message : String(qErr);
        }
      }
      if (lastErr && isTransient(lastErr)) {
        const isTimeout = lastErr.includes("timeout");
        const retryDelays = isTimeout ? [] : RETRY_DELAYS;
        for (const wait of retryDelays) {
          console.log(`[Search] transient error, retry in ${wait / 1000}s...`);
          await delay(wait);
          try {
            result = await callSearch(14000);
            lastErr = "";
            break;
          } catch (retryErr: unknown) {
            lastErr = retryErr instanceof Error ? retryErr.message : String(retryErr);
            if (!isTransient(lastErr)) break;
          }
        }
      }
    }
    if (lastErr) lastSearchError = lastErr;

    let text = result?.text || "";
    if (!text) {
      lastSearchError = (lastSearchError ? lastSearchError + " | " : "") + "empty_response";
    } else {
      // 截断过长的搜索结果，防止 system prompt 过大导致 Gemma 500
      if (text.length > 1500) text = text.slice(0, 1500) + "\n…（信息已截断）";
      searchCache.set(cacheKey, { text, time: Date.now() });
    }
    return { text, error: lastSearchError };
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    lastSearchError = (lastSearchError ? lastSearchError + " | " : "") + errMsg;
    console.error("Gemini Search error:", errMsg);
    return { text: "", error: lastSearchError };
  }
}

function buildLandmarkContext(landmarkNames: string[]): string {
  if (landmarkNames.length === 0) return "";
  const blocks = landmarkNames.map((name) => {
    const info = landmarkData[name];
    if (!info) return "";
    return `【${name}】地址：${info.address}`;
  }).filter(Boolean).join("\n");

  return `

## 以下是你守护的景点的基本信息
${blocks}

如果用户问到开放时间、门票、交通等实用信息，你可以说"具体信息建议查看地图确认最新情况"。不要编造具体的时间、价格或路线。`;
}

function buildSystemPrompt(characterId: string, landmarkContext = ""): string {
  const persona = personas[characterId];
  if (!persona) {
    return "你是一位博学的历史人物，请以第一人称与用户友好交流。";
  }
  return persona + "\n" + GLOBAL_CONSTRAINTS + landmarkContext;
}

function createSSE() {
  const enc = new TextEncoder();
  let ctrl: ReadableStreamDefaultController;
  const readable = new ReadableStream({
    start(c) { ctrl = c; },
  });
  const send = (obj: Record<string, unknown>) => {
    try { ctrl.enqueue(enc.encode(`data: ${JSON.stringify(obj)}\n\n`)); } catch {}
  };
  const end = () => { try { ctrl.close(); } catch {} };
  return { readable, send, end };
}

// Gemma 4 有 thinking 模式（无法关闭），思考会吃掉部分 maxOutputTokens 预算
// 须给 thinking + 实际响应都留余量，否则 thinking 吃完后无 token 输出 → empty_stream
const LENGTH_CONFIG = {
  brief:    { maxTokens: 1500, instruction: "回复控制在100-150字，简洁有力" },
  standard: { maxTokens: 3000, instruction: "回复控制在200-400字，内容丰富有深度" },
  detailed: { maxTokens: 5000, instruction: "回复不少于400字，上限600字，务必深入展开，讲述细节、典故与个人经历" },
};

// Next.js App Router: 提高 Vercel 函数超时上限
export const maxDuration = 60;

type ChatRequest = {
  characterId: string;
  messages: { role: string; content: string }[];
  imageBase64?: string;
  imageMimeType?: string;
  lengthMode?: unknown;
};

// 校验 /api/chat 请求体；通过则返回 data，否则返回对应的错误响应
async function parseChatRequest(
  request: Request,
): Promise<{ ok: true; data: ChatRequest } | { ok: false; response: Response }> {
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return { ok: false, response: Response.json({ error: "请求体格式错误" }, { status: 400 }) };
  }
  const { characterId, messages, imageBase64, imageMimeType, lengthMode } = body as {
    characterId?: unknown;
    messages?: unknown;
    imageBase64?: unknown;
    imageMimeType?: unknown;
    lengthMode?: unknown;
  };
  if (typeof characterId !== "string" || !Array.isArray(messages)) {
    return { ok: false, response: Response.json({ error: "缺少必要参数" }, { status: 400 }) };
  }
  // 防御性限制：拒绝超长历史，避免异常 payload 拖垮内存/CPU（下游仍会截断到 20 条）
  if (messages.length > 500) {
    return { ok: false, response: Response.json({ error: "消息历史过长" }, { status: 413 }) };
  }
  if (imageBase64 !== undefined && typeof imageBase64 !== "string") {
    return { ok: false, response: Response.json({ error: "图片字段格式错误" }, { status: 400 }) };
  }
  if (imageMimeType !== undefined && typeof imageMimeType !== "string") {
    return { ok: false, response: Response.json({ error: "图片类型字段格式错误" }, { status: 400 }) };
  }
  return { ok: true, data: { characterId, messages, imageBase64, imageMimeType, lengthMode } };
}

export async function POST(request: Request) {
  try {
    const parsed = await parseChatRequest(request);
    if (!parsed.ok) return parsed.response;
    const { characterId, messages, imageBase64, imageMimeType, lengthMode } = parsed.data;
    const lengthCfg = LENGTH_CONFIG[(lengthMode as keyof typeof LENGTH_CONFIG) || "standard"];

    // ── 消息截断：只发送最近 20 条给模型 ──
    const MAX_MESSAGES = 20;
    const trimmedMessages = messages.length > MAX_MESSAGES
      ? messages.slice(messages.length - MAX_MESSAGES)
      : messages;

    // 检测最新一条用户消息是否在问景点实用信息
    const lastUserMessage: string =
      [...trimmedMessages].reverse().find((m: { role: string }) => m.role === "user")
        ?.content || "";

    let matchedLandmarks = detectLandmarkQuery(lastUserMessage, characterId);
    let deepLandmarks = detectDeepQuery(lastUserMessage, characterId);
    let guideLandmarks = detectGuideQuery(lastUserMessage, characterId);

    // 用户当前消息是否明确点名了某个 landmark
    const hasExactInCurrent = Object.keys(landmarkData).some((n) => lastUserMessage.includes(n));
    // 如果当前消息没有点名（detect 函数走的 pronoun/catch-all 兜底注入了角色全部景点），
    // 用对话历史缩窄到用户真正在指代的那一个
    if (!hasExactInCurrent) {
      matchedLandmarks = narrowLandmarksByHistory(matchedLandmarks, trimmedMessages, lastUserMessage);
      deepLandmarks = narrowLandmarksByHistory(deepLandmarks, trimmedMessages, lastUserMessage);
      guideLandmarks = narrowLandmarksByHistory(guideLandmarks, trimmedMessages, lastUserMessage);
    }

    // ── 追问补全：有搜索关键词但没匹配到景点 → 从近期消息中提取 ──
    const policyKeywords = Object.values(SEARCH_POLICY_KEYWORDS).flat();
    const hasAnySearchKeyword = [...GUIDE_KEYWORDS, ...PRACTICAL_KEYWORDS, ...DEEP_KNOWLEDGE_KEYWORDS, ...policyKeywords]
      .some((kw) => lastUserMessage.includes(kw)) || hasTransportPattern(lastUserMessage);
    const hasRealtimeKeyword = SEARCH_POLICY_KEYWORDS.realtime.some((kw) => lastUserMessage.includes(kw));
    const shouldSearchPractical = hasRealtimeKeyword || SEARCH_POLICY_KEYWORDS.alwaysSearchPractical.some((kw) => lastUserMessage.includes(kw));
    const shouldSearchGuide = SEARCH_POLICY_KEYWORDS.alwaysSearchGuide.some((kw) => lastUserMessage.includes(kw));
    const shouldSearchDeep = SEARCH_POLICY_KEYWORDS.deepSearch.some((kw) => lastUserMessage.includes(kw));
    const allEmpty = guideLandmarks.length === 0 && matchedLandmarks.length === 0 && deepLandmarks.length === 0;

    let recentLandmarks: string[] = [];
    if (hasAnySearchKeyword && allEmpty) {
      recentLandmarks = extractLandmarksFromRecentMessages(trimmedMessages);
    }

    // 确定搜索模式：普通实用问题本地优先，强实时/攻略问题才调用 Gemini Search
    let searchContext = "";
    let searchMode = "none";
    let searchDecision: "none" | "local_first" | "gemini_search" = "none";
    let searchReason = hasAnySearchKeyword ? "local_data_sufficient" : "no_realtime_need";
    let searchLandmarks: string[] = [];
    let localFallbackLandmarks: string[] = matchedLandmarks;

    if (guideLandmarks.length > 0) {
      searchMode = "guide";
      searchLandmarks = guideLandmarks;
      localFallbackLandmarks = guideLandmarks;
      searchDecision = "gemini_search";
      searchReason = "guide_keyword";
    } else if (matchedLandmarks.length > 0) {
      localFallbackLandmarks = matchedLandmarks;
      const hasPracticalKw = PRACTICAL_KEYWORDS.some((kw) => lastUserMessage.includes(kw));
      if (hasPracticalKw || shouldSearchPractical || hasTransportPattern(lastUserMessage)) {
        searchMode = "practical";
        searchLandmarks = matchedLandmarks;
        searchDecision = "gemini_search";
        searchReason = "practical_keyword";
      } else {
        searchDecision = "none";
        searchReason = "no_practical_need";
      }
    } else if (deepLandmarks.length > 0) {
      localFallbackLandmarks = deepLandmarks;
      searchDecision = shouldSearchDeep || hasRealtimeKeyword ? "gemini_search" : "none";
      searchReason = searchDecision === "gemini_search" ? "deep_knowledge_keyword" : "persona_or_history_only";
      if (searchDecision === "gemini_search") {
        searchMode = "deep";
        searchLandmarks = deepLandmarks;
      }
    } else if (recentLandmarks.length > 0) {
      localFallbackLandmarks = recentLandmarks;
      if (GUIDE_KEYWORDS.some((kw) => lastUserMessage.includes(kw))) {
        searchMode = "guide";
        searchDecision = "gemini_search";
        searchReason = "followup_guide_keyword";
      } else if (PRACTICAL_KEYWORDS.some((kw) => lastUserMessage.includes(kw)) || hasTransportPattern(lastUserMessage)) {
        searchMode = "practical";
        searchDecision = "gemini_search";
        searchReason = "followup_practical_keyword";
      } else if (DEEP_KNOWLEDGE_KEYWORDS.some((kw) => lastUserMessage.includes(kw))) {
        searchDecision = shouldSearchDeep || hasRealtimeKeyword ? "gemini_search" : "none";
        searchReason = searchDecision === "gemini_search" ? "followup_deep_knowledge_keyword" : "followup_persona_or_history_only";
        if (searchDecision === "gemini_search") searchMode = "deep";
      } else {
        searchReason = "followup_persona_or_history_only";
      }
      if (searchDecision === "gemini_search") searchLandmarks = recentLandmarks;
    }

    const cityName = getCharacterCityName(characterId);
    const queryIntent = detectQueryIntent(lastUserMessage);

    // 天气查询：无需景点匹配，直接走 Gemini Search（城市级别）
    if (WEATHER_KEYWORDS.some((kw) => lastUserMessage.includes(kw)) && searchMode === "none") {
      searchMode = "weather";
      searchDecision = "gemini_search";
      searchReason = "weather_query";
    }

    let lastSearchError = "";

    if (searchDecision === "gemini_search" && searchMode !== "none" && (searchLandmarks.length > 0 || searchMode === "weather")) {
      console.log(`[Search] mode=${searchMode}, intent=${queryIntent}, city=${cityName}, landmarks=${searchLandmarks.join(",")}, query="${lastUserMessage}"`);
      const searchRes = await searchWithGemini(lastUserMessage, searchLandmarks, searchMode as "practical" | "deep" | "guide" | "weather", cityName, queryIntent);
      lastSearchError = searchRes.error;
      console.log(`[Search] result length=${searchRes.text.length}, error=${searchRes.error || "none"}, first 100 chars: ${searchRes.text.substring(0, 100)}`);

      if (searchRes.text) {
        const focusHint: Record<string, string> = {
          guide: "侧重旅游攻略：把交通方式（地铁几号线、哪一站）、美食推荐（具体店名、招牌菜、人均价格）、住宿建议（酒店名、价位）、门票和开放时间等实用信息自然地融入你的回答中",
          practical: "侧重实用信息：把交通路线、门票价格、开放时间、具体地址等信息自然地融入你的回答中",
          deep: "侧重历史文化：把景点的历史背景、文化典故、建筑特色等知识自然地融入你的回答中",
          weather: "侧重天气和出行：把天气、温度、降水和穿衣建议自然地融入你的回答中",
        };
        searchContext = `\n\n## 以下是关于该景点的最新情况，请自然融入你的回答中。${focusHint[searchMode]}。请包含具体的名称、数字、地址等信息，不要笼统带过。若信息存在冲突或不确定，请用谨慎语气提醒”临行前以官方公告或地图实时信息为准”，不要把不确定内容说成定论。\n${searchRes.text}`;
      } else {
        searchReason = "quota_or_api_error";
      }
    }

    // 本地数据作为保底（搜索失败时仍有基础信息）
    const landmarkContext = searchContext ? "" : buildLandmarkContext(localFallbackLandmarks);
    const dataSource = searchContext ? (lastSearchError === "cache_hit" ? "search_cache" : "gemini_search") : (landmarkContext ? "local_landmark_data" : "persona_only");

    // 实用信息跳转链接（所有实用问题 → 高德地图）
    const LINK_INTENTS = ["traffic", "food", "hotel", "ticket", "hours"];
    const primaryLandmark = searchLandmarks[0] || localFallbackLandmarks[0] || "";
    const practicalLink = (LINK_INTENTS.includes(queryIntent) && primaryLandmark)
      ? { type: queryIntent, landmark: primaryLandmark, city: cityName }
      : null;

    // searchContext 附加在最后一条用户消息末尾，而非 system prompt
    // 模型对临近用户输入的注意力远高于长 system prompt 中段，能显著提升搜索数据引用率
    // 字数限制同时放在顶部（高注意力）和角色设定后（语境强化），双重提示
    const systemPrompt =
      `【字数约束（最重要）】${lengthCfg.instruction}。请在句号自然结束，绝不长篇大论。\n\n` +
      buildSystemPrompt(characterId, landmarkContext) +
      `\n- ${lengthCfg.instruction}`;

    // 构建消息历史，最后一条用户消息如果带图片则附加图片数据，且附加搜索数据
    const buildUserContent = (originalText: string): string => {
      if (!searchContext) return originalText;
      return `${originalText}\n\n${searchContext}\n\n（请基于以上"守护者最新见闻"中的具体数据，以角色口吻自然回答上面的问题，必须引用其中的地址、票价、时刻、路线、店名等具体信息。）`;
    };

    const contents = trimmedMessages.map(
      (msg: { role: string; content: string }, index: number) => {
        const isLastUserMsg =
          index === trimmedMessages.length - 1 && msg.role === "user";

        if (isLastUserMsg && imageBase64 && imageMimeType) {
          return {
            role: "user",
            parts: [
              { text: buildUserContent(msg.content) },
              { inlineData: { mimeType: imageMimeType, data: imageBase64 } },
            ],
          };
        }

        if (isLastUserMsg) {
          return {
            role: "user",
            parts: [{ text: buildUserContent(msg.content) }],
          };
        }

        return {
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        };
      }
    );

    // Gemma-4 重试：500/503 时重试 1 次
    const isGemmaTransient = (s: string) =>
      s.includes("500") || s.includes("503") || s.includes("UNAVAILABLE") || s.includes("INTERNAL");

    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

    // 带图片 → 31B（vision），纯文本 → 26B MoE（快且质量好）
    const hasImage = !!(imageBase64 && imageMimeType);
    const gemmaModel = hasImage ? "gemma-4-31b-it" : "gemma-4-26b-a4b-it";
    const gemmaTimeout = hasImage ? 35000 : 30000;

    // ── SSE 流式输出 ──
    const { readable, send, end } = createSSE();
    console.log("[Debug]", JSON.stringify({ gemmaModel, searchDecision, searchReason, searchMode, dataSource, searchLandmarks, localFallbackLandmarks, searchError: lastSearchError || null }));

    (async () => {
      try {
        let gemmaStream = null;
        let gemmaError = "";

        const streamGemma = () =>
          Promise.race([
            getAI().models.generateContentStream({
              model: gemmaModel,
              contents,
              config: {
                systemInstruction: systemPrompt,
                temperature: 0.8,
                maxOutputTokens: lengthCfg.maxTokens,
              },
            }),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error(`gemma_timeout_${gemmaTimeout / 1000}s`)), gemmaTimeout)
            ),
          ]);

        try {
          gemmaStream = await streamGemma();
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          if (isQuotaError(err)) {
            let keysLeft = getKeyCount() - 1;
            while (keysLeft-- > 0 && switchKey()) {
              try { gemmaStream = await streamGemma(); break; } catch (re: unknown) {
                gemmaError = re instanceof Error ? re.message : String(re);
                if (!isQuotaError(re)) break;
              }
            }
          } else if (isGemmaTransient(msg)) {
            console.log("[Gemma] transient error, retry in 3s...");
            await delay(3000);
            try { gemmaStream = await streamGemma(); } catch (re: unknown) {
              gemmaError = re instanceof Error ? re.message : String(re);
            }
          } else {
            gemmaError = msg;
          }
        }

        // Gemma 流成功 → 逐块发送（追踪是否发送了任何文字）
        // 流式句末截断：累计超 softMaxChars 时，等当前 chunk 以 。/！/？ 结尾就停
        const streamSoftMax = { brief: 150, standard: 400, detailed: 600 }[(lengthMode as string) || "standard"] || 400;
        const streamAbsoluteMax = { brief: 280, standard: 700, detailed: 950 }[(lengthMode as string) || "standard"] || 700;
        const isSentenceEnd = (s: string) => /[。！？]/.test(s);
        if (gemmaStream) {
          try {
            let sentAnyText = false;
            let chunkCount = 0;
            let accumulatedLen = 0;
            let earlyStop: "soft" | "hard" | null = null;
            for await (const chunk of gemmaStream) {
              chunkCount++;
              if (chunkCount === 1) {
                console.log("[Gemma] first chunk:", JSON.stringify({
                  hasText: !!chunk.text, textLen: chunk.text?.length ?? 0,
                  candidates: chunk.candidates?.length ?? 0,
                }));
              }
              if (chunk.text) {
                send({ t: chunk.text });
                sentAnyText = true;
                accumulatedLen += chunk.text.length;
                const lastChar = chunk.text.trimEnd().slice(-1);
                // 软截断：超 softMax 且当前 chunk 收在句末 → 自然停止
                if (accumulatedLen >= streamSoftMax && isSentenceEnd(lastChar)) {
                  earlyStop = "soft";
                  break;
                }
                // 硬截断：超 absoluteMax → 强制停止；末尾不是句末则补一个 。
                if (accumulatedLen >= streamAbsoluteMax) {
                  if (!isSentenceEnd(lastChar)) send({ t: "。" });
                  earlyStop = "hard";
                  break;
                }
              }
            }
            console.log("[Gemma] stream done. chunks:", chunkCount, "sentAnyText:", sentAnyText, "len:", accumulatedLen, "earlyStop:", earlyStop || "no");
            if (sentAnyText) {
              if (practicalLink) send({ link: practicalLink });
              const warn = consumeKeyWarning();
              if (warn) send({ warn });
              send({ done: true });
              return;
            }
            // 流结束但没有文字 → 视为失败，fall through 到兜底
            gemmaError = "empty_stream";
          } catch (iterErr: unknown) {
            gemmaError = iterErr instanceof Error ? iterErr.message : String(iterErr);
            console.error("[Gemma] stream iteration error:", gemmaError);
          }
        }

        console.log("[Debug] gemmaError:", gemmaError);

        // Gemma 失败但搜索成功 → Gemini 整理搜索结果（generateContent，稳定可靠）
        if (searchContext) {
          console.log("[Fallback] Gemma failed, using Gemini to summarize...");
          const charName = cities.flatMap(c => c.characters).find(c => c.id === characterId)?.name || "历史人物";
          const rawSearchContent = searchContext.replace(/^[\s\S]*?##[^\n]*\n/, "").trim();
          const minChars = { brief: 80, standard: 200, detailed: 400 }[(lengthMode as string) || "standard"] || 200;
          const softMaxChars = { brief: 150, standard: 400, detailed: 600 }[(lengthMode as string) || "standard"] || 400;
          const hardMaxChars = { brief: 200, standard: 450, detailed: 700 }[(lengthMode as string) || "standard"] || 450;
          const fallbackMaxTokens = { brief: 400, standard: 1000, detailed: 1500 }[(lengthMode as string) || "standard"] || 1000;
          const summarizePrompt = `你是${charName}。请用友好的第一人称口吻，基于以下搜索资料回答用户的问题。\n\n**严格字数要求：${minChars}-${softMaxChars} 字，绝对不要超过 ${softMaxChars} 字**\n\n要求：\n- 纯文本输出，不使用 Markdown、表格或项目符号\n- 第一段保持历史人物口吻，结合自己的时代背景自然回应（1-2 句即可）\n- 第二段把核心实用信息说清楚（地址、时间、路线等只挑最关键的，不必全塞）\n- 如果资料对门票、开放时间、预约、交通路线或价格存在不确定性，请用谨慎语气提醒用户临行前以官方或地图实时信息为准，不要强行断定\n- ${lengthCfg.instruction}\n- 直接输出回答，不要加前缀\n\n用户问题：${lastUserMessage}\n\n搜索资料：\n${rawSearchContent}`;

          let summarizeOk = false;
          let sumKeysLeft = getKeyCount();
          while (sumKeysLeft-- > 0) {
            try {
              const summaryResult = await Promise.race([
                getAI().models.generateContent({
                  model: "gemini-2.5-flash",
                  contents: summarizePrompt,
                  config: { temperature: 0.7, maxOutputTokens: fallbackMaxTokens, thinkingConfig: { thinkingBudget: 0 } },
                }),
                new Promise<never>((_, reject) =>
                  setTimeout(() => reject(new Error("gemini_summarize_timeout")), 12000)
                ),
              ]);
              const summaryText = summaryResult?.text || "";
              if (summaryText) {
                // 兜底句号截断：超过 hardMaxChars 时在最后一个完整句末截断
                let finalText = summaryText;
                if (finalText.length > hardMaxChars) {
                  const slice = finalText.slice(0, hardMaxChars);
                  const lastEnd = Math.max(
                    slice.lastIndexOf("。"),
                    slice.lastIndexOf("！"),
                    slice.lastIndexOf("？"),
                  );
                  if (lastEnd > hardMaxChars * 0.5) {
                    finalText = slice.slice(0, lastEnd + 1) + "…";
                    console.log("[Fallback] truncated", summaryText.length, "->", finalText.length, "chars");
                  }
                }
                send({ t: finalText });
                if (practicalLink) send({ link: practicalLink });
                const warn = consumeKeyWarning();
                if (warn) send({ warn });
                send({ done: true });
                summarizeOk = true;
              }
              break;
            } catch (sumErr: unknown) {
              if (isQuotaError(sumErr) && switchKey()) continue;
              console.error("[Fallback] Gemini summarize failed:", sumErr);
              break;
            }
          }
          if (summarizeOk) return;

          // 截断搜索摘要兜底
          const maxChars = { brief: 150, standard: 400, detailed: 600 }[(lengthMode as string) || "standard"] || 400;
          const raw = searchContext.replace(/^[\n#\s]*以下是.*\n/, "").trim();
          const truncated = raw.length > maxChars ? raw.slice(0, maxChars) + "…" : raw;
          send({ t: `容我整理一下思绪……先把要紧的信息给你。涉及门票、开放时间或路线的部分，临行前最好再核实一下官方公告。\n\n${truncated}` });
          if (practicalLink) send({ link: practicalLink });
          send({ done: true });
          return;
        }

        // 普通对话 Gemma 失败 → Gemini 角色兜底（generateContent，稳定可靠）
        console.log("[Fallback] Gemma failed, using Gemini persona...");
        const recentText = trimmedMessages
          .slice(-8)
          .map((msg: { role: string; content: string }) =>
            `${msg.role === "assistant" ? "角色" : "用户"}：${msg.content}`
          )
          .join("\n");
        const fallbackPrompt = `请严格扮演下列角色，用第一人称、纯文本、自然口吻回答最后一个用户问题。不要说自己是 AI，不要使用 Markdown，不要编造角色资料之外的作品或史实。\n\n角色设定：\n${systemPrompt}\n\n最近对话：\n${recentText}\n\n最后用户问题：${lastUserMessage}`;
        let personaOk = false;
        let pKeysLeft = getKeyCount();
        while (pKeysLeft-- > 0) {
          try {
            const personaResult = await Promise.race([
              getAI().models.generateContent({
                model: "gemini-2.5-flash",
                contents: fallbackPrompt,
                config: { temperature: 0.7, maxOutputTokens: lengthCfg.maxTokens },
              }),
              new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error("gemini_persona_timeout")), 10000)
              ),
            ]);
            const personaText = personaResult?.text || "";
            if (personaText) {
              send({ t: personaText });
              if (practicalLink) send({ link: practicalLink });
              const warn = consumeKeyWarning();
              if (warn) send({ warn });
              send({ done: true });
              personaOk = true;
            }
            break;
          } catch (pErr: unknown) {
            if (isQuotaError(pErr) && switchKey()) continue;
            console.error("[Fallback] Gemini persona failed:", pErr);
            break;
          }
        }
        if (personaOk) return;

        // 都失败
        console.error("All models failed. gemmaError:", gemmaError);
        send({ error: "我一时语塞，容我缓缓……你不妨稍后再问一次。若急着查交通或门票，临行前以官方公告或地图实时信息为准最稳妥。" });
        send({ done: true });
      } catch (err) {
        console.error("SSE stream error:", err);
        send({ error: "我一时语塞……你不妨稍后再问一次。" });
        send({ done: true });
      } finally {
        end();
      }
    })();

    return new Response(readable, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" },
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("Chat API error:", errMsg);
    return Response.json({ error: "我一时语塞……你不妨稍后再问一次。" }, { status: 500 });
  }
}
