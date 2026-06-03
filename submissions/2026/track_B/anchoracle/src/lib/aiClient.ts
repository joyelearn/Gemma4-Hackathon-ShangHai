import { GoogleGenAI } from "@google/genai";

if (process.env.NODE_ENV === "development") {
  import("undici").then(({ ProxyAgent, setGlobalDispatcher }) => {
    const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
    if (proxy) setGlobalDispatcher(new ProxyAgent(proxy));
  });
}

// 从环境变量读取 Google AI Studio API Key
const API_KEY = process.env.GOOGLE_API_KEY!;

const aiInstance = new GoogleGenAI({ apiKey: API_KEY });

export function getAI(): GoogleGenAI {
  return aiInstance;
}

export function isQuotaError(err: unknown): boolean {
  const s = String(err);
  // INVALID_ARGUMENT 不属于配额错误，需排除
  return (
    s.includes("429") ||
    s.includes("RESOURCE_EXHAUSTED") ||
    s.includes("quota") ||
    s.includes("API_KEY_INVALID") ||
    s.includes("API key expired")
  );
}

// 当前部署仅配置单 key，无可切换的备用 key
export function switchKey(): boolean {
  return false;
}

export function consumeKeyWarning(): string | null {
  return null;
}

export function getCurrentKeyIndex(): number {
  return 0;
}

export function getKeyCount(): number {
  return 1;
}
