import sharp from "sharp";
import { PDFDocument } from "pdf-lib";
import prisma from "@/lib/prisma";
import { getStorage } from "@/lib/storage";
import { generateQrPng } from "@/lib/qr";
import { InvitationContent } from "@/lib/templates/schema";

export type ExportFormat = "PNG" | "JPG" | "PDF";
export type ExportSizePreset = "POSTER_4_5" | "STORY_9_16" | "A4" | "A5";

export interface RenderExportParams {
  title: string;
  occasionName?: string;
  content: InvitationContent;
  shortUrl: string;
  format: ExportFormat;
  sizePreset: ExportSizePreset;
}

function escapeXml(unsafe: string): string {
  return (unsafe || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Generate a poster SVG with typography and layout.
 */
function createPosterSvg(params: {
  width: number;
  height: number;
  title: string;
  occasionName?: string;
  celebrantNames?: string;
  dateStr?: string;
  venueStr?: string;
  messageStr?: string;
  shortUrl: string;
  qrSize: number;
  qrTop: number;
  qrLeft: number;
}): string {
  const {
    width,
    height,
    title,
    occasionName,
    celebrantNames,
    dateStr,
    venueStr,
    messageStr,
    shortUrl,
    qrSize,
    qrTop,
    qrLeft,
  } = params;

  const safeTitle = escapeXml(title || "THIỆP MỜI TRỌNG THỂ");
  const safeOccasion = escapeXml(occasionName || "DING DONG GIFT INVITATION");
  const safeCelebrants = escapeXml(celebrantNames || "");
  const safeDate = escapeXml(dateStr || "");
  const safeVenue = escapeXml(venueStr || "");
  const safeMessage = escapeXml(messageStr || "Rất hân hạnh được đón tiếp quý khách!");
  const safeShortUrl = escapeXml(shortUrl);

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#FCF9F5"/>
        <stop offset="100%" stop-color="#F4ECE1"/>
      </linearGradient>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#000000" flood-opacity="0.08"/>
      </filter>
    </defs>

    <!-- Background -->
    <rect width="${width}" height="${height}" fill="url(#bgGrad)" />

    <!-- Outer Border -->
    <rect x="40" y="40" width="${width - 80}" height="${height - 80}" fill="none" stroke="#D4AF37" stroke-width="2" rx="16" opacity="0.6"/>
    <rect x="52" y="52" width="${width - 104}" height="${height - 104}" fill="none" stroke="#D4AF37" stroke-width="1" rx="10" stroke-dasharray="6,4" opacity="0.4"/>

    <!-- Header / Occasion Tag -->
    <text x="${width / 2}" y="120" font-family="'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="600" fill="#B45309" letter-spacing="4" text-anchor="middle">
      ${safeOccasion.toUpperCase()}
    </text>

    <!-- Main Title -->
    <text x="${width / 2}" y="200" font-family="'Segoe UI', Roboto, Georgia, serif" font-size="44" font-weight="700" fill="#1E293B" text-anchor="middle">
      ${safeTitle}
    </text>

    <!-- Celebrants / Subtitle -->
    ${
      safeCelebrants
        ? `<text x="${width / 2}" y="270" font-family="'Segoe UI', Roboto, Georgia, serif" font-size="34" font-weight="600" fill="#B45309" font-style="italic" text-anchor="middle">
            ${safeCelebrants}
          </text>`
        : ""
    }

    <!-- Divider ornament -->
    <path d="M ${width / 2 - 120} 320 Q ${width / 2} 310 ${width / 2 + 120} 320" stroke="#D4AF37" stroke-width="2" fill="none" opacity="0.7"/>
    <circle cx="${width / 2}" cy="315" r="4" fill="#D4AF37"/>

    <!-- Event Info Box -->
    <g transform="translate(${width / 2 - 380}, 360)">
      <rect width="760" height="240" rx="16" fill="#FFFFFF" fill-opacity="0.85" stroke="#E2E8F0" stroke-width="1" filter="url(#shadow)"/>
      
      <!-- Date & Time -->
      <text x="380" y="65" font-family="'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="600" fill="#334155" text-anchor="middle">
        THỜI GIAN &amp; ĐỊA ĐIỂM
      </text>

      <text x="380" y="115" font-family="'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="700" fill="#0F172A" text-anchor="middle">
        ${safeDate || "Xem chi tiết thời gian tại thiệp"}
      </text>

      <text x="380" y="165" font-family="'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="500" fill="#475569" text-anchor="middle">
        ${safeVenue || "Địa điểm sự kiện"}
      </text>

      <text x="380" y="205" font-family="'Segoe UI', Roboto, sans-serif" font-size="16" font-style="italic" fill="#64748B" text-anchor="middle">
        ${safeMessage.substring(0, 80)}${safeMessage.length > 80 ? "..." : ""}
      </text>
    </g>

    <!-- QR Container Card -->
    <rect x="${qrLeft - 20}" y="${qrTop - 20}" width="${qrSize + 40}" height="${qrSize + 110}" rx="20" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" filter="url(#shadow)"/>

    <!-- QR Instructions below QR slot -->
    <text x="${width / 2}" y="${qrTop + qrSize + 30}" font-family="'Segoe UI', Roboto, sans-serif" font-size="17" font-weight="600" fill="#0F172A" text-anchor="middle">
      Quét mã QR để xem thiệp tương tác
    </text>

    <text x="${width / 2}" y="${qrTop + qrSize + 60}" font-family="'Segoe UI', Roboto, monospace" font-size="14" fill="#64748B" text-anchor="middle">
      ${safeShortUrl}
    </text>

    <!-- Footer Tagline -->
    <text x="${width / 2}" y="${height - 70}" font-family="'Segoe UI', Roboto, sans-serif" font-size="15" fill="#94A3B8" letter-spacing="1" text-anchor="middle">
      ĐƯỢC TẠO VỚI DING DONG GIFT • KHOẢNH KHẮC TRỌN VẸN
    </text>
  </svg>`;
}

/**
 * Generate Poster / PDF buffer from invitation details.
 */
export async function renderExportBuffer(params: RenderExportParams): Promise<{ buffer: Buffer; mimeType: string; ext: string }> {
  const { title, occasionName, content, shortUrl, format, sizePreset } = params;

  // Determine dimensions based on preset
  let width = 1080;
  let height = 1350;
  if (sizePreset === "STORY_9_16") {
    height = 1920;
  } else if (sizePreset === "A4") {
    width = 1240;
    height = 1754;
  } else if (sizePreset === "A5") {
    width = 874;
    height = 1240;
  }

  // Layout QR in lower center
  const qrSize = Math.round(width * 0.32);
  const qrLeft = Math.round((width - qrSize) / 2);
  const qrTop = Math.round(height * 0.52);

  // Extract content strings
  const celebrantNames =
    content.people && content.people.length > 0
      ? content.people.map((p) => p.displayName).join(" & ")
      : content.subtitle;
  
  const dateStr = [content.event?.startsAt, content.event?.endsAt].filter(Boolean).join(" - ");
  const venueStr = [content.event?.venueName, content.event?.address].filter(Boolean).join(" - ");
  const messageStr = content.message;

  // 1. Generate QR code image buffer
  const qrPngBuffer = await generateQrPng(shortUrl, {
    width: qrSize,
    margin: 1,
    darkColor: "#1E293B",
  });

  // 2. Build SVG markup
  const svgMarkup = createPosterSvg({
    width,
    height,
    title,
    occasionName,
    celebrantNames,
    dateStr,
    venueStr,
    messageStr,
    shortUrl,
    qrSize,
    qrTop,
    qrLeft,
  });

  // 3. Render base image with Sharp and composite QR code
  const baseImage = sharp(Buffer.from(svgMarkup));
  const composited = baseImage.composite([
    {
      input: qrPngBuffer,
      top: qrTop,
      left: qrLeft,
    },
  ]);

  if (format === "PNG") {
    const pngBuffer = await composited.png().toBuffer();
    return { buffer: pngBuffer, mimeType: "image/png", ext: "png" };
  }

  if (format === "JPG") {
    const jpgBuffer = await composited.jpeg({ quality: 90 }).toBuffer();
    return { buffer: jpgBuffer, mimeType: "image/jpeg", ext: "jpg" };
  }

  if (format === "PDF") {
    // Generate high resolution PNG representation first
    const cardPng = await composited.png().toBuffer();

    // Create vector PDF with pdf-lib
    const pdfDoc = await PDFDocument.create();
    const pageWidth = sizePreset === "A5" ? 419.53 : 595.28;
    const pageHeight = sizePreset === "A5" ? 595.28 : 841.89;
    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    const embeddedPng = await pdfDoc.embedPng(cardPng);

    // Margins around page
    const margin = 20;
    const printableWidth = pageWidth - margin * 2;
    const printableHeight = pageHeight - margin * 2;

    page.drawImage(embeddedPng, {
      x: margin,
      y: margin,
      width: printableWidth,
      height: printableHeight,
    });

    const pdfBytes = await pdfDoc.save();
    return {
      buffer: Buffer.from(pdfBytes),
      mimeType: "application/pdf",
      ext: "pdf",
    };
  }

  throw new Error(`Unsupported format: ${format}`);
}

/**
 * Execute an ExportJob synchronously or background runner.
 */
export async function executeExportJob(jobId: string): Promise<void> {
  const job = await prisma.exportJob.findUnique({
    where: { id: jobId },
    include: {
      invitation: {
        include: {
          occasion: true,
          revisions: {
            orderBy: { versionNumber: "desc" },
            take: 1,
          },
          shareLinks: {
            where: { status: "ACTIVE" },
            take: 1,
          },
        },
      },
    },
  });

  if (!job) {
    throw new Error(`Export job ${jobId} not found`);
  }

  await prisma.exportJob.update({
    where: { id: jobId },
    data: {
      status: "PROCESSING",
      attemptCount: { increment: 1 },
    },
  });

  try {
    const inv = job.invitation;
    const revision = job.revisionId
      ? await prisma.invitationRevision.findUnique({ where: { id: job.revisionId } })
      : inv.revisions[0];

    const content: InvitationContent = revision?.contentJson
      ? JSON.parse(revision.contentJson)
      : {
          schemaVersion: 1,
          occasionKey: inv.occasion.slug,
          locale: "vi-VN",
          title: inv.title,
          people: [],
          galleryUrls: [],
          privacy: { mode: "UNLISTED", allowIndexing: false },
          features: { rsvp: true, guestbook: false },
          blocks: [],
        };

    const host = process.env.APP_DOMAIN || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const shortCode = inv.shareLinks[0]?.shortCode || inv.slug;
    const shortUrl = `${protocol}://${host}/q/${shortCode}`;

    const { buffer, mimeType, ext } = await renderExportBuffer({
      title: inv.title,
      occasionName: inv.occasion?.title,
      content,
      shortUrl,
      format: job.format as ExportFormat,
      sizePreset: job.sizePreset as ExportSizePreset,
    });

    // Save to storage
    const storage = getStorage();
    const fileName = `export-${inv.slug}-${job.format.toLowerCase()}-${Date.now()}.${ext}`;
    const result = await storage.save(buffer, fileName, mimeType);

    await prisma.exportJob.update({
      where: { id: jobId },
      data: {
        status: "SUCCEEDED",
        storageKey: result.storageKey,
      },
    });
  } catch (err: any) {
    console.error("Export job failed:", err);
    await prisma.exportJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        errorCode: err.message || "UNKNOWN_ERROR",
      },
    });
    throw err;
  }
}
