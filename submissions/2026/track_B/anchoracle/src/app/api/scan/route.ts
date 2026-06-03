import { cities, type Landmark, type SceneType } from "@/data/characters";
import { landmarkData } from "@/data/landmarks";
import { personas, GLOBAL_CONSTRAINTS } from "@/data/personas";
import { getAI, isQuotaError, switchKey, consumeKeyWarning } from "@/lib/aiClient";
import { LANDMARK_ALIASES } from "@/data/landmarkAliases";

// 调试开关：默认关闭，仅在显式设置 DEBUG_API=true 时返回内部 _debug 数据
const DEBUG_API = process.env.DEBUG_API === "true";

export const maxDuration = 60;

const IMAGE_BASE64_LIMIT = 5 * 1024 * 1024;
const FLASH_VISION_TIMEOUT = 20000;
const GEMMA_NARRATE_TIMEOUT = 15000;

type LandmarkInfo = {
  characterId: string;
  characterName: string;
  cityId: string;
  cityName: string;
  avatar: string;
};

type CityOption = (typeof cities)[number];

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(label)), ms)
    ),
  ]);
}

function jsonWithDebug(
  payload: Record<string, unknown>,
  debug?: Record<string, unknown>,
  init?: ResponseInit
) {
  const warn = consumeKeyWarning();
  const out = { ...payload, ...(warn && { _keyWarning: warn }) };
  return Response.json(DEBUG_API && debug ? { ...out, _debug: debug } : out, init);
}

function buildLandmarkMap() {
  const map: Record<string, LandmarkInfo> = {};
  for (const city of cities) {
    for (const char of city.characters) {
      for (const lm of char.landmarks) {
        if (!map[lm.name]) {
          map[lm.name] = {
            characterId: char.id,
            characterName: char.name,
            cityId: city.id,
            cityName: city.name,
            avatar: char.avatar,
          };
        }
      }
    }
  }
  return map;
}

const landmarkMap = buildLandmarkMap();
const landmarkNames = Object.keys(landmarkMap);

const CITY_FALLBACKS: { keywords: string[]; characterId: string }[] = [
  { keywords: ["杭州", "西湖", "钱塘"], characterId: "sushi" },
  { keywords: ["无锡", "太湖", "惠山", "江阴"], characterId: "gukaizhi" },
  { keywords: ["南京", "金陵", "秦淮", "紫金山"], characterId: "libai" },
  { keywords: ["苏州", "姑苏", "园林", "虎丘", "沧浪"], characterId: "tangbohu" },
  { keywords: ["上海", "浦东", "黄浦", "外滩", "陆家嘴", "虹口"], characterId: "luxun-sh" },
  { keywords: ["北京", "故宫", "天安门", "胡同", "紫禁城"], characterId: "laoshe" },
  { keywords: ["天津", "海河", "天津卫", "五大道"], characterId: "lishutong" },
  { keywords: ["重庆", "朝天门", "嘉陵江", "山城", "渝中", "北碚"], characterId: "luzuofu" },
  { keywords: ["武汉", "黄鹤楼", "东湖", "武昌", "汉口", "汉阳"], characterId: "cuihao" },
  { keywords: ["成都", "锦官城", "天府", "蜀", "都江堰"], characterId: "dufu" },
];

const ANGLES = [
  "请从你第一次到访此地的记忆讲起",
  "请提到一位你曾在此处相遇的友人或故交",
  "请引用一句你在此处有感而发的诗句或名言，并讲述背后的故事",
  "请描述此地在不同季节的变化，以及你最爱的那个时节",
  "请从一件你在此地亲身经历的具体小事讲起",
  "请讲述一个与此地有关的、鲜为人知的趣事",
  "请描述你在此地度过的最难忘的一个夜晚或清晨",
  "请谈谈此地对你人生的影响或启发",
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getCityById(cityId?: string): CityOption | null {
  if (!cityId) return null;
  return cities.find((city) => city.id === cityId) || null;
}

function getCandidateNames(city?: CityOption | null): string[] {
  if (!city) return landmarkNames;
  return city.characters.flatMap((char) => char.landmarks.map((lm) => lm.name));
}

function guessCityCharacter(description: string, selectedCity?: CityOption | null): string {
  if (selectedCity?.characters[0]) return selectedCity.characters[0].id;
  for (const { keywords, characterId } of CITY_FALLBACKS) {
    if (keywords.some((kw) => description.includes(kw))) return characterId;
  }
  return "sushi";
}

function findCharacterInfo(characterId: string) {
  for (const city of cities) {
    const char = city.characters.find((c) => c.id === characterId);
    if (char) return { character: char, cityName: city.name };
  }
  return null;
}

function isRetryableError(err: unknown): boolean {
  const s = String(err);
  return s.includes('"code":500') || s.includes('"code":503') || s.includes("INTERNAL") || s.includes("UNAVAILABLE") || s.includes("Internal error") || s.includes("high demand");
}

async function generateWithKeyRetry<T>(run: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  // 最多 2 次尝试（首次 + 1 次重试），避免累计超时超出 Vercel 60s 限制
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await run();
    } catch (error) {
      lastError = error;
      if (isQuotaError(error) && switchKey()) continue;
      if (isRetryableError(error) && attempt < 1) {
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

// SceneType 全集（必须与 src/data/characters.ts 的 SceneType 完全一致）
// Gemma 必须从这 10 个里挑一个，避免自创类别让后端打分失效
const SCENE_TYPE_VOCAB: SceneType[] = [
  "室内陈列",
  "民居院落",
  "开阔公园",
  "纪念广场",
  "园林",
  "自然景观",
  "城市街景",
  "历史建筑",
  "校园",
  "古镇街区",
];

// 主体类型枚举：决定打分中"故居 vs 公园"等冲突的关键信号
type SubjectType =
  | "人物雕像"
  | "建筑外观"
  | "室内陈设"
  | "广角风景"
  | "自然景物"
  | "其他";

const SUBJECT_TYPE_VOCAB: SubjectType[] = [
  "人物雕像",
  "建筑外观",
  "室内陈设",
  "广角风景",
  "自然景物",
  "其他",
];

type VisionDescription = {
  text_on_image: string[];
  scene_type: SceneType | "";
  subject_type: SubjectType | "";
  notable_features: string[];
  possible_name: string;
  // 新增：直接让 Gemma 从 30 人闭卷清单里挑出雕像人物。
  // 解决"无城市 + 人物雕像"场景下，仅靠视觉特征无法分辨"哪个纪念馆/公园"的根本问题。
  // 一旦 Gemma 能正确识别雕像人物（如鲁迅），后端反查 character 锁定 3 个候选景点。
  person_in_statue: string;
  // 供 visionToText / debug 使用的辅助字段
  building_style: string;
  surroundings: string;
};

const EMPTY_VISION: VisionDescription = {
  text_on_image: [],
  scene_type: "",
  subject_type: "",
  notable_features: [],
  possible_name: "",
  person_in_statue: "",
  building_style: "",
  surroundings: "",
};

// 人物姓名闭卷清单：从 cities 数据动态生成，保证与 character 数据一致
// 用途：注入 prompt 让 Gemma 做 30 选 1 的人物识别题（而非开放识别）
const CHARACTER_NAMES: string[] = (() => {
  const names = new Set<string>();
  for (const city of cities) {
    for (const char of city.characters) {
      names.add(char.name);
    }
  }
  return Array.from(names);
})();

// 人物姓名 → 该人物拥有的所有景点（用于打分时锁定候选）
// 注：同名人物（如出现）会合并 landmarks
const personToLandmarks: Record<string, string[]> = (() => {
  const m: Record<string, Set<string>> = {};
  for (const city of cities) {
    for (const char of city.characters) {
      if (!m[char.name]) m[char.name] = new Set();
      for (const lm of char.landmarks) m[char.name].add(lm.name);
    }
  }
  const out: Record<string, string[]> = {};
  for (const [name, set] of Object.entries(m)) out[name] = Array.from(set);
  return out;
})();

// 容差归一：Gemma 可能输出"鲁迅先生"、"屈原"前后带修饰词，归一到清单中的姓名
function normalizePerson(raw: string): string {
  if (!raw) return "";
  const cleaned = raw.replace(/[（(].*?[)）]/g, "").trim();
  // 精确命中清单
  if (CHARACTER_NAMES.includes(cleaned)) return cleaned;
  // 包含清单中某个姓名（如"鲁迅先生" → "鲁迅"）
  for (const name of CHARACTER_NAMES) {
    if (cleaned.includes(name)) return name;
  }
  return "";
}

// 容差白名单：模型偶尔会输出枚举外的相近词，做一次归一
function normalizeSceneType(raw: string): SceneType | "" {
  if (!raw) return "";
  const hit = SCENE_TYPE_VOCAB.find((s) => raw.includes(s));
  if (hit) return hit;
  if (/室内|展厅|展柜|陈列/.test(raw)) return "室内陈列";
  if (/院落|院子|四合院|民居|宅院/.test(raw)) return "民居院落";
  if (/公园|草坪|广场/.test(raw) && /开阔|草地|树木/.test(raw)) return "开阔公园";
  if (/纪念碑|碑|烈士|纪念广场/.test(raw)) return "纪念广场";
  if (/园林|亭台|假山|曲径/.test(raw)) return "园林";
  if (/山|湖|江|河|海|自然|风景|林|溪/.test(raw)) return "自然景观";
  if (/街|路|商业|城市|高楼/.test(raw)) return "城市街景";
  if (/塔|楼|寺|庙|宫殿|教堂|古建/.test(raw)) return "历史建筑";
  if (/校园|大学|学校/.test(raw)) return "校园";
  if (/古镇|老街/.test(raw)) return "古镇街区";
  return "";
}

function normalizeSubjectType(raw: string): SubjectType | "" {
  if (!raw) return "";
  const hit = SUBJECT_TYPE_VOCAB.find((s) => raw.includes(s));
  if (hit) return hit;
  if (/雕像|铜像|塑像|石像|立像|坐像/.test(raw)) return "人物雕像";
  if (/建筑|楼|塔|寺|宫|殿|桥|门|教堂/.test(raw)) return "建筑外观";
  if (/室内|展厅|展品|陈设|家具/.test(raw)) return "室内陈设";
  if (/全景|远景|广角|景色|风光/.test(raw)) return "广角风景";
  if (/山|水|湖|河|江|海|植物|花/.test(raw)) return "自然景物";
  return "";
}

// 解析视觉模型返回的 JSON 文本
function parseVisionJson(rawText: string): VisionDescription & { _rawText?: string } {
  try {
    const jsonText = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    const parsed = JSON.parse(jsonText || "{}");
    return {
      text_on_image: Array.isArray(parsed.text_on_image) ? parsed.text_on_image : [],
      scene_type: normalizeSceneType(String(parsed.scene_type || "")),
      subject_type: normalizeSubjectType(String(parsed.subject_type || "")),
      notable_features: Array.isArray(parsed.notable_features) ? parsed.notable_features : [],
      possible_name: parsed.possible_name || "",
      person_in_statue: normalizePerson(String(parsed.person_in_statue || "")),
      building_style: parsed.building_style || "",
      surroundings: parsed.surroundings || "",
      _rawText: rawText.slice(0, 500),
    };
  } catch {
    console.error("[Scan] JSON parse failed, raw:", rawText.slice(0, 300));
    return { ...EMPTY_VISION, _rawText: rawText.slice(0, 500) };
  }
}

// 视觉描述是否有效（任何一个核心字段非空都算成功）
function isVisionUseful(v: VisionDescription): boolean {
  return !!(
    v.possible_name ||
    v.scene_type ||
    v.subject_type ||
    v.person_in_statue ||
    v.text_on_image.length > 0 ||
    v.notable_features.length > 0
  );
}

// 视觉识别：Gemma 31B 主路径（多模态主场），Gemini Flash 2.5 仅在 Gemma 失败时兜底。
//
// 设计动机：Gemma 多模态在「OCR + 场景分类 + 主体识别」这类结构化感知任务上效果稳定，
// 且这是项目展示 Gemma 多模态能力的核心环节，不能只把它当兜底。Gemini Flash 留作
// 故障保险（quota / timeout / 解析失败）。
async function describeImageWithGemma(
  imageBase64: string,
  imageMimeType: string,
  candidates: string[],
  selectedCity?: CityOption | null,
): Promise<VisionDescription & { _rawText?: string }> {
  const cityHint = selectedCity
    ? `提示：这张照片拍摄于中国${selectedCity.name}。`
    : "";

  // prompt 设计要点：
  // 1) 用「可能是以下景点之一」的措辞，避免 LLM 的 prefix bias
  // 2) 强约束 scene_type / subject_type 必须从给定枚举里选
  // 3) 显式提示「故居 vs 公园」要看场景而不是看人名
  // 4) 新增 person_in_statue：30 选 1 闭卷题，破解"无城市 + 雕像"识别瓶颈
  const prompt = `请仔细观察这张照片，提取以下结构化信息。${cityHint}

候选景点（可能是其中之一，但也允许判定为「无法匹配」）：
${candidates.join("、")}

请输出以下字段（严格 JSON，不要任何 Markdown 围栏或额外文字）：

1. text_on_image: 字符串数组。列出照片中所有可读文字（牌匾、路牌、石碑、铭文、年份、标识牌）。看不清就空数组。
2. scene_type: 字符串。必须从这 10 个里选一个最贴近的：${SCENE_TYPE_VOCAB.join(" / ")}。无法判断写空串。
3. subject_type: 字符串。照片的主体是什么类型？必须从这 6 个里选一个：${SUBJECT_TYPE_VOCAB.join(" / ")}。
4. notable_features: 字符串数组，3-6 个具体视觉元素（如"鲁迅坐像"、"东方明珠塔"、"四合院砖墙"、"草坪"等）。
5. possible_name: 字符串。如果你**有把握**对应到候选列表中的某个景点，写完整景点名；否则留空。**不要硬猜**。
6. person_in_statue: 字符串。**只在 subject_type 为「人物雕像」时填写**。从下方闭卷清单中选出雕像最像的人物姓名（仔细观察服饰、面貌、姿态、神态、年代特征，配合基座上若有的生卒年/铭文/姓名）。不是雕像、看不清、对不上清单中任何一个，留空。**严禁靠"我猜这地方在哪"反推人物**。
7. building_style: 字符串，可空。
8. surroundings: 字符串，可空。

人物闭卷清单（共 ${CHARACTER_NAMES.length} 人，只能从中选一个或留空）：
${CHARACTER_NAMES.join("、")}

人物识别参考线索（仅在判断 person_in_statue 时参考）：
- 鲁迅：蓄短发八字胡，戴圆框眼镜，长袍马褂或西装，瘦削，常见坐像；基座常刻 1881-1936
- 屈原：戴楚冠（高冠），蓄长须，宽袍大袖，姿态多为仰天/行吟/独立，立像居多
- 杜甫：戴幞头或冠，蓄长须，着唐代文士袍，常蹙眉沉思状
- 苏轼：戴东坡巾（前高后低的方巾），长须，宋代文人袍
- 李白：戴幞头，举杯或仰天，飘逸潇洒
- 孙中山：中山装或西装，戴礼帽或短发，民国近代形象
- 诸葛亮：戴纶巾，持羽扇，三国谋士形象
- 范仲淹：宋代官服或文人袍，端庄
- 张之洞：清末官服或长袍马褂，戴瓜皮帽或顶戴花翎
- 老舍：民国近代知识分子，西装或长袍
- 巴金、钱钟书、宋庆龄、李叔同、严复、卢作孚 等近现代人物：现代服饰，多为中老年文人/知识分子形象

特别提醒：
- 「故居/旧居/纪念馆」类景点的典型场景是【室内陈列】或【民居院落】，画面以建筑、家具、院墙为主。
- 「公园/陵园/广场」类景点的典型场景是【开阔公园】、【纪念广场】或【园林】，画面以大型户外雕像、草坪、纪念碑为主。
- 同一人物（例如鲁迅）的故居 和 公园 是**完全不同**的两个景点，判断时请优先看 scene_type 和 subject_type，而非仅凭人名。

JSON 模板：
{"text_on_image":[],"scene_type":"","subject_type":"","notable_features":[],"possible_name":"","person_in_statue":"","building_style":"","surroundings":""}`;

  const contents = [{
    role: "user",
    parts: [
      { text: prompt },
      { inlineData: { mimeType: imageMimeType, data: imageBase64 } },
    ],
  }];

  // ── 主路径：Gemma 4 31B（多模态主角）──
  try {
    const res = await withTimeout(
      getAI().models.generateContent({
        model: "gemma-4-31b-it",
        contents,
        config: {
          temperature: 0.2,
          maxOutputTokens: 1024,
        },
      }),
      FLASH_VISION_TIMEOUT,
      "gemma_vision_timeout",
    );
    const rawText = res.text || "";
    console.log("[Scan] Gemma 31B vision (primary) raw:", rawText.slice(0, 200));
    const parsed = parseVisionJson(rawText);
    if (isVisionUseful(parsed)) return parsed;
    console.log("[Scan] Gemma returned empty content, falling back to Gemini Flash");
  } catch (error) {
    console.error("[Scan] Gemma vision failed:", errorMessage(error));
    if (isQuotaError(error)) switchKey();
  }

  // ── 兜底路径：Gemini 2.5-flash（产能稳，仅故障保险）──
  const res = await withTimeout(
    getAI().models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        temperature: 0.2,
        maxOutputTokens: 1024,
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
    12000,
    "gemini_vision_timeout",
  );
  const rawText = res.text || "";
  console.log("[Scan] Gemini 2.5-flash vision (fallback) raw:", rawText.slice(0, 200));
  return parseVisionJson(rawText);
}

// 将 VisionDescription 转为可读文本（供 Gemma 讲述使用）
function visionToText(v: VisionDescription): string {
  const parts: string[] = [];
  if (v.text_on_image.length) parts.push(`画面中的文字：${v.text_on_image.join("、")}`);
  if (v.scene_type) parts.push(`场景类型：${v.scene_type}`);
  if (v.subject_type) parts.push(`主体：${v.subject_type}`);
  if (v.person_in_statue) parts.push(`雕像人物：${v.person_in_statue}`);
  if (v.building_style) parts.push(`建筑风格：${v.building_style}`);
  if (v.surroundings) parts.push(`周围环境：${v.surroundings}`);
  if (v.notable_features.length) parts.push(`显著特征：${v.notable_features.join("、")}`);
  if (v.possible_name) parts.push(`可能是：${v.possible_name}`);
  return parts.join("。") || "无法获取有效视觉信息";
}

// landmark name → Landmark 对象（含 type / sceneTypes），匹配打分时按需查找
const landmarkObjMap: Record<string, Landmark> = (() => {
  const m: Record<string, Landmark> = {};
  for (const city of cities) {
    for (const char of city.characters) {
      for (const lm of char.landmarks) {
        if (!m[lm.name]) m[lm.name] = lm;
      }
    }
  }
  return m;
})();

// 主体类型 ↔ 景点 type 的匹配关系
// 核心规则：「人物雕像」绝不可能在「故居」里出现（故居展示的是生活原貌，不是雕像），
// 必然属于「公园 / 陵园 / 广场 / 纪念馆」。这条规则一行解决了鲁迅那个 case。
function subjectTypeBonus(subject: SubjectType | "", type: Landmark["type"]): number {
  if (!subject) return 0;
  switch (subject) {
    case "人物雕像":
      if (type === "故居") return -8; // 强烈否决
      if (["公园", "陵园", "广场", "纪念馆"].includes(type)) return +4;
      return 0;
    case "室内陈设":
      if (["故居", "纪念馆"].includes(type)) return +3;
      if (["自然景观", "公园", "园林"].includes(type)) return -3;
      return 0;
    case "建筑外观":
      if (type === "历史建筑") return +3;
      if (type === "自然景观") return -2;
      return 0;
    case "广角风景":
      if (["自然景观", "公园", "园林"].includes(type)) return +3;
      if (type === "故居") return -2;
      return 0;
    case "自然景物":
      if (type === "自然景观") return +4;
      if (["故居", "纪念馆", "广场"].includes(type)) return -3;
      return 0;
    default:
      return 0;
  }
}

// 单个候选景点打分
function scoreCandidate(landmark: Landmark, vision: VisionDescription): number {
  let score = 0;

  // === 强信号 ===
  // OCR 命中景点名（牌匾/路牌上写明地名）→ 决定性
  for (const text of vision.text_on_image) {
    if (!text) continue;
    if (text.includes(landmark.name) || landmark.name.includes(text)) {
      score += 10;
    }
  }
  // 别名命中（OCR > features > possible_name 三档加权）
  for (const [alias, standard] of Object.entries(LANDMARK_ALIASES)) {
    if (standard !== landmark.name) continue;
    if (vision.text_on_image.some((t) => t.includes(alias))) {
      score += 6;
    } else if (vision.notable_features.some((f) => f.includes(alias))) {
      score += 4;
    } else if (vision.possible_name.includes(alias)) {
      score += 3;
    }
  }

  // === 人物锁定（D 思路核心）===
  // Gemma 从 30 人闭卷清单识别出雕像人物 → 该人物拥有的所有景点全部 +12。
  // 比 OCR 命中略低（OCR 是地名硬证据，人物识别仍有错认风险），但足以让人物相关
  // 候选脱颖而出。结合 scene_type / subject_type 约束，会精准定位到正确的那一个。
  if (vision.person_in_statue) {
    const ownedLandmarks = personToLandmarks[vision.person_in_statue] || [];
    if (ownedLandmarks.includes(landmark.name)) {
      score += 12;
    }
  }

  // === 中等信号 ===
  if (vision.possible_name && vision.possible_name.includes(landmark.name)) {
    score += 3; // AI 猜测仅作弱信号（可能有 prefix bias）
  }
  for (const f of vision.notable_features) {
    if (f && (f.includes(landmark.name) || landmark.name.includes(f))) {
      score += 2;
    }
  }

  // === 场景约束（核心改动）===
  // scene_type 命中加分，未命中扣分（让"故居"的场景不能匹配"开阔公园"的照片）
  if (vision.scene_type) {
    if (landmark.sceneTypes.includes(vision.scene_type)) {
      score += 4;
    } else {
      score -= 2;
    }
  }
  // 主体约束：人物雕像 ↔ 故居 一定冲突
  score += subjectTypeBonus(vision.subject_type, landmark.type);

  return score;
}

// 本地匹配：基于场景类型 + 主体类型 + OCR + 别名 的多信号打分。
// 取最高分作为匹配结果，置信度由分值和与第二名的差距决定。
function localMatchLandmark(
  vision: VisionDescription,
  candidates: string[],
): {
  matched: string | null;
  confidence: "high" | "medium" | "low";
  matchedBy: string;
  topCandidates: Array<{ name: string; score: number }>;
} {
  const scored = candidates
    .map((name) => {
      const lm = landmarkObjMap[name];
      if (!lm) return { name, score: -999 };
      return { name, score: scoreCandidate(lm, vision) };
    })
    .filter((c) => c.score > -999)
    .sort((a, b) => b.score - a.score);

  const topCandidates = scored.slice(0, 3);
  const top = scored[0];
  const second = scored[1];

  // 全部为负或近零分 → 无可信匹配
  if (!top || top.score < 2) {
    return { matched: null, confidence: "low", matchedBy: "no_signal", topCandidates };
  }

  const margin = top.score - (second?.score ?? 0);

  // 置信度判定
  let confidence: "high" | "medium" | "low" = "low";
  let matchedBy = `score=${top.score}`;
  if (top.score >= 10) {
    confidence = "high";
    matchedBy = `ocr_or_alias_strong(score=${top.score})`;
  } else if (top.score >= 6 && margin >= 3) {
    confidence = "high";
    matchedBy = `score=${top.score},margin=${margin}`;
  } else if (top.score >= 4 && margin >= 2) {
    confidence = "medium";
    matchedBy = `score=${top.score},margin=${margin}`;
  } else if (top.score >= 2) {
    confidence = "low";
    matchedBy = `weak_signal(score=${top.score})`;
  }

  return { matched: top.name, confidence, matchedBy, topCandidates };
}

function buildSuggestions(city: CityOption | null): Array<{ landmark: string; characterId: string; characterName: string; cityName: string; avatar: string }> {
  if (!city) return [];
  const result: Array<{ landmark: string; characterId: string; characterName: string; cityName: string; avatar: string }> = [];
  for (const char of city.characters) {
    for (const lm of char.landmarks) {
      result.push({ landmark: lm.name, characterId: char.id, characterName: char.name, cityName: city.name, avatar: char.avatar });
    }
  }
  return result;
}

type ScanRequest = {
  imageBase64: string;
  imageMimeType: string;
  cityId?: string;
  forcedLandmark?: string;
};

// 校验 /api/scan 请求体；通过则返回 data，否则返回对应的错误响应
async function parseScanRequest(
  request: Request,
): Promise<{ ok: true; data: ScanRequest } | { ok: false; response: Response }> {
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return { ok: false, response: Response.json({ error: "请求体格式错误" }, { status: 400 }) };
  }
  const { imageBase64, imageMimeType, cityId, forcedLandmark } = body as {
    imageBase64?: unknown;
    imageMimeType?: unknown;
    cityId?: unknown;
    forcedLandmark?: unknown;
  };
  if (typeof imageBase64 !== "string" || typeof imageMimeType !== "string") {
    return { ok: false, response: Response.json({ error: "缺少图片" }, { status: 400 }) };
  }
  if (cityId !== undefined && typeof cityId !== "string") {
    return { ok: false, response: Response.json({ error: "城市字段格式错误" }, { status: 400 }) };
  }
  if (forcedLandmark !== undefined && typeof forcedLandmark !== "string") {
    return { ok: false, response: Response.json({ error: "景点字段格式错误" }, { status: 400 }) };
  }
  if (!["image/jpeg", "image/png", "image/webp"].includes(imageMimeType)) {
    return { ok: false, response: Response.json({ error: "暂不支持该图片格式" }, { status: 400 }) };
  }
  if (imageBase64.length > IMAGE_BASE64_LIMIT) {
    return { ok: false, response: Response.json({ error: "图片过大，请压缩后重试" }, { status: 413 }) };
  }
  return { ok: true, data: { imageBase64, imageMimeType, cityId, forcedLandmark } };
}

// 以指定人物口吻调用 Gemma 26B 生成讲述；失败时回退到默认文案
async function narrateWithPersona(
  characterId: string,
  prompt: string,
  opts: { fallbackText: string; timeoutLabel: string; logTag: string },
): Promise<{ narration: string; error: string | null }> {
  const persona = personas[characterId];
  let narration = opts.fallbackText;
  let error: string | null = null;
  try {
    const res = await withTimeout(
      getAI().models.generateContent({
        model: "gemma-4-26b-a4b-it",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          systemInstruction: persona + "\n" + GLOBAL_CONSTRAINTS,
          temperature: 1.0,
          maxOutputTokens: 500,
        },
      }),
      GEMMA_NARRATE_TIMEOUT,
      opts.timeoutLabel,
    );
    narration = res.text || narration;
  } catch (err) {
    error = errorMessage(err);
    console.error(opts.logTag, error);
    if (isQuotaError(err)) switchKey();
  }
  return { narration, error };
}

export async function POST(request: Request) {
  try {
    const parsed = await parseScanRequest(request);
    if (!parsed.ok) return parsed.response;
    const { imageBase64, imageMimeType, cityId, forcedLandmark } = parsed.data;

    console.log(`[Scan] Received: base64Length=${imageBase64.length}, mimeType=${imageMimeType}, cityId=${cityId || "auto"}`);

    const selectedCity = getCityById(cityId);
    const candidates = getCandidateNames(selectedCity);

    // ── 用户手动指定景点：跳过视觉识别直接讲述 ──
    if (forcedLandmark && landmarkMap[forcedLandmark]) {
      const info = landmarkMap[forcedLandmark];
      const angle = pickRandom(ANGLES);

      const narratePrompt = `用户站在【${forcedLandmark}】前。${angle}。用 150-220 字讲述你与此地的渊源。

要求：
- 保持你的历史人物口吻，不要像导游词或百科。
- 结合你的生活时代、经历、学识或作品，让景点与历史背景发生联系。
- 纯文本输出，不使用 Markdown。`;

      const { narration } = await narrateWithPersona(info.characterId, narratePrompt, {
        fallbackText: "这个地方承载着我许多的记忆。",
        timeoutLabel: "gemma_narrate_timeout",
        logTag: "[Scan] Forced landmark narrate error:",
      });

      return jsonWithDebug(
        { found: true, landmark: forcedLandmark, characterId: info.characterId, characterName: info.characterName, cityName: info.cityName, avatar: info.avatar, narration, identifiedBy: "forced" },
        { identifiedBy: "forced", forcedLandmark }
      );
    }
    const debugBase = {
      selectedCityId: selectedCity?.id || null,
      selectedCityName: selectedCity?.name || null,
      candidateCount: candidates.length,
    };

    // ── Step 1: Gemma 31B 视觉感知（OCR + 场景分类 + 主体识别）──
    let vision: VisionDescription & { _rawText?: string } = EMPTY_VISION;
    let visionError: string | null = null;

    try {
      vision = await describeImageWithGemma(imageBase64, imageMimeType, candidates, selectedCity);
      console.log("[Scan] Gemma vision:", JSON.stringify(vision));
    } catch (error) {
      visionError = errorMessage(error);
      console.error("[Scan] Gemma vision error:", visionError);
    }

    const rawFlashText = vision._rawText || null;
    const visualDescription = visionToText(vision);

    if (!isVisionUseful(vision)) {
      return jsonWithDebug(
        { found: false, message: "无法分析此图片，请换一张试试。" },
        { ...debugBase, vision, rawFlashText, visionError, identifiedBy: "none" }
      );
    }

    // ── Step 2: 场景感知打分匹配 ──
    const { matched, confidence, matchedBy, topCandidates } = localMatchLandmark(vision, candidates);
    console.log(
      `[Scan] Match: ${matched || "none"}, conf=${confidence}, by=${matchedBy}, top3=${JSON.stringify(topCandidates)}`,
    );

    // ── Step 3: Gemma 31B 讲述 ──
    if (matched && landmarkMap[matched]) {
      const info = landmarkMap[matched];
      const angle = pickRandom(ANGLES);

      const uncertaintyHint = confidence === "medium"
        ? "\n- 在讲述结尾，用你自己的口吻自然地加一句谦辞，表达这只是你的判断、建议对方亲自核实（不要生硬，要符合你的时代和性格）。"
        : "";

      const narratePrompt = `用户站在【${matched}】前，展示了一张照片。

你通过观察，看到了以下画面：
${visualDescription}

${angle}。用 150-220 字讲述你与此地的渊源。

要求：
- 必须保持你的历史人物口吻，不要像导游词或百科。
- 引用照片中的具体视觉细节，例如建筑、牌匾、石碑、水面、山体、光线或环境。
- 结合你的生活时代、经历、学识或作品，让现代景点与历史背景发生联系。
- 纯文本输出，不使用 Markdown。${uncertaintyHint}`;

      const { narration, error: narrateError } = await narrateWithPersona(info.characterId, narratePrompt, {
        fallbackText: "这个地方承载着我许多的记忆。",
        timeoutLabel: "gemma_narrate_timeout",
        logTag: "[Scan] Gemma narrate error:",
      });

      return jsonWithDebug(
        {
          found: true,
          landmark: matched,
          confidence,
          characterId: info.characterId,
          characterName: info.characterName,
          cityName: info.cityName,
          avatar: info.avatar,
          narration,
          visualDescription,
          identifiedBy: "local_match",
        },
        { ...debugBase, vision, confidence, matchedBy, topCandidates, narrateError, identifiedBy: "local_match" }
      );
    }

    // ── 未匹配：fallback 角色回应 ──
    const fallbackCharId = guessCityCharacter(visualDescription, selectedCity);
    const charInfo = findCharacterInfo(fallbackCharId);
    if (!charInfo) {
      return jsonWithDebug(
        { found: false, message: "无法识别此景点。" },
        { ...debugBase, vision, confidence, matchedBy, topCandidates, identifiedBy: "none" }
      );
    }

    const { character, cityName } = charInfo;

    const fallbackPrompt = `用户展示了一张照片，你观察到以下画面：
${visualDescription}

虽然这张照片未能精确匹配到项目内景点，但请基于你看到的画面内容，以你的历史人物口吻发表感想。用 150-220 字回应，体现你的时代背景、学识和性格。纯文本输出，不使用 Markdown。`;

    const { narration, error: narrateError } = await narrateWithPersona(fallbackCharId, fallbackPrompt, {
      fallbackText: "此景虽不在我熟知之列，但亦有几分意趣。",
      timeoutLabel: "gemma_scan_fallback_timeout",
      logTag: "[Scan] Gemma fallback error:",
    });

    return jsonWithDebug(
      {
        found: false,
        landmark: null,
        characterId: fallbackCharId,
        characterName: character.name,
        cityName,
        avatar: character.avatar,
        narration,
        visualDescription,
        suggestions: buildSuggestions(selectedCity),
        identifiedBy: "none",
        message: "未能精确匹配到已知景点，但仍为你带来了历史人物的视角。",
      },
      { ...debugBase, vision, confidence, matchedBy, topCandidates, narrateError, identifiedBy: "none" }
    );
  } catch (error) {
    console.error("Scan API error:", error);
    return Response.json({ error: "识别服务暂时不可用" }, { status: 500 });
  }
}
