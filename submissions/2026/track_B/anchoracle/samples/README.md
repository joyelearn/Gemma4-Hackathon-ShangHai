# Sample Data — 多模态测试素材

本目录提供用于复现 Anchoracle 多模态识别效果的测试图片，对应赛道 B（Multimodal）评审要求。

## 使用方式

1. 启动项目后访问 `/scan` 页面。
2. 上传本目录任意图片。
3. 系统将调用 Gemma 4 31B 完成：OCR + 场景分类 + 主体识别 + 30 选 1 人物识别。
4. 识别结果会引导至对应人物的对话页（`/chat/[characterId]`），由 Gemma 4 26B A4B 进行历史讲述。
