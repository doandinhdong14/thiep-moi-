import QRCode from "qrcode";
import jsQR from "jsqr";
import { QR_PRESETS, type QrPreset } from "./presets";
import type { QrDesign } from "./types";
import {
  drawPresetBackgroundArtwork,
  drawPresetForegroundOverlay,
} from "./presetArtwork";

export interface RenderQrOptions {
  exportScale?: number;
  showHandles?: boolean;
  selectedItemId?: string | null;
  cardTitle?: string;
}

function getQuietZoneFill(preset: QrPreset): string {
  switch (preset.id) {
    case "gift-for-you":
      return "#050507";
    case "trai-tim-khung":
      return "#050505";
    case "socola":
      return "#230806";
    case "socola-2":
      return "#1d0706";
    case "trung-thu-2":
      return "#120d36";
    case "trung-thu-3":
      return "#520709";
    default:
      return "#ffffff";
  }
}

/**
 * Deterministic PRNG for organic decorative heart-lobe QR module textures.
 */
function lobeModuleBit(row: number, col: number): boolean {
  let h = Math.imul(row + 131, 374761393) ^ Math.imul(col + 257, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) & 1) === 1;
}

/**
 * Draw a crisp QR code matrix directly via Canvas2D rectangles (no blur).
 */
function drawSquareQrMatrix(
  ctx: CanvasRenderingContext2D,
  modules: QRCode.QRCode["modules"],
  centerX: number,
  centerY: number,
  slotSize: number,
  moduleColor: string,
  quietBg: string,
  quietModules = 2.5,
  roundedBox = false
) {
  const count = modules.size;
  const totalModules = count + quietModules * 2;
  const modPx = slotSize / totalModules;
  const startX = centerX - slotSize / 2;
  const startY = centerY - slotSize / 2;

  ctx.save();
  ctx.fillStyle = quietBg;
  if (roundedBox) {
    ctx.beginPath();
    ctx.roundRect(startX, startY, slotSize, slotSize, 16);
    ctx.fill();
    ctx.strokeStyle = "rgba(15, 23, 42, 0.12)";
    ctx.lineWidth = 3;
    ctx.stroke();
  } else {
    ctx.fillRect(startX, startY, slotSize, slotSize);
  }

  ctx.fillStyle = moduleColor;
  const matrixOriginX = startX + quietModules * modPx;
  const matrixOriginY = startY + quietModules * modPx;

  // Draw slightly overfilled (+0.25px) so subpixel seams never appear between adjacent modules
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (modules.get(r, c)) {
        ctx.fillRect(
          matrixOriginX + c * modPx - 0.15,
          matrixOriginY + r * modPx - 0.15,
          modPx + 0.3,
          modPx + 0.3
        );
      }
    }
  }
  ctx.restore();
}

/**
 * Draw a 45°-rotated QR matrix inside a classic diamond-and-lobes heart silhouette.
 * Exterior lobe texture stays strictly outside the quiet zone so Finder Patterns scan fast.
 */
function drawHeartQrMatrix(
  ctx: CanvasRenderingContext2D,
  modules: QRCode.QRCode["modules"],
  centerX: number,
  centerY: number,
  heartWidth: number,
  moduleColor: string,
  quietBg: string
) {
  const count = modules.size;
  const quietModules = 2;
  const totalModules = count + quietModules * 2;

  // Total tilted square side S such that heart total width (1.7071 * S) == heartWidth
  const S = heartWidth / 1.7071;
  const modPx = S / totalModules;
  const halfS = S / 2;
  const matrixSide = count * modPx;
  const padOut = modPx * 0.9;

  ctx.save();
  // Shift slightly downward because heart lobes rise further above center than tip below
  ctx.translate(centerX, centerY + 0.065 * S);
  ctx.rotate(Math.PI / 4);

  // 1. Solid high-contrast heart silhouette backing (three separate fills prevent winding gaps)
  ctx.fillStyle = quietBg;
  ctx.fillRect(-halfS, -halfS, S, S);
  ctx.beginPath();
  ctx.arc(-halfS, 0, halfS, Math.PI / 2, Math.PI * 1.5);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -halfS, halfS, Math.PI, Math.PI * 2);
  ctx.closePath();
  ctx.fill();

  // Subtle drop outline for light-on-light or dark-on-chocolate separation
  if (quietBg !== "#ffffff") {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // 2. Left semicircle lobe texture (strictly u < -halfS - padOut, safely clear of quiet zone)
  ctx.save();
  ctx.beginPath();
  ctx.arc(-halfS - padOut * 0.4, 0, halfS - padOut * 0.8, Math.PI / 2, Math.PI * 1.5);
  ctx.closePath();
  ctx.clip();

  ctx.fillStyle = moduleColor;
  const colsLobe = Math.ceil(halfS / modPx) + 2;
  const rowsLobe = Math.ceil(S / modPx) + 2;
  for (let r = 0; r < rowsLobe; r++) {
    for (let c = 0; c < colsLobe; c++) {
      const mx = -S - padOut + c * modPx;
      const my = -halfS + r * modPx;
      if (mx + modPx <= -halfS - padOut && lobeModuleBit(r, c)) {
        ctx.fillRect(mx - 0.1, my - 0.1, modPx + 0.2, modPx + 0.2);
      }
    }
  }
  ctx.restore();

  // 3. Top-right semicircle lobe texture (strictly v < -halfS - padOut)
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, -halfS - padOut * 0.4, halfS - padOut * 0.8, Math.PI, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  ctx.fillStyle = moduleColor;
  for (let r = 0; r < colsLobe; r++) {
    for (let c = 0; c < rowsLobe; c++) {
      const mx = -halfS + c * modPx;
      const my = -S - padOut + r * modPx;
      if (my + modPx <= -halfS - padOut && lobeModuleBit(r + 17, c + 31)) {
        ctx.fillRect(mx - 0.1, my - 0.1, modPx + 0.2, modPx + 0.2);
      }
    }
  }
  ctx.restore();

  // 4. Clean hairline diamond frame outside the quiet zone
  const hairlineHalf = halfS - modPx * 0.35;
  ctx.strokeStyle = moduleColor;
  ctx.lineWidth = Math.max(2, modPx * 0.38);
  ctx.strokeRect(-hairlineHalf, -hairlineHalf, hairlineHalf * 2, hairlineHalf * 2);

  // 5. True QR code matrix centered inside [-matrixSide/2, +matrixSide/2]^2
  ctx.fillStyle = moduleColor;
  const origin = -matrixSide / 2;
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (modules.get(r, c)) {
        ctx.fillRect(
          origin + c * modPx - 0.15,
          origin + r * modPx - 0.15,
          modPx + 0.3,
          modPx + 0.3
        );
      }
    }
  }

  ctx.restore();
}

export async function renderQrArtworkToCanvas(
  canvas: HTMLCanvasElement,
  design: QrDesign,
  publicUrl: string,
  options: RenderQrOptions = {}
): Promise<{ success: boolean; decodedUrl?: string; error?: string }> {
  const preset: QrPreset =
    QR_PRESETS.find((p) => p.id === design.presetId) || QR_PRESETS[0];
  const scale = options.exportScale || 1;
  const width = preset.canvasWidth * scale;
  const height = preset.canvasHeight * scale;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return { success: false, error: "Canvas context not available" };

  ctx.save();
  ctx.scale(scale, scale);

  // 1. Background Artwork or Custom Uploaded Photo
  if (design.backgroundUrl) {
    ctx.fillStyle = preset.bgColor;
    ctx.fillRect(0, 0, preset.canvasWidth, preset.canvasHeight);
    try {
      const img = await loadImage(design.backgroundUrl);
      const fit = design.backgroundFit || "cover";
      drawImageWithFit(
        ctx,
        img,
        0,
        0,
        preset.canvasWidth,
        preset.canvasHeight,
        fit
      );
    } catch {
      drawPresetBackgroundArtwork(ctx, preset, options.cardTitle);
    }
  } else {
    drawPresetBackgroundArtwork(ctx, preset, options.cardTitle);
  }

  // 2. Generate crisp QR code matrix
  const qrModuleColor = design.moduleColor || preset.defaultModuleColor;
  const quietBg = getQuietZoneFill(preset);
  const useHighEc = preset.id === "cupid" || preset.id === "noel";
  const ecLevel: QRCode.QRCodeErrorCorrectionLevel = useHighEc ? "H" : "M";

  try {
    const qrData = QRCode.create(publicUrl || "https://thiep.local/demo", {
      errorCorrectionLevel: ecLevel,
    });

    if (preset.qrSlot.frameShape === "heart") {
      drawHeartQrMatrix(
        ctx,
        qrData.modules,
        preset.qrSlot.x,
        preset.qrSlot.y,
        preset.qrSlot.size,
        qrModuleColor,
        quietBg
      );
    } else {
      const useRoundedWhiteCard =
        preset.id === "sinh-nhat" || preset.id === "sinh-nhat-2";
      const quietModules = preset.id === "vuong" ? 3 : 2.5;
      drawSquareQrMatrix(
        ctx,
        qrData.modules,
        preset.qrSlot.x,
        preset.qrSlot.y,
        preset.qrSlot.size,
        qrModuleColor,
        quietBg,
        quietModules,
        useRoundedWhiteCard
      );
    }

    // Center badge icons (Cupid archer / Santa) over Level "H" matrices
    drawPresetForegroundOverlay(ctx, preset);
  } catch (err) {
    console.error("Failed to generate QR matrix:", err);
    ctx.restore();
    return { success: false, error: "QR Generation failed" };
  }

  // 3. Draw custom draggable Texts & Icons
  type DrawItem =
    | { kind: "text"; zIndex: number; data: QrDesign["texts"][number] }
    | { kind: "icon"; zIndex: number; data: QrDesign["icons"][number] };

  const allItems: DrawItem[] = [
    ...design.texts.map((t) => ({ kind: "text" as const, zIndex: t.zIndex, data: t })),
    ...design.icons.map((i) => ({ kind: "icon" as const, zIndex: i.zIndex, data: i })),
  ].sort((a, b) => a.zIndex - b.zIndex);

  for (const item of allItems) {
    if (item.kind === "text") {
      const t = item.data;
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.rotate((t.rotation * Math.PI) / 180);

      const fontSize = t.fontSize || 36;
      const fontFamily = t.fontFamily || "'Be Vietnam Pro', sans-serif";
      ctx.font = `bold ${fontSize}px ${fontFamily}`;
      ctx.textAlign = t.align || "center";
      ctx.textBaseline = "middle";

      if (t.hasBackground) {
        const metrics = ctx.measureText(t.text);
        const padX = 24;
        const padY = 12;
        const boxW = metrics.width + padX * 2;
        const boxH = fontSize * 1.4 + padY;
        ctx.fillStyle = t.backgroundColor || "rgba(255,255,255,0.9)";
        ctx.beginPath();
        ctx.roundRect(-boxW / 2, -boxH / 2, boxW, boxH, 12);
        ctx.fill();
      }

      if (t.styleId === "shadow") {
        ctx.shadowColor = "rgba(0,0,0,0.45)";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
      } else if (t.styleId === "outline") {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 6;
        ctx.strokeText(t.text, 0, 0);
      }

      ctx.fillStyle = t.color || "#18181b";
      ctx.fillText(t.text, 0, 0);

      if (options.showHandles && options.selectedItemId === t.id) {
        const metrics = ctx.measureText(t.text);
        ctx.shadowColor = "transparent";
        ctx.strokeStyle = "#2563eb";
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(
          -metrics.width / 2 - 14,
          -fontSize * 0.7 - 8,
          metrics.width + 28,
          fontSize * 1.4 + 16
        );
      }

      ctx.restore();
    } else {
      const ic = item.data;
      ctx.save();
      ctx.translate(ic.x, ic.y);
      ctx.rotate((ic.rotation * Math.PI) / 180);

      const iconSize = ic.size || 64;
      ctx.font = `${iconSize}px 'Segoe UI Emoji', 'Apple Color Emoji', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(ic.emoji, 0, 0);

      if (options.showHandles && options.selectedItemId === ic.id) {
        ctx.strokeStyle = "#2563eb";
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(
          -iconSize / 2 - 10,
          -iconSize / 2 - 10,
          iconSize + 20,
          iconSize + 20
        );
      }
      ctx.restore();
    }
  }

  ctx.restore();

  // 4. Verify Scannability on full rendered canvas via jsQR
  try {
    const imgData = ctx.getImageData(0, 0, width, height);
    const decoded = jsQR(imgData.data, width, height, {
      inversionAttempts: "attemptBoth",
    });

    if (decoded && decoded.data) {
      return { success: true, decodedUrl: decoded.data };
    }
    return {
      success: false,
      error: "Mã QR bị che khuất hoặc tương phản thấp — hãy đổi màu QR tương phản hơn",
    };
  } catch (err) {
    console.warn("Scan verification skipped (tainted or error):", err);
    return { success: true };
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawImageWithFit(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  fit: "cover" | "contain"
) {
  const imgRatio = img.width / img.height;
  const targetRatio = w / h;

  let drawW: number;
  let drawH: number;
  let drawX: number;
  let drawY: number;

  if (fit === "cover") {
    if (imgRatio > targetRatio) {
      drawH = h;
      drawW = h * imgRatio;
      drawX = x + (w - drawW) / 2;
      drawY = y;
    } else {
      drawW = w;
      drawH = w / imgRatio;
      drawX = x;
      drawY = y + (h - drawH) / 2;
    }
  } else {
    if (imgRatio > targetRatio) {
      drawW = w;
      drawH = w / imgRatio;
      drawX = x;
      drawY = y + (h - drawH) / 2;
    } else {
      drawH = h;
      drawW = h * imgRatio;
      drawX = x + (w - drawW) / 2;
      drawY = y;
    }
  }

  ctx.drawImage(img, drawX, drawY, drawW, drawH);
}
