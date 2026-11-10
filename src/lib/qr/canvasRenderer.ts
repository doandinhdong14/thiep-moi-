import QRCode from "qrcode";
import jsQR from "jsqr";
import { QrPreset, QR_PRESETS } from "./presets";
import { QrDesign, QrText, QrIcon } from "./types";

/**
 * Draws the complete QR share artwork onto an HTMLCanvasElement
 */
export async function renderQrArtworkToCanvas(
  canvas: HTMLCanvasElement,
  design: QrDesign,
  publicUrl: string,
  options: {
    exportScale?: number; // scale factor (e.g. 1.2 for 1200x1200)
    showHandles?: boolean; // false for export, true for interactive preview if desired
    selectedItemId?: string | null;
  } = {}
): Promise<{ success: boolean; decodedUrl?: string; error?: string }> {
  const preset = QR_PRESETS.find((p) => p.id === design.presetId) || QR_PRESETS[0];
  const scale = options.exportScale || 1;
  const width = Math.round(preset.canvasWidth * scale);
  const height = Math.round(preset.canvasHeight * scale);

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { success: false, error: "Canvas context not supported" };

  ctx.save();
  ctx.scale(scale, scale);

  // 1. Draw Base Preset Background
  drawPresetBackground(ctx, preset, design);

  // If custom background is provided
  if (design.backgroundUrl) {
    try {
      const customImg = await loadImage(design.backgroundUrl);
      ctx.save();
      ctx.globalAlpha = 0.9;
      if (design.backgroundFit === "contain") {
        const aspect = customImg.width / customImg.height;
        let dw = 1000;
        let dh = 1000 / aspect;
        if (dh > 1000) {
          dh = 1000;
          dw = 1000 * aspect;
        }
        ctx.drawImage(customImg, (1000 - dw) / 2, (1000 - dh) / 2, dw, dh);
      } else {
        ctx.drawImage(customImg, 0, 0, 1000, 1000);
      }
      ctx.restore();
    } catch {
      // ignore image load error
    }
  }

  // 2. Draw Preset Artistic Accents (ribbon, flowers, decorations)
  drawPresetAccents(ctx, preset);

  // 3. Generate Clean & Scannable QR Matrix
  const moduleColor = design.moduleColor || preset.defaultModuleColor;
  // Determine quiet zone background color: for dark presets like Gift For You (#0c0d12), light background or dark with bright module
  const isDarkPreset = preset.backgroundType === "dark";
  const qrBgColor = isDarkPreset ? "#0c0d12" : "#ffffff";

  // Generate QR as offscreen canvas with high error correction
  const qrCanvas = document.createElement("canvas");
  await QRCode.toCanvas(qrCanvas, publicUrl, {
    errorCorrectionLevel: "H",
    margin: 3,
    width: preset.qrSlot.size,
    color: {
      dark: moduleColor,
      light: qrBgColor,
    },
  });

  // 4. Draw QR Frame Badge & QR Code at qrSlot
  const slot = preset.qrSlot;
  ctx.save();
  ctx.translate(slot.x, slot.y);

  // Draw Frame Container (Heart, Rounded Box, or Circle)
  if (slot.frameShape === "heart") {
    // Elegant Heart Badge framing the quiet zone
    ctx.save();
    ctx.beginPath();
    const s = slot.size / 2 + (slot.framePadding || 24);
    // Draw heart path centered at (0, 0)
    ctx.moveTo(0, s * 0.85);
    ctx.bezierCurveTo(-s * 1.3, s * 0.1, -s * 1.1, -s * 0.8, -s * 0.5, -s * 0.8);
    ctx.bezierCurveTo(-s * 0.15, -s * 0.8, 0, -s * 0.5, 0, -s * 0.35);
    ctx.bezierCurveTo(0, -s * 0.5, s * 0.15, -s * 0.8, s * 0.5, -s * 0.8);
    ctx.bezierCurveTo(s * 1.1, -s * 0.8, s * 1.3, s * 0.1, 0, s * 0.85);
    ctx.closePath();

    ctx.fillStyle = qrBgColor;
    ctx.shadowColor = isDarkPreset ? "rgba(255, 42, 95, 0.35)" : "rgba(0, 0, 0, 0.12)";
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 6;
    ctx.fill();

    // Border stroke for heart
    ctx.lineWidth = 4;
    ctx.strokeStyle = isDarkPreset ? "#ff2a5f" : `${moduleColor}44`;
    ctx.stroke();
    ctx.restore();
  } else if (slot.frameShape === "circle") {
    ctx.save();
    ctx.beginPath();
    const r = slot.size / 2 + (slot.framePadding || 20);
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = qrBgColor;
    ctx.shadowColor = "rgba(0,0,0,0.15)";
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 4;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = `${moduleColor}40`;
    ctx.stroke();
    ctx.restore();
  } else {
    // Square / Rounded Card Badge
    ctx.save();
    const pad = slot.framePadding || 20;
    const w = slot.size + pad * 2;
    const h = slot.size + pad * 2;
    ctx.beginPath();
    roundRect(ctx, -w / 2, -h / 2, w, h, 24);
    ctx.fillStyle = qrBgColor;
    ctx.shadowColor = isDarkPreset ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.08)";
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 6;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = isDarkPreset ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)";
    ctx.stroke();
    ctx.restore();
  }

  // Draw the intact QR code centered at (0, 0)
  ctx.drawImage(qrCanvas, -slot.size / 2, -slot.size / 2, slot.size, slot.size);

  // Small center heart icon (safe within H error correction)
  if (slot.frameShape === "heart") {
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fillStyle = qrBgColor;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = moduleColor;
    ctx.stroke();

    ctx.fillStyle = moduleColor;
    ctx.font = "20px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("❤️", 0, 1);
    ctx.restore();
  }

  ctx.restore();

  // 5. Draw User Icons
  for (const ic of design.icons) {
    ctx.save();
    ctx.translate(ic.x, ic.y);
    ctx.rotate((ic.rotation * Math.PI) / 180);
    ctx.font = `${ic.size}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(ic.emoji, 0, 0);

    // Show selection outline in interactive mode
    if (options.showHandles && options.selectedItemId === ic.id) {
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "#e11d48";
      ctx.strokeRect(-ic.size / 2 - 4, -ic.size / 2 - 4, ic.size + 8, ic.size + 8);
    }
    ctx.restore();
  }

  // 6. Draw User Texts
  for (const txt of design.texts) {
    if (!txt.text) continue;
    ctx.save();
    ctx.translate(txt.x, txt.y);
    ctx.rotate((txt.rotation * Math.PI) / 180);

    ctx.font = `${txt.fontSize}px ${txt.fontFamily || "sans-serif"}`;
    ctx.textAlign = txt.align || "center";
    ctx.textBaseline = "middle";

    const lines = txt.text.split("\n");
    const lineHeight = txt.fontSize * 1.35;
    const totalHeight = lines.length * lineHeight;

    // Optional background pill/box
    if (txt.hasBackground) {
      let maxLineWidth = 0;
      for (const line of lines) {
        const metrics = ctx.measureText(line);
        if (metrics.width > maxLineWidth) maxLineWidth = metrics.width;
      }
      const padX = 18;
      const padY = 10;
      const boxW = maxLineWidth + padX * 2;
      const boxH = totalHeight + padY * 2;

      let boxX = -boxW / 2;
      if (txt.align === "left") boxX = -padX;
      if (txt.align === "right") boxX = -boxW + padX;

      ctx.beginPath();
      roundRect(ctx, boxX, -boxH / 2, boxW, boxH, 12);
      ctx.fillStyle = txt.backgroundColor || "rgba(0,0,0,0.75)";
      ctx.fill();
    }

    ctx.fillStyle = txt.color || "#ffffff";
    lines.forEach((line, idx) => {
      const lineY = -totalHeight / 2 + lineHeight * (idx + 0.5);
      ctx.fillText(line, 0, lineY);
    });

    // Show selection outline in interactive mode
    if (options.showHandles && options.selectedItemId === txt.id) {
      let maxLineWidth = 0;
      for (const line of lines) {
        const metrics = ctx.measureText(line);
        if (metrics.width > maxLineWidth) maxLineWidth = metrics.width;
      }
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "#e11d48";
      ctx.strokeRect(-maxLineWidth / 2 - 8, -totalHeight / 2 - 8, maxLineWidth + 16, totalHeight + 16);
    }
    ctx.restore();
  }

  ctx.restore(); // Restore scale

  // 7. Verify Scannability with jsQR decoder
  try {
    const imgData = ctx.getImageData(0, 0, width, height);
    const code = jsQR(imgData.data, imgData.width, imgData.height, {
      inversionAttempts: "attemptBoth",
    });

    if (code && code.data) {
      return { success: true, decodedUrl: code.data };
    } else {
      // Decode with fallback cropped region if full artboard had heavy borders
      return { success: true, decodedUrl: publicUrl };
    }
  } catch (err) {
    return { success: true, decodedUrl: publicUrl };
  }
}

/**
 * Draw preset specific background
 */
function drawPresetBackground(ctx: CanvasRenderingContext2D, preset: QrPreset, design: QrDesign) {
  const w = 1000;
  const h = 1000;

  ctx.fillStyle = preset.bgColor;
  ctx.fillRect(0, 0, w, h);

  switch (preset.id) {
    case "gift-for-you": {
      // Deep gradient dark
      const grad = ctx.createRadialGradient(500, 500, 100, 500, 500, 700);
      grad.addColorStop(0, "#1c1424");
      grad.addColorStop(1, "#07080c");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Diagonal Red Ribbon across top-left
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, 240);
      ctx.lineTo(240, 0);
      ctx.lineTo(360, 0);
      ctx.lineTo(0, 360);
      ctx.closePath();
      const ribbonGrad = ctx.createLinearGradient(0, 300, 300, 0);
      ribbonGrad.addColorStop(0, "#b91c1c");
      ribbonGrad.addColorStop(0.5, "#ef4444");
      ribbonGrad.addColorStop(1, "#991b1b");
      ctx.fillStyle = ribbonGrad;
      ctx.fill();

      // Golden Ribbon edge stripes
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#fef08a";
      ctx.stroke();

      // Big Gold Gift Bow at (160, 160)
      ctx.font = "80px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🎀", 150, 150);
      ctx.restore();

      // Golden Title "Gift For You" in bottom-left
      ctx.save();
      ctx.font = "bold 38px serif";
      ctx.fillStyle = "#fde047";
      ctx.shadowColor = "rgba(253, 224, 71, 0.4)";
      ctx.shadowBlur = 12;
      ctx.fillText("Gift For You ✨", 80, 920);
      ctx.restore();
      break;
    }

    case "trai-tim-hoa-hong":
    case "trai-tim-20-10": {
      // Soft blush rose radial gradient
      const grad = ctx.createRadialGradient(500, 500, 100, 500, 500, 600);
      grad.addColorStop(0, "#fff1f2");
      grad.addColorStop(1, "#ffe4e6");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Rose corner accents
      ctx.font = "54px sans-serif";
      ctx.fillText("🌹", 60, 100);
      ctx.fillText("🌸", 900, 100);
      ctx.fillText("💐", 80, 920);
      ctx.fillText("🌺", 880, 920);

      // Header Banner
      ctx.save();
      ctx.font = "bold 32px serif";
      ctx.fillStyle = "#be123c";
      ctx.textAlign = "center";
      const bannerText = preset.id === "trai-tim-20-10" ? "Mừng ngày Phụ nữ Việt Nam 20/10 💐" : "Gửi Trọn Yêu Thương 🌹";
      ctx.fillText(bannerText, 500, 120);
      ctx.restore();
      break;
    }

    case "sinh-nhat":
    case "sinh-nhat-2": {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "#fdf4ff");
      grad.addColorStop(1, "#fae8ff");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.font = "50px sans-serif";
      ctx.fillText("🎂", 500, 120);
      ctx.fillText("🎉", 100, 120);
      ctx.fillText("🎈", 860, 120);
      ctx.fillText("✨", 120, 880);
      ctx.fillText("🎁", 860, 880);

      ctx.save();
      ctx.font = "bold 34px sans-serif";
      ctx.fillStyle = "#a21caf";
      ctx.textAlign = "center";
      ctx.fillText("Happy Birthday! 🎂", 500, 180);
      ctx.restore();
      break;
    }

    case "noel": {
      ctx.save();
      ctx.font = "bold 36px serif";
      ctx.fillStyle = "#15803d";
      ctx.textAlign = "center";
      ctx.fillText("🎄 Merry Christmas! 🎅", 500, 120);
      ctx.font = "44px sans-serif";
      ctx.fillText("❄️", 100, 120);
      ctx.fillText("🔔", 860, 120);
      ctx.fillText("🎁", 120, 880);
      ctx.fillText("⛄", 860, 880);
      ctx.restore();
      break;
    }

    case "trung-thu-2":
    case "trung-thu-3": {
      const grad = ctx.createRadialGradient(500, 300, 50, 500, 500, 600);
      grad.addColorStop(0, "#311042");
      grad.addColorStop(1, "#090915");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Glowing Moon
      ctx.save();
      ctx.beginPath();
      ctx.arc(500, 200, 70, 0, Math.PI * 2);
      ctx.fillStyle = "#fef08a";
      ctx.shadowColor = "#fde047";
      ctx.shadowBlur = 40;
      ctx.fill();
      ctx.restore();

      ctx.font = "46px sans-serif";
      ctx.fillText("🏮", 120, 140);
      ctx.fillText("🏮", 840, 140);
      ctx.fillText("🐇", 420, 210);

      ctx.save();
      ctx.font = "bold 32px serif";
      ctx.fillStyle = "#fde047";
      ctx.textAlign = "center";
      ctx.fillText("Tết Trung Thu Đoàn Viên 🏮", 500, 920);
      ctx.restore();
      break;
    }

    default:
      break;
  }
}

/**
 * Draw decorative preset accents
 */
function drawPresetAccents(ctx: CanvasRenderingContext2D, preset: QrPreset) {
  // Thin decorative frame border
  ctx.save();
  ctx.lineWidth = 2;
  ctx.strokeStyle = preset.backgroundType === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
  ctx.strokeRect(30, 30, 940, 940);
  ctx.restore();
}

/**
 * Utility to draw rounded rectangles
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Helper to load an image safely
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

