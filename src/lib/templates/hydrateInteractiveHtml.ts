import type { InvitationContent } from "./schema";

export const INTERACTIVE_TEMPLATE_URLS: Record<string, string> = {
  "thiep-3": "/templates/thiep-3.html",
  "thiep-4": "/templates/thiep-4.html",
  "thiep-5": "/templates/thiep-5.html",
  "thiep-6": "/templates/thiep-6.html",
  "thiep-7": "/templates/thiep-7.html",
  "thiep-8": "/templates/thiep-8.html",
  "thiep-9": "/templates/thiep-9.html",
  "thiep-10": "/templates/thiep-10.html",
  "thiep-giang-sinh": "/templates/thiep-giang-sinh.html",
  "thiep-xmas": "/templates/thiep-xmas.html",
};

export interface HydrateInteractiveOptions {
  invitationSlug?: string;
  isPreview?: boolean;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeScriptJson(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function extractNames(content: InvitationContent): {
  senderName: string;
  recipientName: string;
} {
  const people = Array.isArray(content.people) ? content.people : [];
  const senderPerson =
    people.find((p) =>
      ["sender", "groom", "celebrant"].includes((p.role || "").toLowerCase())
    ) || people[0];
  const recipientPerson =
    people.find((p) =>
      ["recipient", "bride", "guest"].includes((p.role || "").toLowerCase())
    ) || (people.length > 1 ? people[1] : undefined);

  const senderName = (senderPerson?.displayName || "").trim() || "Anh";
  const recipientName = (recipientPerson?.displayName || "").trim() || "Em";
  return { senderName, recipientName };
}

function extractPhotos(content: InvitationContent): string[] {
  const urls: string[] = [];
  const pushUnique = (u?: string) => {
    const clean = (u || "").trim();
    if (clean && !urls.includes(clean)) {
      urls.push(clean);
    }
  };
  pushUnique(content.coverImageUrl);
  if (Array.isArray(content.galleryUrls)) {
    for (const g of content.galleryUrls) {
      pushUnique(g);
    }
  }
  return urls;
}

function padWishes(list: string[], fallback: string[]): string[] {
  const clean = list.map((s) => s.trim()).filter(Boolean);
  if (clean.length === 0) return fallback;
  const out = [...clean];
  let idx = 0;
  while (out.length < 5) {
    out.push(clean[idx % clean.length]);
    idx++;
  }
  return out.slice(0, 8);
}

function replaceObjectLiteral(
  html: string,
  declarationPattern: RegExp,
  replacementPrefix: string,
  obj: unknown
): string {
  return html.replace(declarationPattern, () => `${replacementPrefix}${safeScriptJson(obj)};`);
}

function buildMusicSnippet(musicUrl: string): string {
  const escapedUrl = escapeHtml(musicUrl);
  return `
<style id="__card-bgm-style">
  #__card-music-btn {
    position: fixed;
    top: 14px;
    right: 14px;
    z-index: 99999;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    height: 36px;
    padding: 0 13px;
    border-radius: 9999px;
    border: 1px solid rgba(255,255,255,0.45);
    background: rgba(15, 23, 42, 0.72);
    color: #fff;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    box-shadow: 0 6px 18px rgba(0,0,0,0.28);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s ease, background 0.2s ease;
  }
  #__card-music-btn:hover { transform: scale(1.04); }
  #__card-music-btn.playing .__disc {
    display: inline-block;
    animation: __cardSpin 3.5s linear infinite;
  }
  @keyframes __cardSpin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>
<audio id="__card-bgm-audio" src="${escapedUrl}" loop preload="auto" playsinline></audio>
<button id="__card-music-btn" type="button" aria-label="Bật hoặc tắt nhạc nền">
  <span class="__disc">🎵</span>
  <span class="__label">Chạm mở nhạc</span>
</button>
<script>
(function(){
  var audio = document.getElementById('__card-bgm-audio');
  var btn = document.getElementById('__card-music-btn');
  if (!audio || !btn) return;
  var labelEl = btn.querySelector('.__label');
  var started = false;

  function syncUi(isPlaying) {
    if (isPlaying) {
      btn.classList.add('playing');
      if (labelEl) labelEl.textContent = 'Đang phát nhạc';
    } else {
      btn.classList.remove('playing');
      if (labelEl) labelEl.textContent = 'Bật nhạc';
    }
  }

  function tryPlay() {
    var p = audio.play();
    if (p && typeof p.then === 'function') {
      p.then(function(){
        started = true;
        syncUi(true);
      }).catch(function(){
        syncUi(false);
      });
    }
  }

  btn.addEventListener('click', function(e){
    e.stopPropagation();
    if (audio.paused) {
      tryPlay();
    } else {
      audio.pause();
      syncUi(false);
    }
  });

  function unlockOnGesture() {
    if (started && !audio.paused) return;
    tryPlay();
  }

  ['pointerdown', 'touchstart', 'click', 'keydown'].forEach(function(evt){
    document.addEventListener(evt, unlockOnGesture, { once: true, passive: true });
  });

  tryPlay();
})();
</script>`;
}

/**
 * Injects the user's personalized invitation data, photos, PIN, wishes,
 * and background music directly into an interactive HTML template without
 * showing any platform branding, ads, or editor controls.
 */
export function hydrateInteractiveHtml(
  rawHtml: string,
  templateSlug: string,
  content: InvitationContent,
  options?: HydrateInteractiveOptions
): string {
  let html = rawHtml;
  const { senderName, recipientName } = extractNames(content);
  const title = (content.title || "Thiệp kỷ niệm").trim();
  const subtitle = (content.subtitle || "").trim();
  const message = (content.message || "").trim();
  const wishes = Array.isArray(content.loveMessages) ? content.loveMessages : [];
  const photos = extractPhotos(content);
  const coverPhoto = photos[0] || "";
  const musicUrl = (content.features?.backgroundMusicUrl || "").trim();
  const storageSuffix = (options?.invitationSlug || templateSlug || "card").replace(/[^a-zA-Z0-9_-]/g, "");

  // Update <title> cleanly without platform branding
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);

  // Strip any editor/backlinks (thiep-5 & thiep-6) and guarantee hidden chrome
  html = html.replace(/<a[^>]*class="nav-back-list"[^>]*>[\s\S]*?<\/a>/gi, "");
  const headInjection = `<style id="__card-clean-css">.nav-back-list,#btn-edit-trigger,#owner-editor{display:none!important;}</style>`;
  if (html.includes("</head>")) {
    html = html.replace("</head>", `${headInjection}\n</head>`);
  }

  if (templateSlug === "thiep-3") {
    const defaultIntro = [
      `Từ ${senderName}...`,
      `gửi riêng cho ${recipientName}`,
      subtitle || "một điều nhỏ xinh ♡",
    ];
    const introLines = wishes.length >= 2 ? wishes.slice(0, 3) : defaultIntro;
    const thiep3Config = {
      senderName,
      recipientName,
      introLines,
      invitationTitle: title,
      reasonTitle: subtitle || `Điều ${senderName} muốn gửi ${recipientName}...`,
      reasonText:
        message ||
        `Cảm ơn ${recipientName} đã xuất hiện và mang đến thật nhiều niềm vui ngọt ngào ❤️`,
      closingText:
        wishes[0] ||
        `Vậy là hẹn nhau rồi nha ${recipientName}! ${senderName} sẽ chuẩn bị mọi thứ thật chu đáo.`,
      couplePhoto: coverPhoto,
      cameraImage: "",
      footerText: subtitle || `Dành riêng cho ${recipientName} ♡`,
      showFooter: true,
      enablePlayfulButton: true,
      invitationUrl: "",
      storageKey: `card-date-${storageSuffix}`,
    };
    html = replaceObjectLiteral(
      html,
      /const\s+CONFIG\s*=\s*\{[\s\S]*?\};/,
      "const CONFIG = ",
      thiep3Config
    );
  } else if (templateSlug === "thiep-4") {
    const paragraphs = message
      ? message
          .split(/\n+/)
          .map((p) => p.trim())
          .filter(Boolean)
      : [`Gửi ${recipientName},`, `Cảm ơn ${recipientName} đã luôn đồng hành cùng ${senderName}.`];
    const starMessages = padWishes(wishes, [
      `Vì nụ cười của ${recipientName} luôn làm mỗi ngày thêm rạng rỡ.`,
      `Vì ${senderName} luôn trân trọng từng khoảnh khắc bên ${recipientName}.`,
      `Vì ở bên ${recipientName}, mọi điều bình dị đều trở nên đặc biệt.`,
      `Vì những ngày tháng sắp tới luôn có ${recipientName} trong tim.`,
      `Vì giữa muôn vạn lựa chọn, trái tim vẫn luôn chọn ${recipientName}.`,
    ]);
    const thiep4Config = {
      senderName,
      recipientName,
      openingEyebrow: (subtitle || `MỘT TÍN HIỆU DÀNH RIÊNG CHO ${recipientName}`).toUpperCase(),
      openingTitle: title,
      questionTitle:
        content.responseQuestion?.question || `Cho ${senderName} ở trong thế giới của ${recipientName} nhé?`,
      yesLabel: content.responseQuestion?.options?.[0] || "Đồng ý, lưu giữ khoảnh khắc ❤️",
      starMessages: starMessages.slice(0, 5),
      letterParagraphs: paragraphs,
      signature: `— Từ ${senderName}, gửi ${recipientName} 🤍`,
      finalLine:
        wishes[wishes.length - 1] ||
        `Vị trí của ${recipientName} trong trái tim ${senderName} luôn trọn vẹn và duy nhất.`,
      optionalPhotoDataUrl: coverPhoto,
      shareBaseUrl: "",
      storageKey: `card-universe-${storageSuffix}`,
    };
    html = replaceObjectLiteral(
      html,
      /const\s+CONFIG\s*=\s*\{[\s\S]*?\};/,
      "const CONFIG = ",
      thiep4Config
    );
  } else if (templateSlug === "thiep-5" || templateSlug === "thiep-6") {
    const customPin = (content.features?.cardPin || "").trim() || "0000";
    const thiep5Config = {
      senderName,
      recipientName,
      pin: customPin,
      showPinHint: content.features?.showPinHint ?? customPin === "0000",
      title,
      salutation: `Gửi ${recipientName} ❤️`,
      message:
        message ||
        `Mỗi khoảnh khắc bên ${recipientName} đều thật dịu dàng và đáng trân trọng.`,
      footer: wishes[0] || `Từ ${senderName} gửi trọn yêu thương đến ${recipientName} 🤍`,
      coverRecipient: recipientName.toUpperCase(),
      coverSnippet: subtitle || (message ? message.slice(0, 72) : title),
      mainPhoto: coverPhoto,
      memoryPhotos: [
        photos[1] || photos[0] || "",
        photos[2] || photos[0] || "",
        photos[3] || photos[1] || photos[0] || "",
      ],
      loadingMs: 900,
      flowerShowerMs: 20000,
      typeMs: 55,
      enableSound: false,
      seed: templateSlug === "thiep-6" ? 428912 : 314159,
    };
    html = replaceObjectLiteral(
      html,
      /const\s+CARD_CONFIG\s*=\s*\{[\s\S]*?\};/,
      "const CARD_CONFIG = ",
      thiep5Config
    );
  } else if (templateSlug === "thiep-8") {
    const orbitMessages = padWishes(wishes, [
      `Cảm ơn ${recipientName} đã đến bên ${senderName} ✨`,
      `${recipientName} là điều kỳ diệu nhất 💖`,
      `Thương ${recipientName} nhiều hơn mỗi ngày 🌸`,
      `Nắm tay nhau qua ngàn mùa nhớ 💫`,
      `Bình yên là khi có ${recipientName} bên cạnh 🤍`,
    ]).slice(0, 6);

    const payload = {
      senderName,
      recipientName,
      coverEyebrow: (subtitle || `GỬI ${recipientName}`).toUpperCase(),
      coverTitle: title,
      message:
        message ||
        `💖 Gửi ${recipientName},\nCảm ơn ${recipientName} đã mang theo nụ cười và sự ấm áp đến bên ${senderName}.`,
      orbitMessages,
      photos:
        photos.length > 0
          ? photos.map((src, i) => ({
              src,
              alt: `${title} - ${i + 1}`,
              objectPosition: "center center",
            }))
          : null,
      disableSynthAudio: Boolean(musicUrl),
    };

    const patchScript = `
<script>
(function(){
  var p = ${safeScriptJson(payload)};
  if (typeof window.THIEP_8_CONFIG === 'object' && window.THIEP_8_CONFIG) {
    window.THIEP_8_CONFIG.senderName = p.senderName;
    window.THIEP_8_CONFIG.recipientName = p.recipientName;
    window.THIEP_8_CONFIG.coverEyebrow = p.coverEyebrow;
    window.THIEP_8_CONFIG.coverTitle = p.coverTitle;
    window.THIEP_8_CONFIG.message = p.message;
    window.THIEP_8_CONFIG.orbitMessages = p.orbitMessages;
    if (p.photos && p.photos.length) {
      window.THIEP_8_CONFIG.photos = p.photos;
      window.THIEP_8_CONFIG.primaryPhotoIndex = 0;
    }
    if (p.disableSynthAudio && window.THIEP_8_CONFIG.audio) {
      window.THIEP_8_CONFIG.audio.enabled = false;
    }
  }
})();
</script>`;
    html = html.replace(/window\.THIEP_8_CONFIG\s*=\s*THIEP_8_CONFIG;/, (m) => `${m}\n${patchScript.replace(/<\/?script>/g, "")}`);
  } else if (templateSlug === "thiep-9") {
    const orbitMessages = padWishes(wishes, [
      `Ánh cực quang đẹp nhất là nụ cười của ${recipientName} ✨`,
      `Ấm áp nhất là khi có ${recipientName} bên cạnh 🤍`,
      `Trái tim ${senderName} luôn hướng về ${recipientName} 💖`,
      `Cùng nhau đi qua muôn ngàn mùa yêu thương ❄️`,
      `Gửi trọn bình yên đến ${recipientName} 🌌`,
    ]).slice(0, 6);
    const thiep9Config = {
      senderName,
      recipientName,
      message: message || `Gửi ${recipientName},\nMong mọi điều tốt đẹp nhất sẽ luôn ở bên ${recipientName}. ✨`,
      orbitMessages,
    };
    html = replaceObjectLiteral(
      html,
      /const\s+CONFIG\s*=\s*\{[\s\S]*?\};/,
      "const CONFIG = ",
      thiep9Config
    );
  } else if (templateSlug === "thiep-10") {
    const thiep10Config = {
      senderName,
      recipientName,
      flightCode: (content.event?.venueName || "LV-520").slice(0, 14),
      seat: (subtitle || "01A (VIP)").slice(0, 26),
      defaultNote:
        message ||
        `Chuyến bay dành riêng cho ${recipientName} sẵn sàng cất cánh cùng ${senderName} ❤️`,
    };
    html = replaceObjectLiteral(
      html,
      /const\s+CONFIG\s*=\s*\{[\s\S]*?\};/,
      "const CONFIG = ",
      thiep10Config
    );
  }

  // Runtime DOM personalizer for thiep-7, thiep-9, thiep-10, thiep-giang-sinh, thiep-xmas + photo strip helper
  const domPayload = {
    templateSlug,
    senderName,
    recipientName,
    title,
    subtitle,
    message,
    wishes: wishes.map((w) => w.trim()).filter(Boolean),
    photos,
    question: content.responseQuestion?.question || "",
    yesOption: content.responseQuestion?.options?.[0] || "",
  };

  const domHydrationScript = `
<script>
(function(){
  var d = ${safeScriptJson(domPayload)};

  function appendPhotoAlbum(targetEl) {
    if (!targetEl || !d.photos || !d.photos.length) return;
    if (targetEl.querySelector('.__card-photo-strip')) return;
    var wrap = document.createElement('div');
    wrap.className = '__card-photo-strip';
    wrap.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(105px,1fr));gap:10px;margin:16px 0;';
    d.photos.slice(0, 6).forEach(function(src){
      var box = document.createElement('div');
      box.style.cssText = 'border-radius:12px;overflow:hidden;border:2px solid rgba(255,255,255,0.45);box-shadow:0 6px 16px rgba(0,0,0,0.22);aspect-ratio:4/5;background:rgba(0,0,0,0.18);';
      var img = document.createElement('img');
      img.src = src;
      img.alt = d.title || 'Ảnh kỷ niệm';
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
      box.appendChild(img);
      wrap.appendChild(box);
    });
    var sign = targetEl.querySelector('.scroll-signature,.letter-signature,.letter-sign,.card-footer');
    if (sign && sign.parentNode === targetEl) {
      targetEl.insertBefore(wrap, sign);
    } else {
      targetEl.appendChild(wrap);
    }
  }

  function applyDomHydration() {
    if (d.templateSlug === 'thiep-3' && d.photos.length > 1) {
      var letterCard3 = document.querySelector('.letter-card,.reason-card');
      if (letterCard3) appendPhotoAlbum(letterCard3);
    }

    if (d.templateSlug === 'thiep-7') {
      var s0Title = document.querySelector('#scene-0 .title-serif');
      var s0Sub = document.querySelector('#scene-0 .subtitle');
      if (s0Title) s0Title.textContent = d.title;
      if (s0Sub) s0Sub.textContent = d.subtitle || ('Chạm vào viên ngọc phát sáng để mở điều ' + d.senderName + ' gửi ' + d.recipientName + ' 🌊');

      var s1Title = document.querySelector('#scene-1 .title-serif');
      if (s1Title && d.question) s1Title.textContent = d.question;
      var agreeBtn = document.querySelector('#btn-agree span, #btn-agree');
      if (agreeBtn && d.yesOption) agreeBtn.textContent = d.yesOption;

      if (typeof WHISPERS !== 'undefined' && Array.isArray(WHISPERS) && d.wishes.length) {
        for (var i = 0; i < WHISPERS.length; i++) {
          WHISPERS[i] = d.wishes[i % d.wishes.length];
        }
      }

      var scrollLetter = document.querySelector('.scroll-letter');
      if (scrollLetter) {
        var h3 = scrollLetter.querySelector('h3');
        if (h3) h3.textContent = 'Gửi ' + d.recipientName + ',';
        scrollLetter.querySelectorAll('p').forEach(function(el){ el.remove(); });
        var paras = (d.message || '').split(/\\n+/).map(function(s){ return s.trim(); }).filter(Boolean);
        var anchor = scrollLetter.querySelector('.scroll-signature');
        paras.forEach(function(text){
          var p = document.createElement('p');
          p.textContent = text;
          scrollLetter.insertBefore(p, anchor);
        });
        if (anchor) anchor.textContent = '— Từ ' + d.senderName + ', gửi ' + d.recipientName + ' 🌊🤍';
        appendPhotoAlbum(scrollLetter);
      }

      var s5Title = document.querySelector('#scene-5 .title-serif');
      if (s5Title) s5Title.textContent = d.title;
    }

    if (d.templateSlug === 'thiep-9') {
      var lt = document.querySelector('.letter-title');
      if (lt) lt.textContent = d.title;
      var ls = document.querySelector('.letter-signature');
      if (ls) ls.textContent = '— Từ ' + d.senderName + ', gửi ' + d.recipientName + ' 🤍';
      var card9 = document.querySelector('.letter-card, #letter-card');
      if (card9) appendPhotoAlbum(card9);
    }

    if (d.templateSlug === 'thiep-10') {
      var pt = document.querySelector('#stage-invite .panel-title');
      if (pt) pt.textContent = d.title;
      var rc = document.querySelector('.route-code');
      if (rc) rc.textContent = (d.senderName + ' ♡ ' + d.recipientName).toUpperCase();
      var passCard = document.querySelector('#stage-pass .boarding-pass, #stage-pass .pass-card, #stage-pass');
      if (passCard) appendPhotoAlbum(passCard);
    }

    if (d.templateSlug === 'thiep-giang-sinh' || d.templateSlug === 'thiep-xmas') {
      var xt = document.querySelector('.title-xmas');
      var xs = document.querySelector('.sub-xmas');
      var lh = document.querySelector('.letter-heading');
      var lm = document.getElementById('letter-msg-content');
      var lsign = document.querySelector('.letter-sign');
      if (xt) xt.textContent = d.title;
      if (xs) xs.textContent = d.subtitle || ('Có một món quà từ ' + d.senderName + ' đang đợi ' + d.recipientName + ' mở ra...');
      if (lh) lh.textContent = 'Gửi ' + d.recipientName + ', mùa đông ấm áp ❤️';
      if (lm && d.message) {
        lm.innerHTML = '';
        d.message.split(/\\n+/).forEach(function(line, idx){
          if (idx > 0) lm.appendChild(document.createElement('br'));
          if (idx > 0) lm.appendChild(document.createElement('br'));
          lm.appendChild(document.createTextNode(line));
        });
      }
      if (lsign) lsign.textContent = '— Từ ' + d.senderName + ' 🎅🤍';
      if (d.wishes.length) {
        var grid = document.getElementById('wishes-grid');
        if (grid) {
          var existingPills = Array.prototype.slice.call(grid.querySelectorAll('.wish-pill'));
          d.wishes.slice(0, Math.max(existingPills.length, 4)).forEach(function(w, idx){
            var pill = existingPills[idx];
            if (pill) {
              pill.setAttribute('data-wish', w);
              pill.textContent = '✨ ' + w;
            }
          });
        }
      }
      var borderDecor = document.querySelector('.letter-border-decor');
      if (borderDecor) appendPhotoAlbum(borderDecor);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyDomHydration);
  } else {
    applyDomHydration();
  }
})();
</script>`;

  const musicSnippet = musicUrl ? buildMusicSnippet(musicUrl) : "";
  const footerInjection = `${domHydrationScript}\n${musicSnippet}\n</body>`;

  if (html.includes("</body>")) {
    html = html.replace("</body>", footerInjection);
  } else {
    html += footerInjection;
  }

  return html;
}
