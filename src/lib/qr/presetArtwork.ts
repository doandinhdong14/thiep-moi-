import type { QrPreset } from "./presets";

/**
 * Draw a deterministic 5-point star centered at (cx, cy).
 */
function drawFivePointStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  fill: string
) {
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
}

/**
 * Draw a 4-point diamond sparkle.
 */
function drawSparkle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  color: string
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const r = i % 2 === 0 ? radius : radius * 0.22;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * Draw a tiny sketchy outline heart.
 */
function drawSmallHeart(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  strokeOrFill: string,
  filled = true,
  rotation = 0
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  const s = size;
  ctx.beginPath();
  ctx.moveTo(0, s * 0.35);
  ctx.bezierCurveTo(-s * 0.9, -s * 0.2, -s * 0.55, -s * 0.9, 0, -s * 0.35);
  ctx.bezierCurveTo(s * 0.55, -s * 0.9, s * 0.9, -s * 0.2, 0, s * 0.35);
  ctx.closePath();
  if (filled) {
    ctx.fillStyle = strokeOrFill;
    ctx.fill();
  } else {
    ctx.strokeStyle = strokeOrFill;
    ctx.lineWidth = Math.max(1.5, s * 0.12);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Draw a multi-petal botanical rose for bouquet presets.
 */
function drawLayeredRose(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  baseColor: string,
  highlightColor: string,
  deepColor: string
) {
  ctx.save();
  ctx.translate(cx, cy);

  // Outer petals
  for (let i = 0; i < 7; i++) {
    const angle = (i * Math.PI * 2) / 7;
    ctx.save();
    ctx.rotate(angle);
    ctx.fillStyle = i % 2 === 0 ? baseColor : highlightColor;
    ctx.beginPath();
    ctx.ellipse(r * 0.42, 0, r * 0.46, r * 0.34, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Mid petals
  for (let i = 0; i < 5; i++) {
    const angle = (i * Math.PI * 2) / 5 + 0.4;
    ctx.save();
    ctx.rotate(angle);
    ctx.fillStyle = highlightColor;
    ctx.beginPath();
    ctx.ellipse(r * 0.24, 0, r * 0.32, r * 0.23, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Swirl center
  ctx.fillStyle = deepColor;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.26, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = highlightColor;
  ctx.lineWidth = Math.max(1.5, r * 0.08);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.14, 0.2, Math.PI * 1.6);
  ctx.stroke();

  ctx.restore();
}

function drawButterfly(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  angle: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);

  const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, 42);
  grad.addColorStop(0, "#ffe4ec");
  grad.addColorStop(0.65, "#f9a8c4");
  grad.addColorStop(1, "#e11d48");

  ctx.fillStyle = grad;
  ctx.strokeStyle = "#fff5f7";
  ctx.lineWidth = 2;

  // Left wings
  ctx.beginPath();
  ctx.ellipse(-18, -12, 22, 15, -0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(-14, 14, 15, 11, 0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Right wings
  ctx.beginPath();
  ctx.ellipse(18, -12, 22, 15, 0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(14, 14, 15, 11, -0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Body
  ctx.fillStyle = "#881337";
  ctx.beginPath();
  ctx.ellipse(0, 2, 3.5, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSatinRibbonBow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale: number,
  mainColor: string,
  darkColor: string,
  highlightColor: string
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  // Ribbon tails
  ctx.fillStyle = darkColor;
  ctx.beginPath();
  ctx.moveTo(-8, 12);
  ctx.quadraticCurveTo(-55, 75, -75, 125);
  ctx.lineTo(-42, 118);
  ctx.lineTo(-28, 134);
  ctx.quadraticCurveTo(-18, 65, -2, 16);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(8, 12);
  ctx.quadraticCurveTo(55, 75, 85, 115);
  ctx.lineTo(54, 112);
  ctx.lineTo(42, 130);
  ctx.quadraticCurveTo(22, 62, 4, 16);
  ctx.fill();

  // Left and right loops
  for (const dir of [-1, 1]) {
    ctx.save();
    ctx.scale(dir, 1);
    const loopGrad = ctx.createLinearGradient(0, -36, 92, 28);
    loopGrad.addColorStop(0, mainColor);
    loopGrad.addColorStop(0.5, highlightColor);
    loopGrad.addColorStop(1, darkColor);
    ctx.fillStyle = loopGrad;
    ctx.beginPath();
    ctx.moveTo(6, -6);
    ctx.bezierCurveTo(48, -56, 112, -32, 92, 16);
    ctx.bezierCurveTo(78, 42, 32, 22, 6, 8);
    ctx.closePath();
    ctx.fill();

    // Inner crease
    ctx.strokeStyle = darkColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.quadraticCurveTo(50, -6, 72, 4);
    ctx.stroke();
    ctx.restore();
  }

  // Center knot
  const knotGrad = ctx.createLinearGradient(-18, -18, 18, 18);
  knotGrad.addColorStop(0, highlightColor);
  knotGrad.addColorStop(0.5, mainColor);
  knotGrad.addColorStop(1, darkColor);
  ctx.fillStyle = knotGrad;
  ctx.beginPath();
  ctx.roundRect(-18, -16, 36, 32, 10);
  ctx.fill();
  ctx.restore();
}

function drawTraiTimHoaHong(ctx: CanvasRenderingContext2D) {
  const bg = ctx.createRadialGradient(500, 420, 80, 500, 500, 680);
  bg.addColorStop(0, "#fff5f4");
  bg.addColorStop(0.55, "#f7dcdf");
  bg.addColorStop(1, "#e7b9bf");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1000, 1000);

  // Bokeh ambiance
  const bokeh: Array<[number, number, number, string]> = [
    [120, 130, 55, "rgba(255,255,255,0.45)"],
    [880, 180, 70, "rgba(255,235,238,0.45)"],
    [820, 560, 40, "rgba(255,232,190,0.5)"],
    [160, 520, 35, "rgba(255,232,190,0.45)"],
    [840, 860, 60, "rgba(255,255,255,0.35)"],
  ];
  for (const [bx, by, br, bc] of bokeh) {
    ctx.fillStyle = bc;
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fill();
  }

  // Soft sakura corners
  for (const [sx, sy, sr] of [
    [95, 85, 18],
    [165, 65, 14],
    [885, 95, 20],
    [825, 180, 14],
    [220, 225, 12],
  ]) {
    ctx.fillStyle = "rgba(244, 114, 144, 0.35)";
    for (let p = 0; p < 5; p++) {
      const a = (p * Math.PI * 2) / 5;
      ctx.beginPath();
      ctx.ellipse(
        sx + Math.cos(a) * sr * 0.65,
        sy + Math.sin(a) * sr * 0.65,
        sr * 0.45,
        sr * 0.3,
        a,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }

  // Paper bouquet cone back layer
  ctx.save();
  ctx.fillStyle = "#f2d2cd";
  ctx.beginPath();
  ctx.moveTo(85, 535);
  ctx.lineTo(295, 315);
  ctx.lineTo(715, 315);
  ctx.lineTo(920, 535);
  ctx.lineTo(660, 965);
  ctx.lineTo(340, 965);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#fae6e2";
  ctx.beginPath();
  ctx.moveTo(145, 560);
  ctx.lineTo(500, 950);
  ctx.lineTo(855, 560);
  ctx.lineTo(740, 415);
  ctx.lineTo(260, 415);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Greenery & baby's breath behind roses
  ctx.fillStyle = "#4d7c54";
  for (let i = 0; i < 18; i++) {
    const angle = (i / 18) * Math.PI * 2;
    const lx = 500 + Math.cos(angle) * 285;
    const ly = 560 + Math.sin(angle) * 225;
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.ellipse(0, 0, 34, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Outer ring of roses forming dense crimson bouquet around QR heart
  const roses: Array<[number, number, number, number]> = [
    [500, 345, 42, 0],
    [418, 360, 40, 1],
    [582, 360, 40, 2],
    [340, 405, 42, 0],
    [660, 405, 42, 1],
    [275, 470, 44, 2],
    [725, 470, 44, 0],
    [248, 550, 46, 1],
    [752, 550, 46, 2],
    [270, 635, 46, 0],
    [730, 635, 46, 1],
    [325, 710, 46, 2],
    [675, 710, 46, 0],
    [400, 760, 46, 1],
    [600, 760, 46, 2],
    [500, 785, 48, 0],
    // Inner buffer roses under the heart
    [365, 495, 40, 2],
    [635, 495, 40, 1],
    [350, 595, 42, 0],
    [650, 595, 42, 2],
    [420, 680, 44, 1],
    [580, 680, 44, 0],
    [500, 705, 44, 2],
    [445, 420, 38, 1],
    [555, 420, 38, 0],
  ];

  const palettes = [
    ["#e11d48", "#fb7185", "#9f1239"],
    ["#f43f5e", "#fda4af", "#be123c"],
    ["#db2777", "#f472b6", "#9d174d"],
  ];

  for (const [rx, ry, rr, pIdx] of roses) {
    const [base, hi, deep] = palettes[pIdx];
    drawLayeredRose(ctx, rx, ry, rr, base, hi, deep);
  }

  // Front kraft wrap folds
  ctx.fillStyle = "rgba(255, 228, 224, 0.92)";
  ctx.beginPath();
  ctx.moveTo(140, 560);
  ctx.quadraticCurveTo(320, 745, 500, 920);
  ctx.lineTo(315, 970);
  ctx.quadraticCurveTo(190, 760, 140, 560);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(860, 560);
  ctx.quadraticCurveTo(680, 745, 500, 920);
  ctx.lineTo(685, 970);
  ctx.quadraticCurveTo(810, 760, 860, 560);
  ctx.fill();

  // Satin bows on left shoulder and bottom waist
  drawSatinRibbonBow(ctx, 325, 405, 0.72, "#f4a3b5", "#d9728b", "#ffd4de");
  drawSatinRibbonBow(ctx, 500, 910, 1.05, "#e692a6", "#c65d78", "#ffc7d4");

  // Baby's-breath white dots
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  for (const [dx, dy] of [
    [290, 390],
    [305, 420],
    [705, 420],
    [690, 390],
    [235, 600],
    [765, 600],
    [450, 800],
    [550, 800],
  ]) {
    ctx.beginPath();
    ctx.arc(dx, dy, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Butterflies & falling petals
  drawButterfly(ctx, 795, 425, 0.85, 0.35);
  drawButterfly(ctx, 195, 665, 0.82, -0.35);

  // Header Calligraphy
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = "#b91c3a";
  ctx.font = "italic 600 42px Georgia, 'Times New Roman', serif";
  ctx.fillText("♡ Mừng ngày ♡", 500, 86);

  ctx.font = "italic 700 80px Georgia, 'Times New Roman', serif";
  ctx.lineWidth = 6;
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.strokeText("Phụ nữ Việt Nam", 500, 165);
  ctx.fillStyle = "#c81e3d";
  ctx.fillText("Phụ nữ Việt Nam", 500, 165);

  ctx.font = "italic 700 54px Georgia, 'Times New Roman', serif";
  ctx.fillText("♡ 20/10 ♡", 500, 228);
  ctx.restore();
}

function drawTraiTim2010(ctx: CanvasRenderingContext2D) {
  const bg = ctx.createLinearGradient(0, 0, 1000, 1000);
  bg.addColorStop(0, "#fdf0f6");
  bg.addColorStop(0.5, "#fbd7e7");
  bg.addColorStop(1, "#f7c5da");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1000, 1000);

  // Soft curved ribbon light streaks in background
  ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.moveTo(-40, 280);
  ctx.bezierCurveTo(320, 110, 680, 410, 1040, 160);
  ctx.stroke();

  // Bokeh highlights
  for (const [bx, by, br] of [
    [130, 340, 32],
    [175, 410, 20],
    [860, 390, 26],
    [820, 520, 40],
  ]) {
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fill();
  }

  // Corner peony blossoms & leaves bottom-left and bottom-right
  const drawPeonyCorner = (cx: number, cy: number) => {
    ctx.save();
    ctx.fillStyle = "#5f7d58";
    for (const [lx, ly, rot] of [
      [-65, -45, -0.6],
      [65, -35, 0.5],
      [-45, 65, 0.4],
      [55, 55, -0.5],
    ]) {
      ctx.save();
      ctx.translate(cx + lx, cy + ly);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.ellipse(0, 0, 42, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    drawLayeredRose(ctx, cx, cy, 85, "#f9a8c4", "#ffe4ef", "#e879a0");
    drawLayeredRose(ctx, cx + 65, cy - 55, 48, "#fbcfe8", "#fff1f8", "#f472b6");
    ctx.restore();
  };
  drawPeonyCorner(175, 835);
  drawPeonyCorner(830, 825);

  // Folded peach/coral bouquet cone
  ctx.save();
  const coneGrad = ctx.createLinearGradient(250, 280, 740, 840);
  coneGrad.addColorStop(0, "#fcb5ac");
  coneGrad.addColorStop(0.55, "#f68c87");
  coneGrad.addColorStop(1, "#e65e5d");

  ctx.fillStyle = coneGrad;
  ctx.strokeStyle = "#8a2b2b";
  ctx.lineWidth = 3;

  // Back top collar flaps
  ctx.beginPath();
  ctx.moveTo(355, 280);
  ctx.lineTo(665, 325);
  ctx.lineTo(745, 485);
  ctx.lineTo(500, 790);
  ctx.lineTo(240, 505);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Inner cone wrapper around QR heart
  ctx.fillStyle = "#fba8a3";
  ctx.beginPath();
  ctx.moveTo(210, 520);
  ctx.quadraticCurveTo(360, 710, 500, 795);
  ctx.quadraticCurveTo(660, 710, 795, 540);
  ctx.quadraticCurveTo(640, 405, 500, 430);
  ctx.quadraticCurveTo(350, 410, 210, 520);
  ctx.fill();
  ctx.stroke();

  // Lower stem wrap
  ctx.fillStyle = "#f27e7b";
  ctx.beginPath();
  ctx.moveTo(455, 795);
  ctx.lineTo(410, 995);
  ctx.lineTo(585, 995);
  ctx.lineTo(540, 795);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Flowing foreground ribbon arc bottom-right
  ctx.save();
  ctx.fillStyle = "#fda4af";
  ctx.beginPath();
  ctx.moveTo(150, 890);
  ctx.quadraticCurveTo(460, 765, 790, 905);
  ctx.quadraticCurveTo(875, 945, 790, 975);
  ctx.quadraticCurveTo(660, 955, 725, 865);
  ctx.quadraticCurveTo(450, 795, 165, 915);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Lavender bow tied on bouquet stem
  drawSatinRibbonBow(ctx, 496, 825, 0.85, "#c09be8", "#9366cc", "#e8d6ff");

  // Falling petals
  ctx.fillStyle = "#f47290";
  for (const [px, py, rot] of [
    [130, 515, 0.4],
    [860, 460, -0.5],
    [765, 690, 0.8],
  ]) {
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Header text
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = "#2d5a2e";
  ctx.font = "italic 700 44px Georgia, 'Times New Roman', serif";
  ctx.fillText("Mừng ngày", 500, 82);

  ctx.lineWidth = 8;
  ctx.strokeStyle = "#ffffff";
  ctx.font = "italic 800 76px Georgia, 'Times New Roman', serif";
  ctx.strokeText("Phụ Nữ Việt Nam", 500, 160);
  ctx.fillStyle = "#e04f62";
  ctx.fillText("Phụ Nữ Việt Nam", 500, 160);

  ctx.font = "italic 800 52px Georgia, 'Times New Roman', serif";
  ctx.strokeText("♥  20/10  ♥", 500, 224);
  ctx.fillText("♥  20/10  ♥", 500, 224);
  ctx.restore();
}

function drawGiftForYou(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#050507";
  ctx.fillRect(0, 0, 1000, 1000);

  // Diagonal top-left satin ribbon band
  ctx.save();
  const ribGrad = ctx.createLinearGradient(0, 290, 430, 0);
  ribGrad.addColorStop(0, "#7f0c18");
  ribGrad.addColorStop(0.5, "#dc1c34");
  ribGrad.addColorStop(1, "#6f0914");
  ctx.fillStyle = ribGrad;
  ctx.beginPath();
  ctx.moveTo(0, 270);
  ctx.lineTo(395, 0);
  ctx.lineTo(485, 0);
  ctx.lineTo(0, 330);
  ctx.closePath();
  ctx.fill();

  // Serpentine wavy ribbon tail down the left edge
  ctx.strokeStyle = "#c9162d";
  ctx.lineWidth = 18;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(215, 225);
  ctx.bezierCurveTo(105, 325, 225, 415, 130, 505);
  ctx.bezierCurveTo(60, 580, 175, 650, 118, 735);
  ctx.stroke();

  ctx.strokeStyle = "#ff4c65";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(212, 225);
  ctx.bezierCurveTo(102, 325, 222, 415, 127, 505);
  ctx.bezierCurveTo(57, 580, 172, 650, 115, 735);
  ctx.stroke();

  // Big satin bow on top-left corner
  drawSatinRibbonBow(ctx, 225, 165, 1.38, "#d4142b", "#6f0813", "#ff4f66");

  // Gold heart charm hanging from bow knot
  drawSmallHeart(ctx, 232, 225, 18, "#f7d58b", false, 0);
  ctx.restore();

  // Bottom-right diagonal ribbon
  ctx.save();
  const brGrad = ctx.createLinearGradient(640, 1000, 1000, 680);
  brGrad.addColorStop(0, "#8f0e1c");
  brGrad.addColorStop(0.5, "#df1f38");
  brGrad.addColorStop(1, "#790a15");
  ctx.fillStyle = brGrad;
  ctx.beginPath();
  ctx.moveTo(645, 1000);
  ctx.lineTo(1000, 685);
  ctx.lineTo(1000, 765);
  ctx.lineTo(735, 1000);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Sparkling gold stars and outline hearts
  for (const [sx, sy, sr] of [
    [335, 125, 14],
    [130, 560, 14],
    [225, 745, 16],
    [870, 895, 15],
  ]) {
    drawSparkle(ctx, sx, sy, sr, "#fae09b");
  }
  drawSmallHeart(ctx, 412, 130, 14, "#f4cf86", false, -0.2);
  drawSmallHeart(ctx, 945, 815, 14, "#f4cf86", false, 0.25);

  // Script "Gift for you" in bottom-left
  ctx.save();
  ctx.fillStyle = "#f9dfb0";
  ctx.font = "italic 600 94px Georgia, 'Times New Roman', serif";
  ctx.fillText("Gift", 130, 845);
  ctx.font = "italic 500 50px Georgia, 'Times New Roman', serif";
  ctx.fillText("for you", 230, 902);

  // Flourish line below script
  ctx.strokeStyle = "#f9dfb0";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(155, 956);
  ctx.quadraticCurveTo(285, 946, 402, 916);
  ctx.stroke();

  drawSmallHeart(ctx, 320, 815, 12, "#f9dfb0", false, 0.2);
  drawSmallHeart(ctx, 418, 905, 10, "#f9dfb0", false, 0.35);
  ctx.restore();
}

function drawHoa(ctx: CanvasRenderingContext2D, preset: QrPreset) {
  ctx.fillStyle = preset.bgColor;
  ctx.fillRect(0, 0, 1000, 1000);

  // Botanical navy leaves around bouquet
  const leaves: Array<[number, number, number, number, number]> = [
    [540, 215, 72, 22, -1.1],
    [410, 240, 58, 18, -1.8],
    [195, 360, 62, 19, -0.9],
    [255, 325, 48, 16, -1.5],
    [680, 285, 58, 19, 0.8],
    [775, 365, 74, 21, 0.25],
    [630, 590, 48, 15, 0.9],
  ];
  ctx.fillStyle = "#2d4065";
  for (const [lx, ly, w, h, a] of leaves) {
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.ellipse(0, 0, w * 0.55, h * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Stylized Scandinavian pastel pink flowers peeking out around bouquet
  const drawSimpleBloom = (cx: number, cy: number, r: number, color: string) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = color;
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI * 2) / 6;
      ctx.beginPath();
      ctx.ellipse(
        Math.cos(a) * r * 0.52,
        Math.sin(a) * r * 0.52,
        r * 0.42,
        r * 0.24,
        a,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    ctx.fillStyle = "#2d4065";
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  drawSimpleBloom(365, 220, 40, "#f5a4ba");
  drawSimpleBloom(225, 385, 46, "#f7b5c8");
  drawSimpleBloom(700, 435, 74, "#f49eb7");

  // Rounded navy wire-card outline slightly offset behind QR slot
  ctx.save();
  ctx.strokeStyle = "#2d4065";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(275, 222, 410, 355, 38);
  ctx.stroke();
  ctx.restore();

  // Pink triangular wrap cone below & behind QR
  ctx.save();
  ctx.fillStyle = "#f7aec2";
  ctx.beginPath();
  ctx.moveTo(205, 515);
  ctx.lineTo(500, 860);
  ctx.lineTo(755, 445);
  ctx.lineTo(660, 470);
  ctx.lineTo(295, 470);
  ctx.closePath();
  ctx.fill();

  // Second fold triangle
  ctx.fillStyle = "#f29ab2";
  ctx.beginPath();
  ctx.moveTo(205, 515);
  ctx.lineTo(500, 860);
  ctx.lineTo(395, 765);
  ctx.lineTo(500, 915);
  ctx.lineTo(555, 885);
  ctx.lineTo(500, 860);
  ctx.closePath();
  ctx.fill();

  // Lower stem & tail
  ctx.fillStyle = "#f7aec2";
  ctx.beginPath();
  ctx.moveTo(465, 795);
  ctx.lineTo(420, 930);
  ctx.lineTo(500, 955);
  ctx.lineTo(570, 915);
  ctx.lineTo(525, 795);
  ctx.closePath();
  ctx.fill();

  // Thin navy line-art bow around stem
  ctx.strokeStyle = "#2d4065";
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.ellipse(470, 770, 26, 15, -0.35, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(522, 765, 26, 15, 0.35, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(495, 780);
  ctx.quadraticCurveTo(465, 818, 448, 845);
  ctx.moveTo(500, 780);
  ctx.quadraticCurveTo(532, 818, 545, 845);
  ctx.stroke();

  // Small lower bloom accent
  drawSimpleBloom(495, 650, 44, "#f9becf");
  ctx.restore();

  // Gold double border around QR slot
  const half = preset.qrSlot.size / 2 + 12;
  ctx.save();
  ctx.strokeStyle = "#eab308";
  ctx.lineWidth = 6;
  ctx.strokeRect(
    preset.qrSlot.x - half,
    preset.qrSlot.y - half,
    half * 2,
    half * 2
  );
  ctx.strokeStyle = "#ec4899";
  ctx.lineWidth = 3;
  ctx.strokeRect(
    preset.qrSlot.x - half - 4,
    preset.qrSlot.y - half - 4,
    half * 2 + 8,
    half * 2 + 8
  );
  ctx.restore();
}

function drawCupid(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 1000, 1000);

  // Subtle blush watermark heart behind center
  ctx.save();
  ctx.translate(500, 540);
  const s = 340;
  ctx.fillStyle = "rgba(255, 226, 236, 0.65)";
  ctx.beginPath();
  ctx.moveTo(0, s * 0.92);
  ctx.bezierCurveTo(-s * 1.45, s * 0.08, -s * 0.95, -s * 1.05, 0, -s * 0.32);
  ctx.bezierCurveTo(s * 0.95, -s * 1.05, s * 1.45, s * 0.08, 0, s * 0.92);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawMuiTen(ctx: CanvasRenderingContext2D, preset: QrPreset) {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 1000, 1000);

  const half = preset.qrSlot.size / 2 + (preset.qrSlot.framePadding ?? 14) + 52;
  const cx = preset.qrSlot.x;
  const cy = preset.qrSlot.y;

  const drawSingleArrow = (ax: number, ay: number, angle: number, length = 220) => {
    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(angle);

    // Shaft
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-length / 2, 0);
    ctx.lineTo(length / 2 - 22, 0);
    ctx.stroke();

    // Fletching feathers at tail (-length/2)
    ctx.fillStyle = "#f48fb1";
    ctx.beginPath();
    ctx.moveTo(-length / 2 - 12, -22);
    ctx.lineTo(-length / 2 + 48, -22);
    ctx.lineTo(-length / 2 + 28, 0);
    ctx.lineTo(-length / 2 + 48, 22);
    ctx.lineTo(-length / 2 - 12, 22);
    ctx.lineTo(-length / 2 + 6, 0);
    ctx.closePath();
    ctx.fill();

    // Feather stripe cuts
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    for (const fx of [-length / 2 + 12, -length / 2 + 28]) {
      ctx.beginPath();
      ctx.moveTo(fx, -22);
      ctx.lineTo(fx - 10, -2);
      ctx.moveTo(fx, 22);
      ctx.lineTo(fx - 10, 2);
      ctx.stroke();
    }

    // Heart arrowhead at tip (+length/2)
    ctx.fillStyle = "#f48fb1";
    ctx.beginPath();
    ctx.moveTo(length / 2 + 12, 0);
    ctx.bezierCurveTo(length / 2 - 14, -36, length / 2 - 38, -24, length / 2 - 28, 0);
    ctx.bezierCurveTo(length / 2 - 38, 24, length / 2 - 14, 36, length / 2 + 12, 0);
    ctx.fill();

    ctx.restore();
  };

  // Top pair pointing right
  drawSingleArrow(cx - 135, cy - half, 0);
  drawSingleArrow(cx + 135, cy - half, 0);
  // Bottom pair pointing left
  drawSingleArrow(cx + 135, cy + half, Math.PI);
  drawSingleArrow(cx - 135, cy + half, Math.PI);
  // Left pair pointing up
  drawSingleArrow(cx - half, cy - 135, -Math.PI / 2);
  drawSingleArrow(cx - half, cy + 135, -Math.PI / 2);
  // Right pair pointing down
  drawSingleArrow(cx + half, cy - 135, Math.PI / 2);
  drawSingleArrow(cx + half, cy + 135, Math.PI / 2);
}

function drawTraiTim(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 1000, 1000);
}

function drawKawaiiBeagle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale: number,
  mode: "letter" | "huggingHeart"
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.strokeStyle = "#18181b";
  ctx.lineWidth = 4;
  ctx.lineJoin = "round";

  // Body
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(0, 48, 24, 32, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Legs
  ctx.beginPath();
  ctx.ellipse(-15, 74, 12, 7, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(15, 74, 12, 7, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Round head
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(-6, -4, 42, 34, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Snout & black nose
  ctx.fillStyle = "#18181b";
  ctx.beginPath();
  ctx.ellipse(-44, -2, 8, 6.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Floppy black ear
  ctx.beginPath();
  ctx.ellipse(18, 2, 13, 25, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Eye dot
  ctx.beginPath();
  ctx.arc(-20, -10, 3.2, 0, Math.PI * 2);
  ctx.fill();

  if (mode === "letter") {
    // Envelope in paws
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(4, 34, 42, 28);
    ctx.strokeRect(4, 34, 42, 28);
    ctx.beginPath();
    ctx.moveTo(4, 34);
    ctx.lineTo(25, 49);
    ctx.lineTo(46, 34);
    ctx.stroke();
    drawSmallHeart(ctx, 25, 49, 8, "#dc2626", true);
  } else {
    // Hugging red heart
    drawSmallHeart(ctx, 8, 45, 36, "#dc2626", true);
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(-10, 44, 10, 6, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(24, 44, 10, 6, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawTraiTimKhung(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 1000, 1000);

  ctx.save();
  ctx.translate(500, 500);
  ctx.rotate(-0.018);

  // Soft Polaroid shadow
  ctx.fillStyle = "rgba(15, 23, 42, 0.14)";
  ctx.fillRect(-264, -346, 540, 710);

  // Polaroid card
  ctx.fillStyle = "#f9fafb";
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 3;
  ctx.fillRect(-270, -355, 540, 710);
  ctx.strokeRect(-270, -355, 540, 710);

  // Black inner photo window (QR slot sits inside here)
  ctx.fillStyle = "#050505";
  ctx.fillRect(-222, -255, 444, 480);

  // Small crimson hearts on top & bottom Polaroid margins
  drawSmallHeart(ctx, 0, -304, 34, "#b91c1c", true);
  drawSmallHeart(ctx, 0, 294, 34, "#b91c1c", true);

  // Diagonal masking tapes at top-left & bottom-right corners
  const drawTape = (tx: number, ty: number, rot: number) => {
    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(rot);
    ctx.fillStyle = "rgba(196, 59, 53, 0.9)";
    ctx.beginPath();
    ctx.moveTo(-88, -26);
    ctx.lineTo(88, -26);
    ctx.lineTo(80, -8);
    ctx.lineTo(90, 12);
    ctx.lineTo(82, 26);
    ctx.lineTo(-86, 26);
    ctx.lineTo(-78, 6);
    ctx.lineTo(-90, -10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };
  drawTape(-242, -328, -0.64);
  drawTape(244, 315, -0.62);

  ctx.restore();

  // Cute beagles at top-right & bottom-left corners
  drawKawaiiBeagle(ctx, 710, 130, 0.92, "letter");
  drawKawaiiBeagle(ctx, 290, 815, 0.96, "huggingHeart");
}

function drawSinhNhat(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#f7edee";
  ctx.fillRect(0, 0, 1000, 1000);

  // Botanical pastel leaves & confetti around cake
  const leafGroups: Array<[number, number, number, string]> = [
    [185, 515, -0.65, "#9eaec4"],
    [220, 610, -0.45, "#a7b5ca"],
    [140, 445, -0.8, "#f1969a"],
    [820, 505, 0.65, "#9eaec4"],
    [795, 615, 0.45, "#a7b5ca"],
    [860, 435, 0.85, "#f3ab7c"],
    [235, 340, -0.9, "#b8a7cf"],
    [765, 340, 0.9, "#b8a7cf"],
  ];
  for (const [lx, ly, rot, col] of leafGroups) {
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(rot);
    ctx.strokeStyle = col;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 90);
    ctx.lineTo(0, -75);
    ctx.stroke();
    ctx.fillStyle = col;
    for (let k = -3; k <= 2; k++) {
      ctx.beginPath();
      ctx.ellipse(-18, k * 24, 16, 8, -0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(18, k * 24 - 10, 16, 8, 0.45, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Confetti dots & small hearts
  const confettiHearts: Array<[number, number, string]> = [
    [160, 290, "#f39b6d"],
    [130, 595, "#e87989"],
    [855, 290, "#5c6c94"],
    [885, 625, "#e87989"],
    [260, 865, "#f39b6d"],
    [755, 865, "#5c6c94"],
  ];
  for (const [cx, cy, col] of confettiHearts) {
    drawSmallHeart(ctx, cx, cy, 18, col, true, 0.25);
  }

  // Wide navy cake platter
  ctx.fillStyle = "#5b6d96";
  ctx.beginPath();
  ctx.ellipse(500, 745, 355, 92, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#eef2f8";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(500, 738, 325, 76, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Bottom apricot tier
  ctx.fillStyle = "#f4a16e";
  ctx.beginPath();
  ctx.roundRect(270, 520, 460, 200, 32);
  ctx.fill();
  // Cream icing rim on bottom tier
  ctx.fillStyle = "#f9ece4";
  ctx.beginPath();
  ctx.ellipse(500, 535, 232, 42, 0, 0, Math.PI * 2);
  ctx.fill();

  // Top coral-pink tier
  ctx.fillStyle = "#eb6c73";
  ctx.beginPath();
  ctx.roundRect(338, 350, 324, 155, 28);
  ctx.fill();
  // Frosting drips on top tier
  ctx.fillStyle = "#f9ece4";
  ctx.beginPath();
  ctx.ellipse(500, 362, 162, 34, 0, 0, Math.PI * 2);
  ctx.fill();

  // Striped tall blue candle at center top
  ctx.save();
  ctx.fillStyle = "#62739e";
  ctx.fillRect(482, 222, 36, 138);
  ctx.strokeStyle = "#d9e1f0";
  ctx.lineWidth = 6;
  for (let sy = 238; sy <= 345; sy += 22) {
    ctx.beginPath();
    ctx.moveTo(482, sy);
    ctx.lineTo(518, sy - 10);
    ctx.stroke();
  }
  ctx.restore();

  // Candle flame
  ctx.fillStyle = "#f49746";
  ctx.beginPath();
  ctx.moveTo(500, 92);
  ctx.quadraticCurveTo(535, 160, 500, 204);
  ctx.quadraticCurveTo(465, 160, 500, 92);
  ctx.fill();
  ctx.fillStyle = "#fde047";
  ctx.beginPath();
  ctx.moveTo(500, 125);
  ctx.quadraticCurveTo(518, 166, 500, 196);
  ctx.quadraticCurveTo(482, 166, 500, 125);
  ctx.fill();

  // Curved "Happy Birthday!" typography
  ctx.save();
  ctx.fillStyle = "#2b375b";
  ctx.font = "italic 700 72px Georgia, 'Times New Roman', serif";
  ctx.textAlign = "center";
  ctx.save();
  ctx.translate(280, 212);
  ctx.rotate(-0.34);
  ctx.fillText("Happy", 0, 0);
  ctx.restore();

  ctx.save();
  ctx.translate(720, 200);
  ctx.rotate(0.32);
  ctx.fillText("Birthday!", 0, 0);
  ctx.restore();
  ctx.restore();
}

function drawPartyPuppy(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spotted: boolean,
  hatColor: string
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = "#3f2e2b";
  ctx.lineWidth = 4;

  // Party hat
  ctx.fillStyle = hatColor;
  ctx.beginPath();
  ctx.moveTo(-26, -42);
  ctx.lineTo(0, -108);
  ctx.lineTo(28, -42);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#fde047";
  ctx.beginPath();
  ctx.arc(0, -112, 9, 0, Math.PI * 2);
  ctx.fill();

  // Floppy ears
  ctx.fillStyle = spotted ? "#6b3e2e" : "#f8dbe3";
  ctx.beginPath();
  ctx.ellipse(-52, -12, 18, 30, 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(52, -12, 18, 30, -0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Fluffy head
  ctx.fillStyle = "#fffaf8";
  ctx.beginPath();
  ctx.ellipse(0, 0, 48, 38, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (spotted) {
    ctx.fillStyle = "#6b3e2e";
    for (const [sx, sy, sr] of [
      [-24, -14, 7],
      [-32, 4, 5],
      [25, -8, 6],
    ]) {
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Eyes, blush, nose
  ctx.fillStyle = "#1f1715";
  ctx.beginPath();
  ctx.arc(-16, -4, 4, 0, Math.PI * 2);
  ctx.arc(16, -4, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f9a8d4";
  ctx.beginPath();
  ctx.ellipse(0, 8, 7, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Front paws resting on cake rim
  ctx.fillStyle = "#fffaf8";
  ctx.beginPath();
  ctx.ellipse(-28, 36, 16, 11, 0, 0, Math.PI * 2);
  ctx.ellipse(28, 36, 16, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawSinhNhat2(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#a4dce6";
  ctx.fillRect(0, 0, 1000, 1000);

  // Two cute puppies peeking over cake top
  drawPartyPuppy(ctx, 250, 325, true, "#f6c945");
  drawPartyPuppy(ctx, 755, 315, false, "#6ca875");

  // 3 striped birthday candles
  for (const [cx, topY] of [
    [405, 240],
    [500, 215],
    [595, 250],
  ]) {
    ctx.fillStyle = "#e76f8e";
    ctx.fillRect(cx - 12, topY, 24, 130);
    ctx.fillStyle = "#6bc4b5";
    ctx.fillRect(cx - 12, topY + 25, 24, 16);
    ctx.fillRect(cx - 12, topY + 65, 24, 16);
    // Flame
    ctx.fillStyle = "#fde047";
    ctx.beginPath();
    ctx.ellipse(cx, topY - 18, 11, 20, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Pink scalloped strawberry cake
  ctx.save();
  ctx.fillStyle = "#f797b7";
  ctx.strokeStyle = "#6e4e4a";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(175, 355, 650, 395, 64);
  ctx.fill();
  ctx.stroke();

  // Buttercream frosting wave across cake
  ctx.fillStyle = "#fff2f6";
  ctx.beginPath();
  ctx.moveTo(175, 425);
  for (let x = 210; x <= 790; x += 65) {
    ctx.quadraticCurveTo(x - 16, 465, x + 32, 425);
  }
  ctx.lineTo(825, 390);
  ctx.lineTo(175, 390);
  ctx.closePath();
  ctx.fill();

  // Rainbow sprinkles & stars
  const sprinkleStars: Array<[number, number, string]> = [
    [290, 455, "#fde047"],
    [350, 415, "#f43f5e"],
    [665, 445, "#38bdf8"],
    [715, 480, "#fb7185"],
  ];
  for (const [sx, sy, col] of sprinkleStars) {
    drawFivePointStar(ctx, sx, sy, 12, 6, col);
  }

  // Cute brown dachshund curled along cake base
  ctx.fillStyle = "#c95b31";
  ctx.strokeStyle = "#5c2b18";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(155, 680);
  ctx.quadraticCurveTo(500, 770, 845, 680);
  ctx.quadraticCurveTo(885, 760, 815, 815);
  ctx.quadraticCurveTo(500, 875, 185, 800);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Dachshund head with striped hat at bottom-left
  ctx.beginPath();
  ctx.arc(178, 695, 48, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#69c2cf";
  ctx.beginPath();
  ctx.moveTo(155, 652);
  ctx.lineTo(182, 590);
  ctx.lineTo(205, 652);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // "Birthday" cream lettering on dachshund
  ctx.fillStyle = "#fff7ed";
  ctx.font = "italic 700 54px Georgia, 'Times New Roman', serif";
  ctx.textAlign = "center";
  ctx.fillText("Birthday", 520, 805);
  ctx.restore();
}

function drawSocola(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#240b0b";
  ctx.fillRect(0, 0, 1000, 1000);

  ctx.save();
  ctx.translate(500, 540);
  ctx.rotate(0.045);

  // Cute stick feet
  ctx.strokeStyle = "#090404";
  ctx.lineWidth = 10;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-75, 275);
  ctx.lineTo(-92, 325);
  ctx.lineTo(-112, 322);
  ctx.moveTo(65, 275);
  ctx.lineTo(75, 325);
  ctx.lineTo(96, 322);
  ctx.stroke();

  // Cute peace-sign arms
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(dir * 185, 115);
    ctx.quadraticCurveTo(dir * 245, 110, dir * 240, 45);
    ctx.stroke();
    // Peace fingers
    ctx.beginPath();
    ctx.moveTo(dir * 238, 45);
    ctx.lineTo(dir * 226, 20);
    ctx.moveTo(dir * 242, 45);
    ctx.lineTo(dir * 255, 22);
    ctx.stroke();
  }

  // Dark chocolate blocks bar
  ctx.fillStyle = "#5f2310";
  ctx.strokeStyle = "#0d0404";
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.roundRect(-200, -285, 400, 385, 24);
  ctx.fill();
  ctx.stroke();

  // Individual beveled chocolate squares (3 cols x 2 rows)
  for (let col = 0; col < 3; col++) {
    for (let row = 0; row < 2; row++) {
      const bx = -182 + col * 124;
      const by = -265 + row * 124;
      ctx.fillStyle = "#7a3017";
      ctx.beginPath();
      ctx.roundRect(bx, by, 110, 110, 12);
      ctx.fill();
      ctx.strokeStyle = "#3f1407";
      ctx.lineWidth = 5;
      ctx.strokeRect(bx + 10, by + 10, 90, 90);
    }
  }

  // White jagged torn foil line
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(-210, 35);
  ctx.lineTo(-150, 10);
  ctx.lineTo(-95, 45);
  ctx.lineTo(-30, 15);
  ctx.lineTo(35, 50);
  ctx.lineTo(100, 18);
  ctx.lineTo(155, 48);
  ctx.lineTo(212, 22);
  ctx.lineTo(205, 88);
  ctx.lineTo(-205, 88);
  ctx.closePath();
  ctx.fill();

  // Red wrapper lower body
  ctx.fillStyle = "#ef1d24";
  ctx.strokeStyle = "#0d0404";
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.roundRect(-204, 52, 408, 228, 22);
  ctx.fill();
  ctx.stroke();

  // White sketchy hearts on wrapper
  for (const [hx, hy] of [
    [-148, 120],
    [148, 115],
    [-132, 220],
    [138, 225],
    [-40, 240],
    [55, 238],
  ]) {
    drawSmallHeart(ctx, hx, hy, 22, "rgba(255,255,255,0.45)", false, 0.15);
  }

  // Kawaii smiling eyes & blush
  ctx.strokeStyle = "#0d0404";
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(-56, 152, 22, Math.PI * 1.1, Math.PI * 1.9);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(56, 152, 22, Math.PI * 1.1, Math.PI * 1.9);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 160, 18, 0.2, Math.PI - 0.2);
  ctx.stroke();

  ctx.fillStyle = "#fca5a5";
  ctx.beginPath();
  ctx.ellipse(-66, 184, 22, 13, 0, 0, Math.PI * 2);
  ctx.ellipse(66, 184, 22, 13, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawSocola2(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#240b0b";
  ctx.fillRect(0, 0, 1000, 1000);

  ctx.save();
  ctx.translate(472, 540);

  // Dark chocolate blocks behind wrapper
  ctx.fillStyle = "#62331b";
  ctx.strokeStyle = "#0e0505";
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.roundRect(-200, -240, 380, 340, 20);
  ctx.fill();
  ctx.stroke();

  for (let col = 0; col < 3; col++) {
    for (let row = 0; row < 2; row++) {
      const bx = -182 + col * 118;
      const by = -222 + row * 112;
      ctx.fillStyle = "#7a4124";
      ctx.beginPath();
      ctx.roundRect(bx, by, 104, 98, 10);
      ctx.fill();
    }
  }

  // Pink polka-dot wrapper (bottom)
  ctx.fillStyle = "#ff9ec2";
  ctx.strokeStyle = "#0e0505";
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(-208, 45);
  ctx.lineTo(188, 110);
  ctx.lineTo(188, 295);
  ctx.lineTo(-208, 295);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // White polka dots on wrapper
  ctx.fillStyle = "#ffffff";
  for (const [dx, dy, r] of [
    [-165, 95, 11],
    [-80, 120, 9],
    [135, 145, 12],
    [-175, 220, 10],
    [145, 250, 11],
    [-120, 265, 9],
  ]) {
    ctx.beginPath();
    ctx.arc(dx, dy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Cute glistening anime eyes
  for (const ex of [-65, 45]) {
    ctx.fillStyle = "#180d12";
    ctx.beginPath();
    ctx.ellipse(ex, 195, 32, 38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(ex + 9, 178, 11, 0, Math.PI * 2);
    ctx.arc(ex - 11, 210, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Blush & tiny smile
  ctx.fillStyle = "#f47290";
  ctx.beginPath();
  ctx.ellipse(-118, 232, 26, 13, 0, 0, Math.PI * 2);
  ctx.ellipse(98, 232, 26, 13, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#180d12";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(-10, 224, 16, 0.25, Math.PI - 0.25);
  ctx.stroke();

  ctx.restore();

  // Pink polka-dot bow positioned neatly top-right, clear of QR heart
  ctx.save();
  ctx.translate(658, 295);
  ctx.rotate(0.42);
  ctx.strokeStyle = "#14080a";
  ctx.lineWidth = 8;
  for (const dir of [-1, 1]) {
    ctx.fillStyle = "#ff9bc0";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(dir * 75, -62, dir * 100, -5);
    ctx.quadraticCurveTo(dir * 75, 58, 0, 0);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = "#ff85b3";
  ctx.beginPath();
  ctx.arc(0, 0, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  for (const [px, py] of [
    [-55, -14],
    [-40, 14],
    [55, -14],
    [40, 14],
    [0, -4],
  ]) {
    ctx.beginPath();
    ctx.arc(px, py, 6.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawVuong(
  ctx: CanvasRenderingContext2D,
  preset: QrPreset,
  cardTitle?: string
) {
  // Subtle light slate checkerboard
  const cell = 36;
  for (let row = 0; row * cell < 1000; row++) {
    for (let col = 0; col * cell < 1000; col++) {
      ctx.fillStyle = (row + col) % 2 === 0 ? "#e7ebf0" : "#edf1f5";
      ctx.fillRect(col * cell, row * cell, cell, cell);
    }
  }

  // Four blue square registration markers near corners
  const drawCornerMarker = (mx: number, my: number) => {
    ctx.fillStyle = "#1c82d8";
    ctx.fillRect(mx - 28, my - 28, 56, 56);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(mx - 14, my - 14, 28, 28);
  };
  drawCornerMarker(68, 68);
  drawCornerMarker(932, 68);
  drawCornerMarker(68, 932);
  drawCornerMarker(932, 932);

  // Clean bold slate outer border box around QR quiet zone
  const boxSize = preset.qrSlot.size + (preset.qrSlot.framePadding ?? 22) * 2 + 24;
  ctx.strokeStyle = "#243247";
  ctx.lineWidth = 14;
  ctx.strokeRect(
    preset.qrSlot.x - boxSize / 2,
    preset.qrSlot.y - boxSize / 2,
    boxSize,
    boxSize
  );

  // Card title at bottom margin between blue markers (zero branding)
  const label = (cardTitle || "").trim() || "Thiệp Kỷ Niệm ❤️";
  ctx.save();
  ctx.fillStyle = "#1e293b";
  ctx.font = "700 32px 'Be Vietnam Pro', Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const maxWidth = 760;
  let clipped = label;
  while (ctx.measureText(clipped).width > maxWidth && clipped.length > 6) {
    clipped = `${clipped.slice(0, -4)}...`;
  }
  ctx.fillText(clipped, 500, 932);
  ctx.restore();
}

function drawTrungThu2(ctx: CanvasRenderingContext2D, preset: QrPreset) {
  const sky = ctx.createLinearGradient(0, 0, 0, 1000);
  sky.addColorStop(0, "#120d36");
  sky.addColorStop(0.65, "#1e1b4b");
  sky.addColorStop(1, "#312e81");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 1000, 1000);

  // Full moon halo
  const moonGlow = ctx.createRadialGradient(500, 210, 40, 500, 210, 240);
  moonGlow.addColorStop(0, "rgba(253, 224, 71, 0.95)");
  moonGlow.addColorStop(0.55, "rgba(251, 191, 36, 0.35)");
  moonGlow.addColorStop(1, "rgba(251, 191, 36, 0)");
  ctx.fillStyle = moonGlow;
  ctx.beginPath();
  ctx.arc(500, 210, 240, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fef08a";
  ctx.beginPath();
  ctx.arc(500, 190, 92, 0, Math.PI * 2);
  ctx.fill();

  // Golden border around QR
  const half = preset.qrSlot.size / 2 + 16;
  ctx.strokeStyle = "#fbbf24";
  ctx.lineWidth = 4;
  ctx.strokeRect(
    preset.qrSlot.x - half,
    preset.qrSlot.y - half,
    half * 2,
    half * 2
  );

  // Stars & festive lanterns
  for (const [sx, sy] of [
    [130, 120],
    [870, 130],
    [220, 240],
    [790, 230],
    [160, 820],
    [840, 820],
  ]) {
    drawSparkle(ctx, sx, sy, 14, "#fde047");
  }

  for (const lx of [140, 860]) {
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(lx, 0);
    ctx.lineTo(lx, 95);
    ctx.stroke();

    ctx.fillStyle = "#dc2626";
    ctx.beginPath();
    ctx.ellipse(lx, 140, 34, 44, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.fillStyle = "#fde68a";
  ctx.font = "italic 700 44px Georgia, 'Times New Roman', serif";
  ctx.textAlign = "center";
  ctx.fillText("Trung Thu Đoàn Viên", 500, 910);
}

function drawTrungThu3(ctx: CanvasRenderingContext2D, preset: QrPreset) {
  const bg = ctx.createRadialGradient(500, 500, 80, 500, 500, 680);
  bg.addColorStop(0, "#b91c1c");
  bg.addColorStop(0.65, "#881318");
  bg.addColorStop(1, "#5c090c");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1000, 1000);

  // Concentric ornate gold ring behind center
  ctx.strokeStyle = "rgba(253, 224, 71, 0.35)";
  ctx.lineWidth = 3;
  for (const r of [355, 385, 420]) {
    ctx.beginPath();
    ctx.arc(500, 500, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Ornate gold double frame border
  ctx.strokeStyle = "#fde047";
  ctx.lineWidth = 6;
  ctx.strokeRect(52, 52, 896, 896);
  ctx.lineWidth = 2.5;
  ctx.strokeRect(70, 70, 860, 860);

  // Corner sparkles
  for (const [sx, sy] of [
    [115, 115],
    [885, 115],
    [115, 885],
    [885, 885],
  ]) {
    drawSparkle(ctx, sx, sy, 22, "#fef08a");
  }

  // Gold border around QR slot
  const half = preset.qrSlot.size / 2 + 16;
  ctx.strokeStyle = "#fde047";
  ctx.lineWidth = 5;
  ctx.strokeRect(
    preset.qrSlot.x - half,
    preset.qrSlot.y - half,
    half * 2,
    half * 2
  );
}

function drawPineTree(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = "#5c3d28";
  ctx.fillRect(-5, 18, 10, 14);

  ctx.fillStyle = "#157a34";
  for (const [w, topY, baseY] of [
    [18, -32, -6],
    [24, -18, 8],
    [29, -4, 20],
  ]) {
    ctx.beginPath();
    ctx.moveTo(0, topY);
    ctx.lineTo(-w, baseY);
    ctx.lineTo(w, baseY);
    ctx.closePath();
    ctx.fill();
  }

  // Ornaments & star
  drawFivePointStar(ctx, 0, -35, 8, 4, "#f5c500");
  ctx.fillStyle = "#e11d48";
  for (const [ox, oy] of [
    [-8, 6],
    [9, 12],
    [0, -8],
  ]) {
    ctx.beginPath();
    ctx.arc(ox, oy, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawNoel(ctx: CanvasRenderingContext2D, preset: QrPreset) {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 1000, 1000);

  // Scattered 5-point yellow stars around edges
  for (const [sx, sy, outer] of [
    [62, 62, 18],
    [500, 42, 16],
    [938, 62, 18],
    [52, 500, 16],
    [948, 500, 16],
    [62, 938, 18],
    [500, 955, 16],
    [938, 938, 18],
  ]) {
    drawFivePointStar(ctx, sx, sy, outer, outer * 0.44, "#f5c500");
  }

  // Headline "Merry Christmas"
  ctx.save();
  ctx.fillStyle = "#d3122a";
  ctx.font = "italic 700 66px Georgia, 'Comic Sans MS', serif";
  ctx.textAlign = "center";
  ctx.fillText("Merry Christmas", 500, 126);
  ctx.restore();

  // Double red + gold frame hugging QR box
  const half = preset.qrSlot.size / 2 + (preset.qrSlot.framePadding ?? 16);
  ctx.save();
  ctx.strokeStyle = "#eab308";
  ctx.lineWidth = 8;
  ctx.strokeRect(
    preset.qrSlot.x - half - 4,
    preset.qrSlot.y - half - 4,
    (half + 4) * 2,
    (half + 4) * 2
  );
  ctx.strokeStyle = "#d3122a";
  ctx.lineWidth = 3;
  ctx.strokeRect(
    preset.qrSlot.x - half,
    preset.qrSlot.y - half,
    half * 2,
    half * 2
  );
  ctx.restore();

  // Bottom line: mini trees + "Giáng Sinh An Lành"
  drawPineTree(ctx, 210, 882);
  drawPineTree(ctx, 790, 882);

  ctx.save();
  ctx.fillStyle = "#146c2e";
  ctx.font = "italic 700 44px Georgia, 'Comic Sans MS', serif";
  ctx.textAlign = "center";
  ctx.fillText("Giáng Sinh An Lành", 500, 892);
  ctx.restore();
}

/**
 * Render decorative background frame vector art for each preset.
 */
export function drawPresetBackgroundArtwork(
  ctx: CanvasRenderingContext2D,
  preset: QrPreset,
  cardTitle?: string
) {
  switch (preset.id) {
    case "trai-tim-hoa-hong":
      drawTraiTimHoaHong(ctx);
      return;
    case "trai-tim-20-10":
      drawTraiTim2010(ctx);
      return;
    case "gift-for-you":
      drawGiftForYou(ctx);
      return;
    case "hoa":
      drawHoa(ctx, preset);
      return;
    case "cupid":
      drawCupid(ctx);
      return;
    case "mui-ten":
      drawMuiTen(ctx, preset);
      return;
    case "trai-tim":
      drawTraiTim(ctx);
      return;
    case "trai-tim-khung":
      drawTraiTimKhung(ctx);
      return;
    case "sinh-nhat":
      drawSinhNhat(ctx);
      return;
    case "sinh-nhat-2":
      drawSinhNhat2(ctx);
      return;
    case "socola":
      drawSocola(ctx);
      return;
    case "socola-2":
      drawSocola2(ctx);
      return;
    case "vuong":
      drawVuong(ctx, preset, cardTitle);
      return;
    case "trung-thu-2":
      drawTrungThu2(ctx, preset);
      return;
    case "trung-thu-3":
      drawTrungThu3(ctx, preset);
      return;
    case "noel":
      drawNoel(ctx, preset);
      return;
    default:
      ctx.fillStyle = preset.bgColor;
      ctx.fillRect(0, 0, preset.canvasWidth, preset.canvasHeight);
  }
}

/**
 * Draw safe center icon badge overlays (Cupid, Santa) over Level "H" QR codes.
 * Radius is kept within <=11.5% of QR slot size so high error-correction decodes reliably.
 */
export function drawPresetForegroundOverlay(
  ctx: CanvasRenderingContext2D,
  preset: QrPreset
) {
  const { x, y, size } = preset.qrSlot;

  if (preset.id === "cupid") {
    const r = Math.min(size * 0.115, 72);
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Crimson Cupid silhouette drawing bow
    const s = r / 68;
    ctx.scale(s, s);
    ctx.fillStyle = preset.defaultModuleColor || "#dc143c";
    ctx.strokeStyle = preset.defaultModuleColor || "#dc143c";
    ctx.lineCap = "round";

    // Angel wings
    ctx.beginPath();
    ctx.ellipse(-26, -12, 18, 10, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-22, 4, 14, 7, -0.25, 0, Math.PI * 2);
    ctx.fill();

    // Head & curls
    ctx.beginPath();
    ctx.arc(-4, -20, 12, 0, Math.PI * 2);
    ctx.fill();

    // Torso & legs flying diagonally
    ctx.beginPath();
    ctx.ellipse(-6, 4, 10, 18, -0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(-12, 18);
    ctx.lineTo(-28, 34);
    ctx.moveTo(-4, 16);
    ctx.lineTo(-8, 38);
    // Outstretched arms holding bow
    ctx.moveTo(-4, -6);
    ctx.lineTo(20, -10);
    ctx.stroke();

    // Bow curve & arrow
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(14, -8, 22, -Math.PI * 0.42, Math.PI * 0.42);
    ctx.stroke();

    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-10, -10);
    ctx.lineTo(38, -8);
    ctx.stroke();
    // Arrow head
    ctx.beginPath();
    ctx.moveTo(42, -8);
    ctx.lineTo(32, -13);
    ctx.lineTo(32, -3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    return;
  }

  if (preset.id === "noel") {
    const r = Math.min(size * 0.112, 66);
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#eab308";
    ctx.lineWidth = 4;
    ctx.stroke();

    // Cute mini Santa illustration inside badge
    const s = r / 60;
    ctx.scale(s, s);
    // Coat & Hat
    ctx.fillStyle = "#d3122a";
    ctx.beginPath();
    ctx.roundRect(-20, 4, 40, 28, 12);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-16, -16);
    ctx.lineTo(4, -38);
    ctx.lineTo(18, -16);
    ctx.closePath();
    ctx.fill();

    // Face & beard
    ctx.fillStyle = "#fed7aa";
    ctx.beginPath();
    ctx.arc(0, -12, 11, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(0, -1, 14, 0, Math.PI);
    ctx.fill();
    ctx.fillRect(-16, -18, 32, 6);
    ctx.beginPath();
    ctx.arc(6, -39, 5, 0, Math.PI * 2);
    ctx.fill();

    // Belt & buckle
    ctx.fillStyle = "#18181b";
    ctx.fillRect(-20, 18, 40, 6);
    ctx.fillStyle = "#facc15";
    ctx.fillRect(-5, 17, 10, 8);
    ctx.restore();
  }
}
