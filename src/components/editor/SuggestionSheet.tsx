"use client";

import { useState } from "react";
import { X, Sparkles, Check, Heart } from "lucide-react";

interface SuggestionSet {
  id: string;
  occasion: string;
  pronoun: string;
  title: string;
  phrases: string[];
}

const OCCASIONS = [
  "Yêu thương",
  "Sinh nhật",
  "Kỷ niệm",
  "Valentine",
  "20/10",
  "8/3",
  "Giáng sinh",
  "Trung thu",
  "Năm mới",
];

const PRONOUNS = ["Anh – Em", "Em – Anh", "Tớ – Cậu", "Tao – Mày"];

const SUGGESTION_SETS: SuggestionSet[] = [
  // Yêu thương (Anh - Em)
  {
    id: "yt_ae_1",
    occasion: "Yêu thương",
    pronoun: "Anh – Em",
    title: "Bộ lời chúc: Yêu thương ngọt ngào",
    phrases: [
      "Em là điều tuyệt vời nhất mà anh từng gặp ❤️",
      "Nụ cười của em sưởi ấm cả một ngày của anh ☀️",
      "Anh nhớ em mỗi phút giây trôi qua ✨",
      "Thương em nhiều hơn ngày hôm qua 🌹",
      "Cảm ơn em vì đã bước vào cuộc đời anh 💫",
    ],
  },
  {
    id: "yt_ae_2",
    occasion: "Yêu thương",
    pronoun: "Anh – Em",
    title: "Bộ lời chúc: Bình yên bên em",
    phrases: [
      "Ở bên em là chốn bình yên nhất trần đời 🌿",
      "Anh thương đôi mắt biết cười của em 💖",
      "Mỗi sáng thức dậy, người đầu tiên anh nghĩ đến là em ✨",
      "Cùng anh đi qua muôn trùng bão giông nhé em 💌",
    ],
  },
  // Yêu thương (Em - Anh)
  {
    id: "yt_ea_1",
    occasion: "Yêu thương",
    pronoun: "Em – Anh",
    title: "Bộ lời chúc: Dành cho chàng trai của em",
    phrases: [
      "Anh là chỗ dựa vững chãi và ấm áp nhất của em ❤️",
      "Yêu anh nhiều hơn những gì em có thể nói ✨",
      "Cảm ơn anh vì luôn kiên nhẫn và chiều chuộng em 🌹",
      "Mong chúng mình mãi nắm chặt tay như hôm nay 💖",
    ],
  },
  // Yêu thương (Tớ - Cậu)
  {
    id: "yt_tc_1",
    occasion: "Yêu thương",
    pronoun: "Tớ – Cậu",
    title: "Bộ lời chúc: Tình yêu thanh xuân",
    phrases: [
      "Tớ thích nụ cười của cậu nhất trần đời ✨",
      "Cậu là ngoại lệ duy nhất trong thế giới của tớ 💫",
      "Mỗi ngày được trò chuyện cùng cậu là một ngày vui 💌",
      "Tớ thương cậu nhiều lắm đó! 💖",
    ],
  },
  // Sinh nhật
  {
    id: "sn_1",
    occasion: "Sinh nhật",
    pronoun: "Anh – Em",
    title: "Bộ lời chúc: Sinh nhật rực rỡ",
    phrases: [
      "Chúc mừng sinh nhật công chúa nhỏ của anh 🎂",
      "Chúc em tuổi mới luôn rạng ngời và hạnh phúc rực rỡ ✨",
      "Mọi ước mơ của em đều sẽ trở thành hiện thực 💖",
      "Anh sẽ luôn đồng hành bên em trong mọi tuổi mới 🌹",
    ],
  },
  // Kỷ niệm
  {
    id: "kn_1",
    occasion: "Kỷ niệm",
    pronoun: "Anh – Em",
    title: "Bộ lời chúc: Ngày kỷ niệm tình yêu",
    phrases: [
      "Chúc mừng ngày hai ta về chung một lối 🌹",
      "Thời gian trôi nhưng tình yêu anh dành cho em vẫn vẹn nguyên 💖",
      "Cảm ơn em đã cùng anh đi qua những năm tháng thanh xuân ✨",
      "Mãi bên nhau đến răng long đầu bạc nhé em! 💍",
    ],
  },
  // Valentine
  {
    id: "val_1",
    occasion: "Valentine",
    pronoun: "Anh – Em",
    title: "Bộ lời chúc: Ngày lễ tình nhân",
    phrases: [
      "Happy Valentine's Day tình yêu của anh! 🌹",
      "Thế giới có 8 tỷ người, nhưng trong mắt anh chỉ có em 💖",
      "Mỗi ngày bên em đều là một ngày Valentine ngọt ngào ✨",
      "Yêu em hôm nay và mãi mãi về sau ❤️",
    ],
  },
  // 20/10 & 8/3
  {
    id: "pn_1",
    occasion: "20/10",
    pronoun: "Anh – Em",
    title: "Bộ lời chúc: Mừng ngày 20/10",
    phrases: [
      "Chúc người phụ nữ tuyệt vời nhất của anh luôn xinh đẹp và hạnh phúc 💐",
      "Cảm ơn em vì đã luôn mang lại niềm vui cho anh 🌹",
      "Anh sẽ luôn yêu thương và trân trọng em mỗi ngày 💖",
      "Chúc em ngày 20/10 ngập tràn nụ cười và hoa tươi ✨",
    ],
  },
];

interface SuggestionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentCount: number;
  onApplyPhrases: (phrases: string[], mode: "replace" | "append") => void;
}

export default function SuggestionSheet({
  isOpen,
  onClose,
  currentCount,
  onApplyPhrases,
}: SuggestionSheetProps) {
  const [selectedOccasion, setSelectedOccasion] = useState<string>("Yêu thương");
  const [selectedPronoun, setSelectedPronoun] = useState<string>("Anh – Em");
  const [pendingSet, setPendingSet] = useState<SuggestionSet | null>(null);

  if (!isOpen) return null;

  // Filter suggestion sets matching active occasion and pronoun (or fallback to occasion)
  let filtered = SUGGESTION_SETS.filter(
    (s) => s.occasion === selectedOccasion && s.pronoun === selectedPronoun
  );
  if (filtered.length === 0) {
    filtered = SUGGESTION_SETS.filter((s) => s.occasion === selectedOccasion);
  }
  if (filtered.length === 0) {
    filtered = SUGGESTION_SETS.slice(0, 2);
  }

  const handleChooseSet = (set: SuggestionSet) => {
    if (currentCount > 0) {
      // Prompt user to choose between replace or append
      setPendingSet(set);
    } else {
      onApplyPhrases(set.phrases, "replace");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[85dvh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-rose-100 text-rose-600">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Gợi ý: Lời yêu thương
              </h3>
              <p className="text-[11px] text-slate-400">
                Chọn bộ lời chúc phù hợp với dịp và cách xưng hô
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* 1. Occasion Chips */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Dịp đặc biệt
            </label>
            <div className="flex flex-wrap gap-1.5">
              {OCCASIONS.map((occ) => (
                <button
                  key={occ}
                  type="button"
                  onClick={() => setSelectedOccasion(occ)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    selectedOccasion === occ
                      ? "bg-rose-600 text-white shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  {occ}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Pronoun Chips */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Xưng hô
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRONOUNS.map((pro) => (
                <button
                  key={pro}
                  type="button"
                  onClick={() => setSelectedPronoun(pro)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    selectedPronoun === pro
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  {pro}
                </button>
              ))}
            </div>
          </div>

          {/* 3. List of Suggestion Sets */}
          <div className="space-y-3 pt-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Danh sách bộ gợi ý ({filtered.length})
            </label>

            {filtered.map((set) => (
              <div
                key={set.id}
                className="p-4 rounded-2xl border border-rose-100 bg-rose-50/40 hover:bg-rose-50/80 transition space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-rose-950 flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" />
                    <span>{set.title}</span>
                  </h4>
                  <span className="text-[10px] text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full font-semibold">
                    {set.phrases.length} câu
                  </span>
                </div>

                <ul className="space-y-1.5 text-xs text-slate-600 pl-2 border-l-2 border-rose-200">
                  {set.phrases.map((phrase, idx) => (
                    <li key={idx} className="line-clamp-1 italic">
                      "{phrase}"
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => handleChooseSet(set)}
                  className="w-full py-2 px-3 rounded-xl bg-white hover:bg-rose-600 hover:text-white border border-rose-300 text-rose-600 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Dùng bộ này</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Confirmation Modal overlay if user already had custom text */}
        {pendingSet && (
          <div className="p-4 bg-slate-900/95 text-white border-t border-slate-700 space-y-3 animate-in fade-in">
            <div className="text-xs">
              <p className="font-bold text-amber-300">
                Bạn đang có sẵn nội dung tự viết!
              </p>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Bạn muốn thay thế toàn bộ hay thêm bộ gợi ý này vào cuối danh sách?
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onApplyPhrases(pendingSet.phrases, "replace");
                  setPendingSet(null);
                  onClose();
                }}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition"
              >
                Thay nội dung hiện tại
              </button>
              <button
                type="button"
                onClick={() => {
                  onApplyPhrases(pendingSet.phrases, "append");
                  setPendingSet(null);
                  onClose();
                }}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-600 transition"
              >
                Thêm vào cuối
              </button>
              <button
                type="button"
                onClick={() => setPendingSet(null)}
                className="py-2 px-3 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs"
              >
                Hủy
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

