const MAX_SIDE = 1024;
const JPEG_QUALITY = 0.82;
// 一张 1024px 照片 JPEG 的 base64 通常 ≥ 20KB；低于此值说明画布为空或损坏
const MIN_BASE64_LEN = 8000;
// 64KB header buffer 足够找到 EXIF 段（位于 JPEG 开头）
const EXIF_PARSE_BYTES = 65536;

/**
 * 读取 JPEG 的 EXIF Orientation (0x0112)，返回 1-8；非 JPEG / 无 EXIF / 解析失败时返回 1（无旋转）。
 *
 * iOS Safari 常以横向像素 + orientation=6 存储照片，而各浏览器对 EXIF 的处理并不一致
 * （createImageBitmap 行为不一，<img> 的 drawImage 完全不读 EXIF），可能使同一张图被旋转
 * 90° 后再压缩、影响识别。因此这里主动解析 orientation，并在 canvas 端统一应用旋转。
 */
async function readJpegOrientation(file: File): Promise<number> {
  // 只对 JPEG 解 EXIF；PNG/WebP 没有 orientation 概念
  if (!file.type.includes("jpeg") && !file.type.includes("jpg")) return 1;
  try {
    const buf = await file.slice(0, EXIF_PARSE_BYTES).arrayBuffer();
    const view = new DataView(buf);
    // JPEG 必须以 SOI 标记 0xFFD8 开头
    if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return 1;

    let offset = 2;
    while (offset + 4 < view.byteLength) {
      const marker = view.getUint16(offset);
      // 所有 JPEG 段标记都以 0xFF 开头
      if ((marker & 0xff00) !== 0xff00) return 1;

      // APP1 段（0xFFE1）包含 EXIF
      if (marker === 0xffe1) {
        // 验证 "Exif\0\0" 魔数（位于段长度后）
        if (
          offset + 10 > view.byteLength ||
          view.getUint32(offset + 4) !== 0x45786966 ||
          view.getUint16(offset + 8) !== 0x0000
        ) {
          return 1;
        }
        const tiffStart = offset + 10;
        if (tiffStart + 8 > view.byteLength) return 1;

        // TIFF 字节序：0x4949 = little-endian (Intel)，0x4D4D = big-endian (Motorola)
        const byteOrder = view.getUint16(tiffStart);
        const little = byteOrder === 0x4949;
        if (!little && byteOrder !== 0x4d4d) return 1;
        // TIFF magic number = 42 (0x002A)
        if (view.getUint16(tiffStart + 2, little) !== 0x002a) return 1;

        const ifd0Offset = view.getUint32(tiffStart + 4, little);
        const ifd0Pos = tiffStart + ifd0Offset;
        if (ifd0Pos + 2 > view.byteLength) return 1;

        const entryCount = view.getUint16(ifd0Pos, little);
        for (let i = 0; i < entryCount; i++) {
          const entryOffset = ifd0Pos + 2 + i * 12;
          if (entryOffset + 12 > view.byteLength) return 1;
          // 0x0112 = Orientation tag
          if (view.getUint16(entryOffset, little) === 0x0112) {
            const value = view.getUint16(entryOffset + 8, little);
            return value >= 1 && value <= 8 ? value : 1;
          }
        }
        return 1;
      }

      // 跳过当前段：marker(2) + segmentSize(2) 包含 segmentSize 本身
      const segmentSize = view.getUint16(offset + 2);
      if (segmentSize < 2) return 1;
      offset += 2 + segmentSize;
    }
    return 1;
  } catch {
    return 1;
  }
}

function scaleSize(w: number, h: number): [number, number] {
  if (w <= MAX_SIDE && h <= MAX_SIDE) return [w, h];
  if (w > h) return [MAX_SIDE, Math.round((h * MAX_SIDE) / w)];
  return [Math.round((w * MAX_SIDE) / h), MAX_SIDE];
}

/**
 * 根据 EXIF orientation (1-8) 应用 canvas 变换。
 * 调用方需在 transform 之前根据 orientation 决定 canvas 尺寸（5-8 需交换宽高）。
 */
function applyOrientationTransform(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  orientation: number,
): void {
  switch (orientation) {
    case 2: // 水平镜像
      ctx.transform(-1, 0, 0, 1, w, 0);
      break;
    case 3: // 旋转 180°
      ctx.transform(-1, 0, 0, -1, w, h);
      break;
    case 4: // 垂直镜像
      ctx.transform(1, 0, 0, -1, 0, h);
      break;
    case 5: // 水平镜像 + 顺时针 90°
      ctx.transform(0, 1, 1, 0, 0, 0);
      break;
    case 6: // 顺时针 90°
      ctx.transform(0, 1, -1, 0, h, 0);
      break;
    case 7: // 水平镜像 + 逆时针 90°
      ctx.transform(0, -1, -1, 0, h, w);
      break;
    case 8: // 逆时针 90°
      ctx.transform(0, -1, 1, 0, 0, w);
      break;
    default: // 1 = 无变换
      break;
  }
}

function drawToJpegBase64(
  source: ImageBitmap | HTMLImageElement,
  sw: number,
  sh: number,
  orientation: number = 1,
): string {
  const [scaledW, scaledH] = scaleSize(sw, sh);
  // orientation 5-8 表示图像需要旋转 ±90°，画布的宽高与源图相反
  const needsSwap = orientation >= 5 && orientation <= 8;
  const canvasW = needsSwap ? scaledH : scaledW;
  const canvasH = needsSwap ? scaledW : scaledH;

  const canvas = document.createElement("canvas");
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("无法获取 canvas 2d context");

  applyOrientationTransform(ctx, scaledW, scaledH, orientation);
  ctx.drawImage(source, 0, 0, scaledW, scaledH);

  const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  const base64 = dataUrl.split(",")[1];
  if (!base64 || base64.length < MIN_BASE64_LEN) {
    throw new Error("图片压缩结果异常（画布可能为空）");
  }
  return base64;
}

/**
 * 压缩图片并返回 base64 + mimeType。
 *
 * 方向处理：先读 EXIF orientation；路径 A 用 createImageBitmap + imageOrientation:"none"
 * 显式禁用浏览器自动旋转，统一在 canvas 手动应用；路径 B 用 <img> 兜底，drawImage 不读
 * EXIF，同样手动应用，确保各浏览器结果一致。
 *
 * 失败时 throw Error，调用方需自行处理。
 */
export async function compressImage(file: File): Promise<{ base64: string; mimeType: string }> {
  const timeout = <T>(p: Promise<T>, ms: number) =>
    Promise.race([
      p,
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms)),
    ]);

  const orientation = await readJpegOrientation(file);

  // ── 路径 A：createImageBitmap + 显式禁用浏览器旋转 ──
  // Chrome/Firefox 现代版本 + Safari 15.4+ 支持 imageOrientation 选项
  if (typeof createImageBitmap !== "undefined") {
    try {
      const bitmap = await timeout(
        createImageBitmap(file, { imageOrientation: "none" } as ImageBitmapOptions),
        8000,
      );
      const base64 = drawToJpegBase64(bitmap, bitmap.width, bitmap.height, orientation);
      bitmap.close();
      return { base64, mimeType: "image/jpeg" };
    } catch {
      // 选项不支持、HEIC 解码失败、或超时 → 路径 B
    }
  }

  // ── 路径 B：<img> 元素兜底（最广泛兼容）+ 手动 EXIF 旋转 ──
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    let done = false;

    const finish = (err?: Error) => {
      if (done) return;
      done = true;
      URL.revokeObjectURL(url);
      if (err) {
        reject(err);
        return;
      }
      try {
        const base64 = drawToJpegBase64(img, img.naturalWidth, img.naturalHeight, orientation);
        resolve({ base64, mimeType: "image/jpeg" });
      } catch (e) {
        reject(e instanceof Error ? e : new Error(String(e)));
      }
    };

    const timer = setTimeout(() => finish(new Error("图片加载超时")), 10000);
    img.onload = () => {
      clearTimeout(timer);
      finish();
    };
    img.onerror = () => {
      clearTimeout(timer);
      // 针对 iOS 用户的 HEIC 提示：iOS 默认拍摄格式可能是 HEIC，浏览器解码不稳定
      finish(
        new Error(
          "图片格式不支持，请换用 JPEG 或 PNG。iOS 用户请到：设置 → 相机 → 格式 → 选择「兼容性最佳」",
        ),
      );
    };
    img.src = url;
  });
}
